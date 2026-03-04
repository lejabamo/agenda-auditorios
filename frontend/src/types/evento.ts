export type Jornada = 'MAÑANA' | 'TARDE' | 'TODO_EL_DIA';

export type EventoStatus = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'CANCELADO' | 'BLOQUEO_TEMPORAL';

export interface CalendarEvent {
    id: number;
    title: string;
    start: Date;
    end: Date;
    resource?: any;
    status: EventoStatus | string;
}

export interface SelectedSlot {
    auditorioId: number;
    fechaInicio: string; // ISO
    fechaFin: string; // ISO
    jornada: Jornada;
    status: 'HOLD';
    holdId?: number;
}
