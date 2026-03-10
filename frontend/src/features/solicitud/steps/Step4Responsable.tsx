import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Entity } from '@/types/models/entity';
import type { Auditorio } from '@/types/models/auditorio';
import type { Jornada } from '@/features/solicitud/steps/Step2AuditorioFecha';

// 1. Define Zod Schema
const responsableSchema = z.object({
    responsable_nombre: z.string().min(3, 'Este campo es obligatorio (mínimo 3 caracteres)'),
    responsable_cargo: z.string().min(2, 'Este campo es obligatorio'),
    responsable_telefono: z.string().regex(/^\d{10}$/, 'Ingrese un número celular válido de 10 dígitos'),
    correo_confirmacion: z.string().email('Ingrese un correo electrónico válido'),
});

type ResponsableFormValues = z.infer<typeof responsableSchema>;

interface WizardData {
    entity: Entity | null;
    auditorio: Auditorio | null;
    fecha: string;
    jornada: Jornada | '';
    titulo: string;
    descripcion: string;
    aforo_estimado: number | '';
    requerimientos_tecnicos: string[];
    tipo_evento: string;
    responsable_nombre: string;
    responsable_cargo: string;
    responsable_telefono: string;
    correo_confirmacion: string;
    horaInicio: string;
    horaFin: string;
}

interface Step4Props {
    data: WizardData;
    onConfirm: () => void;
    onBack: () => void;
    onDataChange: (data: Partial<WizardData>) => void;
    submissionResult?: {
        status: 'success' | 'error' | 'idle';
        message: string;
        id?: string | number;
    } | null;
    isSubmitting?: boolean;
}

