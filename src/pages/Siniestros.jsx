// ============================================================
// src/pages/Siniestros.jsx
// ── Fixes aplicados:
//   • Badges con bordes (consistentes con Dashboard)
//   • "Sin Asignar" con punto indicador igual que Dashboard
//   • Modal: header más limpio, scroll interno correcto
//   • Timeline: colores mejorados
//   • Empty state cuando no hay resultados
//   • Botones de acción más consistentes
//   • Toolbar mejor organizado
// ============================================================
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Badge de estatus (idéntico al de Dashboard)
const STATUS_CLS = {
  Completado: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Pendiente:  "bg-amber-50  text-amber-700  border border-amber-200",
  Cancelado:  "bg-red-50    text-red-600    border border-red-200",
  Activo:     "bg-blue-50   text-blue-700   border border-blue-200",
  Asignado:   "bg-purple-50 text-purple-700 border border-purple-200",
};

const SINIESTROS = [
  { folio: "SN-10234", asegurado: "Carlos Gómez",   vehiculo: "Toyota Corolla", fecha: "02/05/26", ubicacion: "Jiutepec, Mor",   ajustador: "Félix Hernández", estatus: "Completado" },
  { folio: "SN-10231", asegurado: "Ana Martínez",   vehiculo: "Honda Civic",    fecha: "02/05/26", ubicacion: "Cuernavaca, Mor", ajustador: null,              estatus: "Pendiente"  },
  { folio: "SN-10227", asegurado: "Roberto Díaz",   vehiculo: "Nissan Tsuru",   fecha: "01/05/26", ubicacion: "Jiutepec, Mor",   ajustador: "Félix Hernández", estatus: "Cancelado"  },
  { folio: "SN-10220", asegurado: "Laura González", vehiculo: "KIA Sportage",   fecha: "01/05/26", ubicacion: "Temixco, Mor",    ajustador: null,              estatus: "Pendiente"  },
  { folio: "SN-10215", asegurado: "Miguel Ortega",  vehiculo: "VW Jetta",       fecha: "30/04/26", ubicacion: "Jiutepec, Mor",   ajustador: "Luis Martínez",   estatus: "Completado" },
  { folio: "SN-10212", asegurado: "Pedro Ruiz",     vehiculo: "Chevrolet Aveo", fecha: "30/04/26", ubicacion: "Jiutepec, Mor",   ajustador: "Ana García",      estatus: "Activo"     },
  { folio: "SN-10208", asegurado: "Sofía Torres",   vehiculo: "Nissan Versa",   fecha: "29/04/26", ubicacion: "Jiutepec, Mor",   ajustador: "Luis Martínez",   estatus: "Activo"     },
];

