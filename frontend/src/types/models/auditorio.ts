export interface Auditorio {
    id: number;
    nombre: string;
    ubicacion: string;
    capacidad: number;
    descripcion?: string;
    activo: boolean;
    imagenUrl?: string; // Opcional: Para mostrar en la tarjeta UI
    recursos?: string[]; // Opcional: Lista de equipamiento básico
}
