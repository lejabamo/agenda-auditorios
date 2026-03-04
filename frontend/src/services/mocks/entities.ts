import type { Entity } from '@/types/models/entity';

export const MOCK_ENTITIES: Entity[] = [
    // --- Entidades Internas (Secretarías / Oficinas) ---
    { id: '1', officialName: 'Secretaría General de Gobierno', acronym: 'SEGEGOB', type: 'INTERNAL', isActive: true },
    { id: '2', officialName: 'Secretaría de Hacienda y Finanzas', acronym: 'SHF', type: 'INTERNAL', isActive: true },
    { id: '3', officialName: 'Secretaría de Educación Pública', acronym: 'SEP', type: 'INTERNAL', isActive: true },
    { id: '4', officialName: 'Secretaría de Salud', acronym: 'SALUD', type: 'INTERNAL', isActive: true },
    { id: '5', officialName: 'Secretaría de Desarrollo Urbano', acronym: 'SEDU', type: 'INTERNAL', isActive: true },
    { id: '6', officialName: 'Secretaría de Obras Públicas', acronym: 'SOP', type: 'INTERNAL', isActive: true },
    { id: '7', officialName: 'Secretaría de Cultura', acronym: 'CULTURA', type: 'INTERNAL', isActive: true },
    { id: '8', officialName: 'Secretaría de Turismo', acronym: 'TURISMO', type: 'INTERNAL', isActive: true },
    { id: '9', officialName: 'Secretaría de Seguridad Pública', acronym: 'SSP', type: 'INTERNAL', isActive: true },
    { id: '10', officialName: 'Secretaría de Desarrollo Económico', acronym: 'SEDECO', type: 'INTERNAL', isActive: true },
    { id: '11', officialName: 'Oficina del Gobernador', type: 'INTERNAL', isActive: true },
    { id: '12', officialName: 'Dirección de Comunicación Social', acronym: 'DCS', type: 'INTERNAL', isActive: true },
    { id: '13', officialName: 'Dirección de Recursos Humanos', type: 'INTERNAL', isActive: true },
    { id: '14', officialName: 'Dirección de Tecnologías de la Información', acronym: 'DTI', type: 'INTERNAL', isActive: true },
    { id: '15', officialName: 'Dirección de Patrimonio', type: 'INTERNAL', isActive: true },
    { id: '16', officialName: 'Dirección Jurídica', type: 'INTERNAL', isActive: true },
    { id: '17', officialName: 'Coordinación de Asuntos Internacionales', type: 'INTERNAL', isActive: true },
    { id: '18', officialName: 'Instituto de la Juventud', acronym: 'INJUVE', type: 'INTERNAL', isActive: true },
    { id: '19', officialName: 'Instituto de la Mujer', type: 'INTERNAL', isActive: true },
    { id: '20', officialName: 'Instituto del Deporte', acronym: 'INDE', type: 'INTERNAL', isActive: true },
    { id: '21', officialName: 'Contraloría Interna', type: 'INTERNAL', isActive: true },
    { id: '22', officialName: 'Unidad de Transparencia', type: 'INTERNAL', isActive: true },

    // --- Entidades Externas ---
    { id: '23', officialName: 'Ministerio de Ambiente y Energía', acronym: 'MINAE', type: 'EXTERNAL', isActive: true },
    { id: '24', officialName: 'Universidad Nacional Autónoma', acronym: 'UNAM', type: 'EXTERNAL', isActive: true },
    { id: '25', officialName: 'Cámara de Comercio de la Ciudad', acronym: 'CANACO', type: 'EXTERNAL', isActive: true },
];
