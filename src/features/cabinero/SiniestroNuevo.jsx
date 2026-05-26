import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { detectarTipo, buscarPoliza, TIPO_ICON, TIPO_LABEL } from "./utils/buscarPoliza";
import PolizaCard from "./components/PolizaCard";
import FormSiniestro from "./components/FormSiniestro";

export default function SiniestroNuevo() {
  const navigate  = useNavigate();
  const inputRef  = useRef(null);

  const [paso,         setPaso]         = useState("buscar");
  const [query,        setQuery]        = useState("");
  const [tipoDetect,   setTipoDetect]   = useState(null);
  const [buscando,     setBuscando]     = useState(false);
  const [poliza,       setPoliza]       = useState(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [loading,      setLoading]      = useState(false);

  const handleQueryChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    setNoEncontrado(false);
    setTipoDetect(v.trim() ? detectarTipo(v) : null);
  };

  const handleBuscar = async () => {
    if (!query.trim() || buscando) return;
    setBuscando(true);
    setNoEncontrado(false);
    const result = await buscarPoliza(query);
    setBuscando(false);
    if (result) {
      setPoliza(result);
      setPaso("confirmar");
    } else {
      setNoEncontrado(true);
      inputRef.current?.select();
    }
  };

  const handleSubmit = async (form) => {
    setLoading(true);
    // TODO: supabase.from("siniestros").insert({ poliza_id: poliza.id, ...form })
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    navigate("/gaman/siniestros");
  };

  const resetBusqueda = () => {
    setPoliza(null);
    setQuery("");
    setTipoDetect(null);
    setNoEncontrado(false);
    setPaso("buscar");
  };

  return (
    <div className="p-6 min-h-full bg-gray-50">
      {/* Header + indicador de pasos */}
      <div className="flex items-start gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-[#13193a] hover:border-gray-300 transition-all shrink-0 mt-0.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>

        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[#13193a]">Reportar Siniestro</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {paso !== "formulario"
              ? "Paso 1 de 2 — Busca y confirma la póliza"
              : "Paso 2 de 2 — Completa los datos del siniestro"}
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 shrink-0 mt-1">
          {[
            { n: 1, label: "Póliza",    done: paso === "formulario" },
            { n: 2, label: "Siniestro", done: false                  },
          ].map((s, i) => {
            const isActive =
              (i === 0 && paso !== "formulario") ||
              (i === 1 && paso === "formulario");
            return (
              <div key={s.n} className="flex items-center gap-2">
                {i > 0 && (
                  <div className={`w-8 h-px ${s.done || isActive ? "bg-[#13193a]" : "bg-gray-200"}`} />
                )}
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      s.done
                        ? "bg-emerald-500 text-white"
                        : isActive
                          ? "bg-[#13193a] text-white"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {s.done ? (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    ) : s.n}
                  </div>
                  <span className={`text-xs font-medium ${isActive ? "text-[#13193a]" : "text-gray-400"}`}>
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Paso 1: Buscador */}
      {paso === "buscar" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-[#13193a] mb-1">Buscar póliza</h2>
          <p className="text-xs text-gray-400 mb-5">
            Ingresa el <strong className="text-gray-600">número de póliza</strong>,{" "}
            <strong className="text-gray-600">No. de serie</strong>,{" "}
            <strong className="text-gray-600">placas</strong> o{" "}
            <strong className="text-gray-600">número de reporte</strong>. El sistema detecta automáticamente el tipo.
          </p>

          <div className="flex gap-3">
            <div className="relative flex-1">
              {tipoDetect && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none z-10">
                  <span>{TIPO_ICON[tipoDetect]}</span>
                  <span className="text-xs font-bold text-[#13193a] bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                    {TIPO_LABEL[tipoDetect]}
                  </span>
                </div>
              )}
              <input
                ref={inputRef}
                value={query}
                onChange={handleQueryChange}
                onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
                placeholder="Ej: 01250100001024-01 · A757LTS · 3N1EB31S09K323748"
                className={[
                  "w-full h-11 rounded-xl border-2 text-sm text-gray-700 placeholder-gray-300 bg-white",
                  "focus:outline-none focus:ring-0 transition-all",
                  tipoDetect ? "pl-32 pr-4" : "px-4",
                  noEncontrado
                    ? "border-red-300 focus:border-red-400"
                    : "border-gray-200 focus:border-[#13193a]",
                ].join(" ")}
              />
            </div>
            <button
              onClick={handleBuscar}
              disabled={buscando || !query.trim()}
              className="h-11 px-6 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-semibold transition-all disabled:opacity-40 flex items-center gap-2 shrink-0"
            >
              {buscando ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Buscando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
                  </svg>
                  Buscar
                </>
              )}
            </button>
          </div>

          {noEncontrado && (
            <p className="mt-3 text-sm text-red-500 flex items-center gap-1.5">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374l7.048-12.14c.866-1.5 3.032-1.5 3.898 0l7.048 12.14zM12 15.75h.007v.008H12v-.008z"/>
              </svg>
              No se encontró ninguna póliza. Verifica el dato e intenta de nuevo.
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { label: "🔑 Póliza",    ejemplo: "01250100001024-01"  },
              { label: "🚗 Placas",    ejemplo: "A757LTS"             },
              { label: "🔢 No. Serie", ejemplo: "3N1EB31S09K323748"   },
              { label: "📋 Reporte",   ejemplo: "250423"              },
            ].map((h) => (
              <button
                key={h.label}
                onClick={() => {
                  setQuery(h.ejemplo);
                  setTipoDetect(detectarTipo(h.ejemplo));
                  setNoEncontrado(false);
                }}
                className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-[#13193a]/30 hover:text-[#13193a] transition-all"
              >
                {h.label} — <span className="font-mono">{h.ejemplo}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {paso === "confirmar" && poliza && (
        <PolizaCard
          poliza={poliza}
          onConfirmar={() => setPaso("formulario")}
          onLimpiar={resetBusqueda}
        />
      )}

      {paso === "formulario" && poliza && (
        <FormSiniestro
          poliza={poliza}
          onBack={() => setPaso("confirmar")}
          onSubmit={handleSubmit}
          loading={loading}
        />
      )}
    </div>
  );
}
