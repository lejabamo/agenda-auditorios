import React, { useState, useEffect, useRef } from 'react';
import './InstitutionalDisclaimerModal.css';

interface InstitutionalDisclaimerModalProps {
    onAccept?: () => void;
}

const STORAGE_KEY = 'auditorio_disclaimer_accepted';

// Icons for each section
const Icons = {
    Capacity: () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="idm-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
    ),
    Rules: () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="idm-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
    ),
    Process: () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="idm-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
    ),
    Time: () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="idm-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    Priority: () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="idm-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
    ),
    Contact: () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="idm-contact-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
    ),
    Institution: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-[var(--primary-color)]">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
        </svg>
    )
};

const InstitutionalDisclaimerModal: React.FC<InstitutionalDisclaimerModalProps> = ({ onAccept }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const acceptButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        // Check if user already accepted the disclaimer in the current session
        const hasAccepted = sessionStorage.getItem(STORAGE_KEY) === 'true';
        if (!hasAccepted) {
            setIsOpen(true);
            document.body.style.overflow = 'hidden';
        }
    }, []);

    // Focus trap implementation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Tab' && modalRef.current) {
                const focusableElements = modalRef.current.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );

                if (focusableElements.length === 0) return;

                const firstElement = focusableElements[0] as HTMLElement;
                const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        // Initial focus
        if (modalRef.current) {
            const checkbox = modalRef.current.querySelector('input[type="checkbox"]') as HTMLElement;
            if (checkbox) checkbox.focus();
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const handleAccept = () => {
        if (!accepted) return;

        sessionStorage.setItem(STORAGE_KEY, 'true');
        setIsOpen(false);
        document.body.style.overflow = 'unset';

        if (onAccept) {
            onAccept();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="idm-backdrop" role="dialog" aria-modal="true" aria-labelledby="idm-title">
            <div className="idm-modal" ref={modalRef} tabIndex={-1}>

                {/* Header Institucional - Moderno y Limpio */}
                <div className="idm-header">
                    <div className="idm-header-logos">
                        <img src="/escudo.png" alt="Escudo Gobernación del Cauca" className="idm-logo-escudo" />
                        <img src="/Logo-WEB-SECRETARI.jpg" alt="Secretaría de Educación y Cultura" className="idm-logo-secretaria" />
                    </div>
                    <div className="idm-header-text">
                        <p className="idm-subtitle">Secretaría de Educación y Cultura del Cauca</p>
                        <h2 id="idm-title" className="idm-title">Condiciones de Uso – Auditorio Filomena Segura</h2>
                    </div>
                </div>

                {/* Contenido */}
                <div className="idm-content-scroll">
                    <div className="idm-content">
                        <p className="idm-intro">
                            Antes de realizar una solicitud para el uso del auditorio, por favor revise y acepte las siguientes condiciones institucionales:
                        </p>

                        <div className="idm-grid">
                            {/* Card: Capacidad */}
                            <div className="idm-card">
                                <div className="idm-card-header">
                                    <Icons.Capacity />
                                    <h3>Capacidad del Auditorio</h3>
                                </div>
                                <p>Capacidad máxima permitida de <strong>50 a 60 personas</strong>.</p>
                            </div>

                            {/* Card: Normas */}
                            <div className="idm-card">
                                <div className="idm-card-header">
                                    <Icons.Rules />
                                    <h3>Normas del Espacio</h3>
                                </div>
                                <p><strong>No se permite</strong> el consumo de alimentos, bebidas, licores, cigarrillos u otras sustancias. Es un espacio cerrado.</p>
                            </div>

                            {/* Card: Proceso */}
                            <div className="idm-card">
                                <div className="idm-card-header">
                                    <Icons.Process />
                                    <h3>Proceso de Solicitud</h3>
                                </div>
                                <p>Debe diligenciar el formulario en línea del sistema únicamente después de aceptar estas condiciones.</p>
                            </div>

                            {/* Card: Tiempo */}
                            <div className="idm-card">
                                <div className="idm-card-header">
                                    <Icons.Time />
                                    <h3>Tiempo de Solicitud</h3>
                                </div>
                                <p>Realizar la solicitud con anticipación, como mínimo hasta el <strong>viernes anterior a la actividad (12:30 PM)</strong>.</p>
                            </div>

                            {/* Card: Prioridad */}
                            <div className="idm-card idm-card-full">
                                <div className="idm-card-header">
                                    <Icons.Priority />
                                    <h3>Criterios de Asignación y Prioridad</h3>
                                </div>
                                <div className="idm-card-body-row">
                                    <p className="idm-priority-text">La autorización puede modificarse si se requiere para atender situaciones urgentes. Se priorizan:</p>
                                    <ul className="idm-bullet-list">
                                        <li>Agendas institucionales Gobernación del Cauca</li>
                                        <li>Actividades de la Secretaría de Educación</li>
                                        <li>Situaciones de alta urgencia</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <hr className="idm-divider" />

                        {/* Contact Section - Clean Institutional Box */}
                        <div className="idm-contact-box">
                            <div className="idm-contact-icon-wrapper">
                                <Icons.Contact />
                            </div>
                            <div className="idm-contact-details">
                                <h4>Contacto para novedades</h4>
                                <a href="mailto:gestionadministrativa.educacion@cauca.gov.co" className="idm-email">
                                    gestionadministrativa.educacion@cauca.gov.co
                                </a>
                                <p className="idm-contact-person">
                                    <strong>Dayra Milena Achicanoy Achicanoy</strong><br />
                                    <span>Profesional Universitario - Administrativa y Financiera</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Acciones */}
                <div className="idm-actions">
                    <label className="idm-checkbox-label">
                        <div className="idm-checkbox-wrapper">
                            <input
                                type="checkbox"
                                className="idm-checkbox"
                                checked={accepted}
                                onChange={(e) => setAccepted(e.target.checked)}
                                aria-label="Aceptar condiciones de uso"
                            />
                        </div>
                        <span className="idm-checkbox-text">He leído y acepto las condiciones de uso del Auditorio Filomena Segura para continuar.</span>
                    </label>
                    <button
                        ref={acceptButtonRef}
                        className={`idm-button ${accepted ? 'active' : 'disabled'}`}
                        disabled={!accepted}
                        onClick={handleAccept}
                    >
                        Aceptar y continuar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstitutionalDisclaimerModal;
