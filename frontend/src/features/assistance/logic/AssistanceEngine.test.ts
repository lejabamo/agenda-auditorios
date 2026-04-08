import { describe, it, expect } from 'vitest';
import { processQuery } from './AssistanceEngine';

describe('AssistanceEngine', () => {
    const mockAuditorios = [
        { id: 1, nombre: 'Auditorio Filomena' },
        { id: 2, nombre: 'Auditorio Paruro' }
    ];

    const mockEvents = [
        { 
            id: 1, 
            titulo: 'Evento Mañana', 
            fecha_inicio: new Date().toISOString().split('T')[0] + 'T09:00:00', 
            jornada: 'MAÑANA', 
            auditorio_id: 1 
        }
    ];

    it('should handle greetings', () => {
        const response = processQuery('Hola', [], []);
        expect(response.intent).toBe('GREETING');
        expect(response.text).toContain('¡Hola!');
    });

    it('should handle availability queries', () => {
        const response = processQuery('¿Qué hay libre hoy?', mockEvents, mockAuditorios);
        expect(response.intent).toBe('AVAILABILITY');
        expect(response.data).toContain('Auditorio Filomena está OCUPADO en la mañana, pero LIBRE en la tarde.');
    });

    it('should handle agenda queries', () => {
        const response = processQuery('agenda de hoy', mockEvents, mockAuditorios);
        expect(response.intent).toBe('AGENDA');
        expect(response.displayType).toBe('list');
        expect(response.data.length).toBe(1);
    });

    it('should handle unknown queries', () => {
        const response = processQuery('quiero una pizza', [], []);
        expect(response.intent).toBe('UNKNOWN');
    });
});
