// ============================================================
// SUPERVISOR SINIESTROS DASHBOARD
// src/features/supervisor/SupervisorDashboard.jsx
// ============================================================
import { useNavigate } from "react-router-dom";

const HOY_SUP = new Date().toLocaleDateString("es-MX", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const ALERTAS_SUP = [
  {
    msg: "SN-10231 sin ajustador asignado",
    detalle: "Ana Martínez · 2h sin atención",
    path: "/siniestros",
    urgente: true,
  },
  {
    msg: "SN-10220 sin ajustador asignado",
    detalle: "Laura González · 1h sin atención",
    path: "/siniestros",
    urgente: true,
  },
  {
    msg: "SN-10208 requiere asistencia jurídica",
    detalle: "Luis Torres · Caso complejo",
    path: "/siniestros",
    urgente: false,
  },
];

const AJUSTADORES_SUP = [
  {
    nombre: "Félix Hernández",
    activos: 2,
    max: 4,
    completados: 18,
    tiempo: "2.8h",
  },
  {
    nombre: "Luis Martínez",
    activos: 3,
    max: 4,
    completados: 22,
    tiempo: "3.1h",
  },
  { nombre: "Ana García", activos: 1, max: 4, completados: 15, tiempo: "2.4h" },
  {
    nombre: "Roberto Vega",
    activos: 0,
    max: 4,
    completados: 9,
    tiempo: "3.8h",
  },
];

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
            {
              label: "Activos hoy",
              value: "8",
              accent: "#3b82f6",
              path: "/siniestros",
            },
            {
              label: "Sin asignar",
              value: "3",
              accent: "#ef4444",
              path: "/siniestros",
            },
            {
              label: "Pend. de arribo",
              value: "2",
              accent: "#d97706",
              path: "/siniestros",
            },
            {
              label: "Asistencia jurídica",
              value: "2",
              accent: "#8b5cf6",
              path: "/siniestros",
            },
            {
              label: "Cerrados hoy",
              value: "5",
              accent: "#059669",
              path: "/siniestros",
            },
            {
              label: "Tiempo prom.",
              value: "3.2h",
              accent: "#13193a",
              path: "/reportes-siniestros",
            },
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
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <p className="text-sm font-bold text-[#13193a]">
                Requiere atención inmediata
              </p>
            </div>
            <div className="divide-y divide-gray-50">
              {ALERTAS_SUP.map((al, i) => (
                <button
                  key={i}
                  onClick={() => navigate(al.path)}
                  className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-gray-50/70 transition-colors group"
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${al.urgente ? "bg-red-500" : "bg-amber-400"}`}
                  />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-800 leading-snug">
                      {al.msg}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {al.detalle}
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
            <div className="p-4 border-t border-gray-50">
              <button
                onClick={() => navigate("/siniestros")}
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
                onClick={() => navigate("/ajustadores")}
                className="text-xs text-blue-500 font-semibold hover:underline"
              >
                Ver detalle
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {AJUSTADORES_SUP.map((aj) => {
                const lleno = aj.activos >= aj.max;
                return (
                  <div
                    key={aj.nombre}
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
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-gray-400">
                            {aj.tiempo} prom.
                          </span>
                          <span
                            className={`font-bold ${lleno ? "text-red-600" : aj.activos === 0 ? "text-gray-400" : "text-blue-600"}`}
                          >
                            {aj.activos}/{aj.max}
                          </span>
                        </div>
                      </div>
                      <CargaBar activos={aj.activos} max={aj.max} />
                    </div>
                    <p className="text-[11px] text-gray-400 shrink-0">
                      {aj.completados} casos
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Fila 3: Tipos + Tiempos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Por tipo */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-bold text-[#13193a] mb-4">
              Siniestros por tipo — este mes
            </p>
            <div className="space-y-2.5">
              {[
                { tipo: "Colisión", n: 28, juridicos: 1, color: "#13193a" },
                {
                  tipo: "Daño a terceros",
                  n: 12,
                  juridicos: 2,
                  color: "#3b82f6",
                },
                { tipo: "Robo total", n: 6, juridicos: 3, color: "#ef4444" },
                { tipo: "Robo parcial", n: 8, juridicos: 0, color: "#d97706" },
                { tipo: "Cristales", n: 10, juridicos: 0, color: "#059669" },
              ].map((t) => (
                <div key={t.tipo} className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: t.color }}
                  />
                  <p className="text-xs text-gray-700 flex-1">{t.tipo}</p>
                  <div className="w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(t.n / 28) * 100}%`,
                        background: t.color,
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-[#13193a] w-4 text-right">
                    {t.n}
                  </span>
                  {t.juridicos > 0 && (
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">
                      {t.juridicos}J
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Resumen de resolución */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-bold text-[#13193a] mb-4">
              Resolución semanal
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: "Total cerrados", value: "34", color: "#059669" },
                { label: "Casos jurídicos", value: "6", color: "#8b5cf6" },
                { label: "Tiempo promedio", value: "2.8h", color: "#13193a" },
                { label: "Satisfacción", value: "4.7★", color: "#d97706" },
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
              onClick={() => navigate("/reportes-siniestros")}
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
