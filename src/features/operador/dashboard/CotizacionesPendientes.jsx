// ============================================================
// src/features/operador/dashboard/CotizacionesPendientes.jsx
// Panel lateral con cotizaciones guardadas pendientes de tramitar
// ============================================================
import { COTIZACIONES_MOCK } from "../../../shared/constants/mockData";

export default function CotizacionesPendientes({ onVerTodas, onTramitar }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-sm font-bold text-[#13193a]">Cotizaciones guardadas</h2>
          <p className="text-xs text-gray-400 mt-0.5">Pendientes de tramitar</p>
        </div>
        <button onClick={onVerTodas} className="text-xs text-blue-600 font-semibold hover:underline">
          Ver todas
        </button>
      </div>
      <div className="divide-y divide-gray-50">
        {COTIZACIONES_MOCK.map((c, i) => (
          <div key={i} className="px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-xs font-mono font-bold text-[#13193a] truncate">{c.id}</p>
              <span className="text-xs font-bold text-emerald-700 shrink-0">${c.total.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-700 font-medium truncate">{c.cliente}</p>
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[11px] text-gray-400 truncate">{c.cobertura}</p>
              <p className="text-[11px] text-gray-400 shrink-0 ml-2">{c.fecha}</p>
            </div>
            <button
              onClick={() => onTramitar(c)}
              className="mt-2.5 w-full py-1.5 rounded-lg border border-[#13193a]/20 text-[11px] font-bold text-[#13193a] hover:bg-[#13193a]/5 transition-all"
            >
              Tramitar →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
