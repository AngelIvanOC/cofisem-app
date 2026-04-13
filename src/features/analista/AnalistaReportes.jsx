// ============================================================
// src/pages/analista/AnalistaReportes.jsx
// Analista: Reportes con filtros por oficina y vendedor
// Vistas: Producción, Vencimientos, Cobros, Comparativo
// ============================================================
import { useState } from "react";

const OFICINAS  = ["Todas", "COFISEM AV. E.ZAPATA", "OFICINA CIVAC", "COFISEM TEMIXCO", "COFISEM CUAUTLA"];
const VENDEDORES = ["Todos", "Laura Rosher", "Marco A. Cruz", "Carlos Soto", "Patricia Morales"];
const PERIODOS  = ["Hoy", "Esta semana", "Este mes", "Mes anterior", "Este año", "Rango personalizado"];
const COBERTURAS = ["Todas", "TAXI BÁSICA 2500", "TAXI BÁSICA PAGOS 2700", "SERV. PÚB. 50/50 GAMAN 2", "COBERTURA APP (UBER, DIDI)"];

// Mock de datos para reportes
const PRODUCCION_DATA = [
  { oficina:"COFISEM AV. E.ZAPATA", vendedor:"Laura Rosher",  polizas:18, primaNeta:28800, vales:1200, total:41760 },
  { oficina:"COFISEM AV. E.ZAPATA", vendedor:"Marco A. Cruz", polizas:12, primaNeta:19200, vales:800,  total:27840 },
  { oficina:"OFICINA CIVAC",        vendedor:"Laura Rosher",  polizas:21, primaNeta:33600, vales:1400, total:48720 },
  { oficina:"OFICINA CIVAC",        vendedor:"Carlos Soto",   polizas:9,  primaNeta:14400, vales:600,  total:20880 },
  { oficina:"COFISEM TEMIXCO",      vendedor:"Carlos Soto",   polizas:15, primaNeta:24000, vales:1000, total:34800 },
  { oficina:"COFISEM CUAUTLA",      vendedor:"Patricia Morales",polizas:6,primaNeta:9600,  vales:400,  total:13920 },
];

const VENCIMIENTOS_DATA = [
  { id:"3411002", asegurado:"Carmen López",    oficina:"COFISEM TEMIXCO",        vendedor:"Carlos Soto",    vence:"20/03/2026", dias:3,  prima:2200, cobertura:"TAXI BÁSICA 2500"       },
  { id:"3410888", asegurado:"José Martínez",   oficina:"OFICINA CIVAC",          vendedor:"Marco A. Cruz",  vence:"22/03/2026", dias:5,  prima:2320, cobertura:"TAXI BÁSICA PAGOS 2700" },
  { id:"3410755", asegurado:"Ana Gutiérrez",   oficina:"COFISEM CUAUTLA",        vendedor:"Patricia Morales",vence:"24/03/2026",dias:7,  prima:3142, cobertura:"COBERTURA APP (UBER, DIDI)" },
  { id:"3410312", asegurado:"Luis Moreno",     oficina:"COFISEM AV. E.ZAPATA",   vendedor:"Laura Rosher",   vence:"28/03/2026", dias:11, prima:2548, cobertura:"SERV. PÚB. 50/50 GAMAN 2" },
  { id:"3410100", asegurado:"Rosa Jiménez",    oficina:"OFICINA CIVAC",          vendedor:"Carlos Soto",    vence:"30/03/2026", dias:13, prima:2200, cobertura:"TAXI BÁSICA 2500"       },
];

const COBROS_DATA = [
  { id:"3413241", asegurado:"Angel Ivan Ortega", oficina:"OFICINA CIVAC",       vendedor:"Laura Rosher",  cuota:1, monto:785.70, fecha:"13/03/2026", forma:"Efectivo",      ref:"REC-042" },
  { id:"3413198", asegurado:"María García",      oficina:"COFISEM AV. E.ZAPATA",vendedor:"Marco A. Cruz", cuota:1, monto:2200.00,fecha:"12/03/2026", forma:"Efectivo",      ref:"REC-038" },
  { id:"3413167", asegurado:"Roberto Díaz",      oficina:"COFISEM AV. E.ZAPATA",vendedor:"Laura Rosher",  cuota:1, monto:637.00, fecha:"11/03/2026", forma:"Efectivo",      ref:"REC-031" },
  { id:"3410888", asegurado:"José Martínez",     oficina:"OFICINA CIVAC",       vendedor:"Marco A. Cruz", cuota:3, monto:580.00, fecha:"19/09/2025", forma:"Efectivo",      ref:"REC-021" },
  { id:"3408500", asegurado:"Ana Gutiérrez",     oficina:"COFISEM CUAUTLA",     vendedor:"Patricia Morales",cuota:3,monto:785.70,fecha:"10/07/2025", forma:"Transferencia", ref:"TRF-0198" },
];

