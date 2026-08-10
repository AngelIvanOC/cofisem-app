// ============================================================
// src/features/supervisor/SupervisorSiniestros.jsx
// ============================================================
import { useState, useEffect } from "react";
import {
  fetchSiniestros,
  fetchAjustadores,
  fetchCargaAjustadores,
  asignarAjustador,
  fetchTercerosDetalle,
  fetchCostos,
  crearCosto,
  actualizarEstatusCosto,
  actualizarMontoReal,
  eliminarCosto,
  fetchCostosTodos,
} from "../../services/siniestros";
import { fetchProveedores, crearProveedor } from "../../services/servicios";
import { fetchEvidencias, getSignedUrl } from "../../services/evidencias";
import { supabase } from "../../supabaseClient";
import DireccionCascada from "../../shared/components/DireccionCascada";
import { useHistorialSiniestro, PASOS_TIMELINE } from "../../hooks/useHistorialSiniestro";
import Paginator from "../../components/Paginator";
import { usePagination } from "../../hooks/usePagination";

const MAX_ACTIVOS = 4;

const TIPOS_SINIESTRO = ["Colisión","Robo total","Robo parcial","Cristales","Daño a terceros","Volcadura","Incendio","Fenómeno natural"];
const TIPOS_CANALIZ    = ["Asistencia jurídica","Abogado externo","Mediación","Demanda formal"];

const STATUS_CLS = {
  "Reportado":           "bg-red-50    text-red-600    border-red-200",
  "Asignado":            "bg-blue-50   text-blue-700   border-blue-200",
  "Pendiente de arribo": "bg-amber-50  text-amber-700  border-amber-200",
  "En proceso":          "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Cerrado":             "bg-emerald-50 text-emerald-700 border-emerald-200",
};

// ── Categorías de costos ──────────────────────────────────────
// NOTA: el módulo de costos todavía no tiene tabla propia en la BD.
// El catálogo se conserva aquí para SupervisorCostos.jsx y para el
// tab "Costos" del modal, que por ahora se muestra deshabilitado.
export const CATEGORIAS_CONFIG = [
  { id:"taller",    nombre:"Taller / Reparación",  dot:"bg-blue-500",
    chips:["Carrocería","Mecánica","Pintura","Cristales","Llantas","Refacciones","Hojalatería"] },
  { id:"grua",      nombre:"Grúa / Traslado",       dot:"bg-amber-500",
    chips:["Servicio de grúa","Traslado a taller","Almacenaje corralón","Pensión"] },
  { id:"medico",    nombre:"Médico / Hospital",      dot:"bg-rose-500",
    chips:["Urgencias","Hospitalización","Cirugía","Medicamentos","Ambulancia","Rehabilitación","Estudios"] },
  { id:"finiquito", nombre:"Finiquito directo",      dot:"bg-emerald-500",
    chips:["Pago al asegurado","Pago al afectado","Indemnización pérdida total","Depreciación"] },
  { id:"legal",     nombre:"Legal / Jurídico",       dot:"bg-purple-500",
    chips:["Honorarios abogado","Fianza vehicular","Fianza penal","Pago a oficial de tránsito","Multa","Notaría","Peritaje legal","Gastos MP"] },
  { id:"admin",     nombre:"Administrativo",         dot:"bg-slate-400",
    chips:["Peritaje","Valuación","Gastos de trámite","Investigación","Comisión"] },
];

// Categorías que corresponden a un proveedor real del directorio
// `servicios` (tipo en esa tabla) — finiquito/admin/personalizadas no
// tienen proveedor, son pagos directos o gastos internos.
const CATEGORIA_TIPO_SERVICIO = {
  taller: "taller",
  grua:   "grua",
  medico: "hospital",
  legal:  "legal",
};

function AvisoProximamente({ children }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 font-medium">
      {children}
    </div>
  );
}

export function calcTotalesCostos(costos = []) {
  // monto (real) puede venir null en los renglones que el ajustador
  // generó como estimado y el supervisor todavía no confirma — esos no
  // cuentan como gasto real todavía, solo como estimado.
  const pagado    = costos.filter(c => c.estatus === "pagado"    && c.monto != null).reduce((s, c) => s + c.monto, 0);
  const pendiente = costos.filter(c => c.estatus === "pendiente" && c.monto != null).reduce((s, c) => s + c.monto, 0);
  const estimado  = costos.reduce((s, c) => s + (c.montoEstimado || 0), 0);
  return { pagado, pendiente, total: pagado + pendiente, estimado };
}

function EstatusCosto({ estatus }) {
  const cls = estatus === "pagado"
    ? "text-emerald-700 border-emerald-200"
    : estatus === "pendiente"
    ? "text-amber-700 border-amber-200"
    : "text-gray-400 border-gray-200";
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
      {estatus}
    </span>
  );
}

