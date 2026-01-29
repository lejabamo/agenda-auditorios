export default function LoginPage() {
    return (
        <>
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-[var(--primary-color)]">Bienvenido</h2>
                <p className="text-[var(--text-secondary)] mt-2">Ingrese sus credenciales para continuar</p>
            </div>

            <form className="space-y-6">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[var(--primary-color)]">
                        Correo Electrónico
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)]"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-[var(--primary-color)]">
                        Contraseña
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)]"
                    />
                </div>

                <div>
                    <button
                        type="button"
                        onClick={() => window.location.href = '/admin/dashboard'}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--primary-color)] hover:bg-[var(--primary-light)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-color)]"
                    >
                        Iniciar Sesión
                    </button>
                    <p className="text-xs text-center text-gray-400 mt-4">
                        (Demo: Simula login redirigiendo al dashboard)
                    </p>
                </div>
            </form>
        </>
    );
}
