// ============================================================
// src/features/administracion/polizas/ModalEndoso.jsx
// Modal para generar un endoso sobre una póliza
// ============================================================
import { useState } from "react";
import Modal from "../../../shared/ui/Modal";
import { CampoTexto, BotonesModal } from "../../../shared/forms/Campos";

const TIPOS_ENDOSO = [
  "Cambio de placas", "Cambio de vehículo", "Cambio de titular",
  "Cambio de domicilio", "Adición de cobertura", "Reducción de cobertura",
  "Corrección de datos", "Otro",
];

export default function ModalEndoso({ poliza, onClose, onConfirmar }) {
  const [tipo,       setTipo]       = useState("");
  const [detalle,    setDetalle]    = useState("");
  const [valorNuevo, setValorNuevo] = useState("");
  const [procesando, setProcesando] = useState(false);

  const rdoCls = "w-full px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm font-semibold text-[#13193a] cursor-default";

  return (
    <Modal onClose={onClose} title="Nuevo endoso" subtitle={`${poliza.id} · ${poliza.asegurado}`} maxWidth="max-w-lg">
      <div className="p-6 space-y-4">
        {/* Datos readonly de la póliza */}
        <div className="grid grid-cols-2 gap-3">
          {[["Póliza", poliza.id], ["Asegurado", poliza.asegurado], ["Placas", poliza.placas], ["Cobertura", poliza.cobertura]].map(([l, v]) => (
            <div key={l}>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">{l}</label>
              <input readOnly value={v} className={rdoCls} />
            </div>
          ))}
        </div>

        {/* Tipo de endoso */}
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">
            Tipo de endoso <span className="text-red-400">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {TIPOS_ENDOSO.map((t) => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className={[
                  "px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all",
                  tipo === t ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300",
                ].join(" ")}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <CampoTexto label="Nuevo valor" value={valorNuevo} onChange={setValorNuevo} placeholder="Ej. nueva placa, nuevo nombre..." />
        <CampoTexto label="Descripción" value={detalle} onChange={setDetalle} placeholder="Detalle del cambio..." rows={2} req />
      </div>

      <BotonesModal
        onCancelar={onClose}
        onConfirmar={() => { setProcesando(true); setTimeout(() => onConfirmar(poliza.id, { tipo, detalle, valorNuevo }), 700); }}
        textoConfirmar="Generar endoso"
        disabled={!tipo || !detalle}
        loading={procesando}
      />
    </Modal>
  );
}
