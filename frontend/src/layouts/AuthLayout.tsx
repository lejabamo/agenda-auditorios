import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
    return (
        <div className="min-h-screen flex bg-[var(--background-color)]">
            {/* Left: Brand/Image Area */}
            <div className="hidden lg:flex lg:w-1/2 bg-[var(--primary-color)] items-center justify-center p-12 text-white relative overflow-hidden">
                <div className="relative z-10 max-w-lg">
                    <h1 className="text-4xl font-bold mb-6 text-white">Sistema de Agenda Institucional</h1>
                    <p className="text-xl opacity-90 leading-relaxed">
                        Plataforma centralizada para la gestión eficiente de espacios y auditorios gubernamentales.
                    </p>
                </div>
                {/* Abstract shape decoration could go here */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent" />
            </div>

            {/* Right: Auth Form Area */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24">
                <div className="w-full max-w-md space-y-8">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
