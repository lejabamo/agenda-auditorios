import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '@/services/authService';

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            await authService.forgotPassword(email);
            setStatus('success');
            setMessage('Si el correo existe en nuestro sistema, te hemos enviado un enlace para restablecer tu contraseña.');
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message || 'Ocurrió un error al procesar tu solicitud.');
        }
    };

    return (
        <div className="w-full">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-[#1A202C] tracking-tight">Recuperar Contraseña</h2>
                <p className="text-gray-500 mt-2 text-sm">Ingresa tu correo para recibir las instrucciones</p>
            </div>

            {status === 'success' ? (
                <div className="text-center">
                    <div className="bg-green-50 text-green-800 p-4 rounded-xl mb-6 shadow-sm border border-green-200">
                        {message}
                    </div>
                    <button
                        onClick={() => navigate('/auth/login')}
                        className="w-full flex justify-center py-3 px-4 border border-[var(--primary-color)] rounded-xl shadow-sm text-sm font-semibold text-[var(--primary-color)] bg-transparent hover:bg-gray-50 transition-all"
                    >
                        Volver al inicio de sesión
                    </button>
                </div>
            ) : (
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {status === 'error' && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 shadow-sm text-sm" role="alert">
                            {message}
                        </div>
                    )}
                    
                    <div className="space-y-1">
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                            Correo Institucional
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all"
                            placeholder="ejemplo@cauca.gov.co"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[var(--primary-color)] hover:bg-[#15284B] disabled:opacity-70 transition-all"
                    >
                        {status === 'loading' ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
                    </button>

                    <div className="text-center mt-4">
                        <Link to="/auth/login" className="text-sm font-medium text-[var(--primary-color)] hover:underline">
                            Volver al inicio de sesión
                        </Link>
                    </div>
                </form>
            )}
        </div>
    );
}
