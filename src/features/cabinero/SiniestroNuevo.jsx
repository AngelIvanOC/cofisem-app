import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { detectarTipo, buscarPoliza, TIPO_ICON, TIPO_LABEL } from "./utils/buscarPoliza";
import { crearSiniestro } from "../../services/siniestros";
import PolizaCard from "./components/PolizaCard";
import FormSiniestro from "./components/FormSiniestro";
import {
  AlertTriangle, Check, ChevronLeft, Loader2, Search,
} from "lucide-react";

const MAX_RECIENTES = 5;
const busqKey = (uid) => `cofisem_sn_busq_${uid}`;

function getRecientes(uid) {
  try { return JSON.parse(localStorage.getItem(busqKey(uid)) ?? "[]"); } catch { return []; }
}
function saveReciente(uid, valor, tipo) {
  const prev = getRecientes(uid).filter((r) => r.valor !== valor);
  localStorage.setItem(
    busqKey(uid),
    JSON.stringify([{ valor, tipo: tipo ?? "poliza", ts: Date.now() }, ...prev].slice(0, MAX_RECIENTES)),
  );
}

export default function SiniestroNuevo({ usuario }) {
  const navigate  = useNavigate();
  const inputRef  = useRef(null);
  const uid       = usuario?.id ?? "anon";

  const [paso,         setPaso]         = useState("buscar");
  const [query,        setQuery]        = useState("");
  const [tipoDetect,   setTipoDetect]   = useState(null);
  const [buscando,     setBuscando]     = useState(false);
  const [poliza,       setPoliza]       = useState(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [recientes,    setRecientes]    = useState([]);

  useEffect(() => { setRecientes(getRecientes(uid)); }, [uid]);

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
      const tipo = detectarTipo(query.trim()) ?? "poliza";
      saveReciente(uid, query.trim(), tipo);
      setRecientes(getRecientes(uid));
      setPoliza(result);
      setPaso("confirmar");
    } else {
      setNoEncontrado(true);
      inputRef.current?.select();
    }
  };

  const handleSubmit = async (form) => {
    setLoading(true);
    try {
      await crearSiniestro({
        polizaId:     poliza.id,
        clienteId:    poliza.clienteId,
        folio:        form.nroReporte,
        form,
        reportadoPor: usuario?.id ?? null,
      });
      navigate("/gaman/siniestros");
    } catch (e) {
      alert("Error al guardar el siniestro: " + e.message);
    } finally {
      setLoading(false);
    }
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
          <ChevronLeft className="w-4 h-4" />
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
                      <Check className="w-3.5 h-3.5" />
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
                  <Loader2 className="animate-spin w-4 h-4" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Buscar
                </>
              )}
            </button>
          </div>

          {noEncontrado && (
            <p className="mt-3 text-sm text-red-500 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              No se encontró ninguna póliza. Verifica el dato e intenta de nuevo.
            </p>
          )}

          {recientes.length > 0 && (
            <div className="mt-5">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                Búsquedas recientes
              </p>
              <div className="flex flex-wrap gap-2">
                {recientes.map((r) => (
                  <button
                    key={r.valor}
                    onClick={() => {
                      setQuery(r.valor);
                      setTipoDetect(r.tipo);
                      setNoEncontrado(false);
                    }}
                    className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-[#13193a]/30 hover:text-[#13193a] transition-all flex items-center gap-1.5"
                  >
                    <span>{TIPO_ICON[r.tipo]}</span>
                    <span className="font-medium text-gray-400">{TIPO_LABEL[r.tipo]}</span>
                    <span className="text-gray-300">—</span>
                    <span className="font-mono">{r.valor}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
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
