import { useState } from "react";
import { CLIENTES_MOCK, EMPTY_FORM } from "./data/clientesMock";
import ModalCliente from "./components/ModalCliente";

export default function Clientes() {
  const [clientes, setClientes] = useState(CLIENTES_MOCK);
  const [busqueda, setBusqueda] = useState("");
  const [modal,    setModal]    = useState(null);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [editId,   setEditId]   = useState(null);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const filtrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.rfc.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.telefono.includes(busqueda)
  );

  const abrirNuevo  = () => { setForm(EMPTY_FORM); setEditId(null); setModal("nuevo"); };
  const abrirEditar = c => {
    setForm({ nombre: c.nombre, rfc: c.rfc, curp:"", telefono: c.telefono, email: c.email, calle:"", colonia:"", municipio:"Jiutepec", cp:"", estado:"Morelos" });
    setEditId(c.id);
    setModal("editar");
  };

  const guardar = () => {
    if (!form.nombre || !form.rfc) return;
    if (editId) {
      setClientes(cs => cs.map(c => c.id === editId
        ? { ...c, nombre: form.nombre, rfc: form.rfc, telefono: form.telefono, email: form.email }
        : c
      ));
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

      {modal && (
        <ModalCliente
          modal={modal}
          form={form}
          onFieldChange={setF}
          onClose={() => setModal(null)}
          onGuardar={guardar}
        />
      )}
    </div>
  );
}
