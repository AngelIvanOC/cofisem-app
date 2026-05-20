import { useState } from "react";

export default function ModalNuevoConcesionario({ onClose, onGuardar }) {
  const [val, setVal] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter:"blur(8px)", backgroundColor:"rgba(10,15,40,0.5)" }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-[#13193a]">Nuevo concesionario</h2>
            <p className="text-xs text-gray-400 mt-0.5">Agrega un concesionario al asegurado seleccionado</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
            Número / descripción <span className="text-red-400">*</span>
          </label>
          <input autoFocus value={val} onChange={e => setVal(e.target.value)}
            placeholder="Ej: CON-MOR-1099 — Cuernavaca"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all" />
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button onClick={() => { if (val.trim()) onGuardar(val.trim()); }} disabled={!val.trim()}
            className="flex-1 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 transition-all">
            Agregar concesionario
          </button>
        </div>
      </div>
    </div>
  );
}
