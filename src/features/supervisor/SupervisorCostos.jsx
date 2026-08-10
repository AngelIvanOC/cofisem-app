// ============================================================
// src/features/supervisor/SupervisorCostos.jsx
// Control global de costos — todos los siniestros
// ============================================================
import { useState, useEffect } from "react";
import { fetchSiniestros, fetchCostosTodos } from "../../services/siniestros";
import { CATEGORIAS_CONFIG, calcTotalesCostos } from "./SupervisorSiniestros";

const STATUS_CLS = {
  "Reportado":           "bg-red-50    text-red-600    border-red-200",
  "Asignado":            "bg-blue-50   text-blue-700   border-blue-200",
  "Pendiente de arribo": "bg-amber-50  text-amber-700  border-amber-200",
  "En proceso":          "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Cerrado":             "bg-emerald-50 text-emerald-700 border-emerald-200",
};

// Agrupa las filas planas de fetchCostosTodos() en { categoriaId, nombre,
// dot, items:[...] } por siniestro — el shape que ya sabe pintar el
// desglose de categorías (mismo patrón que TabCostos en SupervisorSiniestros).
function agruparPorSiniestro(costosTodos) {
  const porSiniestro = {};
  costosTodos.forEach((c) => {
    porSiniestro[c.siniestroId] ??= {};
    const porCat = porSiniestro[c.siniestroId];
    porCat[c.categoriaId] ??= { categoriaId: c.categoriaId, categoriaNombre: c.categoriaNombre, items: [] };
    porCat[c.categoriaId].items.push({
      id: c.id, descripcion: c.descripcion, fecha: c.fecha, monto: c.monto,
      estatus: c.estatus, notas: c.notas, servicioNombre: c.servicioNombre,
      montoEstimado: c.montoEstimado, origen: c.origen,
    });
  });
  const resultado = {};
  Object.entries(porSiniestro).forEach(([sid, porCat]) => {
    resultado[sid] = Object.values(porCat);
  });
  return resultado;
}

function catInfo(categoriaId, categoriaNombre) {
  return CATEGORIAS_CONFIG.find(c => c.id === categoriaId)
    ?? { id: categoriaId, nombre: categoriaNombre ?? categoriaId, dot: "bg-gray-400" };
}

function totalesGrupo(costos) {
  return calcTotalesCostos(costos.flatMap(c => c.items));
}

