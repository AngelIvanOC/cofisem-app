// ============================================================
// src/features/ventas/reportes/ReportesPage.jsx
// Reportes: Producción, Comparativa, Coberturas, Tendencia
// ============================================================
import { useState } from "react";
import BarChart from "./BarChart";
import { FiltroSelect } from "../../../shared/ui/Buscador";

const MESES      = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const OFICINAS_F = ["Todas","COFISEM AV. E.ZAPATA","OFICINA CIVAC","COFISEM TEMIXCO","COFISEM CUAUTLA"];
const TABS       = ["Producción","Comparativa","Coberturas","Tendencia"];

const PROD_MENSUAL = [
  { label:"Oct", value:41 },{ label:"Nov", value:38 },{ label:"Dic", value:52 },
  { label:"Ene", value:45 },{ label:"Feb", value:43 },{ label:"Mar", value:47 },
];

const COMPARATIVA = [
  { oficina:"E. Zapata", actual:14, anterior:12, meta:15 },
  { oficina:"CIVAC",     actual:11, anterior:14, meta:15 },
  { oficina:"Temixco",   actual:6,  anterior:9,  meta:15 },
  { oficina:"Cuautla",   actual:16, anterior:15, meta:15 },
];

const COBERTURAS = [
  { label:"TAXI BÁS. 2500",  value:18, color:"#3B82F6", pct:38 },
  { label:"SERV. PÚB. 50/50",value:11, color:"#8B5CF6", pct:23 },
  { label:"COB. APP",        value:9,  color:"#10B981", pct:19 },
  { label:"TAXI PAG. 2700",  value:6,  color:"#F59E0B", pct:13 },
  { label:"GAMAN 2",         value:3,  color:"#EF4444", pct:6  },
];

const TENDENCIA_6M = [
  { label:"Oct", value:41, prefix:"" },{ label:"Nov", value:38 },{ label:"Dic", value:52 },
  { label:"Ene", value:45 },{ label:"Feb", value:43 },{ label:"Mar", value:47 },
];

