import { useState } from 'react';
import { eventoService } from '@/services/eventoService';
import { ApiError } from '@/services/eventoService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface EventDetailDrawerProps {
    eventId: number | null;
    onClose: () => void;
}

export function EventDetailDrawer({ eventId, onClose }: EventDetailDrawerProps) {
    const [comment, setComment] = useState("");
    const queryClient = useQueryClient();

    // Re-fetch full details for this specific ID if needed, 
    // or rely on the list data if it was rich enough. 
    // Usually fetching details is safer.
    // implementation omitted for brevity, assuming list passed enough or we fetch here.
    // For MVP, we'll assume we fetch details here or just simulate actions.

    // Actually, let's fetch details securely
    // Actually, let's fetch details securely
    // const [localEvent, setLocalEvent] = useState<any>(null);
    // const [loading, setLoading] = useState(false);

    // Effect to fetch details on mount if eventId exists (omitted for now to focus on actions)

    const updateStatusMutation = useMutation({
        mutationFn: async ({ status, observacion }: { status: 'APROBADO' | 'RECHAZADO', observacion?: string }) => {
            if (!eventId) return;
            return eventoService.updateStatus(eventId, status, observacion);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['eventos'] });
            onClose();
        },
        onError: (error) => {
            alert(error instanceof ApiError ? error.message : "Error desconocido");
        }
    });

    if (!eventId) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 transition-opacity" onClick={onClose}>
            <div
                className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto animate-slide-in-right"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Detalle Solicitud #{eventId}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        ✕
                    </button>
                </div>

                {/* Content Placeholder - In real app, fetch and display details here */}
                <div className="p-4 bg-blue-50 text-blue-800 rounded mb-6 text-sm">
                    Aquí se mostrarían los detalles completos del evento cargados desde <code>GET /api/eventos/{eventId}</code>.
                </div>

                <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">Observaciones (Opcional)</label>
                    <textarea
                        className="w-full border border-gray-300 rounded-md p-2 text-sm h-24 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)]"
                        placeholder="Motivo de aprobación o rechazo..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />

                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <button
                            onClick={() => updateStatusMutation.mutate({ status: 'RECHAZADO', observacion: comment })}
                            disabled={updateStatusMutation.isPending}
                            className="px-4 py-2 border border-red-300 text-red-700 rounded hover:bg-red-50 font-medium disabled:opacity-50"
                        >
                            {updateStatusMutation.isPending ? 'Procesando...' : 'Rechazar'}
                        </button>
                        <button
                            onClick={() => updateStatusMutation.mutate({ status: 'APROBADO', observacion: comment })}
                            disabled={updateStatusMutation.isPending}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium disabled:opacity-50"
                        >
                            {updateStatusMutation.isPending ? 'Procesando...' : 'Aprobar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
