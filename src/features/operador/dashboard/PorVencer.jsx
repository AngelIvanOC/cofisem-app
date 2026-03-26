// ============================================================
// src/features/operador/dashboard/PorVencer.jsx
// Tabla de pólizas próximas a vencer (alerta visual)
// ============================================================

const POR_VENCER = [
  { poliza: "3411002", asegurado: "Carmen López",  vehiculo: "Nissan Tsuru",  vence: "20/03/2026", dias: 3 },
  { poliza: "3410888", asegurado: "José Martínez", vehiculo: "VW Jetta",      vence: "22/03/2026", dias: 5 },
  { poliza: "3410755", asegurado: "Ana Gutiérrez", vehiculo: "Aveo",          vence: "24/03/2026", dias: 7 },
];

export default function PorVencer({ onRenovar }) {
  return (
    <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-amber-100 bg-amber-50/50">
        <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <div>
          <h2 className="text-sm font-bold text-amber-800">Pólizas próximas a vencer</h2>
          <p className="text-xs text-amber-600 mt-0.5">Requieren renovación en los próximos 7 días</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              {["Póliza", "Asegurado", "Vehículo", "Vence", "Días restantes", ""].map((h) => (
                <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-2.5 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {POR_VENCER.map((p, i) => (
              <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-5 py-3 font-mono text-xs font-bold text-[#13193a]">{p.poliza}</td>
                <td className="px-5 py-3 text-xs text-gray-700 font-medium">{p.asegurado}</td>
                <td className="px-5 py-3 text-xs text-gray-500">{p.vehiculo}</td>
                <td className="px-5 py-3 text-xs text-gray-500">{p.vence}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                    p.dias <= 3 ? "bg-red-50 text-red-600 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {p.dias} días
                  </span>
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => onRenovar?.(p)}
                    className="text-xs text-blue-600 font-semibold hover:underline whitespace-nowrap"
                  >
                    Renovar →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
