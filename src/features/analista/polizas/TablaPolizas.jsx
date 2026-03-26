// ============================================================
// src/features/analista/polizas/TablaPolizas.jsx
// Tabla de pólizas con filtros — analista ve TODAS las oficinas
// ============================================================
import { useState } from "react";
import Badge from "../../../shared/ui/Badge";
import Buscador, { FiltroSelect } from "../../../shared/ui/Buscador";
import { TablaBase, TablaTabs, TablaScroll, Th, Td, FilaVacia } from "../../../shared/ui/TablaBase";
import { OFICINAS_CON_TODAS, VENDEDORES_CON_TODOS } from "../../../shared/constants/oficinas";

const POLIZAS_MOCK = [
  { id:"3413241", aseguradora:"QUALITAS", asegurado:"Angel Ivan Ortega",   oficina:"OFICINA CIVAC",         vendedor:"Laura Rosher",    cobertura:"COBERTURA APP (UBER, DIDI)", placas:"TRAMITE",  uso:"DIDI", tipo:"COCHE", prima:3142.80, primaNeta:2260.00, primerPago:3142.80, vigDesde:"13/03/2026", vigHasta:"13/03/2027", formaPago:"Trimestral",  estatus:"Vigente",       fechaEmision:"13/03/2026", notas:"" },
  { id:"3413198", aseguradora:"QUALITAS", asegurado:"María García López",  oficina:"COFISEM AV. E.ZAPATA",  vendedor:"Marco A. Cruz",   cobertura:"TAXI BÁSICA 2500",           placas:"VRM-123A", uso:"TAXI", tipo:"COCHE", prima:2200.00, primaNeta:1496.55, primerPago:2200.00, vigDesde:"12/03/2026", vigHasta:"12/03/2027", formaPago:"Contado",     estatus:"Vigente",       fechaEmision:"12/03/2026", notas:"" },
  { id:"3413167", aseguradora:"GNP",      asegurado:"Roberto Díaz Ramos",  oficina:"COFISEM AV. E.ZAPATA",  vendedor:"Laura Rosher",    cobertura:"SERV. PÚB. 50/50 GAMAN 2",  placas:"CHM-456B", uso:"TAXI", tipo:"COCHE", prima:2548.00, primaNeta:1790.00, primerPago:637.00,  vigDesde:"11/03/2026", vigHasta:"11/03/2027", formaPago:"4 Parciales", estatus:"Vigente",       fechaEmision:"11/03/2026", notas:"" },
  { id:"3411002", aseguradora:"QUALITAS", asegurado:"Carmen López Vargas", oficina:"COFISEM TEMIXCO",        vendedor:"Carlos Soto",     cobertura:"TAXI BÁSICA 2500",           placas:"PQR-789C", uso:"TAXI", tipo:"COCHE", prima:2200.00, primaNeta:1496.55, primerPago:2200.00, vigDesde:"20/03/2025", vigHasta:"20/03/2026", formaPago:"Contado",     estatus:"Por vencer",    fechaEmision:"20/03/2025", notas:"Avisar al cliente" },
  { id:"3410888", aseguradora:"AXA",      asegurado:"José Martínez Ruiz",  oficina:"OFICINA CIVAC",         vendedor:"Marco A. Cruz",   cobertura:"TAXI BÁSICA PAGOS 2700",     placas:"STU-321D", uso:"TAXI", tipo:"COCHE", prima:2320.00, primaNeta:1600.00, primerPago:580.00,  vigDesde:"22/03/2025", vigHasta:"22/03/2026", formaPago:"4 Parciales", estatus:"Por vencer",    fechaEmision:"22/03/2025", notas:"" },
  { id:"3408500", aseguradora:"HDI",      asegurado:"Ana Gutiérrez Pérez", oficina:"COFISEM CUAUTLA",        vendedor:"Patricia Morales",cobertura:"COBERTURA APP (UBER, DIDI)", placas:"VWX-654E", uso:"DIDI", tipo:"COCHE", prima:3142.80, primaNeta:2260.00, primerPago:785.70,  vigDesde:"10/01/2025", vigHasta:"10/01/2026", formaPago:"Trimestral",  estatus:"Vencida",       fechaEmision:"10/01/2025", notas:"" },
  { id:"3407111", aseguradora:"MAPFRE",   asegurado:"Luis Torres Moreno",  oficina:"COFISEM AV. E.ZAPATA",  vendedor:"Carlos Soto",     cobertura:"TAXI BÁSICA 2500",           placas:"YZA-987F", uso:"TAXI", tipo:"COCHE", prima:2200.00, primaNeta:1496.55, primerPago:2200.00, vigDesde:"05/02/2025", vigHasta:"05/02/2026", formaPago:"Contado",     estatus:"Cancelada",     fechaEmision:"05/02/2025", notas:"Solicitud del cliente" },
  { id:"3414001", aseguradora:"QUALITAS", asegurado:"Pedro Ramos Salinas", oficina:"COFISEM TEMIXCO",        vendedor:"Laura Rosher",    cobertura:"SERV. PÚB. 50/50 GAMAN 2",  placas:"BCD-111G", uso:"TAXI", tipo:"COCHE", prima:2548.00, primaNeta:1790.00, primerPago:2548.00, vigDesde:"17/03/2026", vigHasta:"17/03/2027", formaPago:"Contado",     estatus:"Pend. aplicar", fechaEmision:"17/03/2026", notas:"Enviada por operadora CIVAC" },
  { id:"3414002", aseguradora:"GNP",      asegurado:"Rosa Mendoza Lima",   oficina:"OFICINA CIVAC",         vendedor:"Marco A. Cruz",   cobertura:"TAXI BÁSICA 2500",           placas:"EFG-222H", uso:"TAXI", tipo:"COCHE", prima:2200.00, primaNeta:1496.55, primerPago:2200.00, vigDesde:"17/03/2026", vigHasta:"17/03/2027", formaPago:"Contado",     estatus:"Pend. aplicar", fechaEmision:"17/03/2026", notas:"" },
];

