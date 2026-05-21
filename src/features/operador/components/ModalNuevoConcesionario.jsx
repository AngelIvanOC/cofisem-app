import { useState } from "react";
import { crearConcesionario } from "../../../services/concesionarios";

const EMPTY = { nombre: "", apellido1: "", apellido2: "" };

function Campo({ label, value, onChange, placeholder, req, autoFocus }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
        {label}
        {req && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all"
      />
    </div>
  );
}

export default function ModalNuevoConcesionario({ onClose, onGuardar, clienteId, usuarioId }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const guardar = async () => {
    if (!form.nombre.trim()) return;
    setSaving(true);
    try {
      const concesionario = await crearConcesionario({
        clienteId,
        nombre:    form.nombre,
        apellido1: form.apellido1,
        apellido2: form.apellido2,
        creadoPor: usuarioId,
      });
      onGuardar(concesionario);
    } catch (e) {
      alert("Error al registrar concesionario: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(10,15,40,0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-[#13193a]">Nuevo concesionario</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Agrega un concesionario al asegurado seleccionado
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <Campo
            label="Nombre(s)"
            value={form.nombre}
            onChange={(v) => setF("nombre", v)}
            placeholder="Nombre(s)"
            req
            autoFocus
          />
          <Campo
            label="Primer apellido"
            value={form.apellido1}
            onChange={(v) => setF("apellido1", v)}
            placeholder="Primer apellido"
          />
          <Campo
            label="Segundo apellido"
            value={form.apellido2}
            onChange={(v) => setF("apellido2", v)}
            placeholder="Segundo apellido"
          />
          <p className="text-xs text-gray-400">
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
            onClick={guardar}
            disabled={!form.nombre.trim() || saving}
            className="flex-1 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 transition-all"
          >
            {saving ? "Registrando…" : "Agregar concesionario"}
          </button>
        </div>
      </div>
    </div>
  );
}
