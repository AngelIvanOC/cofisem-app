// ============================================================
// src/pages/operador/CorteDiario.jsx
// Corte diario de la oficina — digitalización del Excel actual
// Incluye:
//   - Tabla de pólizas del día (Hoja 1)
//   - Resumen de cobro (efectivo, vales, tarjeta, etc.)
//   - Corte de billetes (conteo físico de efectivo)
//   - Comprobación y diferencia
//   - Pólizas pendientes de pago
// ============================================================
import { useState, useRef } from "react";

const OFICINA = "OFICINA CIVAC";

const POLIZAS_DIA = [
  { no: 1, aseguradora: "QUALITAS",   poliza: "3413241", fechaEmision: "13/03/2026", folio: "T0455", vendedor: "LAURA ROSHER",  asegurado: "Angel Ivan",    vale: 400,    primaAnual: 8385.69, primaNeta: 6318.92, primaPrimerPago: 2679.33, cobertura: "AMPLIA",  placas: "TRAMITE", uso: "DIDI", tipo: "COCHE", no_pago: 1, formaPago: "TRIMESTRAL", efectivo: 2679.33, cheque: 0, tdc: 0, autorizacion: "", polPendPago: 0, observaciones: "COMISION PAGADA POLIZA 960972454", fotos:"", factura:"", tCirc:"", identif:"", polAnt:"", otro:"" },
  { no: 2, aseguradora: "QUALITAS",   poliza: "3413198", fechaEmision: "14/03/2026", folio: "T0312", vendedor: "MARCO A. CRUZ",  asegurado: "María García",  vale: 0,      primaAnual: 5500.00, primaNeta: 4200.00, primaPrimerPago: 2200.00, cobertura: "BÁSICA", placas: "VRM-123", uso: "TAXI", tipo: "COCHE", no_pago: 1, formaPago: "CONTADO",    efectivo: 2200.00, cheque: 0, tdc: 0, autorizacion: "", polPendPago: 0, observaciones: "", fotos:"✓", factura:"", tCirc:"", identif:"✓", polAnt:"✓", otro:"" },
  { no: 3, aseguradora: "GNP",        poliza: "3413167", fechaEmision: "14/03/2026", folio: "T0455", vendedor: "LAURA ROSHER",  asegurado: "Roberto Díaz",  vale: 220,    primaAnual: 6200.00, primaNeta: 4900.00, primaPrimerPago: 2548.00, cobertura: "PÚB 50", placas: "CHM-456", uso: "TAXI", tipo: "COCHE", no_pago: 1, formaPago: "4 PARCIALES", efectivo: 2328.00, cheque: 0, tdc: 0, autorizacion: "", polPendPago: 0, observaciones: "", fotos:"✓", factura:"", tCirc:"✓", identif:"✓", polAnt:"", otro:"" },
];

const DENOMINACIONES = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.50];

const hoy = new Date().toLocaleDateString("es-MX", { weekday:"long", day:"2-digit", month:"long", year:"numeric" });