// Mini gráfica de barras SVG
function BarChart({ data, valueKey, labelKey, color = "#13193a" }) {
  const max = Math.max(...data.map(d => d[valueKey]));
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((d, i) => {
        const pct = max > 0 ? (d[valueKey] / max) * 100 : 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="relative w-full flex items-end" style={{ height: 96 }}>
              <div
                className="w-full rounded-t-lg transition-all duration-500"
                style={{ height: `${pct}%`, background: color, opacity: 0.85 }}
              />
              {/* Tooltip */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#13193a] text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                ${d[valueKey].toLocaleString()}
              </div>
            </div>
            <p className="text-[9px] text-gray-400 text-center leading-tight truncate w-full">{d[labelKey]}</p>
          </div>
        );
      })}
    </div>
  );
}

function KPI({ label, value, sub, accent = "blue" }) {
  const colors = {
    blue:    "bg-blue-50   text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber:   "bg-amber-50  text-amber-700",
    red:     "bg-red-50    text-red-600",
  };
  return (
    <div className={`${colors[accent]} rounded-2xl p-4`}>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs font-semibold mt-0.5 opacity-90">{label}</p>
      {sub && <p className="text-[11px] opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AnalistaReportes() {
  const [tab,            setTab]            = useState("produccion");
  const [filtroOficina,  setFiltroOficina]  = useState("Todas");
  const [filtroVendedor, setFiltroVendedor] = useState("Todos");
  const [filtroPeriodo,  setFiltroPeriodo]  = useState("Este mes");
  const [filtroCobertura,setFiltroCobertura]= useState("Todas");
  const [fechaDesde,     setFechaDesde]     = useState("");
  const [fechaHasta,     setFechaHasta]     = useState("");

  // Filtrado universal
  const filtrarPorOficinaVendedor = (arr, ofKey = "oficina", vKey = "vendedor") =>
    arr.filter(d =>
      (filtroOficina  === "Todas" || d[ofKey]  === filtroOficina) &&
      (filtroVendedor === "Todos"  || d[vKey]   === filtroVendedor)
    );

  const produccionFiltrada = filtrarPorOficinaVendedor(PRODUCCION_DATA);
  const vencimientosFiltrados = filtrarPorOficinaVendedor(VENCIMIENTOS_DATA);
  const cobrosFiltrados = filtrarPorOficinaVendedor(COBROS_DATA);

  // Totales
  const totalPolizas  = produccionFiltrada.reduce((s, d) => s + d.polizas, 0);
  const totalPrimaNeta = produccionFiltrada.reduce((s, d) => s + d.primaNeta, 0);
  const totalVales    = produccionFiltrada.reduce((s, d) => s + d.vales, 0);
  const totalGeneral  = produccionFiltrada.reduce((s, d) => s + d.total, 0);
  const totalCobros   = cobrosFiltrados.reduce((s, d) => s + d.monto, 0);

  // Agrupar producción por oficina para la gráfica
  const porOficina = Object.values(
    produccionFiltrada.reduce((acc, d) => {
      const k = d.oficina.split(" ").slice(-1)[0]; // abreviatura
      if (!acc[d.oficina]) acc[d.oficina] = { label: k, total: 0, polizas: 0 };
      acc[d.oficina].total   += d.total;
      acc[d.oficina].polizas += d.polizas;
      return acc;
    }, {})
  );

  const TABS = [
    { k:"produccion",  l:"Producción"   },
    { k:"vencimientos",l:"Vencimientos" },
    { k:"cobros",      l:"Cobros"       },
    { k:"comparativo", l:"Comparativo"  },
  ];

  const inpCls = "w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]";

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Reportes</h1>
          <p className="text-gray-400 text-sm mt-0.5">Análisis y reportes — filtros por oficina y vendedor</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
          </svg>
          Exportar
        </button>
      </div>

      {/* Panel de filtros globales */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Filtros del reporte</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Oficina</label>
            <select value={filtroOficina} onChange={e => setFiltroOficina(e.target.value)} className={inpCls}>
              {OFICINAS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Vendedor</label>
            <select value={filtroVendedor} onChange={e => setFiltroVendedor(e.target.value)} className={inpCls}>
              {VENDEDORES.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Período</label>
            <select value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)} className={inpCls}>
              {PERIODOS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          {filtroPeriodo === "Rango personalizado" ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Desde</label>
                <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className={inpCls}/>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Hasta</label>
                <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className={inpCls}/>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Cobertura</label>
              <select value={filtroCobertura} onChange={e => setFiltroCobertura(e.target.value)} className={inpCls}>
                {COBERTURAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tabs de tipo de reporte */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center border-b border-gray-100 px-2 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={[
                "px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap",
                tab === t.k ? "border-[#13193a] text-[#13193a]" : "border-transparent text-gray-400 hover:text-gray-600",
              ].join(" ")}>
              {t.l}
            </button>
          ))}
        </div>

        {/* ── PRODUCCIÓN ── */}
        {tab === "produccion" && (
          <div className="p-5 space-y-5">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KPI label="Pólizas emitidas"  value={totalPolizas}                                          accent="blue"    sub={filtroPeriodo}/>
              <KPI label="Prima neta total"   value={`$${totalPrimaNeta.toLocaleString("es-MX")}`}         accent="emerald" sub="Sin IVA"/>
              <KPI label="Total vales"        value={`$${totalVales.toLocaleString("es-MX")}`}              accent="amber"/>
              <KPI label="Total general"      value={`$${totalGeneral.toLocaleString("es-MX")}`}            accent="blue"    sub="Con derechos e IVA"/>
            </div>

            {/* Gráfica por oficina */}
            {filtroOficina === "Todas" && porOficina.length > 1 && (
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Total por oficina</p>
                <BarChart data={porOficina} valueKey="total" labelKey="label"/>
              </div>
            )}

            {/* Tabla por vendedor */}
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#13193a]">
                    {["Oficina","Vendedor","Pólizas","Prima Neta","Vales $","Total"].map(h => (
                      <th key={h} className="text-left text-[11px] font-semibold text-white px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {produccionFiltrada.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-sm text-gray-400">Sin datos para los filtros seleccionados.</td></tr>
                  ) : produccionFiltrada.map((d, i) => (
                    <tr key={i} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3 text-xs text-gray-700 font-medium">{d.oficina}</td>
                      <td className="px-4 py-3 text-xs text-gray-700">{d.vendedor}</td>
                      <td className="px-4 py-3 text-xs font-bold text-[#13193a] tabular-nums">{d.polizas}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-gray-700 tabular-nums">${d.primaNeta.toLocaleString("es-MX")}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 tabular-nums">${d.vales.toLocaleString("es-MX")}</td>
                      <td className="px-4 py-3 text-xs font-bold text-emerald-700 tabular-nums">${d.total.toLocaleString("es-MX")}</td>
                    </tr>
                  ))}
                  {/* Totales */}
                  <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                    <td colSpan={2} className="px-4 py-3 text-xs text-[#13193a]">TOTAL</td>
                    <td className="px-4 py-3 text-xs text-[#13193a] tabular-nums">{totalPolizas}</td>
                    <td className="px-4 py-3 text-xs text-[#13193a] tabular-nums">${totalPrimaNeta.toLocaleString("es-MX")}</td>
                    <td className="px-4 py-3 text-xs text-[#13193a] tabular-nums">${totalVales.toLocaleString("es-MX")}</td>
                    <td className="px-4 py-3 text-xs text-emerald-700 tabular-nums">${totalGeneral.toLocaleString("es-MX")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── VENCIMIENTOS ── */}
        {tab === "vencimientos" && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-2">
              <KPI label="Vencen en 7 días"  value={vencimientosFiltrados.filter(v=>v.dias<=7).length}  accent="red"/>
              <KPI label="Vencen en 15 días" value={vencimientosFiltrados.filter(v=>v.dias<=15).length} accent="amber"/>
              <KPI label="Vencen en 30 días" value={vencimientosFiltrados.length}                        accent="blue"/>
              <KPI label="Prima en riesgo"   value={`$${vencimientosFiltrados.reduce((s,v)=>s+v.prima,0).toLocaleString("es-MX")}`} accent="emerald"/>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#13193a]">
                    {["Póliza","Asegurado","Oficina","Vendedor","Cobertura","Prima","Vence","Días restantes",""].map(h => (
                      <th key={h} className="text-left text-[11px] font-semibold text-white px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {vencimientosFiltrados.map((v, i) => (
                    <tr key={i} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-[#13193a]">{v.id}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-gray-700">{v.asegurado}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-28 truncate">{v.oficina}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{v.vendedor}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-36 truncate">{v.cobertura}</td>
                      <td className="px-4 py-3 text-xs font-bold text-emerald-700">${v.prima.toLocaleString("es-MX")}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{v.vence}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                          v.dias <= 3  ? "bg-red-50    text-red-600    border-red-200"    :
                          v.dias <= 7  ? "bg-orange-50 text-orange-700 border-orange-200" :
                                         "bg-amber-50  text-amber-700  border-amber-200"
                        }`}>{v.dias} días</span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-xs text-blue-600 font-semibold hover:underline whitespace-nowrap">Renovar →</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── COBROS ── */}
        {tab === "cobros" && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-2">
              <KPI label="Cobros del período" value={cobrosFiltrados.length}                                                          accent="blue"/>
              <KPI label="Total cobrado"       value={`$${totalCobros.toLocaleString("es-MX", {minimumFractionDigits:2})}`}            accent="emerald"/>
              <KPI label="Efectivo"            value={`$${cobrosFiltrados.filter(c=>c.forma==="Efectivo").reduce((s,c)=>s+c.monto,0).toLocaleString("es-MX", {minimumFractionDigits:2})}`} accent="amber"/>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#13193a]">
                    {["Póliza","Asegurado","Oficina","Vendedor","Cuota","Monto","Fecha pago","Forma","Referencia"].map(h => (
                      <th key={h} className="text-left text-[11px] font-semibold text-white px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cobrosFiltrados.map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-[#13193a]">{c.id}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-gray-700">{c.asegurado}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-28 truncate">{c.oficina}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{c.vendedor}</td>
                      <td className="px-4 py-3 text-xs text-center text-gray-500">{c.cuota}</td>
                      <td className="px-4 py-3 text-xs font-bold text-emerald-700">${c.monto.toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{c.fecha}</td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600">{c.forma}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-500">{c.ref}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                    <td colSpan={5} className="px-4 py-3 text-xs text-[#13193a]">TOTAL</td>
                    <td className="px-4 py-3 text-xs font-bold text-emerald-700">${totalCobros.toFixed(2)}</td>
                    <td colSpan={3}/>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── COMPARATIVO ── */}
        {tab === "comparativo" && (
          <div className="p-5 space-y-5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Comparativo entre oficinas — {filtroPeriodo}</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Tabla comparativa */}
              <div className="overflow-x-auto rounded-2xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#13193a]">
                      <th className="text-left text-[11px] font-semibold text-white px-4 py-3">Oficina</th>
                      <th className="text-right text-[11px] font-semibold text-white px-4 py-3">Pólizas</th>
                      <th className="text-right text-[11px] font-semibold text-white px-4 py-3">Total</th>
                      <th className="text-right text-[11px] font-semibold text-white px-4 py-3">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {porOficina.map((o, i) => (
                      <tr key={i} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3 text-xs font-medium text-gray-700">{
                          OFICINAS.find(of => of !== "Todas" && of.includes(o.label)) ?? o.label
                        }</td>
                        <td className="px-4 py-3 text-xs font-bold text-[#13193a] tabular-nums text-right">{o.polizas}</td>
                        <td className="px-4 py-3 text-xs font-bold text-emerald-700 tabular-nums text-right">${o.total.toLocaleString("es-MX")}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <div className="w-16 bg-gray-100 rounded-full h-1.5">
                              <div className="h-1.5 bg-[#13193a] rounded-full" style={{ width:`${(o.total / Math.max(...porOficina.map(x=>x.total))) * 100}%` }}/>
                            </div>
                            <span className="text-[11px] text-gray-500 tabular-nums">{Math.round((o.total / totalGeneral) * 100)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Gráfica */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-4">Total generado por oficina</p>
                <BarChart data={porOficina} valueKey="total" labelKey="label" color="#13193a"/>
                <div className="mt-4 space-y-2">
                  {porOficina.map((o, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm shrink-0" style={{ background:`hsl(${220 + i*15}, 50%, ${40 + i*5}%)` }}/>
                      <p className="text-xs text-gray-500 flex-1 truncate">{o.label}</p>
                      <p className="text-xs font-bold text-[#13193a]">{o.polizas} pól.</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}