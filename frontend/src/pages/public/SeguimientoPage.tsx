import { useParams } from 'react-router-dom';

export default function SeguimientoPage() {
    const { id } = useParams<{ id: string }>();

    return (
        <div className="max-w-2xl mx-auto py-8">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-[var(--border-color)]">
                <h1 className="text-xl font-bold mb-6 flex items-center gap-2">
                    Estado de Solicitud
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">PENDIENTE</span>
                </h1>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="block text-gray-500">ID Solicitud</span>
                            <span className="font-mono font-medium">{id || 'SL-000-000'}</span>
                        </div>
                        <div>
                            <span className="block text-gray-500">Fecha Solicitud</span>
                            <span className="font-medium">29 Ene 2026</span>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    <div className="p-4 bg-gray-50 rounded text-center text-sm text-gray-600">
                        Su solicitud está siendo revisada por el área administrativa.
                        Recibirá una notificación al correo registrado.
                    </div>
                </div>
            </div>
        </div>
    );
}
