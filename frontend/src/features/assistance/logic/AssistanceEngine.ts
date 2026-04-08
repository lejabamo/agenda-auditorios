import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale/es';

export type AssistanceIntent = 'AVAILABILITY' | 'AGENDA' | 'GREETING' | 'START_BOOKING' | 'UNKNOWN';

export interface AssistanceResponse {
    intent: AssistanceIntent;
    text: string;
    data?: any;
    displayType: 'text' | 'list' | 'matrix' | 'form';
    newState?: any;
}

export const processQuery = (query: string, rawEvents: any[], auditorios: any[], contextState: any = null): AssistanceResponse => {
    const q = query.toLowerCase().trim();
    const today = new Date();

    // 0. CHECK CONVERSATION STATE (Daredevil Action Flow)
    if (contextState && contextState.waitingConfirmation) {
        if (q === 'si' || q === 'sí' || q === 'claro' || q === 'agendar' || q === 'yes') {
            return {
                intent: 'START_BOOKING',
                text: 'Procediendo con la reserva...',
                displayType: 'form',
                data: contextState, // Passed to wizard
                newState: null      // Reset state
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
    if (q.includes('hola') || q.includes('buenos días') || q.includes('quien eres')) {
        return {
            intent: 'GREETING',
            text: '¡Hola! Soy tu asistente de agenda. Puedo decirte qué espacios están libres o mostrarte la agenda de la semana. ¿Qué necesitas saber?',
            displayType: 'text',
            newState: null
        };
    }

    // 2. AGENDA (Events)
    if (q.includes('agenda') || q.includes('que hay') || q.includes('eventos')) {
        let targetDate = today;
        let periodLabel = 'hoy';

        if (q.includes('mañana')) {
            targetDate = addDays(today, 1);
            periodLabel = 'mañana';
        } else if (q.includes('semana')) {
            const start = startOfWeek(today, { locale: es });
            const end = endOfWeek(today, { locale: es });
            const weekEvents = rawEvents.filter(e => {
                const d = parseISO(e.fecha_inicio);
                return d >= start && d <= end;
            });
            return {
                intent: 'AGENDA',
                text: `Aquí tienes la agenda de esta semana (${weekEvents.length} eventos encontrados):`,
                data: weekEvents,
                displayType: 'list',
                newState: null
            };
        }

        const dayEvents = rawEvents.filter(e => isSameDay(parseISO(e.fecha_inicio), targetDate));
        if (dayEvents.length === 0) {
            return {
                intent: 'AGENDA',
                text: `No hay eventos programados para ${periodLabel}. El auditorio está totalmente libre.`,
                displayType: 'text',
                newState: null
            };
        }

        return {
            intent: 'AGENDA',
            text: `Eventos para ${periodLabel}:`,
            data: dayEvents,
            displayType: 'list',
            newState: null
        };
    }

    // 3. AVAILABILITY (Free slots)
    if (q.includes('libre') || q.includes('disponible') || q.includes('disponibilidad')) {
        const mentionedAuditorio = auditorios.find(a => q.includes(a.nombre.toLowerCase()));
        const targetAuditorios = mentionedAuditorio ? [mentionedAuditorio] : auditorios;
        
        let targetDate = today;
        if (q.includes('mañana')) targetDate = addDays(today, 1);

        // Assume we handle only one auditorium for the Daredevil action flow mapping
        const primaryAuditorio = targetAuditorios[0];
        if (primaryAuditorio) {
            const events = rawEvents.filter(e => 
                isSameDay(parseISO(e.fecha_inicio), targetDate) && 
                String(e.auditorio_id) === String(primaryAuditorio.id)
            );
            const morning = events.some(e => e.jornada === 'MAÑANA' || e.jornada === 'TODO_EL_DIA' || e.jornada === 'MANANA');
            const afternoon = events.some(e => e.jornada === 'TARDE' || e.jornada === 'TODO_EL_DIA');

            if (!morning && !afternoon) {
                return {
                    intent: 'AVAILABILITY',
                    text: `${primaryAuditorio.nombre} está LIBRE todo el día el ${format(targetDate, "d 'de' MMMM", { locale: es })}. ¿Deseas agendarlo? Escribe 'Sí'.`,
                    data: null,
                    displayType: 'text',
                    newState: {
                        waitingConfirmation: true,
                        targetDate: format(targetDate, 'yyyy-MM-dd'),
                        auditorioId: primaryAuditorio.id,
                        auditorioNombre: primaryAuditorio.nombre
                    }
                };
            }
        }

        const summaries = targetAuditorios.map(aud => {
            const events = rawEvents.filter(e => 
                isSameDay(parseISO(e.fecha_inicio), targetDate) && 
                String(e.auditorio_id) === String(aud.id)
            );
            const morning = events.some(e => e.jornada === 'MAÑANA' || e.jornada === 'TODO_EL_DIA' || e.jornada === 'MANANA');
            const afternoon = events.some(e => e.jornada === 'TARDE' || e.jornada === 'TODO_EL_DIA');

            if (!morning && !afternoon) return `${aud.nombre} está LIBRE todo el día.`;
            if (morning && afternoon) return `${aud.nombre} está OCUPADO todo el día.`;
            if (morning) return `${aud.nombre} está OCUPADO en la mañana, pero LIBRE en la tarde.`;
            return `${aud.nombre} está LIBRE en la mañana, pero OCUPADO en la tarde.`;
        });

        return {
            intent: 'AVAILABILITY',
            text: `Estado de disponibilidad para ${format(targetDate, "eeee d 'de' MMMM", { locale: es })}:`,
            data: summaries,
            displayType: 'list',
            newState: null
        };
    }

    return {
        intent: 'UNKNOWN',
        text: 'No estoy seguro de qué necesitas. Prueba preguntando: "¿Qué hay libre hoy?", "¿Agenda de la semana?" o "¿Disponibilidad para mañana?".',
        displayType: 'text',
        newState: null
    };
};
