import { useState } from 'react';
import { DashboardAssistant } from './DashboardAssistant';

export const GlobalAIAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            {isOpen && (
                <div className="w-[450px] max-w-[90vw] animate-in slide-in-from-bottom-5 duration-300 shadow-2xl rounded-2xl overflow-hidden border border-indigo-100 bg-white">
                    <div className="flex justify-between items-center bg-indigo-700 px-4 py-2">
                        <span className="text-white text-xs font-bold uppercase tracking-widest">Asistente Daredevil AI</span>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="text-indigo-100 hover:text-white text-xs font-bold"
                            aria-label="Cerrar asistente"
                        >
                            Cerrar [X]
                        </button>
                    </div>
                    <div className="max-h-[70vh] overflow-y-auto">
                        <DashboardAssistant isGlobal />
                    </div>
                </div>
            )}
            
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-3 px-6 py-4 rounded-full font-bold shadow-xl transition-all
                    ${isOpen ? 'bg-indigo-50 text-indigo-700' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95'}
                `}
                aria-label={isOpen ? "Cerrar asistente" : "Abrir asistente de IA"}
                aria-expanded={isOpen}
            >
                <span className="text-2xl" aria-hidden="true">{isOpen ? '✖' : '🤖'}</span>
                {!isOpen && <span>¿Necesitas ayuda?</span>}
            </button>
        </div>
    );
};
