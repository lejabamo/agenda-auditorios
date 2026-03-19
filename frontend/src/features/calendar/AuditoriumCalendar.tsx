import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, type View, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useNavigate } from 'react-router-dom';
import { eventoService } from '@/services/eventoService';
import { auditorioService } from '@/services/auditorioService';
import { useBooking } from '@/context/BookingContext';

// Setup Localizer
const locales = {
    'es': es,
};
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface CalendarEvent {
    id: number;
    title: string;
    start: Date;
    end: Date;
    resource?: any;
    status: string; // 'PENDIENTE' | 'APROBADO' | 'BLOQUEO_TEMPORAL'
}

const CustomEvent = ({ event }: { event: CalendarEvent }) => {
    let statusLabel = '';
    let statusIcon = null;

    if (event.status === 'APROBADO') {
        statusLabel = '(Ocupado)';
        statusIcon = <span className="inline-block w-2 h-2 rounded-full bg-red-200 mr-1" aria-hidden="true"></span>;
    } else if (event.status === 'PENDIENTE' || event.status === 'BLOQUEO_TEMPORAL') {
        statusLabel = '(Solicitado)';
        statusIcon = <span className="inline-block w-2 h-2 rounded-full bg-orange-200 mr-1" aria-hidden="true"></span>;
    }

    return (
        <div
            title={`${event.title} ${statusLabel} - ${format(event.start, 'h:mm a')} - ${format(event.end, 'h:mm a')}`}
            className="text-xs h-full w-full overflow-hidden flex flex-col justify-center px-1"
            tabIndex={0}
            role="button"
            aria-label={`${event.title}, estado ${event.status}. De ${format(event.start, 'h:mm a')} a ${format(event.end, 'h:mm a')}`}
        >
            <div className="font-bold truncate flex items-center">
                {statusIcon}
                {event.title}
            </div>
            <div className="text-[10px] truncate opacity-90">
                {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
            </div>
            <div className="sr-only">{statusLabel}</div>
        </div>
    );
};

const CustomToolbar = (toolbar: any) => {
    const goToBack = () => { toolbar.onNavigate('PREV'); };
    const goToNext = () => { toolbar.onNavigate('NEXT'); };
    const goToToday = () => { toolbar.onNavigate('TODAY'); };

    return (
        <div className="rbc-toolbar">
            <span className="rbc-btn-group">
                <button type="button" onClick={goToBack}>Anterior</button>
                <button type="button" onClick={goToToday}>Hoy</button>
                <button type="button" onClick={goToNext}>Siguiente</button>
            </span>
            <span className="rbc-toolbar-label">{toolbar.label}</span>
            <span className="rbc-btn-group">
                {Array.isArray(toolbar.views) && toolbar.views.map((view: string) => (
                    <button
                        key={view}
                        type="button"
                        className={toolbar.view === view ? 'rbc-active' : ''}
                        onClick={() => toolbar.onView(view)}
                    >
                        {toolbar.localizer.messages[view] || view}
                    </button>
                ))}
            </span>
        </div>
    );
};

export function AuditoriumCalendar({ className = "h-[600px]" }: { className?: string }) {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [view, setView] = useState<View>(Views.WEEK);
    const [date, setDate] = useState(new Date());
    const navigate = useNavigate();
    const { setBookingSlot } = useBooking();
    const [auditorioIdState, setAuditorioIdState] = useState<number>(1);

    const fetchEvents = async () => {
        try {
            // Fetch clean list
            const serverEvents = await eventoService.getEvents({});
            const mappedEvents = serverEvents.map((e: any) => ({
                id: e.id,
                title: e.titulo || (e.estado === 'APROBADO' ? 'Reservado' : 'Solicitado'),
                start: new Date(e.fecha_inicio),
                end: new Date(e.fecha_fin),
                status: e.estado,
                resource: e
            }));
            setEvents(mappedEvents);
        } catch (err) {
            console.error("Error fetching calendar events", err);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const auditorios = await auditorioService.getActiveAuditorios();
                const filomena = auditorios.find(a => a.nombre.toLowerCase().includes('filomena'));
                if (filomena) {
                    setAuditorioIdState(filomena.id);
                } else if (auditorios.length > 0) {
                    setAuditorioIdState(auditorios[0].id);
                }
            } catch (e) {
                console.error("Error fetching auditorio", e);
            }
            fetchEvents();
        };
        init();
        
        // Poll every minute to refresh holds/status
        const interval = setInterval(fetchEvents, 60000);
        return () => clearInterval(interval);
    }, []);

    const eventPropGetter = (event: CalendarEvent) => {
        let backgroundColor = '#3174ad'; // Default Blue
        if (event.status === 'APROBADO') {
            backgroundColor = '#003366'; // Dark Blue (Midnight Blue)
        } else if (event.status === 'PENDIENTE' || event.status === 'BLOQUEO_TEMPORAL') {
            backgroundColor = '#f97316'; // Orange-500
        }
        return {
            style: {
                backgroundColor,
                color: 'white',
                cursor: 'default' // Events are not clickable for booking
            }
        };
    };

    const slotPropGetter = (date: Date) => {
        const now = new Date();
        const isPast = date < now;
        const hour = date.getHours();
        const day = date.getDay();
        const isWeekend = day === 0 || day === 6;

        // Visual for Past Dates
        if (isPast) {
            return {
                className: 'rbc-day-slot-past',
                style: {
                    backgroundColor: '#f3f4f6', // Gray-100
                    cursor: 'not-allowed',
                    opacity: 0.6,
                    borderTop: '1px solid #e5e7eb' // Light separation
                }
            };
        }

        // Valid blocks: 8-12 and 14-18
        const isMorningBlock = hour >= 8 && hour < 12;
        const isAfternoonBlock = hour >= 14 && hour < 18;

        if ((isMorningBlock || isAfternoonBlock) && !isWeekend) {
            // Business hours - Free slots
            return {
                className: 'rbc-day-slot-active',
                style: {
                    backgroundColor: '#dcfce7', // Green-100
                    cursor: 'pointer',
                    color: '#166534',
                    borderTop: '1px solid #bbf7d0', // Greenish border
                    borderBottom: '1px solid #bbf7d0'
                },
                title: "Disponible – Click para solicitar este espacio",
                'aria-label': `Espacio disponible a las ${format(date, 'h:mm a')}. Click para solicitar.`
            } as React.HTMLAttributes<HTMLDivElement>;
        }

        // Non-business hours (Lunch, Late, Weekend)
        return {
            style: {
                backgroundColor: '#f3f4f6', // Gray-100 (Blocked)
                cursor: 'not-allowed',
                color: '#9ca3af',
                opacity: 0.6
            }
        };
    };

    const dayPropGetter = (date: Date) => {
        const day = date.getDay();
        const isWeekend = day === 0 || day === 6;

        if (!isWeekend) {
            return {
                style: {
                    backgroundColor: '#f0fdf4', // Very light green for Month view days
                    cursor: 'pointer'
                }
            };
        }
        return {
            style: {
                backgroundColor: '#f3f4f6', // Gray-100 (Blocked)
                cursor: 'not-allowed'
            }
        };
    };

    const isRangeFree = (start: Date, end: Date) => {
        return !events.some(event => {
            // Check for overlap
            return (
                (event.start < end && event.end > start) &&
                ['APROBADO', 'PENDIENTE', 'BLOQUEO_TEMPORAL'].includes(event.status)
            );
        });
    };

    const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date; jornada: string; canSelectFullDay: boolean } | null>(null);
    const [selectedJornadaOption, setSelectedJornadaOption] = useState<string>('');

    const handleSelectSlot = async (slotInfo: { start: Date; end: Date; action: string }) => {
        const now = new Date();
        // Fix for month view: clicking today returns 00:00:00, which is < now, falsely triggering past block.
        // We compare start of days instead for the basic "past" validation.
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const selectedStartDay = new Date(slotInfo.start.getFullYear(), slotInfo.start.getMonth(), slotInfo.start.getDate());

        if (selectedStartDay < todayStart || (slotInfo.start.getHours() > 0 && slotInfo.start < now)) {
            alert("⚠️ No es posible seleccionar fechas u horas pasadas.");
            return;
        }

        const day = slotInfo.start.getDay();
        if (day === 0 || day === 6) {
            alert("⚠️ Los fines de semana no están disponibles para reserva.");
            return;
        }

        const hour = slotInfo.start.getHours();

        // Check availability
        const morningStart = new Date(slotInfo.start);
        morningStart.setHours(8, 0, 0, 0);
        const morningEnd = new Date(slotInfo.start);
        morningEnd.setHours(12, 0, 0, 0);

        const afternoonStart = new Date(slotInfo.start);
        afternoonStart.setHours(14, 0, 0, 0);
        const afternoonEnd = new Date(slotInfo.start);
        afternoonEnd.setHours(18, 0, 0, 0);

        const isMorningFree = isRangeFree(morningStart, morningEnd);
        const isAfternoonFree = isRangeFree(afternoonStart, afternoonEnd);
        const canSelectFullDay = isMorningFree && isAfternoonFree;

        let jornada = '';

        if (hour === 0) {
            // Month view full-day click
            if (canSelectFullDay) jornada = 'TODO_EL_DIA';
            else if (isMorningFree) jornada = 'MAÑANA';
            else if (isAfternoonFree) jornada = 'TARDE';
            else {
                alert("ℹ️ No hay disponibilidad de auditorio en esta fecha.");
                return;
            }
        } else if (hour >= 8 && hour < 12) jornada = 'MAÑANA';
        else if (hour >= 14 && hour < 18) jornada = 'TARDE';
        else if (hour >= 8 && hour < 18) jornada = 'TODO_EL_DIA';

        if (!jornada) {
            alert("ℹ️ El auditorio solo está disponible de:\n• 8:00 AM a 12:00 PM\n• 2:00 PM a 6:00 PM\n\nPor favor seleccione un espacio dentro de estos horarios.");
            return;
        }

        // Use the exact clicked or dragged range
        let bookingStart = slotInfo.start;
        let bookingEnd = slotInfo.end;
        
        // If it was a single click (usually 1 hour duration with step=60), we could keep it or adjust,
        // but now that the wizard is editable, we just take the selection.
        
        const isExactSlotFree = isRangeFree(bookingStart, bookingEnd);
 
        if (!isExactSlotFree && slotInfo.action === 'select') {
             // If they selected a range that overlaps, we tell them.
             alert(`ℹ️ Parte del horario seleccionado (${format(bookingStart, 'h:mm a')} a ${format(bookingEnd, 'h:mm a')}) ya está ocupado.`);
             return;
        }

        // Open Confirmation Modal instead of immediate action
        setSelectedSlot({
            start: bookingStart,
            end: bookingEnd,
            jornada,
            canSelectFullDay
        });
        setSelectedJornadaOption(jornada); // Default to clicked slot
    };

    const confirmReservation = async () => {
        if (!selectedSlot) return;

        try {
            // 1. Create Backend Hold
            // Extract YYYY-MM-DD from the selected start date
            const fechaStr = format(selectedSlot.start, 'yyyy-MM-dd');

            const holdResponse = await eventoService.createHold({
                fecha: fechaStr,
                jornada: selectedJornadaOption, // Use the selected option from modal
                auditorio_id: auditorioIdState, // dynamically fetched
                hora_inicio: format(selectedSlot.start, 'HH:mm'),
                hora_fin: format(selectedSlot.end, 'HH:mm')
            });

            if (!holdResponse || !holdResponse.id) {
                throw new Error('No se pudo obtener el ID del bloqueo temporal');
            }

            console.log("Hold Created:", holdResponse);

            // 2. Store selection and navigate (Include holdId)
            setBookingSlot({
                auditorioId: auditorioIdState,
                fechaInicio: selectedSlot.start.toISOString(),
                fechaFin: selectedSlot.end.toISOString(), // Ideally update this based on jornada but step 2 displays generic date
                jornada: selectedJornadaOption as any,
                status: 'HOLD',
                holdId: holdResponse.id
            });

            setSelectedSlot(null);
            navigate('/solicitar');

        } catch (error: any) {
            console.error("Hold Creation Error:", error);
            // Show user friendly error
            alert(error.message || "No se pudo bloquear el espacio. Intente nuevamente.");
            setSelectedSlot(null);
        }
    };

    const cancelSelection = () => {
        setSelectedSlot(null);
    };

    return (
        <div className={`p-4 flex flex-col animate-fade-in ${className} relative`}>
            <style>{`
                .rbc-allday-cell {
                    display: none !important;
                }
                .rbc-time-view .rbc-header {
                    border-bottom: 1px solid #e5e7eb !important;
                }
            `}</style>
            {/* Confirmation Modal */}
            {selectedSlot && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 rounded-lg backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-gray-100 animate-scale-in">
                        <div className="flex items-center gap-3 mb-4 text-[var(--primary-color)]">
                            <div className="p-2 bg-blue-50 rounded-full">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                            <h3 className="text-lg font-bold">Confirmar Selección</h3>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Fecha:</span>
                                <span className="font-medium text-gray-900 capitalize">
                                    {format(selectedSlot.start, 'EEEE d MMMM, yyyy', { locale: es })}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm items-start">
                                <span className="text-gray-500 mt-1">Horario:</span>
                                <div className="font-medium text-gray-900 text-right">
                                    {!selectedSlot.canSelectFullDay ? (
                                        <span>
                                            {selectedSlot.jornada === 'MAÑANA' ? 'Mañana (8:00 AM - 12:00 PM)' :
                                                selectedSlot.jornada === 'TARDE' ? 'Tarde (2:00 PM - 6:00 PM)' : 'Todo el día'}
                                        </span>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="jornada"
                                                    value={selectedSlot.jornada}
                                                    checked={selectedJornadaOption === selectedSlot.jornada}
                                                    onChange={(e) => setSelectedJornadaOption(e.target.value)}
                                                    className="text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                                                />
                                                <span className="text-sm">
                                                    {selectedSlot.jornada === 'MAÑANA' ? 'Solo Mañana (8am - 12pm)' : 'Solo Tarde (2pm - 6pm)'}
                                                </span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="jornada"
                                                    value="TODO_EL_DIA"
                                                    checked={selectedJornadaOption === 'TODO_EL_DIA'}
                                                    onChange={(e) => setSelectedJornadaOption(e.target.value)}
                                                    className="text-[var(--primary-color)] focus:ring-[var(--primary-color)]"
                                                />
                                                <span className="text-sm font-bold text-[var(--primary-color)]">
                                                    Todo el día (8am - 6pm)
                                                </span>
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Estado:</span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    Disponible
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                                Va a iniciar una solicitud de reserva para este bloque. Tendrá 10 minutos para completarla.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={cancelSelection}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmReservation}
                                className="flex-1 px-4 py-2 bg-[var(--primary-color)] text-white rounded-lg hover:bg-[var(--primary-light)] font-medium text-sm shadow-sm transition-all"
                            >
                                Iniciar Solicitud
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <header className="mb-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Agenda Auditorio Filomena</h1>
                <div className="flex gap-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-4 bg-green-100 border border-green-300 rounded"></span> Libre
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-4 bg-orange-500 rounded"></span> Solicitado/En Proceso
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-4 bg-[#003366] rounded"></span> Reservado
                    </div>
                </div>
            </header>

            <div className="flex-1 bg-white rounded-lg shadow-lg p-4">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    culture='es'
                    views={[Views.MONTH, Views.WEEK, Views.DAY]}
                    defaultView={Views.WEEK}
                    view={view}
                    onView={setView}
                    date={date}
                    onNavigate={setDate}
                    min={new Date(0, 0, 0, 8, 0, 0)} // 8:00 AM
                    max={new Date(0, 0, 0, 18, 0, 0)} // 6:00 PM
                    step={60}
                    selectable
                    onSelectSlot={handleSelectSlot}
                    eventPropGetter={eventPropGetter}
                    slotPropGetter={slotPropGetter}
                    dayPropGetter={dayPropGetter}
                    messages={{
                        today: "Hoy",
                        previous: "Anterior",
                        next: "Siguiente",
                        month: "Mes",
                        week: "Semana",
                        day: "Día",
                        agenda: "Agenda",
                        date: "Fecha",
                        time: "Hora",
                        event: "Evento"
                    }}
                    components={{
                        event: CustomEvent,
                        toolbar: CustomToolbar
                    }}
                />
            </div>
        </div>
    );
}
