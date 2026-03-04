import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useNavigate } from 'react-router-dom';
import { eventoService, ApiError } from '@/services/eventoService';
import { auditorioService } from '@/services/auditorioService';

// ─── Localizer ────────────────────────────────────────────────────────────────
const locales = { 'es': es };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// ─── Jornada helpers ──────────────────────────────────────────────────────────
const JORNADA_MAP: Record<string, { start: string; end: string; label: string }> = {
    MAÑANA: { start: '08:00', end: '12:00', label: 'Mañana (08:00 – 12:00)' },
    TARDE: { start: '14:00', end: '18:00', label: 'Tarde (14:00 – 18:00)' },
    TODO_EL_DIA: { start: '08:00', end: '18:00', label: 'Todo el día (08:00 – 18:00)' },
};

function dateToLocalISO(date: string, time: string) {
    return `${date}T${time}:00`;
}

// ─── Custom Event Chip ────────────────────────────────────────────────────────
const CustomEvent = ({ event }: any) => (
    <div className="flex flex-col h-full overflow-hidden p-0.5">
        <div className="flex items-start gap-1">
            <span className="text-sm shrink-0 leading-tight block mt-0.5" aria-hidden="true">{event.icon}</span>
            <span className="font-bold text-xs sm:text-sm leading-tight break-words">{event.title}</span>
        </div>
        {event.status === 'BLOQUEO_TEMPORAL' && (
            <span className="text-[10px] sm:text-xs opacity-80 mt-1 font-medium italic">Temporal</span>
        )}
    </div>
);

