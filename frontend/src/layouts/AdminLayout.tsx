import { Outlet, NavLink, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AccessibilityAssistant } from '@/components/common/AccessibilityAssistant';

const ADMIN_LINKS = [
    { path: '/admin/dashboard', label: 'Dashboard' },
    { path: '/admin/calendario', label: 'Calendario' },
    { path: '/admin/solicitudes', label: 'Solicitudes' },
    { path: '/admin/entidades', label: 'Entidades' },
    { path: '/admin/auditorios', label: 'Auditorios' },
];

export default function AdminLayout() {
    const { isAuthenticated, isLoading, logout } = useAuth();

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">Cargando...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth/login" replace />;
    }

    return (
        <div className="flex h-screen bg-[var(--background-color)] overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-[var(--primary-color)] text-white flex flex-col shrink-0">
                <div className="p-6 border-b border-[var(--primary-light)] flex flex-col items-center justify-center gap-3">
                    <div className="bg-white p-4 rounded-2xl shadow-lg mx-auto w-full flex items-center justify-center mb-1">
                        <img src="/escudo.png" alt="Escudo Institucional" className="h-24 w-auto object-contain" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-lg font-bold m-0 text-white leading-tight">Administrativa y<br />Financiera</h2>
                        <span className="text-xs text-gray-300 mt-1 block">Gestión de Espacios</span>
                    </div>
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
                    <button
                        onClick={logout}
                        className="w-full px-4 py-2 border border-gray-600 text-sm text-gray-300 rounded hover:bg-[var(--primary-light)]"
                    >
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
                    <div className="flex items-center gap-4 group cursor-pointer" onClick={logout} title="Cerrar Sesión">
                        <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--accent-color)] transition-colors">Usuario Administrador</span>
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 group-hover:border-[var(--accent-color)] transition-all bg-white flex items-center justify-center p-1 shadow-sm">
                            <img src="/admin.png" alt="Admin" className="w-full h-full object-contain drop-shadow-sm" />
                        </div>
                    </div>
                </header>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-auto p-6 md:p-8">
                    <AccessibilityAssistant />
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
