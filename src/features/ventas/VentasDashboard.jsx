// ============================================================
// src/features/ventas/VentasDashboard.jsx
// ============================================================
import { useNavigate } from "react-router-dom";

const HOY = new Date().toLocaleDateString("es-MX", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const MES_ACT = new Date().toLocaleDateString("es-MX", {
  month: "long",
  year: "numeric",
});
const DIA_HOY = 17;
const DIAS_MES = 31;

const TOP_VENDEDORES = [
  {
    nombre: "Sofía Torres",
    oficina: "CIVAC",
    actual: 31,
    meta: 25,
    prima: 72000,
    tend: "up",
  },
  {
    nombre: "Luis Martínez",
    oficina: "ZAPATA",
    actual: 22,
    meta: 20,
    prima: 50600,
    tend: "up",
  },
  {
    nombre: "Laura Rosher",
    oficina: "CIVAC",
    actual: 18,
    meta: 20,
    prima: 41400,
    tend: "stable",
  },
  {
    nombre: "Carlos Soto",
    oficina: "TEMIXCO",
    actual: 10,
    meta: 10,
    prima: 23000,
    tend: "stable",
  },
  {
    nombre: "Patricia Morales",
    oficina: "CUAUTLA",
    actual: 6,
    meta: 10,
    prima: 13800,
    tend: "down",
  },
];

const COTIZACIONES_PEND = [
  {
    id: "COT-0341",
    cliente: "Jorge Vásquez",
    cobertura: "APP (UBER/DIDI)",
    prima: 3142.8,
    diasRest: 7,
    vendedor: "Laura Rosher",
  },
  {
    id: "COT-0340",
    cliente: "Mariana Solís",
    cobertura: "TAXI BÁSICA 2500",
    prima: 2200.0,
    diasRest: 7,
    vendedor: "Luis Martínez",
  },
  {
    id: "COT-0335",
    cliente: "Eduardo Ríos",
    cobertura: "TAXI BÁSICA 2500",
    prima: 2200.0,
    diasRest: 2,
    vendedor: "Patricia Morales",
  },
];

const TEND_ICON = {
  up: { icon: "↑", cls: "text-emerald-600" },
  down: { icon: "↓", cls: "text-red-500" },
  stable: { icon: "→", cls: "text-amber-600" },
};

const MEDAL = ["🥇", "🥈", "🥉"];

export function VentasDashboard({ usuario }) {
  const navigate = useNavigate();
  const h = new Date().getHours();
  const saludo =
    h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";

  const totalActual = TOP_VENDEDORES.reduce((s, v) => s + v.actual, 0);
  const totalMeta = TOP_VENDEDORES.reduce((s, v) => s + v.meta, 0);
  const pctGlobal = Math.round((totalActual / totalMeta) * 100);
  const proyectado = Math.round(
    ((totalActual * (DIAS_MES / DIA_HOY)) / totalMeta) * 100,
  );

  return (
    <div className="h-full overflow-y-auto bg-[#f7f8fa]">
      <div className="max-w-7xl mx-auto p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-gray-400 capitalize">{HOY}</p>
            <h1 className="text-2xl font-bold text-[#13193a] mt-0.5">
              {saludo},{" "}
              <span className="font-light">{usuario?.nombre ?? "Ventas"}</span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Panel de ventas · {MES_ACT}
            </p>
          </div>
          <button
            onClick={() => navigate("/ventas-reportes")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Exportar reporte
          </button>
        </div>

        {/* Meta global prominente */}
        <div className="bg-[#13193a] rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs text-white/50 uppercase tracking-widest mb-1">
                Meta global del mes
              </p>
              <div className="flex items-end gap-3">
                <p className="text-5xl font-black tabular-nums">{pctGlobal}%</p>
                <div>
                  <p className="text-sm font-semibold text-white/80">
                    {totalActual} de {totalMeta} pólizas
                  </p>
                  <p className="text-xs text-white/50">
                    Proyección: ~{Math.min(proyectado, 150)}% al cierre
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-end gap-3">
              {TOP_VENDEDORES.slice(0, 3).map((v, i) => {
                const p = Math.round((v.actual / v.meta) * 100);
                return (
                  <div key={v.nombre} className="text-center">
                    <div className="text-lg mb-1">{MEDAL[i]}</div>
                    <div
                      className="relative w-12 mx-auto"
                      style={{ height: 60 + i * 10 }}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-white/10"
                        style={{ height: "100%" }}
                      />
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-white/30 transition-all duration-700"
                        style={{ height: `${Math.min(p, 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-white/60 mt-1 truncate w-14">
                      {v.nombre.split(" ")[0]}
                    </p>
                    <p className="text-[11px] font-bold">{v.actual}</p>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Barra de progreso */}
          <div className="mt-4">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/60 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(pctGlobal, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-white/40 mt-1.5">
              Día {DIA_HOY} de {DIAS_MES}
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: "Pólizas este mes",
              value: `${totalActual}`,
              sub: `+12 vs mes ant.`,
              accent: "#059669",
              path: "/ventas-reportes",
            },
            {
              label: "Prima neta total",
              value: `$${(TOP_VENDEDORES.reduce((s, v) => s + v.prima, 0) / 1000).toFixed(0)}k`,
              sub: "Todas las oficinas",
              accent: "#13193a",
              path: "/ventas-reportes",
            },
            {
              label: "Cotizaciones pend.",
              value: `${COTIZACIONES_PEND.length}`,
              sub: "Por tramitar",
              accent: "#d97706",
              path: "/ventas-cotizaciones",
            },
            {
              label: "Vendedores activos",
              value: "12",
              sub: "4 oficinas",
              accent: "#3b82f6",
              path: "/ventas-vendedores",
            },
          ].map((k) => (
            <button
              key={k.label}
              onClick={() => navigate(k.path)}
              className="bg-white rounded-2xl border border-gray-100 p-4 text-left hover:shadow-md hover:border-gray-200 transition-all"
            >
              <div
                className="w-6 h-0.5 rounded-full mb-2.5"
                style={{ background: k.accent }}
              />
              <p className="text-2xl font-black text-[#13193a] tabular-nums">
                {k.value}
              </p>
              <p className="text-xs font-semibold text-gray-600 mt-1">
                {k.label}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">{k.sub}</p>
            </button>
          ))}
        </div>

        {/* Fila: Vendedores + Cotizaciones pendientes */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Ranking vendedores — 3/5 */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <p className="text-sm font-bold text-[#13193a]">
                Ranking de vendedores
              </p>
              <button
                onClick={() => navigate("/ventas-vendedores")}
                className="text-xs text-blue-500 font-semibold hover:underline"
              >
                Ver detalle
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {TOP_VENDEDORES.map((v, i) => {
                const pct = Math.round((v.actual / v.meta) * 100);
                const t = TEND_ICON[v.tend];
                return (
                  <div
                    key={v.nombre}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <span className="text-sm w-5 shrink-0 text-center">
                      {i < 3 ? (
                        MEDAL[i]
                      ) : (
                        <span className="text-xs text-gray-400 font-bold">
                          {i + 1}
                        </span>
                      )}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-[#13193a] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                      {v.nombre
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-bold text-[#13193a]">
                          {v.nombre}
                        </p>
                        <span className={`text-[11px] font-bold ${t.cls}`}>
                          {t.icon}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${pct >= 100 ? "bg-emerald-500" : pct >= 80 ? "bg-blue-500" : pct >= 50 ? "bg-amber-500" : "bg-red-400"}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-[#13193a]">
                        {v.actual}
                        <span className="text-gray-400 font-normal">
                          /{v.meta}
                        </span>
                      </p>
                      <p
                        className={`text-[10px] font-bold ${pct >= 100 ? "text-emerald-600" : pct >= 80 ? "text-blue-600" : "text-amber-600"}`}
                      >
                        {pct}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cotizaciones próximas a vencer — 2/5 */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <p className="text-sm font-bold text-[#13193a]">
                Cotizaciones por tramitar
              </p>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                {COTIZACIONES_PEND.length}
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {COTIZACIONES_PEND.map((c, i) => (
                <div key={i} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[11px] font-mono font-bold text-[#13193a]">
                      {c.id}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.diasRest <= 2 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
                    >
                      {c.diasRest === 0 ? "¡Hoy!" : `${c.diasRest}d`}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-gray-700">
                    {c.cliente}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-gray-400 truncate">
                      {c.cobertura}
                    </p>
                    <p className="text-[10px] font-bold text-emerald-700 shrink-0 ml-2">
                      ${c.prima.toFixed(0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-50">
              <button
                onClick={() => navigate("/ventas-cotizaciones")}
                className="w-full py-2 rounded-xl bg-[#13193a] text-white text-xs font-bold hover:bg-[#1e2a50] transition-all"
              >
                Ver todas las cotizaciones
              </button>
            </div>
          </div>
        </div>

        {/* Fila: Distribución por cobertura + Alertas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Coberturas */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-bold text-[#13193a] mb-4">
              Distribución por cobertura — este mes
            </p>
            <div className="space-y-2.5">
              {[
                { cob: "TAXI BÁSICA 2500", n: 32, pct: 40, color: "#13193a" },
                {
                  cob: "TAXI BÁSICA PAGOS 2700",
                  n: 21,
                  pct: 26,
                  color: "#3b82f6",
                },
                { cob: "SERV. PÚB. 50/50", n: 18, pct: 22, color: "#d97706" },
                { cob: "APP (UBER/DIDI)", n: 10, pct: 12, color: "#059669" },
              ].map((c) => (
                <div key={c.cob} className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: c.color }}
                  />
                  <p className="text-[11px] text-gray-700 flex-1 truncate">
                    {c.cob}
                  </p>
                  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${c.pct}%`, background: c.color }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-[#13193a] tabular-nums w-8 text-right">
                    {c.n}
                  </span>
                  <span className="text-[10px] text-gray-400 w-7 text-right">
                    {c.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Alertas de ventas */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <p className="text-sm font-bold text-[#13193a]">Atención</p>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                {
                  msg: "CUAUTLA al 60% de meta",
                  detalle: "6 de 10 pólizas · 14 días restantes",
                  path: "/ventas-metas",
                  color: "amber",
                },
                {
                  msg: "3 vendedores sin ventas esta semana",
                  detalle: "Patricia M. · Juan R. · Ana L.",
                  path: "/ventas-vendedores",
                  color: "red",
                },
                {
                  msg: "3 cotizaciones vencen en 2 días",
                  detalle: "COT-0335 · COT-0334 · COT-0332",
                  path: "/ventas-cotizaciones",
                  color: "red",
                },
              ].map((al, i) => (
                <button
                  key={i}
                  onClick={() => navigate(al.path)}
                  className="w-full flex items-start gap-3 px-5 py-3.5 text-left hover:bg-gray-50/70 transition-colors group"
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${al.color === "red" ? "bg-red-500" : "bg-amber-400"}`}
                  />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-800">
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default VentasDashboard;
