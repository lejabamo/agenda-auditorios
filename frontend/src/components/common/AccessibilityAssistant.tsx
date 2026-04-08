import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { eventoService } from '@/services/eventoService';
import { auditorioService } from '@/services/auditorioService';

export const AccessibilityAssistant = () => {
    const [audit, setAudit] = useState('');
    const [searchDate, setSearchDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [resultText, setResultText] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const { data: auditorios = [] } = useQuery({
        queryKey: ['admin-auditorios-list'],
        queryFn: auditorioService.getAllAuditorios,
        staleTime: 1000 * 60 * 5
    });

    const { data: rawEvents = [] } = useQuery({
        queryKey: ['admin-events-check-global'],
        queryFn: () => eventoService.getEvents({}),
        staleTime: 1000 * 30
    });

    const handleCheck = (e: React.FormEvent) => {
        e.preventDefault();
        const audObj = (auditorios as any[]).find(a => String(a.id) === audit);
        const audName = audObj?.nombre || 'el auditorio seleccionado';
        const dayEvents = rawEvents.filter((ev: any) => 
            ev.fecha_inicio.startsWith(searchDate) && 
            (!audit || String(ev.auditorio_id) === audit)
        );

        const morning = dayEvents.some((ev: any) => ev.jornada === 'MAÑANA' || ev.jornada === 'TODO_EL_DIA' || ev.jornada === 'MANANA');
        const afternoon = dayEvents.some((ev: any) => ev.jornada === 'TARDE' || ev.jornada === 'TODO_EL_DIA');

        let summary = `Resultado para ${audName} el ${format(parse(searchDate, 'yyyy-MM-dd', new Date()), 'eeee d "de" MMMM', { locale: es })}: `;

        if (!morning && !afternoon) {
            summary += "Está totalmente LIBRE. Puedes agendar en cualquier jornada.";
        } else if (morning && afternoon) {
            summary += "Está totalmente OCUPADO durante todo el día.";
        } else if (morning) {
            summary += "Está OCUPADO en la mañana, pero LIBRE en la tarde.";
        } else if (afternoon) {
            summary += "Está LIBRE en la mañana, pero OCUPADO en la tarde.";
        }

        setResultText(summary);
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md flex items-center gap-2 mb-4 transition-all"
                aria-label="Abrir Asistente de Consulta de Disponibilidad (Accesibilidad)"
            >
                <span aria-hidden="true">🎧</span> Asistente de Disponibilidad
            </button>
        );
    }

    return (
        <section className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 shadow-md animate-fade-in" aria-labelledby="acc-title-global">
            <div className="flex justify-between items-center mb-3">
                <h2 id="acc-title-global" className="text-sm font-bold text-blue-800 flex items-center gap-2">
                    <span aria-hidden="true">🎧</span> Asistente de Consulta Rápida
                </h2>
                <button onClick={() => { setIsOpen(false); setResultText(''); }} className="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase">
                    Cerrar Asistente
                </button>
            </div>
            <form onSubmit={handleCheck} className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label htmlFor="acc-aud-global" className="block text-[10px] uppercase font-bold text-blue-700 mb-1">Auditorio</label>
                    <select id="acc-aud-global" value={audit} onChange={e => setAudit(e.target.value)} required 
                        className="w-full border border-blue-300 rounded px-2 py-1.5 text-sm bg-white">
                        <option value="">Seleccione un auditorio...</option>
                        {(auditorios as any[]).map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                    </select>
                </div>
                <div className="w-40">
                    <label htmlFor="acc-date-global" className="block text-[10px] uppercase font-bold text-blue-700 mb-1">Fecha a consultar</label>
                    <input id="acc-date-global" type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)} required
                        className="w-full border border-blue-300 rounded px-2 py-1.5 text-sm bg-white" />
                </div>
                <button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-1.5 rounded text-sm font-bold shadow-sm transition-colors">
                    Consultar
                </button>
            </form>
            {resultText && (
                <div className="mt-4 p-3 bg-white border-l-4 border-blue-600 rounded shadow-inner" aria-live="assertive" role="status">
                    <p className="text-sm text-gray-800 font-medium">{resultText}</p>
                </div>
            )}
        </section>
    );
};
