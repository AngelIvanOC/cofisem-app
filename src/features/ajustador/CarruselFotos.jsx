// ============================================================
// src/features/ajustador/CarruselFotos.jsx
// Visor tipo lightbox para las fotos amontonadas dentro de una caja de
// DocumentoFotos (licencia, INE, identificación oficial, tarjeta de
// circulación). Adaptado del CarruselEvidencia de
// features/supervisor/SupervisorSiniestros.jsx — mismo prev/next,
// contador, tira de miniaturas y teclado (flechas/Esc), pero además
// deja BORRAR la imagen actual.
// ============================================================
import { useEffect, useState } from "react";

// `imgs`: [{ url, storagePath, uploading }]  ·  `onEliminar(idx)`
export default function CarruselFotos({ imgs, initialIdx = 0, onClose, onEliminar }) {
  const [idx, setIdx] = useState(initialIdx);

  const total = imgs.length;
  // `idx` puede quedar fuera de rango si se borró la última foto — se
  // clampa en render, no con setState (evita renders en cascada).
  const seguro = Math.min(idx, Math.max(0, total - 1));

  useEffect(() => {
    if (total === 0) onClose();
  }, [total, onClose]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft")  setIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIdx((i) => Math.min(total - 1, i + 1));
      if (e.key === "Escape")     onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total, onClose]);

  if (total === 0) return null;
  const actual = imgs[seguro];

  return (
    <div className="fixed inset-0 z-[60] bg-black/92 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-2xl flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-9 right-0 flex items-center gap-1.5 text-white/60 hover:text-white text-xs font-medium transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Cerrar
        </button>

        <div className="relative w-full flex items-center justify-center" style={{ maxHeight: "72vh" }}>
          <img src={actual.url} alt="" className="max-w-full max-h-full object-contain rounded-xl" style={{ maxHeight: "72vh" }} />
          {seguro > 0 && (
            <button onClick={() => setIdx((i) => i - 1)} className="absolute left-2 w-9 h-9 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </button>
          )}
          {seguro < total - 1 && (
            <button onClick={() => setIdx((i) => i + 1)} className="absolute right-2 w-9 h-9 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 mt-3">
          <span className="text-white/50 text-xs">{seguro + 1} / {total}</span>
          {!actual.uploading && onEliminar && (
            <>
              <span className="text-white/20 text-xs">·</span>
              <button
                onClick={() => onEliminar(seguro)}
                className="flex items-center gap-1.5 text-red-300 hover:text-red-200 text-xs font-medium transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Borrar esta foto
              </button>
            </>
          )}
          {actual.uploading && <span className="text-white/40 text-xs">Subiendo...</span>}
        </div>

        {total > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 max-w-full">
            {imgs.map((img, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={["flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all",
                  i === seguro ? "border-white opacity-100" : "border-transparent opacity-40 hover:opacity-70"].join(" ")}>
                <img src={img.url} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