export function Step4Responsable({ data, onConfirm, onBack, onDataChange, submissionResult, isSubmitting = false }: Step4Props) {
    const {
        register,
        handleSubmit,
        formState: { errors, touchedFields },
        watch
    } = useForm<ResponsableFormValues>({
        resolver: zodResolver(responsableSchema),
        defaultValues: {
            responsable_nombre: data.responsable_nombre,
            responsable_cargo: data.responsable_cargo,
            responsable_telefono: data.responsable_telefono,
            correo_confirmacion: data.correo_confirmacion,
        },
        mode: 'onChange' // Validate as user types
    });

    // 2. Sync form changes to Parent State immediately (so back button preserves data)
    // We use a watcher or effect. Here, we sync on change.
    // We use a watcher or effect. Here, we sync on change.
    const values = watch();
    useEffect(() => {
        onDataChange(values);
    }, [values.responsable_nombre, values.responsable_cargo, values.responsable_telefono, values.correo_confirmacion, onDataChange]);

    const onSubmit = (_formValues: ResponsableFormValues) => {
        // Validation passed via handleSubmit
        // Data is already synced to parent via useEffect
        onConfirm();
    };

    const isSuccess = submissionResult?.status === 'success';

    if (isSuccess) {
        return (
            <div className="animate-fade-in flex flex-col items-center justify-center py-10">
                <div className="p-8 bg-green-50 border border-green-200 rounded-lg flex flex-col items-center justify-center text-center shadow-sm max-w-lg w-full">
                    <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Su solicitud de reserva del Auditorio Filomena fue registrada exitosamente</h2>
                    <p className="text-green-700 mb-6 w-full">
                        Se ha enviado un correo de confirmación a <strong>{data.correo_confirmacion}</strong>.
                    </p>

                    <div className="bg-white p-6 rounded border border-green-200 mb-6 w-full text-left space-y-3">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Dependencia</p>
                            <p className="font-medium text-gray-900">{data.entity?.officialName}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Fecha y Horario</p>
                            <p className="font-medium text-gray-900">
                                {data.fecha} | {data.jornada?.replace('_', ' ')} ({data.horaInicio} - {data.horaFin})
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Estado</p>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Pendiente de aprobación
                            </span>
                        </div>
                        <div className="pt-4 border-t border-gray-200 mt-4 text-center">
                            <p className="text-sm text-gray-500 uppercase font-bold mb-2 tracking-wide">Código de Radicado</p>
                            <p className="text-4xl font-mono font-black text-[var(--primary-color)] tracking-widest bg-blue-50 py-3 rounded-lg border-2 border-[var(--primary-color)] border-dashed inline-block px-10">
                                #{submissionResult.id || 'PENDIENTE'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                        <Link
                            to={`/seguimiento/${submissionResult.id}`}
                            className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors shadow-sm text-center"
                        >
                            Ver Estado de Solicitud
                        </Link>
                        <Link
                            to="/"
                            className="px-6 py-2.5 bg-white text-gray-700 border border-gray-300 font-medium rounded-md hover:bg-gray-50 transition-colors shadow-sm text-center"
                        >
                            Volver al Inicio
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Error Banner */}
            {submissionResult && submissionResult.status === 'error' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
                    <div className="text-red-500 font-bold">!</div>
                    <div>
                        <h4 className="text-sm font-medium text-red-800">No fue posible completar la solicitud</h4>
                        <p className="text-sm text-red-700">{submissionResult.message}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* LEFT COLUMN: FORM */}
                <div className="space-y-6">
                    <h3 className="text-lg font-medium text-[var(--primary-color)] flex items-center gap-2 border-b border-gray-200 pb-2">
                        Datos del Responsable
                    </h3>

                    <form id="responsable-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre Responsable <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    {...register('responsable_nombre')}
                                    className={`w-full p-2 pr-10 border rounded-md focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent ${errors.responsable_nombre ? 'border-red-500 bg-red-50' : 'border-gray-300'} ${!errors.responsable_nombre && touchedFields.responsable_nombre ? 'border-green-500 bg-green-50/30' : ''}`}
                                    placeholder="Nombre del funcionario responsable"
                                    disabled={isSubmitting}
                                />
                                {touchedFields.responsable_nombre && !errors.responsable_nombre && (
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none animate-fade-in">
                                        <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                                {errors.responsable_nombre && (
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none animate-fade-in">
                                        <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            {errors.responsable_nombre && (
                                <p role="alert" className="mt-1 text-xs text-red-600 font-medium">
                                    {errors.responsable_nombre.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cargo <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                {...register('responsable_cargo')}
                                className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent ${errors.responsable_cargo ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                placeholder="Ej. Profesional Universitario"
                                disabled={isSubmitting}
                            />
                            {errors.responsable_cargo && (
                                <p role="alert" className="mt-1 text-xs text-red-600 font-medium">
                                    {errors.responsable_cargo.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Teléfono de Contacto <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="tel"
                                    {...register('responsable_telefono')}
                                    className={`w-full p-2 pr-10 border rounded-md focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent ${errors.responsable_telefono ? 'border-red-500 bg-red-50' : 'border-gray-300'} ${!errors.responsable_telefono && touchedFields.responsable_telefono ? 'border-green-500 bg-green-50/30' : ''}`}
                                    placeholder="3001234567"
                                    maxLength={10}
                                    disabled={isSubmitting}
                                />
                                {touchedFields.responsable_telefono && !errors.responsable_telefono && (
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none animate-fade-in">
                                        <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                                {errors.responsable_telefono && (
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none animate-fade-in">
                                        <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            {errors.responsable_telefono && (
                                <p role="alert" className="mt-1 text-xs text-red-600 font-medium">
                                    {errors.responsable_telefono.message}
                                </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">Esta persona recibirá las notificaciones del proceso.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Correo Electrónico <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    {...register('correo_confirmacion')}
                                    className={`w-full p-2 pr-10 border rounded-md focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent ${errors.correo_confirmacion ? 'border-red-500 bg-red-50' : 'border-gray-300'} ${!errors.correo_confirmacion && touchedFields.correo_confirmacion ? 'border-green-500 bg-green-50/30' : ''}`}
                                    placeholder="nombre@entidad.gov.co"
                                    disabled={isSubmitting}
                                />
                                {touchedFields.correo_confirmacion && !errors.correo_confirmacion && (
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none animate-fade-in">
                                        <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                                {errors.correo_confirmacion && (
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none animate-fade-in">
                                        <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            {errors.correo_confirmacion && (
                                <p role="alert" className="mt-1 text-xs text-red-600 font-medium">
                                    {errors.correo_confirmacion.message}
                                </p>
                            )}
                        </div>
                    </form>
                </div>

                {/* RIGHT COLUMN: SUMMARY */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 h-fit">
                    <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
                        Detalles de la Solicitud
                    </h3>

                    <div className="space-y-4">
                        <dl className="space-y-2 text-sm">
                            <div>
                                <dt className="text-gray-500 text-xs uppercase">Auditorio</dt>
                                <dd className="font-medium text-gray-900">{data.auditorio?.nombre}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-500 text-xs uppercase">Fecha y Horario</dt>
                                <dd className="font-medium text-gray-900">
                                    {data.fecha} <span className="text-gray-400">|</span> {data.jornada?.replace('_', ' ')} ({data.horaInicio} - {data.horaFin})
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500 text-xs uppercase">Título</dt>
                                <dd className="font-medium text-gray-900">{data.titulo}</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="mt-6 bg-yellow-50 p-3 rounded border border-yellow-200 text-xs text-yellow-800">
                        <strong>Declaración:</strong> Al confirmar, certifica que los datos ingresados son verídicos.
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                    onClick={onBack}
                    className="px-4 py-2 rounded text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                    disabled={isSubmitting}
                    type="button"
                >
                    Atrás
                </button>
                <button
                    // We trigger form submit programmatically or link button to form
                    // Linking via form attribute is cleanest
                    form="responsable-form"
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 py-2 rounded-md text-sm font-medium text-white transition-all shadow-sm flex items-center gap-2
                        ${isSubmitting
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 hover:shadow-md transform hover:-translate-y-0.5'
                        }`}
                >
                    {isSubmitting ? (
                        <>
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Registrando solicitud...
                        </>
                    ) : (
                        'Confirmar Solicitud'
                    )}
                </button>
            </div>
        </div>
    );
}
