// ============================================================
// src/features/ajustador/siniestros/pasos/StepBar.jsx
// Barra de progreso de pasos del flujo de atención
// ============================================================
const PASOS = [
  { key: "arribo",     label: "Arribo"        },
  { key: "datos",      label: "Datos"         },
  { key: "evidencia",  label: "Evidencia"     },
  { key: "danos",      label: "Modelo daños"  },
  { key: "resolucion", label: "Resolución"    },
];

export default function StepBar({ pasoActual }) {
  const idx = PASOS.findIndex((p) => p.key === pasoActual);

  return (
    <div className="flex items-center gap-0 w-full">
      {PASOS.map((p, i) => (
        <div key={p.key} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className={[
              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
              i < idx  ? "bg-emerald-500 text-white"   :
              i === idx ? "bg-[#13193a] text-white ring-4 ring-[#13193a]/15" :
                          "bg-gray-200 text-gray-400",
            ].join(" ")}>
              {i < idx
                ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                : i + 1}
            </div>
            <span className={`text-[10px] font-semibold whitespace-nowrap ${i === idx ? "text-[#13193a]" : "text-gray-400"}`}>
              {p.label}
            </span>
          </div>
          {i < PASOS.length - 1 && (
            <div className={`flex-1 h-0.5 mb-4 mx-1.5 transition-colors ${i < idx ? "bg-emerald-400" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export { PASOS };
