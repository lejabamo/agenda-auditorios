import { Outlet, Link } from 'react-router-dom';

export default function PublicLayout() {
    return (
        <div className="min-h-screen flex flex-col bg-[var(--background-color)]">
            {/* Header Institucional */}
            <header className="bg-[var(--surface-color)] border-b border-[var(--border-color)] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[var(--primary-color)] rounded-full flex items-center justify-center text-white font-bold">
                        G
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-[var(--primary-color)] m-0 leading-tight">
                            Gobierno Institucional
                        </h1>
                        <span className="text-sm text-[var(--text-secondary)]">Agenda de Auditorios</span>
                    </div>
                </div>
                <nav className="flex gap-4">
                    <Link to="/" className="text-[var(--text-secondary)] hover:text-[var(--primary-color)] font-medium">
                        Inicio
                    </Link>
                    <Link to="/solicitar" className="px-4 py-2 bg-[var(--primary-color)] text-white rounded-md hover:opacity-90 transition-opacity no-underline">
                        Nueva Solicitud
                    </Link>
                </nav>
            </header>

            {/* Contenido Principal */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-[var(--surface-color)] border-t border-[var(--border-color)] py-8 mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center text-[var(--text-secondary)] text-sm">
                    <p>© {new Date().getFullYear()} Gobierno Institucional. Todos los derechos reservados.</p>
                </div>
            </footer>
        </div>
    );
}
