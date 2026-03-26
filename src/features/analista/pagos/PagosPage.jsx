// ============================================================
// src/features/analista/pagos/PagosPage.jsx
// Analista: consultar y aplicar pagos de pólizas — todas oficinas
// ============================================================
import { useState } from "react";
import Buscador, { FiltroSelect } from "../../../shared/ui/Buscador";
import { TablaBase, TablaScroll, Th, Td, FilaVacia } from "../../../shared/ui/TablaBase";
import { OFICINAS_CON_TODAS } from "../../../shared/constants/oficinas";
import ModalHistorial from "./ModalHistorial";

const POLIZAS_PAGOS = [
  {
    id: "3413167", asegurado: "Roberto Díaz Ramos",  aseguradora: "GNP",      cobertura: "SERV. PÚB. 50/50 GAMAN 2",  oficina: "COFISEM AV. E.ZAPATA", vendedor: "Laura Rosher",    formaPago: "4 Parciales", primaPrimerPago: 637.00,
    cuotas: [
      { num: 1, vto: "11/03/2026", monto: 637.00, pagado: true,  fechaPago: "11/03/2026", forma: "Efectivo",      referencia: "REC-001" },
      { num: 2, vto: "11/04/2026", monto: 637.00, pagado: false, fechaPago: null,          forma: null,            referencia: null      },
      { num: 3, vto: "11/05/2026", monto: 637.00, pagado: false, fechaPago: null,          forma: null,            referencia: null      },
      { num: 4, vto: "11/06/2026", monto: 637.00, pagado: false, fechaPago: null,          forma: null,            referencia: null      },
    ],
  },
  {
    id: "3410888", asegurado: "José Martínez Ruiz",   aseguradora: "AXA",     cobertura: "TAXI BÁSICA PAGOS 2700",     oficina: "OFICINA CIVAC",        vendedor: "Marco A. Cruz",  formaPago: "4 Parciales", primaPrimerPago: 580.00,
    cuotas: [
      { num: 1, vto: "22/03/2025", monto: 580.00, pagado: true,  fechaPago: "22/03/2025", forma: "Efectivo",      referencia: "REC-008"  },
      { num: 2, vto: "22/06/2025", monto: 580.00, pagado: true,  fechaPago: "20/06/2025", forma: "Transferencia", referencia: "TRF-0421" },
      { num: 3, vto: "22/09/2025", monto: 580.00, pagado: true,  fechaPago: "19/09/2025", forma: "Efectivo",      referencia: "REC-031"  },
      { num: 4, vto: "22/12/2025", monto: 580.00, pagado: false, fechaPago: null,          forma: null,            referencia: null       },
    ],
  },
  {
    id: "3413241", asegurado: "Angel Ivan Ortega",    aseguradora: "QUALITAS", cobertura: "COBERTURA APP (UBER, DIDI)", oficina: "OFICINA CIVAC",        vendedor: "Laura Rosher",   formaPago: "Trimestral",  primaPrimerPago: 785.70,
    cuotas: [
      { num: 1, vto: "13/03/2026", monto: 785.70, pagado: true,  fechaPago: "13/03/2026", forma: "Efectivo", referencia: "REC-042" },
      { num: 2, vto: "13/06/2026", monto: 785.70, pagado: false, fechaPago: null,          forma: null,       referencia: null      },
      { num: 3, vto: "13/09/2026", monto: 785.70, pagado: false, fechaPago: null,          forma: null,       referencia: null      },
      { num: 4, vto: "13/12/2026", monto: 785.70, pagado: false, fechaPago: null,          forma: null,       referencia: null      },
    ],
  },
  {
    id: "3408500", asegurado: "Ana Gutiérrez Pérez",  aseguradora: "HDI",     cobertura: "COBERTURA APP (UBER, DIDI)", oficina: "COFISEM CUAUTLA",      vendedor: "Patricia Morales",formaPago: "Trimestral",  primaPrimerPago: 785.70,
    cuotas: [
      { num: 1, vto: "10/01/2025", monto: 785.70, pagado: true,  fechaPago: "10/01/2025", forma: "Efectivo",      referencia: "REC-009"  },
      { num: 2, vto: "10/04/2025", monto: 785.70, pagado: true,  fechaPago: "08/04/2025", forma: "Efectivo",      referencia: "REC-021"  },
      { num: 3, vto: "10/07/2025", monto: 785.70, pagado: true,  fechaPago: "10/07/2025", forma: "Transferencia", referencia: "TRF-0198" },
      { num: 4, vto: "10/10/2025", monto: 785.70, pagado: false, fechaPago: null,          forma: null,            referencia: null       },
    ],
  },
];

