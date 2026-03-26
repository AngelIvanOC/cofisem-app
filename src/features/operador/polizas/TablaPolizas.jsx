// ============================================================
// src/features/operador/polizas/TablaPolizas.jsx
// Tabla de pólizas emitidas con filtros y acciones de fila
// ============================================================
import { useState } from "react";
import Badge from "../../../shared/ui/Badge";
import Buscador, { FiltroSelect } from "../../../shared/ui/Buscador";
import { TablaBase, TablaScroll, Th, Td, FilaVacia } from "../../../shared/ui/TablaBase";
import { POLIZAS_MOCK } from "../../../shared/constants/mockData";

export function TablaPolizas({ onDetalle, onRenovar }) {
  const [busqueda,      setBusqueda]      = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("Todos");

  const filtradas = POLIZAS_MOCK.filter((p) => {
    const mb = p.asegurado.toLowerCase().includes(busqueda.toLowerCase()) || p.id.includes(busqueda);
    const me = filtroEstatus === "Todos" || p.estatus === filtroEstatus;
    return mb && me;
  });

  return (
    <TablaBase footer={<p className="text-xs text-gray-400">{filtradas.length} pólizas</p>}>
      <div className="flex flex-wrap items-center gap-2 px-5 py-4 border-b border-gray-100">
        <Buscador value={busqueda} onChange={setBusqueda} placeholder="Buscar póliza o asegurado..." className="w-56" />
        <FiltroSelect
          value={filtroEstatus}
          onChange={setFiltroEstatus}
          opciones={["Todos", "Vigente", "Por vencer", "Vencida", "Cancelada"]}
        />
      </div>
      <TablaScroll>
        <thead>
          <tr className="bg-gray-50/80 border-b border-gray-100">
            <Th>Póliza</Th><Th>Asegurado</Th><Th>Cobertura</Th>
            <Th>Vendedor</Th><Th>Prima</Th><Th>Forma pago</Th>
            <Th>Vence</Th><Th>Estatus</Th><Th></Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {filtradas.length === 0 ? (
            <FilaVacia cols={9} mensaje="No se encontraron pólizas." />
          ) : (
            filtradas.map((p, i) => (
              <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                <Td className="font-mono text-xs font-bold text-[#13193a]">{p.id}</Td>
                <Td className="text-xs font-semibold text-gray-700 whitespace-nowrap">{p.asegurado}</Td>
                <Td className="text-xs text-gray-500 max-w-xs truncate">{p.cobertura}</Td>
                <Td className="text-xs text-gray-500">{p.vendedor}</Td>
                <Td className="text-xs font-bold text-emerald-700">${p.prima.toFixed(2)}</Td>
                <Td className="text-xs text-gray-500">{p.forma}</Td>
                <Td className="text-xs text-gray-500 whitespace-nowrap">{p.vence}</Td>
                <Td><Badge estatus={p.estatus} /></Td>
                <Td>
                  <div className="flex gap-1">
                    <button onClick={() => onDetalle?.(p)} title="Ver detalle" className="w-7 h-7 rounded-lg text-gray-300 hover:text-[#13193a] hover:bg-gray-100 flex items-center justify-center transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.641 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    </button>
                    {p.estatus === "Por vencer" && (
                      <button onClick={() => onRenovar?.(p)} title="Renovar" className="w-7 h-7 rounded-lg text-amber-400 hover:text-amber-600 hover:bg-amber-50 flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>
                      </button>
                    )}
                  </div>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </TablaScroll>
    </TablaBase>
  );
}

// ============================================================
// TablaCotizaciones — cotizaciones guardadas pendientes de tramitar
// ============================================================
export function TablaCotizaciones({ cotizaciones, onTramitar }) {
  return (
    <TablaBase footer={<p className="text-xs text-gray-400">{cotizaciones.length} cotizaciones guardadas</p>}>
      <TablaScroll>
        <thead>
          <tr className="bg-gray-50/80 border-b border-gray-100">
            <Th>No. Cotización</Th><Th>Cliente</Th><Th>Cobertura</Th>
            <Th>Vendedor</Th><Th>Total</Th><Th>Fecha</Th><Th></Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {cotizaciones.length === 0 ? (
            <FilaVacia cols={7} mensaje="No hay cotizaciones guardadas." />
          ) : (
            cotizaciones.map((c, i) => (
              <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                <Td className="font-mono text-xs font-bold text-[#13193a]">{c.id}</Td>
                <Td className="text-xs font-semibold text-gray-700">{c.cliente}</Td>
                <Td className="text-xs text-gray-500 max-w-xs truncate">{c.cobertura}</Td>
                <Td className="text-xs text-gray-500">{c.vendedor}</Td>
                <Td className="text-xs font-bold text-emerald-700">${c.total.toFixed(2)}</Td>
                <Td className="text-xs text-gray-400">{c.fecha}</Td>
                <Td>
                  <button
                    onClick={() => onTramitar(c)}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#13193a] border border-[#13193a]/20 px-3 py-1.5 rounded-xl hover:bg-[#13193a]/5 transition-all whitespace-nowrap"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Tramitar
                  </button>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </TablaScroll>
    </TablaBase>
  );
}
