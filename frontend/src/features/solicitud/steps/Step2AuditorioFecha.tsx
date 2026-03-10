import { useEffect } from 'react';
import type { Auditorio } from '@/types/models/auditorio';

export type Jornada = 'MAÑANA' | 'TARDE' | 'TODO_EL_DIA';

interface Step2Props {
    data: {
        auditorio: Auditorio | null;
        fecha: string;
        jornada: Jornada | '';
        horaInicio: string;
        horaFin: string;
        holdId?: number;
    };
    isAdminView?: boolean;
    onDataChange: (newData: Partial<any>) => void;
}

// Temporary static list since we only have one right now, or we could fetch from API
const AVAILABLE_AUDITORIOS: Auditorio[] = [
    { id: 1, nombre: 'Auditorio Filomena', capacidad: 60, ubicacion: 'Sede Central', activo: true }
];

export function Step2AuditorioFecha({ data, onDataChange, isAdminView }: Step2Props) {
    // When instantiated from mobile flow without a hold, allow selection.
    // When instantiated from desktop calendar flow, values will be pre-filled and we can show them as read-only or selected.

    const isReadOnly = !!data.holdId; // If there's a hold, they selected from calendar

    const handleAuditorioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = parseInt(e.target.value);
        const auditorio = AVAILABLE_AUDITORIOS.find(a => a.id === selectedId) || null;
        onDataChange({ auditorio });
    };

    const handleFechaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onDataChange({ fecha: e.target.value });
    };

    const handleJornadaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const jornada = e.target.value as Jornada | '';
        let horaInicio = '08:00';
        let horaFin = '18:00';

        if (jornada === 'MAÑANA') {
            horaFin = '12:00';
        } else if (jornada === 'TARDE') {
            horaInicio = '14:00';
        }

        onDataChange({ jornada, horaInicio, horaFin });
    };

    const handleTimeChange = (field: 'horaInicio' | 'horaFin', value: string) => {
        onDataChange({ [field]: value });
    };

    // Derived constraints for time inputs
    const getMinHoraInicio = () => {
        if (data.jornada === 'TARDE') return '14:00';
        return '08:00'; // Default min for MAÑANA or TODO_EL_DIA
    };

    const getMaxHoraFin = () => {
        if (data.jornada === 'MAÑANA') return '12:00';
        return '18:00'; // Default max for TARDE or TODO_EL_DIA
    };

    // Initialize with Auditorio Filomena if null
    useEffect(() => {
        if (!data.auditorio) {
            onDataChange({ auditorio: AVAILABLE_AUDITORIOS[0] });
        }
    }, [data.auditorio, onDataChange]);

    // Helper functions for formatting
    const getTodayStr = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
 
    const getTimeValidationError = () => {
        if (isAdminView || !data.fecha || !data.jornada) return "";
        const now = new Date();
        const selectedDate = new Date(data.fecha + 'T00:00:00');
        
        // Normalize today midnight
        const todayAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrowAtMidnight = new Date(todayAtMidnight);
        tomorrowAtMidnight.setDate(todayAtMidnight.getDate() + 1);
        
        const currentHour = now.getHours();
        
        // Build the full ISO-like string for our selected start time
        // Date input is YYYY-MM-DD, Time input is HH:mm
        const eventStart = new Date(`${data.fecha}T${data.horaInicio || '00:00'}:00`);
        const diffInHours = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60);
 
        if (selectedDate.getTime() === todayAtMidnight.getTime()) {
            // Same day rules
            if (currentHour >= 17) return "No es posible programar eventos para hoy después de las 17:00.";
            if (data.jornada === 'MAÑANA' && currentHour >= 12) return "No es posible programar la jornada MAÑANA para hoy.";
            if (data.jornada === 'TODO_EL_DIA' && currentHour >= 13) return "No es posible programar la jornada TODO_EL_DIA para hoy.";
        } else if (selectedDate.getTime() === tomorrowAtMidnight.getTime()) {
            // Tomorrow rules
            if (currentHour >= 17) return "La agenda para mañana ya está cerrada (solicite antes de las 17:00 de hoy).";
        }
 
        // Global 24h rule (Backend line 123)
        if (diffInHours < 24) {
             return "Las solicitudes deben realizarse con mínimo 24 horas de anticipación.";
        }
 
        return "";
    };
 
    return (
        <div className="space-y-6">
            {/* Time Validation Banner */}
            {(() => {
                const timeError = getTimeValidationError();
                if (!timeError) return null;
                return (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg animate-fade-in">
                        <div className="flex items-center gap-3 text-red-700">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            <span className="font-semibold text-sm">{timeError}</span>
                        </div>
                    </div>
                );
            })()}

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-[var(--primary-color)]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-blue-900">Selección de Horario y Espacio</h4>
                        <p className="text-sm text-blue-700 mt-1">
                            {isReadOnly
                                ? "La fecha y el auditorio han sido pre-seleccionados. Puede ajustar la jornada y las horas exactas si lo requiere."
                                : "Por favor seleccione el auditorio, la fecha y el horario en el que desea realizar su evento."}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label htmlFor="auditorio" className="block text-sm font-medium text-gray-700">
                        Auditorio / Espacio <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <select
                            id="auditorio"
                            value={data.auditorio?.id || ''}
                            onChange={handleAuditorioChange}
                            disabled={isReadOnly}
                            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-transparent ${isReadOnly ? 'bg-gray-100 cursor-not-allowed text-gray-600 font-medium' : 'bg-white border-gray-300'}`}
                        >
                            {AVAILABLE_AUDITORIOS.map(a => (
                                <option key={a.id} value={a.id}>{a.nombre}</option>
                            ))}
                        </select>
                    </div>
                    {data.auditorio && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            Capacidad: {data.auditorio.capacidad} personas max.
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="fecha" className="block text-sm font-medium text-gray-700">
                        Fecha del Evento <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        id="fecha"
                        value={data.fecha}
                        onChange={handleFechaChange}
                        min={getTodayStr()}
                        disabled={isReadOnly}
                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-transparent ${isReadOnly ? 'bg-gray-100 cursor-not-allowed text-gray-600 font-medium' : 'bg-white border-gray-300'}`}
                    />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label htmlFor="jornada" className="block text-sm font-medium text-gray-700">
                        Jornada <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="jornada"
                        value={data.jornada}
                        onChange={handleJornadaChange}
                        className="w-full px-4 py-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-transparent"
                    >
                        <option value="">Seleccione una jornada...</option>
                        <option value="MAÑANA">Mañana (08:00 AM - 12:00 PM)</option>
                        <option value="TARDE">Tarde (02:00 PM - 06:00 PM)</option>
                        <option value="TODO_EL_DIA">Todo el día (08:00 AM - 06:00 PM)</option>
                    </select>
                </div>
            </div>

            {data.jornada && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    <div className="space-y-2">
                        <label htmlFor="horaInicio" className="block text-sm font-medium text-gray-700">
                            Hora Inicio <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="time"
                            id="horaInicio"
                            value={data.horaInicio}
                            min={getMinHoraInicio()}
                            max={data.horaFin || getMaxHoraFin()}
                            step="60"
                            onChange={(e) => handleTimeChange('horaInicio', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-transparent bg-white"
                        />
                        <p className="text-xs text-gray-500">Mínimo: {getMinHoraInicio()}</p>
                    </div>
 
                    <div className="space-y-2">
                        <label htmlFor="horaFin" className="block text-sm font-medium text-gray-700">
                            Hora Fin <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="time"
                            id="horaFin"
                            value={data.horaFin}
                            min={data.horaInicio || getMinHoraInicio()}
                            max={getMaxHoraFin()}
                            step="60"
                            onChange={(e) => handleTimeChange('horaFin', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-transparent bg-white"
                        />
                        <p className="text-xs text-gray-500">Máximo: {getMaxHoraFin()}</p>
                    </div>
                </div>
            )}

            {/* Aviso removed as per user request */}
        </div>
    );
}
