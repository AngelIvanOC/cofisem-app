// ============================================================
// src/features/operador/corte/TablaPolizasDia.jsx
// Hoja 1 del corte: tabla de pólizas emitidas en el día
// ============================================================
import { POLIZAS_DIA_MOCK } from "../../../shared/constants/mockData";

const COLS_DOC = ["fotos", "factura", "tCirc", "identif", "polAnt", "otro"];
const HEADERS = [
  "No.", "Aseguradora", "Póliza", "F. Emisión", "Folio", "Vendedor", "Asegurado",
  "Vale $", "Prima T. Anual", "Prima Neta Anual", "Prima T. 1er Pago", "Cobertura",
  "Placas", "USO", "Tipo", "No. Pago", "Forma Pago", "Efectivo", "Cheq/Dep", "TDC",
  "Autorización", "Pol.Pend.Pago", "Fotos", "Fact.", "T.Circ.", "Identif.", "Pol.Ant.", "Otro", "Observaciones",
];

export default function TablaPolizasDia({ polizas = POLIZAS_DIA_MOCK }) {
  const sumaPrimerPago   = polizas.reduce((s, p) => s + p.primaPrimerPago, 0);
  const sumaEfecPolizas  = polizas.reduce((s, p) => s + p.efectivo, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-[#13193a]">
        <p className="text-sm font-bold text-white">Hoja 1 — Pólizas del día</p>
        <span className="text-white/50 text-xs">{polizas.length} registros</span>
      </div>
      <div className="overflow-x-auto">
        <table className="text-xs" style={{ minWidth: "1400px", width: "100%" }}>
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {HEADERS.map((h) => (
                <th key={h} className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wide px-3 py-2.5 border-r border-gray-100 last:border-r-0 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {polizas.map((p, i) => (
              <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-3 py-2.5 font-bold text-[#13193a]">{p.no}</td>
                <td className="px-3 py-2.5 font-semibold text-gray-700">{p.aseguradora}</td>
                <td className="px-3 py-2.5 font-mono font-bold text-[#13193a]">{p.poliza}</td>
                <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{p.fechaEmision}</td>
                <td className="px-3 py-2.5 font-mono text-gray-600">{p.folio}</td>
                <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{p.vendedor}</td>
                <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{p.asegurado}</td>
                <td className="px-3 py-2.5 text-right font-semibold text-gray-700">${p.vale.toFixed(2)}</td>
                <td className="px-3 py-2.5 text-right font-semibold text-[#13193a]">${p.primaAnual.toFixed(2)}</td>
                <td className="px-3 py-2.5 text-right text-gray-700">${p.primaNeta.toFixed(2)}</td>
                <td className="px-3 py-2.5 text-right font-bold text-emerald-700">${p.primaPrimerPago.toFixed(2)}</td>
                <td className="px-3 py-2.5 text-gray-600">{p.cobertura}</td>
                <td className="px-3 py-2.5 font-mono text-gray-600">{p.placas}</td>
                <td className="px-3 py-2.5 text-gray-600">{p.uso}</td>
                <td className="px-3 py-2.5 text-gray-600">{p.tipo}</td>
                <td className="px-3 py-2.5 text-center text-gray-600">{p.no_pago}</td>
                <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{p.formaPago}</td>
                <td className="px-3 py-2.5 text-right font-bold text-emerald-700">${p.efectivo.toFixed(2)}</td>
                <td className="px-3 py-2.5 text-right text-gray-400">{p.cheque > 0 ? `$${p.cheque}` : "—"}</td>
                <td className="px-3 py-2.5 text-right text-gray-400">{p.tdc > 0 ? `$${p.tdc}` : "—"}</td>
                <td className="px-3 py-2.5 text-gray-400">{p.autorizacion || "—"}</td>
                <td className="px-3 py-2.5 text-right text-gray-400">{p.polPendPago > 0 ? `$${p.polPendPago}` : "—"}</td>
                {COLS_DOC.map((col) => (
                  <td key={col} className="px-3 py-2.5 text-center">
                    {p[col] ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-gray-300">—</span>}
                  </td>
                ))}
                <td className="px-3 py-2.5 text-gray-400 max-w-xs truncate">{p.observaciones || "—"}</td>
              </tr>
            ))}
            {/* Totales */}
            <tr className="bg-[#13193a]/5 font-bold border-t-2 border-[#13193a]/20">
              <td colSpan={7} className="px-3 py-3 text-right text-xs font-bold text-[#13193a]">TOTAL</td>
              <td className="px-3 py-3 text-right text-xs text-[#13193a]">${polizas.reduce((s, p) => s + p.vale, 0).toFixed(2)}</td>
              <td className="px-3 py-3 text-right text-xs text-[#13193a]">${polizas.reduce((s, p) => s + p.primaAnual, 0).toFixed(2)}</td>
              <td className="px-3 py-3 text-right text-xs text-[#13193a]">${polizas.reduce((s, p) => s + p.primaNeta, 0).toFixed(2)}</td>
              <td className="px-3 py-3 text-right text-xs font-bold text-emerald-700">${sumaPrimerPago.toFixed(2)}</td>
              <td colSpan={6} />
              <td className="px-3 py-3 text-right text-xs font-bold text-emerald-700">${sumaEfecPolizas.toFixed(2)}</td>
              <td colSpan={12} />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
