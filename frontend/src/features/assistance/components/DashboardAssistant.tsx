import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { eventoService } from '@/services/eventoService';
import { auditorioService } from '@/services/auditorioService';
import { processQuery, type AssistanceResponse } from '../logic/AssistanceEngine';
import { ListResponse, AvailabilityList } from './ResponseComponents';
import { AccessibleAdminWizard } from './AccessibleAdminWizard';

export const DashboardAssistant = ({ isGlobal = false }: { isGlobal?: boolean }) => {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState<AssistanceResponse | null>(null);
    const [conversationState, setConversationState] = useState<any>(null);
    const [wizardContext, setWizardContext] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const { data: auditorios = [] } = useQuery({
        queryKey: ['admin-auditorios-list'],
        queryFn: auditorioService.getAllAuditorios,
        staleTime: 1000 * 60 * 5
    });

    const { data: rawEvents = [] } = useQuery({
        queryKey: ['admin-events-assistant-global'],
        queryFn: () => eventoService.getEvents({}),
        staleTime: 1000 * 30
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || loading) return;

        setLoading(true);
        try {
            const res = await processQuery(query, rawEvents, auditorios, conversationState);
            setResponse(res);
            setConversationState(res.newState || null);
            
            if (res.intent === 'START_BOOKING' && res.data) {
                setWizardContext(res.data);
            } else {
                setWizardContext(null); 
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setQuery('');
        }
    };

    const handleWizardSuccess = (message: string) => {
        setWizardContext(null);
        setResponse({
            intent: 'GREETING',
            text: message,
            displayType: 'text'
        });
    };

    return (
        <section 
            className={`${isGlobal ? 'bg-white' : 'bg-white rounded-lg shadow-sm border-2 border-indigo-100 overflow-hidden'}`} 
            aria-labelledby="assistant-heading"
        >
            {!isGlobal && (
                <div className="bg-indigo-600 px-6 py-3 flex items-center justify-between">
                    <h2 id="assistant-heading" className="text-white font-bold text-sm flex items-center gap-2">
                        <span role="img" aria-label="Robot">🤖</span> Asistente de Agenda Inteligente (Beta)
                    </h2>
                    <span className="text-indigo-100 text-[10px] uppercase font-bold tracking-wider">Módulo Experimental</span>
                </div>
            )}

            <div className="p-6">
                <form onSubmit={handleSubmit} className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        disabled={loading}
                        className="w-full pl-4 pr-24 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none disabled:opacity-50"
                        placeholder={loading ? "Procesando con IA..." : "Escribe: ¿Qué hay libre mañana? o ¿Agenda de la semana?"}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="Pregunta al asistente"
                    />
                    <button 
                        type="submit"
                        disabled={loading}
                        className="absolute right-2 top-1.5 bottom-1.5 px-4 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
                    >
                        {loading ? '...' : 'Preguntar'}
                    </button>
                </form>

                {response && (
                    <div className="mt-6 animate-fade-in border-t border-gray-100 pt-4" aria-live="polite" role="status">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                🤖
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-800 leading-relaxed font-medium">
                                    {response.text}
                                </p>
                                
                                {response.intent === 'AGENDA' && response.data && (
                                    <ListResponse data={response.data} title="Próximos eventos encontrados:" />
                                )}

                                {response.intent === 'AVAILABILITY' && response.data && (
                                    <AvailabilityList data={response.data} title="Disponibilidad por auditorio:" />
                                )}

                                {response.intent === 'START_BOOKING' && wizardContext && (
                                    <AccessibleAdminWizard 
                                        targetDate={wizardContext.targetDate}
                                        auditorioId={wizardContext.auditorioId}
                                        auditorioNombre={wizardContext.auditorioNombre}
                                        onClose={() => setWizardContext(null)}
                                        onSuccess={handleWizardSuccess}
                                    />
                                )}
                            </div>
                        </div>
                        <button 
                            onClick={() => { setResponse(null); setWizardContext(null); setConversationState(null); }}
                            className="mt-4 text-[10px] text-gray-400 hover:text-gray-600 font-bold uppercase tracking-widest"
                        >
                            Limpiar Respuesta
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};
