// ============================================================
// src/pages/analista/AnalistaPolizas.jsx
// Analista: Aplicar, consultar y cambiar estatus de pólizas
// El analista ve TODAS las oficinas pero no cotiza ni tramita
// ============================================================
import { useState } from "react";

// ── Mock data ─────────────────────────────────────────────────
const OFICINAS = ["Todas", "COFISEM AV. E.ZAPATA", "OFICINA CIVAC", "COFISEM TEMIXCO", "COFISEM CUAUTLA"];
const VENDEDORES = ["Todos", "Laura Rosher", "Marco A. Cruz", "Carlos Soto", "Patricia Morales"];
const ASEGURADORAS = ["QUALITAS", "GNP", "AXA", "HDI", "MAPFRE"];

const ESTATUSES = {
  Vigente:     { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  "Por vencer":{ cls: "bg-amber-50   text-amber-700   border-amber-200",   dot: "bg-amber-500"   },
  Vencida:     { cls: "bg-red-50     text-red-600     border-red-200",      dot: "bg-red-500"     },
  Cancelada:   { cls: "bg-gray-100   text-gray-500    border-gray-200",     dot: "bg-gray-400"    },
  Suspendida:  { cls: "bg-orange-50  text-orange-700  border-orange-200",   dot: "bg-orange-500"  },
  "Pend. aplicar":{ cls: "bg-blue-50 text-blue-700    border-blue-200",     dot: "bg-blue-500"    },
};

const POLIZAS_MOCK = [
  { id:"3413241", aseguradora:"QUALITAS", asegurado:"Angel Ivan Ortega",   oficina:"OFICINA CIVAC",          vendedor:"Laura Rosher",  cobertura:"COBERTURA APP (UBER, DIDI)", placas:"TRAMITE",  uso:"DIDI",  tipo:"COCHE", prima:3142.80, primaNeta:2260.00, primerPago:3142.80, vigDesde:"13/03/2026", vigHasta:"13/03/2027", formaPago:"Trimestral", estatus:"Vigente",      fechaEmision:"13/03/2026", notas:"" },
  { id:"3413198", aseguradora:"QUALITAS", asegurado:"María García López",  oficina:"COFISEM AV. E.ZAPATA",   vendedor:"Marco A. Cruz", cobertura:"TAXI BÁSICA 2500",           placas:"VRM-123A", uso:"TAXI",  tipo:"COCHE", prima:2200.00, primaNeta:1496.55, primerPago:2200.00, vigDesde:"12/03/2026", vigHasta:"12/03/2027", formaPago:"Contado",    estatus:"Vigente",      fechaEmision:"12/03/2026", notas:"" },
  { id:"3413167", aseguradora:"GNP",      asegurado:"Roberto Díaz Ramos",  oficina:"COFISEM AV. E.ZAPATA",   vendedor:"Laura Rosher",  cobertura:"SERV. PÚB. 50/50 GAMAN 2",  placas:"CHM-456B", uso:"TAXI",  tipo:"COCHE", prima:2548.00, primaNeta:1790.00, primerPago:637.00,  vigDesde:"11/03/2026", vigHasta:"11/03/2027", formaPago:"4 Parciales",estatus:"Vigente",      fechaEmision:"11/03/2026", notas:"" },
  { id:"3411002", aseguradora:"QUALITAS", asegurado:"Carmen López Vargas", oficina:"COFISEM TEMIXCO",         vendedor:"Carlos Soto",   cobertura:"TAXI BÁSICA 2500",           placas:"PQR-789C", uso:"TAXI",  tipo:"COCHE", prima:2200.00, primaNeta:1496.55, primerPago:2200.00, vigDesde:"20/03/2025", vigHasta:"20/03/2026", formaPago:"Contado",    estatus:"Por vencer",   fechaEmision:"20/03/2025", notas:"Avisar al cliente" },
  { id:"3410888", aseguradora:"AXA",      asegurado:"José Martínez Ruiz",  oficina:"OFICINA CIVAC",          vendedor:"Marco A. Cruz", cobertura:"TAXI BÁSICA PAGOS 2700",     placas:"STU-321D", uso:"TAXI",  tipo:"COCHE", prima:2320.00, primaNeta:1600.00, primerPago:580.00,  vigDesde:"22/03/2025", vigHasta:"22/03/2026", formaPago:"4 Parciales",estatus:"Por vencer",   fechaEmision:"22/03/2025", notas:"" },
  { id:"3408500", aseguradora:"HDI",      asegurado:"Ana Gutiérrez Pérez", oficina:"COFISEM CUAUTLA",         vendedor:"Patricia Morales",cobertura:"COBERTURA APP (UBER, DIDI)",placas:"VWX-654E", uso:"DIDI",  tipo:"COCHE", prima:3142.80, primaNeta:2260.00, primerPago:785.70,  vigDesde:"10/01/2025", vigHasta:"10/01/2026", formaPago:"Trimestral", estatus:"Vencida",      fechaEmision:"10/01/2025", notas:"" },
  { id:"3407111", aseguradora:"MAPFRE",   asegurado:"Luis Torres Moreno",  oficina:"COFISEM AV. E.ZAPATA",   vendedor:"Carlos Soto",   cobertura:"TAXI BÁSICA 2500",           placas:"YZA-987F", uso:"TAXI",  tipo:"COCHE", prima:2200.00, primaNeta:1496.55, primerPago:2200.00, vigDesde:"05/02/2025", vigHasta:"05/02/2026", formaPago:"Contado",    estatus:"Cancelada",    fechaEmision:"05/02/2025", notas:"Solicitud del cliente" },
  { id:"3414001", aseguradora:"QUALITAS", asegurado:"Pedro Ramos Salinas", oficina:"COFISEM TEMIXCO",         vendedor:"Laura Rosher",  cobertura:"SERV. PÚB. 50/50 GAMAN 2",  placas:"BCD-111G", uso:"TAXI",  tipo:"COCHE", prima:2548.00, primaNeta:1790.00, primerPago:2548.00, vigDesde:"17/03/2026", vigHasta:"17/03/2027", formaPago:"Contado",    estatus:"Pend. aplicar",fechaEmision:"17/03/2026", notas:"Enviada por operadora CIVAC" },
  { id:"3414002", aseguradora:"GNP",      asegurado:"Rosa Mendoza Lima",   oficina:"OFICINA CIVAC",          vendedor:"Marco A. Cruz", cobertura:"TAXI BÁSICA 2500",           placas:"EFG-222H", uso:"TAXI",  tipo:"COCHE", prima:2200.00, primaNeta:1496.55, primerPago:2200.00, vigDesde:"17/03/2026", vigHasta:"17/03/2027", formaPago:"Contado",    estatus:"Pend. aplicar",fechaEmision:"17/03/2026", notas:"" },
];

const CAMBIOS_ESTATUS = ["Vigente", "Suspendida", "Cancelada", "Por vencer"];

// ── Subcomponentes ────────────────────────────────────────────
function Badge({ estatus }) {
  const s = ESTATUSES[estatus] ?? ESTATUSES["Cancelada"];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} shrink-0`}/>
      {estatus}
    </span>
  );
}

function Filtro({ label, value, onChange, opciones }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]">
        {opciones.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ── Modal detalle / cambio de estatus ─────────────────────────
function ModalPoliza({ poliza, onClose, onGuardar }) {
  const [estatus,  setEstatus]  = useState(poliza.estatus);
  const [notas,    setNotas]    = useState(poliza.notas);
  const [aplicando, setAplicando] = useState(false);

  const cambioEstatus = estatus !== poliza.estatus;

  const handleGuardar = () => {
    setAplicando(true);
    setTimeout(() => { onGuardar({ ...poliza, estatus, notas }); }, 600);
  };

  const filas = [
    ["No. Póliza",       poliza.id,            "mono"],
    ["Aseguradora",      poliza.aseguradora,   ""],
    ["Asegurado",        poliza.asegurado,      "semibold"],
    ["Cobertura",        poliza.cobertura,      ""],
    ["Oficina",          poliza.oficina,        ""],
    ["Vendedor",         poliza.vendedor,       ""],
    ["Placas",           poliza.placas,         "mono"],
    ["Uso / Tipo",       `${poliza.uso} · ${poliza.tipo}`, ""],
    ["Vigencia",         `${poliza.vigDesde} → ${poliza.vigHasta}`, ""],
    ["Forma de pago",    poliza.formaPago,      ""],
    ["Prima total",      `$${poliza.prima.toFixed(2)}`,    "semibold emerald"],
    ["Prima neta",       `$${poliza.primaNeta.toFixed(2)}`, ""],
    ["1er pago",         `$${poliza.primerPago.toFixed(2)}`, ""],
    ["Fecha emisión",    poliza.fechaEmision,   ""],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter:"blur(8px)", backgroundColor:"rgba(10,15,40,0.55)" }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#13193a]/8 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-[#13193a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#13193a]">Detalle de Póliza</h2>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">{poliza.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5 flex-1">
          {/* Datos de la póliza */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            {filas.map(([label, valor, cls]) => (
              <div key={label} className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
                <p className="text-xs text-gray-400 shrink-0 font-medium">{label}</p>
                <p className={`text-xs text-right truncate max-w-xs ${
                  cls.includes("mono")    ? "font-mono font-bold text-[#13193a]" :
                  cls.includes("semibold")? "font-semibold text-[#13193a]" :
                  cls.includes("emerald") ? "font-bold text-emerald-700" :
                  "text-gray-700"
                }`}>{valor}</p>
              </div>
            ))}
          </div>

          {/* Cambio de estatus */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Gestión de estatus</p>

            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-xs text-gray-500">Estatus actual:</p>
              <Badge estatus={poliza.estatus}/>
              {cambioEstatus && (
                <>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                  <Badge estatus={estatus}/>
                </>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Cambiar a</label>
              <div className="flex flex-wrap gap-2">
                {CAMBIOS_ESTATUS.map(e => (
                  <button
                    key={e}
                    onClick={() => setEstatus(e)}
                    className={[
                      "px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all",
                      estatus === e
                        ? "bg-[#13193a] text-white border-[#13193a]"
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300",
                    ].join(" ")}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Notas / Motivo</label>
              <textarea
                rows={2}
                value={notas}
                onChange={e => setNotas(e.target.value)}
                placeholder="Motivo del cambio, observaciones..."
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] resize-none"
              />
            </div>
          </div>

          {/* Aplicar póliza pendiente */}
          {poliza.estatus === "Pend. aplicar" && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>
                </svg>
                <div>
                  <p className="text-sm font-bold text-blue-800">Póliza pendiente de aplicación</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Esta póliza fue tramitada por una operadora y requiere revisión y aplicación en el sistema de la aseguradora.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEstatus("Vigente")}
                className="mt-3 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all"
              >
                Marcar como aplicada → Vigente
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6 sticky bottom-0 bg-white border-t border-gray-100 pt-4">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={aplicando}
            className="flex-1 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#13193a]/15"
          >
            {aplicando ? (
              <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Aplicando...</>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>Guardar cambios</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function AnalistaPolizas() {
  const [polizas,        setPolizas]        = useState(POLIZAS_MOCK);
  const [busqueda,       setBusqueda]       = useState("");
  const [filtroOficina,  setFiltroOficina]  = useState("Todas");
  const [filtroVendedor, setFiltroVendedor] = useState("Todos");
  const [filtroEstatus,  setFiltroEstatus]  = useState("Todos");
  const [filtroFecha,    setFiltroFecha]    = useState("");
  const [polizaSel,      setPolizaSel]      = useState(null);
  const [tab,            setTab]            = useState("todas");  // todas | pendientes

  const pendientes = polizas.filter(p => p.estatus === "Pend. aplicar");

  const filtradas = polizas.filter(p => {
    const matchBusq  = p.id.includes(busqueda) || p.asegurado.toLowerCase().includes(busqueda.toLowerCase()) || p.placas.toLowerCase().includes(busqueda.toLowerCase());
    const matchOfic  = filtroOficina  === "Todas" || p.oficina  === filtroOficina;
    const matchVend  = filtroVendedor === "Todos"  || p.vendedor === filtroVendedor;
    const matchEst   = filtroEstatus  === "Todos"  || p.estatus  === filtroEstatus;
    const matchTab   = tab === "todas" || p.estatus === "Pend. aplicar";
    return matchBusq && matchOfic && matchVend && matchEst && matchTab;
  });

  const onGuardar = (updated) => {
    setPolizas(ps => ps.map(p => p.id === updated.id ? updated : p));
    setPolizaSel(null);
  };

  // Métricas rápidas
  const vigentes   = polizas.filter(p => p.estatus === "Vigente").length;
  const porVencer  = polizas.filter(p => p.estatus === "Por vencer").length;
  const vencidas   = polizas.filter(p => p.estatus === "Vencida").length;
  const pendAplic  = pendientes.length;

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#13193a]">Pólizas</h1>
        <p className="text-gray-400 text-sm mt-0.5">Consulta, aplicación y cambio de estatus — todas las oficinas</p>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:"Vigentes",       value:vigentes,  accent:"emerald", onClick:()=>{setFiltroEstatus("Vigente");    setTab("todas"); } },
          { label:"Por vencer",     value:porVencer, accent:"amber",   onClick:()=>{setFiltroEstatus("Por vencer"); setTab("todas"); } },
          { label:"Vencidas",       value:vencidas,  accent:"red",     onClick:()=>{setFiltroEstatus("Vencida");    setTab("todas"); } },
          { label:"Pend. aplicar",  value:pendAplic, accent:"blue",    onClick:()=>{setTab("pendientes"); setFiltroEstatus("Todos"); } },
        ].map(m => {
          const colors = {
            emerald:"bg-emerald-50 text-emerald-600 border-emerald-100",
            amber:  "bg-amber-50   text-amber-600   border-amber-100",
            red:    "bg-red-50     text-red-600     border-red-100",
            blue:   "bg-blue-50    text-blue-600    border-blue-100",
          };
          return (
            <button key={m.label} onClick={m.onClick}
              className={`${colors[m.accent]} border rounded-2xl p-4 text-left hover:shadow-sm transition-all`}>
              <p className="text-2xl font-bold tabular-nums">{m.value}</p>
              <p className="text-xs font-semibold mt-0.5 opacity-80">{m.label}</p>
            </button>
          );
        })}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Tabs */}
        <div className="flex items-center border-b border-gray-100 px-2">
          {[
            { k:"todas",      l:"Todas las pólizas" },
            { k:"pendientes", l:`Pend. de aplicar`, badge: pendAplic },
          ].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={[
                "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all",
                tab === t.k ? "border-[#13193a] text-[#13193a]" : "border-transparent text-gray-400 hover:text-gray-600",
              ].join(" ")}>
              {t.l}
              {t.badge > 0 && (
                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 px-5 py-4 border-b border-gray-100">
          {/* Búsqueda */}
          <div className="lg:col-span-2 relative">
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
            </svg>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar póliza, asegurado, placas..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] bg-white"/>
          </div>
          <Filtro label="Oficina"  value={filtroOficina}  onChange={setFiltroOficina}  opciones={OFICINAS}/>
          <Filtro label="Vendedor" value={filtroVendedor} onChange={setFiltroVendedor} opciones={VENDEDORES}/>
          <Filtro label="Estatus"  value={filtroEstatus}  onChange={setFiltroEstatus}  opciones={["Todos", ...Object.keys(ESTATUSES)]}/>
        </div>

        {/* Tabla de resultados */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {["Póliza","Asegurado","Aseguradora","Oficina","Vendedor","Cobertura","Placas","Prima","Vigencia","Estatus",""].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtradas.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-12 text-sm text-gray-400">No se encontraron pólizas con esos filtros.</td></tr>
              ) : filtradas.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50/60 transition-colors cursor-pointer" onClick={() => setPolizaSel(p)}>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-[#13193a]">{p.id}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">{p.asegurado}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{p.aseguradora}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-32 truncate">{p.oficina}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{p.vendedor}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-36 truncate">{p.cobertura}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.placas}</td>
                  <td className="px-4 py-3 text-xs font-bold text-emerald-700">${p.prima.toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{p.vigHasta}</td>
                  <td className="px-4 py-3"><Badge estatus={p.estatus}/></td>
                  <td className="px-4 py-3">
                    <button onClick={e => { e.stopPropagation(); setPolizaSel(p); }}
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Mostrando <strong className="text-gray-600">{filtradas.length}</strong> de <strong className="text-gray-600">{polizas.length}</strong> pólizas
          </p>
          <button onClick={() => { setFiltroOficina("Todas"); setFiltroVendedor("Todos"); setFiltroEstatus("Todos"); setBusqueda(""); setTab("todas"); }}
            className="text-xs text-blue-600 hover:underline font-medium">
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Modal */}
      {polizaSel && (
        <ModalPoliza poliza={polizaSel} onClose={() => setPolizaSel(null)} onGuardar={onGuardar}/>
      )}
    </div>
  );
}