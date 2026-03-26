// ============================================================
// src/features/supervisor/siniestros/PanelReasignar.jsx
// Panel para reasignar siniestro a otro ajustador
// ============================================================
import { useState } from "react";

const AJUSTADORES = [
  { id:"AJU-01", nombre:"Roberto Vega",    activos:3, disponibles:2, tel:"777-100-0001" },
  { id:"AJU-02", nombre:"Sandra Moreno",   activos:1, disponibles:4, tel:"777-100-0002" },
  { id:"AJU-03", nombre:"Felipe Castillo", activos:5, disponibles:1, tel:"777-100-0003" },
  { id:"AJU-04", nombre:"Diana Ríos",      activos:0, disponibles:5, tel:"777-100-0004" },
];

const MOTIVOS = ["Carga de trabajo", "Zona geográfica", "Especialización requerida", "Solicitud del ajustador", "Otro"];

export default function PanelReasignar({ siniestro, onClose, onConfirmar }) {
  const [ajustador, setAjustador] = useState(null);
  const [motivo,    setMotivo]    = useState("");
  const [cargando,  setCargando]  = useState(false);

  const confirmar = () => {
    setCargando(true);
    setTimeout(() => { onConfirmar(siniestro.folio, ajustador.nombre, motivo); }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-sm bg-white shadow-2xl flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-[#13193a]">Reasignar siniestro</p>
            <p className="text-xs text-gray-400 mt-0.5">{siniestro?.folio} · Actual: <span className="font-semibold">{siniestro?.ajustador ?? "Sin asignar"}</span></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Ajustadores */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Nuevo ajustador</p>
            {AJUSTADORES.filter((a) => a.nombre !== siniestro?.ajustador).map((a) => {
              const cargaColor = a.activos >= 5 ? "text-red-500" : a.activos >= 3 ? "text-amber-500" : "text-emerald-600";
              return (
                <button key={a.id} onClick={() => setAjustador(a)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${ajustador?.id === a.id ? "border-[#13193a] bg-[#13193a]/5" : "border-gray-100 hover:border-gray-200"}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#13193a]">{a.nombre}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{a.tel}</p>
                    </div>
                    {ajustador?.id === a.id && (
                      <div className="w-5 h-5 rounded-full bg-[#13193a] flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-4 mt-2">
                    <span className="text-[11px] text-gray-400">Disp.: <b>{a.disponibles}</b></span>
                    <span className={`text-[11px] font-semibold ${cargaColor}`}>Activos: {a.activos}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Motivo */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Motivo de reasignación</p>
            <div className="flex flex-wrap gap-2">
              {MOTIVOS.map((m) => (
                <button key={m} onClick={() => setMotivo(m)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${motivo === m ? "bg-[#13193a] text-white border-[#13193a]" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 py-4 border-t border-gray-100 flex gap-2.5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={confirmar} disabled={!ajustador || !motivo || cargando}
            className="flex-1 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all disabled:opacity-40">
            {cargando ? "Reasignando..." : "Reasignar"}
          </button>
        </div>
      </div>
    </div>
  );
}
