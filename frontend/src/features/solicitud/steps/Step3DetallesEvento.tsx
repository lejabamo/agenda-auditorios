import type { Auditorio } from '@/types/models/auditorio';
import React from 'react';

interface Step3Props {
    data: {
        titulo: string;
        descripcion: string;
        aforo_estimado: number | '';
        requerimientos_tecnicos: string[];
        tipo_evento: string;
        jornada: string;
        horaInicio: string;
        horaFin: string;
    };
    auditorio: Auditorio | null; // Needed for validation
    onDataChange: (data: Partial<{
        titulo: string;
        descripcion: string;
        aforo_estimado: number | '';
        requerimientos_tecnicos: string[];
        tipo_evento: string;
        horaInicio: string;
        horaFin: string;
    }>) => void;
}

const TIPO_EVENTO_OPTIONS = [
    'Reunión',
    'Capacitación',
    'Acto Institucional',
    'Otro'
];

const REQUERIMIENTOS_OPTIONS = [
    'Microfono',
    'Videobeam',
    'Sonido',
    'Asistencia técnica'
];

export function Step3DetallesEvento({ data, auditorio, onDataChange }: Step3Props) {
    const handleTituloChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onDataChange({ titulo: e.target.value });
    };

    const handleTipoEventoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onDataChange({ tipo_evento: e.target.value });
    };

    const handleDescripcionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onDataChange({ descripcion: e.target.value });
    };

    const handleAforoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const num = val === '' ? '' : parseInt(val, 10);
        onDataChange({ aforo_estimado: num });
    };

    const handleRequerimientoToggle = (req: string) => {
        const current = data.requerimientos_tecnicos || [];
        if (current.includes(req)) {
            onDataChange({ requerimientos_tecnicos: current.filter(r => r !== req) });
        } else {
            onDataChange({ requerimientos_tecnicos: [...current, req] });
        }
    };

    const handleTimeChange = (field: 'horaInicio' | 'horaFin', value: string) => {
        onDataChange({ [field]: value });
    };

    // Helper to generate time options based on Jornada
    const getTimeOptions = () => {
        const options: string[] = [];
        let start = 8;
        let end = 18;

        if (data.jornada === 'MAÑANA') {
            start = 8;
            end = 12; // Inclusive of end time for "Fin"? No, end time can be 12:00
        } else if (data.jornada === 'TARDE') {
            start = 14;
            end = 18;
        }

        // Generate hourly slots
        for (let i = start; i <= end; i++) {
            options.push(`${i.toString().padStart(2, '0')}:00`);
            // Optional: Add half hours? User asked for "13, 14, 15". Let's stick to hours for simplicity first.
        }
        return options;
    };

    const timeOptions = getTimeOptions();

    const aforoExceeded = auditorio && data.aforo_estimado !== '' && (data.aforo_estimado > auditorio.capacidad);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Event Type */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Evento
                </label>
                <select
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)]"
                    value={data.tipo_evento}
                    onChange={handleTipoEventoChange}
                >
                    <option value="">Seleccione el tipo de evento...</option>
                    {TIPO_EVENTO_OPTIONS.map((tipo) => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                </select>
            </div>

            {/* Title */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título del Evento
                </label>
                <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)]"
                    placeholder="Ej. Capacitación docente"
                    value={data.titulo}
                    onChange={handleTituloChange}
                />
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hora Inicio
                    </label>
                    <select
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)]"
                        value={data.horaInicio}
                        onChange={(e) => handleTimeChange('horaInicio', e.target.value)}
                    >
                        {/* Filter options to ensure start < end implies start < max */}
                        {timeOptions.filter(t => t !== timeOptions[timeOptions.length - 1]).map(time => (
                            <option key={time} value={time}>{time}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hora Fin
                    </label>
                    <select
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)]"
                        value={data.horaFin}
                        onChange={(e) => handleTimeChange('horaFin', e.target.value)}
                    >
                        {/* Filter options to ensure end > start */}
                        {timeOptions.filter(t => t > data.horaInicio).map(time => (
                            <option key={time} value={time}>{time}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción del Evento
                </label>
                <textarea
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)]"
                    placeholder="Propósito y agenda del evento..."
                    value={data.descripcion}
                    onChange={handleDescripcionChange}
                />
            </div>

            {/* Aforo */}
            <div>
                <div className="flex justify-between items-baseline mb-1">

                    <label className="block text-sm font-medium text-gray-700">
                        Aforo Asistentes
                    </label>
                    {auditorio && (
                        <span className="text-xs text-gray-500">
                            Capacidad máxima: {auditorio.capacidad} personas
                        </span>
                    )}
                </div>
                <input
                    type="number"
                    className={`w-full p-2 border rounded-md focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] ${aforoExceeded ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    placeholder="Ej. 50"
                    value={data.aforo_estimado}
                    onChange={handleAforoChange}
                    min="1"
                />
                {aforoExceeded ? (
                    <p className="mt-1 text-sm text-red-600 font-medium animate-pulse">
                        ⚠️ El aforo no puede exceder la capacidad del auditorio ({auditorio?.capacidad} personas).
                    </p>
                ) : (
                    <p className="mt-1 text-xs text-gray-400">
                        Indique el número estimado de personas que asistirán.
                    </p>
                )}
            </div>

            {/* Requerimientos */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requerimientos Adicionales
                </label>
                <div className="space-y-2">
                    {REQUERIMIENTOS_OPTIONS.map((req) => (
                        <div key={req} className="flex items-center">
                            <input
                                id={`req-${req}`}
                                type="checkbox"
                                className="h-4 w-4 text-[var(--primary-color)] border-gray-300 rounded focus:ring-[var(--primary-color)]"
                                checked={data.requerimientos_tecnicos.includes(req)}
                                onChange={() => handleRequerimientoToggle(req)}
                            />
                            <label htmlFor={`req-${req}`} className="ml-2 block text-sm text-gray-900">
                                {req}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            <hr className="border-gray-200 my-6" />

            <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-800 flex gap-2 items-start">
                <span className="text-xl">i</span>
                <p>
                    Los datos del responsable y la confirmación final se realizarán en el siguiente paso.
                </p>
            </div>
        </div>
    );
}
