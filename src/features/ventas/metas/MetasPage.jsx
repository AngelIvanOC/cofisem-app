// ============================================================
// src/features/ventas/metas/MetasPage.jsx
// Metas con termómetros por vendedor + barras de avance + historial
// ============================================================
import { useState } from "react";
import Termometro from "./Termometro";
import BarraAvance from "./BarraAvance";
import MiniHistorial from "./MiniHistorial";
import { FiltroSelect } from "../../../shared/ui/Buscador";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const VENDEDORES = [
  {
    id:"V1", nombre:"Laura Rosher",  oficina:"E. Zapata", meta:15, actual:14, prima:30800, primaMeta:33000,
    historial:[
      { mes:9, polizas:14, prima:30800, meta:15 },{ mes:8, polizas:16, prima:35200, meta:15 },
      { mes:7, polizas:13, prima:28600, meta:15 },{ mes:6, polizas:15, prima:33000, meta:15 },
      { mes:5, polizas:12, prima:26400, meta:15 },{ mes:4, polizas:17, prima:37400, meta:15 },
    ],
  },
  {
    id:"V2", nombre:"Marco A. Cruz", oficina:"CIVAC",    meta:15, actual:11, prima:24200, primaMeta:33000,
    historial:[
      { mes:9, polizas:11, prima:24200, meta:15 },{ mes:8, polizas:13, prima:28600, meta:15 },
      { mes:7, polizas:14, prima:30800, meta:15 },{ mes:6, polizas:10, prima:22000, meta:15 },
      { mes:5, polizas:15, prima:33000, meta:15 },{ mes:4, polizas:12, prima:26400, meta:15 },
    ],
  },
  {
    id:"V3", nombre:"Carlos Soto",   oficina:"Temixco",  meta:15, actual:6, prima:13600, primaMeta:33000,
    historial:[
      { mes:9, polizas:6,  prima:13600, meta:15 },{ mes:8, polizas:9,  prima:19800, meta:15 },
      { mes:7, polizas:11, prima:24200, meta:15 },{ mes:6, polizas:7,  prima:15400, meta:15 },
      { mes:5, polizas:10, prima:22000, meta:15 },{ mes:4, polizas:8,  prima:17600, meta:15 },
    ],
  },
  {
    id:"V4", nombre:"Diana Ríos",    oficina:"Cuautla",  meta:15, actual:16, prima:35400, primaMeta:33000,
    historial:[
      { mes:9, polizas:16, prima:35400, meta:15 },{ mes:8, polizas:18, prima:39600, meta:15 },
      { mes:7, polizas:15, prima:33000, meta:15 },{ mes:6, polizas:17, prima:37400, meta:15 },
      { mes:5, polizas:14, prima:30800, meta:15 },{ mes:4, polizas:19, prima:41800, meta:15 },
    ],
  },
];

const TOTAL_META   = VENDEDORES.reduce((s, v) => s + v.meta, 0);
const TOTAL_ACTUAL = VENDEDORES.reduce((s, v) => s + v.actual, 0);
const TOTAL_PRIMA  = VENDEDORES.reduce((s, v) => s + v.prima, 0);

export default function MetasPage() {
  const [mesIdx,   setMesIdx]   = useState(2);
  const [vistaIdx, setVistaIdx] = useState(0); // 0=termómetros, 1=barras
  const [vendSel,  setVendSel]  = useState(null);

  const VISTAS = ["Termómetros","Barras de avance"];

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Metas</h1>
          <p className="text-gray-400 text-sm mt-0.5">Avance mensual por vendedor</p>
        </div>
        <div className="flex gap-2.5 items-center">
          <FiltroSelect value={MESES[mesIdx]} onChange={(v) => setMesIdx(MESES.indexOf(v))} opciones={MESES} />
          <div className="flex bg-gray-100/80 rounded-xl p-1 gap-1">
            {VISTAS.map((v, i) => (
              <button key={v} onClick={() => setVistaIdx(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${vistaIdx === i ? "bg-white text-[#13193a] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resumen global */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { l:"Total equipo",  v:`${TOTAL_ACTUAL}/${TOTAL_META}`, sub:`${Math.round((TOTAL_ACTUAL/TOTAL_META)*100)}% de la meta global`, c:"blue"    },
          { l:"Prima total",   v:`$${TOTAL_PRIMA.toLocaleString()}`, sub:`Meta: $${(TOTAL_META * 2200).toLocaleString()}`,              c:"emerald" },
          { l:"Días restantes",v:"11",                             sub:"Para fin de mes",                                              c:"amber"   },
        ].map((m) => {
          const cls = { blue:"bg-blue-50 border-blue-200 text-blue-700", emerald:"bg-emerald-50 border-emerald-200 text-emerald-700", amber:"bg-amber-50 border-amber-200 text-amber-700" };
          return (
            <div key={m.l} className={`${cls[m.c]} border rounded-2xl p-4`}>
              <p className="text-2xl font-bold tabular-nums">{m.v}</p>
              <p className="text-xs font-semibold mt-0.5 opacity-80">{m.l}</p>
              <p className="text-[10px] mt-0.5 opacity-60">{m.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Vista termómetros */}
      {vistaIdx === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm font-bold text-[#13193a] mb-6">Avance · {MESES[mesIdx]}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 justify-items-center">
            {VENDEDORES.map((v) => (
              <button key={v.id} onClick={() => setVendSel(vendSel?.id === v.id ? null : v)} className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity">
                <Termometro actual={v.actual} meta={v.meta} label={v.nombre.split(" ")[0]} />
                <p className="text-[11px] text-gray-400">{v.oficina}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Vista barras */}
      {vistaIdx === 1 && (
        <div className="space-y-3">
          {VENDEDORES.map((v) => (
            <BarraAvance
              key={v.id}
              vendedor={`${v.nombre} · ${v.oficina}`}
              actual={v.actual}
              meta={v.meta}
              primaActual={v.prima}
              primaMeta={v.primaMeta}
            />
          ))}
        </div>
      )}

      {/* Historial del vendedor seleccionado */}
      {vendSel && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-[#13193a]">Historial de {vendSel.nombre}</p>
            <button onClick={() => setVendSel(null)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Cerrar ×</button>
          </div>
          <MiniHistorial datos={vendSel.historial} />
        </div>
      )}
    </div>
  );
}
