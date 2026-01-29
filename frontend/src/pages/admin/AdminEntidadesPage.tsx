export default function AdminEntidadesPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-[var(--primary-color)]">Entidades Registradas</h1>
                <button className="px-4 py-2 bg-[var(--primary-color)] text-white rounded hover:bg-[var(--primary-light)]">
                    + Nueva Entidad
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[var(--border-color)] p-8 text-center text-gray-500">
                <p>Listado y CRUD de Entidades y Contactos.</p>
                <p className="text-sm mt-2">Permitir fusión de entidades duplicadas y edición de datos maestros.</p>
            </div>
        </div>
    );
}
