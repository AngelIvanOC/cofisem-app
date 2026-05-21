import Campo from "./Campo";

export default function ModalVendedor({
  modal,
  form,
  onFieldChange,
  onClose,
  onGuardar,
  saving,
}) {
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-[#13193a]">
            {modal === "nuevo" ? "Nuevo vendedor" : "Editar vendedor"}
          </h2>
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
        <div className="p-6 space-y-4">
          <Campo
            label="Nombre(s)"
            value={form.nombre}
            onChange={(v) => onFieldChange("nombre", v)}
            placeholder="Nombre"
            req
          />

          <div className="grid grid-cols-2 gap-4">
            <Campo
              label="Primer apellido"
              value={form.apellido1}
              onChange={(v) => onFieldChange("apellido1", v)}
              placeholder="Primer apellido"
            />
            <Campo
              label="Segundo apellido"
              value={form.apellido2}
              onChange={(v) => onFieldChange("apellido2", v)}
              placeholder="Segundo apellido"
            />
          </div>
          <Campo
            label="Teléfono"
            type="tel"
            value={form.telefono}
            onChange={(v) => onFieldChange("telefono", v)}
            placeholder="55 0000 0000"
          />
          <Campo
            label="Correo electrónico"
            type="email"
            value={form.email}
            onChange={(v) => onFieldChange("email", v)}
            placeholder="correo@cofisem.com"
          />

          <p className="px-0 py-0 my-0 text-xs text-gray-400">
            <span className="text-red-400 font-bold">*</span> Campos obligatorios
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
            disabled={!form.nombre || saving}
            className="flex-1 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 transition-all"
          >
            {saving
              ? "Guardando..."
              : modal === "nuevo"
                ? "Registrar"
                : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
