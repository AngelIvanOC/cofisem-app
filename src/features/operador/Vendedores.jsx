import { useState, useEffect, useMemo } from "react";
import { fetchVendedores, crearVendedor, actualizarVendedor, toggleActivo as toggleActivoService } from "../../services/vendedores";
import ModalVendedor from "./components/ModalVendedor";
import { OFICINA } from "./constants/cobertura";
import { usePagination } from "../../hooks/usePagination";
import Paginator from "../../components/Paginator";

const EMPTY_FORM = { nombre: "", apellido1: "", apellido2: "", telefono: "", email: "" };

export function Vendedores({ usuario }) {
  const [vendedores, setVendedores] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [busqueda,   setBusqueda]   = useState("");
  const [modal,      setModal]      = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [editId,     setEditId]     = useState(null);
  const [saving,     setSaving]     = useState(false);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const cargar = async () => {
    try {
      setLoading(true);
      setVendedores(await fetchVendedores(OFICINA.codigo));
      setError(null);
    } catch (e) {
      setError("Error cargando vendedores: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return vendedores.filter(v =>
      (v.nombre + " " + (v.apellido || "")).toLowerCase().includes(q) ||
      (v.codigo || "").toLowerCase().includes(q) ||
      (v.email || "").toLowerCase().includes(q)
    );
  }, [vendedores, busqueda]);

  const { paginated: vendedoresPag, page: pageV, setPage: setPageV, totalPages: totalPagesV, total: totalV } = usePagination(filtrados);

  const abrirNuevo  = () => { setForm(EMPTY_FORM); setEditId(null); setModal("nuevo"); };
  const abrirEditar = v => {
    const [ap1 = "", ...apRest] = (v.apellido || "").split(" ");
    setForm({ nombre: v.nombre || "", apellido1: ap1, apellido2: apRest.join(" "), telefono: v.telefono || "", email: v.email || "" });
    setEditId(v.id);
    setModal("editar");
  };

  const guardar = async () => {
    if (!form.nombre || !form.apellido1 || !form.telefono) return;
    setSaving(true);
    try {
      if (editId) {
        await actualizarVendedor(editId, form);
      } else {
        await crearVendedor({ ...form, oficina: OFICINA.codigo }, usuario?.id);
      }
      await cargar();
      setModal(null);
    } catch (e) {
      alert("Error al guardar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (v) => {
    try {
      await toggleActivoService(v.id, !v.activo);
      setVendedores(vs => vs.map(x => x.id === v.id ? { ...x, activo: !v.activo } : x));
    } catch (e) {
      alert("Error al cambiar estatus: " + e.message);
    }
  };

  return (
    <div className="p-6 min-h-full bg-gray-50">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Vendedores</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {loading ? "Cargando..." : `${filtrados.length} vendedores en esta oficina`}
          </p>
        </div>
        <button onClick={abrirNuevo}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#13193a] text-white text-sm font-semibold hover:bg-[#1e2a50] transition-all shadow-sm shadow-[#13193a]/15">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          Nuevo vendedor
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="relative flex-1 max-w-sm">
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
            </svg>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre o código..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] bg-white"/>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {["Código","Nombre","Teléfono","Email","Estatus",""].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-sm text-gray-400">Cargando vendedores...</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-sm text-gray-400">No se encontraron vendedores.</td></tr>
              ) : vendedoresPag.map(v => (
                <tr key={v.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs font-bold text-[#13193a]">{v.codigo || "—"}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-[#13193a]">{v.nombre} {v.apellido || ""}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-600">{v.telefono || "—"}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{v.email || "—"}</td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => handleToggle(v)}
                      className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer transition-all ${
                        v.activo
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
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
          <Paginator page={pageV} totalPages={totalPagesV} total={totalV} pageSize={10} onPage={setPageV} />
        </div>
      </div>

      {modal && (
        <ModalVendedor
          modal={modal}
          form={form}
          onFieldChange={setF}
          onClose={() => setModal(null)}
          onGuardar={guardar}
          saving={saving}
        />
      )}
    </div>
  );
}

export default Vendedores;
