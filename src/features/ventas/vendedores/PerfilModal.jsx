// ============================================================
// src/features/ventas/vendedores/PerfilModal.jsx
// Modal con el perfil de ventas completo de un vendedor
// ============================================================
import Modal from "../../../shared/ui/Modal";

const MESES_C = ["Oct","Nov","Dic","Ene","Feb","Mar"];

function MiniBar({ value, max, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width:`${pct}%`, backgroundColor:color }} />
    </div>
  );
}

export default function PerfilModal({ vendedor: v, onClose }) {
  if (!v) return null;
  const maxPol = Math.max(...v.historial.map(h => h.polizas), 1);

  return (
    <Modal onClose={onClose} title={v.nombre} subtitle={`${v.oficina} · ${v.tel}`} maxWidth="max-w-lg">
      <div className="p-6 space-y-5">
        {/* KPIs rápidos */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { l:"Este mes",   v:v.actual,                       cls:"text-[#13193a]"    },
            { l:"Meta",       v:v.meta,                         cls:"text-gray-500"     },
            { l:"Tasa cierre",v:`${v.tasaCierre}%`,             cls:"text-emerald-600"  },
            { l:"Ticket prom",v:`$${v.ticketProm.toLocaleString()}`, cls:"text-blue-600" },
          ].map((m) => (
            <div key={m.l} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className={`text-xl font-bold ${m.cls}`}>{m.v}</p>
              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{m.l}</p>
            </div>
          ))}
        </div>

        {/* Barra de avance del mes */}
        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="font-bold text-gray-500">Avance · {v.actual} / {v.meta} pólizas</span>
            <span className={`font-bold ${Math.round((v.actual/v.meta)*100) >= 100 ? "text-emerald-600" : "text-amber-600"}`}>
              {Math.round((v.actual/v.meta)*100)}%
            </span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${v.actual>=v.meta?"bg-emerald-400":v.actual/v.meta>=0.7?"bg-blue-400":"bg-amber-400"}`}
              style={{ width:`${Math.min((v.actual/v.meta)*100,100)}%` }} />
          </div>
        </div>

        {/* Historial 6 meses */}
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-3">Últimos 6 meses</p>
          <div className="space-y-2.5">
            {v.historial.map((h, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-7 shrink-0">{MESES_C[i]}</span>
                <div className="flex-1">
                  <MiniBar value={h.polizas} max={maxPol} color={h.polizas >= v.meta ? "#10B981" : h.polizas/v.meta >= 0.7 ? "#3B82F6" : "#F59E0B"} />
                </div>
                <span className="text-xs font-bold text-[#13193a] tabular-nums w-5 text-right">{h.polizas}</span>
                <span className="text-[11px] text-emerald-600 font-semibold w-20 text-right tabular-nums">${h.prima.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top coberturas */}
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-3">Top coberturas vendidas</p>
          <div className="flex flex-wrap gap-2">
            {v.topCoberturas.map((c, i) => (
              <span key={i} className="px-3 py-1.5 rounded-xl bg-gray-100 text-xs font-semibold text-gray-600">{c}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
        <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          Cerrar
        </button>
      </div>
    </Modal>
  );
}
