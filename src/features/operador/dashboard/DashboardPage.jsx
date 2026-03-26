// ============================================================
// src/features/operador/dashboard/DashboardPage.jsx
// Orquestador del dashboard — solo composición, sin lógica pesada
// ============================================================
import { useNavigate } from "react-router-dom";
import MetricCard from "./MetricCard";
import PolizasRecientes from "./PolizasRecientes";
import CotizacionesPendientes from "./CotizacionesPendientes";
import PorVencer from "./PorVencer";

const OFICINA = "COFISEM AV. E.ZAPATA";

const METRICAS = [
  {
    label: "Pólizas emitidas hoy", value: 8,        sub: "+2 vs ayer",       up: true,  accent: "blue",
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>,
    path: "/polizas",
  },
  {
    label: "Cotizaciones pendientes", value: 3,     sub: "Sin tramitar",     up: null,  accent: "amber",
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.616 4.5 4.667V19.5a1.5 1.5 0 001.5 1.5h12a1.5 1.5 0 001.5-1.5V4.667c0-1.051-.807-1.967-1.907-2.095A48.507 48.507 0 0012 2.25z"/></svg>,
    path: "/cotizaciones",
  },
  {
    label: "Cobrado hoy",           value: "$13,573", sub: "Efectivo + vales", up: true,  accent: "emerald",
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"/></svg>,
    path: "/corte-diario",
  },
  {
    label: "Pólizas por vencer",    value: 5,        sub: "Próximos 7 días",  up: false, accent: "red",
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>,
    path: "/polizas",
  },
];

const HOY = new Date().toLocaleDateString("es-MX", {
  weekday: "long", day: "2-digit", month: "long", year: "numeric",
});

export default function DashboardPage({ usuario }) {
  const navigate = useNavigate();
  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-sm text-gray-400">
            {saludo}, <span className="font-semibold text-[#13193a]">{usuario?.nombre ?? "Operador"}</span>
          </p>
          <h1 className="text-2xl font-bold text-[#13193a] mt-0.5">Resumen de la oficina</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <p className="text-xs text-gray-500 font-medium">{OFICINA} · {HOY}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/cotizaciones/nueva")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#13193a] text-white text-sm font-semibold hover:bg-[#1e2a50] transition-all shadow-sm shadow-[#13193a]/15"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nueva cotización
          </button>
          <button
            onClick={() => navigate("/corte-diario")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
          >
            Corte del día
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICAS.map((m) => (
          <MetricCard key={m.label} {...m} onClick={() => navigate(m.path)} />
        ))}
      </div>

      {/* Pólizas recientes + Cotizaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <PolizasRecientes onVerTodas={() => navigate("/polizas")} />
        </div>
        <div>
          <CotizacionesPendientes
            onVerTodas={() => navigate("/cotizaciones")}
            onTramitar={(cot) => navigate(`/cotizaciones/${cot.id}/tramitar`)}
          />
        </div>
      </div>

      {/* Por vencer */}
      <PorVencer onRenovar={(p) => navigate(`/polizas/${p.poliza}/renovar`)} />
    </div>
  );
}
