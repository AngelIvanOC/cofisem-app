// ============================================================
// src/features/analista/dashboard/DashboardPage.jsx
// Dashboard del analista — panel de control de todas las oficinas
// ============================================================
import { useNavigate } from "react-router-dom";

const HOY = new Date().toLocaleDateString("es-MX", {
  weekday: "long", day: "2-digit", month: "long", year: "numeric",
});

const KPIS = [
  { label: "Pólizas vigentes",  value: "186", sub: "+5 esta semana",      accent: "emerald", path: "/polizas"      },
  { label: "Pend. de aplicar",  value: "4",   sub: "Requieren acción",    accent: "blue",    path: "/polizas"      },
  { label: "Cuotas vencidas",   value: "7",   sub: "Sin cobrar",          accent: "red",     path: "/pagos"        },
  { label: "Por vencer (7d)",   value: "5",   sub: "Próximas a expirar",  accent: "amber",   path: "/polizas"      },
  { label: "Cobrado este mes",  value: "$186k",sub: "Todas las oficinas", accent: "emerald", path: "/reportes"     },
  { label: "Cortes pendientes", value: "1/4", sub: "1 oficina abierta",   accent: "amber",   path: "/corte-diario" },
];

const SECCIONES = [
  {
    label: "Pólizas", desc: "Aplicar · Consultar · Cambiar estatus",
    path: "/polizas", badge: "4 pend.", badgeAccent: "blue",
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>,
  },
  {
    label: "Pagos", desc: "Consultar · Aplicar cobros",
    path: "/pagos", badge: "7 vencidas", badgeAccent: "red",
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/></svg>,
  },
  {
    label: "Reportes", desc: "Producción · Cobros · Vencimientos",
    path: "/reportes", badge: null,
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>,
  },
  {
    label: "Corte diario", desc: "Pólizas por oficina · Solo lectura",
    path: "/corte-diario", badge: null,
    icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z"/></svg>,
  },
];

const AC = {
  emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
  blue:    "bg-blue-50    border-blue-200    text-blue-700",
  amber:   "bg-amber-50   border-amber-200   text-amber-700",
  red:     "bg-red-50     border-red-200     text-red-600",
};

const BADGE_MAP = {
  blue: "bg-blue-100 text-blue-700 border-blue-300",
  red:  "bg-red-100  text-red-600  border-red-300",
};

export default function AnalistaDashboard({ usuario }) {
  const navigate = useNavigate();
  const h = new Date().getHours();
  const saludo = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="h-full flex flex-col gap-6 p-6 bg-gray-50 overflow-hidden">
      {/* Header */}
      <div>
        <p className="text-sm text-gray-400">
          {saludo}, <span className="font-semibold text-[#13193a]">{usuario?.nombre ?? "Analista"}</span>
        </p>
        <h1 className="text-2xl font-bold text-[#13193a] mt-0.5">Panel de analista</h1>
        <p className="text-xs text-gray-400 mt-0.5 capitalize">{HOY}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {KPIS.map((k) => (
          <button
            key={k.label}
            onClick={() => navigate(k.path)}
            className={`${AC[k.accent]} border rounded-2xl p-4 text-left hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-150`}
          >
            <p className="text-2xl font-bold tabular-nums">{k.value}</p>
            <p className="text-xs font-semibold text-[#13193a] mt-1.5 leading-tight">{k.label}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{k.sub}</p>
          </button>
        ))}
      </div>

      {/* Secciones */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-0">
        {SECCIONES.map((s) => (
          <button
            key={s.label}
            onClick={() => navigate(s.path)}
            className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 text-left hover:shadow-md hover:border-gray-200 hover:scale-[1.01] active:scale-[0.99] transition-all duration-150 shadow-sm"
          >
            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[#13193a] shrink-0">
              {s.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-[#13193a]">{s.label}</p>
                {s.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${BADGE_MAP[s.badgeAccent]}`}>
                    {s.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
            </div>
            <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
