import { Auditorio } from '@/types/models/auditorio';
import { MOCK_AUDITORIOS } from './mocks/auditorios';

const SIMULATED_DELAY_MS = 300;

export const auditorioService = {
    /**
     * Obtiene la lista de todos los auditorios activos.
     * Útil para listados de selección o catálogos.
     */
    getActiveAuditorios: async (): Promise<Auditorio[]> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const activeAuditorios = MOCK_AUDITORIOS.filter((a) => a.activo);
                resolve(activeAuditorios);
            }, SIMULATED_DELAY_MS);
        });
    },

    /**
     * Obtiene la lista completa (incluyendo inactivos).
     * Útil para paneles de administración.
     */
    getAllAuditorios: async (): Promise<Auditorio[]> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([...MOCK_AUDITORIOS]);
            }, SIMULATED_DELAY_MS);
        });
    },

    /**
     * Busca un auditorio específico por su ID.
     * @param id Identificador único del auditorio
     */
    getAuditorioById: async (id: string): Promise<Auditorio | undefined> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const found = MOCK_AUDITORIOS.find((a) => a.id === id);
                resolve(found);
            }, SIMULATED_DELAY_MS);
        });
    }
};
