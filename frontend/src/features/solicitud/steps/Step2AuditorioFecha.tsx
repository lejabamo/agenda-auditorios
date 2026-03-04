// import { useEffect } from 'react';
import type { Auditorio } from '@/types/models/auditorio';

export type Jornada = 'MAÑANA' | 'TARDE' | 'TODO_EL_DIA';

interface Step2Props {
    data: {
        auditorio: Auditorio | null;
        fecha: string;
        jornada: Jornada | '';
    };
    onDataChange: (data: Partial<{
        auditorio: Auditorio | null;
        fecha: string;
        jornada: Jornada | '';
    }>) => void;
}

// Step 2 is now purely Read-Only Confirmation of the Hold
// It receives data already validated by the Calendar -> Wizard flow
export function Step2AuditorioFecha({ data }: Step2Props) {
    if (!data.fecha || !data.jornada) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white border border-red-100 rounded-lg text-center">
                <div className="text-red-500 mb-2">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Sin bloque seleccionado</h3>
                <p className="text-gray-500 mb-4">Debe iniciar el proceso desde el calendario.</p>
                <a href="/" className="px-4 py-2 bg-[var(--primary-color)] text-white rounded hover:opacity-90 transition-opacity no-underline">
                    Ir al Calendario
                </a>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 relative overflow-hidden">

                <h3 className="text-lg font-bold text-blue-900 mb-6 flex items-center gap-2 relative z-10">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    </span>
                    Reserva Confirmada
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    <div>
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-1">Espacio</span>
                        <div className="text-xl font-bold text-gray-900">{data.auditorio?.nombre || 'Auditorio Filomena'}</div>
                        <div className="text-sm text-gray-500 mt-1">{data.auditorio?.ubicacion || 'Sede Central'}</div>
                    </div>

                    <div>
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-1">Bloque de Tiempo</span>
                        <div className="text-xl font-bold text-gray-900 capitalize">
                            {data.fecha}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 uppercase">
                                {data.jornada === 'MAÑANA' ? 'Mañana (8am - 12pm)' :
                                    data.jornada === 'TARDE' ? 'Tarde (2pm - 6pm)' : 'Día Completo'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center">
                <p className="text-sm text-gray-500">
                    Este espacio ha sido reservado temporalmente para su solicitud.
                    <br />
                    Si desea cambiar la fecha, por favor <a href="/" className="text-red-500 hover:underline font-medium">cancele y seleccione otro bloque</a>.
                </p>
            </div>
        </div>
    );
}
