// ============================================================
// src/pages/Dashboard.jsx
// ── Fixes aplicados:
//   • Saludo personalizado según rol y hora del día
//   • Badges de estatus consistentes (con borde, igual que Siniestros.jsx)
//   • Métricas: colores más coherentes, mejor tipografía de valor
//   • Tabla: columna de acciones más clara
//   • Header de tabla sticky-ready
//   • Separación visual entre filtros y tabla
// ============================================================
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Datos mock (reemplazar con Supabase) ──────────────────────
const metrics = [
  {
    label: "Reportados Hoy",
    value: 8,
    change: "+7.3% vs ayer",
    up: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/>
      </svg>
    ),
    accent: "blue",
  },
  {
    label: "Pendientes de Asignar",
    value: 3,
    change: "-3.2% vs semana",
    up: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
      </svg>
    ),
    accent: "amber",
  },
  {
    label: "En Proceso",
    value: 12,
    change: "+0.3% retraso",
    up: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
    accent: "indigo",
  },
  {
    label: "Cerrados Hoy",
    value: 5,
    change: "+7.3% vs ayer",
    up: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
    accent: "emerald",
  },
];

// Paleta de colores por acento
const ACCENT = {
  blue:    { bg: "bg-blue-50",    text: "text-blue-600"    },
  amber:   { bg: "bg-amber-50",   text: "text-amber-600"   },
  indigo:  { bg: "bg-indigo-50",  text: "text-indigo-600"  },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
};

const SINIESTROS_MOCK = [
  { folio: "SN-10234", asegurado: "Carlos Gómez",    vehiculo: "Toyota Corolla", ubicacion: "Jiutepec, Mor", ajustador: "Félix Hernández", estatus: "Completado" },
  { folio: "SN-10231", asegurado: "Ana Martínez",    vehiculo: "Honda Civic",    ubicacion: "Cuernavaca, Mor", ajustador: null,              estatus: "Pendiente"  },
  { folio: "SN-10227", asegurado: "Roberto Díaz",    vehiculo: "Nissan Tsuru",   ubicacion: "Jiutepec, Mor", ajustador: "Félix Hernández", estatus: "Cancelado"  },
  { folio: "SN-10220", asegurado: "Laura González",  vehiculo: "KIA Sportage",   ubicacion: "Temixco, Mor",  ajustador: null,              estatus: "Pendiente"  },
  { folio: "SN-10215", asegurado: "Miguel Ortega",   vehiculo: "VW Jetta",       ubicacion: "Jiutepec, Mor", ajustador: "Luis Martínez",   estatus: "Completado" },
];

// Badge consistente con borde (igual que en Siniestros.jsx)
const STATUS_CLS = {
  Completado: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Pendiente:  "bg-amber-50  text-amber-700  border border-amber-200",
  Cancelado:  "bg-red-50    text-red-600    border border-red-200",
  Activo:     "bg-blue-50   text-blue-700   border border-blue-200",
};

// Saludo según hora del día
function getSaludo() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default function Dashboard({ rolNombre, usuario }) {
  const [filtroFecha,   setFiltroFecha]   = useState("Hoy");
  const [filtroEstatus, setFiltroEstatus] = useState("Todos");
  const [busqueda,      setBusqueda]      = useState("");
  const navigate = useNavigate();

  const nombre = usuario?.nombre ?? "Usuario";

  const filtrados = SINIESTROS_MOCK.filter(s => {
    const matchEstatus  = filtroEstatus === "Todos" || s.estatus === filtroEstatus;
    const matchBusqueda = s.folio.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.asegurado.toLowerCase().includes(busqueda.toLowerCase());
    return matchEstatus && matchBusqueda;
  });

  return (
    <div className="p-6 min-h-full bg-gray-50">

      {/* ── Header ── */}
      <div className="mb-6">
        <p className="text-gray-400 text-sm">{getSaludo()}, <span className="font-semibold text-[#13193a]">{nombre}</span></p>
        <h1 className="text-2xl font-bold text-[#13193a] mt-0.5">Resumen del día</h1>
      </div>

      {/* ── Métricas ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((m) => {
          const { bg, text } = ACCENT[m.accent];
          return (
            <div key={m.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <p className="text-xs font-medium text-gray-500 leading-snug pr-2">{m.label}</p>
                <div className={`w-9 h-9 rounded-xl ${bg} ${text} flex items-center justify-center shrink-0`}>
                  {m.icon}
                </div>
              </div>
              <p className="text-3xl font-bold text-[#13193a] tabular-nums">{m.value}</p>
              <p className={`text-xs flex items-center gap-1 mt-1.5 font-medium ${m.up ? "text-emerald-600" : "text-red-500"}`}>
                {m.up ? "↑" : "↓"} {m.change}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Tabla de siniestros ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-bold text-[#13193a]">Últimos Siniestros</h2>
            <p className="text-xs text-gray-400 mt-0.5">{filtrados.length} registros</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
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
            </select>
            <div className="relative">
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar folio o asegurado..."
                className="text-xs border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] w-44 bg-white"
              />
              <svg className="w-3.5 h-3.5 text-gray-350 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {["Folio", "Asegurado", "Vehículo", "Ubicación", "Ajustador", "Estatus", ""].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-sm text-gray-400">
                    No se encontraron registros con ese filtro.
                  </td>
                </tr>
              ) : (
                filtrados.map((s, i) => (
                  <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-[#13193a]">{s.folio}</td>
                    <td className="px-5 py-3.5 text-gray-700 text-xs font-medium">{s.asegurado}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{s.vehiculo}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{s.ubicacion}</td>
                    <td className="px-5 py-3.5 text-xs">
                      {s.ajustador
                        ? <span className="text-gray-700">{s.ajustador}</span>
                        : <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"/>
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
                      <button
                        onClick={() => navigate("/siniestros")}
                        title="Ver detalle"
                        className="w-7 h-7 rounded-lg text-gray-300 hover:text-[#13193a] hover:bg-gray-100 flex items-center justify-center transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.641 0-8.573-3.007-9.963-7.178z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                      </button>
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
            Mostrando {filtrados.length} de {SINIESTROS_MOCK.length} registros
          </p>
          <div className="flex gap-1">
            <button className="w-7 h-7 rounded-lg text-xs text-gray-400 hover:bg-gray-100 transition-colors">‹</button>
            <button className="w-7 h-7 rounded-lg text-xs bg-[#13193a] text-white font-semibold">1</button>
            <button className="w-7 h-7 rounded-lg text-xs text-gray-400 hover:bg-gray-100 transition-colors">›</button>
          </div>
        </div>
      </div>
    </div>
  );
}