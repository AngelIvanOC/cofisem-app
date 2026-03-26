// ============================================================
// src/features/supervisor/dashboard/DashboardPage.jsx
// Supervisor: Control general de siniestros + alertas críticas
// ============================================================
import { useNavigate } from "react-router-dom";

const HOY = new Date().toLocaleDateString("es-MX", {
  weekday: "long", day: "2-digit", month: "long", year: "numeric",
});

const KPIS = [
  { label:"Abiertos hoy",       value:"11",  sub:"+3 vs ayer",          accent:"blue",    path:"/supervisor/siniestros" },
  { label:"Sin asignar",        value:"2",   sub:"Requieren atención",   accent:"amber",   path:"/supervisor/siniestros" },
  { label:"En proceso",         value:"7",   sub:"Con ajustador",        accent:"indigo",  path:"/supervisor/siniestros" },
  { label:"Cerrados hoy",       value:"4",   sub:"Resueltos",            accent:"emerald", path:"/supervisor/siniestros" },
  { label:"Jurídicos activos",  value:"3",   sub:"En seguimiento",       accent:"purple",  path:"/supervisor/siniestros" },
  { label:"Tiempo prom.",       value:"2.4h",sub:"Atención en campo",    accent:"gray",    path:"/supervisor/ajustadores"},
  { label:"Ajustadores",        value:"4",   sub:"2 disponibles",        accent:"teal",    path:"/supervisor/ajustadores"},
  { label:"Cerrados este mes",  value:"47",  sub:"Meta: 60",             accent:"emerald", path:"/supervisor/reportes"  },
];

const ALERTAS = [
  { nivel:"rojo",   msg:"SIN-086 lleva 28h sin resolución",           folio:"SIN-086", ajustador:"Sandra Moreno",   path:"/supervisor/siniestros" },
  { nivel:"rojo",   msg:"Lesionados en SIN-088 — requiere jurídico",  folio:"SIN-088", ajustador:"Sin asignar",     path:"/supervisor/siniestros" },
  { nivel:"amber",  msg:"Felipe Castillo tiene 5 casos activos",      folio:null,      ajustador:"Felipe Castillo", path:"/supervisor/ajustadores"},
  { nivel:"amber",  msg:"SIN-079 sin actualización en 12h",           folio:"SIN-079", ajustador:"Roberto Vega",   path:"/supervisor/siniestros" },
  { nivel:"blue",   msg:"3 casos listos para revisión final",         folio:null,      ajustador:null,              path:"/supervisor/siniestros" },
];

const DIST_AJUST = [
  { nombre:"Roberto Vega",    activos:3, enEspera:1, cerrados:12 },
  { nombre:"Sandra Moreno",   activos:1, enEspera:0, cerrados:8  },
  { nombre:"Felipe Castillo", activos:5, enEspera:1, cerrados:9  },
  { nombre:"Diana Ríos",      activos:0, enEspera:0, cerrados:18 },
];

const AC = {
  blue:    "bg-blue-50    border-blue-200    text-blue-700",
  amber:   "bg-amber-50   border-amber-200   text-amber-700",
  indigo:  "bg-indigo-50  border-indigo-200  text-indigo-700",
  emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
  purple:  "bg-purple-50  border-purple-200  text-purple-700",
  teal:    "bg-teal-50    border-teal-200    text-teal-700",
  gray:    "bg-gray-100   border-gray-200    text-gray-600",
};

const DOT = { rojo:"bg-red-500 animate-pulse", amber:"bg-amber-400", blue:"bg-blue-400" };

export default function SupervisorDashboard({ usuario }) {
  const navigate = useNavigate();
  const h = new Date().getHours();
  const saludo = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="h-full flex flex-col gap-5 p-6 bg-gray-50 overflow-y-auto">
      <div>
        <p className="text-sm text-gray-400">{saludo}, <span className="font-semibold text-[#13193a]">{usuario?.nombre ?? "Supervisor"}</span></p>
        <h1 className="text-2xl font-bold text-[#13193a] mt-0.5">Panel de supervisión</h1>
        <p className="text-xs text-gray-400 mt-0.5 capitalize">{HOY}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {KPIS.map((k) => (
          <button key={k.label} onClick={() => navigate(k.path)}
            className={`${AC[k.accent]} border rounded-2xl p-3.5 text-left hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all`}>
            <p className="text-xl font-bold tabular-nums">{k.value}</p>
            <p className="text-[11px] font-semibold text-[#13193a] mt-1 leading-tight">{k.label}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{k.sub}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Alertas — 2/5 */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5 shrink-0">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <p className="text-sm font-bold text-[#13193a]">Requiere atención</p>
          </div>
          <div className="divide-y divide-gray-50">
            {ALERTAS.map((al, i) => (
              <button key={i} onClick={() => navigate(al.path)}
                className="w-full flex items-start gap-3 px-5 py-3.5 text-left hover:bg-gray-50/70 transition-colors group">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${DOT[al.nivel]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 leading-snug">{al.msg}</p>
                  {al.ajustador && <p className="text-[11px] text-gray-400 mt-0.5">{al.ajustador}</p>}
                </div>
                <svg className="w-4 h-4 text-gray-300 shrink-0 mt-0.5 group-hover:text-gray-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Carga de ajustadores — 3/5 */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
            <p className="text-sm font-bold text-[#13193a]">Carga de ajustadores</p>
            <button onClick={() => navigate("/supervisor/ajustadores")} className="text-xs font-semibold text-[#13193a] opacity-60 hover:opacity-100 transition-opacity">
              Ver detalle →
            </button>
          </div>
          <div className="p-5 space-y-4">
            {DIST_AJUST.map((a) => {
              const total = a.activos + a.enEspera;
              const pct   = Math.min(Math.round((total / 6) * 100), 100);
              const color = total >= 5 ? "bg-red-400" : total >= 3 ? "bg-amber-400" : "bg-emerald-400";
              return (
                <div key={a.nombre}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#13193a] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                        {a.nombre.split(" ").map(w => w[0]).join("").slice(0, 2)}
                      </div>
                      <p className="text-sm font-semibold text-[#13193a]">{a.nombre}</p>
                    </div>
                    <div className="flex gap-3 text-xs text-gray-500">
                      <span className="font-bold text-[#13193a]">{total}</span> activos ·
                      <span className="text-emerald-600 font-semibold">{a.cerrados}</span> cerrados
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
