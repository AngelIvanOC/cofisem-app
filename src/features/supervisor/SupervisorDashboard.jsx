// ============================================================
// src/pages/supervisor/SupervisorDashboard.jsx
// Dashboard limpio — sin scroll, control de siniestros
// KPIs clave + alertas urgentes + atajos a secciones
// ============================================================
import { useNavigate } from "react-router-dom";

const HOY = new Date().toLocaleDateString("es-MX", {
  weekday: "long", day: "2-digit", month: "long", year: "numeric",
});

// ── KPIs clickeables ─────────────────────────────────────────
const KPIS = [
  { label: "Activos hoy",         value: "8",  sub: "En atención",          accent: "blue",    path: "/siniestros" },
  { label: "Sin asignar",         value: "3",  sub: "Requieren ajustador",   accent: "red",     path: "/siniestros" },
  { label: "Pendientes de arribo",value: "2",  sub: "Ajustador en camino",   accent: "amber",   path: "/siniestros" },
  { label: "Asistencia jurídica", value: "2",  sub: "Casos canalizados",     accent: "purple",  path: "/siniestros" },
  { label: "Cerrados hoy",        value: "5",  sub: "+2 vs ayer",            accent: "emerald", path: "/siniestros" },
  { label: "Tiempo prom. cierre", value: "3.2h",sub: "Esta semana",          accent: "blue",    path: "/reportes-siniestros" },
];

// ── Alertas urgentes ─────────────────────────────────────────
const ALERTAS = [
  {
    msg:     "SN-10231 sin ajustador asignado",
    detalle: "Ana Martínez · Honda Civic · 2h sin atención",
    path:    "/siniestros",
    accent:  "red",
  },
  {
    msg:     "SN-10220 sin ajustador asignado",
    detalle: "Laura González · KIA Sportage · 1h sin atención",
    path:    "/siniestros",
    accent:  "red",
  },
  {
    msg:     "SN-10208 requiere asistencia jurídica",
    detalle: "Luis Torres · VW Vento · Caso complejo",
    path:    "/siniestros",
    accent:  "amber",
  },
];

// ── Secciones del módulo ──────────────────────────────────────
const SECCIONES = [
  {
    label: "Siniestros",
    desc:  "Reasignar · Canalizar · Desglose de casos",
    path:  "/siniestros",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
      </svg>
    ),
  },
  {
    label: "Ajustadores",
    desc:  "Carga de trabajo · Rendimiento",
    path:  "/ajustadores",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
      </svg>
    ),
  },
  {
    label: "Reportes",
    desc:  "Tiempos · Tipos · Resolución",
    path:  "/reportes-siniestros",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>
      </svg>
    ),
  },
];

const AC = {
  blue:   "bg-blue-50   border-blue-200   text-blue-700",
  red:    "bg-red-50    border-red-200    text-red-600",
  amber:  "bg-amber-50  border-amber-200  text-amber-700",
  purple: "bg-purple-50 border-purple-200 text-purple-700",
  emerald:"bg-emerald-50 border-emerald-200 text-emerald-700",
};
const DOT = { red:"bg-red-500", amber:"bg-amber-500", blue:"bg-blue-500" };

export default function SupervisorDashboard({ usuario }) {
  const navigate = useNavigate();
  const h = new Date().getHours();
  const saludo = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="h-full flex flex-col gap-5 p-6 bg-gray-50 overflow-hidden">

      {/* Header */}
      <div>
        <p className="text-sm text-gray-400">
          {saludo},{" "}
          <span className="font-semibold text-[#13193a]">{usuario?.nombre ?? "Supervisor"}</span>
        </p>
        <h1 className="text-2xl font-bold text-[#13193a] mt-0.5">Supervisión de siniestros</h1>
        <p className="text-xs text-gray-400 mt-0.5 capitalize">{HOY}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {KPIS.map(k => (
          <button key={k.label} onClick={() => navigate(k.path)}
            className={`${AC[k.accent]} border rounded-2xl p-4 text-left hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-150`}>
            <p className="text-2xl font-bold tabular-nums">{k.value}</p>
            <p className="text-xs font-semibold text-[#13193a] mt-1.5 leading-tight">{k.label}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{k.sub}</p>
          </button>
        ))}
      </div>

      {/* Fila inferior: Alertas + Secciones */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-0">

        {/* Alertas — 2/5 */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5 shrink-0">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/>
            <p className="text-sm font-bold text-[#13193a]">Requiere atención inmediata</p>
          </div>
          <div className="flex-1 flex flex-col divide-y divide-gray-50 justify-evenly">
            {ALERTAS.map((al, i) => (
              <button key={i} onClick={() => navigate(al.path)}
                className="flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50/70 transition-colors group">
                <div className={`w-2 h-2 rounded-full shrink-0 ${DOT[al.accent] ?? DOT.blue}`}/>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 leading-snug">{al.msg}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{al.detalle}</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 shrink-0 group-hover:text-gray-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Secciones — 3/5 */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 content-start">
          {SECCIONES.map(s => (
            <button key={s.label} onClick={() => navigate(s.path)}
              className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3 text-left hover:shadow-md hover:border-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[#13193a]">
                {s.icon}
              </div>
              <div>
                <p className="text-sm font-bold text-[#13193a]">{s.label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{s.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}