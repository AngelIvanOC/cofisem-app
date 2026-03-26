// ============================================================
// src/features/analista/reportes/ReportesPage.jsx
// Analista: reportes con 4 tabs — Producción, Vencimientos, Cobros, Comparativo
// ============================================================
import { useState } from "react";
import BarChart from "./BarChart";
import { FiltroSelect } from "../../../shared/ui/Buscador";
import { TablaTabs } from "../../../shared/ui/TablaBase";
import { OFICINAS_CON_TODAS, VENDEDORES_CON_TODOS } from "../../../shared/constants/oficinas";

const PERIODOS  = ["Hoy", "Esta semana", "Este mes", "Mes anterior", "Este año", "Rango personalizado"];
const COBERTURAS = ["Todas", "TAXI BÁSICA 2500", "TAXI BÁSICA PAGOS 2700", "SERV. PÚB. 50/50 GAMAN 2", "COBERTURA APP (UBER, DIDI)"];

const PRODUCCION_DATA = [
  { oficina: "COFISEM AV. E.ZAPATA", vendedor: "Luis Martínez",    polizas: 18, primaNeta: 28800, vales: 1200, total: 41760 },
  { oficina: "COFISEM AV. E.ZAPATA", vendedor: "Marco A. Cruz",    polizas: 12, primaNeta: 19200, vales: 800,  total: 27840 },
  { oficina: "OFICINA CIVAC",        vendedor: "Laura Rosher",     polizas: 21, primaNeta: 33600, vales: 1400, total: 48720 },
  { oficina: "OFICINA CIVAC",        vendedor: "Carlos Soto",      polizas: 9,  primaNeta: 14400, vales: 600,  total: 20880 },
  { oficina: "COFISEM TEMIXCO",      vendedor: "Carlos Soto",      polizas: 15, primaNeta: 24000, vales: 1000, total: 34800 },
  { oficina: "COFISEM CUAUTLA",      vendedor: "Patricia Morales", polizas: 6,  primaNeta: 9600,  vales: 400,  total: 13920 },
];

const VENCIMIENTOS_DATA = [
  { id: "3411002", asegurado: "Carmen López",   oficina: "COFISEM TEMIXCO",       vendedor: "Carlos Soto",    vence: "20/03/2026", dias: 3,  prima: 2200 },
  { id: "3410888", asegurado: "José Martínez",  oficina: "OFICINA CIVAC",         vendedor: "Marco A. Cruz",  vence: "22/03/2026", dias: 5,  prima: 2320 },
  { id: "3410755", asegurado: "Ana Gutiérrez",  oficina: "COFISEM CUAUTLA",       vendedor: "Patricia Morales",vence: "24/03/2026", dias: 7,  prima: 3142 },
  { id: "3410312", asegurado: "Luis Moreno",    oficina: "COFISEM AV. E.ZAPATA",  vendedor: "Laura Rosher",   vence: "28/03/2026", dias: 11, prima: 2548 },
  { id: "3410100", asegurado: "Rosa Jiménez",   oficina: "OFICINA CIVAC",         vendedor: "Carlos Soto",    vence: "30/03/2026", dias: 13, prima: 2200 },
];

const COBROS_DATA = [
  { id: "3413241", asegurado: "Angel Ivan Ortega", oficina: "OFICINA CIVAC",       vendedor: "Laura Rosher",    cuota: 1, monto: 785.70, fecha: "13/03/2026", forma: "Efectivo",      ref: "REC-042"  },
  { id: "3413198", asegurado: "María García",      oficina: "COFISEM AV. E.ZAPATA",vendedor: "Marco A. Cruz",   cuota: 1, monto: 2200.00,fecha: "12/03/2026", forma: "Efectivo",      ref: "REC-038"  },
  { id: "3413167", asegurado: "Roberto Díaz",      oficina: "COFISEM AV. E.ZAPATA",vendedor: "Laura Rosher",    cuota: 1, monto: 637.00, fecha: "11/03/2026", forma: "Efectivo",      ref: "REC-031"  },
  { id: "3410888", asegurado: "José Martínez",     oficina: "OFICINA CIVAC",       vendedor: "Marco A. Cruz",   cuota: 3, monto: 580.00, fecha: "19/09/2025", forma: "Efectivo",      ref: "REC-021"  },
  { id: "3408500", asegurado: "Ana Gutiérrez",     oficina: "COFISEM CUAUTLA",     vendedor: "Patricia Morales",cuota: 3, monto: 785.70, fecha: "10/07/2025", forma: "Transferencia", ref: "TRF-0198" },
];

