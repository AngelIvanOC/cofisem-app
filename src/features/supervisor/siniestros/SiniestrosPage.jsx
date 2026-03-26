// ============================================================
// src/features/supervisor/siniestros/SiniestrosPage.jsx
// Supervisor: Vista completa de todos los siniestros + acciones
// ============================================================
import { useState } from "react";
import Badge from "../../../shared/ui/Badge";
import Buscador, { FiltroSelect } from "../../../shared/ui/Buscador";
import { TablaBase, TablaTabs, TablaScroll, Th, Td, FilaVacia } from "../../../shared/ui/TablaBase";
import ModalDesglose from "./ModalDesglose";
import PanelReasignar from "./PanelReasignar";
import PanelCanalizar from "./PanelCanalizar";

const AJUSTADORES_F = ["Todos","Roberto Vega","Sandra Moreno","Felipe Castillo","Diana Ríos","Sin asignar"];
const TIPOS_F = ["Todos","Colisión","Robo total","Robo parcial","Daños a terceros","Volcadura","Incendio","Cristales"];

const SINIESTROS_INIT = [
  { folio:"SIN-088", asegurado:"Angel Ivan Ortega",   poliza:"3413241", tipo:"Colisión",         fecha:"20/03/2026", hora:"09:14", lugar:"Av. Morelos y Calle 5", placas:"TRAMITE",  cobertura:"COBERTURA APP",        ajustador:null,            estatus:"Sin asignar", tercero:{ lesionados:true  }, notas:"Tercero se fue.", horaReporte:"09:14" },
  { folio:"SIN-087", asegurado:"Roberto Díaz Ramos",  poliza:"3413167", tipo:"Robo parcial",     fecha:"20/03/2026", hora:"08:32", lugar:"Centro Histórico",       placas:"CHM-456B", cobertura:"SERV. PÚB. 50/50",    ajustador:"Roberto Vega",  estatus:"Asignado",    tercero:null,                notas:null,              horaReporte:"08:32", horaAsig:"09:15" },
  { folio:"SIN-086", asegurado:"Carmen López Vargas", poliza:"3411002", tipo:"Daños a terceros", fecha:"19/03/2026", hora:"17:45", lugar:"Blvd. Juárez 205",       placas:"PQR-789C", cobertura:"TAXI BÁSICA 2500",     ajustador:"Sandra Moreno", estatus:"En proceso",  tercero:{ lesionados:false }, notas:null,              horaReporte:"17:45", horaAsig:"18:10", horaArribo:"18:35" },
  { folio:"SIN-085", asegurado:"José Martínez Ruiz",  poliza:"3410888", tipo:"Robo total",       fecha:"19/03/2026", hora:"02:10", lugar:"Col. Chapultepec",       placas:"STU-321D", cobertura:"TAXI BÁSICA PAGOS",    ajustador:"Felipe Castillo",estatus:"En proceso", tercero:null,                notas:"Denuncia MP-2026", horaReporte:"02:10", horaAsig:"07:30", horaArribo:"08:15" },
  { folio:"SIN-084", asegurado:"María García López",  poliza:"3413198", tipo:"Colisión",         fecha:"17/03/2026", hora:"14:20", lugar:"Carretera 95, km 12",    placas:"VRM-123A", cobertura:"TAXI BÁSICA 2500",     ajustador:"Diana Ríos",    estatus:"Cerrado",     tercero:{ lesionados:true  }, notas:"Cerrado. Pago $18,400.", horaReporte:"14:20", horaAsig:"15:00", horaArribo:"15:45", horaEvidencia:"16:30", horaResol:"17:15" },
  { folio:"SIN-083", asegurado:"Lucía Peña Torres",   poliza:"3409005", tipo:"Colisión",         fecha:"18/03/2026", hora:"15:20", lugar:"Blvd. Cuauhnáhuac km 3", placas:"MOR-9921", cobertura:"TAXI BÁSICA 2500",     ajustador:"Roberto Vega",  estatus:"En proceso",  tercero:{ lesionados:false }, notas:null,              horaReporte:"15:20", horaAsig:"16:00", horaArribo:"16:40" },
];

const TABS = [
  { key:"todos",       label:"Todos"        },
  { key:"sin_asignar", label:"Sin asignar"  },
  { key:"en_proceso",  label:"En proceso"   },
  { key:"cerrados",    label:"Cerrados"     },
];

