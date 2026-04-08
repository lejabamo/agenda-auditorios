import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventoService } from '@/services/eventoService';
import { format } from 'date-fns';

interface WizardProps {
    targetDate: string; // ISO string '2026-04-09'
    auditorioId: number;
    auditorioNombre: string;
    onClose: () => void;
    onSuccess: (message: string) => void;
}

export const AccessibleAdminWizard: React.FC<WizardProps> = ({
    targetDate,
    auditorioId,
    auditorioNombre,
    onClose,
    onSuccess
}) => {
    const queryClient = useQueryClient();
    const firstInputRef = useRef<HTMLInputElement>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [titulo, setTitulo] = useState('');
    const [responsable, setResponsable] = useState('');
    const [telefono, setTelefono] = useState('');
    const [correo, setCorreo] = useState('');
    const [jornada, setJornada] = useState('TODO_EL_DIA');

    useEffect(() => {
        if (firstInputRef.current) {
            firstInputRef.current.focus();
        }
    }, []);

    const mutation = useMutation({
        mutationFn: (data: any) => eventoService.createAdminDirect(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-events-assistant-global'] });
            queryClient.invalidateQueries({ queryKey: ['admin-events-list'] });
            onSuccess(`¡Reserva creada exitosamente! El evento "${titulo}" se agendó para ${targetDate} en ${auditorioNombre}.`);
        },
        onSettled: () => setSubmitting(false)
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const startTime = jornada === 'TARDE' ? '14:00:00' : '08:00:00';
        const endTime = jornada === 'MAÑANA' ? '12:00:00' : '18:00:00';

        const payload = {
            titulo,
            fecha_inicio: `${targetDate}T${startTime}`,
            fecha_fin: `${targetDate}T${endTime}`,
            jornada,
            auditorio_id: auditorioId,
            responsable_nombre: responsable,
            responsable_telefono: telefono,
            correo_confirmacion: correo,
        };

        mutation.mutate(payload);
    };

    return (
        <section 
            className="bg-white border-2 border-indigo-200 rounded-lg p-6 mt-4 shadow-sm"
            aria-labelledby="wizard-title"
        >
            <div className="flex justify-between items-center mb-4">
                <h3 id="wizard-title" className="text-lg font-bold text-indigo-900">
                    Formulario de Reserva Rápida
                </h3>
                <button 
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-800 text-sm font-bold uppercase"
                    aria-label="Cancelar y cerrar formulario"
                >
                    Cancelar
                </button>
            </div>

            <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100" role="status" aria-live="polite">
                <p className="text-sm text-indigo-800">
                    Creando reserva para <strong>{auditorioNombre}</strong> el día <strong>{format(new Date(targetDate + 'T12:00:00'), 'dd/MM/yyyy')}</strong>.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="wz-titulo" className="block text-sm font-bold text-gray-700 mb-1">
                        Título del Evento (Requerido)
                    </label>
                    <input
                        ref={firstInputRef}
                        id="wz-titulo"
                        type="text"
                        required
                        value={titulo}
                        onChange={e => setTitulo(e.target.value)}
                        className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        aria-describedby="wz-titulo-desc"
                    />
                    <span id="wz-titulo-desc" className="sr-only">Escribe el nombre del evento.</span>
                </div>

                <div>
                    <label htmlFor="wz-jornada" className="block text-sm font-bold text-gray-700 mb-1">
                        Jornada (Requerido)
                    </label>
                    <select
                        id="wz-jornada"
                        required
                        value={jornada}
                        onChange={e => setJornada(e.target.value)}
                        className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="TODO_EL_DIA">Todo el día</option>
                        <option value="MAÑANA">Mañana</option>
                        <option value="TARDE">Tarde</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="wz-responsable" className="block text-sm font-bold text-gray-700 mb-1">
                        Nombre del Responsable (Requerido)
                    </label>
                    <input
                        id="wz-responsable"
                        type="text"
                        required
                        value={responsable}
                        onChange={e => setResponsable(e.target.value)}
                        className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="wz-tel" className="block text-sm font-bold text-gray-700 mb-1">
                            Teléfono
                        </label>
                        <input
                            id="wz-tel"
                            type="tel"
                            required
                            value={telefono}
                            onChange={e => setTelefono(e.target.value)}
                            className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="wz-email" className="block text-sm font-bold text-gray-700 mb-1">
                            Correo Electrónico
                        </label>
                        <input
                            id="wz-email"
                            type="email"
                            required
                            value={correo}
                            onChange={e => setCorreo(e.target.value)}
                            className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                {mutation.isError && (
                    <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded" role="alert">
                        Error: {mutation.error instanceof Error ? mutation.error.message : 'No se pudo crear la reserva'}
                    </div>
                )}

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg focus:ring-4 focus:ring-indigo-300 transition-colors"
                        aria-live="polite"
                    >
                        {submitting ? 'Guardando Reserva...' : 'Confirmar y Guardar Reserva'}
                    </button>
                </div>
            </form>
        </section>
    );
};
