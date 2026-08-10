// ============================================================
// src/features/supervisor/SupervisorReportes.jsx
// Supervisor: Reportes de siniestros
// Vistas: Por tipo · Por ajustador
// ============================================================
import { useState, useEffect } from "react";
import {
  fetchSiniestros,
  fetchAjustadores,
  fetchCargaAjustadores,
  fetchCalificacionesAjustadores,
  promedioHorasArribo,
  fmtHoras,
} from "../../services/siniestros";

function MiniBar({ data, valueKey, labelKey, color="#13193a", height=72 }) {
  const max = Math.max(1, ...data.map(d => d[valueKey]));
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
                {d[valueKey]}
              </div>
            </div>
            <p className="text-[10px] text-gray-400 font-medium truncate max-w-full">{d[labelKey]}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function SupervisorReportes() {
  const [tab, setTab] = useState("tipo");
  const [siniestros, setSiniestros]   = useState([]);
  const [ajustadores, setAjustadores] = useState([]);
  const [carga, setCarga]             = useState({});
  const [calificaciones, setCalificaciones] = useState({});
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  useEffect(() => {
    Promise.all([
      fetchSiniestros(),
      fetchAjustadores(),
      fetchCargaAjustadores(),
      fetchCalificacionesAjustadores(),
    ])
      .then(([sin, ajs, carg, calif]) => {
        setSiniestros(sin);
        setAjustadores(ajs);
        setCarga(carg);
        setCalificaciones(calif);
      })
      .catch((e) => setError(e.message ?? "Error al cargar reportes"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-[#13193a]/20 border-t-[#13193a] rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-2xl border border-red-100 p-6 text-center max-w-sm mx-auto">
          <p className="text-sm font-semibold text-red-600">No se pudieron cargar los reportes</p>
          <p className="text-xs text-gray-400 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const totalSiniestros = siniestros.length;
  const cerrados        = siniestros.filter(s => s.estatus === "Cerrado").length;
  const sinAsignar      = siniestros.filter(s => !s.ajustadorId).length;
  const pctCerrados     = totalSiniestros ? Math.round((cerrados / totalSiniestros) * 100) : 0;

  const gruposPorTipo = siniestros.reduce((acc, s) => {
    const k = s.tipo || "Sin clasificar";
    acc[k] ??= [];
    acc[k].push(s);
    return acc;
  }, {});
  const porTipo = Object.entries(gruposPorTipo)
    .map(([tipo, grupo]) => ({
      tipo,
      total: grupo.length,
      completados: grupo.filter((s) => s.estatus === "Cerrado").length,
      tiempoProm: promedioHorasArribo(grupo),
    }))
    .sort((a, b) => b.total - a.total);

  const porAjustador = ajustadores.map(aj => {
    const propios = siniestros.filter(s => s.ajustadorId === aj.id);
    const calif = calificaciones[aj.id] ?? { excelente: 0, bien: 0, deficiente: 0, total: 0 };
    return {
      nombre: aj.nombre,
      activos: carga[aj.id] ?? 0,
      completados: propios.filter(s => s.estatus === "Cerrado").length,
      pctExcelente: calif.total ? Math.round((calif.excelente / calif.total) * 100) : null,
      calificados: calif.total,
    };
  }).sort((a, b) => b.completados - a.completados);
  const maxComp = Math.max(1, ...porAjustador.map(a => a.completados));

  // Siniestros por día de la semana — dato real (reportadoFecha).
  // El tiempo promedio de resolución por día NO se puede calcular todavía:
  // no hay una fecha de cierre guardada (hora_termino_ajuste solo guarda
  // la hora, sin fecha), así que ese panel se muestra como "-".
  const DIAS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
  const porDiaSemana = DIAS.map((dia, i) => {
    const jsDay = (i + 1) % 7; // Date#getDay(): 0=Dom..6=Sáb
    const delDia = siniestros.filter(s => s.reportadoFecha && new Date(s.reportadoFecha).getDay() === jsDay);
    return { dia, n: delDia.length, prom: promedioHorasArribo(delDia) };
  });

  // Jurídicos: la canalización a jurídico todavía no existe en BD —
  // esta lista siempre sale vacía hasta que se agregue ese campo.
  const juridicos = siniestros.filter(s => s.juridico);

  const TABS = [
    { k:"tipo",       l:"Por tipo de siniestro" },
    { k:"ajustador",  l:"Por ajustador"         },
    { k:"tiempos",    l:"Tiempos de respuesta"  },
    { k:"juridicos",  l:"Jurídicos"             },
  ];

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#13193a]">Reportes</h1>
        <p className="text-gray-400 text-sm mt-0.5">Análisis de siniestros y resolución</p>
      </div>

      {/* KPIs globales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { l:"Total siniestros",   v:totalSiniestros, a:"blue"    },
          { l:"Cerrados",           v:cerrados,         a:"emerald" },
          { l:"Sin asignar",        v:sinAsignar,       a:"red"     },
          { l:"% resuelto",         v:`${pctCerrados}%`,a:"amber"   },
        ].map(m => {
          const c = { blue:"bg-blue-50 border-blue-200 text-blue-700", emerald:"bg-emerald-50 border-emerald-200 text-emerald-700", amber:"bg-amber-50 border-amber-200 text-amber-700", red:"bg-red-50 border-red-200 text-red-600" };
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
            </button>
          ))}
        </div>

        {/* TAB: Por tipo */}
        {tab === "tipo" && (
          porTipo.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">Sin siniestros registrados aún.</div>
          ) : (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Gráfica */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-4">Siniestros por tipo</p>
                <MiniBar data={porTipo} valueKey="total" labelKey="tipo" height={80}/>
              </div>
              {/* Tabla */}
              <div className="overflow-x-auto rounded-2xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#13193a]">
                      {["Tipo","Total","Cerrados","% resuelto"].map(h => (
                        <th key={h} className="text-left text-[11px] font-semibold text-white px-4 py-2.5 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {porTipo.map((d) => (
                      <tr key={d.tipo} className="hover:bg-gray-50/60">
                        <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{d.tipo}</td>
                        <td className="px-4 py-2.5 text-xs font-bold text-[#13193a]">{d.total}</td>
                        <td className="px-4 py-2.5 text-xs text-emerald-700 font-semibold">{d.completados}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-600">{Math.round((d.completados/d.total)*100)}%</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50/60 border-t-2 border-gray-200">
                      <td className="px-4 py-2.5 text-xs font-bold text-[#13193a]">TOTAL</td>
                      <td className="px-4 py-2.5 text-xs font-bold text-[#13193a]">{totalSiniestros}</td>
                      <td className="px-4 py-2.5 text-xs font-bold text-emerald-700">{cerrados}</td>
                      <td className="px-4 py-2.5 text-xs font-bold text-gray-700">{pctCerrados}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          )
        )}

        {/* TAB: Por ajustador */}
        {tab === "ajustador" && (
          porAjustador.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">No hay ajustadores activos registrados.</div>
          ) : (
          <div className="p-5">
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#13193a]">
                    {["Ajustador","Activos","Casos cerrados","% excelente","Rendimiento"].map(h => (
                      <th key={h} className="text-left text-[11px] font-semibold text-white px-5 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {porAjustador.map((d) => (
                    <tr key={d.nombre} className="hover:bg-gray-50/60">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#13193a] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                            {d.nombre.split(" ").map(w=>w[0]).join("").slice(0,2)}
                          </div>
                          <p className="text-xs font-semibold text-gray-700">{d.nombre}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-600">{d.activos}</td>
                      <td className="px-5 py-3.5 text-xs font-bold text-[#13193a]">{d.completados}</td>
                      <td className="px-5 py-3.5 text-xs">
                        {d.pctExcelente == null
                          ? <span className="text-gray-300">Sin calificar</span>
                          : <span className="font-semibold text-emerald-600">{d.pctExcelente}% ({d.calificados})</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className="h-1.5 bg-[#13193a] rounded-full" style={{ width:`${(d.completados/maxComp)*100}%` }}/>
                          </div>
                          <span className="text-[11px] text-gray-400">{Math.round((d.completados/maxComp)*100)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )
        )}

        {/* TAB: Tiempos */}
        {tab === "tiempos" && (
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-4">Siniestros reportados por día (últimos registrados)</p>
                <MiniBar data={porDiaSemana} valueKey="n" labelKey="dia" color="#3b82f6" height={100}/>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-4">Tiempo prom. hasta arribo confirmado, por día</p>
                {porDiaSemana.some((d) => d.prom != null) ? (
                  <MiniBar data={porDiaSemana.map(d => ({ ...d, promH: d.prom != null ? Math.round(d.prom * 10) / 10 : 0 }))} valueKey="promH" labelKey="dia" color="#13193a" height={100}/>
                ) : (
                  <div className="h-[124px] flex items-center justify-center border border-dashed border-gray-200 rounded-xl">
                    <p className="text-xs text-gray-300">Dato no disponible</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tabla de tiempos por tipo */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-3">Tiempo promedio por tipo de siniestro</p>
              {porTipo.length === 0 ? (
                <p className="text-xs text-gray-400">Sin siniestros registrados aún.</p>
              ) : (
                <div className="space-y-2">
                  {(() => {
                    const maxT = Math.max(1, ...porTipo.map(d => d.tiempoProm ?? 0));
                    return [...porTipo].sort((a, b) => (b.tiempoProm ?? -1) - (a.tiempoProm ?? -1)).map((d) => {
                      const pct = d.tiempoProm != null ? (d.tiempoProm / maxT) * 100 : 0;
                      return (
                        <div key={d.tipo} className="flex items-center gap-3">
                          <p className="text-xs text-gray-500 w-32 shrink-0">{d.tipo}</p>
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div className="h-2 rounded-full transition-all duration-500" style={{
                              width: `${pct}%`,
                              background: d.tiempoProm == null ? "transparent" : d.tiempoProm > 4 ? "#ef4444" : d.tiempoProm > 3 ? "#f59e0b" : "#13193a",
                            }}/>
                          </div>
                          <p className="text-xs font-bold text-gray-700 w-10 text-right">{fmtHoras(d.tiempoProm)}</p>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: Jurídicos */}
        {tab === "juridicos" && (
          <div className="p-5 space-y-4">
            <AvisoJuridicos count={juridicos.length} />
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
                  {juridicos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-xs text-gray-400">
                        Sin datos — la canalización a jurídico todavía no está conectada a la base de datos.
                      </td>
                    </tr>
                  ) : juridicos.map((j) => (
                    <tr key={j.id} className="hover:bg-gray-50/60">
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-[#13193a]">{j.folio}</td>
                      <td className="px-5 py-3.5 text-xs font-semibold text-gray-700">{j.asegurado}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-600">{j.tipo}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-400">-</td>
                      <td className="px-5 py-3.5 text-xs text-gray-400">-</td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">{j.fecha}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-400">-</td>
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

function AvisoJuridicos({ count }) {
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-xs text-purple-800 font-medium">
      {count} casos jurídicos detectados — la canalización a jurídico está en desarrollo, este número siempre será 0 hasta que se conecte a la base de datos.
    </div>
  );
}
