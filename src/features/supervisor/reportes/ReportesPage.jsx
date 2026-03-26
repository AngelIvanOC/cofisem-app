// ============================================================
// src/features/supervisor/reportes/ReportesPage.jsx
// Supervisor: Reportes — por tipo, ajustador, tiempos, jurídicos
// ============================================================
import { useState } from "react";
import { FiltroSelect } from "../../../shared/ui/Buscador";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

// ── Mini BarChart SVG reutilizable ─────────────────────────
function BarChart({ data, height = 120 }) {
  const max  = Math.max(...data.map((d) => d.value), 1);
  const W    = 36;
  const GAP  = 8;
  const svgW = data.length * (W + GAP) - GAP;

  return (
    <svg viewBox={`0 0 ${svgW} ${height + 28}`} width="100%" height="auto">
      {data.map((d, i) => {
        const bH  = Math.max((d.value / max) * height, 2);
        const x   = i * (W + GAP);
        const y   = height - bH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={W} height={bH} rx="6" fill={d.color ?? "#13193a"} opacity="0.85" />
            <text x={x + W / 2} y={y - 5} textAnchor="middle" fontSize="10" fill="#6B7280" fontWeight="600">
              {d.value}
            </text>
            <text x={x + W / 2} y={height + 16} textAnchor="middle" fontSize="9" fill="#9CA3AF">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Data ───────────────────────────────────────────────────
const DATOS_TIPO = [
  { label:"Colisión",    value:18, color:"#3B82F6" },
  { label:"Robo T.",     value:7,  color:"#EF4444" },
  { label:"Robo P.",     value:11, color:"#F59E0B" },
  { label:"Daños 3°",   value:9,  color:"#8B5CF6" },
  { label:"Volcadura",   value:3,  color:"#10B981" },
  { label:"Cristales",   value:5,  color:"#06B6D4" },
  { label:"Otros",       value:4,  color:"#6B7280" },
];

const DATOS_AJUST = [
  { label:"R. Vega",     value:12, color:"#13193a" },
  { label:"S. Moreno",   value:8,  color:"#13193a" },
  { label:"F. Castillo", value:9,  color:"#EF4444" },
  { label:"D. Ríos",     value:18, color:"#10B981" },
];

const TIEMPOS = [
  { ajustador:"Diana Ríos",      promHoras:1.9, min:0.8, max:3.5, cerrados:18 },
  { ajustador:"Roberto Vega",    promHoras:2.1, min:1.0, max:4.2, cerrados:12 },
  { ajustador:"Sandra Moreno",   promHoras:2.8, min:1.5, max:5.0, cerrados:8  },
  { ajustador:"Felipe Castillo", promHoras:3.2, min:1.2, max:7.1, cerrados:9  },
];

const JURIDICOS = [
  { folio:"SIN-071", asegurado:"Beatriz Morales",  tipo:"Colisión",  canalizado:"05/03/2026", destino:"Abogado externo",  abogado:"Lic. Jorge Medina",   estatus:"En seguimiento" },
  { folio:"SIN-068", asegurado:"Ricardo Cruz",     tipo:"Robo total",canalizado:"01/03/2026", destino:"Jurídico interno", abogado:"—",                   estatus:"En seguimiento" },
  { folio:"SIN-055", asegurado:"Patricia Flores",  tipo:"Colisión",  canalizado:"15/02/2026", destino:"CONDUSEF",         abogado:"—",                   estatus:"Resuelto"       },
];

const TABS = ["Por tipo","Por ajustador","Tiempos","Jurídicos"];

export default function SupervisorReportes() {
  const [tab,    setTab]    = useState("Por tipo");
  const [mesIdx, setMesIdx] = useState(2);

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Reportes</h1>
          <p className="text-gray-400 text-sm mt-0.5">Estadísticas de siniestros y ajustadores</p>
        </div>
        <FiltroSelect
          value={MESES[mesIdx]}
          onChange={(v) => setMesIdx(MESES.indexOf(v))}
          opciones={MESES}
        />
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

      {/* ── Por tipo ── */}
      {tab === "Por tipo" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm font-bold text-[#13193a] mb-4">Siniestros por tipo · {MESES[mesIdx]}</p>
            <BarChart data={DATOS_TIPO} />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm font-bold text-[#13193a] mb-4">Resumen</p>
            <div className="space-y-2.5">
              {DATOS_TIPO.map((d) => (
                <div key={d.label} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <p className="text-sm text-gray-700 flex-1">{d.label}</p>
                  <p className="text-sm font-bold text-[#13193a] tabular-nums">{d.value}</p>
                  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(d.value / 57) * 100}%`, backgroundColor: d.color }} />
                  </div>
                  <p className="text-[11px] text-gray-400 w-8 text-right">{Math.round((d.value / 57) * 100)}%</p>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-2 flex justify-between text-sm">
                <span className="font-bold text-gray-500">Total</span>
                <span className="font-bold text-[#13193a]">57</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Por ajustador ── */}
      {tab === "Por ajustador" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm font-bold text-[#13193a] mb-4">Casos cerrados · {MESES[mesIdx]}</p>
            <BarChart data={DATOS_AJUST} height={140} />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm font-bold text-[#13193a] mb-4">Detalle por ajustador</p>
            <div className="space-y-3">
              {DATOS_AJUST.map((d, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-[#13193a] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                    {d.label.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </div>
                  <p className="text-sm font-semibold text-[#13193a] flex-1">{d.label}</p>
                  <p className="text-xl font-bold text-[#13193a] tabular-nums">{d.value}</p>
                  <p className="text-xs text-gray-400 font-semibold">cerrados</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tiempos ── */}
      {tab === "Tiempos" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-bold text-[#13193a]">Tiempos de atención · {MESES[mesIdx]}</p>
            <p className="text-xs text-gray-400 mt-0.5">Desde arribo hasta resolución</p>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  {["Ajustador","Tiempo prom.","Mínimo","Máximo","Casos cerrados","Indicador"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {TIEMPOS.map((t, i) => {
                  const alerta = t.promHoras > 3;
                  return (
                    <tr key={i} className="hover:bg-gray-50/60">
                      <td className="px-5 py-4 text-sm font-semibold text-[#13193a]">{t.ajustador}</td>
                      <td className={`px-5 py-4 text-sm font-bold tabular-nums ${alerta ? "text-amber-600" : "text-emerald-600"}`}>{t.promHoras}h</td>
                      <td className="px-5 py-4 text-sm text-gray-500 tabular-nums">{t.min}h</td>
                      <td className={`px-5 py-4 text-sm text-gray-500 tabular-nums ${t.max > 6 ? "text-red-500 font-semibold" : ""}`}>{t.max}h</td>
                      <td className="px-5 py-4 text-sm font-bold text-[#13193a] tabular-nums">{t.cerrados}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${alerta ? "bg-amber-400" : "bg-emerald-400"}`}
                              style={{ width: `${Math.min((t.promHoras / 4) * 100, 100)}%` }} />
                          </div>
                          {alerta && <span className="text-[10px] font-bold text-amber-600">Lento</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Jurídicos ── */}
      {tab === "Jurídicos" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-bold text-[#13193a]">Casos canalizados a jurídico</p>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  {["Folio","Asegurado","Tipo","Canalizado","Destino","Abogado / Instancia","Estatus"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {JURIDICOS.map((j, i) => (
                  <tr key={i} className="hover:bg-gray-50/60">
                    <td className="px-5 py-4 font-mono text-xs font-bold text-[#13193a]">{j.folio}</td>
                    <td className="px-5 py-4 text-xs font-semibold text-gray-700 whitespace-nowrap">{j.asegurado}</td>
                    <td className="px-5 py-4 text-xs text-gray-600">{j.tipo}</td>
                    <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">{j.canalizado}</td>
                    <td className="px-5 py-4 text-xs text-gray-600">{j.destino}</td>
                    <td className="px-5 py-4 text-xs text-gray-500">{j.abogado}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${j.estatus === "Resuelto" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-purple-50 text-purple-700 border-purple-200"}`}>
                        {j.estatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
