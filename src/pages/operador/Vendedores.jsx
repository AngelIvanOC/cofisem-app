// ============================================================
// src/pages/operador/Vendedores.jsx
// Alta y edición de vendedores asignados a la oficina
// ============================================================
import { useState } from "react";

const VENDEDORES_MOCK = [
  { id: 1, folio: "T0455", nombre: "Laura Rosher García",    telefono: "777 111 2233", email: "laura@cofisem.com",   polizasMes: 18, activo: true  },
  { id: 2, folio: "T0312", nombre: "Marco Antonio Cruz",     telefono: "777 444 5566", email: "marco@cofisem.com",   polizasMes: 12, activo: true  },
  { id: 3, folio: "T0289", nombre: "Carlos Soto Vargas",     telefono: "777 777 8899", email: "carlos@cofisem.com",  polizasMes: 9,  activo: true  },
  { id: 4, folio: "T0201", nombre: "Patricia Morales Ruiz",  telefono: "777 200 3344", email: "patricia@cofisem.com",polizasMes: 0,  activo: false },
];

const EMPTY_FORM = { folio: "", nombre: "", telefono: "", email: "", password: "" };

function Campo({ label, value, onChange, placeholder, type = "text", req, readonly }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
        {label}{req && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        readOnly={readonly}
        value={value ?? ""}
        onChange={onChange ? e => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        className={readonly
          ? "w-full px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm font-semibold text-[#13193a] cursor-default"
          : "w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all"
        }
      />
    </div>
  );
}

export function Vendedores() {
  const [vendedores, setVendedores] = useState(VENDEDORES_MOCK);
  const [busqueda,   setBusqueda]   = useState("");
  const [modal,      setModal]      = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [editId,     setEditId]     = useState(null);
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const filtrados = vendedores.filter(v =>
    v.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    v.folio.toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirNuevo   = () => { setForm(EMPTY_FORM); setEditId(null); setModal("nuevo"); };
  const abrirEditar  = v => { setForm({ folio: v.folio, nombre: v.nombre, telefono: v.telefono, email: v.email, password: "" }); setEditId(v.id); setModal("editar"); };
  const toggleActivo = id => setVendedores(vs => vs.map(v => v.id === id ? { ...v, activo: !v.activo } : v));

  const guardar = () => {
    if (!form.nombre || !form.folio) return;
    if (editId) {
      setVendedores(vs => vs.map(v => v.id === editId ? { ...v, folio: form.folio, nombre: form.nombre, telefono: form.telefono, email: form.email } : v));
    } else {
      setVendedores(vs => [...vs, { id: Date.now(), folio: form.folio, nombre: form.nombre, telefono: form.telefono, email: form.email, polizasMes: 0, activo: true }]);
    }
    setModal(null);
  };

  return (
    <div className="p-6 min-h-full bg-gray-50">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Vendedores</h1>
          <p className="text-gray-400 text-sm mt-0.5">{filtrados.length} vendedores en esta oficina</p>
        </div>
        <button onClick={abrirNuevo}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#13193a] text-white text-sm font-semibold hover:bg-[#1e2a50] transition-all shadow-sm shadow-[#13193a]/15">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          Nuevo vendedor
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="relative flex-1 max-w-sm">
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
            </svg>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre o folio..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] bg-white"/>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {["Folio", "Nombre", "Teléfono", "Email", "Pólizas mes", "Estatus", ""].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtrados.map(v => (
                <tr key={v.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs font-bold text-[#13193a]">{v.folio}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-[#13193a]">{v.nombre}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-600">{v.telefono}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{v.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                      v.polizasMes > 0 ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-100 text-gray-500 border-gray-200"
                    }`}>
                      {v.polizasMes} pólizas
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => toggleActivo(v.id)} className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer transition-all ${
                      v.activo ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
                    }`}>
                      {v.activo ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => abrirEditar(v)}
                      className="w-7 h-7 rounded-lg text-gray-300 hover:text-[#13193a] hover:bg-gray-100 flex items-center justify-center transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter:"blur(8px)", backgroundColor:"rgba(10,15,40,0.5)" }}
          onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-[#13193a]">{modal === "nuevo" ? "Nuevo vendedor" : "Editar vendedor"}</h2>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Campo label="Folio" value={form.folio} onChange={v => setF("folio", v)} placeholder="T0000" req/>
                <Campo label="Nombre completo" value={form.nombre} onChange={v => setF("nombre", v)} placeholder="Nombre completo" req/>
              </div>
              <Campo label="Teléfono" type="tel" value={form.telefono} onChange={v => setF("telefono", v)} placeholder="55 0000 0000"/>
              <Campo label="Correo electrónico" type="email" value={form.email} onChange={v => setF("email", v)} placeholder="correo@cofisem.com"/>
              {modal === "nuevo" && <Campo label="Contraseña" type="password" value={form.password} onChange={v => setF("password", v)} placeholder="Contraseña de acceso" req/>}
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={guardar} disabled={!form.nombre || !form.folio} className="flex-1 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 transition-all">
                {modal === "nuevo" ? "Registrar" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Vendedores;