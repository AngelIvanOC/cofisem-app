// ============================================================
// src/features/ajustador/siniestros/pasos/CapturaEvidencia.jsx
// Paso 3: Checklist de documentos y fotos requeridos
// ============================================================
import { useState } from "react";

const EVIDENCIAS_REQUERIDAS = [
  { id:"foto_frontal",    label:"Foto frontal del vehículo",       requerida:true  },
  { id:"foto_trasera",    label:"Foto trasera del vehículo",       requerida:true  },
  { id:"foto_lateral_i",  label:"Foto lateral izquierdo",          requerida:true  },
  { id:"foto_lateral_d",  label:"Foto lateral derecho",            requerida:true  },
  { id:"foto_danos",      label:"Foto de zona dañada",             requerida:true  },
  { id:"foto_placa",      label:"Foto de placas",                  requerida:true  },
  { id:"foto_licencia",   label:"Foto de licencia de conducir",    requerida:true  },
  { id:"foto_tarj_circ",  label:"Foto de tarjeta de circulación",  requerida:true  },
  { id:"foto_poliza",     label:"Foto de póliza impresa",          requerida:false },
  { id:"foto_panoramica", label:"Foto panorámica del lugar",       requerida:false },
  { id:"foto_semaforo",   label:"Foto de semáforo / señales viales",requerida:false},
];

export default function CapturaEvidencia({ onSiguiente, onAnterior }) {
  const [checklist, setChecklist] = useState({});
  const [notas,     setNotas]     = useState("");

  const toggle = (id) => setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));

  const requeridas       = EVIDENCIAS_REQUERIDAS.filter((e) => e.requerida);
  const completadas      = requeridas.filter((e) => checklist[e.id]).length;
  const pct              = Math.round((completadas / requeridas.length) * 100);
  const todasRequeridas  = completadas === requeridas.length;

  return (
    <div className="space-y-5">
      {/* Barra de progreso */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-gray-500">Evidencia requerida</p>
          <p className={`text-xs font-bold ${todasRequeridas ? "text-emerald-600" : "text-amber-600"}`}>
            {completadas}/{requeridas.length} ·{pct}%
          </p>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${todasRequeridas ? "bg-emerald-500" : "bg-amber-400"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {EVIDENCIAS_REQUERIDAS.map((e) => (
          <label key={e.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50/70 cursor-pointer group transition-colors">
            <div
              onClick={() => toggle(e.id)}
              className={[
                "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                checklist[e.id] ? "bg-emerald-500 border-emerald-500" : "border-gray-300 group-hover:border-gray-400",
              ].join(" ")}
            >
              {checklist[e.id] && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              )}
            </div>
            <span className={`text-sm flex-1 ${checklist[e.id] ? "line-through text-gray-300" : "text-gray-700"}`}>
              {e.label}
            </span>
            {e.requerida
              ? <span className="text-[10px] font-bold text-red-400 uppercase">Req.</span>
              : <span className="text-[10px] text-gray-300 uppercase">Opcional</span>
            }
          </label>
        ))}
      </div>

      {/* Notas */}
      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Observaciones</label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={2}
          placeholder="Condiciones de luz, acceso al lugar, observaciones sobre la evidencia..."
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 focus:outline-none focus:border-[#13193a] text-sm resize-none transition-colors"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onAnterior} className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          ← Atrás
        </button>
        <button
          onClick={() => onSiguiente({ checklist, notas })}
          disabled={!todasRequeridas}
          className="flex-1 py-3 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white font-bold text-sm transition-all disabled:opacity-40"
        >
          {todasRequeridas ? "Continuar →" : `Faltan ${requeridas.length - completadas} elementos requeridos`}
        </button>
      </div>
    </div>
  );
}
