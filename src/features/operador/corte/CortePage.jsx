// ============================================================
// src/features/operador/corte/CortePage.jsx
// Orquestador del corte diario — compone todas las secciones
// ============================================================
import { useState } from "react";
import TablaPolizasDia from "./TablaPolizasDia";
import ResumenCobro from "./ResumenCobro";
import CorteBilletes from "./CorteBilletes";
import Comprobacion from "./Comprobacion";
import { DENOMINACIONES } from "../../../shared/constants/oficinas";
import { POLIZAS_DIA_MOCK } from "../../../shared/constants/mockData";

const OFICINA = "OFICINA CIVAC";

const HOY = new Date().toLocaleDateString("es-MX", {
  weekday: "long", day: "2-digit", month: "long", year: "numeric",
});

export default function CortePage({ usuario }) {
  const [polizas]    = useState(POLIZAS_DIA_MOCK);
  const [cerrado,    setCerrado]  = useState(false);
  const [notas,      setNotas]    = useState("");

  const [cobro, setCobro] = useState({
    efectivo: 13573.00, vales: 620.00, gastos: 0, tCredDeb: 0, fichequesTrans: 0,
  });

  const [billetes, setBilletes] = useState(
    Object.fromEntries(DENOMINACIONES.map((d) => [d, ""]))
  );

  const setCamposCobro = (k, v) => setCobro((prev) => ({ ...prev, [k]: v }));
  const setCampoBillete = (d, v) => setBilletes((prev) => ({ ...prev, [d]: v }));

  const polPendPago   = polizas.reduce((s, p) => s + (p.polPendPago ?? 0), 0);
  const subEfectivo   = cobro.efectivo - cobro.gastos;
  const totalCobro    = subEfectivo + cobro.tCredDeb + cobro.fichequesTrans;
  const totalBilletes = DENOMINACIONES.reduce((s, d) => s + (parseFloat(billetes[d]) || 0) * d, 0);

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Corte Diario</h1>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{OFICINA}</span>
            <span className="text-xs text-gray-400">{HOY}</span>
            <span className="text-xs text-gray-400">
              Generado por: <strong className="text-gray-600">{usuario?.nombre ?? "Operador"}</strong>
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
            </svg>
            Imprimir
          </button>
          <button
            onClick={() => setCerrado(true)}
            disabled={cerrado}
            className={[
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
              cerrado
                ? "bg-emerald-500 text-white cursor-default"
                : "bg-[#13193a] hover:bg-[#1e2a50] text-white shadow-sm shadow-[#13193a]/15",
            ].join(" ")}
          >
            {cerrado ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                Corte cerrado
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z"/></svg>
                Cerrar corte
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabla de pólizas del día */}
      <TablaPolizasDia polizas={polizas} />

      {/* Resumen de cobro + Corte de billetes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ResumenCobro cobro={cobro} onChange={setCamposCobro} polPendPago={polPendPago} />
        <CorteBilletes billetes={billetes} onChange={setCampoBillete} />
      </div>

      {/* Comprobación */}
      <Comprobacion totalBilletes={totalBilletes} totalCobro={totalCobro} />

      {/* Observaciones */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">
          Observaciones del corte
        </label>
        <textarea
          rows={3}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Observaciones generales del día, irregularidades, comentarios..."
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] resize-none"
        />
      </div>
    </div>
  );
}
