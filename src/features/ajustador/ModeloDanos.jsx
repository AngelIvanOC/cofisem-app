// ============================================================
// src/features/ajustador/ModeloDanos.jsx
// Modelo 360° interactivo de daños al vehículo.
// Incluye SvgAuto (siluetas SVG por vista) y la lógica de pins.
// ============================================================
import { useState, useRef } from "react";
import { VISTAS_AUTO } from "./shared";

// ── Siluetas SVG del auto por vista ──────────────────────────
function SvgAuto({ vista }) {
  if (vista === "frente") return (
    <svg viewBox="0 0 200 140" className="w-full h-full" fill="none">
      <rect x="20" y="60" width="160" height="65" rx="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2"/>
      <path d="M55 60 Q60 25 90 22 H110 Q140 25 145 60Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2"/>
      <path d="M60 59 Q65 30 88 28 H112 Q135 30 140 59Z" fill="#bfdbfe" stroke="#94a3b8" strokeWidth="1.5"/>
      <rect x="50" y="105" width="100" height="18" rx="4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5"/>
      <rect x="22" y="93" width="30" height="18" rx="3" fill="#fef08a" stroke="#94a3b8" strokeWidth="1.5"/>
      <rect x="148" y="93" width="30" height="18" rx="3" fill="#fef08a" stroke="#94a3b8" strokeWidth="1.5"/>
      <circle cx="52" cy="128" r="10" fill="#475569" stroke="#334155" strokeWidth="2"/>
      <circle cx="148" cy="128" r="10" fill="#475569" stroke="#334155" strokeWidth="2"/>
    </svg>
  );
  if (vista === "trasera") return (
    <svg viewBox="0 0 200 140" className="w-full h-full" fill="none">
      <rect x="20" y="60" width="160" height="65" rx="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2"/>
      <path d="M55 60 Q60 25 90 22 H110 Q140 25 145 60Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2"/>
      <path d="M60 59 Q65 30 88 28 H112 Q135 30 140 59Z" fill="#bfdbfe" stroke="#94a3b8" strokeWidth="1.5"/>
      <rect x="40" y="103" width="120" height="14" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5"/>
      <rect x="22" y="88" width="28" height="16" rx="3" fill="#fca5a5" stroke="#94a3b8" strokeWidth="1.5"/>
      <rect x="150" y="88" width="28" height="16" rx="3" fill="#fca5a5" stroke="#94a3b8" strokeWidth="1.5"/>
      <circle cx="52" cy="128" r="10" fill="#475569" stroke="#334155" strokeWidth="2"/>
      <circle cx="148" cy="128" r="10" fill="#475569" stroke="#334155" strokeWidth="2"/>
    </svg>
  );
  if (vista === "lateral_i" || vista === "lateral_d") return (
    <svg viewBox="0 0 260 140" className="w-full h-full" fill="none">
      <rect x="10" y="72" width="240" height="55" rx="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2"/>
      <path d="M40 72 Q55 30 90 26 H170 Q200 30 220 72Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2"/>
      <path d="M48 71 Q62 34 91 30 H168 Q197 34 212 71Z" fill="#bfdbfe" stroke="#94a3b8" strokeWidth="1.5"/>
      <circle cx="60"  cy="128" r="14" fill="#475569" stroke="#334155" strokeWidth="2.5"/>
      <circle cx="200" cy="128" r="14" fill="#475569" stroke="#334155" strokeWidth="2.5"/>
      <circle cx="60"  cy="128" r="7" fill="#64748b"/>
      <circle cx="200" cy="128" r="7" fill="#64748b"/>
      <line x1="120" y1="72" x2="120" y2="127" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3"/>
      <rect x="90"  y="96" width="18" height="6" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1"/>
      <rect x="148" y="96" width="18" height="6" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1"/>
    </svg>
  );
  if (vista === "techo") return (
    <svg viewBox="0 0 180 260" className="w-full h-full" fill="none">
      <rect x="20" y="20" width="140" height="220" rx="30" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2"/>
      <rect x="35" y="45" width="110" height="70" rx="8" fill="#bfdbfe" stroke="#94a3b8" strokeWidth="1.5"/>
      <rect x="35" y="145" width="110" height="70" rx="8" fill="#bfdbfe" stroke="#94a3b8" strokeWidth="1.5"/>
      <line x1="90" y1="20" x2="90" y2="240" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,4"/>
      <ellipse cx="20" cy="65"  rx="12" ry="16" fill="#475569" stroke="#334155" strokeWidth="2"/>
      <ellipse cx="160" cy="65"  rx="12" ry="16" fill="#475569" stroke="#334155" strokeWidth="2"/>
      <ellipse cx="20" cy="195" rx="12" ry="16" fill="#475569" stroke="#334155" strokeWidth="2"/>
      <ellipse cx="160" cy="195" rx="12" ry="16" fill="#475569" stroke="#334155" strokeWidth="2"/>
    </svg>
  );
  return null;
}

