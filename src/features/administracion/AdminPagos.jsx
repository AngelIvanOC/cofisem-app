// ============================================================
// src/pages/administracion/AdminPagos.jsx
// Administración: Autorizar pagos pendientes (transf/cheque)
// ============================================================
import { useState } from "react";

const OFICINAS   = ["Todas","COFISEM AV. E.ZAPATA","OFICINA CIVAC","COFISEM TEMIXCO","COFISEM CUAUTLA"];
const FORMAS     = ["Todas","Transferencia","Cheque","Efectivo","Tarjeta de crédito","Tarjeta de débito"];

const STATUS_CLS = {
  "Pendiente":  "bg-amber-50   text-amber-700   border-amber-200",
  "Autorizado": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Rechazado":  "bg-red-50     text-red-600     border-red-200",
  "Efectivo":   "bg-gray-100   text-gray-600    border-gray-200",
};

const PAGOS_MOCK = [
  { id:"PAY-0041", poliza:"3413167", asegurado:"Roberto Díaz Ramos",  oficina:"COFISEM AV. E.ZAPATA", vendedor:"Marco A. Cruz",   cuota:2, monto:637.00,  forma:"Transferencia", ref:"TRF-8821", fecha:"17/03/2026", solicitadoPor:"Marco A. Cruz",    estatus:"Pendiente",  comprobante:true  },
  { id:"PAY-0040", poliza:"3413241", asegurado:"Angel Ivan Ortega",   oficina:"OFICINA CIVAC",        vendedor:"Laura Rosher",    cuota:2, monto:785.70,  forma:"Transferencia", ref:"TRF-8818", fecha:"17/03/2026", solicitadoPor:"Laura Rosher",      estatus:"Pendiente",  comprobante:true  },
  { id:"PAY-0038", poliza:"3408500", asegurado:"Ana Gutiérrez Pérez", oficina:"COFISEM CUAUTLA",      vendedor:"Pat. Morales",    cuota:4, monto:785.70,  forma:"Cheque",        ref:"CHQ-0044", fecha:"16/03/2026", solicitadoPor:"Patricia Morales",  estatus:"Pendiente",  comprobante:false },
  { id:"PAY-0035", poliza:"3413198", asegurado:"María García López",  oficina:"COFISEM AV. E.ZAPATA", vendedor:"Marco A. Cruz",   cuota:1, monto:2200.00, forma:"Efectivo",      ref:"REC-038",  fecha:"15/03/2026", solicitadoPor:"Marco A. Cruz",    estatus:"Efectivo",   comprobante:false },
  { id:"PAY-0033", poliza:"3410888", asegurado:"José Martínez Ruiz",  oficina:"OFICINA CIVAC",        vendedor:"Marco A. Cruz",   cuota:3, monto:580.00,  forma:"Transferencia", ref:"TRF-8790", fecha:"19/09/2025", solicitadoPor:"Marco A. Cruz",    estatus:"Autorizado", comprobante:true  },
  { id:"PAY-0031", poliza:"3411002", asegurado:"Carmen López Vargas", oficina:"COFISEM TEMIXCO",      vendedor:"Carlos Soto",     cuota:1, monto:2200.00, forma:"Efectivo",      ref:"REC-029",  fecha:"20/03/2025", solicitadoPor:"Carlos Soto",      estatus:"Efectivo",   comprobante:false },
];

