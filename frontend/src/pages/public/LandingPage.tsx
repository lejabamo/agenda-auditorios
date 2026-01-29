export default function LandingPage() {
    return (
        <div className="space-y-12">
            <section className="text-center space-y-4 py-12">
                <h1 className="text-4xl font-bold text-[var(--primary-color)]">
                    Reserva de Espacios Institucionales
                </h1>
                <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
                    Consulte disponibilidad y gestione sus solicitudes de auditorios de manera rápida y transparente.
                </p>
            </section>

            {/* Quick Status Check Placeholder */}
            <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-sm border border-[var(--border-color)]">
                <h2 className="text-lg font-semibold mb-4 text-[var(--primary-color)]">Consultar Estado de Solicitud</h2>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Ingrese código (ej. SL-2024-001)"
                        className="flex-1 px-4 py-2 border rounded border-gray-300 focus:outline-none focus:border-[var(--accent-color)]"
                    />
                    <button className="px-4 py-2 bg-[var(--primary-color)] text-white rounded hover:bg-[var(--primary-light)]">
                        Buscar
                    </button>
                </div>
            </div>
        </div>
    );
}