// ── Modelo 360° interactivo ───────────────────────────────────
export default function ModeloDanos() {
  const [vistaActual, setVistaActual] = useState("frente");
  const [puntosMap,   setPuntosMap]   = useState({});
  const [puntoActivo, setPuntoActivo] = useState(null);
  const [notaTemp,    setNotaTemp]    = useState("");
  const svgRef = useRef(null);

  const puntosVista = puntosMap[vistaActual] ?? [];
  const totalPuntos = Object.values(puntosMap).flat().length;

  const handleClickSvg = (e) => {
    if (e.target.closest("[data-pin]")) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width)  * 100;
    const y = ((e.clientY - rect.top)  / rect.height) * 100;
    const id = Date.now();
    setPuntosMap(prev => ({ ...prev, [vistaActual]: [...(prev[vistaActual] ?? []), { id, x, y, nota: "" }] }));
    setPuntoActivo(id);
    setNotaTemp("");
  };

  const guardarNota = () => {
    if (puntoActivo === null) return;
    setPuntosMap(prev => ({
      ...prev,
      [vistaActual]: (prev[vistaActual] ?? []).map(p => p.id === puntoActivo ? { ...p, nota: notaTemp } : p),
    }));
    setPuntoActivo(null);
    setNotaTemp("");
  };

  const eliminarPunto = (id) => {
    setPuntosMap(prev => ({ ...prev, [vistaActual]: (prev[vistaActual] ?? []).filter(p => p.id !== id) }));
    if (puntoActivo === id) { setPuntoActivo(null); setNotaTemp(""); }
  };

  return (
    <div className="space-y-3">
      {/* Selector de vista */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {VISTAS_AUTO.map(v => (
          <button key={v.id} onClick={() => setVistaActual(v.id)}
            className={[
              "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border-2 transition-all shrink-0",
              vistaActual === v.id ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300",
            ].join(" ")}>
            {v.label}
            {(puntosMap[v.id]?.length ?? 0) > 0 && (
              <span className="ml-1.5 bg-red-500 text-white rounded-full px-1.5 py-0.5 text-[10px]">
                {puntosMap[v.id].length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Canvas del auto */}
      <div ref={svgRef} onClick={handleClickSvg}
        className="relative bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 cursor-crosshair select-none overflow-hidden"
        style={{ paddingBottom: vistaActual === "techo" ? "55%" : "45%" }}>
        <div className="absolute inset-3">
          <SvgAuto vista={vistaActual}/>
        </div>

        {puntosVista.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-[11px] text-gray-400 font-semibold mt-1 bg-white/80 px-3 py-1.5 rounded-xl border border-gray-200">
              Toca para marcar una zona dañada
            </p>
          </div>
        )}

        {puntosVista.map((p, idx) => (
          <div key={p.id} data-pin="1"
            style={{ left: `${p.x}%`, top: `${p.y}%`, position: "absolute", transform: "translate(-50%,-50%)" }}
            className="z-10">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-40 w-6 h-6"/>
              <button
                onClick={e => { e.stopPropagation(); setPuntoActivo(p.id === puntoActivo ? null : p.id); setNotaTemp(p.nota); }}
                className={[
                  "relative w-7 h-7 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] font-bold transition-all",
                  puntoActivo === p.id ? "bg-[#13193a] scale-125" : "bg-red-500 hover:bg-red-600",
                ].join(" ")}>
                {idx + 1}
              </button>
            </div>
            {p.nota && puntoActivo !== p.id && (
              <div className="absolute left-1/2 top-8 -translate-x-1/2 bg-[#13193a] text-white text-[10px] rounded-lg px-2 py-1 whitespace-nowrap max-w-28 truncate shadow-lg pointer-events-none z-20">
                {p.nota}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Panel de nota del punto activo */}
      {puntoActivo !== null && (
        <div className="bg-white rounded-2xl border-2 border-[#13193a]/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#13193a] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                {puntosVista.findIndex(p => p.id === puntoActivo) + 1}
              </span>
              Zona de daño
            </p>
            <button onClick={() => eliminarPunto(puntoActivo)} className="text-xs text-red-400 hover:text-red-600 font-semibold">
              Eliminar punto
            </button>
          </div>
          <textarea autoFocus rows={2} value={notaTemp} onChange={e => setNotaTemp(e.target.value)}
            placeholder="Describe el daño (ej: rayón profundo, abolladuras, cristal roto...)"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] resize-none"/>
          <div className="flex gap-2">
            <button onClick={() => { setPuntoActivo(null); setNotaTemp(""); }}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={guardarNota} className="flex-1 py-2.5 rounded-xl bg-[#13193a] text-white text-xs font-bold hover:bg-[#1e2a50]">
              Guardar nota
            </button>
          </div>
        </div>
      )}

      {/* Resumen de puntos marcados */}
      {totalPuntos > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3">
          <p className="text-[11px] font-bold text-red-600 uppercase tracking-widest mb-2">
            {totalPuntos} zona{totalPuntos > 1 ? "s" : ""} marcada{totalPuntos > 1 ? "s" : ""}
          </p>
          <div className="space-y-1.5">
            {VISTAS_AUTO.filter(v => (puntosMap[v.id]?.length ?? 0) > 0).map(v => (
              <div key={v.id}>
                <p className="text-[10px] font-bold text-gray-500 uppercase">{v.label}</p>
                {puntosMap[v.id].map((p, i) => (
                  <div key={p.id} className="flex items-start gap-2 mt-1">
                    <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-xs text-gray-600 leading-snug">{p.nota || <span className="italic text-gray-400">Sin nota</span>}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
