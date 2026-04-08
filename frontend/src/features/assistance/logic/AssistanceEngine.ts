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

    // 0. CHECK CONVERSATION STATE (Daredevil Action Flow stays local)
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

    // 1. GREETINGS (Local for speed)
    if (q.length < 15 && (q.includes('hola') || q.includes('buenos días') || q.includes('quien eres'))) {
        return {
            intent: 'GREETING',
            text: '¡Hola! Soy tu asistente de agenda con IA. Puedo decirte qué espacios están libres o mostrarte la agenda de la semana. ¿Qué necesitas saber?',
            displayType: 'text',
            newState: null
        };
    }

    // 2. AI DEEP PROCESSING (Call Backend)
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
            const targetDate = interpretation.date ? parseISO(interpretation.date) : today;
            const targetJornada = interpretation.jornada; // MAÑANA / TARDE / TODO_EL_DIA
            
            // For now, primary auditorium logic
            const primaryAuditorio = auditorios[0];
            if (primaryAuditorio) {
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
                            newState: { waitingConfirmation: true, targetDate: format(targetDate, 'yyyy-MM-dd'), auditorioId: primaryAuditorio.id, auditorioNombre: primaryAuditorio.nombre }
                        };
                    } else {
                        return { intent: 'AVAILABILITY', text: `Lo siento, la mañana del ${format(targetDate, "d 'de' MMMM", { locale: es })} ya está ocupada.`, displayType: 'text' };
                    }
                }

                if (targetJornada === 'TARDE') {
                    if (!hasAfternoon) {
                        return {
                            intent: 'AVAILABILITY',
                            text: `La tarde del ${format(targetDate, "d 'de' MMMM", { locale: es })} está LIBRE (de 2 PM a 6 PM). ¿Deseas agendarlo?`,
                            displayType: 'text',
                            newState: { waitingConfirmation: true, targetDate: format(targetDate, 'yyyy-MM-dd'), auditorioId: primaryAuditorio.id, auditorioNombre: primaryAuditorio.nombre }
                        };
                    } else {
                        return { intent: 'AVAILABILITY', text: `La tarde del ${format(targetDate, "d 'de' MMMM", { locale: es })} ya tiene eventos programados.`, displayType: 'text' };
                    }
                }

                // General day check
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
        }

        if (interpretation.intent === 'AGENDA') {
             // Basic daily filter for now, can be expanded to range filter if interpretation.range is 'week'
             const targetDate = interpretation.date ? parseISO(interpretation.date) : today;
             const dayEvents = rawEvents.filter(e => isSameDay(parseISO(e.fecha_inicio), targetDate));
             
             if (dayEvents.length === 0) {
                 return { intent: 'AGENDA', text: `No hay eventos para el ${format(targetDate, "d 'de' MMMM", { locale: es })}.`, displayType: 'text' };
             }
             return {
                 intent: 'AGENDA',
                 text: `Eventos para el ${format(targetDate, "d 'de' MMMM", { locale: es })}:`,
                 data: dayEvents,
                 displayType: 'list'
             };
        }

    } catch (err) {
        console.error("Assistance Engine V2 Error:", err);
    }


    return {
        intent: 'UNKNOWN',
        text: 'No estoy seguro. Prueba algo como: "¿Qué hay libre mañana tarde?", "¿Agenda del lunes?" o "¿Está disponible el viernes 10?".',
        displayType: 'text',
        newState: null
    };
};

