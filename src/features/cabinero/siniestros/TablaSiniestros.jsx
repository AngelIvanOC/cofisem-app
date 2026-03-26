import Buscador, { FiltroSelect } from "../../../shared/ui/Buscador";
import { TablaBase, TablaScroll, Th, Td, FilaVacia } from "../../../shared/ui/TablaBase";

const STATUS_CLS = {
  Completado:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  Pendiente:     "bg-amber-50   text-amber-700   border-amber-200",
  Activo:        "bg-blue-50    text-blue-700    border-blue-200",
  Asignado:      "bg-purple-50  text-purple-700  border-purple-200",
  "Sin asignar": "bg-red-50     text-red-600     border-red-200",
};

export default function TablaSiniestros({ siniestros, busqueda, onBusqueda, filtroEstatus, onFiltroEstatus, onDetalle, total }) {
  const sinAsignar = siniestros.filter((s) => !s.ajustador).length;
  return (
    <TablaBase footer={
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">Mostrando <strong>{siniestros.length}</strong> de <strong>{total}</strong></p>
        {sinAsignar > 0 && <p className="text-xs text-red-500 font-semibold flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>{sinAsignar} sin ajustador</p>}
      </div>
    }>
      <div className="flex flex-wrap items-center gap-2 px-5 py-4 border-b border-gray-100">
        <FiltroSelect value={filtroEstatus} onChange={onFiltroEstatus} opciones={["Todos","Completado","Pendiente","Activo","Asignado","Sin asignar"]}/>
        <div className="ml-auto"><Buscador value={busqueda} onChange={onBusqueda} placeholder="Buscar folio o asegurado..."/></div>
      </div>
      <TablaScroll>
        <thead><tr className="bg-gray-50/80 border-b border-gray-100">
          <Th>Folio</Th><Th>Asegurado</Th><Th>Vehículo</Th><Th>Fecha</Th><Th>Ubicación</Th><Th>Ajustador</Th><Th>Estatus</Th><Th></Th>
        </tr></thead>
        <tbody className="divide-y divide-gray-50">
          {siniestros.length === 0 ? <FilaVacia cols={8} mensaje="No se encontraron siniestros."/> :
          siniestros.map((s, i) => (
            <tr key={i} onClick={() => onDetalle(s)} className={`hover:bg-gray-50/60 transition-colors cursor-pointer ${!s.ajustador ? "bg-red-50/20" : ""}`}>
              <Td className="font-mono text-xs font-bold text-[#13193a]">{s.folio}</Td>
              <Td className="text-xs font-medium text-gray-700 whitespace-nowrap">{s.asegurado}</Td>
              <Td className="text-xs text-gray-500">{s.vehiculo}</Td>
              <Td className="text-xs text-gray-500 whitespace-nowrap">{s.fecha}</Td>
              <Td className="text-xs text-gray-500">{s.ubicacion}</Td>
              <Td className="text-xs">
                {s.ajustador ? <span className="font-medium text-gray-700">{s.ajustador}</span> :
                <span className="inline-flex items-center gap-1.5 text-red-600 font-bold"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0"/>Sin asignar</span>}
              </Td>
              <Td><span className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_CLS[s.estatus] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>{s.estatus}</span></Td>
              <Td>
                <button onClick={(e) => { e.stopPropagation(); onDetalle(s); }} className="w-7 h-7 rounded-lg text-gray-300 hover:text-[#13193a] hover:bg-gray-100 flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.641 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </button>
              </Td>
            </tr>
          ))}
        </tbody>
      </TablaScroll>
    </TablaBase>
  );
}
