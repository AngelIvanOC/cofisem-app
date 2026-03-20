// ============================================================
// src/pages/administracion/AdminPolizas.jsx
// Administración: Cancelar pólizas + gestionar endosos
// ============================================================
import { useState } from "react";

const OFICINAS   = ["Todas","COFISEM AV. E.ZAPATA","OFICINA CIVAC","COFISEM TEMIXCO","COFISEM CUAUTLA"];
const VENDEDORES = ["Todos","Laura Rosher","Marco A. Cruz","Carlos Soto","Patricia Morales"];
const TIPOS_ENDOSO = ["Cambio de placas","Cambio de vehículo","Cambio de titular","Cambio de domicilio","Adición de cobertura","Reducción de cobertura","Corrección de datos","Otro"];

const STATUS_CLS = {
  "Vigente":       "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Por vencer":    "bg-amber-50   text-amber-700   border-amber-200",
  "Vencida":       "bg-red-50     text-red-600     border-red-200",
  "Cancelada":     "bg-gray-100   text-gray-500    border-gray-200",
  "Suspendida":    "bg-orange-50  text-orange-700  border-orange-200",
  "Pend. aplicar": "bg-blue-50    text-blue-700    border-blue-200",
};

const POLIZAS_MOCK = [
  { id:"3413241", aseguradora:"QUALITAS", asegurado:"Angel Ivan Ortega",   oficina:"OFICINA CIVAC",         vendedor:"Laura Rosher",  cobertura:"COBERTURA APP (UBER, DIDI)", placas:"TRAMITE",  prima:3142.80, vigHasta:"13/03/2027", estatus:"Vigente",       endosos:[] },
  { id:"3413198", aseguradora:"QUALITAS", asegurado:"María García López",  oficina:"COFISEM AV. E.ZAPATA",  vendedor:"Marco A. Cruz", cobertura:"TAXI BÁSICA 2500",           placas:"VRM-123A", prima:2200.00, vigHasta:"12/03/2027", estatus:"Vigente",       endosos:[] },
  { id:"3413167", aseguradora:"GNP",      asegurado:"Roberto Díaz Ramos",  oficina:"COFISEM AV. E.ZAPATA",  vendedor:"Laura Rosher",  cobertura:"SERV. PÚB. 50/50 GAMAN 2",  placas:"CHM-456B", prima:2548.00, vigHasta:"11/03/2027", estatus:"Vigente",       endosos:[] },
  { id:"3411002", aseguradora:"QUALITAS", asegurado:"Carmen López Vargas", oficina:"COFISEM TEMIXCO",        vendedor:"Carlos Soto",   cobertura:"TAXI BÁSICA 2500",           placas:"PQR-789C", prima:2200.00, vigHasta:"20/03/2026", estatus:"Por vencer",    endosos:[{ id:"END-012", tipo:"Cambio de placas", detalle:"Nueva placa asignada", valorNuevo:"ABC-123X", fecha:"16/03/2026", estatus:"Pendiente" }] },
  { id:"3410888", aseguradora:"AXA",      asegurado:"José Martínez Ruiz",  oficina:"OFICINA CIVAC",         vendedor:"Marco A. Cruz", cobertura:"TAXI BÁSICA PAGOS 2700",     placas:"STU-321D", prima:2320.00, vigHasta:"22/03/2026", estatus:"Por vencer",    endosos:[] },
  { id:"3407111", aseguradora:"MAPFRE",   asegurado:"Luis Torres Moreno",  oficina:"COFISEM AV. E.ZAPATA",  vendedor:"Carlos Soto",   cobertura:"TAXI BÁSICA 2500",           placas:"YZA-987F", prima:2200.00, vigHasta:"05/02/2026", estatus:"Cancelada",     endosos:[] },
];