export default function AdminPagos() {
  const [pagos,         setPagos]         = useState(PAGOS_MOCK);
  const [busqueda,      setBusqueda]      = useState("");
  const [filtroOficina, setFiltroOficina] = useState("Todas");
  const [filtroForma,   setFiltroForma]   = useState("Todas");
  const [filtroEst,     setFiltroEst]     = useState("Pendiente");
  const [procesando,    setProcesando]    = useState(null);

  const pendientes  = pagos.filter(p => p.estatus === "Pendiente");
  const autorizados = pagos.filter(p => p.estatus === "Autorizado");
  const rechazados  = pagos.filter(p => p.estatus === "Rechazado");
  const totalPend   = pendientes.reduce((s, p) => s + p.monto, 0);

  const filtrados = pagos.filter(p => {
    const mb = p.poliza.includes(busqueda) || p.asegurado.toLowerCase().includes(busqueda.toLowerCase()) || p.ref.toLowerCase().includes(busqueda.toLowerCase());
    const mo = filtroOficina === "Todas" || p.oficina === filtroOficina;
    const mf = filtroForma   === "Todas" || p.forma   === filtroForma;
    const me = filtroEst     === "Todos" || p.estatus === filtroEst;
    return mb && mo && mf && me;
  });

  const accion = (id, estatus) => {
    setProcesando(id);
    setTimeout(() => { setPagos(ps => ps.map(p => p.id === id ? { ...p, estatus } : p)); setProcesando(null); }, 600);
  };

  const selCls = "px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none";

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#13193a]">Pagos</h1>
        <p className="text-gray-400 text-sm mt-0.5">Autorización de pagos por transferencia y cheque</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { l:"Por autorizar",   v:pendientes.length,           a:"blue",    f:"Pendiente"  },
          { l:"Monto pendiente", v:`$${totalPend.toFixed(2)}`,  a:"amber",   f:"Pendiente"  },
          { l:"Autorizados",     v:autorizados.length,          a:"emerald", f:"Autorizado" },
          { l:"Rechazados",      v:rechazados.length,           a:"red",     f:"Rechazado"  },
        ].map(m => {
          const c = { blue:"bg-blue-50 border-blue-200 text-blue-700", amber:"bg-amber-50 border-amber-200 text-amber-700", emerald:"bg-emerald-50 border-emerald-200 text-emerald-700", red:"bg-red-50 border-red-200 text-red-600" };
          return (
            <button key={m.l} onClick={() => setFiltroEst(m.f)} className={`${c[m.a]} border rounded-2xl p-4 text-left hover:shadow-sm transition-all`}>
              <p className="text-2xl font-bold tabular-nums">{m.v}</p>
              <p className="text-xs font-semibold mt-0.5 opacity-80">{m.l}</p>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Filtros */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-5 py-4 border-b border-gray-100">
          <div className="relative">
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Póliza, asegurado, referencia..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] bg-white"/>
          </div>
          <select value={filtroOficina} onChange={e => setFiltroOficina(e.target.value)} className={selCls}>{OFICINAS.map(o => <option key={o}>{o}</option>)}</select>
          <select value={filtroForma}   onChange={e => setFiltroForma(e.target.value)}   className={selCls}>{FORMAS.map(f => <option key={f}>{f}</option>)}</select>
          <select value={filtroEst}     onChange={e => setFiltroEst(e.target.value)}     className={selCls}>{["Todos","Pendiente","Autorizado","Rechazado","Efectivo"].map(o => <option key={o}>{o}</option>)}</select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {["ID","Póliza","Asegurado","Oficina","Cuota","Monto","Forma","Referencia","Fecha","Solicitado por","Comp.","Estatus","Acciones"].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtrados.length === 0 ? (
                <tr><td colSpan={13} className="text-center py-12 text-sm text-gray-400">No hay pagos con esos filtros.</td></tr>
              ) : filtrados.map((p, i) => (
                <tr key={i} className={`hover:bg-gray-50/60 transition-colors ${p.estatus === "Pendiente" ? "bg-blue-50/20" : ""}`}>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-[#13193a]">{p.id}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.poliza}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">{p.asegurado}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-24 truncate">{p.oficina}</td>
                  <td className="px-4 py-3 text-xs text-center text-gray-500">{p.cuota}</td>
                  <td className="px-4 py-3 text-xs font-bold text-emerald-700">${p.monto.toFixed(2)}</td>
                  <td className="px-4 py-3"><span className="text-[11px] px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 font-medium">{p.forma}</span></td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.ref}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{p.fecha}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{p.solicitadoPor}</td>
                  <td className="px-4 py-3 text-center">{p.comprobante ? <span className="text-emerald-600 font-bold text-xs">✓</span> : <span className="text-gray-300 text-xs">—</span>}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_CLS[p.estatus]}`}>{p.estatus}</span>
                  </td>
                  <td className="px-4 py-3">
                    {p.estatus === "Pendiente" && (
                      <div className="flex gap-1.5">
                        <button onClick={() => accion(p.id, "Autorizado")} disabled={procesando === p.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all disabled:opacity-50">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                          {procesando === p.id ? "..." : "Autorizar"}
                        </button>
                        <button onClick={() => accion(p.id, "Rechazado")} disabled={procesando === p.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold hover:bg-red-100 transition-all disabled:opacity-50">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                          Rechazar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">{filtrados.length} registros</p>
        </div>
      </div>
    </div>
  );
}