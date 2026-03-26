// ============================================================
// src/features/ajustador/siniestros/pasos/ConfirmarArribo.jsx
// Paso 1: Confirmar arribo al lugar del siniestro
// ============================================================
import { useState } from "react";

export default function ConfirmarArribo({ siniestro, onSiguiente }) {
  const [horaArribo, setHoraArribo] = useState(new Date().toTimeString().slice(0, 5));
  const [confirmado, setConfirmado] = useState(false);
  const [cargando,   setCargando]   = useState(false);

  const confirmar = () => {
    setCargando(true);
    setTimeout(() => { setConfirmado(false); setCargando(false); onSiguiente({ horaArribo }); }, 800);
  };

  return (
    <div className="space-y-5">
      {/* Resumen del siniestro */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-[#13193a]">{siniestro.asegurado}</p>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{siniestro.folio} · {siniestro.tipo}</p>
          </div>
          <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200">
            {siniestro.tipo}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            ["Póliza",    siniestro.poliza],
            ["Placas",    siniestro.placas],
            ["Vehículo",  siniestro.vehiculo],
            ["Cobertura", siniestro.cobertura],
          ].map(([l, v]) => (
            <div key={l} className="bg-white/70 rounded-xl px-3 py-2">
              <p className="text-gray-400 font-semibold">{l}</p>
              <p className="text-[#13193a] font-bold mt-0.5 truncate">{v ?? "—"}</p>
            </div>
          ))}
        </div>
        <div className="bg-white/70 rounded-xl px-3 py-2 text-xs">
          <p className="text-gray-400 font-semibold">Lugar</p>
          <p className="text-[#13193a] font-semibold mt-0.5">{siniestro.lugar}</p>
        </div>
      </div>

      {/* Tercero con lesionados: alerta prioritaria */}
      {siniestro.tercero?.lesionados && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-red-700">⚠ Hay personas lesionadas</p>
            <p className="text-xs text-red-600 mt-0.5">Verifica que se haya solicitado asistencia médica antes de proceder.</p>
          </div>
        </div>
      )}

      {/* Hora de arribo */}
      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">
          Hora de arribo <span className="text-red-400">*</span>
        </label>
        <input
          type="time"
          value={horaArribo}
          onChange={(e) => setHoraArribo(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 focus:outline-none focus:border-[#13193a] text-sm font-semibold transition-colors"
        />
      </div>

      {/* Checkbox confirmación */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <div
          onClick={() => setConfirmado(!confirmado)}
          className={`w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${confirmado ? "bg-[#13193a] border-[#13193a]" : "border-gray-300 group-hover:border-gray-400"}`}
        >
          {confirmado && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          )}
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          Confirmo que me encuentro en el lugar del siniestro y he revisado la situación inicial del accidente.
        </p>
      </label>

      <button
        onClick={confirmar}
        disabled={!confirmado || !horaArribo || cargando}
        className="w-full py-3.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white font-bold text-sm transition-all disabled:opacity-40 shadow-lg shadow-[#13193a]/10"
      >
        {cargando ? "Registrando arribo..." : "Confirmar arribo →"}
      </button>
    </div>
  );
}
