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
    }>) => void;
}

const TIPO_EVENTO_OPTIONS = [
    'Mesa Tecnica',
    'Asistencia Tecnica',
    'Reunión',
    'Capacitación',
    'Acto Institucional',
    'Otro'
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

    const handleRequerimientosRadioChange = (value: string) => {
        onDataChange({ requerimientos_tecnicos: [value] });
    };


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
            <div className="space-y-4">
                <div className="flex flex-col gap-2">
                    <label className="block text-sm font-medium text-gray-700">
                        ¿Requiere equipos tecnológicos o apoyo técnico? <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-6 mt-1">
                        <label className="flex items-center cursor-pointer group">
                            <input
                                type="radio"
                                name="requiere_tecnico"
                                value="Sí"
                                checked={data.requerimientos_tecnicos.includes('Sí')}
                                onChange={() => handleRequerimientosRadioChange('Sí')}
                                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">Sí, requiero</span>
                        </label>
                        <label className="flex items-center cursor-pointer group">
                            <input
                                type="radio"
                                name="requiere_tecnico"
                                value="No"
                                checked={data.requerimientos_tecnicos.includes('No')}
                                onChange={() => handleRequerimientosRadioChange('No')}
                                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">No requiero</span>
                        </label>
                    </div>
                </div>

                {data.requerimientos_tecnicos.includes('Sí') && (
                    <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-md animate-fade-in">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-800">
                                    Si necesita requerimientos adicionales como <strong>videobeam, micrófono o sonido</strong>, por favor comunicarse con el administrador del sistema para coordinar la entrega.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
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
