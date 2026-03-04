import { ApiError } from './eventoService';

const API_URL = 'http://localhost:5000/api';

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
