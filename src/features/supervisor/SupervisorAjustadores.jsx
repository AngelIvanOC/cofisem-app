// ============================================================
// src/features/supervisor/SupervisorAjustadores.jsx
// Supervisor: Carga de trabajo y rendimiento de ajustadores
// ============================================================
import { useState, useEffect } from "react";
import {
  fetchAjustadores,
  fetchCargaAjustadores,
  fetchSiniestros,
  fetchCalificacionesAjustadores,
  promedioHorasArribo,
  fmtHoras,
} from "../../services/siniestros";

const MAX_ACTIVOS = 4;

// La encuesta solo guarda Excelente/Bien/Deficiente (no hay estrella 1-5
// en la BD) — se muestra como % de calificaciones "Excelente" en vez de
// inventar un promedio numérico que no existe.
function Calificacion({ calif }) {
  if (!calif || calif.total === 0) {
    return <span className="text-[11px] text-gray-300">Sin calificar</span>;
  }
  const pct = Math.round((calif.excelente / calif.total) * 100);
  return (
    <div className="text-right">
      <p className="text-sm font-bold text-emerald-600 tabular-nums">{pct}%</p>
      <p className="text-[10px] text-gray-400">excelente ({calif.total})</p>
    </div>
  );
}

function BarraCarga({ activos, max }) {
  return (
    <div className="flex gap-0.5 items-center">
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} className={`h-2.5 flex-1 rounded-full transition-colors ${
          i < activos
            ? activos === max ? "bg-red-500" : activos >= max - 1 ? "bg-amber-500" : "bg-blue-500"
            : "bg-gray-100"
        }`}/>
      ))}
    </div>
  );
}

const STATUS_CLS = {
  "Pendiente de arribo": "bg-amber-50  text-amber-700  border-amber-200",
  "En proceso":          "bg-blue-50   text-blue-700   border-blue-200",
  "Asignado":            "bg-gray-100  text-gray-600   border-gray-200",
};