const TABS = [
  { key: "produccion",  label: "Producción"   },
  { key: "vencimientos",label: "Vencimientos" },
  { key: "cobros",      label: "Cobros"        },
  { key: "comparativo", label: "Comparativo"   },
];

const thCls = "text-left text-[11px] font-semibold text-white px-4 py-3 whitespace-nowrap";
const tdCls = "px-4 py-3 text-xs";

export default function ReportesPage() {
  const [tab,            setTab]            = useState("produccion");
  const [filtroOficina,  setFiltroOficina]  = useState("Todas");
  const [filtroVendedor, setFiltroVendedor] = useState("Todos");
  const [filtroPeriodo,  setFiltroPeriodo]  = useState("Este mes");

  const filtrar = (arr) => arr.filter((d) =>
    (filtroOficina  === "Todas" || d.oficina  === filtroOficina) &&
    (filtroVendedor === "Todos"  || d.vendedor === filtroVendedor)
  );

  const prodFilt = filtrar(PRODUCCION_DATA);
  const vencFilt = filtrar(VENCIMIENTOS_DATA);
  const cobrFilt = filtrar(COBROS_DATA);

  const totalPolizas   = prodFilt.reduce((s, d) => s + d.polizas, 0);
  const totalPrimaNeta = prodFilt.reduce((s, d) => s + d.primaNeta, 0);
  const totalVales     = prodFilt.reduce((s, d) => s + d.vales, 0);
  const totalGeneral   = prodFilt.reduce((s, d) => s + d.total, 0);
  const totalCobros    = cobrFilt.reduce((s, d) => s + d.monto, 0);

  const porOficina = Object.values(
    prodFilt.reduce((acc, d) => {
      const k = d.oficina.split(" ").pop();
      if (!acc[d.oficina]) acc[d.oficina] = { label: k, total: 0, polizas: 0 };
      acc[d.oficina].total   += d.total;
      acc[d.oficina].polizas += d.polizas;
      return acc;
    }, {})
  );

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Reportes</h1>
          <p className="text-gray-400 text-sm mt-0.5">Análisis y reportes — filtros por oficina y vendedor</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
          Exportar
        </button>
      </div>

      {/* Filtros globales */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Filtros del reporte</p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <FiltroSelect value={filtroOficina}  onChange={setFiltroOficina}  opciones={OFICINAS_CON_TODAS} />
          <FiltroSelect value={filtroVendedor} onChange={setFiltroVendedor} opciones={["Todos", "Laura Rosher", "Marco A. Cruz", "Carlos Soto", "Patricia Morales"]} />
          <FiltroSelect value={filtroPeriodo}  onChange={setFiltroPeriodo}  opciones={PERIODOS} />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <TablaTabs tabs={TABS} activeTab={tab} onTabChange={setTab} />

        {/* ── Producción ── */}
        {tab === "produccion" && (
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Pólizas emitidas",  value: totalPolizas,                                        accent: "blue"    },
                { label: "Prima neta total",   value: `$${totalPrimaNeta.toLocaleString("es-MX")}`,        accent: "emerald" },
                { label: "Total vales",        value: `$${totalVales.toLocaleString("es-MX")}`,            accent: "amber"   },
                { label: "Total general",      value: `$${totalGeneral.toLocaleString("es-MX")}`,          accent: "blue"    },
              ].map((m) => {
                const c = { blue: "bg-blue-50 text-blue-700", emerald: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700" };
                return (
                  <div key={m.label} className={`${c[m.accent]} rounded-2xl p-4`}>
                    <p className="text-2xl font-bold tabular-nums">{m.value}</p>
                    <p className="text-xs font-semibold mt-0.5 opacity-90">{m.label}</p>
                  </div>
                );
              })}
            </div>
            {filtroOficina === "Todas" && porOficina.length > 1 && (
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Total por oficina</p>
                <BarChart data={porOficina} valueKey="total" labelKey="label" />
              </div>
            )}
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-sm">
                <thead><tr className="bg-[#13193a]">{["Oficina","Vendedor","Pólizas","Prima Neta","Vales $","Total"].map((h) => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {prodFilt.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-sm text-gray-400">Sin datos.</td></tr>
                  ) : prodFilt.map((d, i) => (
                    <tr key={i} className="hover:bg-gray-50/60">
                      <td className={`${tdCls} font-medium text-gray-700 max-w-32 truncate`}>{d.oficina}</td>
                      <td className={`${tdCls} text-gray-700`}>{d.vendedor}</td>
                      <td className={`${tdCls} font-bold text-[#13193a] tabular-nums`}>{d.polizas}</td>
                      <td className={`${tdCls} font-semibold text-gray-700 tabular-nums`}>${d.primaNeta.toLocaleString("es-MX")}</td>
                      <td className={`${tdCls} text-gray-500 tabular-nums`}>${d.vales.toLocaleString("es-MX")}</td>
                      <td className={`${tdCls} font-bold text-emerald-700 tabular-nums`}>${d.total.toLocaleString("es-MX")}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                    <td colSpan={2} className={`${tdCls} font-bold text-[#13193a]`}>TOTAL</td>
                    <td className={`${tdCls} font-bold text-[#13193a] tabular-nums`}>{totalPolizas}</td>
                    <td className={`${tdCls} font-bold text-[#13193a] tabular-nums`}>${totalPrimaNeta.toLocaleString("es-MX")}</td>
                    <td className={`${tdCls} font-bold text-[#13193a] tabular-nums`}>${totalVales.toLocaleString("es-MX")}</td>
                    <td className={`${tdCls} font-bold text-emerald-700 tabular-nums`}>${totalGeneral.toLocaleString("es-MX")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Vencimientos ── */}
        {tab === "vencimientos" && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Vencen en 7 días",  value: vencFilt.filter((v) => v.dias <= 7).length,  accent: "red"     },
                { label: "Vencen en 15 días", value: vencFilt.filter((v) => v.dias <= 15).length, accent: "amber"   },
                { label: "Vencen en 30 días", value: vencFilt.length,                              accent: "blue"    },
                { label: "Prima en riesgo",   value: `$${vencFilt.reduce((s, v) => s + v.prima, 0).toLocaleString("es-MX")}`, accent: "emerald" },
              ].map((m) => {
                const c = { red: "bg-red-50 text-red-600", amber: "bg-amber-50 text-amber-700", blue: "bg-blue-50 text-blue-700", emerald: "bg-emerald-50 text-emerald-700" };
                return (
                  <div key={m.label} className={`${c[m.accent]} rounded-2xl p-4`}>
                    <p className="text-2xl font-bold tabular-nums">{m.value}</p>
                    <p className="text-xs font-semibold mt-0.5 opacity-90">{m.label}</p>
                  </div>
                );
              })}
            </div>
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-sm">
                <thead><tr className="bg-[#13193a]">{["Póliza","Asegurado","Oficina","Vendedor","Prima","Vence","Días restantes"].map((h) => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {vencFilt.map((v, i) => (
                    <tr key={i} className="hover:bg-gray-50/60">
                      <td className={`${tdCls} font-mono font-bold text-[#13193a]`}>{v.id}</td>
                      <td className={`${tdCls} font-semibold text-gray-700`}>{v.asegurado}</td>
                      <td className={`${tdCls} text-gray-500 max-w-28 truncate`}>{v.oficina}</td>
                      <td className={`${tdCls} text-gray-500`}>{v.vendedor}</td>
                      <td className={`${tdCls} font-bold text-emerald-700`}>${v.prima.toLocaleString("es-MX")}</td>
                      <td className={`${tdCls} text-gray-500`}>{v.vence}</td>
                      <td className={tdCls}>
                        <span className={`inline-flex text-[11px] font-bold px-2.5 py-1 rounded-full border ${v.dias <= 3 ? "bg-red-50 text-red-600 border-red-200" : v.dias <= 7 ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                          {v.dias} días
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Cobros ── */}
        {tab === "cobros" && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { label: "Cobros del período", value: cobrFilt.length, accent: "blue" },
                { label: "Total cobrado",       value: `$${totalCobros.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`, accent: "emerald" },
                { label: "Efectivo",            value: `$${cobrFilt.filter((c) => c.forma === "Efectivo").reduce((s, c) => s + c.monto, 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`, accent: "amber" },
              ].map((m) => {
                const c = { blue: "bg-blue-50 text-blue-700", emerald: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700" };
                return (
                  <div key={m.label} className={`${c[m.accent]} rounded-2xl p-4`}>
                    <p className="text-2xl font-bold tabular-nums">{m.value}</p>
                    <p className="text-xs font-semibold mt-0.5 opacity-90">{m.label}</p>
                  </div>
                );
              })}
            </div>
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-sm">
                <thead><tr className="bg-[#13193a]">{["Póliza","Asegurado","Oficina","Vendedor","Cuota","Monto","Fecha pago","Forma","Referencia"].map((h) => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {cobrFilt.map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50/60">
                      <td className={`${tdCls} font-mono font-bold text-[#13193a]`}>{c.id}</td>
                      <td className={`${tdCls} font-semibold text-gray-700`}>{c.asegurado}</td>
                      <td className={`${tdCls} text-gray-500 max-w-28 truncate`}>{c.oficina}</td>
                      <td className={`${tdCls} text-gray-500`}>{c.vendedor}</td>
                      <td className={`${tdCls} text-center text-gray-500`}>{c.cuota}</td>
                      <td className={`${tdCls} font-bold text-emerald-700`}>${c.monto.toFixed(2)}</td>
                      <td className={`${tdCls} text-gray-500`}>{c.fecha}</td>
                      <td className={tdCls}><span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600">{c.forma}</span></td>
                      <td className={`${tdCls} font-mono text-gray-500`}>{c.ref}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                    <td colSpan={5} className={`${tdCls} font-bold text-[#13193a]`}>TOTAL</td>
                    <td className={`${tdCls} font-bold text-emerald-700`}>${totalCobros.toFixed(2)}</td>
                    <td colSpan={3} />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Comparativo ── */}
        {tab === "comparativo" && (
          <div className="p-5 space-y-5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Comparativo entre oficinas — {filtroPeriodo}</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="overflow-x-auto rounded-2xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead><tr className="bg-[#13193a]">{["Oficina","Pólizas","Total","% del total"].map((h) => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {porOficina.map((o, i) => (
                      <tr key={i} className="hover:bg-gray-50/60">
                        <td className={`${tdCls} font-medium text-gray-700`}>{PRODUCCION_DATA.find((d) => d.oficina.endsWith(o.label))?.oficina ?? o.label}</td>
                        <td className={`${tdCls} font-bold text-[#13193a] tabular-nums`}>{o.polizas}</td>
                        <td className={`${tdCls} font-bold text-emerald-700 tabular-nums`}>${o.total.toLocaleString("es-MX")}</td>
                        <td className={tdCls}>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-100 rounded-full h-1.5">
                              <div className="h-1.5 bg-[#13193a] rounded-full" style={{ width: `${(o.total / Math.max(...porOficina.map((x) => x.total))) * 100}%` }} />
                            </div>
                            <span className="text-[11px] text-gray-500">{Math.round((o.total / totalGeneral) * 100)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-4">Total generado por oficina</p>
                <BarChart data={porOficina} valueKey="total" labelKey="label" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
