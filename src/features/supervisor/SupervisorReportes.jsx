// ============================================================
// src/pages/supervisor/SupervisorReportes.jsx
// Supervisor: Reportes de siniestros
// Vistas: Por tipo · Por ajustador · Tiempos · Jurídicos
// ============================================================
import { useState } from "react";

const PERIODOS = ["Hoy", "Esta semana", "Este mes", "Mes anterior", "Este año"];

// ── Datos mock ────────────────────────────────────────────────
const POR_TIPO = [
  { tipo:"Colisión",          total:28, completados:24, juridicos:1, tiempoProm:"2.6h" },
  { tipo:"Daño a terceros",   total:12, completados:10, juridicos:2, tiempoProm:"3.1h" },
  { tipo:"Robo total",        total: 6, completados: 4, juridicos:3, tiempoProm:"5.2h" },
  { tipo:"Robo parcial",      total: 8, completados: 7, juridicos:0, tiempoProm:"2.2h" },
  { tipo:"Cristales",         total:10, completados:10, juridicos:0, tiempoProm:"1.1h" },
  { tipo:"Volcadura",         total: 4, completados: 3, juridicos:1, tiempoProm:"3.8h" },
  { tipo:"Incendio",          total: 2, completados: 1, juridicos:1, tiempoProm:"4.5h" },
  { tipo:"Fenómeno natural",  total: 1, completados: 1, juridicos:0, tiempoProm:"2.0h" },
];

const POR_AJUSTADOR = [
  { nombre:"Félix Hernández", total:18, completados:18, tiempoProm:"2.8h", calificacion:4.7, juridicos:1 },
  { nombre:"Luis Martínez",   total:22, completados:22, tiempoProm:"3.1h", calificacion:4.5, juridicos:2 },
  { nombre:"Ana García",      total:15, completados:15, tiempoProm:"2.4h", calificacion:4.9, juridicos:1 },
  { nombre:"Roberto Vega",    total: 9, completados: 9, tiempoProm:"3.8h", calificacion:4.1, juridicos:0 },
  { nombre:"Sofía Torres",    total:31, completados:31, tiempoProm:"2.2h", calificacion:4.8, juridicos:0 },
];

const JURIDICOS = [
  { folio:"SN-10227", asegurado:"Roberto Díaz",  tipo:"Robo total",       tipoJuridico:"Abogado externo",   abogado:"Lic. Jorge Méndez", inicio:"17/03/2026", diasAbierto:0 },
  { folio:"SN-10208", asegurado:"Luis Torres",   tipo:"Colisión",         tipoJuridico:"Asistencia jurídica",abogado:null,                inicio:"16/03/2026", diasAbierto:1 },
  { folio:"SN-10178", asegurado:"Carmen Rojas",  tipo:"Daño a terceros",  tipoJuridico:"Demanda formal",    abogado:"Lic. Sara Fuentes",  inicio:"10/03/2026", diasAbierto:7 },
  { folio:"SN-10145", asegurado:"Jorge Vela",    tipo:"Robo total",       tipoJuridico:"Abogado externo",   abogado:"Lic. Jorge Méndez",  inicio:"02/03/2026", diasAbierto:15},
];

const TIEMPOS_SEMANA = [
  { dia:"Lun", promedio:2.1, siniestros:8  },
  { dia:"Mar", promedio:3.5, siniestros:6  },
  { dia:"Mié", promedio:2.8, siniestros:10 },
  { dia:"Jue", promedio:2.3, siniestros:7  },
  { dia:"Vie", promedio:4.1, siniestros:5  },
  { dia:"Sáb", promedio:1.9, siniestros:3  },
  { dia:"Dom", promedio:2.6, siniestros:2  },
];

function MiniBar({ data, valueKey, labelKey, color="#13193a", height=72 }) {
  const max = Math.max(...data.map(d => d[valueKey]));
  return (
    <div className="flex items-end gap-2" style={{ height: height + 24 }}>
      {data.map((d, i) => {
        const pct = max > 0 ? (d[valueKey] / max) * 100 : 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="relative w-full flex items-end" style={{ height }}>
              <div className="w-full rounded-t-lg transition-all duration-700"
                style={{ height:`${Math.max(pct, 4)}%`, background:color, opacity:0.85 }}/>
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#13193a] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {typeof d[valueKey] === "number" && valueKey === "promedio" ? `${d[valueKey]}h` : d[valueKey]}
              </div>
            </div>
            <p className="text-[10px] text-gray-400 font-medium">{d[labelKey]}</p>
          </div>
        );
      })}
    </div>
  );
}