export default function SupervisorSiniestros() {
  const [siniestros,    setSiniestros]    = useState(SINIESTROS_INIT);
  const [tab,           setTab]           = useState("todos");
  const [busqueda,      setBusqueda]      = useState("");
  const [filtroAjust,   setFiltroAjust]   = useState("Todos");
  const [filtroTipo,    setFiltroTipo]    = useState("Todos");
  const [modal,         setModal]         = useState(null);
  const [sinSel,        setSinSel]        = useState(null);

  const TAB_FILTER = {
    todos:       () => true,
    sin_asignar: (s) => s.estatus === "Sin asignar",
    en_proceso:  (s) => ["Asignado","En proceso"].includes(s.estatus),
    cerrados:    (s) => s.estatus === "Cerrado",
  };

  const filtrados = siniestros.filter((s) => {
    const mb = s.folio.includes(busqueda) || s.asegurado.toLowerCase().includes(busqueda.toLowerCase()) || s.poliza.includes(busqueda);
    const ma = filtroAjust === "Todos" || (filtroAjust === "Sin asignar" ? !s.ajustador : s.ajustador === filtroAjust);
    const mt = filtroTipo  === "Todos" || s.tipo === filtroTipo;
    return mb && ma && mt && TAB_FILTER[tab](s);
  });

  const cuentas = {
    sin_asignar: siniestros.filter((s) => s.estatus === "Sin asignar").length,
    en_proceso:  siniestros.filter((s) => ["Asignado","En proceso"].includes(s.estatus)).length,
    cerrados:    siniestros.filter((s) => s.estatus === "Cerrado").length,
  };

  const confirmarReasignacion = (folio, ajustador) => {
    setSiniestros((ss) => ss.map((s) => s.folio === folio ? { ...s, ajustador, estatus: "Asignado" } : s));
    setModal(null); setSinSel(null);
  };

  const confirmarCanalizacion = (folio) => {
    setSiniestros((ss) => ss.map((s) => s.folio === folio ? { ...s, estatus: "Jurídico" } : s));
    setModal(null); setSinSel(null);
  };

  const tabsConBadge = TABS.map((t) => ({
    ...t,
    badge: cuentas[t.key],
    badgeCls: t.key === "sin_asignar" ? "bg-amber-100 text-amber-700" : t.key === "en_proceso" ? "bg-blue-100 text-blue-700" : undefined,
  }));

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#13193a]">Siniestros</h1>
        <p className="text-gray-400 text-sm mt-0.5">Supervisión, reasignación y canalización — todas las oficinas</p>
      </div>

      <TablaBase footer={<p className="text-xs text-gray-400">{filtrados.length} registros</p>}>
        <TablaTabs tabs={tabsConBadge} activeTab={tab} onTabChange={setTab} />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-5 py-4 border-b border-gray-100">
          <div className="lg:col-span-2"><Buscador value={busqueda} onChange={setBusqueda} placeholder="Folio, asegurado, póliza..." /></div>
          <FiltroSelect value={filtroAjust} onChange={setFiltroAjust} opciones={AJUSTADORES_F} />
          <FiltroSelect value={filtroTipo}  onChange={setFiltroTipo}  opciones={TIPOS_F} />
        </div>

        <TablaScroll>
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <Th>Folio</Th><Th>Asegurado</Th><Th>Tipo</Th><Th>Fecha</Th>
              <Th>Ajustador</Th><Th>Estatus</Th><Th>Alerta</Th><Th>Acciones</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtrados.length === 0
              ? <FilaVacia cols={8} mensaje="No hay siniestros con esos filtros." />
              : filtrados.map((s, i) => (
                <tr key={i} className={`hover:bg-gray-50/60 transition-colors ${s.estatus === "Sin asignar" ? "bg-amber-50/20" : ""}`}>
                  <Td className="font-mono text-xs font-bold text-[#13193a]">{s.folio}</Td>
                  <Td className="text-xs font-semibold text-gray-700 whitespace-nowrap">{s.asegurado}</Td>
                  <Td className="text-xs text-gray-600">{s.tipo}</Td>
                  <Td className="text-xs text-gray-400 whitespace-nowrap">{s.fecha}</Td>
                  <Td className="text-xs text-gray-500">{s.ajustador ?? <span className="text-amber-500 font-semibold">Sin asignar</span>}</Td>
                  <Td><Badge estatus={s.estatus} showDot /></Td>
                  <Td>
                    {s.tercero?.lesionados
                      ? <span className="inline-flex text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">⚠ Lesionados</span>
                      : <span className="text-gray-300 text-xs">—</span>
                    }
                  </Td>
                  <Td>
                    <div className="flex gap-1.5">
                      <button onClick={() => { setSinSel(s); setModal("desglose"); }}
                        className="text-xs font-bold text-[#13193a] border border-[#13193a]/20 px-2.5 py-1.5 rounded-xl hover:bg-[#13193a]/5 transition-all">
                        Ver
                      </button>
                      {s.estatus !== "Cerrado" && (
                        <>
                          <button onClick={() => { setSinSel(s); setModal("reasignar"); }}
                            className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-xl hover:bg-amber-100 transition-all">
                            Reasignar
                          </button>
                          <button onClick={() => { setSinSel(s); setModal("canalizar"); }}
                            className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1.5 rounded-xl hover:bg-purple-100 transition-all">
                            Canalizar
                          </button>
                        </>
                      )}
                    </div>
                  </Td>
                </tr>
              ))
            }
          </tbody>
        </TablaScroll>
      </TablaBase>

      {modal === "desglose"  && sinSel && <ModalDesglose siniestro={sinSel} onClose={() => { setModal(null); setSinSel(null); }} onReasignar={(s) => { setSinSel(s); setModal("reasignar"); }} onCanalizar={(s) => { setSinSel(s); setModal("canalizar"); }} />}
      {modal === "reasignar" && sinSel && <PanelReasignar siniestro={sinSel} onClose={() => { setModal(null); setSinSel(null); }} onConfirmar={confirmarReasignacion} />}
      {modal === "canalizar" && sinSel && <PanelCanalizar siniestro={sinSel} onClose={() => { setModal(null); setSinSel(null); }} onConfirmar={confirmarCanalizacion} />}
    </div>
  );
}