// ── Modal de detalle por siniestro (solo lectura) ─────────────
function ModalDetalle({ s, onClose }) {
  const [expandidos, setExpandidos] = useState(() => {
    const init = {};
    s.costos.forEach(c => { init[c.categoriaId] = true; });
    return init;
  });
  const toggle = (id) => setExpandidos(p => ({ ...p, [id]: !p[id] }));
  const { pagado, pendiente, total } = totalesGrupo(s.costos);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter:"blur(8px)", backgroundColor:"rgba(10,15,40,0.55)" }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col"
        style={{ maxHeight:"85vh" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <p className="text-sm font-bold text-[#13193a] font-mono">{s.folio}</p>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_CLS[s.estatus]??""}`}>{s.estatus}</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{s.asegurado} · {s.vehiculo} · {s.tipo}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Totales */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Pagado</p>
              <p className="text-base font-bold text-emerald-600 tabular-nums mt-0.5">${pagado.toLocaleString("es-MX")}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Pendiente</p>
              <p className="text-base font-bold text-amber-600 tabular-nums mt-0.5">${pendiente.toLocaleString("es-MX")}</p>
            </div>
            <div className="bg-white border border-[#13193a]/20 rounded-xl p-3 text-center">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Total</p>
              <p className="text-base font-bold text-[#13193a] tabular-nums mt-0.5">${total.toLocaleString("es-MX")}</p>
            </div>
          </div>

          {/* Categorías */}
          {s.costos.map(c => {
            const cat   = catInfo(c.categoriaId, c.categoriaNombre);
            const items = c.items;
            const sub   = items.filter(i => i.estatus!=="cancelado" && i.monto != null).reduce((t,i) => t+i.monto, 0);
            const open  = expandidos[c.categoriaId] ?? true;
            return (
              <div key={c.categoriaId} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <button onClick={() => toggle(c.categoriaId)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/60 text-left transition-colors">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${cat.dot}`}/>
                  <span className="flex-1 text-sm font-semibold text-[#13193a]">{cat.nombre}</span>
                  <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{items.length}</span>
                  <span className="text-sm font-bold text-[#13193a] tabular-nums">${sub.toLocaleString("es-MX")}</span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${open?"rotate-180":""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                {open && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
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
                            {item.fecha ?? "—"}{item.servicioNombre ? ` · ${item.servicioNombre}` : ""}{item.notas?` · ${item.notas}`:""}
                          </p>
                          {item.montoEstimado != null && (
                            <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Estimado: ${item.montoEstimado.toLocaleString("es-MX")}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {item.monto == null ? (
                            <span className="text-[10px] font-semibold text-gray-400 px-2 py-0.5 rounded-full border border-gray-200">Falta monto real</span>
                          ) : (
                            <>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                item.estatus==="pagado"    ? "text-emerald-700 border-emerald-200" :
                                item.estatus==="pendiente" ? "text-amber-700 border-amber-200" :
                                                             "text-gray-400 border-gray-200"
                              }`}>{item.estatus}</span>
                              <span className="text-sm font-bold text-gray-700 tabular-nums">${item.monto.toLocaleString("es-MX")}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {s.costos.length === 0 && (
            <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl">
              <p className="text-sm text-gray-400">Sin costos registrados.</p>
              <p className="text-xs text-gray-300 mt-1">Gestiona los costos desde la sección Siniestros.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function SupervisorCostos() {
  const [datos, setDatos]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [busqueda, setBusqueda]   = useState("");
  const [filtroEst, setFiltroEst] = useState("Todos");
  const [filtroCat, setFiltroCat] = useState("Todos");
  const [seleccionado, setSeleccionado] = useState(null);

  useEffect(() => {
    Promise.all([fetchSiniestros(), fetchCostosTodos()])
      .then(([sin, cost]) => {
        const agrupado = agruparPorSiniestro(cost);
        setDatos(sin.map(s => ({ ...s, costos: agrupado[s.id] ?? [] })));
      })
      .catch((e) => setError(e.message ?? "Error al cargar costos"))
      .finally(() => setLoading(false));
  }, []);

  const totalPagado    = datos.reduce((s,d) => s+totalesGrupo(d.costos).pagado,    0);
  const totalPendiente = datos.reduce((s,d) => s+totalesGrupo(d.costos).pendiente, 0);
  const totalEstimado  = datos.reduce((s,d) => s+totalesGrupo(d.costos).estimado,  0);
  const totalGeneral   = totalPagado + totalPendiente;
  const conCostos      = datos.filter(d => d.costos.length > 0).length;

  const filtrados = datos.filter(d => {
    const q  = busqueda.toLowerCase();
    const mb = !q || d.folio.toLowerCase().includes(q) || d.asegurado.toLowerCase().includes(q);
    const me = filtroEst==="Todos" || d.estatus===filtroEst;
    const mc = filtroCat==="Todos" || d.costos.some(c => c.categoriaId===filtroCat);
    return mb && me && mc;
  });

  const ESTATUS_OPTS = ["Todos","Reportado","Asignado","Pendiente de arribo","En proceso","Cerrado"];
  const selCls = "px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/10";

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
          <p className="text-sm font-semibold text-red-600">No se pudieron cargar los costos</p>
          <p className="text-xs text-gray-400 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#13193a]">Control de costos</h1>
        <p className="text-gray-400 text-sm mt-0.5">Resumen global de gastos por siniestro</p>
      </div>

      {/* Métricas globales */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-[#13193a] border border-[#13193a] rounded-2xl p-4">
          <p className="text-2xl font-bold text-white tabular-nums">${totalGeneral.toLocaleString("es-MX")}</p>
          <p className="text-xs font-semibold text-white/60 mt-0.5">Total erogado real</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-2xl font-bold text-emerald-600 tabular-nums">${totalPagado.toLocaleString("es-MX")}</p>
          <p className="text-xs font-semibold text-gray-400 mt-0.5">Pagado</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-2xl font-bold text-amber-600 tabular-nums">${totalPendiente.toLocaleString("es-MX")}</p>
          <p className="text-xs font-semibold text-gray-400 mt-0.5">Pendiente de pago</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-2xl font-bold text-blue-600 tabular-nums">${totalEstimado.toLocaleString("es-MX")}</p>
          <p className="text-xs font-semibold text-gray-400 mt-0.5">Estimado (ajustador)</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-2xl font-bold text-[#13193a] tabular-nums">{conCostos}</p>
          <p className="text-xs font-semibold text-gray-400 mt-0.5">Casos con costos</p>
        </div>
      </div>

      {/* Desglose por categoría */}
      {conCostos > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Desglose por categoría</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORIAS_CONFIG.map(cat => {
              const sub = datos.flatMap(d =>
                (d.costos.find(c => c.categoriaId===cat.id)?.items ?? []).filter(i => i.estatus!=="cancelado")
              ).reduce((s,i) => s+i.monto, 0);
              if (sub === 0) return null;
              return (
                <div key={cat.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${cat.dot}`}/>
                  <p className="text-xs font-semibold text-gray-600 flex-1 truncate">{cat.nombre}</p>
                  <p className="text-sm font-bold text-[#13193a] tabular-nums shrink-0">${sub.toLocaleString("es-MX")}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <svg className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Folio o asegurado..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/10 bg-white"/>
          </div>
          <select value={filtroEst} onChange={e => setFiltroEst(e.target.value)} className={selCls}>
            {ESTATUS_OPTS.map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={filtroCat} onChange={e => setFiltroCat(e.target.value)} className={selCls}>
            <option value="Todos">Todas las categorías</option>
            {CATEGORIAS_CONFIG.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100">
                {["Folio","Asegurado","Tipo","Estatus","Categorías con gasto","Pagado","Pendiente","Total",""].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtrados.map((d) => {
                const { pagado, pendiente, total } = totalesGrupo(d.costos);
                const catsActivas = d.costos.map(c => catInfo(c.categoriaId, c.categoriaNombre));
                return (
                  <tr key={d.id} onClick={() => setSeleccionado(d)}
                    className="hover:bg-gray-50/60 transition-colors cursor-pointer">
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-[#13193a]">{d.folio}</td>
                    <td className="px-4 py-3.5 text-xs font-semibold text-gray-700 whitespace-nowrap">{d.asegurado}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">{d.tipo}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_CLS[d.estatus]??""}`}>{d.estatus}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {catsActivas.length === 0
                          ? <span className="text-gray-300 text-xs">—</span>
                          : catsActivas.map(cat => (
                              <span key={cat.id} className="flex items-center gap-1 text-[11px] font-medium text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-lg">
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cat.dot}`}/>
                                {cat.nombre.split("/")[0].trim()}
                              </span>
                            ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-semibold tabular-nums text-emerald-600">
                      {pagado > 0 ? `$${pagado.toLocaleString("es-MX")}` : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-xs font-semibold tabular-nums text-amber-600">
                      {pendiente > 0 ? `$${pendiente.toLocaleString("es-MX")}` : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-xs font-bold tabular-nums text-[#13193a]">
                      {total > 0 ? `$${total.toLocaleString("es-MX")}` : <span className="text-gray-300 font-normal">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <button onClick={e => { e.stopPropagation(); setSeleccionado(d); }}
                        className="w-7 h-7 rounded-lg text-gray-300 hover:text-[#13193a] hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-14 text-sm text-gray-400">
                    No hay siniestros con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex justify-between items-center">
          <p className="text-xs text-gray-400">{filtrados.length} siniestros</p>
          <p className="text-xs font-bold text-[#13193a]">
            Total filtrado: ${filtrados.reduce((s,d) => s+totalesGrupo(d.costos).total, 0).toLocaleString("es-MX")}
          </p>
        </div>
      </div>

      {seleccionado && <ModalDetalle s={seleccionado} onClose={() => setSeleccionado(null)} />}
    </div>
  );
}
