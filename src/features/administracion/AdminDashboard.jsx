// ============================================================
// src/features/administracion/AdminDashboard.jsx
// ============================================================
import { useNavigate } from "react-router-dom";

const HOY = new Date().toLocaleDateString("es-MX", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const ALERTAS = [
  {
    msg: "Diferencia en corte CIVAC",
    detalle: "$47.00 sin justificar · Hoy",
    path: "/corte-diario",
    color: "amber",
  },
  {
    msg: "3 pagos por transferencia sin autorizar",
    detalle: "$2,208.40 en espera · Hoy",
    path: "/pagos",
    color: "blue",
  },
  {
    msg: "Endoso END-012 sin procesar (2 días)",
    detalle: "Carmen López · Cambio de placas",
    path: "/polizas",
    color: "amber",
  },
  {
    msg: "Póliza 3411002 vence en 3 días",
    detalle: "Carmen López · TAXI BÁSICA 2500",
    path: "/polizas",
    color: "red",
  },
];

const ALERT_COLOR = {
  amber: { dot: "bg-amber-400", bg: "bg-amber-50", text: "text-amber-800" },
  blue: { dot: "bg-blue-400", bg: "bg-blue-50", text: "text-blue-800" },
  red: { dot: "bg-red-500", bg: "bg-red-50", text: "text-red-800" },
};

const OFICINAS = [
  { nombre: "CIVAC", polizas: 30, cobrado: 72000, corte: true, usuarios: 3 },
  { nombre: "ZAPATA", polizas: 22, cobrado: 50600, corte: true, usuarios: 2 },
  { nombre: "TEMIXCO", polizas: 10, cobrado: 23000, corte: false, usuarios: 2 },
  { nombre: "CUAUTLA", polizas: 6, cobrado: 13800, corte: true, usuarios: 1 },
];

const SECCIONES = [
  {
    label: "Pólizas",
    desc: "Cancelar · Endosos",
    path: "/polizas",
    icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z",
  },
  {
    label: "Pagos",
    desc: "Autorizar pendientes",
    path: "/pagos",
    icon: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z",
  },
  {
    label: "Usuarios",
    desc: "Crear · Gestionar accesos",
    path: "/usuarios",
    icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
  },
  {
    label: "Reportes",
    desc: "Por oficina y vendedor",
    path: "/reportes",
    icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
  },
  {
    label: "Corte diario",
    desc: "General por oficina",
    path: "/corte-diario",
    icon: "M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z",
  },
  {
    label: "Clientes",
    desc: "Consultar asegurados",
    path: "/clientes",
    icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
  },
];

export default function AdminDashboard({ usuario }) {
  const navigate = useNavigate();
  const h = new Date().getHours();
  const saludo =
    h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";

  const totalPolizas = OFICINAS.reduce((s, o) => s + o.polizas, 0);
  const totalCobrado = OFICINAS.reduce((s, o) => s + o.cobrado, 0);
  const maxCobrado = Math.max(...OFICINAS.map((o) => o.cobrado));

  return (
    <div className="h-full overflow-y-auto bg-[#f7f8fa]">
      <div className="max-w-7xl mx-auto p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-gray-400 capitalize">{HOY}</p>
            <h1 className="text-2xl font-bold text-[#13193a] mt-0.5">
              {saludo},{" "}
              <span className="font-light">
                {usuario?.nombre ?? "Administrador"}
              </span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Control general · Todas las oficinas
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            {
              label: "Pólizas activas",
              value: "186",
              accent: "#059669",
              path: "/polizas",
              sub: "+12 semana",
            },
            {
              label: "Pagos por autorizar",
              value: "3",
              accent: "#3b82f6",
              path: "/pagos",
              sub: "Esperando",
            },
            {
              label: "Endosos pendientes",
              value: "2",
              accent: "#d97706",
              path: "/polizas",
              sub: "Ver pólizas",
            },
            {
              label: "Cancelaciones hoy",
              value: "1",
              accent: "#ef4444",
              path: "/polizas",
              sub: "Revisar",
            },
            {
              label: "Cobrado este mes",
              value: "$186k",
              accent: "#059669",
              path: "/reportes",
              sub: "Todas",
            },
            {
              label: "Cortes del día",
              value: "3/4",
              accent: "#d97706",
              path: "/corte-diario",
              sub: "1 pendiente",
            },
            {
              label: "Usuarios activos",
              value: "12",
              accent: "#3b82f6",
              path: "/usuarios",
              sub: "4 oficinas",
            },
            {
              label: "Por vencer (7d)",
              value: "5",
              accent: "#ef4444",
              path: "/polizas",
              sub: "Renovar",
            },
          ].map((k) => (
            <button
              key={k.label}
              onClick={() => navigate(k.path)}
              className="bg-white rounded-2xl border border-gray-100 p-3.5 text-left hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <div
                className="w-6 h-0.5 rounded-full mb-2.5"
                style={{ background: k.accent }}
              />
              <p className="text-xl font-black text-[#13193a] tabular-nums">
                {k.value}
              </p>
              <p className="text-[10px] font-semibold text-gray-600 mt-1 leading-tight">
                {k.label}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">{k.sub}</p>
            </button>
          ))}
        </div>

        {/* Fila 2: Alertas + Producción por oficina */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Alertas — 2/5 */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <p className="text-sm font-bold text-[#13193a]">
                Requiere atención
              </p>
            </div>
            <div className="divide-y divide-gray-50">
              {ALERTAS.map((al, i) => {
                const c = ALERT_COLOR[al.color];
                return (
                  <button
                    key={i}
                    onClick={() => navigate(al.path)}
                    className="w-full flex items-start gap-3 px-5 py-3.5 text-left hover:bg-gray-50/70 transition-colors group"
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 mt-1 ${c.dot}`}
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
                      className="w-3.5 h-3.5 text-gray-300 shrink-0 group-hover:text-gray-500 mt-0.5"
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
                );
              })}
            </div>
          </div>

          {/* Producción por oficina — 3/5 */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <p className="text-sm font-bold text-[#13193a]">
                Producción por oficina — este mes
              </p>
              <p className="text-xs text-gray-400 font-semibold">
                {totalPolizas} pól. · ${(totalCobrado / 1000).toFixed(0)}k
              </p>
            </div>
            <div className="p-5 space-y-4">
              {OFICINAS.map((o) => (
                <div key={o.nombre}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-[#13193a]">
                        {o.nombre}
                      </p>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${o.corte ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                      >
                        {o.corte ? "Cerrado" : "Abierto"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-500">{o.polizas} pól.</span>
                      <span className="font-bold text-emerald-700">
                        ${(o.cobrado / 1000).toFixed(0)}k
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-700 bg-[#13193a]"
                      style={{ width: `${(o.cobrado / maxCobrado) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fila 3: Accesos rápidos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {SECCIONES.map((s) => (
            <button
              key={s.label}
              onClick={() => navigate(s.path)}
              className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-3 text-left hover:shadow-md hover:border-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-[#13193a]/5 flex items-center justify-center">
                <svg
                  className="w-4.5 h-4.5 text-[#13193a]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={s.icon}
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-[#13193a]">{s.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{s.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
