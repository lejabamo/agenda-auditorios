
interface WizardStepIndicatorProps {
    currentStep: number;
    steps: string[];
}

export function WizardStepIndicator({ currentStep, steps }: WizardStepIndicatorProps) {
    return (
        <div className="w-full">
            {/* Mobile / Stacked for very small screens, Row for larger */}
            <nav aria-label="Progress">
                <ol role="list" className="overflow-hidden bg-white border border-[var(--border-color)] rounded-md md:flex md:rounded-lg shadow-sm">
                    {steps.map((step, stepIdx) => {
                        const stepNumber = stepIdx + 1;
                        const isComplete = stepNumber < currentStep;
                        const isCurrent = stepNumber === currentStep;
                        const isLast = stepIdx === steps.length - 1;

                        return (
                            <li key={step} className="relative md:flex-1 md:flex">
                                {isComplete ? (
                                    <div className="group flex items-center w-full">
                                        <div className="px-6 py-4 flex items-center text-sm font-medium w-full">
                                            <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-green-600 rounded-full group-hover:bg-green-800 transition-colors">
                                                <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </span>
                                            <div className="ml-4 flex flex-col min-w-0">
                                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Paso {stepNumber}</span>
                                                <span className="text-sm font-medium text-gray-900 truncate">{step}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : isCurrent ? (
                                    <div className="flex items-center px-6 py-4 text-sm font-medium w-full border-t-4 border-[var(--primary-color)] md:border-t-0 md:border-l-4 bg-gray-50 md:bg-white" aria-current="step">
                                        <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center border-2 border-[var(--primary-color)] rounded-full">
                                            <span className="text-[var(--primary-color)] font-bold">{stepNumber}</span>
                                        </span>
                                        <div className="ml-4 flex flex-col min-w-0">
                                            <span className="text-xs font-semibold text-[var(--primary-color)] uppercase tracking-wide">Paso {stepNumber}</span>
                                            <span className="text-sm font-bold text-gray-900 truncate">{step}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="group flex items-center w-full">
                                        <div className="px-6 py-4 flex items-center text-sm font-medium w-full">
                                            <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center border-2 border-gray-300 rounded-full">
                                                <span className="text-gray-500">{stepNumber}</span>
                                            </span>
                                            <div className="ml-4 flex flex-col min-w-0">
                                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Paso {stepNumber}</span>
                                                <span className="text-sm font-medium text-gray-500 truncate">{step}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Divider - Hidden on mobile, visible on desktop between items */}
                                {!isLast ? (
                                    <>
                                        {/* Mobile Divider */}
                                        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gray-200 md:hidden" aria-hidden="true"></div>
                                        {/* Desktop Arrow/Divider */}
                                        <div className="hidden md:block absolute top-0 right-0 h-full w-5" aria-hidden="true">
                                            <svg className="h-full w-full text-gray-300" viewBox="0 0 22 80" fill="none" preserveAspectRatio="none">
                                                <path d="M0 -2L20 40L0 82" vectorEffect="non-scaling-stroke" stroke="currentcolor" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </>
                                ) : null}
                            </li>
                        );
                    })}
                </ol>
            </nav>
        </div>
    );
}