export default function SupervisorAjustadores() {
  const [ajustadores, setAjustadores] = useState([]);
  const [carga, setCarga]             = useState({});
  const [siniestros, setSiniestros]   = useState([]);
  const [calificaciones, setCalificaciones] = useState({});
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [seleccionado, setSeleccionado] = useState(null);

  useEffect(() => {
    Promise.all([
      fetchAjustadores(),
      fetchCargaAjustadores(),
      fetchSiniestros(),
      fetchCalificacionesAjustadores(),
    ])
      .then(([ajs, carg, sin, calif]) => {
        setAjustadores(ajs);
        setCarga(carg);
        setSiniestros(sin);
        setCalificaciones(calif);
      })
      .catch((e) => setError(e.message ?? "Error al cargar ajustadores"))
      .finally(() => setLoading(false));
  }, []);

  const lista = ajustadores.map((aj) => {
    const propios = siniestros.filter((s) => s.ajustadorId === aj.id);
    return {
      ...aj,
      // No hay columna de zona en la BD todavía.
      zona: "-",
      tiempoPromedio: fmtHoras(promedioHorasArribo(propios)),
      activos: carga[aj.id] ?? 0,
      completados: propios.filter((s) => s.estatus === "Cerrado").length,
      siniestrosActivos: propios
        .filter((s) => s.estatus !== "Cerrado")
        .sort((a, b) => new Date(b.reportadoFecha ?? 0) - new Date(a.reportadoFecha ?? 0)),
      historial: propios
        .filter((s) => s.estatus === "Cerrado")
        .sort((a, b) => new Date(b.reportadoFecha ?? 0) - new Date(a.reportadoFecha ?? 0))
        .slice(0, 5),
      calif: calificaciones[aj.id] ?? { excelente: 0, bien: 0, deficiente: 0, total: 0 },
    };
  });

  const totalActivos     = lista.reduce((s, a) => s + a.activos, 0);
  const totalDisponibles = lista.filter((a) => a.activos < MAX_ACTIVOS).length;
  const llenos           = lista.filter((a) => a.activos >= MAX_ACTIVOS).length;
  const califTotal = lista.reduce((acc, a) => ({ excelente: acc.excelente + a.calif.excelente, total: acc.total + a.calif.total }), { excelente: 0, total: 0 });
  const promCalif  = califTotal.total ? `${Math.round((califTotal.excelente / califTotal.total) * 100)}%` : "-";

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
          <p className="text-sm font-semibold text-red-600">No se pudieron cargar los ajustadores</p>
          <p className="text-xs text-gray-400 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#13193a]">Ajustadores</h1>
        <p className="text-gray-400 text-sm mt-0.5">Carga de trabajo y rendimiento del equipo</p>
      </div>

      {/* Métricas globales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { l:"Siniestros activos",  v:totalActivos,     a:"blue"    },
          { l:"Con capacidad",       v:totalDisponibles, a:"emerald" },
          { l:"Sin capacidad",       v:llenos,           a:"red"     },
          { l:"Calificación prom.",  v:promCalif,        a:"amber"   },
        ].map(m => {
          const c = { blue:"bg-blue-50 border-blue-200 text-blue-700", emerald:"bg-emerald-50 border-emerald-200 text-emerald-700", red:"bg-red-50 border-red-200 text-red-600", amber:"bg-amber-50 border-amber-200 text-amber-700" };
          return (
            <div key={m.l} className={`${c[m.a]} border rounded-2xl p-4`}>
              <p className="text-2xl font-bold tabular-nums">{m.v}</p>
              <p className="text-xs font-semibold mt-0.5 opacity-80">{m.l}</p>
            </div>
          );
        })}
      </div>

      {lista.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-sm font-semibold text-gray-400">No hay ajustadores activos registrados.</p>
        </div>
      ) : (
      <div className={`grid grid-cols-1 ${seleccionado ? "lg:grid-cols-2" : ""} gap-5`}>

        {/* Lista de ajustadores */}
        <div className="space-y-3">
          {lista.map(aj => {
            const lleno = aj.activos >= MAX_ACTIVOS;
            const isSelected = seleccionado?.id === aj.id;
            return (
              <button key={aj.id} onClick={() => setSeleccionado(isSelected ? null : aj)}
                className={[
                  "w-full bg-white border rounded-2xl p-5 text-left hover:shadow-md transition-all duration-150",
                  isSelected ? "border-[#13193a] ring-2 ring-[#13193a]/10 shadow-md" : "border-gray-100 shadow-sm hover:border-gray-200",
                ].join(" ")}>
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold text-white shrink-0 ${
                    lleno ? "bg-red-500" : aj.activos === 0 ? "bg-gray-400" : "bg-[#13193a]"
                  }`}>
                    {aj.nombre.split(" ").map(w=>w[0]).join("").slice(0,2)}
                  </div>

                  {/* Info principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-[#13193a]">{aj.nombre}</p>
                      {lleno && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">Sin capacidad</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{aj.zona} · {aj.telefono ?? "-"}</p>

                    {/* Barra de carga */}
                    <div className="mt-3 space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-500">Carga</span>
                        <span className={`font-bold ${lleno ? "text-red-600" : aj.activos === 0 ? "text-gray-400" : "text-blue-600"}`}>
                          {aj.activos}/{MAX_ACTIVOS} siniestros
                        </span>
                      </div>
                      <BarraCarga activos={aj.activos} max={MAX_ACTIVOS}/>
                    </div>
                  </div>

                  {/* Stats derecha */}
                  <div className="shrink-0 space-y-1">
                    <Calificacion calif={aj.calif}/>
                    <p className="text-[11px] text-gray-400 text-right">{aj.tiempoPromedio} prom.</p>
                    <p className="text-[11px] text-gray-400 text-right">{aj.completados} cerrados</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detalle del ajustador seleccionado */}
        {seleccionado && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style={{ maxHeight:"75vh" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div>
                <p className="text-sm font-bold text-[#13193a]">{seleccionado.nombre}</p>
                {seleccionado.telefono && <p className="text-xs text-gray-400 mt-0.5">{seleccionado.telefono}</p>}
              </div>
              <button onClick={() => setSeleccionado(null)} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Estadísticas */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { l:"Activos",     v:seleccionado.activos,        color:"text-blue-700"    },
                  { l:"Cerrados",    v:seleccionado.completados,    color:"text-emerald-700" },
                  { l:"Tiempo prom.",v:seleccionado.tiempoPromedio, color:"text-[#13193a]"   },
                ].map(s => (
                  <div key={s.l} className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                    <p className={`text-xl font-bold ${s.color}`}>{s.v}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{s.l}</p>
                  </div>
                ))}
              </div>

              {/* Siniestros activos */}
              {seleccionado.siniestrosActivos.length > 0 ? (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Siniestros activos</p>
                  <div className="space-y-2">
                    {seleccionado.siniestrosActivos.map((s) => (
                      <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-xs font-bold text-[#13193a]">{s.folio}</p>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_CLS[s.estatus] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>{s.estatus}</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">{s.asegurado} · {s.tipo}</p>
                        </div>
                        <p className="text-xs text-gray-400 shrink-0">{s.fecha}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-gray-400">
                  <svg className="w-8 h-8 text-gray-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Sin siniestros activos — disponible
                </div>
              )}

              {/* Historial reciente */}
              {seleccionado.historial.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Historial reciente</p>
                  <div className="space-y-2">
                    {seleccionado.historial.map((h) => (
                      <div key={h.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-xs font-bold text-[#13193a]">{h.folio}</p>
                            <p className="text-xs text-gray-500">{h.tipo}</p>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">{h.fecha}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
