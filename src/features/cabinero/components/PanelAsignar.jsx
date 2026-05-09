import { useState } from "react";
import { AJUSTADORES, MAX } from "../data/siniestrosMock";

export default function PanelAsignar({ s, onConfirmar, onCancelar }) {
  const [sel,  setSel]  = useState("");
  const [busy, setBusy] = useState(false);

  const confirmar = () => {
    if (!sel) return;
    setBusy(true);
    const aj = AJUSTADORES.find((a) => a.id === sel);
    setTimeout(() => onConfirmar(aj.nombre), 600);
  };

  return (
    <div className="space-y-2 pt-2 border-t border-gray-100">
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
        {s.ajustador ? "Cambiar a:" : "Seleccionar ajustador:"}
      </p>
      <div className="space-y-1.5">
        {AJUSTADORES.map((aj) => {
          const lleno = aj.activos >= MAX;
          return (
            <button
              key={aj.id}
              onClick={() => !lleno && setSel(aj.id)}
              disabled={lleno}
              className={[
                "w-full flex items-center gap-2.5 p-2.5 rounded-xl border-2 text-left transition-all",
                sel === aj.id
                  ? "border-[#13193a] bg-[#13193a]/5"
                  : lleno
                    ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                    : "border-gray-200 hover:border-gray-300 bg-white",
              ].join(" ")}
            >
              <div className="w-7 h-7 rounded-full bg-[#13193a] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                {aj.nombre.split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-gray-800 truncate">{aj.nombre}</p>
                <div className="flex gap-0.5 mt-0.5">
                  {Array.from({ length: MAX }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${i < aj.activos ? "bg-blue-400" : "bg-gray-200"}`}
                    />
                  ))}
                </div>
              </div>
              {sel === aj.id && (
                <svg className="w-3.5 h-3.5 text-[#13193a] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              )}
              {lleno && (
                <span className="text-[9px] text-red-500 font-bold shrink-0">Lleno</span>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancelar}
          className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={confirmar}
          disabled={!sel || busy}
          className="flex-1 py-2 rounded-xl bg-[#13193a] text-white text-xs font-bold disabled:opacity-40 transition-all"
        >
          {busy ? "..." : "Confirmar"}
        </button>
      </div>
    </div>
  );
}
