// ============================================================
// src/features/administracion/AdminServicios.jsx
// Administración: directorio de proveedores (talleres, grúas,
// hospitales, despachos legales) — el mismo catálogo que usa el
// supervisor al registrar costos y el ajustador al generar pases.
// ============================================================
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  fetchTodosLosServicios,
  crearProveedor,
  actualizarProveedor,
  toggleActivoProveedor,
} from "../../services/servicios";
import DireccionCascada from "../../shared/components/DireccionCascada";
import { usePagination } from "../../hooks/usePagination";
import Paginator from "../../components/Paginator";
import { CheckCircle2, Loader2, Pencil, Plus, Search, Truck, X } from "lucide-react";

const TIPOS_SERVICIO = [
  { id: "taller",   label: "Taller / Reparación" },
  { id: "grua",     label: "Grúa / Traslado" },
  { id: "hospital", label: "Médico / Hospital" },
  { id: "legal",    label: "Legal / Jurídico" },
];

const TIPO_CLS = {
  taller:   "bg-blue-50   text-blue-700   border-blue-200",
  grua:     "bg-amber-50  text-amber-700  border-amber-200",
  hospital: "bg-rose-50   text-rose-700   border-rose-200",
  legal:    "bg-purple-50 text-purple-700 border-purple-200",
};

const tipoLabel = (id) => TIPOS_SERVICIO.find((t) => t.id === id)?.label ?? id;

const inpCls =
  "w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 " +
  "placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all";

