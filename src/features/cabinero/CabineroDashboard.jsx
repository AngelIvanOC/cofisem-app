// ============================================================
// CABINERO DASHBOARD
// ============================================================
// src/features/cabinero/CabineroDashboard.jsx
import { useNavigate } from "react-router-dom";

const HOY = new Date().toLocaleDateString("es-MX", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const ULTIMOS_SN = [
  {
    folio: "SN-10234",
    asegurado: "Carlos Gómez",
    tipo: "Colisión",
    ajustador: "Félix H.",
    estatus: "En proceso",
    color: "blue",
  },
  {
    folio: "SN-10231",
    asegurado: "Ana Martínez",
    tipo: "Daño a terceros",
    ajustador: null,
    estatus: "Sin asignar",
    color: "red",
  },
  {
    folio: "SN-10228",
    asegurado: "Roberto Díaz",
    tipo: "Robo parcial",
    ajustador: null,
    estatus: "Sin asignar",
    color: "red",
  },
  {
    folio: "SN-10225",
    asegurado: "Laura González",
    tipo: "Colisión",
    ajustador: "Luis M.",
    estatus: "En proceso",
    color: "blue",
  },
  {
    folio: "SN-10219",
    asegurado: "Miguel Ortega",
    tipo: "Cristales",
    ajustador: "Ana G.",
    estatus: "Cerrado",
    color: "emerald",
  },
];

const STATUS_COLOR = {
  "En proceso": "bg-blue-50 text-blue-700",
  "Sin asignar": "bg-red-50 text-red-600",
  Cerrado: "bg-emerald-50 text-emerald-700",
};

export function CabineroDashboard({ usuario }) {
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
            <p className="text-xs text-gray-400 capitalize">{HOY}</p>
            <h1 className="text-2xl font-bold text-[#13193a] mt-0.5">
              {saludo},{" "}
              <span className="font-light">
                {usuario?.nombre ?? "Cabinero"}
              </span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Cabina de siniestros</p>
          </div>
          <button
            onClick={() => navigate("/siniestros/nuevo")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#13193a] text-white text-sm font-semibold hover:bg-[#1e2a50] transition-all shadow-sm shadow-[#13193a]/20"
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
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Reportar siniestro
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Reportados hoy",
              value: "8",
              sub: "+2 vs ayer",
              accent: "#3b82f6",
              path: "/siniestros",
            },
            {
              label: "Sin asignar",
              value: "3",
              sub: "Requieren ajustador",
              accent: "#ef4444",
              path: "/siniestros",
            },
            {
              label: "En proceso",
              value: "4",
              sub: "Ajustador en campo",
              accent: "#d97706",
              path: "/siniestros",
            },
            {
              label: "Cerrados hoy",
              value: "1",
              sub: "Resueltos",
              accent: "#059669",
              path: "/siniestros",
            },
          ].map((k) => (
            <button
              key={k.label}
              //onClick={() => navigate(k.path)}
              className="bg-white rounded-2xl border border-gray-100 p-4 text-left  transition-all group"
              //hover:shadow-md hover:border-gray-200
            >
              {/**<div className="flex items-start justify-between mb-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: k.accent + "18" }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: k.accent }}
                  />
                </div>
                <svg
                  className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </div>*/}
              <p className="text-3xl font-black text-[#13193a] tabular-nums">
                {k.value}
              </p>
              <p className="text-xs font-semibold text-gray-600 mt-1">
                {k.label}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">{k.sub}</p>
            </button>
          ))}
        </div>

        {/* Tabla siniestros del día */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <p className="text-sm font-bold text-[#13193a]">
              Siniestros del día
            </p>
            <button
              onClick={() => navigate("/siniestros")}
              className="text-xs text-blue-500 font-semibold hover:underline"
            >
              Ver todos →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/60 border-b border-gray-100">
                  {[
                    "Folio",
                    "Asegurado",
                    "Tipo",
                    "Ajustador",
                    "Estatus",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-2.5"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ULTIMOS_SN.map((s, i) => (
                  <tr
                    key={i}
                    //onClick={() => navigate("/siniestros")}
                    className={`hover:bg-gray-50/60 transition-colors ${s.estatus === "Sin asignar" ? "bg-red-50/20" : ""}`}
                  >
                    <td className="px-5 py-3 font-mono text-xs font-bold text-[#13193a]">
                      {s.folio}
                    </td>
                    <td className="px-5 py-3 text-xs font-semibold text-gray-700">
                      {s.asegurado}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">
                      {s.tipo}
                    </td>
                    <td className="px-5 py-3 text-xs">
                      {s.ajustador ? (
                        <span className="text-gray-700 font-medium">
                          {s.ajustador}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-500 font-bold text-[11px]">
                          <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                          Sin asignar
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[s.estatus]}`}
                      >
                        {s.estatus}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <svg
                        className="w-4 h-4 text-gray-300"
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fila 3: Tiempos + Tipos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Tiempo promedio */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-bold text-[#13193a] mb-4">
              Tiempo promedio de atención — hoy
            </p>
            <div className="space-y-3">
              {[
                {
                  ajustador: "Félix Hernández",
                  tiempo: "2.8h",
                  casos: 2,
                  pct: 70,
                },
                {
                  ajustador: "Luis Martínez",
                  tiempo: "3.1h",
                  casos: 3,
                  pct: 78,
                },
                { ajustador: "Ana García", tiempo: "2.4h", casos: 1, pct: 60 },
              ].map((a) => (
                <div key={a.ajustador}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-gray-700">
                      {a.ajustador}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400">
                        {a.casos} casos
                      </span>
                      <span className="text-xs font-bold text-[#13193a]">
                        {a.tiempo}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#13193a] transition-all duration-700"
                      style={{ width: `${a.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tipos de siniestro */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-bold text-[#13193a] mb-4">
              Tipos de siniestro — este mes
            </p>
            <div className="space-y-2.5">
              {[
                { tipo: "Colisión", n: 28, pct: 49, color: "#13193a" },
                { tipo: "Daño a terceros", n: 12, pct: 21, color: "#3b82f6" },
                { tipo: "Robo parcial", n: 8, pct: 14, color: "#d97706" },
                { tipo: "Cristales", n: 5, pct: 9, color: "#059669" },
                { tipo: "Otros", n: 4, pct: 7, color: "#94a3b8" },
              ].map((t) => (
                <div key={t.tipo} className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: t.color }}
                  />
                  <p className="text-xs text-gray-700 flex-1">{t.tipo}</p>
                  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${t.pct}%`, background: t.color }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-[#13193a] w-5 text-right">
                    {t.n}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CabineroDashboard;
