import { useState } from "react";
import { ESTADOS_MX } from "../constants/catalogos";

const EMPTY = {
  nombre:"", rfc:"", curp:"", telefono:"", email:"",
  calle:"", colonia:"", municipio:"", cp:"", estado:"Morelos",
};

function CampoModal({ label, value, onChange, placeholder, type = "text", req }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
        {label}{req && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input type={type} value={value ?? ""} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all" />
    </div>
  );
}

export default function ModalNuevoAsegurado({ onClose, onGuardar }) {
  const [form, setForm] = useState(EMPTY);
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const guardar = () => { if (!form.nombre || !form.rfc) return; onGuardar(form.nombre); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter:"blur(8px)", backgroundColor:"rgba(10,15,40,0.5)" }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-bold text-[#13193a]">Nuevo asegurado</h2>
            <p className="text-xs text-gray-400 mt-0.5">Registra un nuevo asegurado</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Datos personales</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <CampoModal label="Nombre completo" value={form.nombre} onChange={v => setF("nombre",v)} placeholder="Nombre completo del asegurado" req />
              </div>
              <CampoModal label="RFC"  value={form.rfc}      onChange={v => setF("rfc",v)}      placeholder="RFC con homoclave" req />
              <CampoModal label="CURP" value={form.curp}     onChange={v => setF("curp",v)}     placeholder="CURP" />
              <CampoModal label="Teléfono" type="tel" value={form.telefono} onChange={v => setF("telefono",v)} placeholder="55 0000 0000" req />
              <CampoModal label="Correo electrónico" type="email" value={form.email} onChange={v => setF("email",v)} placeholder="correo@ejemplo.com" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Domicilio</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <CampoModal label="Calle y número" value={form.calle} onChange={v => setF("calle",v)} placeholder="Av. Emiliano Zapata 145" />
              </div>
              <CampoModal label="Colonia"   value={form.colonia}   onChange={v => setF("colonia",v)}   placeholder="Colonia" />
              <CampoModal label="Municipio" value={form.municipio} onChange={v => setF("municipio",v)} placeholder="Municipio" />
              <CampoModal label="C.P."      value={form.cp}        onChange={v => setF("cp",v)}        placeholder="62000" />
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Estado</label>
                <select value={form.estado} onChange={e => setF("estado", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]">
                  {ESTADOS_MX.map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button onClick={guardar} disabled={!form.nombre || !form.rfc}
            className="flex-1 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 transition-all">
            Registrar asegurado
          </button>
        </div>
      </div>
    </div>
  );
}
