import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventoService, ApiError } from '@/services/eventoService';

interface EventoDetail {
    id: number;
    titulo: string;
    estado: string;
    fecha_inicio: string;
    fecha_fin: string;
    auditorio_nombre: string;
    dependencia_nombre: string;
    responsable_nombre: string;
    created_at: string;
}

export default function SeguimientoPage() {
    const { id } = useParams<{ id: string }>();
    const [evento, setEvento] = useState<EventoDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchEvento = async () => {
            try {
                const data = await eventoService.getById(id);
                if (data) {
                    setEvento(data);
                } else {
                    setError('Solicitud no encontrada.');
                }
            } catch (err: unknown) {
                if (err instanceof ApiError) {
                    setError(err.message);
                } else {
                    setError('Error al cargar la información.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchEvento();
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-color)]"></div>
            </div>
        );
    }

    if (error || !evento) {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4 text-center">
                <div className="bg-red-50 p-8 rounded-lg border border-red-100">
                    <span className="text-4xl">😕</span>
                    <h2 className="text-xl font-bold text-red-800 mt-4">No pudimos encontrar esa solicitud</h2>
                    <p className="text-red-600 mt-2">{error || 'Verifique el ID e intente nuevamente.'}</p>
                    <Link to="/" className="inline-block mt-6 px-6 py-2 bg-[var(--primary-color)] text-white rounded-md hover:bg-[var(--primary-light)] transition-colors">
                        Volver al Inicio
                    </Link>
                </div>
            </div>
        );
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 animate-fade-in">
            {/* Header / Banner */}
            <div className="bg-white border-t-4 border-[var(--primary-color)] shadow-sm rounded-lg overflow-hidden mb-6">
                <div className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Estado de Solicitud</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Radicado: <span className="font-mono font-medium text-gray-700">#{evento.id}</span>
                            </p>
                        </div>
                        <div>
                            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold tracking-wide uppercase
                                ${evento.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : ''}
                                ${evento.estado === 'APROBADO' ? 'bg-green-100 text-green-800 border border-green-200' : ''}
                                ${evento.estado === 'RECHAZADO' ? 'bg-red-100 text-red-800 border border-red-200' : ''}
                            `}>
                                {evento.estado === 'PENDIENTE' && '⏳ '}
                                {evento.estado === 'APROBADO' && '✅ '}
                                {evento.estado === 'RECHAZADO' && '❌ '}
                                {evento.estado}
                            </span>
                        </div>
                    </div>

                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-md mb-8">
                        <div className="flex gap-3">
                            <span className="text-blue-600 text-xl">ℹ️</span>
                            <div>
                                <h3 className="text-sm font-bold text-blue-900">En Revisión Administrativa</h3>
                                <p className="text-sm text-blue-800 mt-1">
                                    Su solicitud ha sido recibida correctamente y se encuentra en proceso de validación por parte de la {evento.dependencia_nombre}.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 border-t border-gray-100 pt-6">
                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Evento</h3>
                            <p className="text-lg font-medium text-gray-900">{evento.titulo}</p>
                        </div>

                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Espacio Solicitado</h3>
                            <p className="text-lg font-medium text-gray-900">{evento.auditorio_nombre}</p>
                        </div>

                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Fecha y Hora</h3>
                            <p className="text-base text-gray-700">
                                {formatDate(evento.fecha_inicio)}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Entidad Solicitante</h3>
                            <p className="text-base text-gray-700">{evento.dependencia_nombre}</p>
                        </div>

                        <div className="md:col-span-2">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Responsable</h3>
                            <p className="text-base text-gray-700">{evento.responsable_nombre}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-between items-center text-sm">
                    <span className="text-gray-500">
                        Creada el {new Date(evento.created_at).toLocaleDateString()}
                    </span>
                    <Link to="/" className="text-[var(--primary-color)] font-medium hover:text-[var(--primary-dark)] hover:underline">
                        Volver al inicio &rarr;
                    </Link>
                </div>
            </div>
        </div>
    );
}
