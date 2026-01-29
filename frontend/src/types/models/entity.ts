export type EntityType = 'INTERNAL' | 'EXTERNAL';

export interface Contact {
    id: string;
    fullName: string;
    role: string;
    email: string;
    phone: string;
}

export interface Entity {
    id: string;
    officialName: string; // Nombre único y oficial
    acronym?: string;     // Sigla (ej. MINSA)
    type: EntityType;
    isActive: boolean;

    // Metadatos para UI que podrían venir del backend
    contactPerson?: Contact; // Contacto principal asociado si existe
}
