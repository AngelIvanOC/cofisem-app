// ============================================================
// src/features/operador/vendedores/VendedoresPage.jsx
// Orquestador de vendedores — tabla + modal alta/edición
// ============================================================
import { useState } from "react";
import TablaVendedores from "./TablaVendedores";
import FormVendedor from "./FormVendedor";
import Modal from "../../../shared/ui/Modal";
import { VENDEDORES_TABLA_MOCK } from "../../../shared/constants/mockData";

const FORM_VACIO = { folio: "", nombre: "", telefono: "", email: "", password: "" };

export default function VendedoresPage() {
  const [vendedores, setVendedores] = useState(VENDEDORES_TABLA_MOCK);
  const [busqueda,   setBusqueda]   = useState("");
  const [modal,      setModal]      = useState(null);
  const [form,       setForm]       = useState(FORM_VACIO);
  const [editId,     setEditId]     = useState(null);
  const [loading,    setLoading]    = useState(false);

  const setF = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const abrirNuevo = () => {
    setForm(FORM_VACIO);
    setEditId(null);
    setModal("nuevo");
  };

  const abrirEditar = (v) => {
    setForm({ folio: v.folio, nombre: v.nombre, telefono: v.telefono, email: v.email, password: "" });
    setEditId(v.id);
    setModal("editar");
  };

  const toggleActivo = (id) =>
    setVendedores((vs) => vs.map((v) => v.id === id ? { ...v, activo: !v.activo } : v));

  const guardar = () => {
    if (!form.nombre || !form.folio) return;
    setLoading(true);
    setTimeout(() => {
      if (editId) {
        setVendedores((vs) => vs.map((v) => v.id === editId ? { ...v, ...form } : v));
      } else {
        setVendedores((vs) => [...vs, { id: Date.now(), ...form, polizasMes: 0, activo: true }]);
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
          <h1 className="text-2xl font-bold text-[#13193a]">Vendedores</h1>
          <p className="text-gray-400 text-sm mt-0.5">Alta y edición de vendedores de la oficina</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#13193a] text-white text-sm font-semibold hover:bg-[#1e2a50] transition-all shadow-sm shadow-[#13193a]/15"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo vendedor
        </button>
      </div>

      <TablaVendedores
        vendedores={vendedores}
        busqueda={busqueda}
        onBusqueda={setBusqueda}
        onEditar={abrirEditar}
        onToggle={toggleActivo}
      />

      {modal && (
        <Modal
          onClose={() => setModal(null)}
          title={modal === "nuevo" ? "Nuevo vendedor" : "Editar vendedor"}
          maxWidth="max-w-md"
        >
          <FormVendedor
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

// Named export para App.jsx que importa { Vendedores }
export { VendedoresPage as Vendedores };
