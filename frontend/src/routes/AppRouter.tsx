import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from '@/layouts/PublicLayout';
import AdminLayout from '@/layouts/AdminLayout';
import AuthLayout from '@/layouts/AuthLayout';

// Public Pages
import LandingPage from '@/pages/public/LandingPage';
import SolicitudWizardPage from '@/pages/public/SolicitudWizardPage';
import SeguimientoPage from '@/pages/public/SeguimientoPage';

// Admin Pages
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminCalendarioPage from '@/pages/admin/AdminCalendarioPage';
import AdminSolicitudesPage from '@/pages/admin/AdminSolicitudesPage';
import AdminEntidadesPage from '@/pages/admin/AdminEntidadesPage';
import LoginPage from '@/pages/auth/LoginPage';

export const router = createBrowserRouter([
    // Public Routes
    {
        path: '/',
        element: <PublicLayout />,
        children: [
            {
                index: true,
                element: <LandingPage />,
            },
            {
                path: 'solicitar',
                element: <SolicitudWizardPage />,
            },
            {
                path: 'seguimiento/:id',
                element: <SeguimientoPage />,
            },
        ],
    },

    // Auth Routes
    {
        path: '/auth',
        element: <AuthLayout />,
        children: [
            {
                path: 'login',
                element: <LoginPage />,
            },
        ],
    },

    // Admin Routes (Protected)
    {
        path: '/admin',
        element: <AdminLayout />,
        children: [
            {
                index: true,
                element: <Navigate to="/admin/dashboard" replace />,
            },
            {
                path: 'dashboard',
                element: <AdminDashboardPage />,
            },
            {
                path: 'calendario',
                element: <AdminCalendarioPage />,
            },
            {
                path: 'solicitudes',
                element: <AdminSolicitudesPage />,
            },
            {
                path: 'entidades',
                element: <AdminEntidadesPage />,
            },
            {
                path: 'auditorios',
                element: <div className="p-8">Configuración de Auditorios (Próximamente)</div>,
            },
        ],
    },

    // Catch all
    {
        path: '*',
        element: <Navigate to="/" replace />,
    },
]);
