export const ListResponse = ({ data, title }: { data: any[], title: string }) => {
    return (
        <div className="mt-2 space-y-2">
            <p className="font-bold text-gray-700 text-sm">{title}</p>
            <ul className="space-y-1">
                {data.map((item, idx) => (
                    <li key={idx} className="bg-gray-50 border border-gray-200 p-2 rounded text-sm flex justify-between items-center group">
                        <span>
                            <span className="font-bold">{item.fecha_inicio.split('T')[0]}</span>: {item.titulo}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            {item.jornada}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export const AvailabilityList = ({ data, title }: { data: string[], title: string }) => {
    return (
        <div className="mt-2 space-y-2">
            <p className="font-bold text-gray-700 text-sm">{title}</p>
            <ul className="space-y-1">
                {data.map((text, idx) => (
                    <li key={idx} className="bg-blue-50 border border-blue-100 p-2 rounded text-sm text-blue-900 list-disc list-inside">
                        {text}
                    </li>
                ))}
            </ul>
        </div>
    );
};
