import type { Entity } from '@/types/models/entity';
import type { Auditorio } from '@/types/models/auditorio';
import type { Jornada } from '@/features/solicitud/steps/Step2AuditorioFecha';

// Define the shape of the Wizard Data (incoming)
export interface WizardData {
    entity: Entity | null;
    auditorio: Auditorio | null;
    fecha: string;
    jornada: Jornada | '';
    horaInicio: string;
    horaFin: string;
    titulo: string;
    descripcion: string;
    aforo_estimado: number | '';
    requerimientos_tecnicos: string[];
    tipo_evento: string;
    responsable_nombre: string;
    responsable_cargo: string;
    responsable_telefono: string;
    correo_confirmacion: string;
    holdId?: number;
}

// Define the shape of the Backend Payload (outgoing)
export interface CreateBookingPayload {
    titulo: string;
    descripcion: string;
    auditorio_id: number;
    entidad_id: string;
    fecha: string;
    jornada: string;
    aforo_estimado: number;
    requerimientos_tecnicos: string[];
    tipo_evento: string;
    responsable: {
        nombre: string;
        cargo: string;
        telefono: string;
        email: string;
    };
}

export const solicitudBookingService = {
    submitRequest: async (data: WizardData): Promise<void> => {
        // Validation check (double check)
        if (!data.entity || !data.auditorio || !data.fecha || !data.jornada) {
            console.error('Missing critical data for submission');
            throw new Error('Datos incompletos');
        }

        // Map WizardData to Backend Payload
        const payload: CreateBookingPayload = {
            titulo: data.titulo,
            descripcion: data.descripcion,
            auditorio_id: data.auditorio.id,
            entidad_id: data.entity.id,
            fecha: data.fecha,
            jornada: data.jornada,
            // Force cast to number since validation ensures it's not empty string here
            aforo_estimado: Number(data.aforo_estimado),
            requerimientos_tecnicos: data.requerimientos_tecnicos,
            tipo_evento: data.tipo_evento,
            responsable: {
                nombre: data.responsable_nombre,
                cargo: data.responsable_cargo,
                telefono: data.responsable_telefono,
                email: data.correo_confirmacion
            }
        };

        // Simulate API call
        console.group('🚀 Submitting Request via solicitudBookingService');
        console.log('Payload prepared for Evento.create():');
        console.log(JSON.stringify(payload, null, 2));
        console.groupEnd();

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        return Promise.resolve();
    }
};
