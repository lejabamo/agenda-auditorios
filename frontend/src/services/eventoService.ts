import type { WizardData } from './solicitudBookingService';

const API_URL = import.meta.env.VITE_API_URL;


export class ApiError extends Error {
    public status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
        this.name = 'ApiError';
    }
}

export const eventoService = {
    submitRequest: async (data: WizardData) => {
        return eventoService.sendData(data, true);
    },

    submitSolicitud: async (data: WizardData) => {
        return eventoService.sendData(data, false);
    },

    sendData: async (data: WizardData, isDryRun: boolean) => {
        // 1. Calculate Start/End dates
        // If specific hours are provided (from Wizard), use them
        // Otherwise fallback to Jornada defaults
        let startHourStr = '08:00';
        let endHourStr = '12:00';

        if (data.horaInicio && data.horaFin) {
            startHourStr = data.horaInicio;
            endHourStr = data.horaFin;
        } else {
            // Fallback logic
            if (data.jornada === 'TARDE') {
                startHourStr = '14:00';
                endHourStr = '18:00';
            } else if (data.jornada === 'TODO_EL_DIA') {
                startHourStr = '08:00';
                endHourStr = '18:00';
            }
        }

        // Send literal string to avoid Browser overriding local time to UTC 
        // e.g., '2026-03-04T08:00:00'

        // Validate Auditorio ID
        const auditorioId = Number(data.auditorio?.id);
        if (!data.auditorio || !data.auditorio.id || isNaN(auditorioId)) {
            throw new ApiError('Auditorio inválido o no seleccionado', 400);
        }

        // 2. Construct Payload
        const payload = {
            titulo: data.titulo,
            descripcion: data.descripcion,
            aforo_estimado: Number(data.aforo_estimado),
            fecha_inicio: `${data.fecha}T${startHourStr}:00`,
            fecha_fin: `${data.fecha}T${endHourStr}:00`,
            jornada: data.jornada,
            auditorio_id: auditorioId,
            dependencia_id: data.entity?.id ? String(data.entity.id) : undefined, // Ensure ID is string if logic requires, or just pass as is but verify type
            responsable_nombre: data.responsable_nombre,
            responsable_cargo: data.responsable_cargo,
            tipo_evento: data.tipo_evento,
            responsable_telefono: data.responsable_telefono,
            correo_confirmacion: data.correo_confirmacion,
            requerimientos_tecnicos: data.requerimientos_tecnicos,
            dry_run: isDryRun,
            requiere_microfono: data.requerimientos_tecnicos.includes('Microfono'),
            requiere_videobeam: data.requerimientos_tecnicos.includes('Videobeam'),
            requiere_sonido: data.requerimientos_tecnicos.includes('Sonido'),
            requiere_asistencia_tecnica: data.requerimientos_tecnicos.includes('Asistencia técnica'),
            // Optional Hold ID for transition
            hold_id: data.holdId
        };

        // 3. Send Request
        // 3. Send Request
        // 3. Send Request
        try {
            console.log("=== EVENTOSERVICE FETCH DEBUG ===");
            console.log("URL:", `${API_URL}/eventos/`);
            console.log("Headers:", { 'Content-Type': 'application/json' });
            console.log("Payload:", JSON.stringify(payload, null, 2));
            console.log("Types Check:");
            console.log(`- auditorio_id: ${typeof payload.auditorio_id} (${payload.auditorio_id})`);
            console.log(`- dependencia_id: ${typeof payload.dependencia_id} (${payload.dependencia_id})`);
            console.log(`- fecha_inicio: ${typeof payload.fecha_inicio} (${payload.fecha_inicio})`);
            console.log(`- fecha_fin: ${typeof payload.fecha_fin} (${payload.fecha_fin})`);
            console.log("=================================");

            const response = await fetch(`${API_URL}/eventos/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const contentType = response.headers.get('content-type');
            const isJson = contentType && contentType.includes('application/json');

            if (response.ok) {
                if (isJson) {
                    return await response.json();
                }
                return { success: true };
            }

            // Error Handling (response.ok === false)
            if (isJson) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    console.error('Failed to parse error JSON:', e);
                    throw new ApiError('Error inesperado del servidor', 500);
                }
                const msg = errorData.debug ? `${errorData.message}: ${errorData.debug}` : (errorData.message || 'Error en la solicitud');
                throw new ApiError(msg, response.status);
            } else {
                // Read text for debugging but show safe generic message
                const rawText = await response.text();
                // Check if it's a 404/500 HTML page
                console.error('Backend returned non-JSON error:', rawText.substring(0, 200));
                throw new ApiError('Error del servidor al procesar la solicitud', response.status);
            }

        } catch (error) {
            console.error(isDryRun ? 'Error validating request:' : 'Error submitting request:', error);
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Error de conexión o del sistema', 500);
        }
    },

    getById: async (id: number | string) => {
        try {
            const response = await fetch(`${API_URL}/eventos/${id}`);
            if (!response.ok) {
                if (response.status === 404) return null;
                throw new ApiError('Error al consultar la solicitud', response.status);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching event:', error);
            throw error;
        }
    },

    createHold: async (data: { fecha: string; jornada: string; auditorio_id: number; hora_inicio?: string; hora_fin?: string }) => {
        try {
            // Validate payload before sending
            if (!data.fecha || !data.jornada || !data.auditorio_id) {
                throw new ApiError('Datos incompletos para bloqueo', 400);
            }

            const response = await fetch(`${API_URL}/eventos/hold`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const contentType = response.headers.get('content-type');
            if (!response.ok) {
                if (contentType && contentType.includes('application/json')) {
                    const err = await response.json();
                    const msg = err.debug ? `${err.message}: ${err.debug}` : (err.message || 'Espacio no disponible');
                    throw new ApiError(msg, response.status);
                } else {
                    throw new ApiError('Error del servidor (404/500)', response.status);
                }
            }

            return await response.json(); // Returns { success: true, id: ..., data: ... }
        } catch (error) {
            console.error('Error in createHold:', error);
            throw error;
        }
    },

    // Admin Methods
    getEvents: async (filters: Record<string, string | number | undefined> = {}) => {
        try {
            // Filter out undefined values
            const cleanFilters: Record<string, string> = {};
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== '') {
                    cleanFilters[key] = String(value);
                }
            });

            const queryParams = new URLSearchParams(cleanFilters).toString();
            // Auth Header injection
            const token = localStorage.getItem('token');
            const headers: Record<string, string> = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_URL}/eventos/?${queryParams}`, {
                headers
            });
            if (!response.ok) throw new ApiError('Error al cargar solicitudes', response.status);
            return await response.json();
        } catch (error) {
            console.error('Error fetching events list:', error);
            throw error;
        }
    },

    updateStatus: async (
        id: number,
        status: 'APROBADO' | 'RECHAZADO',
        observacion?: string,
        motivo_rechazo?: string,
        nueva_fecha_inicio?: string,
        nueva_fecha_fin?: string,
        nueva_jornada?: string
    ) => {
        try {
            const payload = {
                estado: status,
                observacion,
                motivo_rechazo,
                nueva_fecha_inicio,
                nueva_fecha_fin,
                nueva_jornada
            };

            const response = await fetch(`${API_URL}/eventos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
                throw new ApiError(errorData.error || errorData.message || 'Error al actualizar estado', response.status);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error updating event ${id} status:`, error);
            throw error;
        }
    },

    cancel: async (id: number) => {
        try {
            const token = localStorage.getItem('token');
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_URL}/eventos/${id}`, {
                method: 'DELETE',
                headers
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
                throw new ApiError(errorData.message || 'Error al cancelar evento', response.status);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error canceling event ${id}:`, error);
            throw error;
        }
    },

    createAdminDirect: async (data: {
        titulo: string;
        descripcion?: string;
        fecha_inicio: string;
        fecha_fin: string;
        jornada: string;
        auditorio_id: number;
        dependencia_id?: string | number;
        responsable_nombre: string;
        responsable_telefono: string;
        correo_confirmacion: string;
        aforo_estimado?: number;
        tipo_evento?: string;
        requiere_microfono?: boolean;
        requiere_videobeam?: boolean;
        requiere_sonido?: boolean;
        requiere_asistencia_tecnica?: boolean;
    }) => {
        const token = localStorage.getItem('token');
        if (!token) throw new ApiError('No autenticado', 401);

        const response = await fetch(`${API_URL}/eventos/admin-direct`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        const json = await response.json().catch(() => ({ error: 'Respuesta inválida del servidor' }));
        if (!response.ok) {
            throw new ApiError(json.error || 'Error al crear evento', response.status);
        }
        return json;
    }
};

