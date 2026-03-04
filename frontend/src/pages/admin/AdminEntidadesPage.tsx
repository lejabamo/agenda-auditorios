import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dependenciaService } from '@/services/dependenciaService';
import type { Dependencia } from '@/services/dependenciaService';

export default function AdminEntidadesPage() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<Dependencia> | null>(null);

    // Form State
    const [nombre, setNombre] = useState('');
    const [tipo, setTipo] = useState('INTERNA');
    const [sigla, setSigla] = useState('');

    const { data: entidades = [], isLoading, error } = useQuery({
        queryKey: ['admin-entidades'],
        queryFn: dependenciaService.getAll
    });

    const mutationSave = useMutation({
        mutationFn: async (data: Partial<Dependencia>) => {
            if (editingItem?.id) {
                return dependenciaService.update(editingItem.id, data);
            }
            return dependenciaService.create(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-entidades'] });
            closeModal();
        },
        onError: (err: any) => {
            alert(`Error al guardar: ${err.message}`);
        }
    });

    const mutationDelete = useMutation({
        mutationFn: async (id: number) => dependenciaService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-entidades'] });
        },
        onError: (err: any) => {
            alert(`Error al desactivar: ${err.message}`);
        }
    });

    const openModal = (item?: Dependencia) => {
        if (item) {
            setEditingItem(item);
            setNombre(item.nombre);
            setTipo(item.tipo);
            setSigla(item.sigla || '');
        } else {
            setEditingItem(null);
            setNombre('');
            setTipo('INTERNA');
            setSigla('');
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        mutationSave.mutate({ nombre, tipo, sigla, activa: true });
    };

    const handleDelete = (id: number, nombre: string) => {
        if (confirm(`¿Está seguro de desactivar la entidad "${nombre}"?`)) {
            mutationDelete.mutate(id);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in" role="main" aria-label="Gestión de Entidades y Dependencias">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-[var(--border-color)]">
                <h1 className="text-2xl font-bold text-[var(--primary-color)]" tabIndex={0}>Entidades Registradas</h1>
                <button
                    onClick={() => openModal()}
                    className="px-4 py-2 bg-[var(--primary-color)] text-white font-medium rounded hover:bg-[var(--primary-light)] focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-color)] transition-colors"
                    aria-label="Agregar nueva entidad"
                >
                    + Nueva Entidad
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[var(--border-color)] overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-gray-500" role="status" aria-live="polite">Cargando entidades...</div>
                ) : error ? (
                    <div className="p-12 text-center text-red-600" role="alert">Error al cargar listado.</div>
                ) : entidades.length === 0 ? (
                    <div className="p-12 text-center text-gray-500" tabIndex={0}>No hay entidades registradas.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sigla</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {entidades.map((entidad: Dependencia) => (
                                    <tr key={entidad.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entidad.nombre}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entidad.sigla || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${entidad.tipo === 'INTERNA' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                {entidad.tipo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {entidad.activa
                                                ? <span className="text-green-600 font-medium">Activa</span>
                                                : <span className="text-red-500 font-medium">Inactiva</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                            <button
                                                onClick={() => openModal(entidad)}
                                                className="text-[var(--primary-color)] hover:text-[var(--primary-dark)]"
                                                aria-label={`Editar entidad ${entidad.nombre}`}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(entidad.id, entidad.nombre)}
                                                className="text-red-600 hover:text-red-900"
                                                aria-label={`Desactivar entidad ${entidad.nombre}`}
                                            >
                                                Desactivar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal CRUD */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
                        <h2 id="modal-title" className="text-xl font-bold text-gray-900 mb-4">
                            {editingItem ? 'Editar Entidad' : 'Nueva Entidad'}
                        </h2>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre de la Entidad/Dependencia *</label>
                                <input
                                    id="nombre"
                                    type="text"
                                    required
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)]"
                                />
                            </div>

                            <div>
                                <label htmlFor="sigla" className="block text-sm font-medium text-gray-700">Sigla (Opcional)</label>
                                <input
                                    id="sigla"
                                    type="text"
                                    value={sigla}
                                    onChange={(e) => setSigla(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)]"
                                />
                            </div>

                            <div>
                                <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">Tipo *</label>
                                <select
                                    id="tipo"
                                    value={tipo}
                                    onChange={(e) => setTipo(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)]"
                                >
                                    <option value="INTERNA">Interna (Gobernación)</option>
                                    <option value="EXTERNA">Externa (Otras Instituciones)</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-color)]"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={mutationSave.isPending}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--primary-color)] hover:bg-[var(--primary-light)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-color)] disabled:opacity-50"
                                >
                                    {mutationSave.isPending ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
