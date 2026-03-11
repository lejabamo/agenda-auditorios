import { ApiError } from './eventoService';

const API_URL = import.meta.env.VITE_API_URL;


export interface User {
    id: number;
    email: string;
    is_active: boolean;
    created_at?: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
    user: User;
}

export const authService = {
    login: async (email: string, password: string): Promise<LoginResponse> => {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new ApiError(error.error || 'Error de autenticación', response.status);
            }

            const data = await response.json();
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data;

        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    forgotPassword: async (email: string, frontendUrl: string = window.location.origin) => {
        try {
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, frontend_url: frontendUrl }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new ApiError(error.error || 'Error al solicitar recuperación', response.status);
            }
            return await response.json();
        } catch (error) {
            console.error('Forgot password error:', error);
            throw error;
        }
    },

    resetPassword: async (token: string, password: string) => {
        try {
            const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new ApiError(error.error || 'Error al restablecer contraseña', response.status);
            }
            return await response.json();
        } catch (error) {
            console.error('Reset password error:', error);
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Optional: Call API logout if strictly required, but backend is stateless
    },

    getToken: () => localStorage.getItem('token'),

    getUser: (): User | null => {
        const u = localStorage.getItem('user');
        return u ? JSON.parse(u) : null;
    },

    isAuthenticated: () => !!localStorage.getItem('token')
};
