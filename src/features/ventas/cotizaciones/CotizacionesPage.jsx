// ============================================================
// src/features/ventas/cotizaciones/CotizacionesPage.jsx
// Ventas: Seguimiento de cotizaciones abiertas y cerradas
// ============================================================
import { useState } from "react";
import Badge from "../../../shared/ui/Badge";
import Buscador, { FiltroSelect } from "../../../shared/ui/Buscador";
import { TablaBase, TablaTabs, TablaScroll, Th, Td, FilaVacia } from "../../../shared/ui/TablaBase";

const COTIZACIONES = [
  { folio:"COT-0092", cliente:"Mario Hernández Silva",  vendedor:"Laura Rosher",  oficina:"E. Zapata", cobertura:"TAXI BÁSICA 2500",     prima:2200.00, fecha:"20/03/2026", venceCot:"27/03/2026", estatus:"Pendiente",  notas:"Interesado, pide plazo"         },
  { folio:"COT-0091", cliente:"Fernanda Castro Ruiz",   vendedor:"Diana Ríos",    oficina:"Cuautla",   cobertura:"SERV. PÚB. 50/50",     prima:2548.00, fecha:"19/03/2026", venceCot:"26/03/2026", estatus:"Pendiente",  notas:"Comparando con GNP"             },
  { folio:"COT-0090", cliente:"Octavio Vargas Nava",    vendedor:"Marco A. Cruz", oficina:"CIVAC",     cobertura:"COB. APP (UBER,DIDI)",  prima:3142.80, fecha:"18/03/2026", venceCot:"25/03/2026", estatus:"Por vencer", notas:"Recordar hoy"                   },
  { folio:"COT-0089", cliente:"Silvia Mora Estrada",    vendedor:"Carlos Soto",   oficina:"Temixco",   cobertura:"TAXI BÁSICA 2500",     prima:2200.00, fecha:"17/03/2026", venceCot:"24/03/2026", estatus:"Por vencer", notas:null                              },
  { folio:"COT-0088", cliente:"Hugo Pérez Aguilar",     vendedor:"Laura Rosher",  oficina:"E. Zapata", cobertura:"TAXI PAGOS 2700",      prima:2320.00, fecha:"16/03/2026", venceCot:"23/03/2026", estatus:"Por vencer", notas:"Prefiere pago mensual"          },
  { folio:"COT-0085", cliente:"Patricia Soto Vega",     vendedor:"Diana Ríos",    oficina:"Cuautla",   cobertura:"TAXI BÁSICA 2500",     prima:2200.00, fecha:"14/03/2026", venceCot:"21/03/2026", estatus:"Cerrada",    notas:"Contrató"                       },
  { folio:"COT-0082", cliente:"Ramón López Cruz",       vendedor:"Marco A. Cruz", oficina:"CIVAC",     cobertura:"GAMAN 2",              prima:2548.00, fecha:"10/03/2026", venceCot:"17/03/2026", estatus:"Expirada",   notas:"No contestó"                    },
  { folio:"COT-0078", cliente:"Ana González Ríos",      vendedor:"Laura Rosher",  oficina:"E. Zapata", cobertura:"SERV. PÚB. 50/50",    prima:2548.00, fecha:"05/03/2026", venceCot:"12/03/2026", estatus:"Rechazada",  notas:"Prefirió otra aseguradora"      },
];

const TABS = [
  { key:"todas",      label:"Todas"      },
  { key:"abiertas",   label:"Abiertas"   },
  { key:"por_vencer", label:"Por vencer" },
  { key:"cerradas",   label:"Cerradas"   },
];

const TAB_FN = {
  todas:      () => true,
  abiertas:   (c) => c.estatus === "Pendiente",
  por_vencer: (c) => c.estatus === "Por vencer",
  cerradas:   (c) => ["Cerrada","Expirada","Rechazada"].includes(c.estatus),
};

const VENDEDORES_F = ["Todos","Laura Rosher","Marco A. Cruz","Carlos Soto","Diana Ríos"];

