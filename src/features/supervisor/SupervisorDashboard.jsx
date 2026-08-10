// ============================================================
// SUPERVISOR SINIESTROS DASHBOARD
// src/features/supervisor/SupervisorDashboard.jsx
// ============================================================
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSiniestros, fetchAjustadores, fetchCargaAjustadores, fetchCalificacionesAjustadores, promedioHorasArribo, fmtHoras } from "../../services/siniestros";
import { tiempoRelativo } from "../../services/evidencias";

const HOY_SUP = new Date().toLocaleDateString("es-MX", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const MAX_ACTIVOS = 4;

function CargaBar({ activos, max }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full ${
            i < activos
              ? activos === max
                ? "bg-red-500"
                : activos >= max - 1
                  ? "bg-amber-500"
                  : "bg-blue-500"
              : "bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

export function SupervisorDashboard({ usuario }) {
  const navigate = useNavigate();
  const h = new Date().getHours();
  const saludo =
    h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";

  const [siniestros, setSiniestros]   = useState([]);
  const [ajustadores, setAjustadores] = useState([]);
  const [carga, setCarga]             = useState({});
  const [calificaciones, setCalificaciones] = useState({});
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  useEffect(() => {
    Promise.all([fetchSiniestros(), fetchAjustadores(), fetchCargaAjustadores(), fetchCalificacionesAjustadores()])
      .then(([sin, ajs, carg, calif]) => {
        setSiniestros(sin);
        setAjustadores(ajs);
        setCarga(carg);
        setCalificaciones(calif);
      })
      .catch((e) => setError(e.message ?? "Error al cargar el panel"))
      .finally(() => setLoading(false));
  }, []);

  const activos     = siniestros.filter((s) => s.estatus !== "Cerrado");
  const sinAsignar  = siniestros.filter((s) => !s.ajustadorId);
  const pendArribo  = siniestros.filter((s) => s.estatus === "Pendiente de arribo");
  const cerrados    = siniestros.filter((s) => s.estatus === "Cerrado");

  // Satisfacción global — la encuesta no tiene estrella 1-5, así que se
  // usa % de calificaciones "Excelente" sobre el total calificado.
  const califGlobal = Object.values(calificaciones).reduce(
    (acc, c) => ({ excelente: acc.excelente + c.excelente, total: acc.total + c.total }),
    { excelente: 0, total: 0 }
  );
  const satisfaccion = califGlobal.total ? `${Math.round((califGlobal.excelente / califGlobal.total) * 100)}%` : "-";

  // Tiempo prom.: desde que el cabinero levantó el reporte hasta que el
  // ajustador confirmó su arribo (foto + GPS) — global y de la última semana.
  const tiempoPromGlobal  = fmtHoras(promedioHorasArribo(siniestros));
  const hace7dias         = useMemo(() => Date.now() - 7 * 24 * 3600 * 1000, []);
  const siniestrosSemana  = siniestros.filter((s) => s.reportadoFecha && new Date(s.reportadoFecha).getTime() >= hace7dias);
  const tiempoPromSemanal = fmtHoras(promedioHorasArribo(siniestrosSemana));

  const alertas = [...sinAsignar]
    .sort((a, b) => new Date(a.reportadoFecha ?? 0) - new Date(b.reportadoFecha ?? 0))
    .slice(0, 5);

  const cargaAjustadores = ajustadores
    .map((aj) => ({
      ...aj,
      activos: carga[aj.id] ?? 0,
      completados: siniestros.filter((s) => s.ajustadorId === aj.id && s.estatus === "Cerrado").length,
    }))
    .sort((a, b) => b.activos - a.activos)
    .slice(0, 6);

  const porTipo = Object.entries(
    siniestros.reduce((acc, s) => {
      const k = s.tipo || "Sin clasificar";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([tipo, n]) => ({ tipo, n }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 6);
  const maxTipo = Math.max(1, ...porTipo.map((t) => t.n));

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#f7f8fa]">
        <div className="w-8 h-8 border-2 border-[#13193a]/20 border-t-[#13193a] rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-[#f7f8fa] p-6">
        <div className="bg-white rounded-2xl border border-red-100 p-6 text-center max-w-sm">
          <p className="text-sm font-semibold text-red-600">No se pudo cargar el panel</p>
          <p className="text-xs text-gray-400 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f7f8fa]">
      <div className="max-w-7xl mx-auto p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-gray-400 capitalize">{HOY_SUP}</p>
            <h1 className="text-2xl font-bold text-[#13193a] mt-0.5">
              {saludo},{" "}
              <span className="font-light">
                {usuario?.nombre ?? "Supervisor"}
              </span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Supervisión de siniestros
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Activos hoy",         value: activos.length,    accent: "#3b82f6", path: "/gaman/siniestros" },
            { label: "Sin asignar",         value: sinAsignar.length, accent: "#ef4444", path: "/gaman/siniestros" },
            { label: "Pend. de arribo",     value: pendArribo.length, accent: "#d97706", path: "/gaman/siniestros" },
            { label: "Asistencia jurídica", value: "-",                accent: "#8b5cf6", path: "/gaman/siniestros" },
            { label: "Cerrados hoy",        value: "-",                accent: "#059669", path: "/gaman/siniestros" },
            { label: "Tiempo prom.",        value: tiempoPromGlobal,   accent: "#13193a", path: "/gaman/reportes-siniestros" },
          ].map((k) => (
            <button
              key={k.label}
              onClick={() => navigate(k.path)}
              className="bg-white rounded-2xl border border-gray-100 p-3.5 text-left hover:shadow-md hover:border-gray-200 transition-all"
            >
              <div
                className="w-6 h-0.5 rounded-full mb-2.5"
                style={{ background: k.accent }}
              />
              <p className="text-2xl font-black text-[#13193a] tabular-nums">
                {k.value}
              </p>
              <p className="text-[11px] font-semibold text-gray-600 mt-1 leading-tight">
                {k.label}
              </p>
            </button>
          ))}
        </div>

        {/* Fila 2: Alertas + Ajustadores */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Alertas — 2/5 */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
              <span className={`w-2 h-2 rounded-full ${alertas.length ? "bg-red-500 animate-pulse" : "bg-gray-300"}`} />
              <p className="text-sm font-bold text-[#13193a]">
                Sin ajustador asignado
              </p>
            </div>
            {alertas.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-xs text-gray-400">Todos los siniestros activos tienen ajustador.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {alertas.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => navigate("/gaman/siniestros")}
                    className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-gray-50/70 transition-colors group"
                  >
                    <span className="w-2 h-2 rounded-full shrink-0 mt-0.5 bg-red-500" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-800 leading-snug">
                        {s.folio} sin ajustador asignado
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {s.asegurado} · {s.reportadoFecha ? tiempoRelativo(s.reportadoFecha) : "—"}
                      </p>
                    </div>
                    <svg
                      className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </button>
                ))}
              </div>
            )}
            <div className="p-4 border-t border-gray-50">
              <button
                onClick={() => navigate("/gaman/siniestros")}
                className="w-full py-2 rounded-xl bg-[#13193a] text-white text-xs font-bold hover:bg-[#1e2a50] transition-all"
              >
                Ver todos los siniestros
              </button>
            </div>
          </div>

          {/* Ajustadores — 3/5 */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <p className="text-sm font-bold text-[#13193a]">
                Carga de ajustadores
              </p>
              <button
                onClick={() => navigate("/gaman/ajustadores")}
                className="text-xs text-blue-500 font-semibold hover:underline"
              >
                Ver detalle
              </button>
            </div>
            {cargaAjustadores.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-xs text-gray-400">No hay ajustadores activos registrados.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {cargaAjustadores.map((aj) => {
                  const lleno = aj.activos >= MAX_ACTIVOS;
                  return (
                    <div
                      key={aj.id}
                      className="flex items-center gap-4 px-5 py-3.5"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 ${lleno ? "bg-red-500" : aj.activos === 0 ? "bg-gray-400" : "bg-[#13193a]"}`}
                      >
                        {aj.nombre
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-bold text-[#13193a]">
                            {aj.nombre}
                          </p>
                          <span
                            className={`text-[11px] font-bold ${lleno ? "text-red-600" : aj.activos === 0 ? "text-gray-400" : "text-blue-600"}`}
                          >
                            {aj.activos}/{MAX_ACTIVOS}
                          </span>
                        </div>
                        <CargaBar activos={aj.activos} max={MAX_ACTIVOS} />
                      </div>
                      <p className="text-[11px] text-gray-400 shrink-0">
                        {aj.completados} cerrados
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Fila 3: Tipos + Tiempos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Por tipo */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-bold text-[#13193a] mb-4">
              Siniestros por tipo
            </p>
            {porTipo.length === 0 ? (
              <p className="text-xs text-gray-400">Sin siniestros registrados aún.</p>
            ) : (
              <div className="space-y-2.5">
                {porTipo.map((t, i) => (
                  <div key={t.tipo} className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: ["#13193a", "#3b82f6", "#ef4444", "#d97706", "#059669", "#8b5cf6"][i % 6] }}
                    />
                    <p className="text-xs text-gray-700 flex-1">{t.tipo}</p>
                    <div className="w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(t.n / maxTipo) * 100}%`,
                          background: ["#13193a", "#3b82f6", "#ef4444", "#d97706", "#059669", "#8b5cf6"][i % 6],
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-[#13193a] w-4 text-right">
                      {t.n}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resumen de resolución */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-bold text-[#13193a] mb-4">
              Resolución semanal
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: "Total cerrados", value: String(cerrados.length), color: "#059669" },
                { label: "Casos jurídicos", value: "-", color: "#8b5cf6" },
                { label: "Tiempo promedio", value: tiempoPromSemanal, color: "#13193a" },
                { label: "Satisfacción", value: satisfaccion, color: "#d97706" },
              ].map((f) => (
                <div
                  key={f.label}
                  className="bg-gray-50 rounded-xl p-3 border border-gray-100"
                >
                  <p
                    className="text-lg font-black tabular-nums"
                    style={{ color: f.color }}
                  >
                    {f.value}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{f.label}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate("/gaman/reportes-siniestros")}
              className="w-full py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all"
            >
              Ver reporte completo →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupervisorDashboard;