// ── Modal crear/editar proveedor ────────────────────────────
function ModalProveedor({ proveedor, onClose, onGuardar }) {
  const esEdicion = !!proveedor;
  const [form, setForm] = useState({
    tipo: proveedor?.tipo ?? "",
    nombre: proveedor?.nombre ?? "",
    calle: proveedor?.calle ?? "",
    telefono: proveedor?.telefono ?? "",
    estado: proveedor?.estado ?? "",
    municipio: proveedor?.municipio ?? "",
    colonia: proveedor?.colonia ?? "",
    cp: proveedor?.cp ?? "",
  });
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // En edición no se obliga a re-capturar la dirección si no se toca —
  // se manda solo si cambió (colonia distinta a la que ya tenía).
  const direccionTocada = !esEdicion || form.colonia !== (proveedor?.colonia ?? "");
  const valido =
    form.tipo && form.nombre.trim() &&
    (esEdicion ? (!direccionTocada || (form.cp && form.colonia)) : (form.cp && form.colonia));

  const handleGuardar = async () => {
    setProcesando(true);
    setError(null);
    try {
      await onGuardar(form);
      onClose();
    } catch (e) {
      setError(e.message ?? "No se pudo guardar el proveedor.");
      setProcesando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(10,15,40,0.55)" }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="w-9 h-9 rounded-xl bg-[#13193a]/8 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5 text-[#13193a]" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-[#13193a]">{esEdicion ? "Editar proveedor" : "Nuevo proveedor"}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Directorio de servicios</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              Tipo <span className="text-red-400">*</span>
            </label>
            <select value={form.tipo} onChange={(e) => set("tipo", e.target.value)} className={`${inpCls} cursor-pointer`}>
              <option value="">Seleccionar tipo…</option>
              {TIPOS_SERVICIO.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input value={form.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Nombre del proveedor" className={inpCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Calle y número</label>
              <input value={form.calle} onChange={(e) => set("calle", e.target.value)} placeholder="Calle y número" className={inpCls} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Teléfono</label>
              <input value={form.telefono} onChange={(e) => set("telefono", e.target.value)} placeholder="10 dígitos" className={inpCls} />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              Dirección {(!esEdicion || direccionTocada) && <span className="text-red-400">*</span>}
            </label>
            <DireccionCascada values={form} onChange={(v) => setForm((p) => ({ ...p, ...v }))} />
            {esEdicion && !direccionTocada && (
              <p className="text-[11px] text-gray-400 mt-1.5">Se conserva la dirección actual — cambia la colonia para actualizarla.</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={!valido || procesando}
            className="flex-1 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#13193a]/15">
            {procesando ? (<><Loader2 className="animate-spin w-4 h-4" />Guardando…</>) : (<><CheckCircle2 className="w-4 h-4" />{esEdicion ? "Guardar cambios" : "Crear proveedor"}</>)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────
export default function AdminServicios() {
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [busqueda, setBusqueda]   = useState("");
  const [filtroTipo, setFiltroTipo]     = useState("Todos");
  const [filtroActivo, setFiltroActivo] = useState("Todos");
  const [modalNuevo, setModalNuevo]     = useState(false);
  const [proveedorEditar, setProveedorEditar] = useState(null);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      setServicios(await fetchTodosLosServicios());
    } catch (e) {
      console.error("Error cargando servicios:", e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const handleCrear = async (form) => {
    await crearProveedor(form);
    await cargarDatos();
  };

  const handleEditar = async (id, form) => {
    await actualizarProveedor(id, form);
    await cargarDatos();
  };

  const toggleActivo = async (s) => {
    const nuevo = !s.activo;
    setServicios((ss) => ss.map((x) => x.id === s.id ? { ...x, activo: nuevo } : x));
    try {
      await toggleActivoProveedor(s.id, nuevo);
    } catch {
      setServicios((ss) => ss.map((x) => x.id === s.id ? { ...x, activo: !nuevo } : x));
    }
  };

  const filtrados = useMemo(() => {
    const b = busqueda.toLowerCase();
    return servicios.filter((s) => {
      const hayBusqueda = !b || s.nombre.toLowerCase().includes(b) || (s.telefono ?? "").includes(b);
      const hayTipo   = filtroTipo === "Todos" || s.tipo === filtroTipo;
      const hayActivo = filtroActivo === "Todos" || (filtroActivo === "Activos" ? s.activo : !s.activo);
      return hayBusqueda && hayTipo && hayActivo;
    });
  }, [servicios, busqueda, filtroTipo, filtroActivo]);

  const { paginated, page, setPage, totalPages, total } = usePagination(filtrados);

  const selCls = "px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none";

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Servicios</h1>
          <p className="text-gray-400 text-sm mt-0.5">Directorio de proveedores — talleres, grúas, hospitales, despachos legales</p>
        </div>
        <button onClick={() => setModalNuevo(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all shadow-lg shadow-[#13193a]/15">
          <Plus className="w-4 h-4" />
          Nuevo proveedor
        </button>
      </div>

      {/* Resumen por tipo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TIPOS_SERVICIO.map((t) => {
          const cnt = servicios.filter((s) => s.tipo === t.id && s.activo).length;
          const cls = TIPO_CLS[t.id];
          return (
            <button key={t.id} onClick={() => setFiltroTipo(t.id === filtroTipo ? "Todos" : t.id)}
              className={`${cls} border rounded-xl p-3 text-left hover:shadow-sm transition-all ${filtroTipo === t.id ? "ring-2 ring-offset-1 ring-current/30" : ""}`}>
              <p className="text-xl font-bold">{cnt}</p>
              <p className="text-[10px] font-semibold mt-0.5 leading-tight">{t.label}</p>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-5 py-4 border-b border-gray-100">
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Nombre o teléfono…"
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] bg-white" />
          </div>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className={selCls}>
            <option value="Todos">Todos los tipos</option>
            {TIPOS_SERVICIO.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <select value={filtroActivo} onChange={(e) => setFiltroActivo(e.target.value)} className={selCls}>
            {["Todos", "Activos", "Inactivos"].map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          {cargando ? (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
              <Loader2 className="animate-spin w-5 h-5" />
              <span className="text-sm">Cargando servicios…</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  {["Tipo", "Nombre", "Dirección", "Teléfono", "Activo", "Acciones"].map((h) => (
                    <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-2.5 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtrados.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-sm text-gray-400">No se encontraron proveedores.</td></tr>
                ) : paginated.map((s) => (
                  <tr key={s.id} className={`hover:bg-gray-50/60 transition-colors ${!s.activo ? "opacity-60" : ""}`}>
                    <td className="px-5 py-2.5">
                      <span className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border ${TIPO_CLS[s.tipo] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
                        {tipoLabel(s.tipo)}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-xs font-semibold text-[#13193a]">{s.nombre}</td>
                    <td className="px-5 py-2.5 text-xs text-gray-500 max-w-56 truncate">
                      {[s.calle, s.colonia, s.municipio, s.estado].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-5 py-2.5 text-xs text-gray-500">{s.telefono || "—"}</td>
                    <td className="px-5 py-2.5">
                      <button onClick={() => toggleActivo(s)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${s.activo ? "bg-emerald-500" : "bg-gray-200"}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${s.activo ? "translate-x-4.5" : "translate-x-0.5"}`} />
                      </button>
                    </td>
                    <td className="px-5 py-2.5">
                      <button onClick={() => setProveedorEditar(s)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#13193a] hover:bg-[#13193a]/6 transition-colors" title="Editar proveedor">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <Paginator page={page} totalPages={totalPages} total={total} pageSize={10} onPage={setPage} />
      </div>

      {modalNuevo && (
        <ModalProveedor onClose={() => setModalNuevo(false)} onGuardar={handleCrear} />
      )}
      {proveedorEditar && (
        <ModalProveedor proveedor={proveedorEditar} onClose={() => setProveedorEditar(null)}
          onGuardar={(form) => handleEditar(proveedorEditar.id, form)} />
      )}
    </div>
  );
}
