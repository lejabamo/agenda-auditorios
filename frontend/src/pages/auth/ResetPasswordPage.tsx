import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '@/services/authService';

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    if (!token) {
        return (
            <div className="w-full text-center">
                <div className="bg-red-50 text-red-800 p-4 rounded-xl shadow-sm border border-red-200 mb-6">
                    Enlace de recuperación inválido o inexistente.
                </div>
                <button
                    onClick={() => navigate('/auth/login')}
                    className="flex justify-center py-2 px-4 mx-auto border border-transparent rounded-md text-[var(--primary-color)] hover:underline"
                >
                    Volver al inicio de sesión
                </button>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setStatus('error');
            setMessage('Las contraseñas no coinciden.');
            return;
        }

        if (password.length < 6) {
            setStatus('error');
            setMessage('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            await authService.resetPassword(token, password);
            setStatus('success');
            setMessage('Tu contraseña ha sido actualizada exitosamente.');
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message || 'El enlace puede haber expirado o es inválido.');
        }
    };

    return (
        <div className="w-full">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-[#1A202C] tracking-tight">Nueva Contraseña</h2>
                <p className="text-gray-500 mt-2 text-sm">Ingresa tu nueva contraseña para acceder al sistema</p>
            </div>

            {status === 'success' ? (
                <div className="text-center">
                    <div className="bg-green-50 text-green-800 p-4 rounded-xl mb-6 shadow-sm border border-green-200">
                        {message}
                    </div>
                    <button
                        onClick={() => navigate('/auth/login')}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[var(--primary-color)] hover:bg-[#15284B] transition-all"
                    >
                        Iniciar Sesión
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
                        <label className="block text-sm font-semibold text-gray-700">Nueva Contraseña</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-semibold text-gray-700">Confirmar Contraseña</label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[var(--primary-color)] hover:bg-[#15284B] disabled:opacity-70 transition-all"
                    >
                        {status === 'loading' ? 'Guardando...' : 'Guardar Nueva Contraseña'}
                    </button>
                </form>
            )}
        </div>
    );
}