export default function PagosPage() {
  const [polizas,        setPolizas]        = useState(POLIZAS_PAGOS);
  const [busqueda,       setBusqueda]       = useState("");
  const [filtroOficina,  setFiltroOficina]  = useState("Todas");
  const [filtroEstado,   setFiltroEstado]   = useState("Todos");
  const [polizaSel,      setPolizaSel]      = useState(null);
  const hoy = new Date();

  const aplicarPago = ({ polizaId, cuotaNum, fecha, forma, referencia }) => {
    setPolizas((ps) => ps.map((p) => {
      if (p.id !== polizaId) return p;
      return { ...p, cuotas: p.cuotas.map((c) => c.num === cuotaNum ? { ...c, pagado: true, fechaPago: fecha, forma, referencia: referencia || `REC-${Date.now().toString().slice(-4)}` } : c) };
    }));
    setPolizaSel((prev) => {
      if (!prev || prev.id !== polizaId) return prev;
      return { ...prev, cuotas: prev.cuotas.map((c) => c.num === cuotaNum ? { ...c, pagado: true, fechaPago: fecha, forma, referencia } : c) };
    });
  };

  const filtradas = polizas.filter((p) => {
    const mb = p.id.includes(busqueda) || p.asegurado.toLowerCase().includes(busqueda.toLowerCase());
    const mo = filtroOficina === "Todas" || p.oficina === filtroOficina;
    const pend = p.cuotas.filter((c) => !c.pagado).length;
    const me = filtroEstado === "Todos" || (filtroEstado === "Con pendientes" && pend > 0) || (filtroEstado === "Al corriente" && pend === 0);
    return mb && mo && me;
  });

  // Métricas
  const totalCobrado  = polizas.flatMap((p) => p.cuotas.filter((c) => c.pagado)).reduce((s, c) => s + c.monto, 0);
  const totalPend     = polizas.flatMap((p) => p.cuotas.filter((c) => !c.pagado)).reduce((s, c) => s + c.monto, 0);
  const cuotasPend    = polizas.flatMap((p) => p.cuotas.filter((c) => !c.pagado)).length;
  const cuotasVenc    = polizas.flatMap((p) => p.cuotas.filter((c) => !c.pagado && new Date(c.vto.split("/").reverse().join("-")) < hoy)).length;

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#13193a]">Pagos</h1>
        <p className="text-gray-400 text-sm mt-0.5">Consulta y aplicación de pagos — todas las oficinas</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total cobrado",     value: `$${totalCobrado.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`, accent: "emerald" },
          { label: "Por cobrar",        value: `$${totalPend.toLocaleString("es-MX",    { minimumFractionDigits: 2 })}`, accent: "amber"   },
          { label: "Cuotas pendientes", value: cuotasPend,  accent: "blue" },
          { label: "Cuotas vencidas",   value: cuotasVenc,  accent: "red"  },
        ].map((m) => {
          const c = { emerald: "bg-emerald-50 text-emerald-700 border-emerald-100", amber: "bg-amber-50 text-amber-700 border-amber-100", blue: "bg-blue-50 text-blue-700 border-blue-100", red: "bg-red-50 text-red-600 border-red-100" };
          return (
            <div key={m.label} className={`${c[m.accent]} border rounded-2xl p-4`}>
              <p className="text-xl font-bold tabular-nums">{m.value}</p>
              <p className="text-xs font-semibold mt-0.5 opacity-80">{m.label}</p>
            </div>
          );
        })}
      </div>

      {/* Tabla */}
      <TablaBase footer={<p className="text-xs text-gray-400">{filtradas.length} pólizas</p>}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-5 py-4 border-b border-gray-100">
          <div className="lg:col-span-1">
            <Buscador value={busqueda} onChange={setBusqueda} placeholder="Póliza o asegurado..." />
          </div>
          <FiltroSelect value={filtroOficina} onChange={setFiltroOficina} opciones={OFICINAS_CON_TODAS} />
          <FiltroSelect value={filtroEstado}  onChange={setFiltroEstado}  opciones={["Todos", "Con pendientes", "Al corriente"]} />
        </div>
        <TablaScroll>
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <Th>Póliza</Th><Th>Asegurado</Th><Th>Oficina</Th><Th>Cobertura</Th>
              <Th>Forma pago</Th><Th>Cuotas</Th><Th>Cobrado</Th><Th>Por cobrar</Th><Th></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtradas.length === 0 ? (
              <FilaVacia cols={9} mensaje="No se encontraron pólizas." />
            ) : filtradas.map((p, i) => {
              const pagadas   = p.cuotas.filter((c) => c.pagado).length;
              const pend      = p.cuotas.filter((c) => !c.pagado).length;
              const cobrado   = p.cuotas.filter((c) => c.pagado).reduce((s, c) => s + c.monto, 0);
              const porCobrar = p.cuotas.filter((c) => !c.pagado).reduce((s, c) => s + c.monto, 0);
              const hayVenc   = p.cuotas.some((c) => !c.pagado && new Date(c.vto.split("/").reverse().join("-")) < hoy);
              return (
                <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                  <Td className="font-mono text-xs font-bold text-[#13193a]">{p.id}</Td>
                  <Td className="text-xs font-semibold text-gray-700 whitespace-nowrap">{p.asegurado}</Td>
                  <Td className="text-xs text-gray-500 max-w-28 truncate">{p.oficina}</Td>
                  <Td className="text-xs text-gray-500 max-w-36 truncate">{p.cobertura}</Td>
                  <Td className="text-xs text-gray-500">{p.formaPago}</Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-0.5">
                        {p.cuotas.map((c) => (
                          <div key={c.num} className={`w-2.5 h-2.5 rounded-full ${c.pagado ? "bg-emerald-500" : hayVenc ? "bg-red-400" : "bg-gray-200"}`} />
                        ))}
                      </div>
                      <span className="text-[11px] text-gray-500">{pagadas}/{p.cuotas.length}</span>
                    </div>
                  </Td>
                  <Td className="text-xs font-bold text-emerald-700">${cobrado.toFixed(2)}</Td>
                  <Td>
                    {porCobrar > 0
                      ? <span className={`text-xs font-bold ${hayVenc ? "text-red-600" : "text-amber-700"}`}>${porCobrar.toFixed(2)}</span>
                      : <span className="text-xs text-emerald-600 font-semibold">Al corriente</span>
                    }
                  </Td>
                  <Td>
                    <button onClick={() => setPolizaSel(p)} className="flex items-center gap-1.5 text-xs font-bold text-[#13193a] border border-[#13193a]/20 px-3 py-1.5 rounded-xl hover:bg-[#13193a]/5 transition-all whitespace-nowrap">
                      Ver cuotas
                    </button>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </TablaScroll>
      </TablaBase>

      {polizaSel && (
        <ModalHistorial poliza={polizaSel} onClose={() => setPolizaSel(null)} onAplicar={aplicarPago} />
      )}
    </div>
  );
}
