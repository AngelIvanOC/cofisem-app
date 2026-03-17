import { useState } from "react";
import { useNavigate } from "react-router-dom";

const statusStyle = {
  Completado: "bg-emerald-100 text-emerald-700",
  Pendiente:  "bg-amber-100 text-amber-700",
  Cancelado:  "bg-red-100 text-red-600",
  Activo:     "bg-blue-100 text-blue-700",
};

const SINIESTROS = [
  { folio: "SN-10234", asegurado: "Carlos Gómez", vehiculo: "Toyota Corolla", fecha: "02-05-26", ubicacion: "Jiutepec, Mor", ajustador: "Félix Hernández", estatus: "Completado" },
  { folio: "SN-10231", asegurado: "Carlos Gómez", vehiculo: "Toyota Corolla", fecha: "02-05-26", ubicacion: "Jiutepec, Mor", ajustador: null,              estatus: "Pendiente"  },
  { folio: "SN-10227", asegurado: "Carlos Gómez", vehiculo: "Toyota Corolla", fecha: "02-05-26", ubicacion: "Jiutepec, Mor", ajustador: "Félix Hernández", estatus: "Cancelado"  },
  { folio: "SN-10220", asegurado: "Carlos Gómez", vehiculo: "Toyota Corolla", fecha: "02-05-26", ubicacion: "Jiutepec, Mor", ajustador: null,              estatus: "Pendiente"  },
  { folio: "SN-10215", asegurado: "Carlos Gómez", vehiculo: "Toyota Corolla", fecha: "02-05-26", ubicacion: "Jiutepec, Mor", ajustador: "Félix Hernández", estatus: "Completado" },
  { folio: "SN-10212", asegurado: "Carlos Gómez", vehiculo: "Toyota Corolla", fecha: "02-05-26", ubicacion: "Jiutepec, Mor", ajustador: "Félix Hernández", estatus: "Activo"     },
  { folio: "SN-10208", asegurado: "Carlos Gómez", vehiculo: "Toyota Corolla", fecha: "02-05-26", ubicacion: "Jiutepec, Mor", ajustador: "Félix Hernández", estatus: "Activo"     },
];

