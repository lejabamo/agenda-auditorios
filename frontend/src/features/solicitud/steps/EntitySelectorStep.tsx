import { useState, useEffect } from 'react';
import type { Entity } from '@/types/models/entity';

interface EntitySelectorStepProps {
    onEntitySelect: (entity: Entity) => void;
    initialEntity?: Entity | null;
}

// Static list of dependencies as requested
const DEPENDENCIES = [
    "Historias Laborales",
    "Escalafón",
    "Apoyo a la Supervisión",
    "Cobertura Educativa",
    "Calidad Educativa",
    "Nómina Educativa",
    "Servicios Informáticos del Sector Educativo",
    "Bienestar, Seguridad y Salud en el Trabajo",
    "Planeación Educativa",
    "Administrativa y Financiera",
    "Financiera Educación",
    "Despacho Secretaría Educación",
    "Talento Humano Educativo",
    "UDAG – Unidades Desconcentradas",
    "Gestión de Calidad",
    "Fondo de Prestaciones Educación",
    "Jurídica Educación",
    "PAE – Programa de Alimentación Escolar",
    "Inspección y Vigilancia",
    "SAC – Servicio de Atención al Ciudadano"
].sort();

export function EntitySelectorStep({ onEntitySelect, initialEntity }: EntitySelectorStepProps) {
    const [isCustom, setIsCustom] = useState(false);
    const [customName, setCustomName] = useState('');

    // Detect if initial entity is not in the list
    useEffect(() => {
        if (initialEntity?.officialName && !DEPENDENCIES.includes(initialEntity.officialName)) {
            setIsCustom(true);
            setCustomName(initialEntity.officialName);
        }
    }, [initialEntity]);

    const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'OTRA') {
            setIsCustom(true);
            // Clear current selection until typed
            onEntitySelect(null as any);
            return;
        }

        setIsCustom(false);
        if (!value) return;

        const entity: Entity = {
            id: value.toUpperCase().replace(/\s+/g, '_'),
            officialName: value,
            type: 'INTERNAL',
            isActive: true
        };
        onEntitySelect(entity);
    };

    const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCustomName(value);

        if (value.trim().length > 2) {
            const entity: Entity = {
                id: value.toUpperCase().replace(/\s+/g, '_'),
                officialName: value,
                type: 'INTERNAL',
                isActive: true
            };
            onEntitySelect(entity);
        } else {
            // Invalid/incomplete
            // We might need to pass null to block next step, checking how parent handles it
        }
    };

    return (
        <div className="w-full max-w-md mx-auto space-y-6">
            <div className="space-y-2">
                <label htmlFor="dependencia-select" className="block text-md font-medium text-[var(--primary-color)]">
                    Paso 1 de 4 – Dependencia solicitante
                </label>
                <p className="text-sm text-[var(--text-secondary)]">
                    Seleccione la dependencia de la Secretaría de Educación que solicita el uso del Auditorio Filomena.
                </p>
            </div>

            <div className="relative space-y-4">
                <div className="relative">
                    <select
                        id="dependencia-select"
                        className={`w-full px-4 py-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent transition-shadow bg-white appearance-none
                                ${!initialEntity && !isCustom ? 'text-gray-500' : 'text-gray-900 border-gray-300'}`}
                        value={isCustom ? 'OTRA' : (initialEntity?.officialName || '')}
                        onChange={handleSelect}
                    >
                        <option value="" disabled>Seleccione una dependencia...</option>
                        {DEPENDENCIES.map((dep) => (
                            <option key={dep} value={dep} className="text-gray-900">
                                {dep}
                            </option>
                        ))}
                        <option value="OTRA" className="font-bold text-blue-600 bg-blue-50">
                            + Otra / Nueva Dependencia
                        </option>
                    </select>

                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>

                {/* Custom Input */}
                {isCustom && (
                    <div className="animate-fade-in relative">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Nombre de la Dependencia/Entidad:</label>
                        <input
                            type="text"
                            value={customName}
                            onChange={handleCustomChange}
                            placeholder="Escriba el nombre completo..."
                            className="w-full px-4 py-3 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] bg-blue-50 text-gray-900"
                            autoFocus
                        />
                        <button
                            onClick={() => setIsCustom(false)}
                            className="absolute top-8 right-3 text-gray-400 hover:text-red-500"
                            title="Cancelar ingreso manual"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Helper / Validation message */}
            {!initialEntity && (
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded flex gap-2 items-start mt-2 border border-amber-100">
                    <span>⚠️</span>
                    <span>Seleccione o escriba una dependencia para continuar.</span>
                </div>
            )}
        </div>
    );
}
