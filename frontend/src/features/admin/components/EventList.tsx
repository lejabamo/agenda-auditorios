import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EventoSummary {
    id: number;
    titulo: string;
    fecha_inicio: string;
    fecha_fin: string;
    estado: string;
    auditorio_nombre: string; // Backend must provide this or we map it
    dependencia_nombre: string;
    responsable_nombre: string;
}

interface EventListProps {
    events: EventoSummary[];
    onSelect: (id: number) => void;
    isLoading: boolean;
}

export function EventList({ events, onSelect, isLoading }: EventListProps) {
    if (isLoading) {
        return (
            <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-color)]"></div>
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500">No hay solicitudes que coincidan con los filtros.</p>
            </div>
        );
    }

    const getStatusBadge = (estado: string) => {
        const styles = {
            PENDIENTE: "bg-yellow-100 text-yellow-800 border-yellow-200",
            APROBADO: "bg-green-100 text-green-800 border-green-200",
            RECHAZADO: "bg-red-100 text-red-800 border-red-200",
            CANCELADO: "bg-gray-100 text-gray-800 border-gray-200",
        };
        const style = styles[estado as keyof typeof styles] || "bg-gray-100 text-gray-800";

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${style}`}>
                {estado}
            </span>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-[var(--border-color)] overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Solicitante</th>
                        <th className="px-6 py-4">Evento / Espacio</th>
                        <th className="px-6 py-4">Fecha</th>
                        <th className="px-6 py-4">Estado</th>
                        <th className="px-6 py-4">Acción</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {events.map((event) => (
                        <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-mono text-gray-500">#{event.id}</td>
                            <td className="px-6 py-4">
                                <div className="font-medium text-gray-900">{event.dependencia_nombre || `Dep ID:${(event as any).dependencia_id}`}</div>
                                <div className="text-xs text-gray-500">{event.responsable_nombre}</div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-gray-900 font-medium truncate max-w-[200px]" title={event.titulo}>{event.titulo}</div>
                                <div className="text-xs text-gray-500">{event.auditorio_nombre || `Aud ID:${(event as any).auditorio_id}`}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="block capitalize">
                                    {format(new Date(event.fecha_inicio), 'MMM d, yyyy', { locale: es })}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {format(new Date(event.fecha_inicio), 'p', { locale: es })} - {format(new Date(event.fecha_fin), 'p', { locale: es })}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                {getStatusBadge(event.estado)}
                            </td>
                            <td className="px-6 py-4">
                                <button
                                    onClick={() => onSelect(event.id)}
                                    className="text-[var(--primary-color)] hover:text-[var(--primary-dark)] font-medium hover:underline"
                                >
                                    Ver Detalle
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
