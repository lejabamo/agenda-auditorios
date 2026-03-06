import { useState } from 'react';
import { AuditoriumCalendar } from '@/features/calendar/AuditoriumCalendar';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
    const [radicado, setRadicado] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (radicado.trim()) {
            navigate(`/seguimiento/${radicado}`);
        }
    };

    // Al llegar al inicio, nos aseguramos que para la próxima reserva
    // se le vuelva a pedir que acepte el disclaimer.
    try {
        sessionStorage.removeItem('auditorio_disclaimer_accepted');
    } catch (e) {
        // ignore
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header / Intro */}
            <div className="text-center space-y-2 py-4">
                <h1 className="text-3xl font-bold text-[var(--primary-color)]">
                    Agenda Auditorio Filomena
                </h1>
                <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
                    Seleccione un bloque verde (Libre) en el calendario para iniciar su solicitud.
                </p>
            </div>

            {/* Main Content: Calendar */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <AuditoriumCalendar className="h-[700px]" />
            </div>

            {/* Secondary: Collapsible Search */}
            <div className="max-w-xl mx-auto pt-8">
                <details className="group bg-white rounded-lg shadow-sm border border-[var(--border-color)] overflow-hidden">
                    <summary className="flex justify-between items-center font-medium cursor-pointer list-none p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <span className="flex items-center gap-2 text-[var(--primary-color)]">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            Consultar estado de solicitud por Radicado
                        </span>
                        <span className="transition group-open:rotate-180">
                            <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                        </span>
                    </summary>
                    <div className="text-neutral-600 p-6 border-t border-gray-100">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <input
                                type="text"
                                value={radicado}
                                onChange={(e) => setRadicado(e.target.value)}
                                placeholder="Ej. SL-2024-001"
                                className="flex-1 px-4 py-2 border rounded border-gray-300 focus:outline-none focus:border-[var(--accent-color)] focus:ring-1 focus:ring-[var(--accent-color)]"
                            />
                            <button
                                type="submit"
                                disabled={!radicado.trim()}
                                className="px-6 py-2 bg-[var(--primary-color)] text-white rounded hover:bg-[var(--primary-light)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Buscar
                            </button>
                        </form>
                        <p className="text-xs text-gray-400 mt-2">
                            Ingrese el código que recibió en su correo electrónico al finalizar la solicitud.
                        </p>
                    </div>
                </details>
            </div>
        </div>
    );
}
