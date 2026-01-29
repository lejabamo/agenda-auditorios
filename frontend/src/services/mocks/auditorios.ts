import { Auditorio } from '@/types/models/auditorio';

export const MOCK_AUDITORIOS: Auditorio[] = [
    {
        id: 'aud-001',
        nombre: 'Auditorio Principal "Centenario"',
        ubicacion: 'Edificio A - Planta Baja',
        capacidad: 300,
        descripcion: 'Espacio ideal para ceremonias, conferencias magistrales y eventos de gran convocatoria. Cuenta con escenario elevado y acústica profesional.',
        activo: true,
        recursos: ['Proyector 4K', 'Sistema de Sonido 7.1', 'Aire Acondicionado', 'Podium'],
    },
    {
        id: 'aud-002',
        nombre: 'Sala de Usos Múltiples "Libertad"',
        ubicacion: 'Edificio B - Piso 2',
        capacidad: 80,
        descripcion: 'Sala versátil con mobiliario móvil, perfecta para talleres, capacitaciones grupales y dinámicas de trabajo.',
        activo: true,
        recursos: ['Proyector HD', 'Pizarra Blanca', 'Mesas Modulares'],
    },
    {
        id: 'aud-003',
        nombre: 'Auditorio Pequeño "Innovación"',
        ubicacion: 'Edificio C - Planta Alta',
        capacidad: 45,
        descripcion: 'Espacio íntimo optimizado para presentaciones ejecutivas, defensas de tesis o reuniones de alta dirección.',
        activo: true,
        recursos: ['Pantalla LED 85"', 'Videoconferencia', 'Conexión a Internet Dedicada'],
    },
    {
        id: 'aud-004',
        nombre: 'Sala de Conferencias "Reforma"',
        ubicacion: 'Anexo Administrativo',
        capacidad: 120,
        descripcion: 'Sala clásica en remodelación. Actualmente no disponible para préstamos externos.',
        activo: false, // Inactivo para pruebas de filtrado
        recursos: ['Proyector Básico', 'Microfonía Alámbrica'],
    },
];
