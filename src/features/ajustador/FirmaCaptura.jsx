// ============================================================
// src/features/ajustador/FirmaCaptura.jsx
// Componente de firma reutilizable — antes vivía embebido en
// cierre/SeccionCierre.jsx. Ahora cada módulo de persona lo usa para
// pedir su propia firma:
//   - NA · Módulo 1  → firma del asegurado
//   - Tercero · Módulo 1 → firma de ese tercero (una por tercero)
//   - LesionadosPanel → firma de cada lesionado (o la de su responsable)
//   - Cierre → solo la firma del ajustador
// `ModalFirma` es el canvas para dibujar; `FirmaField` es la tarjeta
// ("Toca para firmar" / preview / "Borrar") que abre ese modal.
// ============================================================
import { useRef, useState } from "react";

export function ModalFirma({ label, onConfirmar, onCerrar }) {
  const canvasRef  = useRef(null);
  const dibujando  = useRef(false);
  const ultimoPto  = useRef(null);

  const getXY = (e, canvas) => {
    const r   = canvas.getBoundingClientRect();
    const src = e.touches?.[0] ?? e;
    return { x: (src.clientX - r.left) * (canvas.width / r.width), y: (src.clientY - r.top) * (canvas.height / r.height) };
  };
  const draw = (from, to, ctx) => {
    ctx.beginPath(); ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = "#13193a"; ctx.lineWidth = 2.5;
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
  };
  const onDown = (e) => { dibujando.current = true; ultimoPto.current = getXY(e, canvasRef.current); if (e.cancelable) e.preventDefault(); };
  const onMove = (e) => {
    if (!dibujando.current) return;
    if (e.cancelable) e.preventDefault();
    const to = getXY(e, canvasRef.current);
    draw(ultimoPto.current, to, canvasRef.current.getContext("2d"));
    ultimoPto.current = to;
  };
  const onUp = () => { dibujando.current = false; };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(10,15,40,0.6)" }} onClick={onCerrar}>
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="font-bold text-[#13193a] text-sm">Capturar firma</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
          <button onClick={onCerrar} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          <p className="text-xs text-gray-400 mb-3 text-center">Firma dentro del recuadro con el dedo o el lápiz</p>
          <canvas ref={canvasRef} width={460} height={200} className="w-full border-2 border-dashed border-gray-300 rounded-2xl touch-none bg-gray-50" style={{ height: 180 }}
            onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
            onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp} />
          <div className="flex gap-3 mt-4">
            <button onClick={() => { const ctx = canvasRef.current?.getContext("2d"); if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); }}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Limpiar</button>
            <button onClick={() => onConfirmar(canvasRef.current.toDataURL())}
              className="flex-1 py-3 rounded-xl bg-[#13193a] text-white text-sm font-bold hover:bg-[#1e2a50] shadow-lg shadow-[#13193a]/15">Confirmar Firma</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tarjeta de una firma. `previewUrl`: dataURL recién capturado o URL
// firmada de una firma ya guardada. `onCapture(dataUrl)`: se dispara al
// confirmar en el modal — el llamador la sube y persiste. `onClear`
// (opcional): botón "Borrar". `busy`: subiendo/guardando. `disabled` +
// `disabledHint`: p. ej. tercero aún sin guardar.
export function FirmaField({ label, sub, previewUrl, onCapture, onClear, busy, error, disabled, disabledHint }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <p className="text-sm font-semibold text-[#13193a]">{label}</p>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
        {previewUrl && onClear && !busy && (
          <button onClick={onClear} className="text-xs text-red-400 hover:text-red-600 font-medium">Borrar</button>
        )}
      </div>

      {disabled ? (
        <p className="px-4 py-5 text-xs text-gray-400 text-center">{disabledHint || "No disponible todavía."}</p>
      ) : busy ? (
        <div className="p-3 bg-gray-50 flex items-center justify-center h-16 gap-2 text-gray-400">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-[#13193a] rounded-full animate-spin" />
          <span className="text-xs font-semibold">Guardando firma...</span>
        </div>
      ) : previewUrl ? (
        <button onClick={() => setAbierto(true)} className="w-full p-3 bg-gray-50 flex items-center justify-center h-16 hover:bg-gray-100 transition-colors">
          <img src={previewUrl} alt="Firma" className="h-full" style={{ filter: "invert(1) brightness(0.15)" }} />
        </button>
      ) : (
        <button onClick={() => setAbierto(true)} className="w-full px-4 py-5 flex flex-col items-center gap-2 text-gray-400 hover:bg-gray-50 transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
          </svg>
          <span className="text-xs font-semibold">Toca para firmar</span>
        </button>
      )}

      {error && <p className="px-4 py-2 text-xs text-red-500 font-medium">{error}</p>}

      {abierto && (
        <ModalFirma
          label={label}
          onConfirmar={(dataUrl) => { setAbierto(false); onCapture(dataUrl); }}
          onCerrar={() => setAbierto(false)}
        />
      )}
    </div>
  );
}
