import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auditorioService } from '@/services/auditorioService';
import type { Auditorio } from '@/types/models/auditorio';

export default function AdminAuditoriosPage() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<Partial<Auditorio>>({});

    const { data: auditorios = [], isLoading, error } = useQuery({
        queryKey: ['auditorios'],
        queryFn: auditorioService.getAllAuditorios,
    });

    const createMutation = useMutation({
        mutationFn: auditorioService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['auditorios'] });
            closeModal();
        },
        onError: (err: any) => alert(`Error al crear: ${err.message}`)
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: number; aud: Partial<Auditorio> }) =>
            auditorioService.update(data.id, data.aud),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['auditorios'] });
            closeModal();
        },
        onError: (err: any) => alert(`Error al actualizar: ${err.message}`)
    });

    const deleteMutation = useMutation({
        mutationFn: auditorioService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['auditorios'] });
        },
        onError: (err: any) => alert(`Error al desactivar: ${err.message}`)
    });

    const openCreate = () => {
        setEditingId(null);
        setFormData({ nombre: '', capacidad: 0, ubicacion: '', descripcion: '', activo: true });
        setIsModalOpen(true);
    };

    const openEdit = (aud: Auditorio) => {
        setEditingId(aud.id);
        setFormData({ ...aud });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({});
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            updateMutation.mutate({ id: editingId, aud: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDelete = (id: number, nombre: string) => {
        if (confirm(`¿Estás seguro de desactivar el auditorio "${nombre}"?`)) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in" role="main" aria-label="Gestión de Auditorios y Espacios">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-[var(--border-color)]">
                <h1 className="text-2xl font-bold text-[var(--primary-color)]" tabIndex={0}>Gestión de Auditorios</h1>
                <button
                    onClick={openCreate}
                    className="px-4 py-2 bg-[var(--primary-color)] text-white font-medium rounded hover:bg-[var(--primary-light)] focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-color)] transition-colors"
                    aria-label="Agregar nuevo auditorio o espacio físico"
                >
                    + Nuevo Auditorio
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[var(--border-color)] overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-gray-500" role="status" aria-live="polite">Cargando espacios...</div>
                ) : error ? (
                    <div className="p-12 text-center text-red-600" role="alert">Error al cargar listado de auditorios.</div>
                ) : auditorios.length === 0 ? (
                    <div className="p-12 text-center text-gray-500" tabIndex={0}>No hay auditorios creados.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacidad</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {auditorios.map((aud: Auditorio) => (
                                    <tr key={aud.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{aud.nombre}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{aud.capacidad || 0}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{aud.ubicacion || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${aud.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {aud.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                            <button
                                                onClick={() => openEdit(aud)}
                                                className="text-[var(--primary-color)] hover:text-[var(--primary-dark)]"
                                                aria-label={`Editar auditorio ${aud.nombre}`}
                                            >
                                                Editar
                                            </button>
                                            {aud.activo && (
                                                <button
                                                    onClick={() => handleDelete(aud.id, aud.nombre)}
                                                    className="text-red-600 hover:text-red-900"
                                                    aria-label={`Desactivar auditorio ${aud.nombre}`}
                                                >
                                                    Desactivar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal CRUD */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                    <div className="bg-white rounded-lg p-5 max-w-md w-full shadow-2xl relative">
                        <form id="auditorio-form" onSubmit={handleSubmit}>
                            <h2 id="modal-title" className="text-lg font-bold text-gray-900 mb-2">
                                {editingId ? 'Editar Auditorio' : 'Nuevo Auditorio'}
                            </h2>

                            <div className="space-y-3">
                                <div>
                                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre *</label>
                                    <input
                                        id="nombre"
                                        type="text"
                                        required
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--primary-color)] px-3 py-1.5 border"
                                        value={formData.nombre || ''}
                                        onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="capacidad" className="block text-sm font-medium text-gray-700">Capacidad *</label>
                                    <input
                                        id="capacidad"
                                        type="number"
                                        required
                                        min="1"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--primary-color)] px-3 py-1.5 border"
                                        value={formData.capacidad || ''}
                                        onChange={e => setFormData({ ...formData, capacidad: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="ubicacion" className="block text-sm font-medium text-gray-700">Ubicación</label>
                                    <input
                                        id="ubicacion"
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--primary-color)] px-3 py-1.5 border"
                                        value={formData.ubicacion || ''}
                                        onChange={e => setFormData({ ...formData, ubicacion: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">Descripción</label>
                                    <textarea
                                        id="descripcion"
                                        rows={2}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--primary-color)] px-3 py-1.5 border"
                                        value={formData.descripcion || ''}
                                        onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-center pt-1">
                                    <input
                                        type="checkbox"
                                        id="activo"
                                        className="h-4 w-4 text-[var(--primary-color)] border-gray-300 rounded"
                                        checked={formData.activo || false}
                                        onChange={e => setFormData({ ...formData, activo: e.target.checked })}
                                    />
                                    <label htmlFor="activo" className="ml-2 block text-sm font-medium text-gray-900">
                                        Activo
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="px-4 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-[var(--primary-color)] hover:bg-[var(--primary-light)] focus:outline-none disabled:opacity-50"
                                >
                                    {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>, document.body
            )}
        </div>
    );
}
