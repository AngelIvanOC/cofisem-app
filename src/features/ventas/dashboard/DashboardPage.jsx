// ============================================================
// src/features/ventas/dashboard/DashboardPage.jsx
// Ventas: Dashboard con KPIs, ranking vendedores y comparativa
// ============================================================
import { useNavigate } from "react-router-dom";

const HOY = new Date().toLocaleDateString("es-MX", {
  weekday: "long", day: "2-digit", month: "long", year: "numeric",
});

const KPIS = [
  { label:"Pólizas este mes",   value:"47",    sub:"Meta: 60 · 78%",      accent:"blue",    path:"/ventas/metas"      },
  { label:"Prima total",        value:"$104k", sub:"+12% vs mes ant.",     accent:"emerald", path:"/ventas/reportes"   },
  { label:"Cotizaciones abier.", value:"13",   sub:"5 por cerrar",         accent:"amber",   path:"/ventas/cotizaciones"},
  { label:"Tasa de cierre",     value:"62%",   sub:"Meta: 70%",           accent:"indigo",  path:"/ventas/reportes"   },
  { label:"Ticket promedio",    value:"$2,213",sub:"vs $2,180 ant.",       accent:"teal",    path:"/ventas/reportes"   },
  { label:"Renovaciones",       value:"8",     sub:"Por vencer en 30d",    accent:"amber",   path:"/ventas/metas"      },
  { label:"Vendedores activos", value:"4",     sub:"4 oficinas",           accent:"gray",    path:"/ventas/vendedores" },
  { label:"Días para fin mes",  value:"11",    sub:"→ ritmo requerido",    accent:"red",     path:"/ventas/metas"      },
];

const RANKING = [
  { pos:1, nombre:"Diana Ríos",      oficina:"Cuautla",    polizas:16, prima:35400, meta:15, pct:107 },
  { pos:2, nombre:"Laura Rosher",    oficina:"E. Zapata",  polizas:14, prima:30800, meta:15, pct:93  },
  { pos:3, nombre:"Marco A. Cruz",   oficina:"CIVAC",      polizas:11, prima:24200, meta:15, pct:73  },
  { pos:4, nombre:"Carlos Soto",     oficina:"Temixco",    polizas:6,  prima:13600, meta:15, pct:40  },
];

const ULTIMAS = [
  { poliza:"3413241", asegurado:"Angel Ivan Ortega",   vendedor:"Laura Rosher",  prima:3142.80, fecha:"20/03" },
  { poliza:"3413238", asegurado:"Sofía Guzmán Reyes",  vendedor:"Diana Ríos",    prima:2200.00, fecha:"20/03" },
  { poliza:"3413230", asegurado:"Tomás Medina Cruz",   vendedor:"Marco A. Cruz", prima:2548.00, fecha:"19/03" },
  { poliza:"3413218", asegurado:"Renata Ortiz Lima",   vendedor:"Laura Rosher",  prima:2200.00, fecha:"18/03" },
  { poliza:"3413205", asegurado:"Diego Vargas Pérez",  vendedor:"Carlos Soto",   prima:2320.00, fecha:"17/03" },
];

const AC = {
  blue:    "bg-blue-50    border-blue-200    text-blue-700",
  emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
  amber:   "bg-amber-50   border-amber-200   text-amber-700",
  indigo:  "bg-indigo-50  border-indigo-200  text-indigo-700",
  teal:    "bg-teal-50    border-teal-200    text-teal-700",
  gray:    "bg-gray-100   border-gray-200    text-gray-600",
  red:     "bg-red-50     border-red-200     text-red-600",
};

const MEDALLA = ["🥇","🥈","🥉","4°"];

export default function VentasDashboard({ usuario }) {
  const navigate = useNavigate();
  const h = new Date().getHours();
  const saludo = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="h-full flex flex-col gap-5 p-6 bg-gray-50 overflow-y-auto">
      <div>
        <p className="text-sm text-gray-400">{saludo}, <span className="font-semibold text-[#13193a]">{usuario?.nombre ?? "Ventas"}</span></p>
        <h1 className="text-2xl font-bold text-[#13193a] mt-0.5">Panel de ventas</h1>
        <p className="text-xs text-gray-400 mt-0.5 capitalize">{HOY}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {KPIS.map((k) => (
          <button key={k.label} onClick={() => navigate(k.path)}
            className={`${AC[k.accent]} border rounded-2xl p-3.5 text-left hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all`}>
            <p className="text-xl font-bold tabular-nums">{k.value}</p>
            <p className="text-[11px] font-semibold text-[#13193a] mt-1 leading-tight">{k.label}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{k.sub}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Ranking — 3/5 */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-bold text-[#13193a]">Ranking del mes</p>
            <button onClick={() => navigate("/ventas/vendedores")} className="text-xs font-semibold text-[#13193a] opacity-60 hover:opacity-100 transition-opacity">
              Ver detalle →
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {RANKING.map((v) => (
              <div key={v.pos} className="flex items-center gap-4 px-5 py-4">
                <span className="text-xl w-7 shrink-0 text-center">{MEDALLA[v.pos - 1]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="text-sm font-bold text-[#13193a]">{v.nombre}</p>
                    <span className="text-[10px] text-gray-400 font-medium">{v.oficina}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${v.pct >= 100 ? "bg-emerald-400" : v.pct >= 70 ? "bg-blue-400" : "bg-amber-400"}`}
                      style={{ width: `${Math.min(v.pct, 100)}%` }} />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-[#13193a]">{v.polizas} pólizas</p>
                  <p className={`text-xs font-bold mt-0.5 ${v.pct >= 100 ? "text-emerald-600" : v.pct >= 70 ? "text-blue-600" : "text-amber-600"}`}>{v.pct}% meta</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Últimas pólizas — 2/5 */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 shrink-0">
            <p className="text-sm font-bold text-[#13193a]">Últimas pólizas</p>
          </div>
          <div className="flex-1 divide-y divide-gray-50">
            {ULTIMAS.map((p, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#13193a] truncate">{p.asegurado}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{p.vendedor} · {p.fecha}</p>
                </div>
                <p className="text-xs font-bold text-emerald-700 shrink-0">${p.prima.toFixed(0)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
