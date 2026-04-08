import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { eventoService } from '@/services/eventoService';
import { dependenciaService } from '@/services/dependenciaService';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export default function AdminDashboardPage() {
    const navigate = useNavigate();

    // Filters State
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [filterDependencia, setFilterDependencia] = useState('');
    const [filterEstado, setFilterEstado] = useState('');

    const { data: events = [], isLoading, error } = useQuery({
        queryKey: ['admin-dashboard-events'],
        queryFn: () => eventoService.getEvents({}),
        refetchInterval: 30000 // Poll every 30s
    });

    const { data: dependencias = [] } = useQuery({
        queryKey: ['admin-dependencias-list'],
        queryFn: dependenciaService.getAll,
        staleTime: 1000 * 60 * 5
    });

    if (isLoading) return <div className="p-12 text-center text-gray-500" role="status" aria-live="polite">Cargando panel de control...</div>;
    if (error) return <div className="p-12 text-center text-red-600" role="alert">Error al cargar datos del dashboard.</div>;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Metrics calculation
    const solicitudesPendientes = events.filter((e: any) => e.estado === 'PENDIENTE');
    const eventosAprobadosHoy = events.filter((e: any) =>
        e.estado === 'APROBADO' && e.fecha_inicio.startsWith(todayStr)
    );

    // Urgent Alerts: Pending requests for today or tomorrow
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const alertasUrgentes = solicitudesPendientes.filter((e: any) => {
        const eventDate = new Date(e.fecha_inicio);
        const diff = eventDate.getTime() - now.getTime();
        return diff >= 0 && diff <= (ONE_DAY_MS * 1.5); // Roughly next 36 hours
    }).sort((a: any, b: any) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime());

    // Active Filters Logic for the Master List
    const filteredEvents = events.filter((e: any) => {
        // Date Logic
        const eDateStr = e.fecha_inicio.split('T')[0];
        if (filterDateFrom && eDateStr < filterDateFrom) return false;
        if (filterDateTo && eDateStr > filterDateTo) return false;

        // Dependencia Logic
        if (filterDependencia && e.dependencia_id !== Number(filterDependencia)) return false;

        // Estado Logic
        if (filterEstado && e.estado !== filterEstado) return false;

        return true;
    }).sort((a: any, b: any) => new Date(b.fecha_solicitud || b.fecha_inicio).getTime() - new Date(a.fecha_solicitud || a.fecha_inicio).getTime());

    // Basic Occupancy logic (Approved / Total * 100) weekly
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (6 - now.getDay()));

    const eventsThisWeek = events.filter((e: any) => {
        const bd = new Date(e.fecha_inicio);
        return bd >= startOfWeek && bd <= endOfWeek && e.estado !== 'RECHAZADO';
    });
    const approvedThisWeek = eventsThisWeek.filter((e: any) => e.estado === 'APROBADO');
    const weeklyOccupancy = eventsThisWeek.length > 0 ? Math.round((approvedThisWeek.length / eventsThisWeek.length) * 100) : 0;

    // --- EXPORT LOGIC ---
    const handleExportCSV = () => {
        if (filteredEvents.length === 0) {
            alert("No hay datos para exportar con los filtros actuales.");
            return;
        }

        const headers = ['ID', 'Título', 'Fecha Inicio', 'Fecha Fin', 'Jornada', 'Estado', 'Espacio', 'Dependencia Solicitante', 'Nombre Solicitante'];

        const csvRows = filteredEvents.map((evt: any) => {
            return [
                evt.id,
                `"${(evt.titulo || 'Evento General').replace(/"/g, '""')}"`,
                evt.fecha_inicio.split('T')[0],
                evt.fecha_fin.split('T')[0],
                evt.jornada || 'N/A',
                evt.estado,
                `"${(evt.auditorio_nombre || '').replace(/"/g, '""')}"`,
                `"${(evt.dependencia_nombre || '').replace(/"/g, '""')}"`,
                `"${(evt.usuario_nombre || evt.responsable_nombre || '').replace(/"/g, '""')}"`
            ].join(',');
        });

        const csvString = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([`\ufeff${csvString}`], { type: 'text/csv;charset=utf-8;' }); // \ufeff for Excel UTF-8 BOM
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `reporte_reservas_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 animate-fade-in" role="main" aria-label="Panel de Control Principal">
            <h1 className="text-2xl font-bold text-[var(--primary-color)]" tabIndex={0}>Dashboard</h1>

            {/* ALERTS SECTION */}
            {alertasUrgentes.length > 0 && (
                <section aria-label="Alertas Urgentes" className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <span className="text-red-500 text-xl" aria-hidden="true">⚠️</span>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-bold text-red-800" tabIndex={0}>Atención: {alertasUrgentes.length} Solicitud(es) urgente(s)</h3>
                            <div className="mt-2 text-sm text-red-700 space-y-2">
                                {alertasUrgentes.map((alerta: any) => (
                                    <div key={alerta.id} className="flex justify-between items-center bg-white/50 p-2 rounded">
                                        <span tabIndex={0}>
                                            <span className="font-bold">Para: {alerta.fecha_inicio.split('T')[0]}</span> - {alerta.auditorio_nombre} ({alerta.jornada})
                                        </span>
                                        <Link
                                            to={`/admin/solicitudes/${alerta.id}`}
                                            className="text-red-800 font-bold hover:underline"
                                            aria-label={`Revisar solicitud urgente para ${alerta.auditorio_nombre} el ${alerta.fecha_inicio.split('T')[0]}`}
                                        >
                                            Revisar ahora →
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" role="region" aria-label="Estadísticas generales">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-[var(--border-color)]" tabIndex={0} aria-label={`Eventos aprobados para hoy: ${eventosAprobadosHoy.length}`}>
                    <h3 className="text-sm font-medium text-gray-500">Eventos Aprobados (Hoy)</h3>
                    <p className="text-3xl font-bold text-[var(--primary-color)] mt-2">{eventosAprobadosHoy.length}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-[var(--border-color)]" tabIndex={0} aria-label={`Solicitudes pendientes de revisión: ${solicitudesPendientes.length}`}>
                    <h3 className="text-sm font-medium text-gray-500">Solicitudes Pendientes</h3>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">{solicitudesPendientes.length}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-[var(--border-color)]" tabIndex={0} aria-label={`Demanda semanal aproxima: ${weeklyOccupancy} por ciento`}>
                    <h3 className="text-sm font-medium text-gray-500">Ocupación Semanal (Aprox)</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">{weeklyOccupancy}%</p>
                </div>
            </div>

            {/* MASTER LIST WITH FILTERS */}
            <section className="bg-white rounded-lg shadow-sm border border-[var(--border-color)] overflow-hidden" aria-label="Lista Maestra de Eventos">
                <div className="px-6 py-4 border-b border-gray-200 flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4 bg-gray-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900" tabIndex={0}>Lista Maestra de Solicitudes</h2>
                        <p className="text-sm text-gray-500">Usa los filtros para refinar la búsqueda</p>
                    </div>
                </div>

                {/* FILTERS TOOLBAR */}
                <div className="p-5 bg-gray-50 border-b border-gray-200">
                    <div className="flex flex-wrap items-end gap-5">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                Desde Fecha
                            </label>
                            <input
                                type="date"
                                className="w-full text-base p-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition-all"
                                value={filterDateFrom}
                                onChange={e => setFilterDateFrom(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                Hasta Fecha
                            </label>
                            <input
                                type="date"
                                className="w-full text-base p-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition-all"
                                value={filterDateTo}
                                onChange={e => setFilterDateTo(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 min-w-[220px]">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                Dependencia
                            </label>
                            <select
                                className="w-full text-base p-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition-all"
                                value={filterDependencia}
                                onChange={e => setFilterDependencia(e.target.value)}
                            >
                                <option value="">Todas las dependencias</option>
                                {dependencias.map((dep: any) => (
                                    <option key={dep.id} value={dep.id}>{dep.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Estado
                            </label>
                            <select
                                className="w-full text-base p-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition-all"
                                value={filterEstado}
                                onChange={e => setFilterEstado(e.target.value)}
                            >
                                <option value="">Todos los estados</option>
                                <option value="PENDIENTE">PENDIENTES</option>
                                <option value="APROBADO">APROBADOS</option>
                                <option value="RECHAZADO">RECHAZADOS</option>
                                <option value="BLOQUEO_TEMPORAL">BLOQUEOS TEMPORALES</option>
                            </select>
                        </div>
                        <div className="flex-none pt-2 flex gap-3 w-full sm:w-auto">
                            <button
                                onClick={() => {
                                    setFilterDateFrom('');
                                    setFilterDateTo('');
                                    setFilterDependencia('');
                                    setFilterEstado('');
                                }}
                                className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-gray-700 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm flex-1 sm:flex-none h-[46px]"
                                title="Borrar todos los filtros"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                Limpiar
                            </button>
                            <button
                                onClick={handleExportCSV}
                                className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-[var(--primary-color)] hover:bg-[#152A4A] rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:ring-offset-2 shadow-sm flex-1 sm:flex-none h-[46px]"
                                title="Exportar resultados a formato Excel (CSV)"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Exportar
                            </button>
                        </div>
                    </div>
                </div>

                {filteredEvents.length === 0 ? (
                    <div className="p-8 text-center text-gray-500" tabIndex={0}>
                        No hay solicitudes que coincidan con los filtros.
                    </div>
                ) : (
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Inic.</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evento / Tipo</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Espacio</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitante</th>
                                    <th scope="col" className="px-6 py-3 relative"><span className="sr-only">Ver Detalles</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredEvents.map((evt: any) => (
                                    <tr
                                        key={evt.id}
                                        onClick={() => navigate(`/admin/solicitudes/${evt.id}`)}
                                        className="hover:bg-gray-50 transition-colors cursor-pointer group"
                                        tabIndex={0}
                                        aria-label={`Evento ${evt.titulo} el ${evt.fecha_inicio.split('T')[0]}, Estado: ${evt.estado}`}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 group-hover:text-[var(--primary-color)]">
                                            {evt.fecha_inicio.split('T')[0]}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium 
                                                ${evt.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                                                    evt.estado === 'APROBADO' ? 'bg-green-100 text-green-800' :
                                                        evt.estado === 'RECHAZADO' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'}`}>
                                                {evt.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="font-medium text-gray-900">{evt.titulo || 'Sin Título'}</div>
                                            <div className="text-xs">{evt.jornada ? evt.jornada.replace('_', ' ').toLowerCase() : '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {evt.auditorio_nombre}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="font-medium text-gray-800">{evt.dependencia_nombre}</div>
                                            <div className="text-xs text-gray-400">{evt.responsable_nombre}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <svg className="w-5 h-5 text-gray-300 group-hover:text-[var(--primary-color)] transition-colors ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
