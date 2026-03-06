import type { Entity } from '@/types/models/entity';


// Simula un retardo de red
const API_URL = import.meta.env.VITE_API_URL;


export const entityService = {
    /**
     * Busca entidades por nombre o sigla (desde Backend).
     * @param query Texto a buscar
     * @returns Promesa con lista de entidades filtradas
     */
    searchEntities: async (query: string): Promise<Entity[]> => {
        if (!query.trim()) return [];

        try {
            const response = await fetch(`${API_URL}/dependencias/`);
            if (!response.ok) throw new Error('Error al cargar dependencias');

            const data = await response.json();

            // Map backend "Dependencia" to frontend "Entity"
            // Backend: { id, nombre, tipo, sigla, activa }
            // Frontend: { id, officialName, type, isActive, acronym }
            const entities: Entity[] = data.map((d: any) => ({
                id: d.id.toString(), // Ensure string ID
                officialName: d.nombre,
                acronym: d.sigla,
                type: d.tipo === 'INTERNA' ? 'INTERNAL' : 'EXTERNAL', // Adjust mapping as needed
                isActive: d.activa,
                contactPerson: undefined // Backend doesn't send this yet
            }));

            // Client-side filtering (idealmente el backend filtra, pero por ahora...)
            const lowerQuery = query.toLowerCase();
            return entities.filter(e =>
                e.officialName.toLowerCase().includes(lowerQuery) ||
                (e.acronym && e.acronym.toLowerCase().includes(lowerQuery))
            ).slice(0, 10);

        } catch (error) {
            console.error("Error fetching dependencies:", error);
            return [];
        }
    },

    /**
     * Obtiene una entidad por ID
     * @param id ID de la entidad
     */
    getEntityById: async (id: string): Promise<Entity | undefined> => {
        try {
            const response = await fetch(`${API_URL}/dependencias/${id}`);
            if (!response.ok) return undefined;

            const d = await response.json();
            return {
                id: d.id.toString(),
                officialName: d.nombre,
                acronym: d.sigla,
                type: d.tipo === 'INTERNA' ? 'INTERNAL' : 'EXTERNAL',
                isActive: d.activa
            };
        } catch (error) {
            console.error("Error fetching dependency by ID:", error);
            return undefined;
        }
    }
};