export default function VentasReportes() {
  const [tab,          setTab]          = useState("Producción");
  const [mesIdx,       setMesIdx]       = useState(2);
  const [filtroOficina,setFiltroOficina]= useState("Todas");

  const totalActual   = COMPARATIVA.reduce((s, o) => s + o.actual, 0);
  const totalAnterior = COMPARATIVA.reduce((s, o) => s + o.anterior, 0);
  const diffPct       = Math.round(((totalActual - totalAnterior) / totalAnterior) * 100);

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Reportes</h1>
          <p className="text-gray-400 text-sm mt-0.5">Estadísticas y comparativas de ventas</p>
        </div>
        <div className="flex gap-2.5">
          <FiltroSelect value={MESES[mesIdx]}    onChange={(v) => setMesIdx(MESES.indexOf(v))} opciones={MESES} />
          <FiltroSelect value={filtroOficina}    onChange={setFiltroOficina}                   opciones={OFICINAS_F} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100/80 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? "bg-white text-[#13193a] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Producción ── */}
      {tab === "Producción" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm font-bold text-[#13193a] mb-1">Pólizas emitidas · últimos 6 meses</p>
            <p className="text-xs text-gray-400 mb-4">Total acumulado: {PROD_MENSUAL.reduce((s,d)=>s+d.value,0)} pólizas</p>
            <BarChart data={PROD_MENSUAL} height={140} color="#13193a" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <p className="text-sm font-bold text-[#13193a]">{MESES[mesIdx]} en detalle</p>
            {[
              { l:"Pólizas emitidas",  v:"47",       sub:"Meta: 60",    ok:false },
              { l:"Prima total",       v:"$103,400",  sub:"+8% vs ant.", ok:true  },
              { l:"Ticket promedio",   v:"$2,200",    sub:"Estable",     ok:true  },
              { l:"Días hábiles rest.",v:"11",        sub:"de 23 totales",ok:false},
            ].map((m) => (
              <div key={m.l} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 font-semibold">{m.l}</p>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#13193a]">{m.v}</p>
                  <p className={`text-[10px] font-semibold ${m.ok ? "text-emerald-600" : "text-amber-600"}`}>{m.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Comparativa ── */}
      {tab === "Comparativa" && (
        <div className="space-y-4">
          {/* Resumen global */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { l:"Este mes",    v:totalActual,   cls:"text-[#13193a]"   },
              { l:"Mes anterior",v:totalAnterior, cls:"text-gray-500"    },
              { l:"Variación",   v:`${diffPct > 0 ? "+" : ""}${diffPct}%`, cls: diffPct >= 0 ? "text-emerald-600" : "text-red-500" },
            ].map((m) => (
              <div key={m.l} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                <p className={`text-3xl font-bold tabular-nums ${m.cls}`}>{m.v}</p>
                <p className="text-xs text-gray-400 font-semibold mt-1">{m.l}</p>
              </div>
            ))}
          </div>

          {/* Por oficina */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-sm font-bold text-[#13193a]">Por oficina · {MESES[mesIdx]} vs {MESES[mesIdx - 1] ?? "Mes anterior"}</p>
            </div>
            <div className="divide-y divide-gray-50">
              {COMPARATIVA.map((o, i) => {
                const diff    = o.actual - o.anterior;
                const pctMeta = Math.round((o.actual / o.meta) * 100);
                return (
                  <div key={i} className="px-5 py-4 grid grid-cols-5 gap-4 items-center">
                    <p className="text-sm font-bold text-[#13193a] col-span-1">{o.oficina}</p>
                    <div className="col-span-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${pctMeta >= 100 ? "bg-emerald-400" : pctMeta >= 70 ? "bg-blue-400" : "bg-amber-400"}`}
                            style={{ width: `${Math.min(pctMeta, 100)}%` }} />
                        </div>
                        <span className="text-xs font-bold text-gray-500 w-10 text-right">{pctMeta}%</span>
                      </div>
                      <p className="text-[11px] text-gray-400">{o.actual} / {o.meta} pólizas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Anterior</p>
                      <p className="text-sm font-bold text-gray-600">{o.anterior}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Cambio</p>
                      <p className={`text-sm font-bold ${diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-500" : "text-gray-400"}`}>
                        {diff > 0 ? "+" : ""}{diff}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Coberturas ── */}
      {tab === "Coberturas" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm font-bold text-[#13193a] mb-4">Pólizas por cobertura · {MESES[mesIdx]}</p>
            <BarChart data={COBERTURAS.map((c) => ({ ...c, value: c.value }))} height={140} />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
            <p className="text-sm font-bold text-[#13193a] mb-2">Distribución</p>
            {COBERTURAS.map((c) => (
              <div key={c.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="font-semibold text-gray-700">{c.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#13193a]">{c.value}</span>
                    <span className="text-gray-400">({c.pct}%)</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${c.pct}%`, backgroundColor: c.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tendencia ── */}
      {tab === "Tendencia" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div>
            <p className="text-sm font-bold text-[#13193a]">Tendencia de producción · 6 meses</p>
            <p className="text-xs text-gray-400 mt-0.5">Pasa el cursor sobre las barras para ver el detalle</p>
          </div>
          <BarChart data={TENDENCIA_6M} height={160} color="#13193a" />
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
            {[
              { l:"Promedio mensual", v:Math.round(TENDENCIA_6M.reduce((s,d)=>s+d.value,0)/TENDENCIA_6M.length) + " pólizas" },
              { l:"Mejor mes",        v:PROD_MENSUAL.reduce((b,d)=>d.value>b.value?d:b).label + " · " + Math.max(...PROD_MENSUAL.map(d=>d.value)) },
              { l:"Peor mes",         v:PROD_MENSUAL.reduce((b,d)=>d.value<b.value?d:b).label + " · " + Math.min(...PROD_MENSUAL.map(d=>d.value)) },
            ].map((m) => (
              <div key={m.l} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 font-semibold">{m.l}</p>
                <p className="text-sm font-bold text-[#13193a] mt-1">{m.v}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