export default function CotizacionesPage() {
  const [tab,          setTab]          = useState("todas");
  const [busqueda,     setBusqueda]     = useState("");
  const [filtroVend,   setFiltroVend]   = useState("Todos");
  const [filtroEst,    setFiltroEst]    = useState("Todos");

  const filtradas = COTIZACIONES.filter((c) => {
    const mb  = c.folio.includes(busqueda) || c.cliente.toLowerCase().includes(busqueda.toLowerCase());
    const mv  = filtroVend === "Todos" || c.vendedor === filtroVend;
    const me  = filtroEst  === "Todos" || c.estatus  === filtroEst;
    return mb && mv && me && TAB_FN[tab](c);
  });

  const cuentas = {
    abiertas:   COTIZACIONES.filter((c) => c.estatus === "Pendiente").length,
    por_vencer: COTIZACIONES.filter((c) => c.estatus === "Por vencer").length,
    cerradas:   COTIZACIONES.filter((c) => ["Cerrada","Expirada","Rechazada"].includes(c.estatus)).length,
  };

  const tabsConBadge = TABS.map((t) => ({
    ...t,
    badge: cuentas[t.key],
    badgeCls: t.key === "por_vencer" ? "bg-amber-100 text-amber-700"
            : t.key === "abiertas"   ? "bg-blue-100 text-blue-700"
            : undefined,
  }));

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#13193a]">Cotizaciones</h1>
        <p className="text-gray-400 text-sm mt-0.5">Seguimiento de cotizaciones pendientes y cerradas</p>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { l:"Abiertas",   v:cuentas.abiertas,   cls:"bg-blue-50  border-blue-200  text-blue-700"   },
          { l:"Por vencer", v:cuentas.por_vencer, cls:"bg-amber-50 border-amber-200 text-amber-700"  },
          { l:"Cerradas",   v:COTIZACIONES.filter(c=>c.estatus==="Cerrada").length,   cls:"bg-emerald-50 border-emerald-200 text-emerald-700" },
          { l:"Tasa cierre",v:`${Math.round((COTIZACIONES.filter(c=>c.estatus==="Cerrada").length / COTIZACIONES.length)*100)}%`, cls:"bg-indigo-50 border-indigo-200 text-indigo-700" },
        ].map((m) => (
          <div key={m.l} className={`${m.cls} border rounded-2xl p-4`}>
            <p className="text-2xl font-bold">{m.v}</p>
            <p className="text-xs font-semibold mt-0.5 opacity-80">{m.l}</p>
          </div>
        ))}
      </div>

      <TablaBase footer={<p className="text-xs text-gray-400">{filtradas.length} cotizaciones</p>}>
        <TablaTabs tabs={tabsConBadge} activeTab={tab} onTabChange={setTab} />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-5 py-4 border-b border-gray-100">
          <div className="lg:col-span-2"><Buscador value={busqueda} onChange={setBusqueda} placeholder="Folio o cliente..." /></div>
          <FiltroSelect value={filtroVend} onChange={setFiltroVend} opciones={VENDEDORES_F} />
          <FiltroSelect value={filtroEst}  onChange={setFiltroEst}  opciones={["Todos","Pendiente","Por vencer","Cerrada","Expirada","Rechazada"]} />
        </div>

        <TablaScroll>
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <Th>Folio</Th><Th>Cliente</Th><Th>Vendedor</Th><Th>Cobertura</Th>
              <Th>Prima</Th><Th>Fecha</Th><Th>Vence cot.</Th><Th>Notas</Th><Th>Estatus</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtradas.length === 0
              ? <FilaVacia cols={9} mensaje="No hay cotizaciones con esos filtros." />
              : filtradas.map((c, i) => (
                <tr key={i} className={`hover:bg-gray-50/60 transition-colors ${c.estatus === "Por vencer" ? "bg-amber-50/20" : ""}`}>
                  <Td className="font-mono text-xs font-bold text-[#13193a]">{c.folio}</Td>
                  <Td className="text-xs font-semibold text-gray-700 whitespace-nowrap">{c.cliente}</Td>
                  <Td className="text-xs text-gray-500 whitespace-nowrap">{c.vendedor}</Td>
                  <Td className="text-xs text-gray-600 max-w-36 truncate">{c.cobertura}</Td>
                  <Td className="text-xs font-bold text-emerald-700 tabular-nums">${c.prima.toFixed(2)}</Td>
                  <Td className="text-xs text-gray-400 whitespace-nowrap">{c.fecha}</Td>
                  <Td className={`text-xs font-semibold whitespace-nowrap ${c.estatus === "Por vencer" ? "text-amber-600" : "text-gray-400"}`}>{c.venceCot}</Td>
                  <Td className="text-xs text-gray-400 max-w-36 truncate">{c.notas ?? "—"}</Td>
                  <Td><Badge estatus={c.estatus} showDot /></Td>
                </tr>
              ))
            }
          </tbody>
        </TablaScroll>
      </TablaBase>
    </div>
  );
}
