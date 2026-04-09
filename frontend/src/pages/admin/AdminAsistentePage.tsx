import { DashboardAssistant } from '@/features/assistance/components/DashboardAssistant';

export default function AdminAsistentePage() {
    return (
        <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-in">
            <header className="mb-10 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-3xl mb-4 shadow-inner">
                    <span className="text-4xl" role="img" aria-label="Robot">🤖</span>
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Oficina Virtual de Agenda</h1>
                <p className="mt-2 text-lg text-gray-500">Consulta disponibilidad, agenda eventos y gestiona tu tiempo con Inteligencia Artificial.</p>
            </header>

            <main className="bg-white rounded-3xl shadow-xl overflow-hidden border border-indigo-50 min-h-[600px]">
                <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 px-8 py-6">
                    <h2 className="text-white font-bold flex items-center gap-3">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        Asistente Conectado (Daredevil Mode)
                    </h2>
                </div>
                
                <div className="p-8">
                    <DashboardAssistant />
                </div>
            </main>

            <footer className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                    <h3 className="font-bold text-indigo-900 text-sm mb-2">Comandos Rápidos</h3>
                    <ul className="text-xs text-indigo-700 space-y-2">
                        <li>• "¿Qué tardes están libres la otra semana?"</li>
                        <li>• "¿Hay eventos mañana por la mañana?"</li>
                        <li>• "Muestra la agenda de hoy"</li>
                    </ul>
                </div>
                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                    <h3 className="font-bold text-blue-900 text-sm mb-2">Accesibilidad</h3>
                    <p className="text-xs text-blue-700">Diseñado para navegación por teclado y lectores de pantalla. Usa Alt+A para volver aquí.</p>
                </div>
                <div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100">
                    <h3 className="font-bold text-purple-900 text-sm mb-2">Acciones Directas</h3>
                    <p className="text-xs text-purple-700">Si un espacio está libre, puedes decir "Sí, agendar" para abrir el formulario rápido.</p>
                </div>
            </footer>
        </div>
    );
}
