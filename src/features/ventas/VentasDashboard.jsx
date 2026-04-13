// ============================================================
// src/pages/ventas/VentasDashboard.jsx
// Dashboard limpio — sin scroll, control de ventas
// KPIs globales + ranking rápido + alertas + secciones
// ============================================================
import { useNavigate } from "react-router-dom";

const HOY = new Date().toLocaleDateString("es-MX", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

// ── KPIs del mes ─────────────────────────────────────────────
const KPIS = [
  {
    label: "Pólizas este mes",
    value: "81",
    sub: "+12 vs mes ant.",
    accent: "emerald",
    path: "/ventas-reportes",
  },
  {
    label: "Prima neta total",
    value: "$186k",
    sub: "Todas las oficinas",
    accent: "emerald",
    path: "/ventas-reportes",
  },
  {
    label: "Vendedores activos",
    value: "12",
    sub: "4 oficinas",
    accent: "blue",
    path: "/ventas-vendedores",
  },
  {
    label: "Meta global",
    value: "81%",
    sub: "de 100 pólizas/mes",
    accent: "amber",
    path: "/ventas-metas",
  },
  {
    label: "Mejor oficina",
    value: "CIVAC",
    sub: "30 pólizas",
    accent: "blue",
    path: "/ventas-reportes",
  },
  {
    label: "Vendedor top",
    value: "S.Torres",
    sub: "31 pólizas",
    accent: "purple",
    path: "/ventas-metas",
  },
];

// ── Top 3 vendedores del mes ──────────────────────────────────
const TOP_VENDEDORES = [
  {
    pos: 1,
    nombre: "Sofía Torres",
    oficina: "TODAS",
    polizas: 31,
    meta: 25,
    prima: 72000,
  },
  {
    pos: 2,
    nombre: "Luis Martínez",
    oficina: "COFISEM ZAPATA",
    polizas: 22,
    meta: 20,
    prima: 50600,
  },
  {
    pos: 3,
    nombre: "Laura Rosher",
    oficina: "CIVAC",
    polizas: 18,
    meta: 20,
    prima: 41400,
  },
];

// ── Alertas ───────────────────────────────────────────────────
const ALERTAS = [
  {
    msg: "COFISEM CUAUTLA al 60% de meta",
    detalle: "6 de 10 pólizas · 11 días restantes",
    path: "/ventas-metas",
    accent: "amber",
  },
  {
    msg: "3 vendedores sin pólizas esta semana",
    detalle: "Patricia M. · Juan R. · Ana L.",
    path: "/ventas-vendedores",
    accent: "red",
  },
];

// ── Secciones ─────────────────────────────────────────────────
const SECCIONES = [
  {
    label: "Metas",
    desc: "Termómetro y avance mensual",
    path: "/ventas-metas",
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
    label: "Reportes",
    desc: "Comparativas y estadísticas",
    path: "/ventas-reportes",
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
          d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"
        />
      </svg>
    ),
  },
  {
    label: "Vendedores",
    desc: "Rendimiento individual",
    path: "/ventas-vendedores",
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
    label: "Cotizaciones",
    desc: "Seguimiento de cotizaciones",
    path: "/ventas-cotizaciones",
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
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        />
      </svg>
    ),
  },
];

const AC = {
  emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
  blue: "bg-blue-50    border-blue-200    text-blue-700",
  amber: "bg-amber-50   border-amber-200   text-amber-700",
  purple: "bg-purple-50  border-purple-200  text-purple-700",
  red: "bg-red-50     border-red-200     text-red-600",
};
const DOT = { amber: "bg-amber-500", red: "bg-red-500", blue: "bg-blue-500" };
const MEDAL = ["🥇", "🥈", "🥉"];

export default function VentasDashboard({ usuario }) {
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
            {usuario?.nombre ?? "Ventas"}
          </span>
        </p>
        <h1 className="text-2xl font-bold text-[#13193a] mt-0.5">
          Panel de ventas
        </h1>
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
            <p className="text-2xl font-bold tabular-nums truncate">
              {k.value}
            </p>
            <p className="text-xs font-semibold text-[#13193a] mt-1.5 leading-tight">
              {k.label}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5 truncate">{k.sub}</p>
          </button>
        ))}
      </div>

      {/* Fila inferior */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-0">
        {/* Top vendedores + Alertas — 2/5 */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {/* Top 3 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-bold text-[#13193a]">
                Top vendedores del mes
              </p>
              <button
                onClick={() => navigate("/ventas-metas")}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                Ver metas →
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {TOP_VENDEDORES.map((v, i) => {
                const pct = Math.round((v.polizas / v.meta) * 100);
                return (
                  <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                    <span className="text-lg shrink-0">{MEDAL[i]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#13193a] truncate">
                        {v.nombre}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-1.5 rounded-full bg-[#13193a] transition-all"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-gray-500 shrink-0">
                          {v.polizas} pól.
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-emerald-700">
                        ${(v.prima / 1000).toFixed(0)}k
                      </p>
                      <p className="text-[10px] text-gray-400">{pct}% meta</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alertas */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <p className="text-sm font-bold text-[#13193a]">Atención</p>
            </div>
            {ALERTAS.map((al, i) => (
              <button
                key={i}
                onClick={() => navigate(al.path)}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-50/70 transition-colors border-b border-gray-50 last:border-0 group"
              >
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${DOT[al.accent]}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800">
                    {al.msg}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                    {al.detalle}
                  </p>
                </div>
                <svg
                  className="w-4 h-4 text-gray-300 shrink-0"
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

        {/* Secciones — 3/5 — 2×2 */}
        <div className="lg:col-span-3 grid grid-cols-2 gap-3 content-start">
          {SECCIONES.map((s) => (
            <button
              key={s.label}
              onClick={() => navigate(s.path)}
              className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3 text-left hover:shadow-md hover:border-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 shadow-sm"
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
