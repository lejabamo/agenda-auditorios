export default function AdminSolicitudesPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-[var(--primary-color)]">Solicitudes Recibidas</h1>
                <div className="flex gap-2">
                    <input type="text" placeholder="Filtrar..." className="border px-3 py-1 rounded" />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[var(--border-color)] overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entidad</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#1024</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Ministerio de Salud</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12 Feb 2026</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                    Pendiente
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <a href="#" className="text-indigo-600 hover:text-indigo-900">Revisar</a>
                            </td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#1023</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Secretaría de Cultura</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">10 Feb 2026</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    Aprobado
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <a href="#" className="text-gray-400 hover:text-gray-600">Ver</a>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
