// ============================================================
// src/pages/analista/AnalistaPagos.jsx
// Analista: Consultar y aplicar pagos de pólizas
// Muestra cuotas pendientes, historial de pagos, aplicar pago
// ============================================================
import { useState } from "react";

const OFICINAS  = ["Todas", "COFISEM AV. E.ZAPATA", "OFICINA CIVAC", "COFISEM TEMIXCO", "COFISEM CUAUTLA"];
const VENDEDORES = ["Todos", "Laura Rosher", "Marco A. Cruz", "Carlos Soto", "Patricia Morales"];

const FORMAS_PAGO = ["Efectivo", "Transferencia", "Cheque", "Tarjeta de crédito", "Tarjeta de débito"];

// Mock de pólizas con cuotas
const POLIZAS_CON_PAGOS = [
  {
    id: "3413167", asegurado: "Roberto Díaz Ramos", aseguradora: "GNP",
    cobertura: "SERV. PÚB. 50/50 GAMAN 2", oficina: "COFISEM AV. E.ZAPATA",
    vendedor: "Laura Rosher", formaPago: "4 Parciales", primaPrimerPago: 637.00,
    cuotas: [
      { num: 1, vto: "11/03/2026", monto: 637.00, pagado: true,  fechaPago: "11/03/2026", forma: "Efectivo",       referencia: "REC-001" },
      { num: 2, vto: "11/04/2026", monto: 637.00, pagado: false, fechaPago: null,          forma: null,            referencia: null      },
      { num: 3, vto: "11/05/2026", monto: 637.00, pagado: false, fechaPago: null,          forma: null,            referencia: null      },
      { num: 4, vto: "11/06/2026", monto: 637.00, pagado: false, fechaPago: null,          forma: null,            referencia: null      },
    ],
  },
  {
    id: "3410888", asegurado: "José Martínez Ruiz", aseguradora: "AXA",
    cobertura: "TAXI BÁSICA PAGOS 2700", oficina: "OFICINA CIVAC",
    vendedor: "Marco A. Cruz", formaPago: "4 Parciales", primaPrimerPago: 580.00,
    cuotas: [
      { num: 1, vto: "22/03/2025", monto: 580.00, pagado: true,  fechaPago: "22/03/2025", forma: "Efectivo",       referencia: "REC-008" },
      { num: 2, vto: "22/06/2025", monto: 580.00, pagado: true,  fechaPago: "20/06/2025", forma: "Transferencia",  referencia: "TRF-0421" },
      { num: 3, vto: "22/09/2025", monto: 580.00, pagado: true,  fechaPago: "19/09/2025", forma: "Efectivo",       referencia: "REC-031" },
      { num: 4, vto: "22/12/2025", monto: 580.00, pagado: false, fechaPago: null,          forma: null,            referencia: null       },
    ],
  },
  {
    id: "3413241", asegurado: "Angel Ivan Ortega", aseguradora: "QUALITAS",
    cobertura: "COBERTURA APP (UBER, DIDI)", oficina: "OFICINA CIVAC",
    vendedor: "Laura Rosher", formaPago: "Trimestral", primaPrimerPago: 785.70,
    cuotas: [
      { num: 1, vto: "13/03/2026", monto: 785.70, pagado: true,  fechaPago: "13/03/2026", forma: "Efectivo",       referencia: "REC-042" },
      { num: 2, vto: "13/06/2026", monto: 785.70, pagado: false, fechaPago: null,          forma: null,            referencia: null      },
      { num: 3, vto: "13/09/2026", monto: 785.70, pagado: false, fechaPago: null,          forma: null,            referencia: null      },
      { num: 4, vto: "13/12/2026", monto: 785.70, pagado: false, fechaPago: null,          forma: null,            referencia: null      },
    ],
  },
  {
    id: "3408500", asegurado: "Ana Gutiérrez Pérez", aseguradora: "HDI",
    cobertura: "COBERTURA APP (UBER, DIDI)", oficina: "COFISEM CUAUTLA",
    vendedor: "Patricia Morales", formaPago: "Trimestral", primaPrimerPago: 785.70,
    cuotas: [
      { num: 1, vto: "10/01/2025", monto: 785.70, pagado: true,  fechaPago: "10/01/2025", forma: "Efectivo",       referencia: "REC-009" },
      { num: 2, vto: "10/04/2025", monto: 785.70, pagado: true,  fechaPago: "08/04/2025", forma: "Efectivo",       referencia: "REC-021" },
      { num: 3, vto: "10/07/2025", monto: 785.70, pagado: true,  fechaPago: "10/07/2025", forma: "Transferencia",  referencia: "TRF-0198" },
      { num: 4, vto: "10/10/2025", monto: 785.70, pagado: false, fechaPago: null,          forma: null,            referencia: null      },
    ],
  },
];

