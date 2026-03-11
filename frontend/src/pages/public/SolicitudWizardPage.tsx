import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBooking } from '@/context/BookingContext';
import { EntitySelectorStep } from '@/features/solicitud/steps/EntitySelectorStep';
import { Step2AuditorioFecha, type Jornada } from '@/features/solicitud/steps/Step2AuditorioFecha';
import { Step3DetallesEvento } from '@/features/solicitud/steps/Step3DetallesEvento';
import { Step4Responsable } from '@/features/solicitud/steps/Step4Responsable';
import type { Entity } from '@/types/models/entity';
import type { Auditorio } from '@/types/models/auditorio';

import { eventoService } from '@/services/eventoService';

// Internal Component: Hold Timer
const HoldTimer = ({ startTime, onExpire }: { startTime: number; onExpire: () => void }) => {
    const [timeLeft, setTimeLeft] = useState<number>(0);

    useEffect(() => {
        // 10 minutes from start time
        const endTime = startTime + 10 * 60 * 1000;

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = endTime - now;

            if (diff <= 0) {
                setTimeLeft(0);
                clearInterval(interval);
                onExpire();
            } else {
                setTimeLeft(diff);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime, onExpire]);

    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);

    // Urgent visual state if < 2 mins
    const isUrgent = minutes < 2;

    if (timeLeft <= 0) return <span className="text-red-600 font-bold">Tiempo agotado</span>;

    return (
        <div className={`flex items-center gap-2 text-sm font-medium ${isUrgent ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>
                Reserva temporal: {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
        </div>
    );
};

export default function SolicitudWizardPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { selectedSlot, isInitialized } = useBooking();

    // Check if we are inside the admin panel
    const isAdminView = location.pathname.startsWith('/admin/');

    // -------------------------------------------------------------
    // 1. HOOKS (State & Context) - ALWAYS executed first
    // -------------------------------------------------------------

    // Initialize state from Context
    const [holdStartTime] = useState<number>(Date.now());
    const [holdExpired, setHoldExpired] = useState(false);

    const [currentStep, setCurrentStep] = useState(1);
    const [submissionResult, setSubmissionResult] = useState<{ status: 'success' | 'error' | 'idle', message: string, id?: string | number } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [wizardData, setWizardData] = useState<{
        entity: Entity | null;
        auditorio: Auditorio | null;
        fecha: string;
        jornada: Jornada | '';
        horaInicio: string;
        horaFin: string;
        titulo: string;
        descripcion: string;
        aforo_estimado: number | '';
        requerimientos_tecnicos: string[];
        tipo_evento: string;
        responsable_nombre: string;
        responsable_cargo: string;
        responsable_telefono: string;
        correo_confirmacion: string;
        holdId?: number;
    }>({
        entity: null,
        auditorio: selectedSlot ? { id: selectedSlot.auditorioId, nombre: 'Auditorio Filomena', capacidad: 60, ubicacion: 'Sede Central', activo: true } : null,
        fecha: selectedSlot ? selectedSlot.fechaInicio.split('T')[0] : '',
        jornada: (selectedSlot?.jornada as Jornada) || '',
        horaInicio: selectedSlot
            ? `${new Date(selectedSlot.fechaInicio).getHours().toString().padStart(2, '0')}:${new Date(selectedSlot.fechaInicio).getMinutes().toString().padStart(2, '0')}`
            : '08:00',
        horaFin: selectedSlot
            ? `${new Date(selectedSlot.fechaFin).getHours().toString().padStart(2, '0')}:${new Date(selectedSlot.fechaFin).getMinutes().toString().padStart(2, '0')}`
            : '18:00',
        titulo: '',
        descripcion: '',
        aforo_estimado: '',
        requerimientos_tecnicos: [],
        tipo_evento: '',
        responsable_nombre: '',
        responsable_cargo: '',
        responsable_telefono: '',
        correo_confirmacion: '',
        holdId: selectedSlot?.holdId
    });

    // -------------------------------------------------------------
    // 2. LOGGING & SIDE EFFECTS
    // -------------------------------------------------------------

    console.log("Wizard Render - selectedSlot:", selectedSlot, "Initialized:", isInitialized);

    // GUARD: Only redirect if it's admin view without a slot. Public app allows starting from scratch (mobile).
    useEffect(() => {
        if (isInitialized && !selectedSlot && isAdminView) {
            navigate('/admin/calendario');
        }
    }, [selectedSlot, navigate, isInitialized, isAdminView]);

    // -------------------------------------------------------------
    // 3. CONDITIONAL RENDERING (Guards) - Must be LAST
    // -------------------------------------------------------------

    // Guards moved to bottom to prevent Hook Error

    const handleEntitySelect = useCallback((entity: Entity) => {
        setWizardData(prev => ({ ...prev, entity }));
    }, []);

    const handleDataChange = useCallback((newData: Partial<typeof wizardData>) => {
        setWizardData(prev => ({ ...prev, ...newData }));
    }, []);

    const handleNext = () => {
        setSubmissionResult(null);
        if (currentStep === 1 && wizardData.entity) {
            setCurrentStep(2);
        } else if (currentStep === 2) {
            setCurrentStep(3);
        } else if (currentStep === 3) {
            setCurrentStep(4);
        }
    };

    const handleConfirm = async () => {
        setIsSubmitting(true);
        setSubmissionResult(null);
        try {
            // Pass holdId for backend validation
            const payload = {
                ...wizardData,
                hold_id: wizardData.holdId
            };
            const response = await eventoService.submitSolicitud(payload);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((response as any).status === 'ok' || (response as any).success === true) {
                const id = (response as any).data?.id || (response as any).id;

                setSubmissionResult({
                    status: 'success',
                    message: 'Su solicitud fue registrada correctamente.',
                    id: id
                });

                // Limpiar disclaimer para futuras reservas
                try {
                    sessionStorage.removeItem('auditorio_disclaimer_accepted');
                } catch (e) { }
            } else {
                throw new Error('Respuesta inesperada del servidor');
            }
        } catch (error: any) {
            let errorMessage = 'No fue posible registrar la solicitud en este momento.';
            if (error.status) {
                if (error.status === 400) {
                    errorMessage = error.message || 'Por favor verifique los datos.';
                } else if (error.status === 409) {
                    // Should be rare due to hold
                    errorMessage = 'El espacio seleccionado ya no está disponible.';
                }
            }
            setSubmissionResult({
                status: 'error',
                message: errorMessage
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleHoldExpire = useCallback(() => {
        setHoldExpired(true);
        // Optional: Disable submission or show blocking modal
    }, []);

    // Helper Text Logic
    let helperText = '';
    let isNextDisabled = true;

    if (currentStep === 1) {
        isNextDisabled = !wizardData.entity;
        helperText = isNextDisabled ? "Seleccione su dependencia para continuar." : "";
    } else if (currentStep === 2) {
        // On mobile we must ensure fecha and jornada are selected.
        const hasBasicData = wizardData.fecha && wizardData.jornada && wizardData.auditorio;
        
        // Time Validation Logic (Mirroring Backend)
        let timeError = "";
        if (hasBasicData && !isAdminView) {
            const now = new Date();
            const selectedDate = new Date(wizardData.fecha + 'T00:00:00');
            
            // Normalize dates for comparison (ignoring time)
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            
            const currentHour = now.getHours();
            if (selectedDate.getTime() === today.getTime()) {
                if (currentHour >= 17) {
                    timeError = "No es posible programar eventos para hoy después de las 17:00.";
                } else if (wizardData.jornada === 'MAÑANA' && currentHour >= 12) {
                    timeError = "No es posible programar la jornada MAÑANA para hoy.";
                } else if (wizardData.jornada === 'TODO_EL_DIA' && currentHour >= 13) {
                    timeError = "No es posible programar la jornada TODO_EL_DIA para hoy.";
                }
            }
        }

        isNextDisabled = !hasBasicData || !!timeError;
        helperText = !hasBasicData ? "Seleccione auditorio, fecha y jornada." : timeError;
    } else if (currentStep === 3) {
        const hasTitle = !!wizardData.titulo;
        const hasValidAforo = wizardData.aforo_estimado !== '' && wizardData.aforo_estimado > 0;
        const hasRequerimientosSelection = wizardData.requerimientos_tecnicos.length > 0;
        const capacityExceeded = !!wizardData.auditorio && typeof wizardData.aforo_estimado === 'number' && wizardData.aforo_estimado > wizardData.auditorio.capacidad;
        
        isNextDisabled = !hasTitle || !hasValidAforo || !hasRequerimientosSelection || capacityExceeded;
        
        if (!hasTitle || !hasValidAforo) {
            helperText = "Complete el título y aforo del evento.";
        } else if (!hasRequerimientosSelection) {
            helperText = "Indique si requiere equipos tecnológicos.";
        } else if (capacityExceeded) {
            helperText = "El aforo excede la capacidad del auditorio.";
        } else {
            helperText = "";
        }
    }

    // -------------------------------------------------------------
    // Guards (Must be after all hooks)
    // -------------------------------------------------------------
    if (!isInitialized) return <div className="p-10 flex justify-center text-gray-500">Cargando reserva...</div>;
    // Removed the !selectedSlot return null guard to allow entering from mobile landing page.

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            {/* Header with Timer */}
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-lg shadow-sm border border-gray-100 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--primary-color)]">
                        {isAdminView ? 'Nueva Solicitud Interna' : 'Solicitud de Uso de Espacio'}
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">Complete la información para confirmar su reserva.</p>
                </div>
                {wizardData.holdId && !holdExpired && (
                    <div className="bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
                        <HoldTimer startTime={holdStartTime} onExpire={handleHoldExpire} />
                    </div>
                )}
            </div>

            {/* Expired State Blocking UI */}
            {holdExpired ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center animate-fade-in">
                    <div className="text-red-500 mb-4 flex justify-center">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">El tiempo de reserva ha expirado</h2>
                    <p className="text-gray-600 mb-6">El bloque que seleccionó ha sido liberado. Por favor inicie una nueva solicitud.</p>
                    <a href={isAdminView ? "/admin/calendario" : "/"} className="px-6 py-2 bg-[var(--primary-color)] text-white rounded-md hover:opacity-90 transition-opacity">
                        Volver al Calendario
                    </a>
                </div>
            ) : (
                <>
                    <div className="mb-8">
                        {/* ... existing WizardStepIndicator ... */}


                        {currentStep === 1 && (
                            <div className="animate-fade-in">
                                <h2 className="text-lg font-semibold mb-6">Identificación del Solicitante</h2>
                                <EntitySelectorStep
                                    onEntitySelect={handleEntitySelect}
                                    initialEntity={wizardData.entity}
                                />
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="animate-fade-in">
                                <div className="mb-6">
                                    <h2 className="text-lg font-semibold text-[var(--primary-color)]">
                                        Paso 2 de 4 – Confirmación de reserva
                                    </h2>
                                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                                        Verifique los datos de la reserva seleccionada en el calendario.
                                    </p>
                                </div>
                                <Step2AuditorioFecha
                                    data={wizardData}
                                    onDataChange={handleDataChange}
                                    isAdminView={isAdminView}
                                />
                            </div>
                        )}
                        {currentStep === 3 && (
                            <div className="animate-fade-in">
                                <div className="mb-6">
                                    <h2 className="text-lg font-semibold text-[var(--primary-color)]">
                                        Paso 3 de 4 – Detalles del Evento
                                    </h2>
                                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                                        Describe el propósito y necesidades técnicas de tu evento
                                    </p>
                                </div>
                                <Step3DetallesEvento
                                    data={wizardData}
                                    auditorio={wizardData.auditorio}
                                    onDataChange={handleDataChange}
                                />
                            </div>
                        )}
                        {currentStep === 4 && (
                            <div className="animate-fade-in">
                                <Step4Responsable
                                    data={wizardData}
                                    onConfirm={handleConfirm}
                                    onBack={() => setCurrentStep(3)}
                                    onDataChange={handleDataChange}
                                    submissionResult={submissionResult}
                                    isSubmitting={isSubmitting}
                                />
                            </div>
                        )}
                    </div>

                    {/* Wizard Footer Actions - Hidden on Step 4 AND if blocked */}
                    {(currentStep !== 4 && !holdExpired) && (
                        <div className="bg-white sm:bg-gray-50 px-6 py-4 border-t border-[var(--border-color)] flex flex-row justify-between items-center fixed bottom-0 left-0 right-0 z-20 sm:static sm:z-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] sm:shadow-none">
                            <button
                                onClick={() => {
                                    if (currentStep === 1) {
                                        navigate(isAdminView ? "/admin/calendario" : "/");
                                    } else {
                                        setCurrentStep(p => Math.max(1, p - 1));
                                    }
                                }}
                                className="px-4 py-2 rounded text-sm font-medium transition-colors text-gray-500 hover:text-gray-900 bg-transparent hover:bg-gray-100"
                            >
                                {currentStep === 1 ? 'Cancelar' : '← Atrás'}
                            </button>

                            <div className="flex flex-col items-end">
                                <button
                                    onClick={handleNext}
                                    disabled={isNextDisabled}
                                    className="px-6 py-2 rounded-md text-sm font-medium text-white transition-all shadow-sm bg-[var(--primary-color)] hover:bg-[var(--primary-light)] hover:shadow disabled:bg-gray-300 disabled:cursor-not-allowed w-full sm:w-auto"
                                >
                                    Continuar
                                </button>
                                {isNextDisabled && helperText && (
                                    <span className="hidden sm:block text-xs text-amber-600 mt-1 font-medium animate-fade-in block">
                                        {helperText}
                                    </span>
                                )}
                                {/* Mobile Helper Text Overlay */}
                                {isNextDisabled && helperText && (
                                    <span className="sm:hidden fixed bottom-20 left-4 right-4 text-center text-xs text-amber-700 font-medium bg-amber-50 py-2 px-3 rounded-md border border-amber-200 shadow-sm animate-fade-in">
                                        {helperText}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Footer space - increased on mobile for sticky bar */}
            <div className="mb-24 sm:mb-12"></div>
        </div>
    );
}
