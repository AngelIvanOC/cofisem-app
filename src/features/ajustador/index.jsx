// ============================================================
// src/features/ajustador/index.jsx
//
// SOLUCIÓN SCROLL DEFINITIVA:
//   Este componente es su propio contenedor scrolleable.
//   Usa `height: calc(100vh - VAR)` donde VAR = altura del
//   header/nav del AppLayout.
//   Si el AppLayout ya provee h-full, usamos h-full directamente.
//   En cualquier caso, ESTE componente maneja su propio scroll.
//   Los hijos NO manejan scroll — son bloques normales que
//   simplemente fluyen dentro del único overflow-y-auto.
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

// Altura del nav mobile del AppLayout (ajustar si cambia)
// El AppLayout en mobile tiene un nav superior + posiblemente tab bar inferior
// Usamos h-full que viene del AppLayout, que a su vez viene del root
const ROOT_CLS = "h-full w-full overflow-hidden";

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

// ── Panel de detalle — contiene header fijo + contenido scrolleable + botón fijo ──
// Este es el patrón correcto: flex-col con altura 100%, el medio hace overflow-y-auto
function PanelDetalle({ siniestro, paso, onVolver, onNext, onFinalizar }) {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* ① Header — siempre visible, no scrollea */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-4 border-b border-gray-100 bg-white">
        <button
          onClick={onVolver}
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

      {/* ② StepBar — siempre visible, no scrollea */}
      <div className="shrink-0 px-4 py-3 border-b border-gray-100 bg-gray-50/80">
        <StepBar paso={paso} />
      </div>

      {/* ③ Contenido — ÚNICO scroll, ocupa todo el espacio restante */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {paso === 0 && (
          <ConfirmarArribo siniestro={siniestro} onConfirmar={onNext} />
        )}
        {paso === 1 && (
          <CapturaDatosEvidencia siniestro={siniestro} onSiguiente={onNext} />
        )}
        {paso === 2 && (
          <GenerarDocumentos siniestro={siniestro} onFinalizar={onFinalizar} />
        )}
      </div>
      {/* NOTA: el botón de acción (Confirmar / Continuar) está DENTRO de cada paso,
          al final del contenido scrolleable. Así, cuando llegas al fondo con scroll,
          el botón aparece naturalmente sin necesidad de sticky ni fixed. */}
    </div>
  );
}

export default function AjustadorSiniestros() {
  const [vista, setVista] = useState("lista");
  const [siniestro, setSiniestro] = useState(null);
  const [paso, setPaso] = useState(0);

  const abrirSiniestro = useCallback((s) => {
    setSiniestro(s);
    setPaso(0);
    setVista("detalle");
  }, []);

  const handleVolver = () => {
    if (paso > 0) {
      setPaso((p) => p - 1);
      return;
    }
    setVista("lista");
    setSiniestro(null);
  };

  const handleNext = () => setPaso((p) => p + 1);
  const handleFinalizar = () => setVista("exito");

  return (
    <div className={ROOT_CLS}>
      {/* ══ DESKTOP: split layout ══════════════════════════════ */}
      <div className="hidden md:flex h-full overflow-hidden bg-gray-50">
        {/* Columna lista */}
        <div className="flex flex-col w-80 lg:w-96 shrink-0 bg-white border-r border-gray-100 overflow-hidden">
          <ListaSiniestros onAtender={abrirSiniestro} />
        </div>

        {/* Columna contenido */}
        <div className="flex-1 overflow-hidden flex flex-col">
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
          {vista === "detalle" && siniestro && (
            <PanelDetalle
              siniestro={siniestro}
              paso={paso}
              onVolver={handleVolver}
              onNext={handleNext}
              onFinalizar={handleFinalizar}
            />
          )}
          {vista === "exito" && siniestro && (
            <div className="flex-1 overflow-y-auto">
              <Exito
                siniestro={siniestro}
                onVolver={() => {
                  setVista("lista");
                  setSiniestro(null);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ══ MOBILE: una sola columna, mismo patrón flex-col ═══ */}
      <div className="flex flex-col h-full overflow-hidden md:hidden bg-white">
        {vista === "lista" && (
          // Lista: header fijo (título+métricas+tabs) + cards scrolleables
          <ListaSiniestros onAtender={abrirSiniestro} />
        )}
        {vista === "detalle" && siniestro && (
          <PanelDetalle
            siniestro={siniestro}
            paso={paso}
            onVolver={handleVolver}
            onNext={handleNext}
            onFinalizar={handleFinalizar}
          />
        )}
        {vista === "exito" && siniestro && (
          <div className="flex-1 overflow-y-auto">
            <Exito
              siniestro={siniestro}
              onVolver={() => {
                setVista("lista");
                setSiniestro(null);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
