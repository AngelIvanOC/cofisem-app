// ============================================================
// src/features/ajustador/ListaSiniestros.jsx
// Estructura: flex-col h-full
//   → Header (shrink-0) — métricas y tabs
//   → Cards  (flex-1 overflow-y-auto) — scroll aquí
// ============================================================
import { useState } from "react";
import { SINIESTROS_MOCK, METRICAS, ESTATUS_CLS } from "./shared";

export default function ListaSiniestros({ onAtender }) {
  const [tab, setTab] = useState("activos");

  const filtrados =
    tab === "todos"
      ? SINIESTROS_MOCK
      : SINIESTROS_MOCK.filter((s) => s.estatus !== "Atendido");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header fijo */}
      <div className="shrink-0 px-4 pt-5 pb-4 border-b border-gray-100 bg-white">
        <h1 className="text-xl font-bold text-[#13193a]">
          Siniestros Asignados
        </h1>
        <div className="flex gap-2 mt-3">
          {METRICAS.map((m) => (
            <div key={m.label} className={`flex-1 rounded-xl p-3 ${m.bg}`}>
              <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
              <p className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5">
                {m.label}
              </p>
            </div>
          ))}
        </div>
        <div className="flex gap-1 mt-4 bg-gray-100 rounded-xl p-1">
          {[
            { k: "activos", l: "Activos" },
            { k: "todos", l: "Todos" },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={[
                "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all",
                tab === t.k
                  ? "bg-white text-[#13193a] shadow-sm"
                  : "text-gray-500",
              ].join(" ")}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {/* Cards scrolleables */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {filtrados.map((s) => {
          const atendido = s.estatus === "Atendido";
          const tieneUbic = !!s.ubicacion && !!s.coords;
          const mapsUrl = tieneUbic
            ? `https://maps.google.com/?q=${s.coords.lat},${s.coords.lng}`
            : null;

          return (
            <div
              key={s.id}
              className={[
                "bg-white rounded-2xl border p-4 transition-all",
                atendido
                  ? "border-gray-100 opacity-60"
                  : "border-gray-200 shadow-sm",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-mono text-xs font-bold text-[#13193a]">
                      {s.id}
                    </p>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ESTATUS_CLS[s.estatus] ?? "bg-gray-100 text-gray-600 border border-gray-200"}`}
                    >
                      {s.estatus}
                    </span>
                  </div>
                  <p className="font-bold text-[#13193a] text-sm">
                    {s.asegurado}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">{s.vehiculo}</p>
                </div>
                {!atendido && (
                  <button
                    onClick={() => onAtender(s)}
                    className="shrink-0 px-4 py-2 rounded-xl bg-[#13193a] text-white text-xs font-bold hover:bg-[#1e2a50] active:scale-95 transition-all shadow-sm"
                  >
                    Atender
                  </button>
                )}
              </div>

              <div className="mb-2">
                {tieneUbic ? (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold"
                  >
                    <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                        />
                      </svg>
                    </div>
                    <span className="truncate">{s.ubicacion}</span>
                  </a>
                ) : (
                  <a
                    href={`tel:${s.telefono}`}
                    className="flex items-center gap-1.5 text-xs font-semibold"
                  >
                    <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                      <svg
                        className="w-3.5 h-3.5 text-amber-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 6.338c0-.552.196-1.078.548-1.48l.818-.888a1.5 1.5 0 012.26.093l1.84 2.305a1.5 1.5 0 01-.043 1.925l-.655.755a.75.75 0 00-.119.845 11.228 11.228 0 005.26 5.26.75.75 0 00.845-.118l.755-.655a1.5 1.5 0 011.925-.043l2.305 1.84a1.5 1.5 0 01.093 2.26l-.888.818a2.25 2.25 0 01-1.48.548c-6.623 0-12-5.377-12-12z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-amber-600">{s.telefono}</p>
                      <p className="text-[10px] text-gray-400 font-normal">
                        Sin ubicación
                      </p>
                    </div>
                  </a>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-2 border-t border-gray-50">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {s.tiempo}
              </div>
            </div>
          );
        })}
        {/* Padding de seguridad al final */}
        <div className="h-4" />
      </div>
    </div>
  );
}
