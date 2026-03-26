// ============================================================
// src/features/operador/corte/CorteBilletes.jsx
// Conteo físico de efectivo por denominación
// ============================================================
import { DENOMINACIONES } from "../../../shared/constants/oficinas";

export default function CorteBilletes({ billetes, onChange }) {
  const totalBilletes = DENOMINACIONES.reduce(
    (s, d) => s + (parseFloat(billetes[d]) || 0) * d,
    0
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-[#13193a] px-5 py-3.5">
        <p className="text-sm font-bold text-white">Corte de efectivo</p>
        <p className="text-white/50 text-xs mt-0.5">Ingresa la cantidad de cada denominación</p>
      </div>
      <div className="p-5">
        <div className="space-y-2 mb-4">
          {DENOMINACIONES.map((d) => {
            const cant   = parseFloat(billetes[d]) || 0;
            const subtot = cant * d;
            return (
              <div key={d} className="grid grid-cols-3 gap-2 items-center">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 border border-gray-200">
                    ${d < 1 ? d.toFixed(2) : d}
                  </div>
                  <span className="text-xs text-gray-400">×</span>
                </div>
                <input
                  type="number" min="0" step="1" placeholder="0"
                  value={billetes[d]}
                  onChange={(e) => onChange(d, e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 text-center focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] tabular-nums"
                />
                <p className="text-xs font-bold text-[#13193a] text-right tabular-nums">
                  {subtot > 0 ? `$${subtot.toFixed(2)}` : "—"}
                </p>
              </div>
            );
          })}
        </div>
        {/* Total de billetes */}
        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between">
            <p className="text-xs font-semibold text-gray-500">Total billetes</p>
            <p className="text-sm font-bold text-[#13193a] tabular-nums">${totalBilletes.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
