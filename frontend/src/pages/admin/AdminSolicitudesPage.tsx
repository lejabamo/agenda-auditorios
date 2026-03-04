import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { eventoService } from '@/services/eventoService';
import { auditorioService } from '@/services/auditorioService';
import { Link } from 'react-router-dom';

type EstadoFilter = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'TODOS';

export default function AdminSolicitudesPage() {
    // Default filter: PENDIENTE (User Request B1 Adjustment)
    const [currentTab, setCurrentTab] = useState<EstadoFilter>('PENDIENTE');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedAuditorio, setSelectedAuditorio] = useState('');

    // Fetch Auditoriums for filter
    const { data: auditorios = [] } = useQuery({
        queryKey: ['admin-auditorios-filter'],
        queryFn: auditorioService.getAllAuditorios,
        staleTime: 1000 * 60 * 5 // 5 minutes
    });

    // Query with reactive filters
    const { data: events = [], isLoading, error } = useQuery({
        queryKey: ['admin-events', currentTab, selectedDate, selectedAuditorio],
        queryFn: () => {
            const filters: Record<string, string | number> = {
                sort_by: 'fecha_solicitud',
                order: 'asc'
            };

            if (currentTab !== 'TODOS') {
                filters.estado = currentTab;
            }
            if (selectedDate) {
                filters.fecha = selectedDate;
            }
            if (selectedAuditorio) {
                filters.auditorio_id = selectedAuditorio;
            }

            return eventoService.getEvents(filters);
        },
        // Poll every 30 seconds to keep inbox fresh
        refetchInterval: 30000
    });

    // Helper for Status Badge
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDIENTE':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pendiente</span>;
            case 'APROBADO':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Aprobado</span>;
            case 'RECHAZADO':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Rechazado</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in p-6" role="main" aria-label="Gestión de Solicitudes">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Solicitudes</h1>

                {/* Filters Area */}
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <select
                        value={selectedAuditorio}
                        onChange={(e) => setSelectedAuditorio(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)]"
                        aria-label="Filtrar por espacio"
                    >
                        <option value="">Todos los espacios</option>
                        {auditorios.map((a: any) => (
                            <option key={a.id} value={a.id}>{a.nombre}</option>
                        ))}
                    </select>

                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)]"
                        aria-label="Filtrar por fecha"
                    />

                    {(selectedDate || selectedAuditorio) && (
                        <button
                            onClick={() => { setSelectedDate(''); setSelectedAuditorio(''); }}
                            className="text-sm text-red-600 hover:text-red-800 font-medium px-2"
                            aria-label="Limpiar filtros de fecha y espacio"
                        >
                            Limpiar
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs / Filters */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Filtros de estado de solicitud">
                    {(['PENDIENTE', 'APROBADO', 'RECHAZADO', 'TODOS'] as EstadoFilter[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setCurrentTab(tab)}
                            className={`
                                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                ${currentTab === tab
                                    ? 'border-[var(--primary-color)] text-[var(--primary-color)]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                            `}
                            aria-label={`Mostrar solicitudes ${tab.toLowerCase().replace('_', ' ')}`}
                            aria-current={currentTab === tab ? 'page' : undefined}
                        >
                            {tab.charAt(0) + tab.slice(1).toLowerCase().replace('_', ' ')}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Table Area */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden" aria-label="Tabla de solicitudes">
                {isLoading ? (
                    <div className="p-12 text-center text-gray-500" role="status" aria-live="polite">
                        <div className="animate-spin h-8 w-8 border-4 border-[var(--primary-color)] border-t-transparent rounded-full mx-auto mb-4"></div>
                        Cargando solicitudes...
                    </div>
                ) : error ? (
                    <div className="p-12 text-center text-red-600" role="alert">
                        Error al cargar las solicitudes. Por favor intente recargar.
                    </div>
                ) : events.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <p className="text-lg font-medium">No hay solicitudes en esta categoría</p>
                        <p className="text-sm">Las nuevas solicitudes aparecerán aquí.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" aria-label="Identificador de radicado">
                                        Radicado
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" aria-label="Fecha del evento">
                                        Fecha Evento
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" aria-label="Entidad solicitante">
                                        Entidad
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" aria-label="Espacio solicitado">
                                        Espacio
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" aria-label="Jornada del evento">
                                        Jornada
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" aria-label="Estado de la solicitud">
                                        Estado
                                    </th>
                                    <th scope="col" className="relative px-6 py-3" aria-label="Acciones disponibles">
                                        <span className="sr-only">Acciones</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {events.map((event: any) => (
                                    <tr
                                        key={event.id}
                                        className="hover:bg-gray-50 transition-colors"
                                        aria-label={`Solicitud número ${event.id}, para el evento en ${event.auditorio_nombre} el ${event.fecha_inicio ? event.fecha_inicio.split('T')[0] : 'fecha no disponible'}, estado ${event.estado}`}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            #{event.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {event.fecha_inicio ? event.fecha_inicio.split('T')[0] : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {event.dependencia_nombre || 'Externa'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {event.auditorio_nombre}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {event.jornada ? event.jornada.replace('_', ' ') : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(event.estado)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link
                                                to={`/admin/solicitudes/${event.id}`}
                                                className="text-[var(--primary-color)] hover:text-[var(--primary-dark)] font-semibold"
                                                aria-label={`Revisar detalles de la solicitud número ${event.id}`}
                                            >
                                                Revisar
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
