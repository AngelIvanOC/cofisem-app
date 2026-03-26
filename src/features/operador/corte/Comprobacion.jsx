// ============================================================
// src/features/operador/corte/Comprobacion.jsx
// Comprobación: diferencia entre total billetes y total cobrado
// ============================================================

export default function Comprobacion({ totalBilletes, totalCobro }) {
  const diferencia = +(totalBilletes - totalCobro).toFixed(2);

  return (
    <div className={[
      "flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
      diferencia === 0
        ? "bg-emerald-50 border-emerald-200"
        : diferencia > 0
        ? "bg-blue-50 border-blue-200"
        : "bg-red-50 border-red-200",
    ].join(" ")}>
      <div>
        <p className={`text-xs font-bold ${
          diferencia === 0 ? "text-emerald-700" : diferencia > 0 ? "text-blue-700" : "text-red-700"
        }`}>
          {diferencia === 0
            ? "✓ Sin diferencia — cuadre perfecto"
            : diferencia > 0
            ? "Sobrante de efectivo"
            : "Faltante de efectivo"}
        </p>
        <div className="flex gap-6 mt-1.5 text-[11px] text-gray-500">
          <span>Total billetes: <strong className="text-gray-700">${totalBilletes.toFixed(2)}</strong></span>
          <span>Total cobrado: <strong className="text-gray-700">${totalCobro.toFixed(2)}</strong></span>
        </div>
      </div>
      <p className={`text-2xl font-bold tabular-nums ${
        diferencia === 0 ? "text-emerald-700" : diferencia > 0 ? "text-blue-700" : "text-red-700"
      }`}>
        {diferencia >= 0 ? "+" : ""}${diferencia.toFixed(2)}
      </p>
    </div>
  );
}