// ── Modal de Detalle ─────────────────────────────────────────
function ModalDetalle({ s, onClose }) {
  const etapas = [
    { label: "Reportado",  time: "24/05/26 10:30 AM", done: true  },
    { label: "Arribo",     time: "24/05/26 10:50 AM", done: true  },
    { label: "En proceso", time: "Pendiente",          done: false },
    { label: "Cerrado",    time: "Pendiente",          done: false },
  ];
  const docs = [
    { label: "Póliza",      icon: "📄" },
    { label: "Evidencia",   icon: "📷" },
    { label: "No. Serie",   icon: "🪪" },
    { label: "Licencia(s)", icon: "🪪" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(10,15,40,0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full max-w-5xl"
        style={{ height: "88vh", maxHeight: "780px" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header del modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#13193a]/8 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#13193a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#13193a]">Detalle del Siniestro</h2>
              <p className="text-xs text-gray-400">Folio <span className="font-mono font-semibold">{s.folio}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Cuerpo del modal */}
        <div className="flex-1 overflow-hidden flex divide-x divide-gray-100">

          {/* Columna principal: Info */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Información del Siniestro</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {[
                  { label: "No. Póliza",      value: "P-12345402325234523" },
                  { label: "Fecha",           value: "24 de abril del 2026" },
                  { label: "Hora",            value: "16:30 hrs" },
                  { label: "Conductor NA",    value: "Angel Ivan Ortega Chaverría" },
                  { label: "Cant. Afectados", value: "3 personas" },
                  { label: "Vehículo",        value: "KIA K4 LX 4P L4 2.0L SERVPUB AUT." },
                ].map(f => (
                  <div key={f.label}>
                    <p className="text-[11px] text-gray-400 mb-0.5 font-medium">{f.label}</p>
                    <p className="text-sm font-semibold text-gray-700">{f.value}</p>
                  </div>
                ))}
                <div className="col-span-2">
                  <p className="text-[11px] text-gray-400 mb-0.5 font-medium">Ubicación</p>
                  <p className="text-sm font-medium text-gray-700">Calle Zacatecas No. 7, Col. Las Torres de Oaxtepec, Jiutepec, Morelos</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[11px] text-gray-400 mb-0.5 font-medium">Descripción del Siniestro</p>
                  <p className="text-sm text-gray-500 leading-relaxed">Colisión entre dos vehículos en intersección. El asegurado transitaba sobre Calle Zacatecas cuando fue impactado lateralmente por un vehículo que no respetó el alto.</p>
                </div>
              </div>
            </div>

            {/* Documentos */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Documentos</p>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">0 / 4 subidos</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {docs.map(d => (
                  <button
                    key={d.label}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-3 flex flex-col items-center gap-2 hover:border-[#13193a]/25 hover:bg-gray-50 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-lg group-hover:bg-white transition-colors">
                      {d.icon}
                    </div>
                    <p className="text-[11px] text-gray-500 text-center font-medium">{d.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Columna lateral: Timeline + Ajustador */}
          <div className="w-60 shrink-0 overflow-y-auto p-5 space-y-6 bg-gray-50/50">

            {/* Timeline */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Seguimiento</p>
              <div>
                {etapas.map((e, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        e.done
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-gray-300 bg-white"
                      }`}>
                        {e.done && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                        )}
                      </div>
                      {i < etapas.length - 1 && (
                        <div className={`w-0.5 h-7 my-1 rounded-full ${e.done ? "bg-emerald-200" : "bg-gray-200"}`}/>
                      )}
                    </div>
                    <div className="pb-1">
                      <p className={`text-xs font-semibold ${e.done ? "text-[#13193a]" : "text-gray-400"}`}>{e.label}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{e.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ajustador */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Ajustador</p>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#13193a] flex items-center justify-center text-white text-xs font-bold shrink-0">
                  LH
                </div>
                <div>
                  <p className="text-xs font-bold text-[#13193a]">Luis Hernández</p>
                  <p className="text-[11px] text-gray-400">Ajustador asignado</p>
                </div>
              </div>
              <span className="inline-flex items-center text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-semibold">
                Pendiente de arribo
              </span>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div>
                  <p className="text-[11px] text-gray-400">Fecha arribo</p>
                  <p className="text-xs text-gray-600 font-medium mt-0.5">—</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">Hora</p>
                  <p className="text-xs text-gray-600 font-medium mt-0.5">—</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer del modal */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex items-center justify-between bg-white">
          <p className="text-xs text-gray-400">
            Última actualización: hoy a las 10:50 AM
          </p>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-xs font-semibold transition-all">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
  const [filtroFecha,    setFiltroFecha]    = useState("Hoy");
  const [filtroEstatus,  setFiltroEstatus]  = useState("Todos");
  const [busqueda,       setBusqueda]       = useState("");
  const [modalSiniestro, setModalSiniestro] = useState(null);
  const navigate = useNavigate();

  const filtrados = SINIESTROS.filter(s => {
    const matchEstatus  = filtroEstatus === "Todos" || s.estatus === filtroEstatus;
    const matchBusqueda =
      s.folio.toLowerCase().includes(busqueda.toLowerCase()) ||
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
        <button
          onClick={() => navigate("/siniestros/nuevo")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#13193a] text-white text-sm font-semibold hover:bg-[#1e2a50] transition-all shadow-sm shadow-[#13193a]/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          Nuevo siniestro
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-4 border-b border-gray-100">
          <select
            value={filtroFecha}
            onChange={e => setFiltroFecha(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]"
          >
            <option>Hoy</option>
            <option>Esta semana</option>
            <option>Este mes</option>
          </select>
          <select
            value={filtroEstatus}
            onChange={e => setFiltroEstatus(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]"
          >
            <option>Todos</option>
            <option>Completado</option>
            <option>Pendiente</option>
            <option>Cancelado</option>
            <option>Activo</option>
          </select>
          <div className="relative ml-auto">
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar folio o asegurado..."
              className="text-xs border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] w-48 bg-white"
            />
            <svg className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
            </svg>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {["Folio", "Asegurado", "Vehículo", "Fecha", "Ubicación", "Ajustador", "Estatus", ""].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-sm text-gray-400">
                    No se encontraron siniestros con ese filtro.
                  </td>
                </tr>
              ) : (
                filtrados.map((s, i) => (
                  <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-[#13193a]">{s.folio}</td>
                    <td className="px-5 py-3.5 text-gray-700 text-xs font-medium">{s.asegurado}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{s.vehiculo}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">{s.fecha}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{s.ubicacion}</td>
                    <td className="px-5 py-3.5 text-xs">
                      {s.ajustador
                        ? <span className="text-gray-700">{s.ajustador}</span>
                        : <span className="inline-flex items-center gap-1.5 text-amber-600 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block shrink-0"/>
                            Sin asignar
                          </span>
                      }
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_CLS[s.estatus] ?? "bg-gray-100 text-gray-600"}`}>
                        {s.estatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setModalSiniestro(s)}
                          title="Ver detalle"
                          className="w-7 h-7 rounded-lg text-gray-300 hover:text-[#13193a] hover:bg-gray-100 flex items-center justify-center transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.641 0-8.573-3.007-9.963-7.178z"/>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          </svg>
                        </button>
                        <button
                          title="Editar"
                          className="w-7 h-7 rounded-lg text-gray-300 hover:text-[#13193a] hover:bg-gray-100 flex items-center justify-center transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Mostrando {filtrados.length} de {SINIESTROS.length} registros
          </p>
          <div className="flex gap-1">
            <button className="w-7 h-7 rounded-lg text-xs text-gray-400 hover:bg-gray-100 transition-colors">‹</button>
            <button className="w-7 h-7 rounded-lg text-xs bg-[#13193a] text-white font-semibold">1</button>
            <button className="w-7 h-7 rounded-lg text-xs text-gray-400 hover:bg-gray-100 transition-colors">›</button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalSiniestro && (
        <ModalDetalle s={modalSiniestro} onClose={() => setModalSiniestro(null)} />
      )}
    </div>
  );
}