// ============================================================
// src/features/operador/clientes/ClientesPage.jsx
// Página de clientes — orquesta tabla + modal
// ============================================================
import { useState } from "react";
import TablaClientes from "./TablaClientes";
import FormCliente from "./FormCliente";
import Modal from "../../../shared/ui/Modal";
import { CLIENTES_MOCK } from "../../../shared/constants/mockData";

const FORM_VACIO = {
  nombre: "", rfc: "", curp: "", telefono: "", email: "",
  calle: "", colonia: "", municipio: "", cp: "", estado: "Morelos",
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState(CLIENTES_MOCK);
  const [busqueda, setBusqueda]  = useState("");
  const [modal,    setModal]     = useState(null); // null | "nuevo" | "editar"
  const [form,     setForm]      = useState(FORM_VACIO);
  const [editId,   setEditId]    = useState(null);
  const [loading,  setLoading]   = useState(false);

  const setF = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const abrirNuevo = () => {
    setForm(FORM_VACIO);
    setEditId(null);
    setModal("nuevo");
  };

  const abrirEditar = (c) => {
    setForm({ nombre: c.nombre, rfc: c.rfc, curp: "", telefono: c.telefono, email: c.email, calle: "", colonia: "", municipio: "Jiutepec", cp: "", estado: "Morelos" });
    setEditId(c.id);
    setModal("editar");
  };

  const guardar = () => {
    if (!form.nombre || !form.rfc) return;
    setLoading(true);
    setTimeout(() => {
      if (editId) {
        setClientes((cs) => cs.map((c) => c.id === editId ? { ...c, ...form } : c));
      } else {
        setClientes((cs) => [...cs, { id: Date.now(), ...form, polizas: 0, activo: true }]);
      }
      setModal(null);
      setLoading(false);
    }, 500);
  };

  return (
    <div className="p-6 min-h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Clientes</h1>
          <p className="text-gray-400 text-sm mt-0.5">Alta y edición de asegurados</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#13193a] text-white text-sm font-semibold hover:bg-[#1e2a50] transition-all shadow-sm shadow-[#13193a]/15"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo cliente
        </button>
      </div>

      <TablaClientes
        clientes={clientes}
        busqueda={busqueda}
        onBusqueda={setBusqueda}
        onEditar={abrirEditar}
      />

      {modal && (
        <Modal
          onClose={() => setModal(null)}
          title={modal === "nuevo" ? "Nuevo cliente" : "Editar cliente"}
          subtitle={modal === "nuevo" ? "Registra un nuevo asegurado" : "Actualiza los datos del asegurado"}
        >
          <FormCliente
            form={form}
            setF={setF}
            onGuardar={guardar}
            onCancelar={() => setModal(null)}
            esEdicion={modal === "editar"}
            loading={loading}
          />
        </Modal>
      )}
    </div>
  );
}
