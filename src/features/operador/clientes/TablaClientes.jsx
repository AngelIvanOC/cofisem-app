// ============================================================
// src/features/operador/clientes/TablaClientes.jsx
// Tabla de clientes con búsqueda y botón de edición
// ============================================================
import Buscador from "../../../shared/ui/Buscador";
import { TablaBase, TablaScroll, Th, Td, FilaVacia } from "../../../shared/ui/TablaBase";

export default function TablaClientes({ clientes, busqueda, onBusqueda, onEditar }) {
  const filtrados = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.rfc.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.telefono.includes(busqueda)
  );

  return (
    <TablaBase footer={<p className="text-xs text-gray-400">{filtrados.length} asegurados registrados</p>}>
      {/* Buscador */}
      <div className="px-5 py-4 border-b border-gray-100">
        <Buscador
          value={busqueda}
          onChange={onBusqueda}
          placeholder="Buscar por nombre, RFC o teléfono..."
          className="max-w-sm"
        />
      </div>

      {/* Tabla */}
      <TablaScroll>
        <thead>
          <tr className="bg-gray-50/80 border-b border-gray-100">
            <Th>Nombre</Th>
            <Th>RFC</Th>
            <Th>Teléfono</Th>
            <Th>Email</Th>
            <Th>Pólizas</Th>
            <Th>Estatus</Th>
            <Th></Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {filtrados.length === 0 ? (
            <FilaVacia cols={7} mensaje="No se encontraron clientes." />
          ) : (
            filtrados.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                <Td className="text-sm font-semibold text-[#13193a]">{c.nombre}</Td>
                <Td className="font-mono text-xs text-gray-600">{c.rfc}</Td>
                <Td className="text-xs text-gray-600">{c.telefono}</Td>
                <Td className="text-xs text-gray-500">{c.email}</Td>
                <Td>
                  <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                    c.polizas > 0 ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-100 text-gray-500 border-gray-200"
                  }`}>
                    {c.polizas} {c.polizas === 1 ? "póliza" : "pólizas"}
                  </span>
                </Td>
                <Td>
                  <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                    c.activo ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"
                  }`}>
                    {c.activo ? "Activo" : "Inactivo"}
                  </span>
                </Td>
                <Td>
                  <button
                    onClick={() => onEditar(c)}
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