// ── Modal de Detalle ─────────────────────────────────────────
function ModalDetalle({ s, onClose }) {
  const etapas = [
    { label: "Reportado",  time: "24/5/24 10:30AM", done: true  },
    { label: "Arribo",     time: "24/5/24 10:50AM", done: true  },
    { label: "En proceso", time: "—/—/— 00:00",     done: false },
    { label: "Cerrado",    time: "—/—/— 00:00",     done: false },
  ];
  const docs = [
    { label: "Póliza",      icon: "📄" },
    { label: "Evidencia",   icon: "📷" },
    { label: "No. Serie",   icon: "🪪" },
    { label: "Licencia(s)", icon: "🪪" },
  ];

  return (
    /* Backdrop: cubre toda la pantalla (incluyendo sidebar) usando fixed */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={onClose} // click fuera cierra
    >
      {/* Modal: 80vw × 85vh, centrado */}
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: "80vw", height: "85vh" }}
        onClick={e => e.stopPropagation()} // evitar cerrar al hacer click adentro
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[#13193a]">Detalle del Siniestro</h2>
            <p className="text-xs text-gray-400 mt-0.5">Folio {s.folio}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body — 3 columnas */}
        <div className="flex-1 overflow-hidden flex gap-0 divide-x divide-gray-100">

          {/* Col 1: Información principal */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Información del Siniestro</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">No. Póliza</p>
                <p className="text-sm font-semibold text-[#13193a]">P-12345402325234523</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Fecha</p>
                <p className="text-sm font-medium text-gray-700">24 de abril del 2026</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Hora</p>
                <p className="text-sm font-medium text-gray-700">16:30 AM</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Nombre NA</p>
                <p className="text-sm font-medium text-gray-700">Angel Ivan Ortega Chaverría</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-400 mb-0.5">Póliza</p>
                <p className="text-sm font-medium text-gray-700">KIA K4 LX 4P L4 2.0L SERVPUB AUT. 05 OCUP. 2024 AM6 24576</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Cant. Afectados</p>
                <p className="text-sm font-medium text-gray-700">3</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Vehículo</p>
                <p className="text-sm font-medium text-gray-700">KIA K4 LX 4P L4 2.0L SERVPUB AUT.</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-400 mb-0.5">Ubicación</p>
                <p className="text-sm font-medium text-gray-700">62317o Calle Zacatecas No. 7 Colonia Las Torres de Oaxtepec, Jiutepec, Cuernavaca Mor</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-400 mb-0.5">Descripción</p>
                <p className="text-sm text-gray-500 leading-relaxed">Lorem ipsum la simply dummy text of the printing and typesetting industry. Lorem ipsum has been the industry standard dummy text...</p>
              </div>
            </div>

            {/* Documentos */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Documentos</h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">0/4</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {docs.map(d => (
                  <div key={d.label} className="border-2 border-dashed border-gray-200 rounded-xl p-3 flex flex-col items-center gap-2 hover:border-[#13193a]/30 hover:bg-gray-50 transition-all cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg">{d.icon}</div>
                    <p className="text-xs text-gray-500 text-center font-medium">{d.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Col 2: Estatus timeline + Ajustador */}
          <div className="w-64 shrink-0 overflow-y-auto p-6 space-y-6">
            {/* Timeline */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Estatus de Siniestro</h3>
              <div className="space-y-0">
                {etapas.map((e, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        e.done ? "border-emerald-500 bg-emerald-500" : "border-gray-300 bg-white"}`}>
                        {e.done && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                        )}
                      </div>
                      {i < etapas.length - 1 && (
                        <div className={`w-0.5 h-8 mt-1 mb-1 ${e.done ? "bg-emerald-300" : "bg-gray-200"}`}/>
                      )}
                    </div>
                    <div className="pb-2">
                      <p className={`text-sm font-semibold ${e.done ? "text-[#13193a]" : "text-gray-400"}`}>{e.label}</p>
                      <p className="text-xs text-gray-400">{e.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ajustador */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Ajustador</p>
              <p className="text-xs text-gray-500 mb-2">Ajustador Asignado</p>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#13193a] flex items-center justify-center text-white text-xs font-bold shrink-0">LH</div>
                <p className="text-sm font-semibold text-[#13193a]">Luis Hernández</p>
              </div>
              <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-semibold">
                Pendiente de Arribo
              </span>
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                <div>
                  <p className="text-gray-400">Fecha</p>
                  <p className="text-gray-600 font-medium">—/—/—</p>
                </div>
                <div>
                  <p className="text-gray-400">Hora</p>
                  <p className="text-gray-600 font-medium">00:00 – 00 hrs.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex justify-end">
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-semibold transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
            </svg>
            Descargar Reporte
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página Principal ──────────────────────────────────────────
export default function Siniestros() {
  const [filtroFecha,   setFiltroFecha]   = useState("Hoy");
  const [filtroEstatus, setFiltroEstatus] = useState("Todos");
  const [busqueda,      setBusqueda]      = useState("");
  const [modalSiniestro, setModalSiniestro] = useState(null);
  const navigate = useNavigate();

  const filtrados = SINIESTROS.filter(s => {
    const matchEstatus  = filtroEstatus === "Todos" || s.estatus === filtroEstatus;
    const matchBusqueda = s.folio.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.asegurado.toLowerCase().includes(busqueda.toLowerCase());
    return matchEstatus && matchBusqueda;
  });

  return (
    <div className="p-6 min-h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Siniestros</h1>
          <p className="text-gray-400 text-sm mt-0.5">{filtrados.length} registros</p>
        </div>
        <button onClick={() => navigate("/siniestros/nuevo")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#13193a] text-white text-sm font-semibold hover:bg-[#1e2a50] transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          Nuevo
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2 p-4 border-b border-gray-100">
          <select value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#13193a]/20">
            <option>Hoy</option><option>Esta semana</option><option>Este mes</option>
          </select>
          <select value={filtroEstatus} onChange={e => setFiltroEstatus(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#13193a]/20">
            <option>Todos</option><option>Completado</option><option>Pendiente</option><option>Cancelado</option><option>Activo</option>
          </select>
          <div className="relative ml-auto">
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar..."
              className="text-xs border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#13193a]/20 w-44"/>
            <svg className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
            </svg>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Folio", "Asegurado", "Vehículo", "Fecha", "Ubicación", "Ajustador", "Estatus", ""].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((s, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-[#13193a]">{s.folio}</td>
                  <td className="px-4 py-3 text-gray-700 text-xs">{s.asegurado}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{s.vehiculo}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{s.fecha}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{s.ubicacion}</td>
                  <td className="px-4 py-3 text-xs">
                    {s.ajustador
                      ? <span className="text-gray-700">{s.ajustador}</span>
                      : <span className="text-amber-500 font-medium">Sin Asignar</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyle[s.estatus]}`}>{s.estatus}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 items-center">
                      {/* Ojo → abre modal */}
                      <button
                        onClick={() => setModalSiniestro(s)}
                        className="w-7 h-7 rounded-lg text-gray-400 hover:text-[#13193a] hover:bg-gray-100 flex items-center justify-center transition-colors"
                        title="Ver detalle"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.641 0-8.573-3.007-9.963-7.178z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                      </button>
                      {/* Editar */}
                      <button className="w-7 h-7 rounded-lg text-gray-400 hover:text-[#13193a] hover:bg-gray-100 flex items-center justify-center transition-colors" title="Editar">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">1–{filtrados.length} de {SINIESTROS.length} | Filas por página: 10</p>
          <div className="flex gap-1">
            <button className="w-6 h-6 rounded text-xs text-gray-400 hover:bg-gray-100">‹</button>
            <button className="w-6 h-6 rounded text-xs bg-[#13193a] text-white">1</button>
            <button className="w-6 h-6 rounded text-xs text-gray-400 hover:bg-gray-100">›</button>
          </div>
        </div>
      </div>

      {/* Modal detalle */}
      {modalSiniestro && (
        <ModalDetalle s={modalSiniestro} onClose={() => setModalSiniestro(null)} />
      )}
    </div>
  );
}