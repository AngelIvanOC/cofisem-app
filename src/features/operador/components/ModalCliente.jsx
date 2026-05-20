import Campo from "./Campo";
import { ESTADOS_MX } from "../constants/catalogos";

export default function ModalCliente({ modal, form, onFieldChange, onClose, onGuardar }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter:"blur(8px)", backgroundColor:"rgba(10,15,40,0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-bold text-[#13193a]">{modal === "nuevo" ? "Nuevo cliente" : "Editar cliente"}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{modal === "nuevo" ? "Registra un nuevo asegurado" : "Actualiza los datos del asegurado"}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Datos personales</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Campo label="Nombre completo" value={form.nombre} onChange={v => onFieldChange("nombre",v)} placeholder="Nombre completo del asegurado" req/>
              </div>
              <Campo label="RFC"  value={form.rfc}  onChange={v => onFieldChange("rfc",v)}  placeholder="RFC con homoclave" req/>
              <Campo label="CURP" value={form.curp} onChange={v => onFieldChange("curp",v)} placeholder="CURP"/>
              <Campo label="Teléfono" type="tel" value={form.telefono} onChange={v => onFieldChange("telefono",v)} placeholder="55 0000 0000" req/>
              <Campo label="Correo electrónico" type="email" value={form.email} onChange={v => onFieldChange("email",v)} placeholder="correo@ejemplo.com"/>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Domicilio</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Campo label="Calle y número" value={form.calle} onChange={v => onFieldChange("calle",v)} placeholder="Av. Emiliano Zapata 145"/>
              </div>
              <Campo label="Colonia"   value={form.colonia}   onChange={v => onFieldChange("colonia",v)}   placeholder="Colonia"/>
              <Campo label="Municipio" value={form.municipio} onChange={v => onFieldChange("municipio",v)} placeholder="Municipio"/>
              <Campo label="C.P."      value={form.cp}        onChange={v => onFieldChange("cp",v)}        placeholder="62000"/>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Estado</label>
                <select value={form.estado} onChange={e => onFieldChange("estado", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]">
                  {ESTADOS_MX.map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={onGuardar} disabled={!form.nombre || !form.rfc}
            className="flex-1 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 transition-all">
            {modal === "nuevo" ? "Registrar cliente" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
