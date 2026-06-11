import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

const DENOMINACIONES = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.5];
const HOY_LABEL = new Date().toLocaleDateString("es-MX", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});
const HOY_ISO = new Date().toISOString().split("T")[0];

const n = (v) => parseFloat(v) || 0;
const $ = (v) => `$${n(v).toFixed(2)}`;
const fmt = (d) =>
  d
    ? new Date(d + "T00:00:00").toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

export default function CorteOperador({ usuario }) {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [errorMsg, setErrorMsg]   = useState(null);
  const [gastos, setGastos]       = useState(0);
  const [billetes, setBilletes]   = useState(
    Object.fromEntries(DENOMINACIONES.map((d) => [d, ""])),
  );

  const oficina = usuario?.oficinas?.nombre ?? "OFICINA";

  const totalEfectivo   = registros.reduce((s, r) => s + n(r.efectivo), 0);
  const totalVales      = registros.reduce((s, r) => s + n(r.vale), 0);
  const totalTDC        = registros.reduce((s, r) => s + n(r.tdc), 0);
  const totalCheque     = registros.reduce((s, r) => s + n(r.cheque), 0);
  const polPendPago     = registros.reduce((s, r) => s + n(r.pol_pend_pago), 0);
  const sumaPrimerPago  = registros.reduce((s, r) => s + n(r.prima_primer_pago), 0);
  const sumaPrimaAnual  = registros.reduce((s, r) => s + n(r.prima_anual), 0);
  const sumaPrimaNeta   = registros.reduce((s, r) => s + n(r.prima_neta), 0);

  const subEfectivo   = totalEfectivo - n(gastos);
  const totalCobro    = subEfectivo + totalTDC + totalCheque;
  const totalBilletes = DENOMINACIONES.reduce((s, d) => s + n(billetes[d]) * d, 0);
  const diferencia    = +(totalBilletes - totalCobro).toFixed(2);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    try {
      let query = supabase
        .from("polizas_cofisem")
        .select("*")
        .eq("fecha_corte", HOY_ISO)
        .order("created_at", { ascending: true });
      if (usuario?.oficina_id) query = query.eq("oficina_id", usuario.oficina_id);
      const { data, error } = await query;
      if (error) throw error;
      setRegistros(data ?? []);
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  const iResumen =
    "w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] tabular-nums";

  const TH = ({ children, rowSpan, colSpan, blue }) => (
    <th
      rowSpan={rowSpan}
      colSpan={colSpan}
      className={[
        "text-center text-[10px] font-bold uppercase tracking-wide px-3 border-r border-gray-100 last:border-r-0 whitespace-nowrap",
        blue
          ? "text-blue-500 bg-blue-50/40 py-1.5"
          : "text-gray-500 py-2 align-middle",
        colSpan ? "text-center border-b border-gray-200" : "",
      ].join(" ")}
    >
      {children}
    </th>
  );

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm gap-2">
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Cargando corte del día…
      </div>
    );

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-3">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Corte Diario</h1>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {oficina}
            </span>
            <span className="text-xs text-gray-400">{HOY_LABEL}</span>
            <span className="text-xs text-gray-400">
              Generado por:{" "}
              <strong className="text-gray-600">{usuario?.nombre ?? "—"}</strong>
            </span>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
          </svg>
          Imprimir
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          {errorMsg}
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600 ml-3">✕</button>
        </div>
      )}

      {/* ── Tabla (solo lectura) ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-[#13193a]">
          <p className="text-sm font-bold text-white">Pólizas del día</p>
          <span className="text-white/50 text-xs">{registros.length} registros</span>
        </div>

        <div className="overflow-x-auto">
          <table className="text-xs" style={{ minWidth: "1700px", width: "100%" }}>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <TH rowSpan={2}>No.</TH>
                <TH rowSpan={2}>Aseguradora</TH>
                <TH rowSpan={2}>Póliza</TH>
                <TH rowSpan={2}>F. Emisión</TH>
                <TH colSpan={2}>Vigencia</TH>
                <TH rowSpan={2}>Folio</TH>
                <TH rowSpan={2}>Vendedor</TH>
                <TH rowSpan={2}>Asegurado</TH>
                <TH rowSpan={2}>Vale $</TH>
                <TH rowSpan={2}>Prima T. Anual</TH>
                <TH rowSpan={2}>Prima Neta Anual</TH>
                <TH rowSpan={2}>Prima T. 1er Pago</TH>
                <TH rowSpan={2}>Cobertura</TH>
                <TH colSpan={2}>Uso / Vehículo</TH>
                <TH rowSpan={2}>Forma Pago</TH>
                <TH colSpan={4}>Tipo de Pago</TH>
                <TH rowSpan={2}>Pol.Pend.Pago</TH>
                <TH rowSpan={2}>Teléfono</TH>
                <TH rowSpan={2}>Observaciones</TH>
                <TH colSpan={6}>Respaldo</TH>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-200">
                <TH blue>Inicio</TH>
                <TH blue>Fin</TH>
                <TH blue>Placas</TH>
                <TH blue>Tipo</TH>
                <TH blue>Efectivo</TH>
                <TH blue>Cheq/Dep</TH>
                <TH blue>TDC</TH>
                <TH blue>Autorización</TH>
                <TH blue>Fotos</TH>
                <TH blue>Fact.</TH>
                <TH blue>T. Circ.</TH>
                <TH blue>Identif.</TH>
                <TH blue>Pol. Ant.</TH>
                <TH blue>Otro</TH>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {registros.length === 0 && (
                <tr>
                  <td colSpan={31} className="px-5 py-12 text-center text-sm text-gray-400">
                    Sin pólizas registradas hoy. Registra pólizas en la sección <strong>Pólizas</strong>.
                  </td>
                </tr>
              )}

              {registros.map((r, i) => (
                <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-3 py-2.5 font-bold text-[#13193a]">{i + 1}</td>
                  <td className="px-3 py-2.5 font-semibold text-gray-700">{r.aseguradora || "—"}</td>
                  <td className="px-3 py-2.5 font-mono font-bold text-[#13193a]">{r.numero_poliza || "—"}</td>
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{fmt(r.fecha_emision)}</td>
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap bg-blue-50/20">{fmt(r.vigencia_inicio)}</td>
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap bg-blue-50/20">{fmt(r.vigencia_fin)}</td>
                  <td className="px-3 py-2.5 font-mono text-gray-600">{r.folio || "—"}</td>
                  <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{r.vendedor_nombre || "—"}</td>
                  <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{r.asegurado_nombre || "—"}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-gray-700">{n(r.vale) > 0 ? $(r.vale) : "—"}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-[#13193a]">{$(r.prima_anual)}</td>
                  <td className="px-3 py-2.5 text-right text-gray-700">{$(r.prima_neta)}</td>
                  <td className="px-3 py-2.5 text-right font-bold text-emerald-700">{$(r.prima_primer_pago)}</td>
                  <td className="px-3 py-2.5 text-gray-600 max-w-[110px] truncate">{r.cobertura || "—"}</td>
                  <td className="px-3 py-2.5 font-mono text-gray-600 bg-blue-50/20">{r.placas || "—"}</td>
                  <td className="px-3 py-2.5 text-gray-600 bg-blue-50/20">{r.tipo || "—"}</td>
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{r.forma_pago || "—"}</td>
                  <td className="px-3 py-2.5 text-right font-bold text-emerald-700 bg-emerald-50/20">{$(r.efectivo)}</td>
                  <td className="px-3 py-2.5 text-right text-gray-500 bg-emerald-50/20">{n(r.cheque) > 0 ? $(r.cheque) : "—"}</td>
                  <td className="px-3 py-2.5 text-right text-gray-500 bg-emerald-50/20">{n(r.tdc) > 0 ? $(r.tdc) : "—"}</td>
                  <td className="px-3 py-2.5 text-gray-500 bg-emerald-50/20">{r.autorizacion || "—"}</td>
                  <td className="px-3 py-2.5 text-right text-gray-400">{n(r.pol_pend_pago) > 0 ? $(r.pol_pend_pago) : "—"}</td>
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{r.telefono || "—"}</td>
                  <td className="px-3 py-2.5 text-gray-400 max-w-[120px] truncate">{r.observaciones || "—"}</td>
                  {[r.fotos, r.factura, r.t_circ, r.identif, r.pol_ant, r.otro].map((v, j) => (
                    <td key={j} className="px-3 py-2.5 text-center bg-amber-50/20">
                      {v ? <span className="text-amber-600 font-bold">✓</span> : <span className="text-gray-300">—</span>}
                    </td>
                  ))}
                </tr>
              ))}

              {registros.length > 0 && (
                <tr className="bg-[#13193a]/5 font-bold border-t-2 border-[#13193a]/20">
                  <td colSpan={9} className="px-3 py-3 text-right text-xs font-bold text-[#13193a]">TOTAL</td>
                  <td className="px-3 py-3 text-right text-xs text-[#13193a]">{$(totalVales)}</td>
                  <td className="px-3 py-3 text-right text-xs text-[#13193a]">{$(sumaPrimaAnual)}</td>
                  <td className="px-3 py-3 text-right text-xs text-[#13193a]">{$(sumaPrimaNeta)}</td>
                  <td className="px-3 py-3 text-right text-xs font-bold text-emerald-700">{$(sumaPrimerPago)}</td>
                  <td colSpan={4} />
                  <td className="px-3 py-3 text-right text-xs font-bold text-emerald-700">{$(totalEfectivo)}</td>
                  <td colSpan={11} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Resumen + Billetes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-5 items-stretch">
        {/* Columna izquierda */}
        <div className="flex flex-col gap-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-[#13193a] px-5 py-3.5">
              <p className="text-sm font-bold text-white">Resumen de cobro</p>
              <p className="text-white/40 text-xs mt-0.5">Calculado automáticamente del registro del día</p>
            </div>
            <div className="p-5 space-y-1">
              {[
                { label: "Efectivo",              value: totalEfectivo },
                { label: "Vales",                 value: totalVales    },
                { label: "T. Crédito / Débito",   value: totalTDC      },
                { label: "Fichas Cheques/Trans",  value: totalCheque   },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <label className="text-xs font-bold text-gray-500 w-44 shrink-0">{f.label}</label>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input readOnly value={f.value.toFixed(2)} className={iResumen + " pl-7 bg-gray-50 cursor-default select-all"} />
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-gray-500 w-44 shrink-0">Gastos</label>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number" min="0" step="0.01"
                    value={gastos || ""}
                    onChange={(e) => setGastos(parseFloat(e.target.value) || 0)}
                    className={iResumen + " pl-7"}
                  />
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-2">
                {[
                  { label: "Subtotal efectivo",   value: subEfectivo,  bold: false             },
                  { label: "Total",               value: totalCobro,   bold: true              },
                  { label: "Pólizas pend. pago",  value: polPendPago,  bold: false, warn: true },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <p className={`text-xs ${row.warn ? "text-amber-600" : "text-gray-600"} ${row.bold ? "font-bold" : "font-medium"}`}>
                      {row.label}
                    </p>
                    <p className={`text-sm tabular-nums ${row.warn ? "text-amber-700" : row.bold ? "font-bold text-[#13193a]" : "text-gray-700"}`}>
                      ${row.value.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col flex-1">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">
              Observaciones del corte
            </label>
            <textarea
              placeholder="Observaciones generales del día, irregularidades, comentarios…"
              className="flex-1 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] resize-none"
            />
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
                      onChange={(e) => setBilletes((b) => ({ ...b, [d]: e.target.value }))}
                      className={iResumen + " text-center"}
                    />
                    <p className="text-xs font-bold text-[#13193a] text-right tabular-nums">
                      {subtot > 0 ? `$${subtot.toFixed(2)}` : "—"}
                    </p>
                  </div>
                );
              })}
            </div>
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
                diferencia === 0
                  ? "bg-emerald-50 border-emerald-200"
                  : diferencia > 0
                    ? "bg-blue-50 border-blue-200"
                    : "bg-red-50 border-red-200"
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
    </div>
  );
}
