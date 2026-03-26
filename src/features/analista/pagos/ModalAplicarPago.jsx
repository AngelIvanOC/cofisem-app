// ============================================================
// src/features/analista/pagos/ModalAplicarPago.jsx
// Modal para aplicar el pago de una cuota específica
// ============================================================
import { useState } from "react";
import Modal from "../../../shared/ui/Modal";
import { BotonesModal } from "../../../shared/forms/Campos";

const FORMAS_PAGO = ["Efectivo", "Transferencia", "Cheque", "Tarjeta de crédito", "Tarjeta de débito"];

export default function ModalAplicarPago({ poliza, cuota, onClose, onAplicar }) {
  const [fecha,      setFecha]      = useState(new Date().toISOString().split("T")[0]);
  const [forma,      setForma]      = useState("Efectivo");
  const [referencia, setReferencia] = useState("");
  const [monto,      setMonto]      = useState(cuota.monto.toFixed(2));
  const [loading,    setLoading]    = useState(false);

  const handleAplicar = () => {
    setLoading(true);
    setTimeout(() => {
      onAplicar({ polizaId: poliza.id, cuotaNum: cuota.num, fecha, forma, referencia, monto: parseFloat(monto) });
    }, 700);
  };

  return (
    <Modal onClose={onClose} title="Aplicar pago" subtitle={`Cuota ${cuota.num} · Póliza ${poliza.id}`}>
      <div className="p-6 space-y-4">
        {/* Resumen */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
          {[
            ["Asegurado",    poliza.asegurado],
            ["Cuota",        `${cuota.num} de ${poliza.cuotas.length}`],
            ["Fecha límite", cuota.vto],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between text-xs">
              <span className="text-gray-500">{l}</span>
              <span className="font-semibold text-[#13193a]">{v}</span>
            </div>
          ))}
        </div>

        {/* Monto */}
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Monto a pagar</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
            <input
              type="number" step="0.01" min="0"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]"
            />
          </div>
        </div>

        {/* Fecha */}
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Fecha de pago</label>
          <input
            type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]"
          />
        </div>

        {/* Forma de pago */}
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Forma de pago</label>
          <div className="flex flex-wrap gap-2">
            {FORMAS_PAGO.map((f) => (
              <button
                key={f}
                onClick={() => setForma(f)}
                className={[
                  "px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all",
                  forma === f ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300",
                ].join(" ")}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Referencia */}
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
            Referencia <span className="text-gray-300 normal-case font-normal">(opcional)</span>
          </label>
          <input
            value={referencia} onChange={(e) => setReferencia(e.target.value)}
            placeholder="Folio, número de transferencia..."
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]"
          />
        </div>
      </div>

      <BotonesModal
        onCancelar={onClose}
        onConfirmar={handleAplicar}
        textoConfirmar="Aplicar pago"
        disabled={!monto || !fecha}
        loading={loading}
      />
    </Modal>
  );
}
