// ============================================================
// src/features/supervisor/SupervisorCostos.jsx
// Control global de costos — todos los siniestros
// ============================================================
import { useState } from "react";
import { CATEGORIAS_CONFIG } from "./SupervisorSiniestros";

const MOCK = [
  {
    folio:"SN-10234", asegurado:"Carlos Gómez", vehiculo:"Toyota Corolla 2022",
    tipo:"Colisión", estatus:"En proceso", fecha:"17/03/2026",
    costos:[
      { categoriaId:"taller", items:[
        { id:1, descripcion:"Carrocería delantera",    fecha:"18/03/2026", monto:8500, estatus:"pendiente", notas:"Taller El Norte" },
        { id:2, descripcion:"Pintura cofre y defensa", fecha:"18/03/2026", monto:3200, estatus:"pendiente", notas:"" },
      ]},
      { categoriaId:"grua", items:[
        { id:3, descripcion:"Servicio de grúa",        fecha:"17/03/2026", monto:1500, estatus:"pagado",    notas:"Grúas Morelos" },
      ]},
    ],
  },
  {
    folio:"SN-10231", asegurado:"Ana Martínez", vehiculo:"Honda Civic 2020",
    tipo:"Daño a terceros", estatus:"Sin asignar", fecha:"17/03/2026",
    costos:[],
  },
  {
    folio:"SN-10227", asegurado:"Roberto Díaz", vehiculo:"Nissan Tsuru 2018",
    tipo:"Robo total", estatus:"Jurídico", fecha:"17/03/2026",
    costos:[],
  },
  {
    folio:"SN-10220", asegurado:"Laura González", vehiculo:"KIA Sportage 2021",
    tipo:"Volcadura", estatus:"Sin asignar", fecha:"17/03/2026",
    costos:[],
  },
  {
    folio:"SN-10215", asegurado:"Miguel Ortega", vehiculo:"VW Jetta 2019",
    tipo:"Colisión", estatus:"Completado", fecha:"16/03/2026",
    costos:[
      { categoriaId:"taller", items:[
        { id:10, descripcion:"Puerta delantera derecha",     fecha:"17/03/2026", monto:4800, estatus:"pagado", notas:"Taller Central" },
        { id:11, descripcion:"Pintura y ajuste salpicadera", fecha:"17/03/2026", monto:2100, estatus:"pagado", notas:"" },
      ]},
      { categoriaId:"finiquito", items:[
        { id:12, descripcion:"Pago al afectado (Juan Cruz)", fecha:"16/03/2026", monto:8200, estatus:"pagado", notas:"Transferencia SPEI" },
      ]},
      { categoriaId:"admin", items:[
        { id:13, descripcion:"Peritaje vehicular",           fecha:"16/03/2026", monto:1200, estatus:"pagado", notas:"Perito: Ing. Salazar" },
      ]},
    ],
  },
  {
    folio:"SN-10208", asegurado:"Luis Torres", vehiculo:"VW Vento 2020",
    tipo:"Colisión", estatus:"Jurídico", fecha:"16/03/2026",
    costos:[
      { categoriaId:"medico", items:[
        { id:20, descripcion:"Urgencias Carlos Peña",  fecha:"16/03/2026", monto:3500,  estatus:"pagado",    notas:"Hospital IMSS" },
        { id:21, descripcion:"Estudios radiológicos",  fecha:"17/03/2026", monto:1800,  estatus:"pendiente", notas:"" },
      ]},
      { categoriaId:"legal", items:[
        { id:22, descripcion:"Honorarios abogado",     fecha:"16/03/2026", monto:12000, estatus:"pendiente", notas:"Lic. Jorge Méndez" },
        { id:23, descripcion:"Fianza vehicular",       fecha:"16/03/2026", monto:5000,  estatus:"pagado",    notas:"Corralón municipal" },
      ]},
      { categoriaId:"grua", items:[
        { id:24, descripcion:"Remolque a corralón",    fecha:"16/03/2026", monto:1200,  estatus:"pagado",    notas:"" },
      ]},
    ],
  },
];

function totales(costos = []) {
  const items     = costos.flatMap(c => c.items);
  const pagado    = items.filter(i => i.estatus==="pagado").reduce((s,i)=>s+i.monto,0);
  const pendiente = items.filter(i => i.estatus==="pendiente").reduce((s,i)=>s+i.monto,0);
  return { pagado, pendiente, total: pagado+pendiente };
}

