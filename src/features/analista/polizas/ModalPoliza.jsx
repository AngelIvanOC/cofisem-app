// ============================================================
// src/features/analista/polizas/ModalPoliza.jsx
// Modal de detalle + cambio de estatus de una póliza
// El analista puede aplicar pólizas pendientes y cambiar estatus
// ============================================================
import { useState } from "react";
import Modal from "../../../shared/ui/Modal";
import Badge from "../../../shared/ui/Badge";
import { BotonesModal } from "../../../shared/forms/Campos";

const CAMBIOS_ESTATUS = ["Vigente", "Suspendida", "Cancelada", "Por vencer"];

const FILAS_POLIZA = (p) => [
  ["No. Póliza",    p.id,            "mono"],
  ["Aseguradora",   p.aseguradora,   ""],
  ["Asegurado",     p.asegurado,     "semibold"],
  ["Cobertura",     p.cobertura,     ""],
  ["Oficina",       p.oficina,       ""],
  ["Vendedor",      p.vendedor,      ""],
  ["Placas",        p.placas,        "mono"],
  ["Uso / Tipo",    `${p.uso} · ${p.tipo}`, ""],
  ["Vigencia",      `${p.vigDesde} → ${p.vigHasta}`, ""],
  ["Forma de pago", p.formaPago,     ""],
  ["Prima total",   `$${p.prima.toFixed(2)}`,    "emerald"],
  ["Prima neta",    `$${p.primaNeta.toFixed(2)}`, ""],
  ["1er pago",      `$${p.primerPago.toFixed(2)}`,""],
  ["Fecha emisión", p.fechaEmision,  ""],
];

export default function ModalPoliza({ poliza, onClose, onGuardar }) {
  const [estatus,   setEstatus]   = useState(poliza.estatus);
  const [notas,     setNotas]     = useState(poliza.notas ?? "");
  const [loading,   setLoading]   = useState(false);

  const cambioEstatus = estatus !== poliza.estatus;

  const handleGuardar = () => {
    setLoading(true);
    setTimeout(() => { onGuardar({ ...poliza, estatus, notas }); }, 600);
  };

  return (
    <Modal onClose={onClose} title="Detalle de Póliza" subtitle={poliza.id} maxWidth="max-w-2xl">
      <div className="p-6 space-y-5">
        {/* Datos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
          {FILAS_POLIZA(poliza).map(([label, valor, cls]) => (
            <div key={label} className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
              <p className="text-xs text-gray-400 shrink-0 font-medium">{label}</p>
              <p className={`text-xs text-right truncate max-w-xs ${
                cls === "mono"     ? "font-mono font-bold text-[#13193a]" :
                cls === "semibold" ? "font-semibold text-[#13193a]"       :
                cls === "emerald"  ? "font-bold text-emerald-700"         :
                "text-gray-700"
              }`}>{valor}</p>
            </div>
          ))}
        </div>

        {/* Cambio de estatus */}
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-4">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Gestión de estatus</p>

          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-xs text-gray-500">Estatus actual:</p>
            <Badge estatus={poliza.estatus} showDot />
            {cambioEstatus && (
              <>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                <Badge estatus={estatus} showDot />
              </>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Cambiar a</label>
            <div className="flex flex-wrap gap-2">
              {CAMBIOS_ESTATUS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEstatus(e)}
                  className={[
                    "px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all",
                    estatus === e
                      ? "bg-[#13193a] text-white border-[#13193a]"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300",
                  ].join(" ")}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Notas / Motivo</label>
            <textarea
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Motivo del cambio, observaciones..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] resize-none"
            />
          </div>
        </div>

        {/* Banner póliza pendiente de aplicar */}
        {poliza.estatus === "Pend. aplicar" && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg>
              <div>
                <p className="text-sm font-bold text-blue-800">Póliza pendiente de aplicación</p>
                <p className="text-xs text-blue-600 mt-0.5">Fue tramitada por una operadora y requiere revisión en el sistema de la aseguradora.</p>
              </div>
            </div>
            <button
              onClick={() => setEstatus("Vigente")}
              className="mt-3 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all"
            >
              Marcar como aplicada → Vigente
            </button>
          </div>
        )}
      </div>

      <BotonesModal
        onCancelar={onClose}
        onConfirmar={handleGuardar}
        textoConfirmar="Guardar cambios"
        loading={loading}
      />
    </Modal>
  );
}
