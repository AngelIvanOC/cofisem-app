// ============================================================
// src/features/analista/pagos/ModalHistorial.jsx
// Modal con el historial de cuotas de una póliza y botón aplicar
// ============================================================
import { useState } from "react";
import Modal from "../../../shared/ui/Modal";
import ModalAplicarPago from "./ModalAplicarPago";

function CuotaBadge({ pagado, vencida }) {
  if (pagado)  return <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Pagado</span>;
  if (vencida) return <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">Vencida</span>;
  return             <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Pendiente</span>;
}

export default function ModalHistorial({ poliza, onClose, onAplicar }) {
  const [cuotaSel, setCuotaSel] = useState(null);
  const hoy = new Date();

  const pagadas   = poliza.cuotas.filter((c) => c.pagado).length;
  const total     = poliza.cuotas.reduce((s, c) => s + c.monto, 0);
  const cobrado   = poliza.cuotas.filter((c) => c.pagado).reduce((s, c) => s + c.monto, 0);

  return (
    <>
      <Modal onClose={onClose} title="Pagos y cuotas" subtitle={`Póliza ${poliza.id} · ${poliza.asegurado}`} maxWidth="max-w-2xl">
        <div className="p-6 space-y-5">
          {/* Resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Forma de pago", value: poliza.formaPago,               mono: false },
              { label: "Total póliza",  value: `$${total.toFixed(2)}`,         mono: true  },
              { label: "Cobrado",       value: `$${cobrado.toFixed(2)}`,       mono: true  },
              { label: "Por cobrar",    value: `$${(total - cobrado).toFixed(2)}`, mono: true },
            ].map((f) => (
              <div key={f.label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{f.label}</p>
                <p className={`text-sm font-bold text-[#13193a] ${f.mono ? "font-mono" : ""}`}>{f.value}</p>
              </div>
            ))}
          </div>

          {/* Barra de progreso */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>{pagadas} de {poliza.cuotas.length} cuotas pagadas</span>
              <span>{Math.round((pagadas / poliza.cuotas.length) * 100)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(pagadas / poliza.cuotas.length) * 100}%` }} />
            </div>
          </div>

          {/* Cuotas */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Cuotas</p>
            {poliza.cuotas.map((c) => {
              const vtoDate = new Date(c.vto.split("/").reverse().join("-"));
              const vencida = !c.pagado && vtoDate < hoy;
              return (
                <div
                  key={c.num}
                  className={[
                    "flex items-center justify-between gap-3 p-4 rounded-2xl border transition-all",
                    c.pagado ? "bg-emerald-50/50 border-emerald-100" : vencida ? "bg-red-50/50 border-red-100" : "bg-white border-gray-200",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      c.pagado ? "bg-emerald-500 text-white" : vencida ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600"
                    }`}>
                      {c.pagado
                        ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                        : c.num
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#13193a]">${c.monto.toFixed(2)}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <p className="text-xs text-gray-400">Vto. {c.vto}</p>
                        {c.pagado && <><span className="text-gray-300">·</span><p className="text-xs text-emerald-600">Pagado {c.fechaPago} · {c.forma}</p></>}
                        {c.referencia && <p className="text-xs text-gray-400 font-mono">{c.referencia}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <CuotaBadge pagado={c.pagado} vencida={vencida} />
                    {!c.pagado && (
                      <button
                        onClick={() => setCuotaSel(c)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#13193a] text-white text-xs font-bold hover:bg-[#1e2a50] transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
                        Aplicar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {cuotaSel && (
        <ModalAplicarPago
          poliza={poliza}
          cuota={cuotaSel}
          onClose={() => setCuotaSel(null)}
          onAplicar={(data) => { onAplicar(data); setCuotaSel(null); }}
        />
      )}
    </>
  );
}
