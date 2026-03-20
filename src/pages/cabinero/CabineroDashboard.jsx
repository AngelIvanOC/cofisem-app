// ============================================================
// src/pages/cabinero/CabineroDashboard.jsx
// Dashboard del Cabinero de Siniestros — sin scroll
// KPIs de operación diaria + tabla compacta + accesos rápidos
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
    label: "Reportados hoy",
    value: "8",
    sub: "+2 vs ayer",
    accent: "blue",
    path: "/siniestros",
  },
  {
    label: "Sin asignar",
    value: "3",
    sub: "Requieren ajustador",
    accent: "red",
    path: "/siniestros",
  },
  {
    label: "En proceso",
    value: "4",
    sub: "Ajustador en campo",
    accent: "amber",
    path: "/siniestros",
  },
  {
    label: "Cerrados hoy",
    value: "1",
    sub: "Resueltos",
    accent: "emerald",
    path: "/siniestros",
  },
];

// Últimos siniestros del día — tabla compacta
const ULTIMOS = [
  {
    folio: "SN-10234",
    asegurado: "Carlos Gómez",
    tipo: "Colisión",
    ajustador: "Félix H.",
    estatus: "En proceso",
  },
  {
    folio: "SN-10231",
    asegurado: "Ana Martínez",
    tipo: "Daño a terceros",
    ajustador: null,
    estatus: "Sin asignar",
  },
  {
    folio: "SN-10228",
    asegurado: "Roberto Díaz",
    tipo: "Robo parcial",
    ajustador: null,
    estatus: "Sin asignar",
  },
  {
    folio: "SN-10225",
    asegurado: "Laura González",
    tipo: "Colisión",
    ajustador: "Luis M.",
    estatus: "En proceso",
  },
  {
    folio: "SN-10219",
    asegurado: "Miguel Ortega",
    tipo: "Cristales",
    ajustador: "Ana G.",
    estatus: "Cerrado",
  },
];

const STATUS_CLS = {
  "Sin asignar": "bg-red-50    text-red-600    border-red-200",
  "En proceso": "bg-blue-50   text-blue-700   border-blue-200",
  Cerrado: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const AC = {
  blue: "bg-blue-50    border-blue-200    text-blue-700",
  red: "bg-red-50     border-red-200     text-red-600",
  amber: "bg-amber-50   border-amber-200   text-amber-700",
  emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
};

export default function CabineroDashboard({ usuario }) {
  const navigate = useNavigate();
  const h = new Date().getHours();
  const saludo =
    h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="h-full flex flex-col gap-5 p-6 bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-gray-400">
            {saludo},{" "}
            <span className="font-semibold text-[#13193a]">
              {usuario?.nombre ?? "Cabinero"}
            </span>
          </p>
          <h1 className="text-2xl font-bold text-[#13193a] mt-0.5">
            Cabina de siniestros
          </h1>
          <p className="text-xs text-gray-400 mt-0.5 capitalize">{HOY}</p>
        </div>
        {/* CTA principal */}
        <button
          onClick={() => navigate("/siniestros/nuevo")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all shadow-lg shadow-[#13193a]/15 shrink-0"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPIS.map((k) => (
          <button
            key={k.label}
            onClick={() => navigate(k.path)}
            className={`${AC[k.accent]} border rounded-2xl p-4 text-left hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-150`}
          >
            <p className="text-3xl font-bold tabular-nums">{k.value}</p>
            <p className="text-xs font-semibold text-[#13193a] mt-1.5 leading-tight">
              {k.label}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">{k.sub}</p>
          </button>
        ))}
      </div>

      {/* Tabla compacta últimos siniestros */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0">
          <p className="text-sm font-bold text-[#13193a]">Siniestros del día</p>
          <button
            onClick={() => navigate("/siniestros")}
            className="text-xs text-blue-600 font-semibold hover:underline"
          >
            Ver todos →
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-sm">
              <tr className="border-b border-gray-100">
                {["Folio", "Asegurado", "Tipo", "Ajustador", "Estatus", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ULTIMOS.map((s, i) => (
                <tr
                  key={i}
                  onClick={() => navigate("/siniestros")}
                  className={`hover:bg-gray-50/60 transition-colors cursor-pointer ${s.estatus === "Sin asignar" ? "bg-red-50/30" : ""}`}
                >
                  <td className="px-5 py-3.5 font-mono text-xs font-bold text-[#13193a]">
                    {s.folio}
                  </td>
                  <td className="px-5 py-3.5 text-xs font-semibold text-gray-700">
                    {s.asegurado}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">
                    {s.tipo}
                  </td>
                  <td className="px-5 py-3.5 text-xs">
                    {s.ajustador ? (
                      <span className="text-gray-700 font-medium">
                        {s.ajustador}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-red-500 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                        Sin asignar
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_CLS[s.estatus] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}
                    >
                      {s.estatus}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
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
    </div>
  );
}
