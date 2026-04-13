// ============================================================
// src/features/ajustador/ConfirmarArribo.jsx
// Paso 1: Confirmar arribo al lugar del siniestro
// ============================================================
import { useState, useRef } from "react";

export default function ConfirmarArribo({ siniestro, onConfirmar }) {
  const [confirmado, setConfirmado] = useState(false);
  const [foto,       setFoto]       = useState(null);
  const fileRef = useRef(null);

  const fecha = new Date().toLocaleDateString("es-MX", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

  const tieneUbic = !!siniestro.ubicacion && !!siniestro.coords;
  const mapsUrl   = tieneUbic
    ? `https://maps.google.com/?q=${siniestro.coords.lat},${siniestro.coords.lng}`
    : null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Estado arribo */}
        <div className={[
          "rounded-2xl p-4 border-2 transition-all duration-500",
          confirmado ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200",
        ].join(" ")}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${confirmado ? "bg-emerald-500" : "bg-gray-200"}`}>
              {confirmado
                ? <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                : <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
              }
            </div>
            <div>
              <p className={`text-sm font-bold ${confirmado ? "text-emerald-700" : "text-gray-600"}`}>
                {confirmado ? "Arribo confirmado" : "Arribo por confirmar"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{fecha}</p>
            </div>
          </div>
        </div>

        {/* Info del caso */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#13193a]/8 flex items-center justify-center shrink-0">
              <svg className="w-4.5 h-4.5 text-[#13193a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
              </svg>
            </div>
            <div>
              <p className="font-bold text-[#13193a] text-sm">{siniestro.asegurado}</p>
              <p className="text-xs text-gray-400">{siniestro.vehiculo}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Folio</p>
              <p className="text-sm font-bold font-mono text-[#13193a] mt-0.5">{siniestro.id}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Póliza</p>
              <p className="text-xs font-semibold text-[#13193a] mt-0.5 truncate">{siniestro.poliza}</p>
            </div>
          </div>

          {tieneUbic ? (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100 group hover:bg-blue-100 transition-colors">
              <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-blue-700">Ver ubicación en Maps</p>
                <p className="text-xs text-blue-500 truncate mt-0.5">{siniestro.ubicacion}</p>
              </div>
              <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/>
              </svg>
            </a>
          ) : (
            <a href={`tel:${siniestro.telefono}`}
              className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors">
              <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.338c0-.552.196-1.078.548-1.48l.818-.888a1.5 1.5 0 012.26.093l1.84 2.305a1.5 1.5 0 01-.043 1.925l-.655.755a.75.75 0 00-.119.845 11.228 11.228 0 005.26 5.26.75.75 0 00.845-.118l.755-.655a1.5 1.5 0 011.925-.043l2.305 1.84a1.5 1.5 0 01.093 2.26l-.888.818a2.25 2.25 0 01-1.48.548c-6.623 0-12-5.377-12-12z"/>
              </svg>
              <div>
                <p className="text-xs font-bold text-amber-700">{siniestro.telefono}</p>
                <p className="text-[10px] text-amber-500">Asegurado sin ubicación — coordinar por teléfono</p>
              </div>
            </a>
          )}
        </div>

        {/* Mapa simulado (solo si hay coords) */}
        {tieneUbic && (
          <div className="relative bg-blue-50 rounded-2xl overflow-hidden" style={{ height: 180 }}>
            <div className="absolute inset-0">
              {[...Array(7)].map((_, i) => (
                <div key={`h${i}`} className="absolute w-full h-px bg-blue-200/50" style={{ top: `${(i + 1) * 12.5}%` }}/>
              ))}
              {[...Array(9)].map((_, i) => (
                <div key={`v${i}`} className="absolute h-full w-px bg-blue-200/50" style={{ left: `${(i + 1) * 11}%` }}/>
              ))}
              <div className="absolute top-1/2 left-0 right-0 h-2 bg-blue-300/40 -translate-y-1/2"/>
              <div className="absolute left-1/2 top-0 bottom-0 w-2 bg-blue-300/40 -translate-x-1/2"/>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-red-500 border-2 border-white shadow-lg flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-white"/>
                </div>
                <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[8px] border-l-transparent border-r-transparent border-t-red-500"/>
              </div>
            </div>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
              className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white rounded-xl px-3 py-2 shadow-md text-xs font-bold text-[#13193a] border border-gray-200">
              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"/>
              </svg>
              Abrir en Maps
            </a>
          </div>
        )}

        {/* Foto de llegada */}
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Foto de llegada al lugar</label>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) setFoto(URL.createObjectURL(f)); }}/>
          {foto ? (
            <div className="relative rounded-2xl overflow-hidden" style={{ height: 160 }}>
              <img src={foto} alt="Foto arribo" className="w-full h-full object-cover"/>
              <button onClick={() => setFoto(null)} className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()}
              className="w-full h-24 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#13193a]/30 hover:bg-gray-50 transition-all">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/>
              </svg>
              <span className="text-xs font-semibold">Tomar foto o subir imagen</span>
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-4 border-t border-gray-100 bg-white shrink-0">
        <button
          onClick={() => { setConfirmado(true); setTimeout(onConfirmar, 500); }}
          disabled={confirmado}
          className={[
            "w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-300",
            confirmado ? "bg-emerald-500 text-white" : "bg-[#13193a] hover:bg-[#1e2a50] text-white active:scale-[0.98] shadow-lg shadow-[#13193a]/15",
          ].join(" ")}
        >
          {confirmado
            ? <span className="flex items-center justify-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>Arribo Confirmado</span>
            : "Confirmar Arribo"
          }
        </button>
      </div>
    </div>
  );
}
