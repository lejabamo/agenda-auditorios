import { Outlet, Link, NavLink } from 'react-router-dom';

const ADMIN_LINKS = [
    { path: '/admin/dashboard', label: 'Dashboard' },
    { path: '/admin/calendario', label: 'Calendario' },
    { path: '/admin/solicitudes', label: 'Solicitudes' },
    { path: '/admin/entidades', label: 'Entidades' },
    { path: '/admin/auditorios', label: 'Auditorios' },
];

export default function AdminLayout() {
    return (
        <div className="flex h-screen bg-[var(--background-color)] overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-[var(--primary-color)] text-white flex flex-col shrink-0">
                <div className="p-6 border-b border-[var(--primary-light)]">
                    <h2 className="text-xl font-bold m-0 text-white">Administración</h2>
                    <span className="text-xs text-gray-400">Gestión de Espacios</span>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {ADMIN_LINKS.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            className={({ isActive }) =>
                                `block px-4 py-3 rounded-md transition-colors ${isActive
                                    ? 'bg-[var(--accent-color)] text-white font-medium'
                                    : 'text-gray-300 hover:bg-[var(--primary-light)]'
                                }`
                            }
                        >
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-[var(--primary-light)]">
                    <button className="w-full px-4 py-2 border border-gray-600 text-sm text-gray-300 rounded hover:bg-[var(--primary-light)]">
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar */}
                <header className="h-16 bg-[var(--surface-color)] border-b border-[var(--border-color)] px-6 flex items-center justify-between shadow-sm z-10">
                    <h3 className="text-lg font-medium text-[var(--text-primary)] m-0">
                        Panel de Control
                    </h3>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-[var(--text-secondary)]">Usuario Administrador</span>
                        <div className="w-8 h-8 rounded-full bg-gray-200" />
                    </div>
                </header>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-auto p-6 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
