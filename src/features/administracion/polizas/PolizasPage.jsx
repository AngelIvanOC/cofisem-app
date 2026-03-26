// ============================================================
// src/features/administracion/polizas/PolizasPage.jsx
// Admin: Cancelar pólizas y gestionar endosos — todas las oficinas
// ============================================================
import { useState } from "react";
import Badge from "../../../shared/ui/Badge";
import Buscador, { FiltroSelect } from "../../../shared/ui/Buscador";
import { TablaBase, TablaTabs, TablaScroll, Th, Td, FilaVacia } from "../../../shared/ui/TablaBase";
import { OFICINAS_CON_TODAS, VENDEDORES_CON_TODOS } from "../../../shared/constants/oficinas";
import ModalCancelar from "./ModalCancelar";
import ModalEndoso from "./ModalEndoso";

const POLIZAS_INIT = [
  { id:"3413241", aseguradora:"QUALITAS", asegurado:"Angel Ivan Ortega",   oficina:"OFICINA CIVAC",        vendedor:"Laura Rosher",    cobertura:"COBERTURA APP (UBER, DIDI)", placas:"TRAMITE",  prima:3142.80, vigHasta:"13/03/2027", estatus:"Vigente",    endosos:[] },
  { id:"3413198", aseguradora:"QUALITAS", asegurado:"María García López",  oficina:"COFISEM AV. E.ZAPATA", vendedor:"Marco A. Cruz",   cobertura:"TAXI BÁSICA 2500",           placas:"VRM-123A", prima:2200.00, vigHasta:"12/03/2027", estatus:"Vigente",    endosos:[] },
  { id:"3413167", aseguradora:"GNP",      asegurado:"Roberto Díaz Ramos",  oficina:"COFISEM AV. E.ZAPATA", vendedor:"Laura Rosher",    cobertura:"SERV. PÚB. 50/50 GAMAN 2",  placas:"CHM-456B", prima:2548.00, vigHasta:"11/03/2027", estatus:"Vigente",    endosos:[] },
  { id:"3411002", aseguradora:"QUALITAS", asegurado:"Carmen López Vargas", oficina:"COFISEM TEMIXCO",       vendedor:"Carlos Soto",    cobertura:"TAXI BÁSICA 2500",           placas:"PQR-789C", prima:2200.00, vigHasta:"20/03/2026", estatus:"Por vencer", endosos:[{ id:"END-012", tipo:"Cambio de placas", detalle:"Nueva placa asignada", valorNuevo:"ABC-123X", fecha:"16/03/2026", estatus:"Pendiente" }] },
  { id:"3410888", aseguradora:"AXA",      asegurado:"José Martínez Ruiz",  oficina:"OFICINA CIVAC",        vendedor:"Marco A. Cruz",   cobertura:"TAXI BÁSICA PAGOS 2700",     placas:"STU-321D", prima:2320.00, vigHasta:"22/03/2026", estatus:"Por vencer", endosos:[] },
  { id:"3407111", aseguradora:"MAPFRE",   asegurado:"Luis Torres Moreno",  oficina:"COFISEM AV. E.ZAPATA", vendedor:"Carlos Soto",    cobertura:"TAXI BÁSICA 2500",           placas:"YZA-987F", prima:2200.00, vigHasta:"05/02/2026", estatus:"Cancelada",  endosos:[] },
];

const TABS = [
  { key: "polizas",  label: "Pólizas"  },
  { key: "endosos",  label: "Endosos"  },
];

