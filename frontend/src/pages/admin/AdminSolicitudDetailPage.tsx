import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addDays, setHours, setMinutes, setSeconds, isWeekend, startOfDay, format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { eventoService } from '@/services/eventoService';
import { parseNaiveISO } from '@/utils/dateUtils';

// B2: Rejection Reasons
const RECHAZO_MOTIVOS = [
    'Conflicto de agenda (Superposición de evento)',
    'Capacidad insuficiente',
    'Solicitud fuera de tiempo',
    'Falta de información clave en la solicitud',
    'Prioridad institucional',
    'Mantenimiento / Problema técnico del auditorio',
    'Incumplimiento de políticas de uso',
    'Evento no pertinente al espacio',
    'Otro (Especificar en observaciones)'
];

const TIME_OPTIONS = Array.from({ length: 33 }, (_, i) => {
    const hours = Math.floor(i / 2) + 6; // Starts at 6 AM
    const minutes = i % 2 === 0 ? '00' : '30';
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 && hours !== 12 ? hours - 12 : hours;
    const value = `${hours.toString().padStart(2, '0')}:${minutes}`;
    const label = `${displayHours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    return { value, label };
});

export default function AdminSolicitudDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Modal State
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);

    // Rejection Form State
    const [rejectMotivo, setRejectMotivo] = useState('');
    const [rejectObservacion, setRejectObservacion] = useState('');

    // Cancel State
    const [showCancelModal, setShowCancelModal] = useState(false);

    // Success Feedback State
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Reschedule State
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [suggestedSlots, setSuggestedSlots] = useState<{ date: Date, start: Date, end: Date, jornada: string }[]>([]);
    const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(-1);
    const [rescheduleObservacion, setRescheduleObservacion] = useState('');
    // Custom manual date for admin (libre, sin restricción de 90 días)
    const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const { data: evento, isLoading, error } = useQuery({
        queryKey: ['admin-event', id],
        queryFn: () => eventoService.getById(Number(id)),
        enabled: !!id
    });

    const { data: auditorioEvents = [] } = useQuery({
        queryKey: ['admin-events-calendar', evento?.auditorio_id],
        queryFn: () => eventoService.getEvents({ auditorio_id: evento?.auditorio_id }),
        enabled: !!evento?.auditorio_id
    });

    const mutation = useMutation({
        mutationFn: (data: { status: 'APROBADO' | 'RECHAZADO', obs?: string, motivo_rechazo?: string, nueva_fecha_inicio?: string, nueva_fecha_fin?: string, nueva_jornada?: string }) =>
            eventoService.updateStatus(
                Number(id),
                data.status,
                data.obs,
                data.motivo_rechazo,
                data.nueva_fecha_inicio,
                data.nueva_fecha_fin,
                data.nueva_jornada
            ),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admin-events'] });
            queryClient.invalidateQueries({ queryKey: ['admin-event', id] });
            queryClient.invalidateQueries({ queryKey: ['admin-events-calendar'] }); // Libera el slot en el calendario

            let msg = 'Operación realizada con éxito.';
            if (variables.status === 'APROBADO') {
                if (variables.nueva_fecha_inicio) msg = 'Evento reagendado y aprobado exitosamente. Se ha notificado al usuario del nuevo horario.';
                else msg = 'Solicitud aprobada exitosamente. El auditorio ha sido bloqueado para este evento.';
            } else if (variables.status === 'RECHAZADO') {
                if (variables.nueva_fecha_inicio) msg = 'Solicitud rechazada. Se envió una sugerencia de reagendamiento al usuario.';
                else msg = 'Solicitud rechazada exitosamente. El espacio sigue libre en el calendario.';
            }
            setSuccessMessage(msg);
            setShowSuccessModal(true);
        },
        onError: (err: any) => {
            alert(`Error: ${err.message}`);
        }
    });

    const cancelMutation = useMutation({
        mutationFn: (eventId: number) => eventoService.cancel(eventId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-events'] });
            queryClient.invalidateQueries({ queryKey: ['admin-event', id] });
            queryClient.invalidateQueries({ queryKey: ['admin-events-calendar'] });
            setSuccessMessage('Reserva cancelada exitosamente. El espacio en el calendario ha sido liberado.');
            setShowSuccessModal(true);
        },
        onError: (err: any) => {
            alert(`Error al cancelar: ${err.message}`);
        }
    });

    if (isLoading) return <div className="p-12 text-center text-gray-500">Cargando detalles...</div>;
    if (error || !evento) return <div className="p-12 text-center text-red-600">Error al cargar la solicitud</div>;

    // --- WARNINGS & BLOCKING LOGIC ---
    const eventDate = parseNaiveISO(evento.fecha_inicio);
    const now = new Date(); // In production, consider server time sync
    const isToday = eventDate.toDateString() === now.toDateString();

    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const timeDiff = eventDate.getTime() - now.getTime();
    const isLessThan24h = timeDiff < ONE_DAY_MS && timeDiff > 0;

    // Checks
    const checkCapacity = evento.aforo_estimado > (evento.auditorio_capacidad || 1000); // 1000 fallback if missing
    const checkToday = isToday;
    const checkNotice = isLessThan24h;

    // Classification
    const warnings: string[] = [];
    const blockers: string[] = [];

    if (checkCapacity) warnings.push(`Aforo (${evento.aforo_estimado}) supera capacidad del auditorio.`);
    if (checkToday) warnings.push("El evento es para el día de hoy.");
    if (checkNotice) warnings.push("La solicitud no cumple con las 24 horas de antelación.");
    // Example: Day Closed logic could go here if we had business hours config

    const canApprove = blockers.length === 0 && (evento.estado === 'PENDIENTE' || evento.estado === 'RECHAZADO');

    const handleApprove = () => {
        mutation.mutate({ status: 'APROBADO' });
        setShowApproveModal(false);
    };

    const handleReject = () => {
        if (!rejectMotivo) return;
        mutation.mutate({ status: 'RECHAZADO', obs: rejectObservacion, motivo_rechazo: rejectMotivo });
        setShowRejectModal(false);
    };

    // --- INTELLIGENT RESCHEDULE LOGIC ---
    const isRangeFree = (start: Date, end: Date) => {
        if (!evento) return true;
        return !auditorioEvents.some((e: any) => {
            if (e.id === evento.id) return false; // Ignore self
            const eStart = parseNaiveISO(e.fecha_inicio);
            const eEnd = parseNaiveISO(e.fecha_fin);
            return (eStart < end && eEnd > start) && ['APROBADO', 'PENDIENTE', 'BLOQUEO_TEMPORAL'].includes(e.estado);
        });
    };

    const handleRescheduleClick = () => {
        if (!evento) return;

        // Derive the actual booked window from real timestamps (more reliable than jornada string,
        // especially for holds that may store an incorrect jornada value)
        const eventStart = parseNaiveISO(evento.fecha_inicio);
        const eventEnd = parseNaiveISO(evento.fecha_fin);
        const startHour = eventStart.getHours();   // e.g. 8
        const endHour = eventEnd.getHours();     // e.g. 12

        // Normalise jornada from actual hours to avoid stale DB field issues
        let effectiveJornada: string;
        if (endHour <= 12) effectiveJornada = 'MAÑANA';
        else if (startHour >= 14) effectiveJornada = 'TARDE';
        else effectiveJornada = 'TODO_EL_DIA';

        const suggestions: { date: Date, start: Date, end: Date, jornada: string }[] = [];

        let currentDate = startOfDay(addDays(new Date(), 1));
        let attempts = 0;

        while (suggestions.length < 4 && attempts < 90) {
            if (!isWeekend(currentDate)) {
                const slotStart = setSeconds(setMinutes(setHours(currentDate, startHour), 0), 0);
                const slotEnd = setSeconds(setMinutes(setHours(currentDate, endHour), 0), 0);

                if (isRangeFree(slotStart, slotEnd)) {
                    suggestions.push({ date: currentDate, start: slotStart, end: slotEnd, jornada: effectiveJornada });
                }
            }
            currentDate = addDays(currentDate, 1);
            attempts++;
        }
        setSuggestedSlots(suggestions);
        setCustomDate(eventStart);

        // Round to nearest 30 mins just in case, or let it fall back if it's off-sync
        const startString = format(eventStart, "HH:mm");
        const endString = format(eventEnd, "HH:mm");

        // Only preselect if it matches one of our 30-min intervals
        setCustomStart(TIME_OPTIONS.some(t => t.value === startString) ? startString : '');
        setCustomEnd(TIME_OPTIONS.some(t => t.value === endString) ? endString : '');

        if (evento.estado === 'APROBADO') {
            setRescheduleObservacion('Por motivos de fuerza mayor o prioridad institucional, nos vemos en la necesidad de reagendar su evento para esta nueva fecha y horario.');
        } else {
            setRescheduleObservacion('Lamentablemente no podemos aprobar tu solicitud en este horario. Sin embargo, te sugerimos esta nueva fecha. Si estás de acuerdo, por favor realiza una nueva solicitud para este horario.');
        }
        setShowRescheduleModal(true);
    };

    // Returns the slot to act on: custom date if filled, otherwise auto-suggestion
    const getActiveSlot = (): { start: Date, end: Date, jornada: string } | null => {
        if (customDate && customStart && customEnd) {
            const startHour = parseInt(customStart.split(':')[0]);
            const endHour = parseInt(customEnd.split(':')[0]);
            let jornada = 'TODO_EL_DIA';
            if (endHour <= 12) jornada = 'MAÑANA';
            else if (startHour >= 14) jornada = 'TARDE';
            return {
                start: new Date(`${format(customDate, 'yyyy-MM-dd')}T${customStart}:00`),
                end: new Date(`${format(customDate, 'yyyy-MM-dd')}T${customEnd}:00`),
                jornada,
            };
        }
        if (selectedSlotIndex >= 0 && selectedSlotIndex < suggestedSlots.length) {
            return suggestedSlots[selectedSlotIndex];
        }
        return null;
    };

    const isValidSlot = (): boolean => {
        const slot = getActiveSlot();
        if (!slot) return false;
        if (slot.start < new Date()) return false;
        if (!isRangeFree(slot.start, slot.end)) return false;
        return true;
    };

    const handleConfirmRescheduleReject = () => {
        if (!isValidSlot()) return;
        const slot = getActiveSlot();
        if (!slot) return;
        mutation.mutate({
            status: 'RECHAZADO',
            obs: rescheduleObservacion,
            motivo_rechazo: 'Ocupación de Espacio (Sugerencia de Reagendamiento)',
            nueva_fecha_inicio: format(slot.start, "yyyy-MM-dd'T'HH:mm:ss"),
            nueva_fecha_fin: format(slot.end, "yyyy-MM-dd'T'HH:mm:ss"),
            nueva_jornada: slot.jornada
        });
        setShowRescheduleModal(false);
    };

    const handleConfirmRescheduleApprove = () => {
        if (!isValidSlot()) return;
        const slot = getActiveSlot();
        if (!slot) return;
        mutation.mutate({
            status: 'APROBADO',
            obs: rescheduleObservacion,
            nueva_fecha_inicio: format(slot.start, "yyyy-MM-dd'T'HH:mm:ss"),
            nueva_fecha_fin: format(slot.end, "yyyy-MM-dd'T'HH:mm:ss"),
            nueva_jornada: slot.jornada
        });
        setShowRescheduleModal(false);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in p-6">
            {/* HEADER */}
            <div className="flex justify-between items-start border-b border-gray-200 pb-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl font-bold text-gray-900" tabIndex={-1}>Solicitud #{evento.id}</h1>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium 
                            ${evento.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                                evento.estado === 'APROBADO' ? 'bg-green-100 text-green-800' :
                                    'bg-red-100 text-red-800'}`}>
                            {evento.estado}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500">
                        Solicitado el: {new Date(evento.created_at).toLocaleString()}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/admin/solicitudes')}
                    className="text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    aria-label="Volver a la lista de solicitudes"
                >
                    ← Volver
                </button>
            </div>

            {/* SYSTEM CHECKS PANEL */}
            {(warnings.length > 0 || blockers.length > 0) && evento.estado === 'PENDIENTE' && (
                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 font-medium text-gray-700">
                        Validaciones del Sistema
                    </div>
                    <div className="p-4 space-y-3" aria-live="polite">
                        {blockers.map((msg, i) => (
                            <div key={i} className="flex items-start gap-2 text-red-700 bg-red-50 p-3 rounded-md border border-red-100">
                                <span className="text-xl" aria-hidden="true">🚫</span>
                                <div>
                                    <strong className="block text-sm">Bloqueo de Aprobación</strong>
                                    <span className="text-sm">{msg}</span>
                                </div>
                            </div>
                        ))}
                        {warnings.map((msg, i) => (
                            <div key={i} className="flex items-start gap-2 text-amber-700 bg-amber-50 p-3 rounded-md border border-amber-100">
                                <span className="text-xl" aria-hidden="true">⚠️</span>
                                <div>
                                    <strong className="block text-sm">Advertencia</strong>
                                    <span className="text-sm">{msg}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* DETAILS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LEFT: Event Details */}
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Detalles del Evento</h2>
                    <dl className="space-y-3 text-sm">
                        <div>
                            <dt className="text-gray-500 text-xs uppercase">Título</dt>
                            <dd className="font-medium text-gray-900">{evento.titulo}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-500 text-xs uppercase">Descripción</dt>
                            <dd className="text-gray-900">{evento.descripcion || 'Sin descripción'}</dd>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <dt className="text-gray-500 text-xs uppercase">Fecha</dt>
                                <dd className="font-medium text-gray-900">{evento.fecha_inicio.split('T')[0]}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-500 text-xs uppercase">Jornada</dt>
                                <dd className="font-medium text-gray-900">{evento.jornada}</dd>
                            </div>
                        </div>
                        <div>
                            <dt className="text-gray-500 text-xs uppercase">Espacio</dt>
                            <dd className="font-medium text-gray-900">{evento.auditorio_nombre}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-500 text-xs uppercase">Aforo Estimado</dt>
                            <dd className="font-medium text-gray-900">{evento.aforo_estimado} personas</dd>
                        </div>
                    </dl>
                </div>

                {/* RIGHT: Responsible & Technical */}
                <div className="space-y-6">
                    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Responsable</h2>
                        <dl className="space-y-3 text-sm">
                            <div>
                                <dt className="text-gray-500 text-xs uppercase">Entidad / Dependencia</dt>
                                <dd className="font-medium text-gray-900">{evento.dependencia_nombre}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-500 text-xs uppercase">Solicitante</dt>
                                <dd className="font-medium text-gray-900">{evento.responsable_nombre}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-500 text-xs uppercase">Contacto</dt>
                                <dd className="text-gray-900">{evento.responsable_telefono}</dd>
                                <dd className="text-gray-900">{evento.correo_confirmacion}</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Requerimientos</h2>
                        <ul className="list-disc list-inside text-sm text-gray-700">
                            {evento.requiere_microfono && <li>Micrófono</li>}
                            {evento.requiere_videobeam && <li>Video Beam</li>}
                            {evento.requiere_sonido && <li>Sonido</li>}
                            {evento.requiere_asistencia_tecnica && <li>Asistencia Técnica</li>}
                            {!evento.requiere_microfono && !evento.requiere_videobeam && !evento.requiere_sonido && !evento.requiere_asistencia_tecnica && (
                                <li className="text-gray-500 list-none">Ninguno</li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>

            {/* ACTION FOOTER */}
            {['PENDIENTE', 'BLOQUEO_TEMPORAL', 'RECHAZADO', 'APROBADO'].includes(evento.estado) && (
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 flex-wrap">
                    {evento.estado === 'APROBADO' ? (
                        <>
                            <button
                                onClick={() => setShowCancelModal(true)}
                                className="px-6 py-2 rounded-md font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                                disabled={cancelMutation.isPending || mutation.isPending}
                            >
                                Cancelar Reserva
                            </button>
                            <button
                                onClick={handleRescheduleClick}
                                className="px-6 py-2 rounded-md font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                                disabled={cancelMutation.isPending || mutation.isPending}
                                title="Cambiar la fecha o el horario de este evento por una urgencia."
                            >
                                Reagendar (Urgencia)
                            </button>
                        </>
                    ) : evento.estado === 'BLOQUEO_TEMPORAL' ? (
                        <>
                            <button
                                onClick={() => {
                                    setRejectMotivo('Bloqueo Expirado / Liberado');
                                    setRejectObservacion('El administrador ha liberado este bloqueo temporal manualmente.');
                                    setShowRejectModal(true);
                                }}
                                className="px-6 py-2 rounded-md font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                                disabled={mutation.isPending}
                            >
                                Liberar Bloqueo (Rechazar)
                            </button>
                            <button
                                onClick={() => setShowApproveModal(true)}
                                className="px-6 py-2 rounded-md font-medium text-white shadow-sm transition-all bg-green-600 hover:bg-green-700 hover:shadow-md"
                                disabled={mutation.isPending}
                            >
                                Aprobar Reserva Anticipada
                            </button>
                        </>
                    ) : (
                        <>
                            {evento.estado !== 'RECHAZADO' && (
                                <button
                                    onClick={() => setShowRejectModal(true)}
                                    className="px-6 py-2 rounded-md font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                                    disabled={mutation.isPending}
                                >
                                    Rechazar Solicitud
                                </button>
                            )}
                            <button
                                onClick={handleRescheduleClick}
                                className="px-6 py-2 rounded-md font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                                disabled={mutation.isPending}
                                title="Rechazar la solicitud y sugerir una fecha alternativa al usuario o Reasignarla directamente"
                            >
                                Reagendar (Opciones)
                            </button>
                            <button
                                onClick={() => setShowApproveModal(true)}
                                className={`px-6 py-2 rounded-md font-medium text-white shadow-sm transition-all
                                    ${canApprove ? 'bg-green-600 hover:bg-green-700 hover:shadow-md' : 'bg-gray-400 cursor-not-allowed'}
                                `}
                                disabled={!canApprove || mutation.isPending}
                                title={!canApprove ? "Resuelva los bloqueos para aprobar" : ""}
                            >
                                Aprobar Original
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* TIMELINE / HISTORIAL */}
            {evento.historial && evento.historial.length > 0 && (
                <div className="mt-8 border-t border-gray-200 pt-8" aria-labelledby="historial-heading">
                    <h2 id="historial-heading" className="text-xl font-bold text-gray-900 mb-4">Historial de Decisiones</h2>
                    <div className="flow-root">
                        <ul className="-mb-8">
                            {evento.historial.map((log: any, idx: number) => (
                                <li key={log.id}>
                                    <div className="relative pb-8">
                                        {idx !== evento.historial.length - 1 && (
                                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                                        )}
                                        <div className="relative flex space-x-3">
                                            <div>
                                                <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white 
                                                    ${log.accion === 'APROBADO' ? 'bg-green-500' :
                                                        log.accion === 'RECHAZADO' ? 'bg-red-500' : 'bg-gray-500'}`}>
                                                    {log.accion === 'APROBADO' ? '✓' : log.accion === 'RECHAZADO' ? '✕' : 'ℹ'}
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                                <div>
                                                    <p className="text-sm text-gray-500">
                                                        <span className="font-medium text-gray-900">{log.accion}</span> por <span className="font-medium text-gray-900">{log.admin_email || 'Sistema'}</span>
                                                    </p>
                                                    {log.motivo && (
                                                        <p className="mt-1 text-sm text-gray-700 font-semibold">
                                                            Motivo: {log.motivo}
                                                        </p>
                                                    )}
                                                    {log.observacion && (
                                                        <p className="mt-0.5 text-sm text-gray-600 italic">
                                                            "{log.observacion}"
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                                    <time dateTime={log.fecha}>{new Date(log.fecha).toLocaleString()}</time>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* MODAL: APPROVE */}
            {showApproveModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity" role="dialog" aria-modal="true" aria-labelledby="modal-approve-title">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
                        <h2 id="modal-approve-title" className="text-lg font-bold text-gray-900 mb-2">Confirmar Aprobación</h2>
                        <p className="text-sm text-gray-600 mb-6">
                            ¿Está seguro de aprobar esta solicitud? Se enviará una notificación automática al responsable.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowApproveModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-gray-500">Cancelar</button>
                            <button onClick={handleApprove} className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded focus:outline-none focus:ring-2 focus:ring-green-500">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: REJECT */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity" role="dialog" aria-modal="true" aria-labelledby="modal-reject-title">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
                        <h2 id="modal-reject-title" className="text-lg font-bold text-gray-900 mb-4">Rechazar Solicitud</h2>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="reject-motivo" className="block text-sm font-medium text-gray-700 mb-1">Motivo del Rechazo *</label>
                                <select
                                    id="reject-motivo"
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 outline-none"
                                    value={rejectMotivo}
                                    onChange={(e) => setRejectMotivo(e.target.value)}
                                    aria-required="true"
                                >
                                    <option value="">Seleccione un motivo...</option>
                                    {RECHAZO_MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="reject-obs" className="block text-sm font-medium text-gray-700 mb-1">Observaciones (Opcional)</label>
                                <textarea
                                    id="reject-obs"
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 h-32 resize-none outline-none"
                                    placeholder="Detalles adicionales para el usuario (opcional)..."
                                    value={rejectObservacion}
                                    onChange={(e) => setRejectObservacion(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-gray-500">Cancelar</button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectMotivo}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                Confirmar Rechazo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: CANCEL CONFIRMATION */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity" role="dialog" aria-modal="true" aria-labelledby="modal-cancel-title">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl animate-scale-in">
                        <div className="flex items-center gap-3 mb-4 text-red-600">
                            <span className="text-2xl" aria-hidden="true">⚠️</span>
                            <h2 id="modal-cancel-title" className="text-lg font-bold text-gray-900 border-b pb-1 w-full">Cancelar Evento</h2>
                        </div>
                        <p className="text-sm text-gray-600 mb-6 bg-red-50 p-3 rounded border border-red-100">
                            ¿Está seguro de CANCELAR DEFINITIVAMENTE este evento aprobado?
                            <strong> Esta acción liberará inmediatamente el espacio en el calendario.</strong>
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowCancelModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-gray-500">Volver</button>
                            <button onClick={() => { setShowCancelModal(false); cancelMutation.mutate(evento.id); }} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500">Sí, Cancelar Reserva</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: SUCCESS FEEDBACK & REDIRECT */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity" role="dialog" aria-modal="true" aria-labelledby="modal-success-title">
                    <div className="bg-white rounded-xl p-8 max-w-sm w-full mx-4 shadow-2xl animate-scale-in text-center" aria-live="assertive">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl" aria-hidden="true">✅</span>
                        </div>
                        <h2 id="modal-success-title" className="text-xl font-bold text-gray-900 mb-2">¡Completado!</h2>
                        <p className="text-sm text-gray-600 mb-8">
                            {successMessage}
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => { setShowSuccessModal(false); navigate('/admin/calendario'); }}
                                className="w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                Ir al Calendario
                            </button>
                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="w-full px-4 py-3 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                            >
                                Quedarme aquí
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: RESCHEDULE */}
            {showRescheduleModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity" role="dialog" aria-modal="true" aria-labelledby="modal-reschedule-title">
                    <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-xl animate-scale-in">
                        <div className="flex items-center gap-3 mb-1">
                            <h2 id="modal-reschedule-title" className="text-lg font-bold text-gray-900 border-b pb-2 w-full">Opciones de Reagendamiento</h2>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            Selecciona una nueva fecha disponible para el espacio: <strong>{evento.auditorio_nombre}</strong> (Jornada: {evento.jornada})
                        </p>

                        <div className="space-y-3 mb-6" role="radiogroup" aria-labelledby="modal-reschedule-title">
                            {suggestedSlots.length === 0 ? (
                                <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded border border-amber-200" aria-live="polite">
                                    No se encontraron fechas libres automáticamente. Usa el selector de fecha personalizada abajo.
                                </p>
                            ) : (
                                suggestedSlots.map((slot, idx) => (
                                    <label key={idx} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedSlotIndex === idx ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                        <input
                                            type="radio"
                                            name="suggestedSlot"
                                            className="mt-1"
                                            checked={selectedSlotIndex === idx}
                                            onChange={() => setSelectedSlotIndex(idx)}
                                            aria-label={`Sugerencia: ${format(slot.date, "EEEE, d 'de' MMMM yyyy", { locale: es })}, Horario: ${format(slot.start, "h:mm a")} - ${format(slot.end, "h:mm a")}`}
                                        />
                                        <div>
                                            <p className="font-semibold text-gray-900 capitalize">
                                                {format(slot.date, "EEEE, d 'de' MMMM yyyy", { locale: es })}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Horario: {format(slot.start, "h:mm a")} - {format(slot.end, "h:mm a")}
                                            </p>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>

                        {/* CUSTOM DATE PICKER — Admin puede elegir cualquier fecha */}
                        <div className="mt-4 border-t border-dashed border-gray-300 pt-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">📅 O elige una fecha personalizada</p>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="col-span-3 sm:col-span-1">
                                    <span className="block text-xs text-gray-500 mb-1" id="custom-date-label">Fecha</span>
                                    <style>{`
                                        .rdp { margin: 0; --rdp-cell-size: 32px; --rdp-accent-color: #2563eb; }
                                        .rdp-day_booked:not(.rdp-day_selected) { background-color: #fee2e2; color: #b91c1c; font-weight: bold; border-radius: 100%; }
                                    `}</style>
                                    <DayPicker
                                        mode="single"
                                        selected={customDate}
                                        onSelect={(date) => { setCustomDate(date); setSelectedSlotIndex(-1); }}
                                        locale={es}
                                        disabled={[{ before: startOfDay(new Date()) }, { dayOfWeek: [0, 6] }]}
                                        modifiers={{
                                            booked: (date) => !isRangeFree(
                                                startOfDay(date),
                                                setSeconds(setMinutes(setHours(date, 23), 59), 59)
                                            )
                                        }}
                                        modifiersClassNames={{ booked: 'rdp-day_booked' }}
                                        aria-labelledby="custom-date-label"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="custom-start" className="block text-xs text-gray-500 mb-1">Desde</label>
                                    <select
                                        id="custom-start"
                                        className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        value={customStart}
                                        onChange={e => setCustomStart(e.target.value)}
                                        aria-label="Hora de inicio personalizada"
                                    >
                                        <option value="">Seleccione...</option>
                                        {TIME_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="custom-end" className="block text-xs text-gray-500 mb-1">Hasta</label>
                                    <select
                                        id="custom-end"
                                        className="w-full p-1.5 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        value={customEnd}
                                        onChange={e => setCustomEnd(e.target.value)}
                                        aria-label="Hora de finalización personalizada"
                                    >
                                        <option value="">Seleccione...</option>
                                        {TIME_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {customDate && customStart && customEnd && (
                                <div aria-live="polite">
                                    {(() => {
                                        const active = getActiveSlot();
                                        if (!active) return null;

                                        // Check 1: Is it in the past (time on the same day)?
                                        if (active.start < new Date()) {
                                            return (
                                                <p className="mt-2 text-xs text-red-700 bg-red-50 p-2 border border-red-200 rounded">
                                                    <span aria-hidden="true">🚨</span> Error: No puede reagendar a una hora que ya pasó en el día de hoy.
                                                </p>
                                            );
                                        }

                                        // Check 2: Conflict overlap
                                        if (!isRangeFree(active.start, active.end)) {
                                            return (
                                                <p className="mt-2 text-xs text-red-700 bg-red-50 p-2 border border-red-200 rounded">
                                                    <span aria-hidden="true">🚨</span> Conflictos detectados: El auditorio ya tiene un evento agendado en ese horario. Por favor elija otro para evitar errores.
                                                </p>
                                            );
                                        }

                                        return (
                                            <p className="mt-2 text-xs text-green-700 bg-green-50 p-2 border border-green-200 rounded">
                                                <span aria-hidden="true">✅</span> Horario libre y válido. Se usará este horario.
                                            </p>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>

                        <div className="mb-6 mt-4">
                            <label htmlFor="reschedule-obs" className="block text-sm font-medium text-gray-700 mb-1">Mensaje para el solicitante</label>
                            <textarea
                                id="reschedule-obs"
                                className="w-full p-2 border border-blue-300 bg-blue-50/50 rounded-md focus:ring-blue-500 focus:border-blue-500 h-24 resize-none text-sm outline-none"
                                value={rescheduleObservacion}
                                onChange={(e) => setRescheduleObservacion(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button onClick={() => setShowRescheduleModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-gray-500">Cancelar</button>
                            {evento.estado !== 'APROBADO' && (
                                <button
                                    onClick={handleConfirmRescheduleReject}
                                    disabled={!isValidSlot()}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                                    title="Rechaza el evento original y envía una sugerencia de horario libre al usuario."
                                >
                                    Rechazar y Sugerir
                                </button>
                            )}
                            <button
                                onClick={handleConfirmRescheduleApprove}
                                disabled={!isValidSlot()}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                title={evento.estado === 'APROBADO' ? "Forzar reagendamiento por urgencia." : "Fuerza la aprobación del evento en este nuevo horario y le notifica al usuario."}
                            >
                                {evento.estado === 'APROBADO' ? 'Reagendar Evento' : 'Asignar Nueva Fecha (Aprobar)'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
