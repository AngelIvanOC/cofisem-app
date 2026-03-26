// ============================================================
// src/features/operador/polizas/TablaCoberturas.jsx
// Tabla de coberturas del plan seleccionado — aparece al cotizar
// ============================================================

export default function TablaCoberturas({ coberturaData, nombreCobertura }) {
  if (!coberturaData) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-[#13193a] px-5 py-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">{nombreCobertura}</h3>
          <p className="text-white/40 text-xs mt-0.5">Uso: {coberturaData.uso}</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              {["Descripción", "Monto Asegurado", "% Ded.", "Prima Neta"].map((h) => (
                <th
                  key={h}
                  className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {coberturaData.coberturas.map((c, i) => (
              <tr key={i} className="hover:bg-gray-50/60">
                <td className="px-4 py-2.5 text-gray-700 font-medium">{c.desc}</td>
                <td className="px-4 py-2.5 text-right text-gray-600 font-semibold">{c.monto}</td>
                <td className="px-4 py-2.5 text-right text-gray-400">{c.ded}</td>
                <td className="px-4 py-2.5 text-right font-bold text-[#13193a]">${c.prima.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
