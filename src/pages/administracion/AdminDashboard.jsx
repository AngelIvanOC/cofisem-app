// ============================================================
// src/pages/administracion/AdminDashboard.jsx
// Dashboard limpio — sin scroll
// FIXES: /endosos → /polizas (endosos son tab dentro de polizas)
// ============================================================
import { useNavigate } from "react-router-dom";

const HOY = new Date().toLocaleDateString("es-MX", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const KPIS = [
  {
    label: "Pólizas activas",
    value: "186",
    accent: "emerald",
    path: "/polizas",
    sub: "+12 esta semana",
  },
  {
    label: "Pagos por autorizar",
    value: "3",
    accent: "blue",
    path: "/pagos",
    sub: "Esperando revisión",
  },
  {
    label: "Endosos pendientes",
    value: "2",
    accent: "amber",
    path: "/polizas",
    sub: "Ver en Pólizas",
  },
  {
    label: "Cancelaciones hoy",
    value: "1",
    accent: "red",
    path: "/polizas",
    sub: "Revisar",
  },
  {
    label: "Cobrado este mes",
    value: "$186k",
    accent: "emerald",
    path: "/reportes",
    sub: "Todas las oficinas",
  },
  {
    label: "Cortes del día",
    value: "3/4",
    accent: "amber",
    path: "/corte-diario",
    sub: "1 pendiente",
  },
  {
    label: "Usuarios activos",
    value: "12",
    accent: "blue",
    path: "/usuarios",
    sub: "4 oficinas",
  },
  {
    label: "Por vencer (7d)",
    value: "5",
    accent: "red",
    path: "/polizas",
    sub: "Renovar pronto",
  },
];

// Alertas urgentes — máximo 3, todas con rutas válidas
const ALERTAS = [
  {
    msg: "Diferencia en corte OFICINA CIVAC",
    detalle: "$47.00 sin justificar · Hoy",
    path: "/corte-diario",
    accent: "amber",
  },
  {
    msg: "3 pagos por transferencia sin autorizar",
    detalle: "$2,208.40 en espera · Hoy",
    path: "/pagos",
    accent: "blue",
  },
  {
    msg: "Endoso END-012 lleva 2 días sin procesar",
    detalle: "Carmen López · Cambio placas",
    path: "/polizas",
    accent: "amber",
  },
];

const SECCIONES = [
  {
    label: "Pólizas",
    desc: "Cancelar · Endosos",
    path: "/polizas",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
        />
      </svg>
    ),
  },
  {
    label: "Pagos",
    desc: "Autorizar pendientes",
    path: "/pagos",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
        />
      </svg>
    ),
  },
  {
    label: "Usuarios",
    desc: "Crear · Gestionar accesos",
    path: "/usuarios",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
        />
      </svg>
    ),
  },
  {
    label: "Reportes",
    desc: "Por oficina y vendedor",
    path: "/reportes",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
        />
      </svg>
    ),
  },
  {
    label: "Corte diario",
    desc: "General por oficina",
    path: "/corte-diario",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z"
        />
      </svg>
    ),
  },
  {
    label: "Clientes",
    desc: "Consultar asegurados",
    path: "/clientes",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
        />
      </svg>
    ),
  },
];

const AC = {
  emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
  blue: "bg-blue-50    border-blue-200    text-blue-700",
  amber: "bg-amber-50   border-amber-200   text-amber-700",
  red: "bg-red-50     border-red-200     text-red-600",
};
const DOT = { amber: "bg-amber-500", blue: "bg-blue-500", red: "bg-red-500" };

export default function AdminDashboard({ usuario }) {
  const navigate = useNavigate();
  const h = new Date().getHours();
  const saludo =
    h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="h-full flex flex-col gap-5 p-6 bg-gray-50 overflow-hidden">
      {/* Header */}
      <div>
        <p className="text-sm text-gray-400">
          {saludo},{" "}
          <span className="font-semibold text-[#13193a]">
            {usuario?.nombre ?? "Administrador"}
          </span>
        </p>
        <h1 className="text-2xl font-bold text-[#13193a] mt-0.5">
          Control general
        </h1>
        <p className="text-xs text-gray-400 mt-0.5 capitalize">{HOY}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {KPIS.map((k) => (
          <button
            key={k.label}
            onClick={() => navigate(k.path)}
            className={`${AC[k.accent]} border rounded-2xl p-3.5 text-left hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-150`}
          >
            <p className="text-xl font-bold tabular-nums">{k.value}</p>
            <p className="text-[11px] font-semibold text-[#13193a] mt-1 leading-tight">
              {k.label}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">
              {k.sub}
            </p>
          </button>
        ))}
      </div>

      {/* Fila inferior: Alertas + Secciones */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-0">
        {/* Alertas — 2/5 */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5 shrink-0">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <p className="text-sm font-bold text-[#13193a]">
              Requiere atención
            </p>
          </div>
          <div className="flex-1 flex flex-col divide-y divide-gray-50 justify-evenly">
            {ALERTAS.map((al, i) => (
              <button
                key={i}
                onClick={() => navigate(al.path)}
                className="flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50/70 transition-colors group"
              >
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${DOT[al.accent] ?? "bg-gray-400"}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 leading-snug">
                    {al.msg}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {al.detalle}
                  </p>
                </div>
                <svg
                  className="w-4 h-4 text-gray-300 shrink-0 group-hover:text-gray-500 transition-colors"
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
        </div>

        {/* Secciones — 3/5 — 2×3 */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5 content-start">
          {SECCIONES.map((s) => (
            <button
              key={s.label}
              onClick={() => navigate(s.path)}
              className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-3 text-left hover:shadow-md hover:border-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[#13193a]">
                {s.icon}
              </div>
              <div>
                <p className="text-sm font-bold text-[#13193a]">{s.label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                  {s.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
