// ============================================================
// src/features/ajustador/index.jsx
//
// REGLA DE ORO DEL SCROLL MOBILE:
//   AppLayout <main> tiene overflow-y-auto → es el ÚNICO scroller
//   En mobile NINGÚN hijo usa altura fija ni overflow interno
//   En desktop (md:) sí usamos flex layout con overflow propio
// ============================================================
import { useState, useCallback } from "react";
import { StepBar } from "./shared";
import ListaSiniestros from "./ListaSiniestros";
import ConfirmarArribo from "./ConfirmarArribo";
import CapturaDatosEvidencia from "./CapturaEvidencia";
import GenerarDocumentos from "./GenerarDocumentos";

const NOMBRE_PASO = [
  "Confirmar Arribo",
  "Datos, Evidencia y Daños",
  "Generar Documentos",
];

function Exito({ siniestro, onVolver }) {
  return (
    <div className="flex flex-col items-center justify-center px-8 text-center py-16">
      <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center mb-5">
        <svg
          className="w-10 h-10 text-emerald-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-[#13193a] mb-2">
        Siniestro atendido
      </h2>
      <p className="text-gray-400 text-sm mb-1">
        Folio{" "}
        <span className="font-mono font-bold text-[#13193a]">
          {siniestro.id}
        </span>{" "}
        cerrado correctamente.
      </p>
      <p className="text-gray-400 text-sm mb-8">
        Los documentos fueron enviados al cabinero.
      </p>
      <button
        onClick={onVolver}
        className="w-full max-w-xs py-3.5 rounded-2xl bg-[#13193a] text-white font-bold text-sm hover:bg-[#1e2a50] transition-all"
      >
        Volver a Siniestros
      </button>
    </div>
  );
}

export default function AjustadorSiniestros() {
  const [vista, setVista] = useState("lista");
  const [siniestro, setSiniestro] = useState(null);
  const [paso, setPaso] = useState(0);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "instant" });

  const abrirSiniestro = useCallback((s) => {
    setSiniestro(s);
    setPaso(0);
    setVista("detalle");
    scrollTop();
  }, []);

  const handleVolver = () => {
    if (paso > 0) {
      setPaso((p) => p - 1);
      scrollTop();
      return;
    }
    setVista("lista");
    setSiniestro(null);
    scrollTop();
  };

  const handleNext = () => {
    setPaso((p) => p + 1);
    scrollTop();
  };
  const handleFinalizar = () => {
    setVista("exito");
    scrollTop();
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════
          DESKTOP (md+): layout fijo, scroll interno
      ═══════════════════════════════════════════════ */}
      <div className="hidden md:flex md:h-full md:overflow-hidden bg-gray-50">
        {/* Columna lista */}
        <div className="flex flex-col w-80 lg:w-96 shrink-0 bg-white border-r border-gray-100 overflow-hidden">
          <ListaSiniestros onAtender={abrirSiniestro} desktop />
        </div>

        {/* Columna detalle */}
        {vista === "lista" && (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
                />
              </svg>
            </div>
            <p className="text-[#13193a] font-semibold text-sm">
              Selecciona un siniestro
            </p>
            <p className="text-gray-400 text-xs mt-1 max-w-xs">
              Elige un caso para comenzar el proceso de atención.
            </p>
          </div>
        )}

        {(vista === "detalle" || vista === "exito") && siniestro && (
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {vista === "exito" ? (
              <Exito
                siniestro={siniestro}
                onVolver={() => {
                  setVista("lista");
                  setSiniestro(null);
                }}
              />
            ) : (
              <>
                <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 shrink-0">
                  <button
                    onClick={handleVolver}
                    className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#13193a] transition-all shrink-0"
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
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#13193a] truncate">
                      {NOMBRE_PASO[paso]}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {siniestro.id} · {siniestro.asegurado}
                    </p>
                  </div>
                </div>
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80 shrink-0">
                  <StepBar paso={paso} />
                </div>
                {/* Desktop: overflow-y-auto propio porque tiene altura fija del flex */}
                <div className="flex-1 overflow-y-auto min-h-0">
                  {paso === 0 && (
                    <ConfirmarArribo
                      siniestro={siniestro}
                      onConfirmar={handleNext}
                    />
                  )}
                  {paso === 1 && (
                    <CapturaDatosEvidencia
                      siniestro={siniestro}
                      onSiguiente={handleNext}
                    />
                  )}
                  {paso === 2 && (
                    <GenerarDocumentos
                      siniestro={siniestro}
                      onFinalizar={handleFinalizar}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          MOBILE (<md): vistas apiladas, SIN altura fija
          El scroll lo maneja el <main> del AppLayout
      ═══════════════════════════════════════════════ */}
      <div className="md:hidden">
        {vista === "lista" && <ListaSiniestros onAtender={abrirSiniestro} />}

        {vista === "detalle" && siniestro && (
          <div className="bg-white min-h-screen">
            {/* Header pegado arriba mientras haces scroll */}
            <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-4 border-b border-gray-100 bg-white">
              <button
                onClick={handleVolver}
                className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 shrink-0"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#13193a] truncate">
                  {NOMBRE_PASO[paso]}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {siniestro.id} · {siniestro.asegurado}
                </p>
              </div>
            </div>
            {/* StepBar pegado bajo el header */}
            <div className="sticky top-[65px] z-10 px-4 py-3 border-b border-gray-100 bg-white/95">
              <StepBar paso={paso} />
            </div>

            {/* Contenido: fluye libremente. Los componentes NO usan overflow ni h-full */}
            {paso === 0 && (
              <ConfirmarArribo siniestro={siniestro} onConfirmar={handleNext} />
            )}
            {paso === 1 && (
              <CapturaDatosEvidencia
                siniestro={siniestro}
                onSiguiente={handleNext}
              />
            )}
            {paso === 2 && (
              <GenerarDocumentos
                siniestro={siniestro}
                onFinalizar={handleFinalizar}
              />
            )}
          </div>
        )}

        {vista === "exito" && siniestro && (
          <Exito
            siniestro={siniestro}
            onVolver={() => {
              setVista("lista");
              setSiniestro(null);
            }}
          />
        )}
      </div>
    </>
  );
}
