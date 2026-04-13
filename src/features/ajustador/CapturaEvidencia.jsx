// ============================================================
// src/features/ajustador/CapturaEvidencia.jsx
// Paso 3: Evidencia fotográfica + modelo 360° de daños
// ============================================================
import { useState, useRef } from "react";
import { Seccion } from "./shared";
import ModeloDanos from "./ModeloDanos";

export default function CapturaEvidencia({ siniestro, onSiguiente }) {
  const [evidencias, setEvidencias] = useState({ fotos: [], licencias: [], poliza: [] });
  const fileRefs = { fotos: useRef(), licencias: useRef(), poliza: useRef() };

  const addEvidencia = (tipo, e) => {
    const urls = Array.from(e.target.files || []).map(f => URL.createObjectURL(f));
    setEvidencias(ev => ({ ...ev, [tipo]: [...ev[tipo], ...urls] }));
  };

  const BotonEvidencia = ({ tipo, label, icon }) => (
    <div>
      <input ref={fileRefs[tipo]} type="file" accept="image/*" multiple capture="environment" className="hidden"
        onChange={e => addEvidencia(tipo, e)}/>
      <button onClick={() => fileRefs[tipo].current?.click()}
        className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-[#13193a]/25 hover:bg-gray-50 transition-all active:scale-[0.98]">
        <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl">{icon}</div>
        <p className="text-xs font-semibold text-gray-600">{label}</p>
        {evidencias[tipo].length > 0 && (
          <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 font-bold">
            {evidencias[tipo].length} archivo{evidencias[tipo].length > 1 ? "s" : ""}
          </span>
        )}
      </button>
      {evidencias[tipo].length > 0 && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {evidencias[tipo].map((url, i) => (
            <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-100">
              <img src={url} alt="" className="w-full h-full object-cover"/>
              <button
                onClick={() => setEvidencias(ev => ({ ...ev, [tipo]: ev[tipo].filter((_, j) => j !== i) }))}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

        {/* Evidencia fotográfica */}
        <Seccion titulo="Evidencia y Documentos">
          <div className="grid grid-cols-2 gap-3">
            <BotonEvidencia tipo="fotos"    label="Evidencias"    icon="📸"/>
            <BotonEvidencia tipo="licencias" label="Licencia(s)"  icon="🪪"/>
            <BotonEvidencia tipo="poliza"   label="Póliza física"  icon="📄"/>
            <div>
              <input type="file" accept="image/*" multiple capture="environment" className="hidden"
                id="fotos-vehiculo"
                onChange={e => {
                  const urls = Array.from(e.target.files || []).map(f => URL.createObjectURL(f));
                  setEvidencias(ev => ({ ...ev, vehiculo: [...(ev.vehiculo ?? []), ...urls] }));
                }}/>
              <button onClick={() => document.getElementById("fotos-vehiculo").click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-[#13193a]/25 hover:bg-gray-50 transition-all active:scale-[0.98]">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl">🚗</div>
                <p className="text-xs font-semibold text-gray-600">Daños al vehículo</p>
              </button>
            </div>
          </div>
        </Seccion>

        {/* Modelo 360° */}
        <Seccion titulo="Mapa de Daños — Vehículo 360°" accion={
          <span className="text-[10px] text-white/50 font-medium">Toca para marcar</span>
        }>
          <ModeloDanos/>
        </Seccion>
      </div>

      <div className="px-4 py-4 border-t border-gray-100 bg-white shrink-0">
        <button onClick={onSiguiente}
          className="w-full py-3.5 rounded-2xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-[#13193a]/15">
          Continuar a Documentos →
        </button>
      </div>
    </div>
  );
}
