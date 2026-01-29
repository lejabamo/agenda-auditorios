import { Entity } from '@/types/models/entity';
import { MOCK_ENTITIES } from './mocks/entities';

// Simula un retardo de red
const SIMULATED_DELAY_MS = 400;

export const entityService = {
    /**
     * Busca entidades por nombre o sigla (mock).
     * @param query Texto a buscar
     * @returns Promesa con lista de entidades filtradas
     */
    searchEntities: async (query: string): Promise<Entity[]> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (!query.trim()) {
                    resolve([]);
                    return;
                }

                const lowerQuery = query.toLowerCase();

                const results = MOCK_ENTITIES.filter((entity) => {
                    const matchName = entity.officialName.toLowerCase().includes(lowerQuery);
                    const matchAcronym = entity.acronym?.toLowerCase().includes(lowerQuery);
                    return matchName || matchAcronym;
                });

                // Ordenar: Coincidencias exactas o inicio de palabra primero (mock simple logic)
                results.sort((a, b) => {
                    const aStarts = a.officialName.toLowerCase().startsWith(lowerQuery);
                    const bStarts = b.officialName.toLowerCase().startsWith(lowerQuery);
                    if (aStarts && !bStarts) return -1;
                    if (!aStarts && bStarts) return 1;
                    return 0;
                });

                // Limitar resultados para simular paginación o límites de API
                resolve(results.slice(0, 10));
            }, SIMULATED_DELAY_MS);
        });
    },

    /**
     * Obtiene una entidad por ID
     * @param id ID de la entidad
     */
    getEntityById: async (id: string): Promise<Entity | undefined> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const entity = MOCK_ENTITIES.find(e => e.id === id);
                resolve(entity);
            }, SIMULATED_DELAY_MS);
        });
    }
};
