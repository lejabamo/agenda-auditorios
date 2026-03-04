import type { Auditorio } from '@/types/models/auditorio';
import { useQuery } from '@tanstack/react-query';

interface EventFiltersProps {
    filters: {
        fecha?: string;
        auditorio_id?: string;
        estado?: string;
    };
    onChange: (newFilters: any) => void;
}

export function EventFilters({ filters, onChange }: EventFiltersProps) {
    // Fetch auditorios for the dropdown
    const { data: auditorios } = useQuery<Auditorio[]>({
        queryKey: ['auditorios'],
        queryFn: async () => {
            const res = await fetch('http://localhost:5000/api/auditorios');
            if (!res.ok) throw new Error("Failed to fetch auditorios");
            return res.json();
        }
    });

    const handleChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        if (!value) delete newFilters[key as keyof typeof filters];
        onChange(newFilters);
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-[var(--border-color)] flex flex-wrap gap-4 items-end">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                    type="date"
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)]"
                    value={filters.fecha || ''}
                    onChange={(e) => handleChange('fecha', e.target.value)}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Auditorio</label>
                <select
                    className="border border-gray-300 rounded px-3 py-2 text-sm min-w-[200px] focus:outline-none focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)]"
                    value={filters.auditorio_id || ''}
                    onChange={(e) => handleChange('auditorio_id', e.target.value)}
                >
                    <option value="">Todos los espacios</option>
                    {auditorios?.map((aud) => (
                        <option key={aud.id} value={aud.id}>{aud.nombre}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)]"
                    value={filters.estado || ''}
                    onChange={(e) => handleChange('estado', e.target.value)}
                >
                    <option value="">Todos</option>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="APROBADO">Aprobado</option>
                    <option value="RECHAZADO">Rechazado</option>
                </select>
            </div>

            {(filters.fecha || filters.auditorio_id || filters.estado) && (
                <button
                    onClick={() => onChange({})}
                    className="text-sm text-red-600 hover:text-red-800 mb-2 font-medium"
                >
                    Limpiar Filtros
                </button>
            )}
        </div>
    );
}
