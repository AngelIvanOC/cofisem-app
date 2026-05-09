import { useCallback } from "react";
import { INP, LBL } from "../constants/estilos";

export default function TerceroCard({ tercero, index, onChange, onRemove }) {
  const set = useCallback(
    (k, v) => onChange(tercero.id, k, v),
    [tercero.id, onChange],
  );

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-[#13193a] text-white flex items-center justify-center text-xs font-bold shrink-0">
            {index + 1}
          </div>
          <span className="text-sm font-bold text-[#13193a]">
            Vehículo tercero #{index + 1}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onRemove(tercero.id)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          Eliminar
        </button>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={LBL}>Marca / Descripción</label>
            <input
              value={tercero.vehiculoDesc}
              onChange={(e) => set("vehiculoDesc", e.target.value)}
              placeholder="Marca y modelo"
              className={INP}
            />
          </div>
          <div>
            <label className={LBL}>Tipo</label>
            <input
              value={tercero.vehiculoTipo}
              onChange={(e) => set("vehiculoTipo", e.target.value)}
              placeholder="Automóvil, camión, moto..."
              className={INP}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { k: "vehiculoColor",  p: "Color"     },
            { k: "vehiculoModelo", p: "Modelo"    },
            { k: "vehiculoPlacas", p: "Placas"    },
            { k: "vehiculoSerie",  p: "No. Serie" },
            { k: "vehiculoMotor",  p: "Motor"     },
          ].map((f) => (
            <div key={f.k}>
              <label className={LBL}>{f.p}</label>
              <input
                value={tercero[f.k]}
                onChange={(e) => set(f.k, e.target.value)}
                placeholder={f.p}
                className={INP}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