export default function CorteDiario({ usuario }) {
  const [polizas, setPolizas] = useState(POLIZAS_DIA);
  const [generadoPor] = useState(usuario?.nombre ?? "Marco Antonio");

  // Resumen de cobro
  const [cobro, setCobro] = useState({
    efectivo: 13573.00,
    vales:    620.00,
    gastos:   0,
    tCredDeb: 0,
    fichequesTrans: 0,
  });
  const setC = (k, v) => setCobro(c => ({ ...c, [k]: parseFloat(v) || 0 }));

  // Corte de billetes
  const [billetes, setBilletes] = useState(
    Object.fromEntries(DENOMINACIONES.map(d => [d, ""]))
  );
  const setB = (d, v) => setBilletes(b => ({ ...b, [d]: v }));

  const totalBilletes = DENOMINACIONES.reduce((s, d) => s + (parseFloat(billetes[d]) || 0) * d, 0);
  const subEfectivo   = cobro.efectivo - cobro.gastos;
  const totalCobro    = subEfectivo + cobro.tCredDeb + cobro.fichequesTrans;
  const polPendPago   = polizas.reduce((s, p) => s + (p.polPendPago ?? 0), 0);
  const diferencia    = +(totalBilletes - totalCobro).toFixed(2);

  const totalVales    = cobro.vales + 0;
  const sumaPrimerPago = polizas.reduce((s, p) => s + p.primaPrimerPago, 0);
  const sumaEfecPolizas = polizas.reduce((s, p) => s + p.efectivo, 0);

  const [cerrado, setCerrado] = useState(false);

  const inpCls = "w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] tabular-nums";

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Corte Diario</h1>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{OFICINA}</span>
            <span className="text-xs text-gray-400">{hoy}</span>
            <span className="text-xs text-gray-400">Generado por: <strong className="text-gray-600">{generadoPor}</strong></span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z"/>
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
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>Corte cerrado</>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z"/></svg>Cerrar corte</>
            )}
          </button>
        </div>
      </div>

      {/* HOJA 1: Tabla de pólizas */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-[#13193a]">
          <p className="text-sm font-bold text-white">Hoja 1 — Pólizas del día</p>
          <span className="text-white/50 text-xs">{polizas.length} registros</span>
        </div>

        <div className="overflow-x-auto">
          <table className="text-xs" style={{ minWidth: "1400px", width:"100%" }}>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["No.", "Aseguradora","Póliza","F. Emisión","Folio","Vendedor","Asegurado","Vale $","Prima T. Anual","Prima Neta Anual","Prima T. 1er Pago","Cobertura","Placas","USO","Tipo","No. Pago","Forma Pago","Efectivo","Cheq/Dep","TDC","Autorización","Pol.Pend.Pago","Fotos","Fact.","T.Circ.","Identif.","Pol.Ant.","Otro","Observaciones"].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wide px-3 py-2.5 border-r border-gray-100 last:border-r-0 whitespace-nowrap">{h}</th>
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
                  {[p.fotos, p.factura, p.tCirc, p.identif, p.polAnt, p.otro].map((v, j) => (
                    <td key={j} className="px-3 py-2.5 text-center">
                      {v ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-gray-300">—</span>}
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-gray-400 max-w-xs truncate">{p.observaciones || "—"}</td>
                </tr>
              ))}
              {/* Totales */}
              <tr className="bg-[#13193a]/5 font-bold border-t-2 border-[#13193a]/20">
                <td colSpan={7} className="px-3 py-3 text-right text-xs font-bold text-[#13193a]">TOTAL</td>
                <td className="px-3 py-3 text-right text-xs text-[#13193a]">${polizas.reduce((s,p)=>s+p.vale,0).toFixed(2)}</td>
                <td className="px-3 py-3 text-right text-xs text-[#13193a]">${polizas.reduce((s,p)=>s+p.primaAnual,0).toFixed(2)}</td>
                <td className="px-3 py-3 text-right text-xs text-[#13193a]">${polizas.reduce((s,p)=>s+p.primaNeta,0).toFixed(2)}</td>
                <td className="px-3 py-3 text-right text-xs font-bold text-emerald-700">${sumaPrimerPago.toFixed(2)}</td>
                <td colSpan={6}/>
                <td className="px-3 py-3 text-right text-xs font-bold text-emerald-700">${sumaEfecPolizas.toFixed(2)}</td>
                <td colSpan={12}/>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* HOJA 2: Resumen + Corte de billetes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Resumen de cobro */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-[#13193a] px-5 py-3.5">
            <p className="text-sm font-bold text-white">Resumen de cobro</p>
          </div>
          <div className="p-5 space-y-3">
            {[
              { k: "efectivo",       label: "Efectivo"           },
              { k: "vales",          label: "Vales"              },
              { k: "gastos",         label: "Gastos"             },
              { k: "tCredDeb",       label: "T. Crédito / Débito" },
              { k: "fichequesTrans", label: "Fichas Cheques/Trans" },
            ].map(f => (
              <div key={f.k} className="flex items-center gap-3">
                <label className="text-xs font-bold text-gray-500 w-40 shrink-0">{f.label}</label>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number" min="0" step="0.01"
                    value={cobro[f.k] || ""}
                    onChange={e => setC(f.k, e.target.value)}
                    className={inpCls + " pl-7"}
                  />
                </div>
              </div>
            ))}

            <div className="border-t border-gray-100 pt-3 space-y-2">
              {[
                { label: "Subtotal efectivo",  value: subEfectivo,   bold: false },
                { label: "Total",              value: totalCobro,    bold: true  },
                { label: "Pólizas pend. pago", value: polPendPago,   bold: false, warn: true },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between">
                  <p className={`text-xs ${r.warn ? "text-amber-600" : "text-gray-600"} ${r.bold ? "font-bold" : "font-medium"}`}>{r.label}</p>
                  <p className={`text-sm tabular-nums ${r.warn ? "text-amber-700" : r.bold ? "font-bold text-[#13193a]" : "text-gray-700"}`}>
                    ${r.value.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Corte de billetes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-[#13193a] px-5 py-3.5">
            <p className="text-sm font-bold text-white">Corte de efectivo</p>
            <p className="text-white/50 text-xs mt-0.5">Ingresa la cantidad de cada denominación</p>
          </div>
          <div className="p-5">
            <div className="space-y-2 mb-4">
              {DENOMINACIONES.map(d => {
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
                      onChange={e => setB(d, e.target.value)}
                      className={inpCls + " text-center"}
                    />
                    <p className="text-xs font-bold text-[#13193a] text-right tabular-nums">
                      {subtot > 0 ? `$${subtot.toFixed(2)}` : "—"}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Comprobación */}
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between">
                <p className="text-xs font-semibold text-gray-500">Total billetes</p>
                <p className="text-sm font-bold text-[#13193a] tabular-nums">${totalBilletes.toFixed(2)}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-xs font-semibold text-gray-500">Total cobrado</p>
                <p className="text-sm font-bold text-[#13193a] tabular-nums">${totalCobro.toFixed(2)}</p>
              </div>
              <div className={`flex justify-between items-center p-3 rounded-xl border-2 ${
                diferencia === 0 ? "bg-emerald-50 border-emerald-200" :
                diferencia > 0  ? "bg-blue-50 border-blue-200" :
                                   "bg-red-50 border-red-200"
              }`}>
                <p className="text-xs font-bold">
                  {diferencia === 0 ? "✓ Sin diferencia" : diferencia > 0 ? "Sobrante" : "Faltante"}
                </p>
                <p className={`text-lg font-bold tabular-nums ${
                  diferencia === 0 ? "text-emerald-700" : diferencia > 0 ? "text-blue-700" : "text-red-700"
                }`}>
                  {diferencia >= 0 ? "+" : ""}${diferencia.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notas del corte */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Observaciones del corte</label>
        <textarea
          rows={3}
          placeholder="Observaciones generales del día, irregularidades, comentarios..."
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] resize-none"
        />
      </div>

    </div>
  );
}