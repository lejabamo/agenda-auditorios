export default function AdminCalendarioPage() {
    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-[var(--primary-color)]">Gestión de Calendario</h1>
                <div className="flex gap-2">
                    <button className="px-4 py-2 border rounded bg-white hover:bg-gray-50">Semana</button>
                    <button className="px-4 py-2 border rounded bg-[var(--primary-color)] text-white">Mes</button>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-lg shadow-sm border border-[var(--border-color)] flex items-center justify-center p-8">
                <p className="text-gray-500 text-center">
                    Aquí se integrará el componente de Calendario (e.g. FullCalendar o React-Big-Calendar).
                    <br />
                    Permitirá Drag & Drop de eventos.
                </p>
            </div>
        </div>
    );
}