// ── Modal cancelar ────────────────────────────────────────────
function ModalCancelar({ poliza, onClose, onConfirmar }) {
  const [motivo, setMotivo] = useState("");
  const MOTIVOS = ["Solicitud del cliente","Falta de pago","Duplicado","Error en emisión","Otro"];
  const [procesando, setProcesando] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter:"blur(8px)", backgroundColor:"rgba(10,15,40,0.55)" }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-[#13193a]">Cancelar póliza</h2>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{poliza.id} · {poliza.asegurado}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-medium">
            Esta acción cancelará la póliza. El asegurado perderá cobertura de inmediato.
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Motivo <span className="text-red-400">*</span></label>
            <div className="flex flex-wrap gap-2">
              {MOTIVOS.map(m => (
                <button key={m} onClick={() => setMotivo(m)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                    motivo === m ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                  }`}>{m}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button onClick={() => { setProcesando(true); setTimeout(() => onConfirmar(poliza.id, motivo), 700); }}
            disabled={!motivo || procesando}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold disabled:opacity-40 transition-all">
            {procesando ? "Procesando..." : "Confirmar cancelación"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal endoso ──────────────────────────────────────────────
function ModalEndoso({ poliza, onClose, onConfirmar }) {
  const [tipo, setTipo]         = useState("");
  const [detalle, setDetalle]   = useState("");
  const [valorNuevo, setValorNuevo] = useState("");
  const [procesando, setProcesando] = useState(false);

  const inpCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all";
  const rdoCls = "w-full px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm font-semibold text-[#13193a] cursor-default";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter:"blur(8px)", backgroundColor:"rgba(10,15,40,0.55)" }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-[#13193a]">Nuevo endoso</h2>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{poliza.id} · {poliza.asegurado}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[["Póliza", poliza.id], ["Asegurado", poliza.asegurado], ["Placas", poliza.placas], ["Cobertura", poliza.cobertura]].map(([l, v]) => (
              <div key={l}>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">{l}</label>
                <input readOnly value={v} className={rdoCls}/>
              </div>
            ))}
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Tipo de endoso <span className="text-red-400">*</span></label>
            <div className="flex flex-wrap gap-2">
              {TIPOS_ENDOSO.map(t => (
                <button key={t} onClick={() => setTipo(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                    tipo === t ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                  }`}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Nuevo valor</label>
            <input value={valorNuevo} onChange={e => setValorNuevo(e.target.value)} placeholder="Ej. nueva placa, nuevo nombre..." className={inpCls}/>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Descripción <span className="text-red-400">*</span></label>
            <textarea rows={2} value={detalle} onChange={e => setDetalle(e.target.value)} placeholder="Detalle del cambio..."
              className={`${inpCls} resize-none`}/>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button onClick={() => { setProcesando(true); setTimeout(() => onConfirmar(poliza.id, { tipo, detalle, valorNuevo }), 700); }}
            disabled={!tipo || !detalle || procesando}
            className="flex-1 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 transition-all shadow-lg shadow-[#13193a]/15">
            {procesando ? "Procesando..." : "Generar endoso"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────
export default function AdminPolizas() {
  const [polizas, setPolizas] = useState(POLIZAS_MOCK);
  const [busqueda, setBusqueda]             = useState("");
  const [filtroOficina, setFiltroOficina]   = useState("Todas");
  const [filtroVendedor, setFiltroVendedor] = useState("Todos");
  const [filtroEstatus, setFiltroEstatus]   = useState("Todos");
  const [tab, setTab]     = useState("polizas");
  const [modal, setModal] = useState(null);
  const [polSel, setPolSel] = useState(null);

  const filtradas = polizas.filter(p => {
    const mb = p.id.includes(busqueda) || p.asegurado.toLowerCase().includes(busqueda.toLowerCase()) || p.placas.toLowerCase().includes(busqueda.toLowerCase());
    const mo = filtroOficina  === "Todas" || p.oficina  === filtroOficina;
    const mv = filtroVendedor === "Todos"  || p.vendedor === filtroVendedor;
    const me = filtroEstatus  === "Todos"  || p.estatus  === filtroEstatus;
    return mb && mo && mv && me;
  });

  const todosEndosos = polizas.flatMap(p => p.endosos.map(e => ({ ...e, polizaId: p.id, asegurado: p.asegurado, oficina: p.oficina })));

  const confirmarCancelacion = (id) => {
    setPolizas(ps => ps.map(p => p.id === id ? { ...p, estatus: "Cancelada" } : p));
    setModal(null); setPolSel(null);
  };
  const confirmarEndoso = (id, data) => {
    const nuevoId = `END-${String(todosEndosos.length + 13).padStart(3,"0")}`;
    setPolizas(ps => ps.map(p => p.id === id
      ? { ...p, endosos: [...p.endosos, { id: nuevoId, ...data, fecha: new Date().toLocaleDateString("es-MX"), estatus: "Pendiente" }] }
      : p));
    setModal(null); setPolSel(null);
  };

  const selCls = "px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15";

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#13193a]">Pólizas</h1>
        <p className="text-gray-400 text-sm mt-0.5">Cancelaciones y endosos — todas las oficinas</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center border-b border-gray-100 px-2">
          {[{ k:"polizas", l:"Pólizas" }, { k:"endosos", l:"Endosos", badge: todosEndosos.length }].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                tab === t.k ? "border-[#13193a] text-[#13193a]" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}>
              {t.l}
              {t.badge > 0 && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 px-5 py-4 border-b border-gray-100">
          <div className="lg:col-span-2 relative">
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Póliza, asegurado, placas..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] bg-white"/>
          </div>
          <select value={filtroOficina}  onChange={e => setFiltroOficina(e.target.value)}  className={selCls}>{OFICINAS.map(o => <option key={o}>{o}</option>)}</select>
          <select value={filtroVendedor} onChange={e => setFiltroVendedor(e.target.value)} className={selCls}>{VENDEDORES.map(v => <option key={v}>{v}</option>)}</select>
          <select value={filtroEstatus}  onChange={e => setFiltroEstatus(e.target.value)}  className={selCls}>{["Todos",...Object.keys(STATUS_CLS)].map(o => <option key={o}>{o}</option>)}</select>
        </div>

        {tab === "polizas" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  {["Póliza","Asegurado","Aseguradora","Oficina","Cobertura","Placas","Prima","Vence","Estatus","Acciones"].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtradas.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-12 text-sm text-gray-400">No se encontraron pólizas.</td></tr>
                ) : filtradas.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-[#13193a]">{p.id}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">{p.asegurado}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.aseguradora}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-28 truncate">{p.oficina}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-36 truncate">{p.cobertura}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.placas}</td>
                    <td className="px-4 py-3 text-xs font-bold text-emerald-700">${p.prima.toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{p.vigHasta}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_CLS[p.estatus] ?? STATUS_CLS["Cancelada"]}`}>{p.estatus}</span>
                    </td>
                    <td className="px-4 py-3">
                      {p.estatus !== "Cancelada" && (
                        <div className="flex gap-1.5">
                          <button onClick={() => { setPolSel(p); setModal("endoso"); }}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold hover:bg-amber-100 transition-colors">
                            Endoso
                          </button>
                          <button onClick={() => { setPolSel(p); setModal("cancelar"); }}
                            className="px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold hover:bg-red-100 transition-colors">
                            Cancelar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "endosos" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  {["ID Endoso","Póliza","Asegurado","Oficina","Tipo","Nuevo valor","Detalle","Fecha","Estatus"].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {todosEndosos.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-sm text-gray-400">No hay endosos registrados.</td></tr>
                ) : todosEndosos.map((e, i) => (
                  <tr key={i} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-[#13193a]">{e.id}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-600">{e.polizaId}</td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-gray-700 whitespace-nowrap">{e.asegurado}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 max-w-28 truncate">{e.oficina}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-600">{e.tipo}</td>
                    <td className="px-5 py-3.5 text-xs font-mono text-gray-600">{e.valorNuevo || "—"}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 max-w-40 truncate">{e.detalle}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">{e.fecha}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                        e.estatus === "Procesado" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>{e.estatus}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {tab === "polizas" ? `${filtradas.length} pólizas` : `${todosEndosos.length} endosos`}
          </p>
        </div>
      </div>

      {modal === "cancelar" && polSel && <ModalCancelar poliza={polSel} onClose={() => { setModal(null); setPolSel(null); }} onConfirmar={confirmarCancelacion}/>}
      {modal === "endoso"   && polSel && <ModalEndoso   poliza={polSel} onClose={() => { setModal(null); setPolSel(null); }} onConfirmar={confirmarEndoso}/>}
    </div>
  );
}