// ============================================================
// src/features/supervisor/ajustadores/PerfilAjustador.jsx
// Panel lateral con historial y casos activos de un ajustador
// ============================================================
import Badge from "../../../shared/ui/Badge";

export default function PerfilAjustador({ ajustador: a, onClose }) {
  if (!a) return null;

  const cargaColor = a.activos >= 5 ? "text-red-500 bg-red-50 border-red-200"
                   : a.activos >= 3 ? "text-amber-600 bg-amber-50 border-amber-200"
                   : "text-emerald-600 bg-emerald-50 border-emerald-200";

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-sm bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-5 border-b border-gray-100 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[#13193a] text-white flex items-center justify-center text-base font-bold shrink-0">
            {a.nombre.split(" ").map((w) => w[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-[#13193a]">{a.nombre}</p>
            <p className="text-xs text-gray-400 mt-0.5">{a.tel} · {a.zona}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors mt-0.5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* KPIs del ajustador */}
        <div className="grid grid-cols-3 gap-2 p-4 border-b border-gray-100">
          {[
            { l:"Activos",     v:a.activos,   cls:"text-[#13193a]"      },
            { l:"Este mes",    v:a.cerradosMes,cls:"text-emerald-600"   },
            { l:"Tiempo prom.",v:a.tiempoProm, cls:"text-[#13193a]"    },
          ].map((m) => (
            <div key={m.l} className="text-center bg-gray-50 rounded-xl py-2.5">
              <p className={`text-lg font-bold ${m.cls}`}>{m.v}</p>
              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{m.l}</p>
            </div>
          ))}
        </div>

        {/* Carga actual */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Carga de trabajo</p>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${cargaColor}`}>
              {a.activos}/6 casos
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${a.activos >= 5 ? "bg-red-400" : a.activos >= 3 ? "bg-amber-400" : "bg-emerald-400"}`}
              style={{ width: `${Math.min((a.activos / 6) * 100, 100)}%` }} />
          </div>
        </div>

        {/* Casos activos */}
        <div className="flex-1 overflow-auto">
          <p className="px-4 pt-4 pb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wide">Casos activos</p>
          {a.casos.length === 0
            ? <p className="px-4 text-sm text-gray-400">Sin casos activos.</p>
            : a.casos.map((c, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-xs font-bold text-[#13193a]">{c.folio}</p>
                    <Badge estatus={c.estatus} showDot />
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">{c.tipo} · {c.asegurado}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{c.fecha}</p>
                </div>
                {c.lesionados && (
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full shrink-0">
                    ⚠
                  </span>
                )}
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
