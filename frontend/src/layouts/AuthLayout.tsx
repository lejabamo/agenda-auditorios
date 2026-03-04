import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
    return (
        <div className="min-h-screen flex bg-gray-50 font-sans">
            {/* Left: Brand/Image Area */}
            <div className="hidden lg:flex lg:w-[45%] bg-[#1A202C] items-center justify-center p-12 text-white relative overflow-hidden flex-col">
                <div className="relative z-10 w-full max-w-lg flex flex-col items-center text-center">
                    <div className="bg-white p-6 rounded-3xl shadow-2xl mb-8 flex items-center justify-center">
                        <img src="/escudo.png" alt="Escudo Institucional" className="h-32 w-auto object-contain" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4 tracking-tight leading-tight text-white drop-shadow-md">
                        Sistema de Agenda<br />Auditorio Filomena
                    </h1>
                    <div className="w-16 h-1 bg-[var(--accent-color)] mb-6 rounded-full shadow-sm"></div>
                    <p className="text-lg text-gray-100 leading-relaxed font-light mt-2 max-w-md drop-shadow-sm">
                        Plataforma centralizada para la gestión eficiente de espacios y auditorios gubernamentales.
                    </p>
                </div>
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle at top right, white, transparent 60%)' }}>
                </div>
            </div>

            {/* Right: Auth Form Area */}
            <div className="w-full lg:w-[55%] flex flex-col relative bg-white shadow-[-10px_0_20px_rgba(0,0,0,0.05)] z-10">
                {/* Header specifically for mobile, hidden on desktop if desired, but good for branding */}
                <header className="lg:hidden w-full flex items-center p-6 border-b border-gray-100 bg-white">
                    <img src="/escudo.png" alt="Escudo" className="h-12 w-auto object-contain mr-4" />
                    <div>
                        <h2 className="text-sm font-bold text-[var(--primary-color)] leading-tight">Administrativa y Financiera</h2>
                        <p className="text-xs text-gray-500">Gestión de Espacios</p>
                    </div>
                </header>

                <div className="flex-1 flex items-center justify-center p-8 sm:p-12 lg:p-24 overflow-y-auto">
                    <div className="w-full max-w-md space-y-8 animate-fade-in">
                        <Outlet />
                    </div>
                </div>

                {/* Footer or lower branding could go here */}
                <div className="py-6 text-center text-sm text-gray-400">
                    &copy; {new Date().getFullYear()} Gobernación. Todos los derechos reservados.
                </div>
            </div>
        </div>
    );
}