// ── Mini-formulario para dar de alta un proveedor nuevo en el
// directorio `servicios`, sin salir del registro de costos.
function NuevoProveedorForm({ tipo, onCreado, onCancelar }) {
  const [datos, setDatos]       = useState({ nombre: "", calle: "", telefono: "", estado: "", municipio: "", colonia: "", cp: "" });
  const [guardando, setGuardando] = useState(false);
  const [error, setError]       = useState(null);

  const puedeGuardar = datos.nombre.trim() && datos.cp;

  const guardar = async () => {
    setGuardando(true);
    setError(null);
    try {
      const creado = await crearProveedor({ tipo, nombre: datos.nombre.trim(), calle: datos.calle, telefono: datos.telefono, cp: datos.cp, colonia: datos.colonia });
      onCreado(creado);
    } catch (e) {
      setError(e.message ?? "No se pudo guardar el proveedor");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-2.5 p-3 rounded-xl border border-gray-200 bg-white">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Nuevo proveedor</p>
      <input value={datos.nombre} onChange={e => setDatos(p => ({ ...p, nombre: e.target.value }))}
        placeholder="Nombre del proveedor"
        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/10"/>
      <div className="grid grid-cols-2 gap-2">
        <input value={datos.calle} onChange={e => setDatos(p => ({ ...p, calle: e.target.value }))}
          placeholder="Calle y número"
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/10"/>
        <input value={datos.telefono} onChange={e => setDatos(p => ({ ...p, telefono: e.target.value }))}
          placeholder="Teléfono"
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/10"/>
      </div>
      <DireccionCascada values={datos} onChange={(v) => setDatos(p => ({ ...p, ...v }))}/>
      {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button onClick={onCancelar}
          className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-all">
          Cancelar
        </button>
        <button onClick={guardar} disabled={!puedeGuardar || guardando}
          className="flex-1 py-2 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-xs font-bold disabled:opacity-40 transition-all">
          {guardando ? "Guardando..." : "Guardar proveedor"}
        </button>
      </div>
    </div>
  );
}

// ── Tab Costos — registro real por categoría, con proveedor opcional
// del directorio `servicios`.
function TabCostos({ siniestroId, costos, onCostosChange }) {
  const [expandidos, setExpandidos] = useState(() => {
    const init = {};
    costos.forEach(c => { init[c.categoriaId] = true; });
    return init;
  });
  const [formulario, setFormulario]         = useState(null); // { catId, catNombre? }
  const [itemForm, setItemForm]             = useState({ descripcion:"", fecha:"", monto:"", estatus:"pendiente", notas:"", servicioId:"" });
  const [pickerAbierto, setPickerAbierto]   = useState(false);
  const [catCustomPanel, setCatCustomPanel] = useState(false);
  const [nomCatCustom, setNomCatCustom]     = useState("");
  const [guardando, setGuardando]           = useState(false);
  const [errorGuardar, setErrorGuardar]     = useState(null);
  const [proveedores, setProveedores]       = useState([]);
  const [proveedoresLoading, setProveedoresLoading] = useState(false);
  const [nuevoProveedorAbierto, setNuevoProveedorAbierto] = useState(false);
  const [montoRealDraft, setMontoRealDraft] = useState({}); // { [itemId]: string }
  const [guardandoReal, setGuardandoReal]   = useState(null); // id del item en progreso

  const tipoServicioActual = formulario ? CATEGORIA_TIPO_SERVICIO[formulario.catId] : null;

  useEffect(() => {
    if (!tipoServicioActual) return;
    setProveedoresLoading(true);
    fetchProveedores(tipoServicioActual)
      .then(setProveedores)
      .catch(() => setProveedores([]))
      .finally(() => setProveedoresLoading(false));
  }, [tipoServicioActual]);

  const toggle   = (catId) => setExpandidos(p => ({ ...p, [catId]: !p[catId] }));
  const getItems = (catId) => costos.filter(c => c.categoriaId === catId);
  const subtotal = (catId) => getItems(catId).filter(c => c.estatus !== "cancelado").reduce((s, c) => s + c.monto, 0);
  const { pagado, pendiente, total, estimado } = calcTotalesCostos(costos);

  const abrirForm = (catId, catNombre) => {
    setFormulario({ catId, catNombre });
    setItemForm({ descripcion:"", fecha:"", monto:"", estatus:"pendiente", notas:"", servicioId:"" });
    setNuevoProveedorAbierto(false);
    setProveedores([]);
  };

  const activeCatIds = [...new Set(costos.map(c => c.categoriaId))];
  const visibleCatIds = formulario && !activeCatIds.includes(formulario.catId)
    ? [...activeCatIds, formulario.catId]
    : activeCatIds;

  const catsCustom = visibleCatIds
    .filter(id => !CATEGORIAS_CONFIG.find(p => p.id === id))
    .map(id => ({
      id,
      nombre: costos.find(c => c.categoriaId === id)?.categoriaNombre ?? formulario?.catNombre ?? id.replace("custom_",""),
      dot: "bg-gray-400", chips: [],
    }));

  const catsActivas = [
    ...CATEGORIAS_CONFIG.filter(cat => visibleCatIds.includes(cat.id)),
    ...catsCustom,
  ];

  const catsDisponibles = CATEGORIAS_CONFIG.filter(cat => !activeCatIds.includes(cat.id));

  const activarCategoria = (catId, catNombre) => {
    setPickerAbierto(false);
    setCatCustomPanel(false);
    abrirForm(catId, catNombre);
    setExpandidos(p => ({ ...p, [catId]: true }));
  };

  const cancelarForm = () => setFormulario(null);

  const guardar = async () => {
    if (!formulario) return;
    setGuardando(true);
    setErrorGuardar(null);
    try {
      await crearCosto(siniestroId, {
        categoriaId:     formulario.catId,
        categoriaNombre: formulario.catId.startsWith("custom_") ? formulario.catNombre : null,
        servicioId:      itemForm.servicioId || null,
        descripcion:     itemForm.descripcion,
        fecha:           itemForm.fecha,
        monto:           parseFloat(itemForm.monto) || 0,
        estatus:         itemForm.estatus,
        notas:           itemForm.notas,
      });
      const actualizados = await fetchCostos(siniestroId);
      onCostosChange(actualizados);
      setFormulario(null);
      setExpandidos(p => ({ ...p, [formulario.catId]: true }));
    } catch (e) {
      setErrorGuardar(e.message ?? "No se pudo guardar el costo");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (costoId) => {
    const anterior = costos;
    onCostosChange(costos.filter(c => c.id !== costoId));
    try {
      await eliminarCosto(costoId);
    } catch {
      onCostosChange(anterior);
    }
  };

  const ciclarEstatus = async (costo) => {
    const ciclo = { pendiente:"pagado", pagado:"cancelado", cancelado:"pendiente" };
    const nuevoEstatus = ciclo[costo.estatus];
    const anterior = costos;
    onCostosChange(costos.map(c => c.id === costo.id ? { ...c, estatus: nuevoEstatus } : c));
    try {
      await actualizarEstatusCosto(costo.id, nuevoEstatus);
    } catch {
      onCostosChange(anterior);
    }
  };

  // Captura el monto real de un estimado que llegó del ajustador (o de
  // cualquier costo sin monto) — a partir de aquí ese estimado queda
  // congelado del lado del ajustador.
  const capturarMontoReal = async (item) => {
    const valor = parseFloat(montoRealDraft[item.id]);
    if (!valor || valor <= 0) return;
    setGuardandoReal(item.id);
    try {
      await actualizarMontoReal(item.id, valor);
      onCostosChange(costos.map(c => c.id === item.id ? { ...c, monto: valor } : c));
      setMontoRealDraft(p => { const n = { ...p }; delete n[item.id]; return n; });
    } catch {
      // deja el draft para que pueda reintentar
    } finally {
      setGuardandoReal(null);
    }
  };

  const agregarCatCustom = () => {
    if (!nomCatCustom.trim()) return;
    const id = "custom_" + Date.now();
    setCatCustomPanel(false);
    setPickerAbierto(false);
    const nombre = nomCatCustom.trim();
    setNomCatCustom("");
    abrirForm(id, nombre);
    setExpandidos(p => ({ ...p, [id]: true }));
  };

  const puedeGuardar = itemForm.descripcion.trim() && itemForm.monto;

  return (
    <div className="space-y-4">

      {(total > 0 || estimado > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Pagado</p>
            <p className="text-base font-bold text-emerald-600 tabular-nums mt-0.5">${pagado.toLocaleString("es-MX")}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Pendiente</p>
            <p className="text-base font-bold text-amber-600 tabular-nums mt-0.5">${pendiente.toLocaleString("es-MX")}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Estimado (ajustador)</p>
            <p className="text-base font-bold text-blue-600 tabular-nums mt-0.5">${estimado.toLocaleString("es-MX")}</p>
          </div>
          <div className="bg-white border border-[#13193a]/20 rounded-xl p-3 text-center">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Gran total real</p>
            <p className="text-base font-bold text-[#13193a] tabular-nums mt-0.5">${total.toLocaleString("es-MX")}</p>
          </div>
        </div>
      )}

      {catsActivas.length === 0 && !pickerAbierto && !catCustomPanel && (
        <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl">
          <svg className="w-8 h-8 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p className="text-sm font-semibold text-gray-400">Sin costos registrados</p>
          <p className="text-xs text-gray-300 mt-1">Agrega una categoría para comenzar el registro</p>
        </div>
      )}

      {catsActivas.map(cat => {
        const items     = getItems(cat.id);
        const sub       = subtotal(cat.id);
        const abierto   = expandidos[cat.id] ?? true;
        const agregando = formulario?.catId === cat.id;
        const tieneProveedor = !!CATEGORIA_TIPO_SERVICIO[cat.id];

        return (
          <div key={cat.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">

            <button onClick={() => toggle(cat.id)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/60 transition-colors text-left">
              <span className={`w-2 h-2 rounded-full shrink-0 ${cat.dot}`}/>
              <span className="flex-1 text-sm font-semibold text-[#13193a]">{cat.nombre}</span>
              {items.length > 0 && (
                <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                  {items.length}
                </span>
              )}
              {sub > 0 && (
                <span className="text-sm font-bold text-[#13193a] tabular-nums">${sub.toLocaleString("es-MX")}</span>
              )}
              <svg className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${abierto?"rotate-180":""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            {abierto && (
              <div className="border-t border-gray-100">

                {items.length > 0 && (
                  <div className="divide-y divide-gray-50">
                    {items.map(item => (
                      <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-semibold text-gray-700">{item.descripcion}</p>
                            {item.origen === "ajustador" && (
                              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full shrink-0">
                                Del ajustador
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {item.fecha ?? "—"}
                            {item.servicioNombre ? ` · ${item.servicioNombre}` : ""}
                            {item.notas ? ` · ${item.notas}` : ""}
                          </p>
                          {item.montoEstimado != null && (
                            <p className="text-[11px] text-blue-600 font-semibold mt-0.5">
                              Estimado: ${item.montoEstimado.toLocaleString("es-MX")}
                              {item.monto != null && (
                                <span className={item.monto > item.montoEstimado ? "text-red-500" : "text-emerald-600"}>
                                  {" "}({item.monto > item.montoEstimado ? "+" : ""}${(item.monto - item.montoEstimado).toLocaleString("es-MX")} vs. real)
                                </span>
                              )}
                            </p>
                          )}
                        </div>

                        {item.monto == null ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-gray-300">$</span>
                              <input type="number" min="0" placeholder="Monto real"
                                value={montoRealDraft[item.id] ?? ""}
                                onChange={e => setMontoRealDraft(p => ({ ...p, [item.id]: e.target.value }))}
                                className="w-28 pl-5 pr-2 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/10"/>
                            </div>
                            <button onClick={() => capturarMontoReal(item)}
                              disabled={!montoRealDraft[item.id] || guardandoReal === item.id}
                              className="px-2.5 py-1.5 rounded-lg bg-[#13193a] hover:bg-[#1e2a50] text-white text-[11px] font-bold disabled:opacity-40 transition-all whitespace-nowrap">
                              {guardandoReal === item.id ? "..." : "Confirmar"}
                            </button>
                            <button onClick={() => eliminar(item.id)}
                              className="text-gray-300 hover:text-red-400 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => ciclarEstatus(item)} title="Click para cambiar estatus">
                              <EstatusCosto estatus={item.estatus} />
                            </button>
                            <span className="text-sm font-bold text-gray-700 tabular-nums">
                              ${item.monto.toLocaleString("es-MX")}
                            </span>
                            <button onClick={() => eliminar(item.id)}
                              className="text-gray-300 hover:text-red-400 transition-colors ml-1">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {agregando ? (
                  <div className="p-4 space-y-3 bg-gray-50/50 border-t border-gray-100">
                    {cat.chips?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Concepto rápido</p>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {cat.chips.map(chip => (
                            <button key={chip}
                              onClick={() => setItemForm(p => ({ ...p, descripcion: chip }))}
                              className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                                itemForm.descripcion === chip
                                  ? "bg-[#13193a] text-white border-[#13193a]"
                                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                              }`}>{chip}</button>
                          ))}
                          <button onClick={() => setItemForm(p => ({ ...p, descripcion: "" }))}
                            className="text-[11px] px-2.5 py-1 rounded-lg border bg-white text-gray-500 border-gray-200 hover:border-gray-400 font-medium">
                            Otro
                          </button>
                        </div>
                      </div>
                    )}

                    <input value={itemForm.descripcion}
                      onChange={e => setItemForm(p => ({ ...p, descripcion: e.target.value }))}
                      placeholder="Descripción del concepto..."
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/10 focus:border-[#13193a]/40"/>

                    {tieneProveedor && (
                      nuevoProveedorAbierto ? (
                        <NuevoProveedorForm
                          tipo={tipoServicioActual}
                          onCancelar={() => setNuevoProveedorAbierto(false)}
                          onCreado={(creado) => {
                            setProveedores(p => [...p, creado]);
                            setItemForm(p => ({ ...p, servicioId: creado.id }));
                            setNuevoProveedorAbierto(false);
                          }}
                        />
                      ) : (
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Proveedor (opcional)</label>
                          <div className="flex gap-2">
                            <select value={itemForm.servicioId} onChange={e => setItemForm(p => ({ ...p, servicioId: e.target.value }))}
                              className="flex-1 px-2.5 py-2 rounded-xl border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/10">
                              <option value="">{proveedoresLoading ? "Cargando..." : "Sin proveedor específico"}</option>
                              {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                            </select>
                            <button onClick={() => setNuevoProveedorAbierto(true)}
                              className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-[#13193a] hover:bg-gray-50 transition-all whitespace-nowrap">
                              + Nuevo
                            </button>
                          </div>
                        </div>
                      )
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Fecha</label>
                        <input type="date" value={itemForm.fecha}
                          onChange={e => setItemForm(p => ({ ...p, fecha: e.target.value }))}
                          className="w-full px-2.5 py-2 rounded-xl border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/10"/>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Monto</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-300">$</span>
                          <input type="number" min="0" value={itemForm.monto}
                            onChange={e => setItemForm(p => ({ ...p, monto: e.target.value }))}
                            placeholder="0"
                            className="w-full pl-6 pr-2 py-2 rounded-xl border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/10"/>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Estatus</label>
                        <select value={itemForm.estatus}
                          onChange={e => setItemForm(p => ({ ...p, estatus: e.target.value }))}
                          className="w-full px-2.5 py-2 rounded-xl border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/10">
                          <option value="pendiente">Pendiente</option>
                          <option value="pagado">Pagado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </div>
                    </div>

                    <input value={itemForm.notas}
                      onChange={e => setItemForm(p => ({ ...p, notas: e.target.value }))}
                      placeholder="Notas: referencia, observaciones... (opcional)"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/10"/>

                    {errorGuardar && <p className="text-xs text-red-500 font-semibold">{errorGuardar}</p>}

                    <div className="flex gap-2 pt-1">
                      <button onClick={cancelarForm}
                        className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-all">
                        Cancelar
                      </button>
                      <button onClick={guardar} disabled={!puedeGuardar || guardando}
                        className="flex-1 py-2 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-xs font-bold disabled:opacity-40 transition-all">
                        {guardando ? "Guardando..." : "Agregar concepto"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-3 border-t border-gray-50">
                    <button onClick={() => abrirForm(cat.id, cat.nombre)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#13193a]/60 hover:text-[#13193a] transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                      </svg>
                      Agregar concepto
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {pickerAbierto ? (
        <div className="rounded-xl border border-[#13193a]/20 bg-white overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-bold text-[#13193a] uppercase tracking-wide">Selecciona una categoría</p>
            <button onClick={() => setPickerAbierto(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {catsDisponibles.map(cat => (
              <button key={cat.id} onClick={() => activarCategoria(cat.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left">
                <span className={`w-2 h-2 rounded-full shrink-0 ${cat.dot}`}/>
                <span className="flex-1 text-sm text-gray-700 font-medium">{cat.nombre}</span>
                <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
                </svg>
              </button>
            ))}
            <button onClick={() => { setPickerAbierto(false); setCatCustomPanel(true); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left">
              <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0"/>
              <span className="flex-1 text-sm text-gray-500 font-medium">Categoría personalizada…</span>
              <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
              </svg>
            </button>
          </div>
        </div>
      ) : catCustomPanel ? (
        <div className="flex gap-2 p-4 rounded-xl border border-gray-200 bg-white">
          <input value={nomCatCustom} onChange={e => setNomCatCustom(e.target.value)}
            placeholder="Nombre de la categoría (ej: Salvamento, Peritos externos…)"
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/10"/>
          <button onClick={agregarCatCustom} disabled={!nomCatCustom.trim()}
            className="px-4 py-2 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-xs font-bold disabled:opacity-40 transition-all">
            Crear
          </button>
          <button onClick={() => setCatCustomPanel(false)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-all">
            Cancelar
          </button>
        </div>
      ) : (
        <button onClick={() => setPickerAbierto(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-gray-200 text-xs font-semibold text-gray-400 hover:border-[#13193a]/30 hover:text-[#13193a]/60 transition-all">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          Agregar categoría de costo
        </button>
      )}
    </div>
  );
}

// ── Evidencia fotográfica ──────────────────────────────────────
// Mismo patrón que usa cabinero en features/cabinero/components/
// ModalDetalle.jsx: lee siniestro_evidencias (no siniestros_documentos,
// que ninguna pantalla llena todavía) y se suscribe a Realtime para que
// las fotos que va subiendo el ajustador aparezcan solas, sin recargar.
const DOC_GRUPOS = [
  { key: "siniestro",     tipos: ["siniestro", "fotos_siniestro"],            icon: "📷", label: "Siniestro"     },
  { key: "vehiculo",      tipos: ["vehiculo"],                                 icon: "🚗", label: "Vehículo"      },
  { key: "documentacion", tipos: ["documentacion", "documentos", "licencias"], icon: "📄", label: "Documentación" },
  { key: "danos",         tipos: ["danos"],                                    icon: "🔍", label: "Daños"         },
];

function etiquetaParticipanteEvidencia(id) {
  if (id === "NA") return "Asegurado";
  return `Tercero ${id.replace("AF", "")}`;
}

function CarruselEvidencia({ imgs, initialIdx, onClose }) {
  const [idx, setIdx] = useState(initialIdx ?? 0);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft")  setIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIdx((i) => Math.min(imgs.length - 1, i + 1));
      if (e.key === "Escape")     onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [imgs.length, onClose]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/92 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-2xl flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-9 right-0 flex items-center gap-1.5 text-white/60 hover:text-white text-xs font-medium transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
          Cerrar
        </button>
        <div className="relative w-full flex items-center justify-center" style={{ maxHeight: "72vh" }}>
          <img src={imgs[idx].signedUrl} alt="" className="max-w-full max-h-full object-contain rounded-xl" style={{ maxHeight: "72vh" }} />
          {idx > 0 && (
            <button onClick={() => setIdx((i) => i - 1)} className="absolute left-2 w-9 h-9 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
            </button>
          )}
          {idx < imgs.length - 1 && (
            <button onClick={() => setIdx((i) => i + 1)} className="absolute right-2 w-9 h-9 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-white/50 text-xs">{idx + 1} / {imgs.length}</span>
          <span className="text-white/20 text-xs">·</span>
          <span className="text-white/40 text-xs capitalize">{imgs[idx].tipo?.replace("_", " ")}</span>
        </div>
        {imgs.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 max-w-full">
            {imgs.map((img, i) => (
              <button key={img.id ?? i} onClick={() => setIdx(i)}
                className={["flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all",
                  i === idx ? "border-white opacity-100" : "border-transparent opacity-40 hover:opacity-70"].join(" ")}>
                <img src={img.signedUrl} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AcordeonParticipanteEvidencia({ id, evidencias, onVerCarrusel }) {
  const [abierto, setAbierto] = useState(id === "NA");
  const esNA = id === "NA";

  const grupos = DOC_GRUPOS.map((g) => ({
    ...g,
    imgs: evidencias.filter((e) => g.tipos.includes(e.tipo)),
  }));
  const totalFotos = evidencias.length;

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button onClick={() => setAbierto((v) => !v)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-gray-50/80 transition-colors text-left">
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${esNA ? "bg-[#13193a]" : "bg-gray-400"}`}>
            {esNA ? "NA" : id}
          </div>
          <span className="text-xs font-semibold text-[#13193a]">{etiquetaParticipanteEvidencia(id)}</span>
        </div>
        <div className="flex items-center gap-2">
          {totalFotos > 0 ? (
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
              {totalFotos} foto{totalFotos !== 1 ? "s" : ""}
            </span>
          ) : (
            <span className="text-[10px] text-gray-300 font-medium">Sin fotos</span>
          )}
          <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${abierto ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </button>

      {abierto && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-3 pb-3 pt-2 border-t border-gray-50">
          {grupos.map((g) => {
            const tiene = g.imgs.length > 0;
            return (
              <button key={g.key} onClick={() => tiene && onVerCarrusel(g.imgs)} disabled={!tiene}
                className={["rounded-xl p-2.5 flex flex-col items-center gap-1.5 transition-all",
                  tiene ? "border-2 border-[#13193a]/12 hover:border-[#13193a]/25 hover:bg-gray-50 cursor-pointer"
                        : "border-2 border-dashed border-gray-200 cursor-default"].join(" ")}>
                {tiene ? (
                  <div className="relative w-full h-14 rounded-lg overflow-hidden">
                    <img src={g.imgs[0].signedUrl} className="w-full h-full object-cover" alt="" />
                    {g.imgs.length > 1 && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">+{g.imgs.length}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-base">{g.icon}</div>
                )}
                <p className="text-[10px] text-gray-400 text-center leading-tight font-medium">{g.label}</p>
                {tiene && (
                  <span className="text-[9px] text-emerald-600 font-semibold">
                    {g.imgs.length} foto{g.imgs.length !== 1 ? "s" : ""}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Modal desglose de caso ────────────────────────────────────
function ModalDesglose({ s, ajustadores, carga, onClose, onReasignar }) {
  const [tabActivo, setTabActivo]     = useState("info");
  const [modoReasig, setModoReasig]   = useState(false);
  const [ajSel, setAjSel]             = useState(s.ajustadorId ?? "");
  const [procesando, setProcesando]   = useState(false);
  const [errorAsig, setErrorAsig]     = useState(null);
  const [modoCanaliz, setModoCanaliz] = useState(false);
  const [tipoCanaliz, setTipoCanaliz] = useState("");

  const [terceros, setTerceros]     = useState([]);
  const [costos, setCostos]         = useState([]);
  const [evidencias, setEvidencias] = useState([]);
  const [loadingEvid, setLoadingEvid] = useState(true);
  const [carousel, setCarousel]     = useState(null);
  const { historial } = useHistorialSiniestro(s.id);

  useEffect(() => {
    Promise.all([fetchTercerosDetalle(s.id), fetchCostos(s.id)])
      .then(([terc, cost]) => {
        setTerceros(terc);
        setCostos(cost);
      })
      .catch(() => {});
  }, [s.id]);

  // Evidencia fotográfica — carga inicial + fotos nuevas en tiempo real
  // conforme el ajustador las va subiendo (mismo patrón que cabinero).
  useEffect(() => {
    let mounted = true;
    setLoadingEvid(true);
    fetchEvidencias(s.id)
      .then(async (items) => {
        const withUrls = await Promise.all(
          items.map(async (item) => {
            try   { return { ...item, signedUrl: await getSignedUrl(item.storage_path) }; }
            catch { return null; }
          }),
        );
        if (mounted) setEvidencias(withUrls.filter(Boolean));
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoadingEvid(false); });

    const ch = supabase
      .channel(`supervisor-evidencias-${s.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public",
        table: "siniestro_evidencias",
        filter: `siniestro_id=eq.${s.id}`,
      }, async (payload) => {
        try {
          const signedUrl = await getSignedUrl(payload.new.storage_path);
          setEvidencias((prev) => {
            if (prev.some((e) => e.id === payload.new.id)) return prev;
            return [...prev, { ...payload.new, signedUrl }];
          });
        } catch { /* sin URL */ }
      })
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [s.id]);

  const fotoLlegada = evidencias.find((e) => e.tipo === "llegada");
  const participantesEvid = (() => {
    const set = new Set(evidencias.map((e) => e.participante));
    set.add("NA");
    return [...set].sort((a, b) => a === "NA" ? -1 : b === "NA" ? 1 : a.localeCompare(b));
  })();

  const totalesCostos = calcTotalesCostos(costos);

  const TABS = [
    { k:"info",     l:"Información" },
    { k:"timeline", l:"Línea de tiempo" },
    { k:"costos",   l:"Costos", badge: totalesCostos.total > 0 },
    { k:"acciones", l:"Acciones" },
  ];

  const confirmarReasig = async () => {
    setProcesando(true);
    setErrorAsig(null);
    try {
      const aj = ajustadores.find(a => a.id === ajSel);
      await onReasignar(s.id, aj);
      setModoReasig(false);
    } catch (e) {
      setErrorAsig(e.message ?? "No se pudo asignar el ajustador");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter:"blur(8px)", backgroundColor:"rgba(10,15,40,0.55)" }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col"
        style={{ height:"90vh", maxHeight:"780px" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#13193a]/8 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-[#13193a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-sm font-bold text-[#13193a] font-mono">{s.folio}</h2>
              <span className={`inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_CLS[s.estatus] ?? STATUS_CLS["Reportado"]}`}>{s.estatus}</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{s.asegurado} · {s.vehiculo} · {s.fecha}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-2 shrink-0 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.k} onClick={() => setTabActivo(t.k)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                tabActivo === t.k ? "border-[#13193a] text-[#13193a]" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}>
              {t.l}
              {t.badge && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"/>}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── TAB: INFORMACIÓN ── */}
          {tabActivo === "info" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Datos del siniestro</p>
                  {[["Tipo",s.tipo],["Fecha",s.fecha],["Ubicación",s.ubicacion||"No especificada"],["Descripción",s.descripcion||"Sin descripción"],["Daños",s.danos||"-"]].map(([l,v]) => (
                    <div key={l} className="flex flex-col gap-0.5 py-2 border-b border-gray-50 last:border-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{l}</p>
                      <p className="text-xs text-gray-700 leading-relaxed">{v}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Asegurado y póliza</p>
                  {[["Asegurado",s.asegurado],["Teléfono",s.telefono],["Vehículo",s.vehiculo],["Póliza",s.polizaConstancia],["Cobertura",s.cobertura]].map(([l,v]) => (
                    <div key={l} className="flex flex-col gap-0.5 py-2 border-b border-gray-50 last:border-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{l}</p>
                      <p className="text-xs text-gray-700 font-semibold">{v || "—"}</p>
                    </div>
                  ))}
                </div>
              </div>

              {terceros.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Terceros / Afectados</p>
                  <div className="space-y-3">
                    {terceros.map((t) => (
                      <div key={t.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-2">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{t.propietario_nombre || "-"}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">{t.propietario_domicilio || "-"} · {t.propietario_telefono || "-"}</p>
                          </div>
                          {t.monto_estimado_dano != null && (
                            <span className="text-xs font-bold text-[#13193a] bg-white border border-gray-200 px-2.5 py-1 rounded-full tabular-nums shrink-0">
                              ${Number(t.monto_estimado_dano).toLocaleString("es-MX")} est.
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pt-2 border-t border-gray-200">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Vehículo</p>
                            <p className="text-xs text-gray-700">{[t.vehiculo_desc, t.vehiculo_color, t.vehiculo_modelo].filter(Boolean).join(" · ") || "-"} {t.vehiculo_placas ? `(${t.vehiculo_placas})` : ""}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Aseguradora / Póliza</p>
                            <p className="text-xs text-gray-700">{t.aseguradora_nombre || "-"} {t.poliza_tercero ? `· ${t.poliza_tercero}` : ""}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Daños</p>
                            <p className="text-xs text-gray-700">{t.descripcion_dano || "-"}</p>
                          </div>
                          {t.declaracion && (
                            <div className="sm:col-span-2">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Declaración</p>
                              <p className="text-xs text-gray-600 leading-relaxed">{t.declaracion}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Ajustador asignado</p>
                {s.ajustador ? (
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-[#13193a]">{s.ajustador}</p>
                    {fotoLlegada && (
                      <button onClick={() => setCarousel({ imgs: [fotoLlegada], idx: 0 })}
                        title="Ver foto de llegada"
                        className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border-2 border-gray-200 hover:border-[#13193a]/40 transition-all">
                        <img src={fotoLlegada.signedUrl} className="w-full h-full object-cover" alt="Foto arribo" />
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-red-500 font-semibold">Sin asignar</p>
                )}
              </div>

              {/* Evidencia fotográfica — en vivo, conforme el ajustador va subiendo */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Evidencia fotográfica</p>
                  <div className="flex items-center gap-2">
                    {loadingEvid && <div className="w-3 h-3 border border-gray-300 border-t-gray-500 rounded-full animate-spin" />}
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {evidencias.length} foto{evidencias.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                {!loadingEvid && evidencias.length === 0 ? (
                  <p className="text-xs text-gray-400">Sin evidencia subida aún</p>
                ) : (
                  <div className="space-y-2">
                    {participantesEvid.map((pid) => (
                      <AcordeonParticipanteEvidencia
                        key={pid}
                        id={pid}
                        evidencias={evidencias.filter((e) => e.participante === pid)}
                        onVerCarrusel={(imgs) => setCarousel({ imgs, idx: 0 })}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Acceso a costos */}
              <button onClick={() => setTabActivo("costos")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all text-left">
                <div className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-[#13193a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#13193a]">Costos del siniestro</p>
                  {totalesCostos.total > 0 ? (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Pagado: <span className="text-emerald-600 font-semibold">${totalesCostos.pagado.toLocaleString("es-MX")}</span>
                      {totalesCostos.pendiente > 0 && <> · Pendiente: <span className="text-amber-600 font-semibold">${totalesCostos.pendiente.toLocaleString("es-MX")}</span></>}
                      {" · "}Total: <span className="text-[#13193a] font-bold">${totalesCostos.total.toLocaleString("es-MX")}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-0.5">Sin costos registrados · Toca para agregar</p>
                  )}
                </div>
                <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
                </svg>
              </button>
            </div>
          )}

          {/* ── TAB: TIMELINE ── */}
          {tabActivo === "timeline" && (
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Historial del caso</p>
              {PASOS_TIMELINE.map((paso, i) => {
                const ev = historial.find((h) => h.estatus_nuevo === paso.estatus);
                const listo = !!ev;
                const esUltimo = i === PASOS_TIMELINE.length - 1;
                return (
                  <div key={paso.estatus} className="flex gap-4">
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${listo ? "bg-[#13193a]" : "bg-gray-200"}`}>
                        {listo && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                        )}
                      </div>
                      {!esUltimo && <div className={`w-px flex-1 my-1 ${listo ? "bg-[#13193a]" : "bg-gray-200"}`}/>}
                    </div>
                    <div className="pb-4 flex-1">
                      <p className={`text-xs font-semibold ${listo ? "text-gray-800" : "text-gray-400"}`}>{paso.label}</p>
                      {ev ? (
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {ev.cambiado_at ? new Date(ev.cambiado_at).toLocaleString("es-MX") : "-"}{ev.notas ? ` · ${ev.notas}` : ""}
                        </p>
                      ) : (
                        <p className="text-[11px] text-gray-300 mt-0.5">Aún no llega a este punto</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── TAB: COSTOS ── */}
          {tabActivo === "costos" && (
            <TabCostos siniestroId={s.id} costos={costos} onCostosChange={setCostos} />
          )}

          {/* ── TAB: ACCIONES ── */}
          {tabActivo === "acciones" && (
            <div className="space-y-5">
              {/* Reasignar */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-[#13193a]">Ajustador asignado</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {s.ajustador ? s.ajustador : <span className="text-red-500">Sin asignar</span>}
                    </p>
                  </div>
                  <button onClick={() => setModoReasig(!modoReasig)}
                    className="text-xs font-semibold text-[#13193a] border border-[#13193a]/20 px-3 py-1.5 rounded-xl hover:bg-[#13193a]/5 transition-all">
                    {s.ajustador ? "Reasignar" : "Asignar"}
                  </button>
                </div>
                {modoReasig && (
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Selecciona ajustador</p>
                    <div className="space-y-2">
                      {ajustadores.map(aj => {
                        const activos = carga[aj.id] ?? 0;
                        const disponible = activos < MAX_ACTIVOS;
                        return (
                          <button key={aj.id} onClick={() => disponible && setAjSel(aj.id)} disabled={!disponible}
                            className={["w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                              ajSel===aj.id ? "border-[#13193a] bg-[#13193a]/5" : disponible ? "border-gray-200 hover:border-gray-300 bg-white" : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed",
                            ].join(" ")}>
                            <div className="w-8 h-8 rounded-full bg-[#13193a] text-white flex items-center justify-center text-xs font-bold shrink-0">
                              {aj.nombre.split(" ").map(w=>w[0]).join("").slice(0,2)}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-[#13193a]">{aj.nombre}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <div className="flex gap-0.5">
                                  {Array.from({length:MAX_ACTIVOS}).map((_,i)=>(
                                    <div key={i} className={`w-2.5 h-2.5 rounded-full ${i<activos?"bg-[#13193a]":"bg-gray-200"}`}/>
                                  ))}
                                </div>
                                <p className="text-[10px] text-gray-400">{activos}/{MAX_ACTIVOS} activos</p>
                              </div>
                            </div>
                            {!disponible && <span className="text-[10px] text-red-500 font-semibold">Lleno</span>}
                            {ajSel===aj.id && (
                              <svg className="w-4 h-4 text-[#13193a] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {errorAsig && <p className="text-xs text-red-500 font-semibold">{errorAsig}</p>}
                    <button onClick={confirmarReasig} disabled={!ajSel||procesando}
                      className="w-full py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 transition-all">
                      {procesando ? "Asignando..." : "Confirmar asignación"}
                    </button>
                  </div>
                )}
              </div>

              {/* Canalizar jurídico — próximamente */}
              <div className="border border-purple-200 rounded-xl p-4 opacity-70">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-[#13193a]">Canalizar a asistencia jurídica</p>
                    <p className="text-xs text-gray-400 mt-0.5">Derivar a abogado o asistencia legal</p>
                  </div>
                  <button onClick={() => setModoCanaliz(!modoCanaliz)}
                    className="text-xs font-semibold text-purple-700 border border-purple-200 px-3 py-1.5 rounded-xl hover:bg-purple-50 transition-all">
                    Canalizar
                  </button>
                </div>
                {modoCanaliz && (
                  <div className="space-y-3 pt-3 border-t border-purple-100">
                    <AvisoProximamente>
                      Próximamente — la canalización a jurídico está en desarrollo y todavía no se guarda en la base de datos.
                    </AvisoProximamente>
                    <div className="flex flex-wrap gap-2">
                      {TIPOS_CANALIZ.map(t => (
                        <button key={t} disabled onClick={() => setTipoCanaliz(t)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 cursor-not-allowed transition-all ${
                            tipoCanaliz===t ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-400 border-gray-200"
                          }`}>{t}</button>
                      ))}
                    </div>
                    <button disabled
                      className="w-full py-2.5 rounded-xl bg-[#13193a]/40 text-white text-sm font-bold cursor-not-allowed transition-all">
                      Confirmar canalización
                    </button>
                  </div>
                )}
              </div>

              {/* Cerrar caso — próximamente */}
              {s.estatus !== "Cerrado" && (
                <div className="border border-emerald-200 rounded-xl p-4 opacity-70">
                  <p className="text-sm font-semibold text-[#13193a] mb-1">Cerrar caso</p>
                  <p className="text-xs text-gray-400 mb-3">Marcar como completado y generar cierre de expediente.</p>
                  <AvisoProximamente>
                    Próximamente — el cierre manual desde supervisión está en desarrollo. El cierre real lo hace el ajustador al finalizar su flujo.
                  </AvisoProximamente>
                  <button disabled
                    className="w-full mt-3 py-2.5 rounded-xl bg-[#13193a]/40 text-white text-sm font-bold cursor-not-allowed transition-all">
                    Confirmar cierre del caso
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    {carousel && (
      <CarruselEvidencia imgs={carousel.imgs} initialIdx={carousel.idx} onClose={() => setCarousel(null)} />
    )}
    </>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function SupervisorSiniestros() {
  const [siniestros, setSiniestros]     = useState([]);
  const [ajustadores, setAjustadores]   = useState([]);
  const [carga, setCarga]               = useState({});
  const [costosTodos, setCostosTodos]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [busqueda,   setBusqueda]       = useState("");
  const [filtroTipo, setFiltroTipo]     = useState("Todos");
  const [tab,        setTab]            = useState("activos");
  const [seleccionado, setSeleccionado] = useState(null);

  const cargarDatos = () => {
    return Promise.all([fetchSiniestros(), fetchAjustadores(), fetchCargaAjustadores(), fetchCostosTodos()])
      .then(([sin, ajs, carg, cost]) => {
        setSiniestros(sin);
        setAjustadores(ajs);
        setCarga(carg);
        setCostosTodos(cost);
      });
  };

  // { [siniestroId]: { pagado, pendiente, total } }
  const costosPorSiniestro = costosTodos.reduce((acc, c) => {
    const g = acc[c.siniestroId] ??= { pagado: 0, pendiente: 0, total: 0 };
    if (c.estatus === "pagado") g.pagado += c.monto;
    if (c.estatus === "pendiente") g.pendiente += c.monto;
    if (c.estatus !== "cancelado") g.total += c.monto;
    return acc;
  }, {});
  const totalErogado = Object.values(costosPorSiniestro).reduce((s, g) => s + g.total, 0);

  useEffect(() => {
    cargarDatos()
      .catch((e) => setError(e.message ?? "Error al cargar siniestros"))
      .finally(() => setLoading(false));
  }, []);

  const onReasignar = async (siniestroId, ajustador) => {
    await asignarAjustador(siniestroId, ajustador);
    await cargarDatos();
    setSeleccionado((p) => p ? { ...p, ajustador: ajustador.nombre, ajustadorId: ajustador.id, estatus: p.estatus === "Reportado" ? "Asignado" : p.estatus } : null);
  };

  const filtradosPorTab = siniestros.filter(s => {
    if (tab==="activos")     return s.estatus !== "Cerrado";
    if (tab==="sin_asignar") return !s.ajustadorId;
    if (tab==="juridicos")   return !!s.juridico; // canalización jurídica: aún no existe en BD
    return true;
  });
  const filtrados = filtradosPorTab.filter(s => {
    const q = busqueda.toLowerCase();
    const mb = !q || s.folio.toLowerCase().includes(q) || s.asegurado.toLowerCase().includes(q);
    return mb && (filtroTipo==="Todos" || s.tipo===filtroTipo);
  });
  const { paginated: siniestrosPag, page, setPage, totalPages, total } = usePagination(filtrados);

  const sinAsignarCount = siniestros.filter(s => !s.ajustadorId).length;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-[#13193a]/20 border-t-[#13193a] rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-2xl border border-red-100 p-6 text-center max-w-sm mx-auto">
          <p className="text-sm font-semibold text-red-600">No se pudieron cargar los siniestros</p>
          <p className="text-xs text-gray-400 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#13193a]">Siniestros</h1>
        <p className="text-gray-400 text-sm mt-0.5">Gestión, reasignación y supervisión de casos</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-2xl font-bold text-[#13193a] tabular-nums">{siniestros.filter(s=>s.estatus!=="Cerrado").length}</p>
          <p className="text-xs font-semibold text-gray-400 mt-0.5">Total activos</p>
        </div>
        <div className="bg-white border border-red-200 rounded-2xl p-4">
          <p className="text-2xl font-bold text-red-600 tabular-nums">{sinAsignarCount}</p>
          <p className="text-xs font-semibold text-gray-400 mt-0.5">Sin asignar</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-2xl font-bold text-[#13193a] tabular-nums">-</p>
          <p className="text-xs font-semibold text-gray-400 mt-0.5">Jurídicos</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-2xl font-bold text-[#13193a] tabular-nums">${totalErogado.toLocaleString("es-MX")}</p>
          <p className="text-xs font-semibold text-gray-400 mt-0.5">Total erogado</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center border-b border-gray-100 px-2 overflow-x-auto">
          {[
            { k:"activos",     l:"Activos" },
            { k:"sin_asignar", l:"Sin asignar", badge:sinAsignarCount, badgeCls:"bg-red-100 text-red-700" },
            { k:"juridicos",   l:"Jurídicos" },
            { k:"todos",       l:"Todos" },
          ].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                tab===t.k ? "border-[#13193a] text-[#13193a]" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}>
              {t.l}
              {t.badge > 0 && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${t.badgeCls}`}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <svg className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Folio, asegurado..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/10 focus:border-[#13193a]/40 bg-white"/>
          </div>
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/10">
            {["Todos",...TIPOS_SINIESTRO].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100">
                {["Folio","Fecha","Asegurado","Vehículo","Tipo","Ajustador","Estatus","Costos",""].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {siniestrosPag.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16">
                    <p className="text-sm text-gray-400">No hay siniestros con esos filtros.</p>
                  </td>
                </tr>
              ) : siniestrosPag.map((s) => {
                  const cs = costosPorSiniestro[s.id];
                  return (
                  <tr key={s.id} onClick={() => setSeleccionado(s)}
                    className={`hover:bg-gray-50/60 transition-colors cursor-pointer ${!s.ajustadorId?"bg-red-50/20":""}`}>
                    <td className="px-4 py-2 font-mono text-xs font-bold text-[#13193a]">{s.folio}</td>
                    <td className="px-4 py-2 text-xs text-gray-400 whitespace-nowrap">{s.fecha}</td>
                    <td className="px-4 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap">{s.asegurado}</td>
                    <td className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">{s.vehiculo}</td>
                    <td className="px-4 py-2 text-xs text-gray-500">{s.tipo}</td>
                    <td className="px-4 py-2 text-xs">
                      {s.ajustador
                        ? <span className="font-semibold text-gray-700">{s.ajustador}</span>
                        : <span className="flex items-center gap-1.5 text-red-500 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0"/>Sin asignar
                          </span>}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_CLS[s.estatus]??STATUS_CLS["Reportado"]}`}>{s.estatus}</span>
                        {s.juridico && <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-full">Jur.</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {cs && cs.total > 0 ? (
                        <div>
                          <p className="text-xs font-bold text-[#13193a] tabular-nums">${cs.total.toLocaleString("es-MX")}</p>
                          <div className="flex gap-1 mt-0.5">
                            {cs.pagado    > 0 && <span className="text-[10px] text-emerald-600 font-semibold">✓ ${cs.pagado.toLocaleString("es-MX")}</span>}
                            {cs.pendiente > 0 && <span className="text-[10px] text-amber-600 font-semibold">· ${cs.pendiente.toLocaleString("es-MX")}</span>}
                          </div>
                        </div>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-2">
                      <button onClick={e => { e.stopPropagation(); setSeleccionado(s); }}
                        className="w-7 h-7 rounded-lg text-gray-300 hover:text-[#13193a] hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                  );
              })}
            </tbody>
          </table>
        </div>

        <Paginator page={page} totalPages={totalPages} total={total} pageSize={10} onPage={setPage} />
      </div>

      {seleccionado && (
        <ModalDesglose
          s={seleccionado}
          ajustadores={ajustadores}
          carga={carga}
          onClose={() => setSeleccionado(null)}
          onReasignar={onReasignar}
        />
      )}
    </div>
  );
}
