import { useState, useEffect, useRef } from 'react';
import { Entity } from '@/types/models/entity';
import { entityService } from '@/services/entityService';

interface EntitySelectorStepProps {
    onEntitySelect: (entity: Entity) => void;
    initialEntity?: Entity | null;
}

export function EntitySelectorStep({ onEntitySelect, initialEntity }: EntitySelectorStepProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Entity[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedEntity, setSelectedEntity] = useState<Entity | null>(initialEntity || null);
    const [showDropdown, setShowDropdown] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Search effect with debounce
    useEffect(() => {
        const timerId = setTimeout(async () => {
            if (query.trim().length < 2) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const data = await entityService.searchEntities(query);
                setResults(data);
                setShowDropdown(true);
            } catch (error) {
                console.error("Error searching entities:", error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 400); // 400ms debounce

        return () => clearTimeout(timerId);
    }, [query]);

    const handleSelect = (entity: Entity) => {
        setSelectedEntity(entity);
        onEntitySelect(entity);
        setShowDropdown(false);
        setQuery('');
    };

    const clearSelection = () => {
        setSelectedEntity(null);
        setQuery('');
        setResults([]);
    };

    return (
        <div className="w-full max-w-md mx-auto space-y-6" ref={wrapperRef}>
            <div className="space-y-2">
                <label htmlFor="entity-search" className="block text-sm font-medium text-[var(--primary-color)]">
                    Entidad Solicitante
                </label>
                <p className="text-xs text-[var(--text-secondary)]">
                    Busque por nombre oficial o sigla (ej. "Secretaría de Salud", "SEP").
                </p>
            </div>

            {selectedEntity ? (
                // State: Entity Selected
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between animate-fade-in">
                    <div>
                        <p className="font-semibold text-blue-900">{selectedEntity.officialName}</p>
                        {selectedEntity.acronym && (
                            <span className="text-xs px-2 py-0.5 bg-white text-blue-700 rounded-full border border-blue-100">
                                {selectedEntity.acronym}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={clearSelection}
                        className="text-sm text-blue-600 hover:text-blue-800 underline px-2"
                    >
                        Cambiar
                    </button>
                </div>
            ) : (
                // State: Searching
                <div className="relative">
                    <input
                        id="entity-search"
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent transition-shadow"
                        placeholder="Escriba para buscar..."
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            if (!showDropdown) setShowDropdown(true);
                        }}
                        autoComplete="off"
                    />

                    {isLoading && (
                        <div className="absolute right-3 top-3.5">
                            <div className="w-5 h-5 border-2 border-gray-200 border-t-[var(--accent-color)] rounded-full animate-spin"></div>
                        </div>
                    )}

                    {/* Dropdown Results */}
                    {showDropdown && query.length >= 2 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {results.length > 0 ? (
                                <ul className="divide-y divide-gray-100">
                                    {results.map((entity) => (
                                        <li
                                            key={entity.id}
                                            onClick={() => handleSelect(entity)}
                                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <div className="font-medium text-gray-900">{entity.officialName}</div>
                                            {entity.acronym && (
                                                <div className="text-xs text-gray-500 font-mono">{entity.acronym}</div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                !isLoading && (
                                    <div className="px-4 py-6 text-center text-gray-500 text-sm">
                                        No se encontraron resultados para "{query}".
                                        <br />
                                        <span className="text-xs text-gray-400 mt-1 block">
                                            Verifique la ortografía o intente con las siglas.
                                        </span>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Helper / Validation message placeholder */}
            {!selectedEntity && (
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded flex gap-2 items-start mt-2">
                    <span>ℹ️</span>
                    <span>Debe seleccionar una entidad válida de la lista para continuar.</span>
                </div>
            )}
        </div>
    );
}
