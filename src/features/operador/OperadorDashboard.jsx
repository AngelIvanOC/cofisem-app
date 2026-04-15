// ============================================================
// src/features/operador/OperadorDashboard.jsx
// ============================================================
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const OFICINA = "COFISEM AV. E.ZAPATA";

const HOY = new Date().toLocaleDateString("es-MX", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

// ── Mini spark bar ────────────────────────────────────────────
function SparkBar({ data, color = "#13193a" }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm transition-all"
          style={{
            height: `${(v / max) * 100}%`,
            background: color,
            opacity: i === data.length - 1 ? 1 : 0.35,
          }}
        />
      ))}
    </div>
  );
}

// ── Poliza row ────────────────────────────────────────────────
const STATUS = {
  Vigente: "bg-emerald-50 text-emerald-700",
  "Por vencer": "bg-amber-50 text-amber-700",
  Cancelada: "bg-gray-100 text-gray-500",
};

const ULTIMAS = [
  {
    poliza: "3413241",
    asegurado: "Angel Ivan Ortega",
    cobertura: "APP (UBER/DIDI)",
    prima: "$3,142",
    hora: "09:15",
    estatus: "Vigente",
  },
  {
    poliza: "3413198",
    asegurado: "María García López",
    cobertura: "TAXI BÁSICA 2500",
    prima: "$2,200",
    hora: "10:42",
    estatus: "Vigente",
  },
  {
    poliza: "3413167",
    asegurado: "Roberto Díaz Ramos",
    cobertura: "SERV. PÚB. GAMAN",
    prima: "$2,548",
    hora: "11:30",
    estatus: "Vigente",
  },
  {
    poliza: "3411002",
    asegurado: "Carmen López Vargas",
    cobertura: "TAXI BÁSICA 2500",
    prima: "$2,200",
    hora: "13:05",
    estatus: "Por vencer",
  },
];

const COTIZACIONES = [
  {
    id: "COT-0341",
    cliente: "Juan Pérez",
    cobertura: "TAXI BÁSICA 2500",
    prima: "$2,200",
    fecha: "Hoy 10:15",
  },
  {
    id: "COT-0340",
    cliente: "Rosa Mendoza",
    cobertura: "SERV. PÚB. 50/50",
    prima: "$2,548",
    fecha: "Ayer 16:30",
  },
  {
    id: "COT-0339",
    cliente: "Pedro Ramos",
    cobertura: "APP (UBER/DIDI)",
    prima: "$3,142",
    fecha: "15/03 09:00",
  },
];

const POR_VENCER = [
  { poliza: "3411002", asegurado: "Carmen López", dias: 3 },
  { poliza: "3410888", asegurado: "José Martínez", dias: 5 },
  { poliza: "3410755", asegurado: "Ana Gutiérrez", dias: 7 },
];

const SPARK_POLIZAS = [3, 5, 4, 7, 6, 8, 8];
const SPARK_COBRO = [4200, 6800, 5500, 9200, 7800, 11400, 13573];

