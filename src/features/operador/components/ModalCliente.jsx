import { useCallback } from "react";
import Campo from "./Campo";
import DireccionFields from "./DireccionFields";

export default function ModalCliente({
  modal,
  form,
  onFieldChange,
  onClose,
  onGuardar,
  saving,
}) {
  const handleDireccion = useCallback(
    (key, val) => onFieldChange(key, val),
    [onFieldChange],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backdropFilter: "blur(8px)",
        backgroundColor: "rgba(10,15,40,0.5)",
      }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-bold text-[#13193a]">
              {modal === "nuevo" ? "Nuevo cliente" : "Editar cliente"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {modal === "nuevo"
                ? "Registra un nuevo asegurado"
                : "Actualiza los datos del asegurado"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Datos personales
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-1">
              <Campo
                label="Nombre(s)"
                value={form.nombre}
                onChange={(v) => onFieldChange("nombre", v)}
                placeholder="Nombre(s) del asegurado"
                req
              />
              <Campo
                label="Apellido paterno"
                value={form.apellido1}
                onChange={(v) => onFieldChange("apellido1", v)}
                placeholder="Apellido paterno"
                req
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-1">
              <Campo
                label="Apellido materno"
                value={form.apellido2}
                onChange={(v) => onFieldChange("apellido2", v)}
                placeholder="Apellido materno"
                req
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-1">
              <Campo
                label="Teléfono"
                type="tel"
                value={form.telefono}
                onChange={(v) => onFieldChange("telefono", v)}
                placeholder="55 0000 0000"
              />
              <Campo
                label="RFC"
                value={form.rfc}
                onChange={(v) => onFieldChange("rfc", v.toUpperCase())}
                placeholder="RFC con homoclave"
                req
              />
              <Campo
                label="CURP"
                value={form.curp}
                onChange={(v) => onFieldChange("curp", v.toUpperCase())}
                placeholder="CURP"
                req
              />
              <Campo
                label="Correo electrónico"
                type="email"
                value={form.email}
                onChange={(v) => onFieldChange("email", v)}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <p className="px-0 py-0 my-0 text-xs text-gray-400">
              <span className="text-red-400 font-bold">*</span> Campos
              obligatorios
            </p>
          </div>

          <div className="mb-1 pb-0">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Domicilio
            </p>
            <DireccionFields
              values={{
                cp: form.cp,
                estado: form.estado,
                municipio: form.municipio,
                colonia: form.colonia,
                calle: form.calle,
                numeroExt: form.numeroExt ?? "",
                numeroInt: form.numeroInt ?? "",
              }}
              onChange={handleDireccion}
              req
            />
          </div>

          <p className="px-0 py-0 my-0 text-xs text-gray-400">
            <span className="text-red-400 font-bold">*</span> Campos
            obligatorios
          </p>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onGuardar}
            disabled={
              !form.nombre || !form.apellido1 || !form.apellido2 ||
              !form.rfc || !form.curp ||
              !form.cp || !form.estado || !form.municipio || !form.colonia || !form.calle || !form.numeroExt ||
              saving
            }
            className="flex-1 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 transition-all"
          >
            {saving
              ? "Guardando…"
              : modal === "nuevo"
                ? "Registrar cliente"
                : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
