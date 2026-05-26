import { useState } from "react";
import { crearVendedor } from "../../../services/vendedores";
import { OFICINA } from "../constants/cobertura";

function Campo({ label, value, onChange, placeholder, type = "text", req }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
        {label}
        {req && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all"
      />
    </div>
  );
}

const EMPTY = {
  nombre: "",
  apellido1: "",
  apellido2: "",
  telefono: "",
  email: "",
};

export default function ModalNuevoVendedor({ onClose, onGuardar, usuarioId }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const canSave = !!(form.nombre && form.apellido1 && form.telefono);

  const guardar = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const vendedor = await crearVendedor(
        { ...form, oficina: OFICINA.codigo },
        usuarioId,
      );
      onGuardar(vendedor);
    } catch (e) {
      alert("Error al registrar vendedor: " + e.message);
    } finally {
      setSaving(false);
    }
  };

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
          <div>
            <h2 className="text-base font-bold text-[#13193a]">
              Nuevo vendedor
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              El número se asigna automáticamente
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

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Campo
              label="Nombre(s)"
              value={form.nombre}
              onChange={(v) => setF("nombre", v)}
              placeholder="Nombre"
              req
            />
            <Campo
              label="Primer apellido"
              value={form.apellido1}
              onChange={(v) => setF("apellido1", v)}
              placeholder="Primer apellido"
              req
            />
          </div>
          <Campo
            label="Segundo apellido"
            value={form.apellido2}
            onChange={(v) => setF("apellido2", v)}
            placeholder="Segundo apellido"
          />
          <Campo
            label="Teléfono"
            type="tel"
            value={form.telefono}
            onChange={(v) => setF("telefono", v)}
            placeholder="55 0000 0000"
            req
          />
          <Campo
            label="Correo electrónico"
            type="email"
            value={form.email}
            onChange={(v) => setF("email", v)}
            placeholder="correo@cofisem.com"
          />

          <p className="px-0 text-xs text-gray-400">
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
            onClick={guardar}
            disabled={!canSave || saving}
            className="flex-1 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 transition-all"
          >
            {saving ? "Registrando…" : "Registrar vendedor"}
          </button>
        </div>
      </div>
    </div>
  );
}