export default function AdminPolizas() {
  const [polizas,        setPolizas]        = useState(POLIZAS_INIT);
  const [tab,            setTab]            = useState("polizas");
  const [busqueda,       setBusqueda]       = useState("");
  const [filtroOficina,  setFiltroOficina]  = useState("Todas");
  const [filtroVendedor, setFiltroVendedor] = useState("Todos");
  const [filtroEstatus,  setFiltroEstatus]  = useState("Todos");
  const [modal,          setModal]          = useState(null);
  const [polSel,         setPolSel]         = useState(null);

  const todosEndosos = polizas.flatMap((p) => p.endosos.map((e) => ({ ...e, polizaId: p.id, asegurado: p.asegurado, oficina: p.oficina })));

  const filtradas = polizas.filter((p) => {
    const mb = p.id.includes(busqueda) || p.asegurado.toLowerCase().includes(busqueda.toLowerCase()) || p.placas.toLowerCase().includes(busqueda.toLowerCase());
    const mo = filtroOficina  === "Todas" || p.oficina  === filtroOficina;
    const mv = filtroVendedor === "Todos"  || p.vendedor === filtroVendedor;
    const me = filtroEstatus  === "Todos"  || p.estatus  === filtroEstatus;
    return mb && mo && mv && me;
  });

  const confirmarCancelacion = (id) => {
    setPolizas((ps) => ps.map((p) => p.id === id ? { ...p, estatus: "Cancelada" } : p));
    setModal(null); setPolSel(null);
  };

  const confirmarEndoso = (id, data) => {
    const nuevoId = `END-${String(todosEndosos.length + 13).padStart(3, "0")}`;
    setPolizas((ps) => ps.map((p) => p.id === id
      ? { ...p, endosos: [...p.endosos, { id: nuevoId, ...data, fecha: new Date().toLocaleDateString("es-MX"), estatus: "Pendiente" }] }
      : p
    ));
    setModal(null); setPolSel(null);
  };

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#13193a]">Pólizas</h1>
        <p className="text-gray-400 text-sm mt-0.5">Cancelaciones y endosos — todas las oficinas</p>
      </div>

      <TablaBase footer={<p className="text-xs text-gray-400">{tab === "polizas" ? `${filtradas.length} pólizas` : `${todosEndosos.length} endosos`}</p>}>
        <TablaTabs
          tabs={[TABS[0], { key: "endosos", label: "Endosos", badge: todosEndosos.length, badgeCls: "bg-amber-100 text-amber-700" }]}
          activeTab={tab}
          onTabChange={setTab}
        />

        {/* Filtros */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 px-5 py-4 border-b border-gray-100">
          <div className="lg:col-span-2"><Buscador value={busqueda} onChange={setBusqueda} placeholder="Póliza, asegurado, placas..." /></div>
          <FiltroSelect value={filtroOficina}  onChange={setFiltroOficina}  opciones={OFICINAS_CON_TODAS} />
          <FiltroSelect value={filtroVendedor} onChange={setFiltroVendedor} opciones={["Todos", "Laura Rosher", "Marco A. Cruz", "Carlos Soto", "Patricia Morales"]} />
          <FiltroSelect value={filtroEstatus}  onChange={setFiltroEstatus}  opciones={["Todos", "Vigente", "Por vencer", "Vencida", "Cancelada", "Suspendida", "Pend. aplicar"]} />
        </div>

        {/* Tab pólizas */}
        {tab === "polizas" && (
          <TablaScroll>
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <Th>Póliza</Th><Th>Asegurado</Th><Th>Aseguradora</Th><Th>Oficina</Th>
                <Th>Cobertura</Th><Th>Placas</Th><Th>Prima</Th><Th>Vence</Th><Th>Estatus</Th><Th>Acciones</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtradas.length === 0 ? <FilaVacia cols={10} /> : filtradas.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                  <Td className="font-mono text-xs font-bold text-[#13193a]">{p.id}</Td>
                  <Td className="text-xs font-semibold text-gray-700 whitespace-nowrap">{p.asegurado}</Td>
                  <Td className="text-xs text-gray-500">{p.aseguradora}</Td>
                  <Td className="text-xs text-gray-500 max-w-28 truncate">{p.oficina}</Td>
                  <Td className="text-xs text-gray-500 max-w-36 truncate">{p.cobertura}</Td>
                  <Td className="font-mono text-xs text-gray-600">{p.placas}</Td>
                  <Td className="text-xs font-bold text-emerald-700">${p.prima.toFixed(2)}</Td>
                  <Td className="text-xs text-gray-500 whitespace-nowrap">{p.vigHasta}</Td>
                  <Td><Badge estatus={p.estatus} showDot /></Td>
                  <Td>
                    {p.estatus !== "Cancelada" && (
                      <div className="flex gap-1.5">
                        <button onClick={() => { setPolSel(p); setModal("endoso"); }} className="px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold hover:bg-amber-100 transition-colors">Endoso</button>
                        <button onClick={() => { setPolSel(p); setModal("cancelar"); }} className="px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold hover:bg-red-100 transition-colors">Cancelar</button>
                      </div>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TablaScroll>
        )}

        {/* Tab endosos */}
        {tab === "endosos" && (
          <TablaScroll>
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <Th>ID Endoso</Th><Th>Póliza</Th><Th>Asegurado</Th><Th>Oficina</Th>
                <Th>Tipo</Th><Th>Nuevo valor</Th><Th>Detalle</Th><Th>Fecha</Th><Th>Estatus</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {todosEndosos.length === 0 ? <FilaVacia cols={9} mensaje="No hay endosos registrados." /> : todosEndosos.map((e, i) => (
                <tr key={i} className="hover:bg-gray-50/60">
                  <Td className="font-mono text-xs font-bold text-[#13193a]">{e.id}</Td>
                  <Td className="font-mono text-xs text-gray-600">{e.polizaId}</Td>
                  <Td className="text-xs font-semibold text-gray-700 whitespace-nowrap">{e.asegurado}</Td>
                  <Td className="text-xs text-gray-500 max-w-28 truncate">{e.oficina}</Td>
                  <Td className="text-xs text-gray-600">{e.tipo}</Td>
                  <Td className="font-mono text-xs text-gray-600">{e.valorNuevo || "—"}</Td>
                  <Td className="text-xs text-gray-500 max-w-40 truncate">{e.detalle}</Td>
                  <Td className="text-xs text-gray-500 whitespace-nowrap">{e.fecha}</Td>
                  <Td>
                    <span className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border ${e.estatus === "Procesado" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                      {e.estatus}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TablaScroll>
        )}
      </TablaBase>

      {modal === "cancelar" && polSel && <ModalCancelar poliza={polSel} onClose={() => { setModal(null); setPolSel(null); }} onConfirmar={confirmarCancelacion} />}
      {modal === "endoso"   && polSel && <ModalEndoso   poliza={polSel} onClose={() => { setModal(null); setPolSel(null); }} onConfirmar={confirmarEndoso} />}
    </div>
  );
}
