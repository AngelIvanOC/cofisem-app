// ============================================================
// src/features/ventas/vendedores/VendedoresPage.jsx
// Ventas: Ranking y perfil detallado de vendedores
// ============================================================
import { useState } from "react";
import PerfilModal from "./PerfilModal";

const VENDEDORES = [
  {
    id:"V1", nombre:"Laura Rosher",  oficina:"COFISEM AV. E.ZAPATA", tel:"777-200-0001",
    meta:15, actual:14, prima:30800, tasaCierre:68, ticketProm:2200,
    topCoberturas:["TAXI BÁSICA 2500","SERV. PÚB. 50/50","COB. APP"],
    historial:[
      { polizas:14, prima:30800 },{ polizas:16, prima:35200 },{ polizas:13, prima:28600 },
      { polizas:15, prima:33000 },{ polizas:12, prima:26400 },{ polizas:17, prima:37400 },
    ],
  },
  {
    id:"V2", nombre:"Marco A. Cruz", oficina:"OFICINA CIVAC",        tel:"777-200-0002",
    meta:15, actual:11, prima:24200, tasaCierre:55, ticketProm:2200,
    topCoberturas:["TAXI BÁSICA 2500","TAXI PAGOS 2700"],
    historial:[
      { polizas:11, prima:24200 },{ polizas:13, prima:28600 },{ polizas:14, prima:30800 },
      { polizas:10, prima:22000 },{ polizas:15, prima:33000 },{ polizas:12, prima:26400 },
    ],
  },
  {
    id:"V3", nombre:"Carlos Soto",   oficina:"COFISEM TEMIXCO",      tel:"777-200-0003",
    meta:15, actual:6,  prima:13600, tasaCierre:38, ticketProm:2267,
    topCoberturas:["TAXI BÁSICA 2500"],
    historial:[
      { polizas:6,  prima:13600 },{ polizas:9,  prima:19800 },{ polizas:11, prima:24200 },
      { polizas:7,  prima:15400 },{ polizas:10, prima:22000 },{ polizas:8,  prima:17600 },
    ],
  },
  {
    id:"V4", nombre:"Diana Ríos",    oficina:"COFISEM CUAUTLA",      tel:"777-200-0004",
    meta:15, actual:16, prima:35400, tasaCierre:78, ticketProm:2213,
    topCoberturas:["TAXI BÁSICA 2500","SERV. PÚB. 50/50","GAMAN 2","COB. APP"],
    historial:[
      { polizas:16, prima:35400 },{ polizas:18, prima:39600 },{ polizas:15, prima:33000 },
      { polizas:17, prima:37400 },{ polizas:14, prima:30800 },{ polizas:19, prima:41800 },
    ],
  },
];

const MEDALLA = ["🥇","🥈","🥉","4°"];

const pctColor = (p) => p >= 100 ? "text-emerald-600" : p >= 70 ? "text-blue-600" : p >= 40 ? "text-amber-600" : "text-red-500";
const barColor = (p) => p >= 100 ? "bg-emerald-400" : p >= 70 ? "bg-blue-400" : p >= 40 ? "bg-amber-400" : "bg-red-400";

export default function VendedoresPage() {
  const [seleccionado, setSeleccionado] = useState(null);

  const sorted = [...VENDEDORES].sort((a, b) => b.actual - a.actual);

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#13193a]">Vendedores</h1>
        <p className="text-gray-400 text-sm mt-0.5">Ranking y perfil de rendimiento</p>
      </div>

      {/* Tarjetas de ranking */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {sorted.map((v, i) => {
          const pct = Math.round((v.actual / v.meta) * 100);
          return (
            <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#13193a] text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {v.nombre.split(" ").map(w=>w[0]).join("").slice(0,2)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#13193a] leading-tight">{v.nombre}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{v.oficina.replace("COFISEM ","").replace("OFICINA ","")}</p>
                    </div>
                  </div>
                  <span className="text-xl">{MEDALLA[i]}</span>
                </div>

                {/* Barra progreso */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-gray-400 font-semibold">{v.actual} / {v.meta} pólizas</span>
                    <span className={`font-bold ${pctColor(pct)}`}>{pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${barColor(pct)}`} style={{ width:`${Math.min(pct,100)}%` }} />
                  </div>
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-3 divide-x divide-gray-50">
                {[
                  { l:"Prima",     v:`$${Math.round(v.prima/1000)}k`  },
                  { l:"Cierre",    v:`${v.tasaCierre}%`               },
                  { l:"Ticket",    v:`$${(v.ticketProm/1000).toFixed(1)}k` },
                ].map((m) => (
                  <div key={m.l} className="text-center py-3">
                    <p className="text-sm font-bold text-[#13193a]">{m.v}</p>
                    <p className="text-[10px] text-gray-400 font-semibold">{m.l}</p>
                  </div>
                ))}
              </div>

              <div className="px-4 pb-4 pt-3">
                <button onClick={() => setSeleccionado(v)}
                  className="w-full py-2 rounded-xl border border-[#13193a]/20 text-xs font-bold text-[#13193a] hover:bg-[#13193a]/5 transition-all">
                  Ver perfil completo
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabla comparativa */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-bold text-[#13193a]">Tabla comparativa</p>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {["Pos.","Vendedor","Oficina","Pólizas","Meta","%","Prima","Tasa cierre","Ticket prom.",""].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((v, i) => {
                const pct = Math.round((v.actual / v.meta) * 100);
                return (
                  <tr key={v.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 text-lg text-center">{MEDALLA[i]}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-[#13193a]">{v.nombre}</p>
                      <p className="text-[11px] text-gray-400">{v.tel}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-28 truncate">{v.oficina}</td>
                    <td className="px-4 py-3 text-sm font-bold text-[#13193a] tabular-nums">{v.actual}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 tabular-nums">{v.meta}</td>
                    <td className="px-4 py-3"><span className={`text-sm font-bold tabular-nums ${pctColor(pct)}`}>{pct}%</span></td>
                    <td className="px-4 py-3 text-xs font-bold text-emerald-700 tabular-nums">${v.prima.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-[#13193a]">{v.tasaCierre}%</td>
                    <td className="px-4 py-3 text-xs text-gray-600 tabular-nums">${v.ticketProm.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSeleccionado(v)} className="text-xs font-bold text-[#13193a] border border-[#13193a]/20 px-2.5 py-1.5 rounded-xl hover:bg-[#13193a]/5 transition-all">
                        Perfil
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {seleccionado && <PerfilModal vendedor={seleccionado} onClose={() => setSeleccionado(null)} />}
    </div>
  );
}