function CuotaBadge({ pagado, vencida }) {
  if (pagado)   return <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Pagado</span>;
  if (vencida)  return <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">Vencida</span>;
  return              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Pendiente</span>;
}

// ── Modal aplicar pago ────────────────────────────────────────
function ModalAplicarPago({ poliza, cuota, onClose, onAplicar }) {
  const [fecha,     setFecha]     = useState(new Date().toISOString().split("T")[0]);
  const [forma,     setForma]     = useState("Efectivo");
  const [referencia,setReferencia]= useState("");
  const [monto,     setMonto]     = useState(cuota.monto.toFixed(2));
  const [aplicando, setAplicando] = useState(false);

  const handleAplicar = () => {
    setAplicando(true);
    setTimeout(() => {
      onAplicar({ polizaId: poliza.id, cuotaNum: cuota.num, fecha, forma, referencia, monto: parseFloat(monto) });
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter:"blur(8px)", backgroundColor:"rgba(10,15,40,0.55)" }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-bold text-[#13193a]">Aplicar pago</h2>
            <p className="text-xs text-gray-400 mt-0.5">Cuota {cuota.num} · Póliza <span className="font-mono">{poliza.id}</span></p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Resumen */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Asegurado</span>
              <span className="font-semibold text-[#13193a]">{poliza.asegurado}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Cuota</span>
              <span className="font-semibold text-[#13193a]">{cuota.num} de {poliza.cuotas.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Fecha límite</span>
              <span className="font-semibold text-amber-700">{cuota.vto}</span>
            </div>
          </div>

          {/* Monto */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Monto a pagar</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
              <input
                type="number" step="0.01" min="0"
                value={monto}
                onChange={e => setMonto(e.target.value)}
                className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]"
              />
            </div>
          </div>

          {/* Fecha de pago */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Fecha de pago</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]"/>
          </div>

          {/* Forma de pago */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Forma de pago</label>
            <div className="flex flex-wrap gap-2">
              {FORMAS_PAGO.map(f => (
                <button key={f} onClick={() => setForma(f)}
                  className={[
                    "px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all",
                    forma === f ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300",
                  ].join(" ")}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Referencia */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              Referencia / No. de operación <span className="text-gray-300">(opcional)</span>
            </label>
            <input value={referencia} onChange={e => setReferencia(e.target.value)}
              placeholder="Folio, número de transferencia..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]"/>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button onClick={handleAplicar} disabled={aplicando || !monto || !fecha}
            className="flex-1 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#13193a]/15">
            {aplicando
              ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Aplicando...</>
              : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>Aplicar pago</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal historial de póliza ─────────────────────────────────
function ModalHistorial({ poliza, onClose, onAplicar }) {
  const [cuotaSel, setCuotaSel] = useState(null);
  const hoy = new Date();

  const pendientes = poliza.cuotas.filter(c => !c.pagado).length;
  const pagadas    = poliza.cuotas.filter(c =>  c.pagado).length;
  const total      = poliza.cuotas.reduce((s, c) => s + c.monto, 0);
  const cobrado    = poliza.cuotas.filter(c => c.pagado).reduce((s, c) => s + c.monto, 0);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backdropFilter:"blur(8px)", backgroundColor:"rgba(10,15,40,0.55)" }}
        onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <div>
              <h2 className="text-sm font-bold text-[#13193a]">Pagos y cuotas</h2>
              <p className="text-xs text-gray-400 mt-0.5">Póliza <span className="font-mono font-bold">{poliza.id}</span> · {poliza.asegurado}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Resumen */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label:"Forma de pago", value: poliza.formaPago,         mono: false },
                { label:"Total póliza",  value:`$${total.toFixed(2)}`,    mono: true  },
                { label:"Cobrado",       value:`$${cobrado.toFixed(2)}`,   mono: true  },
                { label:"Por cobrar",    value:`$${(total-cobrado).toFixed(2)}`, mono: true },
              ].map(f => (
                <div key={f.label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{f.label}</p>
                  <p className={`text-sm font-bold ${f.mono ? "font-mono text-[#13193a]" : "text-[#13193a]"}`}>{f.value}</p>
                </div>
              ))}
            </div>

            {/* Barra de progreso */}
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>{pagadas} de {poliza.cuotas.length} cuotas pagadas</span>
                <span>{Math.round((pagadas / poliza.cuotas.length) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width:`${(pagadas / poliza.cuotas.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Cuotas */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Cuotas</p>
              {poliza.cuotas.map(c => {
                const vtoDate = new Date(c.vto.split("/").reverse().join("-"));
                const vencida  = !c.pagado && vtoDate < hoy;
                return (
                  <div key={c.num}
                    className={[
                      "flex items-center justify-between gap-3 p-4 rounded-2xl border transition-all",
                      c.pagado  ? "bg-emerald-50/50 border-emerald-100" :
                      vencida   ? "bg-red-50/50 border-red-100" :
                                  "bg-white border-gray-200 hover:border-gray-300",
                    ].join(" ")}>
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Número */}
                      <div className={[
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                        c.pagado ? "bg-emerald-500 text-white" : vencida ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600",
                      ].join(" ")}>
                        {c.pagado ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                        ) : c.num}
                      </div>
                      {/* Info */}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#13193a]">${c.monto.toFixed(2)}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <p className="text-xs text-gray-400">Vto. {c.vto}</p>
                          {c.pagado && (
                            <><span className="text-gray-300">·</span>
                            <p className="text-xs text-emerald-600">Pagado {c.fechaPago} · {c.forma}</p>
                            {c.referencia && <p className="text-xs text-gray-400 font-mono">{c.referencia}</p>}</>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <CuotaBadge pagado={c.pagado} vencida={vencida}/>
                      {!c.pagado && (
                        <button
                          onClick={() => setCuotaSel(c)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#13193a] text-white text-xs font-bold hover:bg-[#1e2a50] transition-all"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
                          Aplicar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal aplicar pago */}
      {cuotaSel && (
        <ModalAplicarPago
          poliza={poliza}
          cuota={cuotaSel}
          onClose={() => setCuotaSel(null)}
          onAplicar={(data) => { onAplicar(data); setCuotaSel(null); }}
        />
      )}
    </>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function AnalistaPagos() {
  const [polizas,        setPolizas]        = useState(POLIZAS_CON_PAGOS);
  const [busqueda,       setBusqueda]       = useState("");
  const [filtroOficina,  setFiltroOficina]  = useState("Todas");
  const [filtroVendedor, setFiltroVendedor] = useState("Todos");
  const [filtroEstado,   setFiltroEstado]   = useState("Todos");  // Todos | Con pendientes | Al corriente
  const [polizaSel,      setPolizaSel]      = useState(null);

  const aplicarPago = ({ polizaId, cuotaNum, fecha, forma, referencia, monto }) => {
    setPolizas(ps => ps.map(p => {
      if (p.id !== polizaId) return p;
      return {
        ...p,
        cuotas: p.cuotas.map(c =>
          c.num === cuotaNum
            ? { ...c, pagado: true, fechaPago: fecha, forma, referencia: referencia || `REC-${Date.now().toString().slice(-4)}` }
            : c
        ),
      };
    }));
    // Actualizar polizaSel si está abierto
    setPolizaSel(prev => {
      if (!prev || prev.id !== polizaId) return prev;
      return {
        ...prev,
        cuotas: prev.cuotas.map(c =>
          c.num === cuotaNum ? { ...c, pagado: true, fechaPago: fecha, forma, referencia } : c
        ),
      };
    });
  };

  const filtradas = polizas.filter(p => {
    const matchBusq  = p.id.includes(busqueda) || p.asegurado.toLowerCase().includes(busqueda.toLowerCase());
    const matchOfic  = filtroOficina  === "Todas" || p.oficina  === filtroOficina;
    const matchVend  = filtroVendedor === "Todos"  || p.vendedor === filtroVendedor;
    const pendientes = p.cuotas.filter(c => !c.pagado).length;
    const matchEst   = filtroEstado === "Todos"
      || (filtroEstado === "Con pendientes" && pendientes > 0)
      || (filtroEstado === "Al corriente"   && pendientes === 0);
    return matchBusq && matchOfic && matchVend && matchEst;
  });

  // Métricas
  const totalPendiente = polizas.flatMap(p => p.cuotas.filter(c => !c.pagado)).reduce((s, c) => s + c.monto, 0);
  const totalCobrado   = polizas.flatMap(p => p.cuotas.filter(c =>  c.pagado)).reduce((s, c) => s + c.monto, 0);
  const cuotasPend     = polizas.flatMap(p => p.cuotas.filter(c => !c.pagado)).length;

  const hoy = new Date();
  const cuotasVencidas = polizas.flatMap(p =>
    p.cuotas.filter(c => !c.pagado && new Date(c.vto.split("/").reverse().join("-")) < hoy)
  ).length;

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#13193a]">Pagos</h1>
        <p className="text-gray-400 text-sm mt-0.5">Consulta y aplicación de pagos de cuotas — todas las oficinas</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:"Total cobrado",     value:`$${totalCobrado.toLocaleString("es-MX", {minimumFractionDigits:2})}`, accent:"emerald" },
          { label:"Por cobrar",        value:`$${totalPendiente.toLocaleString("es-MX", {minimumFractionDigits:2})}`, accent:"amber" },
          { label:"Cuotas pendientes", value:cuotasPend,    accent:"blue"   },
          { label:"Cuotas vencidas",   value:cuotasVencidas, accent:"red"   },
        ].map(m => {
          const c = { emerald:"bg-emerald-50 text-emerald-700 border-emerald-100", amber:"bg-amber-50 text-amber-700 border-amber-100", blue:"bg-blue-50 text-blue-700 border-blue-100", red:"bg-red-50 text-red-600 border-red-100" };
          return (
            <div key={m.label} className={`${c[m.accent]} border rounded-2xl p-4`}>
              <p className="text-xl font-bold tabular-nums">{m.value}</p>
              <p className="text-xs font-semibold mt-0.5 opacity-80">{m.label}</p>
            </div>
          );
        })}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Filtros */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-5 py-4 border-b border-gray-100">
          <div className="relative lg:col-span-1">
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
            </svg>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Póliza o asegurado..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] bg-white"/>
          </div>
          <div>
            <select value={filtroOficina} onChange={e => setFiltroOficina(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none">
              {OFICINAS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <select value={filtroVendedor} onChange={e => setFiltroVendedor(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none">
              {VENDEDORES.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none">
              {["Todos", "Con pendientes", "Al corriente"].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {["Póliza","Asegurado","Oficina","Cobertura","Forma pago","Cuotas","Cobrado","Por cobrar",""].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtradas.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-sm text-gray-400">No se encontraron pólizas.</td></tr>
              ) : filtradas.map((p, i) => {
                const pagadas    = p.cuotas.filter(c =>  c.pagado).length;
                const pendientes = p.cuotas.filter(c => !c.pagado).length;
                const cobrado    = p.cuotas.filter(c =>  c.pagado).reduce((s, c) => s + c.monto, 0);
                const porCobrar  = p.cuotas.filter(c => !c.pagado).reduce((s, c) => s + c.monto, 0);
                const hayVencida = p.cuotas.some(c => !c.pagado && new Date(c.vto.split("/").reverse().join("-")) < hoy);

                return (
                  <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-[#13193a]">{p.id}</td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-gray-700 whitespace-nowrap">{p.asegurado}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 max-w-32 truncate">{p.oficina}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500 max-w-36 truncate">{p.cobertura}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{p.formaPago}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5">
                          {p.cuotas.map(c => (
                            <div key={c.num} className={`w-2.5 h-2.5 rounded-full ${c.pagado ? "bg-emerald-500" : hayVencida && !c.pagado ? "bg-red-400" : "bg-gray-200"}`}/>
                          ))}
                        </div>
                        <span className="text-[11px] text-gray-500">{pagadas}/{p.cuotas.length}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-bold text-emerald-700">${cobrado.toFixed(2)}</td>
                    <td className="px-5 py-3.5">
                      {porCobrar > 0 ? (
                        <span className={`text-xs font-bold ${hayVencida ? "text-red-600" : "text-amber-700"}`}>
                          ${porCobrar.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-600 font-semibold">Al corriente</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => setPolizaSel(p)}
                        className="flex items-center gap-1.5 text-xs font-bold text-[#13193a] border border-[#13193a]/20 px-3 py-1.5 rounded-xl hover:bg-[#13193a]/5 transition-all whitespace-nowrap">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.641 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        Ver cuotas
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">Mostrando <strong className="text-gray-600">{filtradas.length}</strong> pólizas</p>
        </div>
      </div>

      {/* Modal historial */}
      {polizaSel && (
        <ModalHistorial poliza={polizaSel} onClose={() => setPolizaSel(null)} onAplicar={aplicarPago}/>
      )}
    </div>
  );
}