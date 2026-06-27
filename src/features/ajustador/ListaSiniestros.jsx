// ============================================================
// src/features/ajustador/ListaSiniestros.jsx
// Estructura: flex-col h-full
//   → Header (shrink-0) — métricas y tabs
//   → Cards  (flex-1 overflow-y-auto) — scroll aquí
// ============================================================
import { useState, useEffect } from "react";
import { ESTATUS_CLS } from "./shared";
import { fetchSiniestrosAjustador } from "../../services/evidencias";
import { getState } from "../../auth";

export default function ListaSiniestros({ onAtender }) {
  const [tab,        setTab]        = useState("activos");
  const [siniestros, setSiniestros] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    const uid = getState().usuario?.id;
    if (!uid) { setLoading(false); return; }

    fetchSiniestrosAjustador(uid)
      .then(setSiniestros)
      .catch((e) => setError(e.message ?? "Error al cargar siniestros"))
      .finally(() => setLoading(false));
  }, []);

  const esCerrado = (s) => s.estatus === "Atendido" || s.estatus === "Cerrado";

  const filtrados = tab === "todos"
    ? siniestros
    : siniestros.filter((s) => !esCerrado(s));

  // Métricas dinámicas
  const total     = siniestros.filter((s) => !esCerrado(s)).length;
  const pendArr   = siniestros.filter((s) => s.estatus === "Pendiente de arribo").length;
  const enProceso = siniestros.filter((s) => s.estatus === "En proceso").length;

  const METRICAS = [
    { label: "Activos",      value: total,     color: "text-[#13193a]", bg: "bg-[#13193a]/8" },
    { label: "Pend. arribo", value: pendArr,   color: "text-amber-600", bg: "bg-amber-50"    },
    { label: "En proceso",   value: enProceso, color: "text-blue-600",  bg: "bg-blue-50"     },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header fijo */}
      <div className="shrink-0 px-4 pt-5 pb-4 border-b border-gray-100 bg-white">
        <h1 className="text-xl font-bold text-[#13193a]">Siniestros Asignados</h1>
        <div className="flex gap-2 mt-3">
          {METRICAS.map((m) => (
            <div key={m.label} className={`flex-1 rounded-xl p-3 ${m.bg}`}>
              <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
              <p className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-1 mt-4 bg-gray-100 rounded-xl p-1">
          {[{ k: "activos", l: "Activos" }, { k: "todos", l: "Todos" }].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={[
                "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all",
                tab === t.k ? "bg-white text-[#13193a] shadow-sm" : "text-gray-500",
              ].join(" ")}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {/* Cards scrolleables */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

        {/* Estado carga */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-2 border-[#13193a]/20 border-t-[#13193a] rounded-full animate-spin" />
            <p className="text-xs text-gray-400">Cargando siniestros...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-center">
            <p className="text-sm font-semibold text-red-600">No se pudieron cargar los siniestros</p>
            <p className="text-xs text-red-400 mt-1">{error}</p>
          </div>
        )}

        {/* Sin datos */}
        {!loading && !error && filtrados.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#13193a]">Sin siniestros activos</p>
            <p className="text-xs text-gray-400">No tienes casos asignados por el momento.</p>
          </div>
        )}

        {/* Lista de siniestros */}
        {!loading && !error && filtrados.map((s) => {
          const atendido  = esCerrado(s);
          const tieneUbic = !!s.ubicacion && !!s.coords;
          const mapsUrl   = tieneUbic ? `https://maps.google.com/?q=${s.coords.lat},${s.coords.lng}` : null;

          return (
            <div
              key={s.id}
              className={[
                "bg-white rounded-2xl border p-4 transition-all",
                atendido ? "border-gray-100 opacity-60" : "border-gray-200 shadow-sm",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-mono text-xs font-bold text-[#13193a]">{s.numero_siniestro}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ESTATUS_CLS[s.estatus] ?? "bg-gray-100 text-gray-600 border border-gray-200"}`}>
                      {s.estatus}
                    </span>
                  </div>
                  <p className="font-bold text-[#13193a] text-sm">{s.asegurado}</p>
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
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold">
                    <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </div>
                    <span className="truncate">{s.ubicacion}</span>
                  </a>
                ) : s.ubicacion ? (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </div>
                    <span className="truncate">{s.ubicacion}</span>
                  </div>
                ) : s.telefono ? (
                  <a href={`tel:${s.telefono}`} className="flex items-center gap-1.5 text-xs font-semibold">
                    <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.338c0-.552.196-1.078.548-1.48l.818-.888a1.5 1.5 0 012.26.093l1.84 2.305a1.5 1.5 0 01-.043 1.925l-.655.755a.75.75 0 00-.119.845 11.228 11.228 0 005.26 5.26.75.75 0 00.845-.118l.755-.655a1.5 1.5 0 011.925-.043l2.305 1.84a1.5 1.5 0 01.093 2.26l-.888.818a2.25 2.25 0 01-1.48.548c-6.623 0-12-5.377-12-12z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-amber-600">{s.telefono}</p>
                      <p className="text-[10px] text-gray-400 font-normal">Sin ubicación registrada</p>
                    </div>
                  </a>
                ) : null}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-2 border-t border-gray-50">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {s.tiempo}
              </div>
            </div>
          );
        })}

        <div className="h-4" />
      </div>
    </div>
  );
}
