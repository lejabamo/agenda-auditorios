import type { Auditorio } from '@/types/models/auditorio';

const API_URL = import.meta.env.VITE_API_URL + '/auditorios';


export const auditorioService = {
    /**
     * Obtiene la lista de todos los auditorios activos.
     * Útil para listados de selección o catálogos.
     */
    getActiveAuditorios: async (): Promise<Auditorio[]> => {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error('Error al obtener auditorios');
            }
            const data = await response.json();

            // Normalize and validates data
            const normalizedData = Array.isArray(data) ? data.map((item: any) => ({
                id: Number(item.id), // Ensure number
                nombre: String(item.nombre || 'Sin nombre'),
                ubicacion: String(item.ubicacion || ''),
                capacidad: Number(item.capacidad || 0),
                descripcion: item.descripcion || '',
                activo: !!item.activo // Force boolean
            })) : [];

            return normalizedData.filter((a: Auditorio) => a.activo);
        } catch (error) {
            console.error('Error fetching auditorios:', error);
            // Fallback or empty list? Let's return empty list to prevent crash
            return [];
        }
    },

    /**
     * Obtiene la lista completa (incluyendo inactivos).
     * Útil para paneles de administración.
     */
    getAllAuditorios: async (): Promise<Auditorio[]> => {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Failed to fetch');
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    /**
     * Busca un auditorio específico por su ID.
     * @param id Identificador único del auditorio
     */
    getAuditorioById: async (id: number): Promise<Auditorio | undefined> => {
        try {
            const response = await fetch(`${API_URL}/${id}`);
            if (!response.ok) return undefined;
            return await response.json();
        } catch (error) {
            console.error(error);
            return undefined;
        }
    },

    create: async (auditorio: Partial<Auditorio>): Promise<Auditorio> => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(auditorio)
        });
        if (response.status === 401) {
            throw new Error('Tu sesión ha expirado. Por favor, cierra sesión y vuelve a ingresar.');
        }
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al crear auditorio');
        }
        return await response.json();
    },

    update: async (id: number, auditorio: Partial<Auditorio>): Promise<Auditorio> => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/${id}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(auditorio)
        });
        if (response.status === 401) {
            throw new Error('Tu sesión ha expirado. Por favor, cierra sesión y vuelve a ingresar.');
        }
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al actualizar auditorio');
        }
        return await response.json();
    },

    delete: async (id: number): Promise<void> => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/${id}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.status === 401) {
            throw new Error('Tu sesión ha expirado. Por favor, cierra sesión y vuelve a ingresar.');
        }
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar auditorio');
        }
    }
};
