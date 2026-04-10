import { format, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale/es';
const API_URL = import.meta.env.VITE_API_URL;

export type AssistanceIntent = 'AVAILABILITY' | 'AGENDA' | 'GREETING' | 'START_BOOKING' | 'UNKNOWN';

export interface AssistanceResponse {
    intent: AssistanceIntent;
    text: string;
    data?: any;
    displayType: 'text' | 'list' | 'matrix' | 'form';
    newState?: any;
}

export const processQuery = async (query: string, rawEvents: any[], auditorios: any[], contextState: any = null): Promise<AssistanceResponse> => {
    const q = query.toLowerCase().trim();
    const today = new Date();

    // 0. CHECK CONVERSATION STATE
    if (contextState && contextState.waitingConfirmation) {
        if (q === 'si' || q === 'sí' || q === 'claro' || q === 'agendar' || q === 'yes') {
            return {
                intent: 'START_BOOKING',
                text: 'Procediendo con la reserva...',
                displayType: 'form',
                data: contextState,
                newState: null
            };
        } else if (q === 'no' || q === 'cancelar') {
            return {
                intent: 'UNKNOWN',
                text: 'Entendido. Reserva cancelada. ¿En qué más te puedo ayudar?',
                displayType: 'text',
                newState: null
            };
        }
    }

    // 1. GREETINGS
    if (q.length < 15 && (q.includes('hola') || q.includes('buenos días') || q.includes('quien eres'))) {
        return {
            intent: 'GREETING',
            text: '¡Hola! Soy tu asistente de IA. Puedo decirte qué días están libres la próxima semana o qué hay programado para hoy. ¿Qué deseas consultar?',
            displayType: 'text',
            newState: null
        };
    }

    // 2. AI DEEP PROCESSING
    try {
        const response = await fetch(`${API_URL}/assistance/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, today: format(new Date(), 'yyyy-MM-dd') })
        });
        
        if (!response.ok) throw new Error('AI Error');
        const { interpretation } = await response.json();

        // 3. EXECUTE LOGIC BASED ON AI INTERPRETATION
        if (interpretation.intent === 'AVAILABILITY') {
            const primaryAuditorio = auditorios[0];
            if (!primaryAuditorio) return { intent: 'UNKNOWN', text: 'No encontré auditorios configurados.', displayType: 'text' };

            // MULTI-DAY SUPPORT (WEEK)
            if (interpretation.range === 'week') {
                const startDate = interpretation.date ? parseISO(interpretation.date) : today;
                let report = `Reporte de disponibilidad (Próximos 7 días) para ${primaryAuditorio.nombre}:\n\n`;
                let freeFound = false;

                for (let i = 0; i < 7; i++) {
                    const checkDate = new Date(startDate);
                    checkDate.setDate(startDate.getDate() + i);
                    
                    const events = rawEvents.filter(e => 
                        isSameDay(parseISO(e.fecha_inicio), checkDate) && 
                        String(e.auditorio_id) === String(primaryAuditorio.id)
                    );

                    const hasMorning = events.some(e => e.jornada === 'MAÑANA' || e.jornada === 'TODO_EL_DIA');
                    const hasAfternoon = events.some(e => e.jornada === 'TARDE' || e.jornada === 'TODO_EL_DIA');

                    const dayName = format(checkDate, 'EEEE d', { locale: es });
                    
                    if (!hasMorning && !hasAfternoon) {
                        report += `✅ ${dayName}: LIBRE TODO EL DÍA\n`;
                        freeFound = true;
                    } else if (!hasMorning) {
                        report += `⚖️ ${dayName}: Libre por la MAÑANA\n`;
                        freeFound = true;
                    } else if (!hasAfternoon) {
                        report += `⚖️ ${dayName}: Libre por la TARDE\n`;
                        freeFound = true;
                    }
                }

                return {
                    intent: 'AVAILABILITY',
                    text: freeFound ? report : "Lo siento, parece que todo está ocupado los próximos 7 días.",
                    displayType: 'text'
                };
            }

            // SINGLE DAY SUPPORT
            const targetDate = interpretation.date ? parseISO(interpretation.date) : today;
            const targetJornada = interpretation.jornada;
            
            const events = rawEvents.filter(e => 
                isSameDay(parseISO(e.fecha_inicio), targetDate) && 
                String(e.auditorio_id) === String(primaryAuditorio.id)
            );

            const hasMorning = events.some(e => e.jornada === 'MAÑANA' || e.jornada === 'TODO_EL_DIA' || e.jornada === 'MANANA');
            const hasAfternoon = events.some(e => e.jornada === 'TARDE' || e.jornada === 'TODO_EL_DIA');

            if (targetJornada === 'MAÑANA' || targetJornada === 'MANANA') {
                if (!hasMorning) {
                    return {
                        intent: 'AVAILABILITY',
                        text: `Sí, la mañana del ${format(targetDate, "d 'de' MMMM", { locale: es })} está LIBRE. ¿Deseas agendarlo?`,
                        displayType: 'text',
                        newState: { waitingConfirmation: true, targetDate: format(targetDate, 'yyyy-MM-dd'), auditorioId: primaryAuditorio.id, auditorioNombre: primaryAuditorio.nombre, jornada: 'MAÑANA' }
                    };
                }
                return { intent: 'AVAILABILITY', text: `Lo siento, la mañana del ${format(targetDate, "d 'de' MMMM", { locale: es })} ya tiene un evento.`, displayType: 'text' };
            }

            if (targetJornada === 'TARDE') {
                if (!hasAfternoon) {
                    return {
                        intent: 'AVAILABILITY',
                        text: `La tarde del ${format(targetDate, "d 'de' MMMM", { locale: es })} está LIBRE (2 PM a 6 PM). ¿Deseas agendarlo?`,
                        displayType: 'text',
                        newState: { waitingConfirmation: true, targetDate: format(targetDate, 'yyyy-MM-dd'), auditorioId: primaryAuditorio.id, auditorioNombre: primaryAuditorio.nombre, jornada: 'TARDE' }
                    };
                }
                return { intent: 'AVAILABILITY', text: `La tarde del ${format(targetDate, "d 'de' MMMM", { locale: es })} ya está ocupada.`, displayType: 'text' };
            }

            if (!hasMorning && !hasAfternoon) {
                return {
                    intent: 'AVAILABILITY',
                    text: `${primaryAuditorio.nombre} está LIBRE todo el día el ${format(targetDate, "d 'de' MMMM", { locale: es })}. ¿Deseas agendar?`,
                    displayType: 'text',
                    newState: { waitingConfirmation: true, targetDate: format(targetDate, 'yyyy-MM-dd'), auditorioId: primaryAuditorio.id, auditorioNombre: primaryAuditorio.nombre }
                };
            }
            
            let detailText = `Para el ${format(targetDate, "d 'de' MMMM", { locale: es })}: `;
            if (hasMorning && hasAfternoon) detailText += "Está totalmente ocupado.";
            else if (hasMorning) detailText += "Ocupado en la mañana, pero LIBRE en la tarde.";
            else detailText += "LIBRE en la mañana, pero ocupado en la tarde.";

            return { intent: 'AVAILABILITY', text: detailText, displayType: 'text' };
        }

        if (interpretation.intent === 'AGENDA') {
             const targetDate = interpretation.date ? parseISO(interpretation.date) : today;
             const dayEvents = rawEvents.filter(e => isSameDay(parseISO(e.fecha_inicio), targetDate));
             
             if (dayEvents.length === 0) {
                 return { intent: 'AGENDA', text: `No hay eventos registrados para el ${format(targetDate, "d 'de' MMMM", { locale: es })}.`, displayType: 'text' };
             }
             return {
                 intent: 'AGENDA',
                 text: `Agenda para el ${format(targetDate, "d 'de' MMMM", { locale: es })}:`,
                 data: dayEvents,
                 displayType: 'list'
             };
        }

        if (interpretation.intent === 'GREETING') {
            return {
                intent: 'GREETING',
                text: '¡Hola! Soy tu asistente de IA. ¿En qué puedo ayudarte hoy? Puedo verificar disponibilidad o mostrarte la agenda.',
                displayType: 'text'
            };
        }

    } catch (err: any) {
        console.error("Assistance Engine Error:", err);
        return {
            intent: 'UNKNOWN',
            text: `Hubo un problema técnico (${err.message}). Asegúrate de que la API Key de Google esté configurada correctamente en el servidor.`,
            displayType: 'text',
            newState: null
        };
    }

    // Default Fallback
    console.warn("Assistance Engine: Fallback triggered for query:", query);
    return {
        intent: 'UNKNOWN',
        text: 'Lo siento, no entendí bien la consulta o no pude procesar la respuesta. Prueba con algo más específico como: "¿Qué tardes hay libres la próxima semana?" o "Agenda de mañana".',
        displayType: 'text',
        newState: null
    };
};

