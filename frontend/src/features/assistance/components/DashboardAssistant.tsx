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

    const speakResponse = (res: AssistanceResponse) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        
        let speechText = res.text;

        // DYNAMIC DATA SUMMARY FOR VOISE
        if (res.intent === 'AGENDA' && res.data && res.data.length > 0) {
            speechText += ` . He encontrado ${res.data.length} eventos registrados. `;
            res.data.forEach((e: any, index: number) => {
                speechText += `Evento ${index + 1}: ${e.evento} en jornada ${e.jornada}. `;
            });
        }

        if (res.intent === 'AVAILABILITY' && res.text.includes('Reporte')) {
            // Simplified summary for long reports
            speechText = res.text.replace(/✅|⚖️/g, "").replace(/\n/g, ". ");
        }
        
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.lang = 'es-ES';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    };

    const startListening = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Tu navegador no soporta reconocimiento de voz.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.start();

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setQuery(transcript);
        };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const currentQuery = query.trim();
        if (!currentQuery || loading) return;

        setLoading(true);
        try {
            const res = await processQuery(currentQuery, rawEvents, auditorios, conversationState);
            setResponse(res);
            setConversationState(res.newState || null);
            
            // VOICE FEEDBACK: Read interpreted response and data summary
            speakResponse(res);

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
        const res: AssistanceResponse = {
            intent: 'GREETING',
            text: message,
            displayType: 'text'
        };
        setWizardContext(null);
        setResponse(res);
        speakResponse(res);
    };

    return (
        <section 
            className={`${isGlobal ? 'bg-white' : 'bg-white rounded-lg shadow-sm border-2 border-indigo-100 overflow-hidden'}`} 
            aria-labelledby="assistant-heading"
        >
            {!isGlobal && (
                <div className="bg-indigo-600 px-6 py-3 flex items-center justify-between">
                    <h2 id="assistant-heading" className="text-white font-bold text-sm flex items-center gap-2">
                        <span role="img" aria-label="Robot">🤖</span> Centro de Comando Daredevil (Voz Activa)
                    </h2>
                    <span className="text-indigo-100 text-[10px] uppercase font-bold tracking-wider">Accesibilidad Total</span>
                </div>
            )}

            <div className="p-6">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            ref={inputRef}
                            type="text"
                            disabled={loading}
                            className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none disabled:opacity-50"
                            placeholder={loading ? "Escuchando..." : "Escribe o usa el micrófono..."}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            aria-label="Pregunta al asistente"
                        />
                        <button
                            type="button"
                            onClick={startListening}
                            className={`absolute right-2 top-1.5 bottom-1.5 px-3 rounded-lg transition-all ${loading ? 'opacity-30' : 'hover:bg-indigo-50 text-indigo-600'}`}
                            title="Hablar (Activar micrófono)"
                        >
                            <span className="text-xl">🎙️</span>
                        </button>
                    </div>
                    <button 
                        type="submit"
                        disabled={loading}
                        className="px-6 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
                    >
                        {loading ? '...' : 'ENVIAR'}
                    </button>
                </form>

                {response && (
                    <div className="mt-8 animate-fade-in border-t border-gray-100 pt-6" aria-live="assertive" role="status">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
                                🤖
                            </div>
                            <div className="flex-1">
                                <p className="text-base text-gray-800 leading-relaxed font-semibold mb-4">
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