// ─── Result Email Row ─────────────────────────────────────────────────────────
const EmailRow = ({ icon, label, recipient }: { icon: string; label: string; recipient: string }) => (
    <div className="flex items-center gap-2 text-sm p-2.5 bg-green-50 border border-green-200 rounded-md">
        <span className="text-base">{icon}</span>
        <div>
            <p className="font-medium text-green-800">{label}</p>
            <p className="text-green-600 text-xs">{recipient}</p>
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminCalendarioPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [view, setView] = useState<View>(Views.WEEK);
    const [date, setDate] = useState(new Date());
    const [selectedAuditorio, setSelectedAuditorio] = useState<string>('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [successResult, setSuccessResult] = useState<null | {
        titulo: string;
        fecha: string;
        auditorio: string;
        responsable: string;
        correo: string;
        necesitaSoporte: boolean;
    }>(null);

    // Form state — filled from slot click
    const [form, setForm] = useState({
        titulo: '',
        descripcion: '',
        fecha: '',
        jornada: 'MAÑANA',
        auditorio_id: '',
        dependencia_id: '',
        responsable_nombre: '',
        responsable_telefono: '',
        correo_confirmacion: '',
        aforo_estimado: '0',
        requiere_microfono: false,
        requiere_videobeam: false,
        requiere_sonido: false,
        requiere_asistencia_tecnica: false,
    });
    const [formError, setFormError] = useState('');

    // ── Queries ────────────────────────────────────────────────────────────────
    const { data: auditorios = [] } = useQuery({
        queryKey: ['admin-auditorios-list'],
        queryFn: auditorioService.getAllAuditorios,
        staleTime: 1000 * 60 * 5
    });

    const { data: dependencias = [] } = useQuery({
        queryKey: ['dependencias'],
        queryFn: async () => {
            const res = await fetch('http://localhost:5000/api/dependencias/');
            return res.json();
        },
        staleTime: 1000 * 60 * 5
    });

    const { data: rawEvents = [], isLoading } = useQuery({
        queryKey: ['admin-events-calendar', selectedAuditorio],
        queryFn: () => {
            const filters: any = {};
            if (selectedAuditorio) filters.auditorio_id = selectedAuditorio;
            return eventoService.getEvents(filters);
        },
        refetchInterval: 30000
    });

    // ── Mutation ───────────────────────────────────────────────────────────────
    const mutation = useMutation({
        mutationFn: (payload: Parameters<typeof eventoService.createAdminDirect>[0]) =>
            eventoService.createAdminDirect(payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admin-events-calendar'] });
            const auditorio = (auditorios as any[]).find((a: any) => String(a.id) === String(variables.auditorio_id));
            const necesitaSoporte = !!(variables.requiere_microfono || variables.requiere_videobeam
                || variables.requiere_sonido || variables.requiere_asistencia_tecnica);
            setSuccessResult({
                titulo: variables.titulo,
                fecha: `${variables.fecha_inicio.slice(0, 10)} · ${variables.jornada}`,
                auditorio: auditorio?.nombre || String(variables.auditorio_id),
                responsable: variables.responsable_nombre,
                correo: variables.correo_confirmacion,
                necesitaSoporte,
            });
        },
        onError: (err: any) => {
            setFormError(err instanceof ApiError ? err.message : 'Error al crear evento');
        }
    });

    // ── Calendar helpers ──────────────────────────────────────────────────────
    const calendarEvents = rawEvents.map((e: any) => ({
        id: e.id,
        title: `${e.auditorio_nombre}: ${e.titulo || 'Evento'}`,
        start: new Date(e.fecha_inicio),
        end: new Date(e.fecha_fin),
        status: e.estado,
        resource: e
    }));

    const eventPropGetter = (event: any) => {
        let backgroundColor = '#f3f4f6', color = '#374151';
        switch (event.status) {
            case 'APROBADO': backgroundColor = '#dcfce7'; color = '#166534'; event.icon = '✅'; break;
            case 'PENDIENTE':
            case 'BLOQUEO_TEMPORAL': backgroundColor = '#fef3c7'; color = '#92400e'; event.icon = '⏳'; break;
            case 'RECHAZADO': backgroundColor = '#fee2e2'; color = '#991b1b'; event.icon = '❌'; break;
        }
        return {
            style: { backgroundColor, color, border: `1px solid ${color}40`, fontSize: '1rem' },
            'aria-label': `Solicitud ${event.title}, Estado: ${event.status}`,
            tabIndex: 0
        };
    };

    const handleSelectEvent = (event: any) => navigate(`/admin/solicitudes/${event.id}`);

    const handleSelectSlot = (slotInfo: { start: Date; action: string }) => {
        if (view === Views.MONTH) {
            setDate(slotInfo.start);
            setView(Views.DAY);
            return;
        }
        if (slotInfo.start < new Date()) {
            alert('No puedes reservar en fechas u horas pasadas.');
            return;
        }
        // Pre-fill form with clicked date
        const clickedDate = format(slotInfo.start, 'yyyy-MM-dd');
        const preAuditorio = selectedAuditorio || (auditorios.length === 1 ? String((auditorios as any[])[0].id) : '');
        setForm(f => ({ ...f, fecha: clickedDate, auditorio_id: preAuditorio }));
        setFormError('');
        setSuccessResult(null);
        setShowModal(true);
    };

    // ── Form submit ────────────────────────────────────────────────────────────
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        const jornada = form.jornada as keyof typeof JORNADA_MAP;
        if (!JORNADA_MAP[jornada]) { setFormError('Jornada inválida'); return; }

        const { start, end } = JORNADA_MAP[jornada];
        mutation.mutate({
            titulo: form.titulo.trim(),
            descripcion: form.descripcion.trim() || undefined,
            fecha_inicio: dateToLocalISO(form.fecha, start),
            fecha_fin: dateToLocalISO(form.fecha, end),
            jornada: form.jornada,
            auditorio_id: Number(form.auditorio_id),
            dependencia_id: form.dependencia_id || undefined,
            responsable_nombre: form.responsable_nombre.trim(),
            responsable_telefono: form.responsable_telefono.trim(),
            correo_confirmacion: form.correo_confirmacion.trim(),
            aforo_estimado: Number(form.aforo_estimado) || 0,
            requiere_microfono: form.requiere_microfono,
            requiere_videobeam: form.requiere_videobeam,
            requiere_sonido: form.requiere_sonido,
            requiere_asistencia_tecnica: form.requiere_asistencia_tecnica,
        });
    };

    const closeModal = () => {
        setShowModal(false);
        setSuccessResult(null);
        setFormError('');
        setForm({
            titulo: '', descripcion: '', fecha: '', jornada: 'MAÑANA', auditorio_id: '',
            dependencia_id: '', responsable_nombre: '', responsable_telefono: '',
            correo_confirmacion: '', aforo_estimado: '0', requiere_microfono: false,
            requiere_videobeam: false, requiere_sonido: false, requiere_asistencia_tecnica: false
        });
    };

    const field = (label: string, id: string, children: React.ReactNode, required = false) => (
        <div>
            <label htmlFor={id} className="block text-xs font-medium text-gray-600 mb-1">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {children}
        </div>
    );

    const inputCls = "w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none";
    const checkCls = "flex items-center gap-2 text-sm text-gray-700";

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4 animate-fade-in" role="main">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-[var(--border-color)]">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--primary-color)]">Calendario General</h1>
                    <p className="text-sm text-gray-500">Vista centralizada de toda la ocupación física (Clic en un horario vacío para agendar)</p>
                </div>
                <select
                    id="auditorioFilter"
                    value={selectedAuditorio}
                    onChange={(e) => setSelectedAuditorio(e.target.value)}
                    className="w-full sm:w-64 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)]"
                    aria-label="Filtrar eventos por auditorio"
                >
                    <option value="">Todos los espacios (Consolidado)</option>
                    {(auditorios as any[]).map((a: any) => (
                        <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                </select>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs font-medium bg-white p-3 rounded-lg border border-[var(--border-color)]">
                <div className="flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-green-200 border border-green-800 flex items-center justify-center text-[0.7rem] shadow-sm">✅</span><span className="text-sm">Aprobado / Ocupado</span></div>
                <div className="flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-amber-200 border border-amber-800 flex items-center justify-center text-[0.7rem] shadow-sm">⏳</span><span className="text-sm">Pendiente / Bloqueado</span></div>
                <div className="flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-red-200 border border-red-800 flex items-center justify-center text-[0.7rem] shadow-sm">❌</span><span className="text-sm">Rechazado</span></div>
            </div>

            {/* Calendar */}
            <div className="flex-1 bg-white rounded-lg shadow-sm border border-[var(--border-color)] p-4 relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-white/80 flex items-center justify-center backdrop-blur-sm">
                        <div className="text-[var(--primary-color)] font-medium animate-pulse" role="status">Cargando eventos...</div>
                    </div>
                )}
                <style>{`
                    .rbc-allday-cell { display: none !important; }
                    .rbc-event { padding: 2px 5px !important; }
                    .rbc-event:focus { outline: 2px solid var(--primary-color); outline-offset: 2px; }
                    .rbc-time-slot { cursor: pointer; }
                    .rbc-time-slot:hover { background-color: #f3f4f6; }
                `}</style>
                <Calendar
                    localizer={localizer}
                    events={calendarEvents}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    culture='es'
                    components={{ event: CustomEvent }}
                    views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                    defaultView={Views.WEEK}
                    view={view}
                    onView={setView}
                    date={date}
                    onNavigate={setDate}
                    min={new Date(0, 0, 0, 7, 0, 0)}
                    max={new Date(0, 0, 0, 19, 0, 0)}
                    step={60}
                    selectable={true}
                    onSelectEvent={handleSelectEvent}
                    onSelectSlot={handleSelectSlot}
                    eventPropGetter={eventPropGetter}
                    popup={true}
                    messages={{ today: "Hoy", previous: "Anterior", next: "Siguiente", month: "Mes", week: "Semana", day: "Día", agenda: "Agenda", date: "Fecha", time: "Hora", event: "Evento" }}
                />
            </div>

            {/* ── MODAL: Crear Evento Directo ── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">

                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Nueva Reserva Directa</h2>
                                <p className="text-xs text-gray-500">El evento se aprobará automáticamente y se notificará a los involucrados.</p>
                            </div>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                        </div>

                        {/* ── SUCCESS RESULT (shown after mutation succeeds) ── */}
                        {successResult ? (
                            <div className="p-6 space-y-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                    <div className="text-3xl mb-1">✅</div>
                                    <p className="font-bold text-green-800 text-base">{successResult.titulo}</p>
                                    <p className="text-green-700 text-sm">{successResult.fecha} · {successResult.auditorio}</p>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Correos enviados</p>
                                    <div className="space-y-2">
                                        <EmailRow icon="📧" label="Responsable del evento" recipient={successResult.correo} />
                                        <EmailRow icon="🔔" label="Administrador (confirmación)" recipient="Panel de administración" />
                                        {successResult.necesitaSoporte && (
                                            <EmailRow icon="🔧" label="Servicios Informáticos (soporte técnico)" recipient="serviciosinformaticos@cauca.gov.co" />
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={closeModal}
                                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        Cerrar
                                    </button>
                                    <button
                                        onClick={() => { closeModal(); queryClient.invalidateQueries({ queryKey: ['admin-events-calendar'] }); }}
                                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                    >
                                        Ver en Calendario
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* ── FORM ── */
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                {/* Error banner */}
                                {formError && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                                        ⚠️ {formError}
                                    </div>
                                )}

                                {/* Row: Titulo */}
                                {field('Título del evento', 'titulo', (
                                    <input id="titulo" type="text" required className={inputCls}
                                        value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                                        placeholder="Ej. Pelea de Gallos" />
                                ), true)}

                                {/* Row: Fecha + Jornada */}
                                <div className="grid grid-cols-2 gap-3">
                                    {field('Fecha', 'fecha', (
                                        <input id="fecha" type="date" required className={inputCls}
                                            value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
                                    ), true)}
                                    {field('Jornada', 'jornada', (
                                        <select id="jornada" required className={inputCls}
                                            value={form.jornada} onChange={e => setForm(f => ({ ...f, jornada: e.target.value }))}>
                                            {Object.entries(JORNADA_MAP).map(([k, v]) => (
                                                <option key={k} value={k}>{v.label}</option>
                                            ))}
                                        </select>
                                    ), true)}
                                </div>

                                {/* Row: Auditorio (Hidden if only 1 option) */}
                                {auditorios.length > 1 && field('Auditorio / Espacio', 'auditorio_id', (
                                    <select id="auditorio_id" required className={inputCls}
                                        value={form.auditorio_id} onChange={e => setForm(f => ({ ...f, auditorio_id: e.target.value }))}>
                                        <option value="">Seleccione...</option>
                                        {(auditorios as any[]).map((a: any) => (
                                            <option key={a.id} value={a.id}>{a.nombre}</option>
                                        ))}
                                    </select>
                                ), true)}

                                {/* Row: Entidad / Dependencia */}
                                {field('Entidad / Dependencia', 'dependencia_id', (
                                    <select id="dependencia_id" className={inputCls}
                                        value={form.dependencia_id} onChange={e => setForm(f => ({ ...f, dependencia_id: e.target.value }))}>
                                        <option value="">Sin dependencia</option>
                                        {(dependencias as any[]).map((d: any) => (
                                            <option key={d.id} value={d.id}>{d.nombre}</option>
                                        ))}
                                    </select>
                                ))}

                                {/* Row: Responsable + Teléfono */}
                                <div className="grid grid-cols-2 gap-3">
                                    {field('Responsable', 'responsable_nombre', (
                                        <input id="responsable_nombre" type="text" required className={inputCls}
                                            value={form.responsable_nombre} onChange={e => setForm(f => ({ ...f, responsable_nombre: e.target.value }))}
                                            placeholder="Nombre completo" />
                                    ), true)}
                                    {field('Teléfono', 'responsable_telefono', (
                                        <input id="responsable_telefono" type="tel" required className={inputCls}
                                            value={form.responsable_telefono} onChange={e => setForm(f => ({ ...f, responsable_telefono: e.target.value }))}
                                            placeholder="Ej. 3001234567" />
                                    ), true)}
                                </div>

                                {/* Row: Correo */}
                                {field('Correo de confirmación', 'correo_confirmacion', (
                                    <input id="correo_confirmacion" type="email" required className={inputCls}
                                        value={form.correo_confirmacion} onChange={e => setForm(f => ({ ...f, correo_confirmacion: e.target.value }))}
                                        placeholder="correo@ejemplo.com" />
                                ), true)}

                                {/* Row: Aforo */}
                                {field('Aforo estimado', 'aforo_estimado', (
                                    <input id="aforo_estimado" type="number" min="0" className={inputCls}
                                        value={form.aforo_estimado} onChange={e => setForm(f => ({ ...f, aforo_estimado: e.target.value }))} />
                                ))}

                                {/* Requerimientos técnicos */}
                                <div>
                                    <p className="text-xs font-medium text-gray-600 mb-2">Requerimientos técnicos</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { key: 'requiere_microfono', label: '🎤 Micrófono' },
                                            { key: 'requiere_videobeam', label: '📽 Videobeam' },
                                            { key: 'requiere_sonido', label: '🔊 Sonido' },
                                            { key: 'requiere_asistencia_tecnica', label: '🛠 Soporte técnico' },
                                        ].map(({ key, label }) => (
                                            <label key={key} className={`${checkCls} p-2 border border-gray-100 rounded-md cursor-pointer hover:bg-gray-50`}>
                                                <input type="checkbox"
                                                    checked={(form as any)[key]}
                                                    onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                                                    className="rounded" />
                                                {label}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Row: Descripción */}
                                {field('Descripción (opcional)', 'descripcion', (
                                    <textarea id="descripcion" rows={2} className={`${inputCls} resize-none`}
                                        value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                                        placeholder="Detalles adicionales del evento..." />
                                ))}

                                {/* Actions */}
                                <div className="flex gap-3 pt-2 border-t border-gray-100">
                                    <button type="button" onClick={closeModal}
                                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                                        Cancelar
                                    </button>
                                    <button type="submit"
                                        disabled={mutation.isPending}
                                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm">
                                        {mutation.isPending ? 'Creando...' : '✅ Crear y Aprobar'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