const STATUS_CLS = {
  "Sin asignar": "bg-red-50 text-red-600 border-red-200",
  "Asignado":    "bg-blue-50 text-blue-700 border-blue-200",
  "En proceso":  "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Jurídico":    "bg-purple-50 text-purple-700 border-purple-200",
  "Completado":  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Cancelado":   "bg-gray-100 text-gray-500 border-gray-200",
};

// ── Modal de detalle por siniestro (solo lectura) ─────────────
function ModalDetalle({ s, onClose }) {
  const [expandidos, setExpandidos] = useState(() => {
    const init = {};
    s.costos.forEach(c => { init[c.categoriaId] = true; });
    return init;
  });
  const toggle = (id) => setExpandidos(p => ({ ...p, [id]: !p[id] }));
  const { pagado, pendiente, total } = totales(s.costos);

  const catsConItems = CATEGORIAS_CONFIG.filter(cat =>
    s.costos.find(c => c.categoriaId === cat.id)?.items?.length > 0
  );

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
          {catsConItems.map(cat => {
            const items = s.costos.find(c => c.categoriaId === cat.id)?.items ?? [];
            const sub   = items.filter(i => i.estatus!=="cancelado").reduce((t,i) => t+i.monto, 0);
            const open  = expandidos[cat.id] ?? true;
            return (
              <div key={cat.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <button onClick={() => toggle(cat.id)}
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
                          <p className="text-xs font-semibold text-gray-700">{item.descripcion}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{item.fecha}{item.notas?` · ${item.notas}`:""}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            item.estatus==="pagado"    ? "text-emerald-700 border-emerald-200" :
                            item.estatus==="pendiente" ? "text-amber-700 border-amber-200" :
                                                         "text-gray-400 border-gray-200"
                          }`}>{item.estatus}</span>
                          <span className="text-sm font-bold text-gray-700 tabular-nums">${item.monto.toLocaleString("es-MX")}</span>
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
  const [datos]        = useState(MOCK);
  const [busqueda, setBusqueda]   = useState("");
  const [filtroEst, setFiltroEst] = useState("Todos");
  const [filtroCat, setFiltroCat] = useState("Todos");
  const [seleccionado, setSeleccionado] = useState(null);

  const totalPagado    = datos.reduce((s,d) => s+totales(d.costos).pagado,    0);
  const totalPendiente = datos.reduce((s,d) => s+totales(d.costos).pendiente, 0);
  const totalGeneral   = totalPagado + totalPendiente;
  const conCostos      = datos.filter(d => d.costos.length > 0).length;

  const filtrados = datos.filter(d => {
    const mb = d.folio.includes(busqueda) || d.asegurado.toLowerCase().includes(busqueda.toLowerCase());
    const me = filtroEst==="Todos" || d.estatus===filtroEst;
    const mc = filtroCat==="Todos" || d.costos.some(c => c.categoriaId===filtroCat);
    return mb && me && mc;
  });

  const ESTATUS_OPTS = ["Todos","Sin asignar","Asignado","En proceso","Jurídico","Completado","Cancelado"];
  const selCls = "px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/10";

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#13193a]">Control de costos</h1>
        <p className="text-gray-400 text-sm mt-0.5">Resumen global de gastos por siniestro</p>
      </div>

      {/* Métricas globales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#13193a] border border-[#13193a] rounded-2xl p-4">
          <p className="text-2xl font-bold text-white tabular-nums">${totalGeneral.toLocaleString("es-MX")}</p>
          <p className="text-xs font-semibold text-white/60 mt-0.5">Total erogado</p>
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
          <p className="text-2xl font-bold text-[#13193a] tabular-nums">{conCostos}</p>
          <p className="text-xs font-semibold text-gray-400 mt-0.5">Casos con costos</p>
        </div>
      </div>

      {/* Desglose por categoría */}
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
              {filtrados.map((d, i) => {
                const { pagado, pendiente, total } = totales(d.costos);
                const catsActivas = d.costos
                  .map(c => CATEGORIAS_CONFIG.find(p => p.id===c.categoriaId))
                  .filter(Boolean);
                return (
                  <tr key={i} onClick={() => setSeleccionado(d)}
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
            Total filtrado: ${filtrados.reduce((s,d) => s+totales(d.costos).total, 0).toLocaleString("es-MX")}
          </p>
        </div>
      </div>

      {seleccionado && <ModalDetalle s={seleccionado} onClose={() => setSeleccionado(null)} />}
    </div>
  );
}
