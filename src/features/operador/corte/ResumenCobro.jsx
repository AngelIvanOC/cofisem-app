// ============================================================
// src/features/operador/corte/ResumenCobro.jsx
// Panel de resumen de cobro del día (efectivo, vales, tarjeta, etc.)
// ============================================================

const CAMPOS_COBRO = [
  { key: "efectivo", label: "Efectivo" },
  { key: "vales", label: "Vales" },
  { key: "gastos", label: "Gastos" },
  { key: "tCredDeb", label: "T. Crédito / Débito" },
  { key: "fichequesTrans", label: "Fichas Cheques/Trans" },
];

export default function ResumenCobro({ cobro, onChange, polPendPago }) {
  const subEfectivo = cobro.efectivo - cobro.gastos;
  const totalCobro = subEfectivo + cobro.tCredDeb + cobro.fichequesTrans;

  const inpCls = "flex-1 relative";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-[#13193a] px-5 py-3.5">
        <p className="text-sm font-bold text-white">Resumen de cobro</p>
      </div>
      <div className="p-5 space-y-3">
        {CAMPOS_COBRO.map((f) => (
          <div key={f.key} className="flex items-center gap-3">
            <label className="text-xs font-bold text-gray-500 w-40 shrink-0">
              {f.label}
            </label>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                $
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cobro[f.key] || ""}
                onChange={(e) =>
                  onChange(f.key, parseFloat(e.target.value) || 0)
                }
                className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] tabular-nums"
              />
            </div>
          </div>
        ))}

        <div className="border-t border-gray-100 pt-3 space-y-2">
          {[
            { label: "Subtotal efectivo", value: subEfectivo, bold: false },
            { label: "Total", value: totalCobro, bold: true },
            {
              label: "Pólizas pend. pago",
              value: polPendPago,
              bold: false,
              warn: true,
            },
          ].map((r) => (
            <div key={r.label} className="flex items-center justify-between">
              <p
                className={`text-xs ${r.warn ? "text-amber-600" : "text-gray-600"} ${r.bold ? "font-bold" : "font-medium"}`}
              >
                {r.label}
              </p>
              <p
                className={`text-sm tabular-nums ${r.warn ? "text-amber-700" : r.bold ? "font-bold text-[#13193a]" : "text-gray-700"}`}
              >
                ${r.value.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
