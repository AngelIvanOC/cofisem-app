// ============================================================
// src/features/ajustador/index.jsx
// Orquestador del módulo ajustador.
// Conecta lista → flujo de 4 pasos → éxito.
// SIN cambios de diseño respecto al original.
// ============================================================
import { useState, useCallback } from "react";
import { StepBar } from "./shared";
import ListaSiniestros   from "./ListaSiniestros";
import ConfirmarArribo   from "./ConfirmarArribo";
import CapturaDatos      from "./CapturaDatos";
import CapturaEvidencia  from "./CapturaEvidencia";
import GenerarDocumentos from "./GenerarDocumentos";

const NOMBRE_PASO = ["Confirmar Arribo", "Datos del Siniestro", "Evidencia y Daños", "Generar Documentos"];

function Exito({ siniestro, onVolver }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center mb-5">
        <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <h2 className="text-xl font-bold text-[#13193a] mb-2">¡Siniestro atendido!</h2>
      <p className="text-gray-400 text-sm mb-1">
        Folio <span className="font-mono font-bold text-[#13193a]">{siniestro.id}</span> cerrado correctamente.
      </p>
      <p className="text-gray-400 text-sm mb-8">Los documentos fueron enviados al cabinero.</p>
      <button onClick={onVolver}
        className="w-full max-w-xs py-3.5 rounded-2xl bg-[#13193a] text-white font-bold text-sm hover:bg-[#1e2a50] transition-all">
        Volver a Siniestros
      </button>
    </div>
  );
}

export default function AjustadorSiniestros() {
  const [vista,     setVista]     = useState("lista");
  const [siniestro, setSiniestro] = useState(null);
  const [paso,      setPaso]      = useState(0);

  const abrirSiniestro = useCallback(s => { setSiniestro(s); setPaso(0); setVista("detalle"); }, []);
  const volver = () => { if (paso > 0) { setPaso(p => p - 1); return; } setVista("lista"); setSiniestro(null); };
  const finalizar = () => setVista("exito");

  return (
    <div className="flex h-full min-h-screen bg-gray-50">

      {/* Lista — siempre visible en md+, pantalla completa en mobile cuando no hay detalle */}
      <div className={[
        "flex flex-col bg-white border-r border-gray-100",
        vista === "lista"
          ? "flex w-full md:w-80 lg:w-96 md:shrink-0"
          : "hidden md:flex md:w-80 lg:w-96 md:shrink-0",
      ].join(" ")}>
        <ListaSiniestros onAtender={abrirSiniestro}/>
      </div>

      {/* Panel de detalle / flujo */}
      {vista === "detalle" && siniestro && (
        <div className="flex-1 flex flex-col bg-white min-h-0">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 shrink-0">
            <button onClick={volver}
              className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#13193a] hover:border-gray-300 transition-all shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#13193a] truncate">{NOMBRE_PASO[paso]}</p>
              <p className="text-xs text-gray-400 truncate">{siniestro.id} · {siniestro.asegurado}</p>
            </div>
          </div>

          {/* StepBar */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80 shrink-0">
            <StepBar paso={paso}/>
          </div>

          {/* Contenido del paso */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {paso === 0 && <ConfirmarArribo   siniestro={siniestro} onConfirmar={() => setPaso(1)}/>}
            {paso === 1 && <CapturaDatos      siniestro={siniestro} onSiguiente={() => setPaso(2)}/>}
            {paso === 2 && <CapturaEvidencia  siniestro={siniestro} onSiguiente={() => setPaso(3)}/>}
            {paso === 3 && <GenerarDocumentos siniestro={siniestro} onFinalizar={finalizar}/>}
          </div>
        </div>
      )}

      {/* Éxito */}
      {vista === "exito" && siniestro && (
        <div className="flex-1 flex flex-col bg-white">
          <Exito siniestro={siniestro} onVolver={() => { setVista("lista"); setSiniestro(null); }}/>
        </div>
      )}

      {/* Placeholder desktop (nada seleccionado) */}
      {vista === "lista" && (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gray-50 text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/>
            </svg>
          </div>
          <p className="text-[#13193a] font-semibold text-sm">Selecciona un siniestro</p>
          <p className="text-gray-400 text-xs mt-1 max-w-xs">Elige un caso de la lista para comenzar el proceso de atención.</p>
        </div>
      )}
    </div>
  );
}