export default function OperadorDashboard({ usuario }) {
  const navigate = useNavigate();
  const h = new Date().getHours();
  const saludo =
    h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="h-full overflow-y-auto bg-[#f7f8fa]">
      <div className="max-w-7xl mx-auto p-6 space-y-5">
        {/* ── TOP: saludo + acciones ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-gray-400 capitalize">{HOY}</p>
            <h1 className="text-2xl font-bold text-[#13193a] mt-0.5">
              {saludo},{" "}
              <span className="font-light">
                {usuario?.nombre ?? "Operador"}
              </span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              {OFICINA}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/cotizaciones/nueva")}
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
              Nueva cotización
            </button>
            <button
              onClick={() => navigate("/corte-diario")}
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
                  d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z"
                />
              </svg>
              Corte del día
            </button>
          </div>
        </div>

        {/* ── FILA 1: KPIs ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Pólizas emitidas hoy",
              value: "8",
              delta: "+2 vs ayer",
              up: true,
              spark: SPARK_POLIZAS,
              color: "#13193a",
              path: "/polizas",
            },
            {
              label: "Cobrado hoy",
              value: "$13,573",
              delta: "+$2,100 vs ayer",
              up: true,
              spark: SPARK_COBRO,
              color: "#059669",
              path: "/corte-diario",
            },
            {
              label: "Cotizaciones guardadas",
              value: "3",
              delta: "Pendientes",
              up: null,
              spark: [1, 2, 3, 2, 4, 3, 3],
              color: "#d97706",
              path: "/cotizaciones",
            },
            {
              label: "Pólizas por vencer",
              value: "5",
              delta: "Próximos 7 días",
              up: false,
              spark: [2, 1, 3, 2, 4, 3, 5],
              color: "#ef4444",
              path: "/polizas",
            },
          ].map((k) => (
            <button
              key={k.label}
              onClick={() => navigate(k.path)}
              className="bg-white rounded-2xl border border-gray-100 p-4 text-left hover:shadow-md hover:border-gray-200 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs text-gray-400 font-medium leading-snug">
                  {k.label}
                </p>
                <svg
                  className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 transition-colors shrink-0 ml-2"
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
              </div>
              <p className="text-2xl font-bold text-[#13193a] tabular-nums mb-2">
                {k.value}
              </p>
              <SparkBar data={k.spark} color={k.color} />
              <p
                className={`text-[11px] font-medium mt-2 flex items-center gap-1 ${
                  k.up === true
                    ? "text-emerald-600"
                    : k.up === false
                      ? "text-red-500"
                      : "text-amber-600"
                }`}
              >
                {k.up === true ? "↑" : k.up === false ? "↓" : "·"} {k.delta}
              </p>
            </button>
          ))}
        </div>

        {/* ── FILA 2: Pólizas del día + Cotizaciones ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Pólizas emitidas — 3/5 */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <p className="text-sm font-bold text-[#13193a]">
                Pólizas emitidas hoy
              </p>
              <button
                onClick={() => navigate("/polizas")}
                className="text-xs text-blue-500 font-semibold hover:underline"
              >
                Ver todas
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {ULTIMAS.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#13193a]/6 flex items-center justify-center shrink-0">
                    <svg
                      className="w-4 h-4 text-[#13193a]"
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
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#13193a] truncate">
                      {p.asegurado}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">
                      {p.cobertura} · {p.hora}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-emerald-700">
                      {p.prima}
                    </p>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS[p.estatus]}`}
                    >
                      {p.estatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cotizaciones — 2/5 */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <p className="text-sm font-bold text-[#13193a]">
                Cotizaciones guardadas
              </p>
              <button
                onClick={() => navigate("/cotizaciones")}
                className="text-xs text-blue-500 font-semibold hover:underline"
              >
                Ver todas
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {COTIZACIONES.map((c, i) => (
                <div
                  key={i}
                  className="px-5 py-3 hover:bg-gray-50/60 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[11px] font-mono font-bold text-[#13193a]">
                      {c.id}
                    </p>
                    <p className="text-xs font-bold text-emerald-700">
                      {c.prima}
                    </p>
                  </div>
                  <p className="text-xs font-medium text-gray-700">
                    {c.cliente}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-[10px] text-gray-400 truncate">
                      {c.cobertura}
                    </p>
                    <button
                      onClick={() => navigate(`/cotizaciones`)}
                      className="text-[10px] font-bold text-[#13193a] border border-[#13193a]/20 px-2 py-0.5 rounded-lg hover:bg-[#13193a]/5 transition-all shrink-0 ml-2"
                    >
                      Tramitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FILA 3: Por vencer + Resumen cobro ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Por vencer */}
          <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-amber-50 bg-amber-50/50">
              <svg
                className="w-4 h-4 text-amber-500 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
              <p className="text-sm font-bold text-amber-800">
                Próximas a vencer
              </p>
            </div>
            <div className="divide-y divide-amber-50/50">
              {POR_VENCER.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div>
                    <p className="text-xs font-semibold text-[#13193a]">
                      {p.asegurado}
                    </p>
                    <p className="text-[10px] font-mono text-gray-400">
                      {p.poliza}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      p.dias <= 3
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {p.dias}d
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen de cobro hoy */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-bold text-[#13193a] mb-4">
              Resumen de cobro — hoy
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Efectivo",
                  value: "$10,893",
                  pct: 80,
                  color: "#13193a",
                },
                {
                  label: "Transferencias",
                  value: "$1,780",
                  pct: 13,
                  color: "#3b82f6",
                },
                { label: "Vales", value: "$900", pct: 7, color: "#d97706" },
              ].map((f) => (
                <div key={f.label} className="text-center">
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <svg
                      className="w-full h-full -rotate-90"
                      viewBox="0 0 36 36"
                    >
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke="#f3f4f6"
                        strokeWidth="3.5"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke={f.color}
                        strokeWidth="3.5"
                        strokeDasharray={`${f.pct * 0.879} 87.9`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <p className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[#13193a]">
                      {f.pct}%
                    </p>
                  </div>
                  <p className="text-xs font-bold text-[#13193a]">{f.value}</p>
                  <p className="text-[10px] text-gray-400">{f.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500">Total cobrado hoy</p>
              <p className="text-lg font-black text-[#13193a] tabular-nums">
                $13,573
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
