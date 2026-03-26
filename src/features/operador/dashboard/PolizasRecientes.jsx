// ============================================================
// src/features/operador/dashboard/PolizasRecientes.jsx
// Tabla compacta de las últimas pólizas emitidas hoy
// ============================================================

const ULTIMAS_POLIZAS = [
  { poliza: "3413241", asegurado: "Angel Ivan Ortega",   cobertura: "AMPLIA",            prima: "$2,679", vendedor: "Laura Rosher",  forma: "Trimestral",  hora: "09:15" },
  { poliza: "3413198", asegurado: "María García López",  cobertura: "TAXI BÁSICA 2500",  prima: "$1,820", vendedor: "Marco A. Cruz", forma: "Contado",     hora: "10:42" },
  { poliza: "3413167", asegurado: "Roberto Díaz Ramos",  cobertura: "SERV. PÚB. GAMAN",  prima: "$2,200", vendedor: "Laura Rosher",  forma: "4 Parciales", hora: "11:30" },
  { poliza: "3413144", asegurado: "Sofía Torres Ruiz",   cobertura: "TAXI BÁSICA 2500",  prima: "$1,820", vendedor: "Carlos Soto",   forma: "Contado",     hora: "13:05" },
];

export default function PolizasRecientes({ onVerTodas }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-sm font-bold text-[#13193a]">Pólizas emitidas hoy</h2>
          <p className="text-xs text-gray-400 mt-0.5">{ULTIMAS_POLIZAS.length} trámites realizados</p>
        </div>
        <button onClick={onVerTodas} className="text-xs text-blue-600 font-semibold hover:underline">
          Ver todas
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              {["Hora", "Póliza", "Asegurado", "Cobertura", "Forma pago", "Prima"].map((h) => (
                <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {ULTIMAS_POLIZAS.map((p, i) => (
              <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-4 py-3 text-xs text-gray-400 font-medium">{p.hora}</td>
                <td className="px-4 py-3 font-mono text-xs font-bold text-[#13193a]">{p.poliza}</td>
                <td className="px-4 py-3 text-xs text-gray-700 font-medium">{p.asegurado}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{p.cobertura}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{p.forma}</td>
                <td className="px-4 py-3 text-xs font-bold text-emerald-700">{p.prima}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