const TABS = [
  { key: "todas",      label: "Todas las pólizas"  },
  { key: "pendientes", label: "Pend. de aplicar"   },
];

export default function TablaPolizas({ onSeleccionar }) {
  const [polizas,        setPolizas]        = useState(POLIZAS_MOCK);
  const [tab,            setTab]            = useState("todas");
  const [busqueda,       setBusqueda]       = useState("");
  const [filtroOficina,  setFiltroOficina]  = useState("Todas");
  const [filtroVendedor, setFiltroVendedor] = useState("Todos");
  const [filtroEstatus,  setFiltroEstatus]  = useState("Todos");

  const pendientes = polizas.filter((p) => p.estatus === "Pend. aplicar");

  const filtradas = polizas.filter((p) => {
    const mb = p.id.includes(busqueda) || p.asegurado.toLowerCase().includes(busqueda.toLowerCase()) || p.placas.toLowerCase().includes(busqueda.toLowerCase());
    const mo = filtroOficina  === "Todas" || p.oficina  === filtroOficina;
    const mv = filtroVendedor === "Todos"  || p.vendedor === filtroVendedor;
    const me = filtroEstatus  === "Todos"  || p.estatus  === filtroEstatus;
    const mt = tab === "todas" || p.estatus === "Pend. aplicar";
    return mb && mo && mv && me && mt;
  });

  // Métricas rápidas
  const cnt = (est) => polizas.filter((p) => p.estatus === est).length;

  return (
    <div className="space-y-4">
      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Vigentes",      value: cnt("Vigente"),       accent: "emerald", onClick: () => { setFiltroEstatus("Vigente");      setTab("todas"); } },
          { label: "Por vencer",    value: cnt("Por vencer"),    accent: "amber",   onClick: () => { setFiltroEstatus("Por vencer");   setTab("todas"); } },
          { label: "Vencidas",      value: cnt("Vencida"),       accent: "red",     onClick: () => { setFiltroEstatus("Vencida");      setTab("todas"); } },
          { label: "Pend. aplicar", value: pendientes.length,    accent: "blue",    onClick: () => { setTab("pendientes"); setFiltroEstatus("Todos"); } },
        ].map((m) => {
          const c = { emerald:"bg-emerald-50 text-emerald-600 border-emerald-100", amber:"bg-amber-50 text-amber-600 border-amber-100", red:"bg-red-50 text-red-600 border-red-100", blue:"bg-blue-50 text-blue-600 border-blue-100" };
          return (
            <button key={m.label} onClick={m.onClick} className={`${c[m.accent]} border rounded-2xl p-4 text-left hover:shadow-sm transition-all`}>
              <p className="text-2xl font-bold tabular-nums">{m.value}</p>
              <p className="text-xs font-semibold mt-0.5 opacity-80">{m.label}</p>
            </button>
          );
        })}
      </div>

      {/* Tabla */}
      <TablaBase footer={
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">{filtradas.length} de {polizas.length} pólizas</p>
          <button onClick={() => { setFiltroOficina("Todas"); setFiltroVendedor("Todos"); setFiltroEstatus("Todos"); setBusqueda(""); setTab("todas"); }} className="text-xs text-blue-600 hover:underline font-medium">
            Limpiar filtros
          </button>
        </div>
      }>
        <TablaTabs
          tabs={[
            TABS[0],
            { key: "pendientes", label: "Pend. de aplicar", badge: pendientes.length, badgeCls: "bg-blue-100 text-blue-700" },
          ]}
          activeTab={tab}
          onTabChange={setTab}
        />
        {/* Filtros */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 px-5 py-4 border-b border-gray-100">
          <div className="lg:col-span-2">
            <Buscador value={busqueda} onChange={setBusqueda} placeholder="Póliza, asegurado, placas..." />
          </div>
          <FiltroSelect value={filtroOficina}  onChange={setFiltroOficina}  opciones={OFICINAS_CON_TODAS} />
          <FiltroSelect value={filtroVendedor} onChange={setFiltroVendedor} opciones={["Todos", "Laura Rosher", "Marco A. Cruz", "Carlos Soto", "Patricia Morales"]} />
          <FiltroSelect value={filtroEstatus}  onChange={setFiltroEstatus}  opciones={["Todos", "Vigente", "Por vencer", "Vencida", "Cancelada", "Suspendida", "Pend. aplicar"]} />
        </div>

        <TablaScroll>
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <Th>Póliza</Th><Th>Asegurado</Th><Th>Aseguradora</Th>
              <Th>Oficina</Th><Th>Vendedor</Th><Th>Cobertura</Th>
              <Th>Placas</Th><Th>Prima</Th><Th>Vigencia</Th><Th>Estatus</Th><Th></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtradas.length === 0 ? (
              <FilaVacia cols={11} mensaje="No se encontraron pólizas con esos filtros." />
            ) : (
              filtradas.map((p, i) => (
                <tr key={i} onClick={() => onSeleccionar(p)} className="hover:bg-gray-50/60 transition-colors cursor-pointer">
                  <Td className="font-mono text-xs font-bold text-[#13193a]">{p.id}</Td>
                  <Td className="text-xs font-semibold text-gray-700 whitespace-nowrap">{p.asegurado}</Td>
                  <Td className="text-xs text-gray-500">{p.aseguradora}</Td>
                  <Td className="text-xs text-gray-500 max-w-28 truncate">{p.oficina}</Td>
                  <Td className="text-xs text-gray-500 whitespace-nowrap">{p.vendedor}</Td>
                  <Td className="text-xs text-gray-500 max-w-36 truncate">{p.cobertura}</Td>
                  <Td className="font-mono text-xs text-gray-600">{p.placas}</Td>
                  <Td className="text-xs font-bold text-emerald-700">${p.prima.toFixed(2)}</Td>
                  <Td className="text-xs text-gray-500 whitespace-nowrap">{p.vigHasta}</Td>
                  <Td><Badge estatus={p.estatus} showDot /></Td>
                  <Td>
                    <button onClick={(e) => { e.stopPropagation(); onSeleccionar(p); }} className="w-7 h-7 rounded-lg text-gray-300 hover:text-[#13193a] hover:bg-gray-100 flex items-center justify-center transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
                    </button>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </TablaScroll>
      </TablaBase>
    </div>
  );
}
