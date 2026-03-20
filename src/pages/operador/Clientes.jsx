// ============================================================
// src/pages/operador/Clientes.jsx
// Alta y edición de asegurados (clientes)
// ============================================================
import { useState } from "react";

const CLIENTES_MOCK = [
  { id: 1, nombre: "Angel Ivan Ortega Chaverría",  rfc: "OACA900312HM",  telefono: "777 792 1225", email: "angel@mail.com",  polizas: 2, activo: true  },
  { id: 2, nombre: "María García López",            rfc: "GALM850601HM",  telefono: "777 100 3344", email: "maria@mail.com",  polizas: 1, activo: true  },
  { id: 3, nombre: "Roberto Díaz Ramos",            rfc: "DIRR780910HM",  telefono: "777 234 5678", email: "roberto@mail.com",polizas: 3, activo: true  },
  { id: 4, nombre: "Sofía Torres Ruiz",             rfc: "TORS920420HM",  telefono: "777 456 7890", email: "sofia@mail.com",  polizas: 1, activo: false },
  { id: 5, nombre: "Juan Pérez Salinas",            rfc: "PESJ881125HM",  telefono: "777 654 3210", email: "juan@mail.com",   polizas: 0, activo: true  },
];

const EMPTY_FORM = { nombre: "", rfc: "", curp: "", telefono: "", email: "", calle: "", colonia: "", municipio: "", cp: "", estado: "Morelos" };
const ESTADOS_MX = ["Aguascalientes","Baja California","Baja California Sur","Campeche","Chiapas","Chihuahua","Ciudad de México","Coahuila","Colima","Durango","Estado de México","Guanajuato","Guerrero","Hidalgo","Jalisco","Michoacán","Morelos","Nayarit","Nuevo León","Oaxaca","Puebla","Querétaro","Quintana Roo","San Luis Potosí","Sinaloa","Sonora","Tabasco","Tamaulipas","Tlaxcala","Veracruz","Yucatán","Zacatecas"];

function Campo({ label, value, onChange, placeholder, readonly, type = "text", req }) {
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

export default function Clientes() {
  const [clientes, setClientes]   = useState(CLIENTES_MOCK);
  const [busqueda, setBusqueda]   = useState("");
  const [modal,    setModal]      = useState(null);  // null | "nuevo" | "editar"
  const [form,     setForm]       = useState(EMPTY_FORM);
  const [editId,   setEditId]     = useState(null);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const filtrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.rfc.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.telefono.includes(busqueda)
  );

  const abrirNuevo = () => { setForm(EMPTY_FORM); setEditId(null); setModal("nuevo"); };
  const abrirEditar = c => {
    setForm({ nombre: c.nombre, rfc: c.rfc, curp:"", telefono: c.telefono, email: c.email, calle:"", colonia:"", municipio:"Jiutepec", cp:"", estado:"Morelos" });
    setEditId(c.id);
    setModal("editar");
  };

  const guardar = () => {
    if (!form.nombre || !form.rfc) return;
    if (editId) {
      setClientes(cs => cs.map(c => c.id === editId ? { ...c, nombre: form.nombre, rfc: form.rfc, telefono: form.telefono, email: form.email } : c));
    } else {
      setClientes(cs => [...cs, { id: Date.now(), nombre: form.nombre, rfc: form.rfc, telefono: form.telefono, email: form.email, polizas: 0, activo: true }]);
    }
    setModal(null);
  };

  return (
    <div className="p-6 min-h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Clientes</h1>
          <p className="text-gray-400 text-sm mt-0.5">{filtrados.length} asegurados registrados</p>
        </div>
        <button onClick={abrirNuevo}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#13193a] text-white text-sm font-semibold hover:bg-[#1e2a50] transition-all shadow-sm shadow-[#13193a]/15">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          Nuevo cliente
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="relative flex-1 max-w-sm">
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
            </svg>
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, RFC o teléfono..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {["Nombre", "RFC", "Teléfono", "Email", "Pólizas", "Estatus", ""].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtrados.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-sm text-gray-400">No se encontraron clientes.</td></tr>
              ) : filtrados.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-semibold text-[#13193a]">{c.nombre}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-600">{c.rfc}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-600">{c.telefono}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{c.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                      c.polizas > 0 ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-100 text-gray-500 border-gray-200"
                    }`}>
                      {c.polizas} {c.polizas === 1 ? "póliza" : "pólizas"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                      c.activo ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"
                    }`}>
                      {c.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => abrirEditar(c)}
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

      {/* Modal nuevo/editar */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter:"blur(8px)", backgroundColor:"rgba(10,15,40,0.5)" }}
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-base font-bold text-[#13193a]">{modal === "nuevo" ? "Nuevo cliente" : "Editar cliente"}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{modal === "nuevo" ? "Registra un nuevo asegurado" : "Actualiza los datos del asegurado"}</p>
              </div>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Datos personales */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Datos personales</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Campo label="Nombre completo" value={form.nombre} onChange={v => setF("nombre",v)} placeholder="Nombre completo del asegurado" req/>
                  </div>
                  <Campo label="RFC"  value={form.rfc}  onChange={v => setF("rfc",v)}  placeholder="RFC con homoclave" req/>
                  <Campo label="CURP" value={form.curp} onChange={v => setF("curp",v)} placeholder="CURP"/>
                  <Campo label="Teléfono" type="tel" value={form.telefono} onChange={v => setF("telefono",v)} placeholder="55 0000 0000" req/>
                  <Campo label="Correo electrónico" type="email" value={form.email} onChange={v => setF("email",v)} placeholder="correo@ejemplo.com"/>
                </div>
              </div>

              {/* Dirección */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Domicilio</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Campo label="Calle y número" value={form.calle} onChange={v => setF("calle",v)} placeholder="Av. Emiliano Zapata 145"/>
                  </div>
                  <Campo label="Colonia" value={form.colonia} onChange={v => setF("colonia",v)} placeholder="Colonia"/>
                  <Campo label="Municipio" value={form.municipio} onChange={v => setF("municipio",v)} placeholder="Municipio"/>
                  <Campo label="C.P." value={form.cp} onChange={v => setF("cp",v)} placeholder="62000"/>
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

            {/* Footer */}
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={guardar}
                disabled={!form.nombre || !form.rfc}
                className="flex-1 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 transition-all">
                {modal === "nuevo" ? "Registrar cliente" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}