export default function AdminDashboardPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-[var(--primary-color)]">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-[var(--border-color)]">
                    <h3 className="text-sm font-medium text-gray-500">Eventos Hoy</h3>
                    <p className="text-3xl font-bold text-[var(--primary-color)] mt-2">12</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-[var(--border-color)]">
                    <h3 className="text-sm font-medium text-gray-500">Solicitudes Pendientes</h3>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">5</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-[var(--border-color)]">
                    <h3 className="text-sm font-medium text-gray-500">Ocupación Semanal</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">78%</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-[var(--border-color)] min-h-[300px] flex items-center justify-center">
                <span className="text-gray-400">Gráfico de Ocupación (Placeholder)</span>
            </div>
        </div>
    );
}
