// ============================================================
// src/features/operador/polizas/ResumenPrima.jsx
// Tarjeta de resumen de prima — cálculo automático
// ============================================================

export default function ResumenPrima({ primaNeta, derechos, descPct }) {
  const descMonto = +(primaNeta * descPct / 100).toFixed(2);
  const iva       = +((primaNeta - descMonto + derechos) * 0.16).toFixed(2);
  const total     = +(primaNeta - descMonto + derechos + iva).toFixed(2);

  if (!primaNeta) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Resumen de prima</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Prima neta",  value: `$${primaNeta.toFixed(2)}` },
          { label: "Derechos",    value: `$${derechos.toFixed(2)}`  },
          { label: "Descuentos",  value: `$${descMonto.toFixed(2)}` },
          { label: "I.V.A.",      value: `$${iva.toFixed(2)}`       },
        ].map((f) => (
          <div key={f.label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{f.label}</p>
            <p className="text-sm font-bold text-[#13193a]">{f.value}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between bg-[#13193a] rounded-xl px-5 py-3.5">
        <p className="text-white font-bold text-sm">Total a pagar</p>
        <p className="text-white font-bold text-2xl tabular-nums">${total.toFixed(2)}</p>
      </div>
    </div>
  );
}
