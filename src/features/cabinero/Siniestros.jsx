import { useState } from "react";
import { SINIESTROS_INIT } from "./data/siniestrosMock";
import { STATUS_CLS } from "./constants/estilos";
import ModalDetalle from "./components/ModalDetalle";

export default function Siniestros() {
  const [siniestros, setSiniestros] = useState(SINIESTROS_INIT);
  const [filtroEstatus, setFiltroEstatus] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [modalSiniestro, setModalSiniestro] = useState(null);

  const sinAsignar = siniestros.filter((s) => !s.ajustador).length;

  const filtrados = siniestros.filter((s) => {
    const mb =
      busqueda === "" ||
      s.folio.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.asegurado.toLowerCase().includes(busqueda.toLowerCase());
    const me = filtroEstatus === "Todos" || s.estatus === filtroEstatus;
    return mb && me;
  });

  const asignar = (folio, nombreAjustador) => {
    setSiniestros((prev) =>
      prev.map((s) =>
        s.folio === folio
          ? { ...s, ajustador: nombreAjustador, estatus: "Asignado" }
          : s,
      ),
    );
    setModalSiniestro((prev) =>
      prev?.folio === folio
        ? { ...prev, ajustador: nombreAjustador, estatus: "Asignado" }
        : prev,
    );
  };

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Siniestros</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Consulta, seguimiento y asignación de ajustadores
          </p>
        </div>
        {sinAsignar > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <p className="text-xs font-bold text-red-700">
              {sinAsignar} {sinAsignar === 1 ? "siniestro" : "siniestros"} sin
              ajustador
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-5 py-4 border-b border-gray-100">
          <select
            value={filtroEstatus}
            onChange={(e) => setFiltroEstatus(e.target.value)}
            className="text-xs border border-gray-200 rounded-xl px-3 py-2 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#13193a]/15"
          >
            <option>Todos</option>
            <option>Completado</option>
            <option>Pendiente</option>
            <option>Cancelado</option>
            <option>Activo</option>
            <option>Asignado</option>
          </select>
          <div className="relative ml-auto">
            <svg
              className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar folio o asegurado..."
              className="text-xs border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-gray-600 w-52 bg-white focus:outline-none focus:ring-2 focus:ring-[#13193a]/15"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {[
                  "Folio",
                  "Asegurado",
                  "Vehículo",
                  "Fecha",
                  "Ubicación",
                  "Ajustador",
                  "Estatus",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-12 text-sm text-gray-400"
                  >
                    No se encontraron siniestros.
                  </td>
                </tr>
              ) : (
                filtrados.map((s, i) => (
                  <tr
                    key={i}
                    onClick={() => setModalSiniestro(s)}
                    className={`hover:bg-gray-50/60 transition-colors cursor-pointer ${!s.ajustador ? "bg-red-50/20" : ""}`}
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-[#13193a]">
                      {s.folio}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 text-xs font-medium whitespace-nowrap">
                      {s.asegurado}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {s.vehiculo}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                      {s.fecha}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {s.ubicacion}
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      {s.ajustador ? (
                        <span className="text-gray-700 font-medium">
                          {s.ajustador}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-red-600 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                          Sin asignar
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_CLS[s.estatus] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {s.estatus}
                      </span>
                    </td>
                    <td
                      className="px-5 py-3.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex gap-1">
                        <button
                          onClick={() => setModalSiniestro(s)}
                          title="Ver detalle"
                          className="w-7 h-7 rounded-lg text-gray-300 hover:text-[#13193a] hover:bg-gray-100 flex items-center justify-center transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.641 0-8.573-3.007-9.963-7.178z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </button>
                        {!s.ajustador && (
                          <button
                            onClick={() => setModalSiniestro(s)}
                            title="Asignar ajustador"
                            className="w-7 h-7 rounded-lg text-red-300 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Mostrando <strong>{filtrados.length}</strong> de{" "}
            <strong>{siniestros.length}</strong>
          </p>
          <div className="flex gap-1">
            <button className="w-7 h-7 rounded-lg text-xs text-gray-400 hover:bg-gray-100">
              ‹
            </button>
            <button className="w-7 h-7 rounded-lg text-xs bg-[#13193a] text-white font-semibold">
              1
            </button>
            <button className="w-7 h-7 rounded-lg text-xs text-gray-400 hover:bg-gray-100">
              ›
            </button>
          </div>
        </div>
      </div>

      {modalSiniestro && (
        <ModalDetalle
          s={modalSiniestro}
          onClose={() => setModalSiniestro(null)}
          onAsignar={asignar}
        />
      )}
    </div>
  );
}
