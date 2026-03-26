// ============================================================
// src/features/operador/vendedores/TablaVendedores.jsx
// Tabla de vendedores con toggle de activo/inactivo y edición
// ============================================================
import Buscador from "../../../shared/ui/Buscador";
import { TablaBase, TablaScroll, Th, Td, FilaVacia } from "../../../shared/ui/TablaBase";

export default function TablaVendedores({ vendedores, busqueda, onBusqueda, onEditar, onToggle }) {
  const filtrados = vendedores.filter(
    (v) =>
      v.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.folio.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <TablaBase footer={<p className="text-xs text-gray-400">{filtrados.length} vendedores en esta oficina</p>}>
      <div className="px-5 py-4 border-b border-gray-100">
        <Buscador value={busqueda} onChange={onBusqueda} placeholder="Buscar por nombre o folio..." className="max-w-sm" />
      </div>
      <TablaScroll>
        <thead>
          <tr className="bg-gray-50/80 border-b border-gray-100">
            <Th>Folio</Th><Th>Nombre</Th><Th>Teléfono</Th>
            <Th>Email</Th><Th>Pólizas mes</Th><Th>Estatus</Th><Th></Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {filtrados.length === 0 ? (
            <FilaVacia cols={7} mensaje="No se encontraron vendedores." />
          ) : (
            filtrados.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50/60 transition-colors">
                <Td className="font-mono text-xs font-bold text-[#13193a]">{v.folio}</Td>
                <Td className="text-sm font-semibold text-[#13193a]">{v.nombre}</Td>
                <Td className="text-xs text-gray-600">{v.telefono}</Td>
                <Td className="text-xs text-gray-500">{v.email}</Td>
                <Td>
                  <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                    v.polizasMes > 0 ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-100 text-gray-500 border-gray-200"
                  }`}>
                    {v.polizasMes} pólizas
                  </span>
                </Td>
                <Td>
                  <button
                    onClick={() => onToggle(v.id)}
                    className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer transition-all ${
                      v.activo
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
                    }`}
                  >
                    {v.activo ? "Activo" : "Inactivo"}
                  </button>
                </Td>
                <Td>
                  <button
                    onClick={() => onEditar(v)}
                    className="w-7 h-7 rounded-lg text-gray-300 hover:text-[#13193a] hover:bg-gray-100 flex items-center justify-center transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
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