function Estrellas({ n }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-3 h-3 ${i <= Math.round(n) ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
      <span className="text-[11px] text-gray-500 ml-1">{n}</span>
    </div>
  );
}

export default function SupervisorReportes() {
  const [tab, setTab]           = useState("tipo");
  const [periodo, setPeriodo]   = useState("Este mes");

  const totalSiniestros = POR_TIPO.reduce((s, d) => s + d.total, 0);
  const totalJuridicos  = POR_TIPO.reduce((s, d) => s + d.juridicos, 0);
  const promGlobal      = (POR_TIPO.reduce((s, d) => s + parseFloat(d.tiempoProm) * d.total, 0) / totalSiniestros).toFixed(1);

  const TABS = [
    { k:"tipo",       l:"Por tipo de siniestro" },
    { k:"ajustador",  l:"Por ajustador"         },
    { k:"tiempos",    l:"Tiempos de respuesta"  },
    { k:"juridicos",  l:"Jurídicos",  badge: totalJuridicos },
  ];

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Reportes</h1>
          <p className="text-gray-400 text-sm mt-0.5">Análisis de siniestros, tiempos y resolución</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={periodo} onChange={e => setPeriodo(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15">
            {PERIODOS.map(p => <option key={p}>{p}</option>)}
          </select>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
            Exportar
          </button>
        </div>
      </div>

      {/* KPIs globales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { l:"Total siniestros",   v:totalSiniestros, a:"blue"    },
          { l:"Completados",        v:POR_TIPO.reduce((s,d)=>s+d.completados,0), a:"emerald" },
          { l:"Tiempo prom. global",v:`${promGlobal}h`, a:"amber"  },
          { l:"Casos jurídicos",    v:totalJuridicos,   a:"purple" },
        ].map(m => {
          const c = { blue:"bg-blue-50 border-blue-200 text-blue-700", emerald:"bg-emerald-50 border-emerald-200 text-emerald-700", amber:"bg-amber-50 border-amber-200 text-amber-700", purple:"bg-purple-50 border-purple-200 text-purple-700" };
          return (
            <div key={m.l} className={`${c[m.a]} border rounded-2xl p-4`}>
              <p className="text-2xl font-bold tabular-nums">{m.v}</p>
              <p className="text-xs font-semibold mt-0.5 opacity-80">{m.l}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-2 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                tab === t.k ? "border-[#13193a] text-[#13193a]" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}>
              {t.l}
              {t.badge > 0 && <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* TAB: Por tipo */}
        {tab === "tipo" && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Gráfica */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-4">Siniestros por tipo — {periodo}</p>
                <MiniBar data={POR_TIPO} valueKey="total" labelKey="tipo" height={80}/>
              </div>
              {/* Tabla */}
              <div className="overflow-x-auto rounded-2xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#13193a]">
                      {["Tipo","Total","Cerrados","Jurídicos","Tiempo prom."].map(h => (
                        <th key={h} className="text-left text-[11px] font-semibold text-white px-4 py-2.5 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {POR_TIPO.map((d, i) => (
                      <tr key={i} className="hover:bg-gray-50/60">
                        <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{d.tipo}</td>
                        <td className="px-4 py-2.5 text-xs font-bold text-[#13193a]">{d.total}</td>
                        <td className="px-4 py-2.5 text-xs text-emerald-700 font-semibold">{d.completados}</td>
                        <td className="px-4 py-2.5 text-xs">{d.juridicos > 0 ? <span className="text-purple-700 font-bold">{d.juridicos}</span> : <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-600">{d.tiempoProm}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50/60 border-t-2 border-gray-200">
                      <td className="px-4 py-2.5 text-xs font-bold text-[#13193a]">TOTAL</td>
                      <td className="px-4 py-2.5 text-xs font-bold text-[#13193a]">{totalSiniestros}</td>
                      <td className="px-4 py-2.5 text-xs font-bold text-emerald-700">{POR_TIPO.reduce((s,d)=>s+d.completados,0)}</td>
                      <td className="px-4 py-2.5 text-xs font-bold text-purple-700">{totalJuridicos}</td>
                      <td className="px-4 py-2.5 text-xs font-bold text-gray-700">{promGlobal}h</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Por ajustador */}
        {tab === "ajustador" && (
          <div className="p-5">
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#13193a]">
                    {["Ajustador","Casos cerrados","Tiempo prom.","Calificación","Jurídicos","Rendimiento"].map(h => (
                      <th key={h} className="text-left text-[11px] font-semibold text-white px-5 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {POR_AJUSTADOR.sort((a,b)=>b.completados-a.completados).map((d, i) => {
                    const maxComp = Math.max(...POR_AJUSTADOR.map(a=>a.completados));
                    return (
                      <tr key={i} className="hover:bg-gray-50/60">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#13193a] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                              {d.nombre.split(" ").map(w=>w[0]).join("").slice(0,2)}
                            </div>
                            <p className="text-xs font-semibold text-gray-700">{d.nombre}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-bold text-[#13193a]">{d.completados}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-600">{d.tiempoProm}</td>
                        <td className="px-5 py-3.5"><Estrellas n={d.calificacion}/></td>
                        <td className="px-5 py-3.5 text-xs">{d.juridicos > 0 ? <span className="text-purple-700 font-bold">{d.juridicos}</span> : <span className="text-gray-300">—</span>}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div className="h-1.5 bg-[#13193a] rounded-full" style={{ width:`${(d.completados/maxComp)*100}%` }}/>
                            </div>
                            <span className="text-[11px] text-gray-400">{Math.round((d.completados/maxComp)*100)}%</span>
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

        {/* TAB: Tiempos */}
        {tab === "tiempos" && (
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-4">Tiempo promedio de resolución por día (horas)</p>
                <MiniBar data={TIEMPOS_SEMANA} valueKey="promedio" labelKey="dia" color="#13193a" height={100}/>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-4">Siniestros atendidos por día</p>
                <MiniBar data={TIEMPOS_SEMANA} valueKey="siniestros" labelKey="dia" color="#3b82f6" height={100}/>
              </div>
            </div>

            {/* Tabla de tiempos por tipo */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-3">Distribución de tiempos por tipo de siniestro</p>
              <div className="space-y-2">
                {POR_TIPO.sort((a,b) => parseFloat(b.tiempoProm)-parseFloat(a.tiempoProm)).map((d, i) => {
                  const maxT = Math.max(...POR_TIPO.map(x => parseFloat(x.tiempoProm)));
                  const pct = (parseFloat(d.tiempoProm) / maxT) * 100;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <p className="text-xs text-gray-500 w-32 shrink-0">{d.tipo}</p>
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className="h-2 rounded-full transition-all duration-500" style={{
                          width:`${pct}%`,
                          background: parseFloat(d.tiempoProm) > 4 ? "#ef4444" : parseFloat(d.tiempoProm) > 3 ? "#f59e0b" : "#13193a"
                        }}/>
                      </div>
                      <p className="text-xs font-bold text-gray-700 w-10 text-right">{d.tiempoProm}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB: Jurídicos */}
        {tab === "juridicos" && (
          <div className="p-5 space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-xs text-purple-800 font-medium">
              {JURIDICOS.length} casos activos en proceso jurídico — {JURIDICOS.filter(j=>j.diasAbierto>7).length} llevan más de 7 días
            </div>
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#13193a]">
                    {["Folio","Asegurado","Tipo siniestro","Tipo jurídico","Abogado","Inicio","Días abierto"].map(h => (
                      <th key={h} className="text-left text-[11px] font-semibold text-white px-5 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {JURIDICOS.map((j, i) => (
                    <tr key={i} className={`hover:bg-gray-50/60 ${j.diasAbierto > 7 ? "bg-red-50/30" : ""}`}>
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-[#13193a]">{j.folio}</td>
                      <td className="px-5 py-3.5 text-xs font-semibold text-gray-700">{j.asegurado}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-600">{j.tipo}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full border bg-purple-50 text-purple-700 border-purple-200">{j.tipoJuridico}</span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-600">{j.abogado ?? <span className="text-gray-300">—</span>}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">{j.inicio}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-bold ${j.diasAbierto > 7 ? "text-red-600" : j.diasAbierto > 3 ? "text-amber-700" : "text-gray-600"}`}>
                          {j.diasAbierto === 0 ? "Hoy" : `${j.diasAbierto}d`}
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
    </div>
  );
}