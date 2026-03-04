const API_URL = 'http://localhost:5000/api';

export interface Dependencia {
    id: number;
    nombre: string;
    tipo: string;
    sigla?: string;
    activa: boolean;
}

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const dependenciaService = {
    getAll: async (): Promise<Dependencia[]> => {
        const response = await fetch(`${API_URL}/dependencias/`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Error al cargar dependencias');
        return await response.json();
    },

    getById: async (id: number): Promise<Dependencia> => {
        const response = await fetch(`${API_URL}/dependencias/${id}`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Error al cargar dependencia');
        return await response.json();
    },

    create: async (data: Partial<Dependencia>): Promise<Dependencia> => {
        const response = await fetch(`${API_URL}/dependencias/`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (response.status === 401) throw new Error('Tu sesión ha expirado. Por favor, cierra sesión y vuelve a ingresar.');
        if (!response.ok) throw new Error('Error al crear dependencia');
        return await response.json();
    },

    update: async (id: number, data: Partial<Dependencia>): Promise<Dependencia> => {
        const response = await fetch(`${API_URL}/dependencias/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (response.status === 401) throw new Error('Tu sesión ha expirado. Por favor, cierra sesión y vuelve a ingresar.');
        if (!response.ok) throw new Error('Error al actualizar dependencia');
        return await response.json();
    },

    delete: async (id: number): Promise<{ message: string }> => {
        const response = await fetch(`${API_URL}/dependencias/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (response.status === 401) throw new Error('Tu sesión ha expirado. Por favor, cierra sesión y vuelve a ingresar.');
        if (!response.ok) throw new Error('Error al desactivar dependencia');
        return await response.json();
    }
};
