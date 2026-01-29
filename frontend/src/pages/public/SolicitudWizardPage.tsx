import { useState } from 'react';
import { EntitySelectorStep } from '@/features/solicitud/steps/EntitySelectorStep';
import { Entity } from '@/types/models/entity';

export default function SolicitudWizardPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [wizardData, setWizardData] = useState<{
        entity: Entity | null;
    }>({
        entity: null
    });

    const handleEntitySelect = (entity: Entity) => {
        setWizardData(prev => ({ ...prev, entity }));
    };

    const handleNext = () => {
        if (currentStep === 1 && wizardData.entity) {
            setCurrentStep(2);
            // Aquí iría la lógica para pre-cargar datos del paso 2
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="mb-8 text-center sm:text-left">
                <h1 className="text-2xl font-bold text-[var(--primary-color)]">Nueva Solicitud de Espacio</h1>
                <p className="text-[var(--text-secondary)] mt-1">Complete el formulario para verificar disponibilidad</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[var(--border-color)] overflow-hidden">
                {/* Wizard Progress Header */}
                <div className="bg-gray-50 border-b border-[var(--border-color)]">
                    <div className="flex justify-between text-sm">
                        {/* Step 1 Indicator */}
                        <div className={`flex-1 p-3 text-center border-b-2 transition-colors ${currentStep >= 1 ? 'border-[var(--accent-color)] text-[var(--accent-color)] font-medium' : 'border-transparent text-gray-400'}`}>
                            1. Entidad
                        </div>
                        {/* Step 2 Indicator */}
                        <div className={`flex-1 p-3 text-center border-b-2 transition-colors ${currentStep >= 2 ? 'border-[var(--accent-color)] text-[var(--accent-color)] font-medium' : 'border-transparent text-gray-400'}`}>
                            2. Espacio
                        </div>
                        {/* Step 3 Indicator */}
                        <div className={`flex-1 p-3 text-center border-b-2 transition-colors ${currentStep >= 3 ? 'border-[var(--accent-color)] text-[var(--accent-color)] font-medium' : 'border-transparent text-gray-400'}`}>
                            3. Detalles
                        </div>
                        {/* Step 4 Indicator */}
                        <div className={`flex-1 p-3 text-center border-b-2 transition-colors ${currentStep >= 4 ? 'border-[var(--accent-color)] text-[var(--accent-color)] font-medium' : 'border-transparent text-gray-400'}`}>
                            4. Responsable
                        </div>
                    </div>
                </div>

                {/* Wizard Content Area */}
                <div className="p-6 sm:p-10 min-h-[400px]">
                    {currentStep === 1 && (
                        <div className="animate-fade-in">
                            <h2 className="text-lg font-semibold mb-6">Identificación de la Entidad</h2>
                            <EntitySelectorStep
                                onEntitySelect={handleEntitySelect}
                                initialEntity={wizardData.entity}
                            />
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="text-center py-12">
                            <span className="text-4xl block mb-4">🗓️</span>
                            <h3 className="text-lg font-medium text-gray-900">Selección de Fechas y Espacio</h3>
                            <p className="text-gray-500 mt-2">Próximamente: Componente de Calendario y Listado de Auditorios.</p>
                            <button
                                onClick={() => setCurrentStep(1)}
                                className="mt-6 text-sm text-[var(--accent-color)] underline"
                            >
                                Volver atrás
                            </button>
                        </div>
                    )}
                </div>

                {/* Wizard Footer Actions */}
                <div className="bg-gray-50 px-6 py-4 border-t border-[var(--border-color)] flex justify-between items-center">
                    <button
                        disabled={currentStep === 1}
                        onClick={() => setCurrentStep(p => Math.max(1, p - 1))}
                        className={`px-4 py-2 rounded text-sm font-medium transition-colors ${currentStep === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        Atrás
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={currentStep === 1 && !wizardData.entity}
                        className={`px-6 py-2 rounded-md text-sm font-medium text-white transition-all shadow-sm
              ${(currentStep === 1 && !wizardData.entity)
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-[var(--primary-color)] hover:bg-[var(--primary-light)] hover:shadow'
                            }`}
                    >
                        {currentStep === 4 ? 'Confirmar' : 'Continuar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
