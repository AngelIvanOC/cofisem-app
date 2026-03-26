// ============================================================
// src/features/administracion/polizas/ModalCancelar.jsx
// Modal de confirmación de cancelación de póliza
// ============================================================
import { useState } from "react";
import Modal from "../../../shared/ui/Modal";
import { BotonesModal } from "../../../shared/forms/Campos";

const MOTIVOS = ["Solicitud del cliente", "Falta de pago", "Duplicado", "Error en emisión", "Otro"];

export default function ModalCancelar({ poliza, onClose, onConfirmar }) {
  const [motivo,     setMotivo]     = useState("");
  const [procesando, setProcesando] = useState(false);

  return (
    <Modal onClose={onClose} title="Cancelar póliza" subtitle={`${poliza.id} · ${poliza.asegurado}`} maxWidth="max-w-md">
      <div className="p-6 space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-medium">
          Esta acción cancelará la póliza. El asegurado perderá cobertura de inmediato.
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">
            Motivo <span className="text-red-400">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {MOTIVOS.map((m) => (
              <button
                key={m}
                onClick={() => setMotivo(m)}
                className={[
                  "px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all",
                  motivo === m ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300",
                ].join(" ")}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>
      <BotonesModal
        onCancelar={onClose}
        onConfirmar={() => { setProcesando(true); setTimeout(() => onConfirmar(poliza.id, motivo), 700); }}
        textoConfirmar="Confirmar cancelación"
        disabled={!motivo}
        loading={procesando}
      />
    </Modal>
  );
}
