// ============================================================
// src/pages/operador/OperadorDashboard.jsx
// Dashboard del operador — solo muestra información de su oficina
// ============================================================
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Mock — en producción viene del usuario autenticado
const OFICINA = { nombre: "COFISEM AV. E.ZAPATA", id: "civac" };

const HOY = new Date().toLocaleDateString("es-MX", { weekday:"long", day:"2-digit", month:"long", year:"numeric" });

const METRICAS = [
  { label: "Pólizas emitidas hoy",   value: 8,         sub: "+2 vs ayer",   up: true,  icon: "poliza",   accent: "blue"    },
  { label: "Cotizaciones pendientes", value: 3,         sub: "Sin tramitar", up: null,  icon: "cotizacion", accent: "amber" },
  { label: "Cobrado hoy",            value: "$13,573",  sub: "Efectivo + vales", up: true, icon: "dinero", accent: "emerald" },
  { label: "Pólizas por vencer",     value: 5,          sub: "Próximos 7 días",up:false, icon: "alerta",  accent: "red"     },
];

const ACCENT = {
  blue:    { bg: "bg-blue-50",    text: "text-blue-600",    border: "border-blue-100"    },
  amber:   { bg: "bg-amber-50",   text: "text-amber-600",   border: "border-amber-100"   },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
  red:     { bg: "bg-red-50",     text: "text-red-600",     border: "border-red-100"     },
};

const ICONS = {
  poliza: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/>
    </svg>
  ),
  cotizacion: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.616 4.5 4.667V19.5a1.5 1.5 0 001.5 1.5h12a1.5 1.5 0 001.5-1.5V4.667c0-1.051-.807-1.967-1.907-2.095A48.507 48.507 0 0012 2.25z"/>
    </svg>
  ),
  dinero: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"/>
    </svg>
  ),
  alerta: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
    </svg>
  ),
};

// Últimas pólizas emitidas hoy
const ULTIMAS_POLIZAS = [
  { poliza: "3413241", asegurado: "Angel Ivan Ortega",   cobertura: "AMPLIA",           prima: "$2,679",  vendedor: "Laura Rosher",  forma: "Trimestral", hora: "09:15" },
  { poliza: "3413198", asegurado: "María García López",  cobertura: "TAXI BÁSICA 2500", prima: "$1,820",  vendedor: "Marco A. Cruz",  forma: "Contado",    hora: "10:42" },
  { poliza: "3413167", asegurado: "Roberto Díaz Ramos",  cobertura: "SERV. PÚB. GAMAN", prima: "$2,200",  vendedor: "Laura Rosher",  forma: "4 Parciales", hora: "11:30" },
  { poliza: "3413144", asegurado: "Sofía Torres Ruiz",   cobertura: "TAXI BÁSICA 2500", prima: "$1,820",  vendedor: "Carlos Soto",   forma: "Contado",    hora: "13:05" },
];

// Cotizaciones pendientes de tramitar
const COTIZACIONES_PENDIENTES = [
  { id: "COT-012601000014", cliente: "Juan Pérez",    cobertura: "TAXI BÁSICA 2500",   total: "$1,820", fecha: "Hoy 10:15"      },
  { id: "COT-012601000012", cliente: "Rosa Mendoza",  cobertura: "SERV. PÚB. 50/50",  total: "$2,200", fecha: "Ayer 16:30"     },
  { id: "COT-012601000009", cliente: "Pedro Ramos",   cobertura: "AMPLIA DIDI",        total: "$3,150", fecha: "15/03 09:00"    },
];

// Pólizas por vencer
const POR_VENCER = [
  { poliza: "3411002", asegurado: "Carmen López",  vehiculo: "Nissan Tsuru",  vence: "20/03/2026", dias: 3  },
  { poliza: "3410888", asegurado: "José Martínez", vehiculo: "VW Jetta",      vence: "22/03/2026", dias: 5  },
  { poliza: "3410755", asegurado: "Ana Gutiérrez", vehiculo: "Aveo",          vence: "24/03/2026", dias: 7  },
];

export default function OperadorDashboard({ usuario }) {
  const navigate = useNavigate();
  const hora  = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-sm text-gray-400">{saludo}, <span className="font-semibold text-[#13193a]">{usuario?.nombre ?? "Operador"}</span></p>
          <h1 className="text-2xl font-bold text-[#13193a] mt-0.5">Resumen de la oficina</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500"/>
            <p className="text-xs text-gray-500 font-medium">{OFICINA.nombre} · {HOY}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate("/cotizaciones/nueva")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#13193a] text-white text-sm font-semibold hover:bg-[#1e2a50] transition-all shadow-sm shadow-[#13193a]/15">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
            </svg>
            Nueva cotización
          </button>
          <button onClick={() => navigate("/corte-diario")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z"/>
            </svg>
            Corte del día
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICAS.map(m => {
          const a = ACCENT[m.accent];
          return (
            <div key={m.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <p className="text-xs font-medium text-gray-500 leading-snug pr-2">{m.label}</p>
                <div className={`w-9 h-9 rounded-xl ${a.bg} ${a.text} flex items-center justify-center shrink-0`}>
                  {ICONS[m.icon]}
                </div>
              </div>
              <p className="text-2xl font-bold text-[#13193a] tabular-nums">{m.value}</p>
              <p className={`text-xs flex items-center gap-1 mt-1.5 font-medium ${
                m.up === true ? "text-emerald-600" : m.up === false ? "text-red-500" : "text-gray-400"
              }`}>
                {m.up === true ? "↑" : m.up === false ? "↓" : "·"} {m.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Pólizas emitidas hoy — 2/3 */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-sm font-bold text-[#13193a]">Pólizas emitidas hoy</h2>
              <p className="text-xs text-gray-400 mt-0.5">{ULTIMAS_POLIZAS.length} trámites realizados</p>
            </div>
            <button onClick={() => navigate("/polizas")} className="text-xs text-blue-600 font-semibold hover:underline">Ver todas</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  {["Hora", "Póliza", "Asegurado", "Cobertura", "Forma pago", "Prima"].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ULTIMAS_POLIZAS.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-400 font-medium whitespace-nowrap">{p.hora}</td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-[#13193a]">{p.poliza}</td>
                    <td className="px-4 py-3 text-xs text-gray-700 font-medium">{p.asegurado}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.cobertura}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.forma}</td>
                    <td className="px-4 py-3 text-xs font-bold text-emerald-700">{p.prima}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cotizaciones pendientes — 1/3 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-sm font-bold text-[#13193a]">Cotizaciones guardadas</h2>
              <p className="text-xs text-gray-400 mt-0.5">Pendientes de tramitar</p>
            </div>
            <button onClick={() => navigate("/cotizaciones")} className="text-xs text-blue-600 font-semibold hover:underline">Ver todas</button>
          </div>
          <div className="divide-y divide-gray-50">
            {COTIZACIONES_PENDIENTES.map((c, i) => (
              <div key={i} className="px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-mono font-bold text-[#13193a] truncate">{c.id}</p>
                  <span className="text-xs font-bold text-emerald-700 shrink-0">{c.total}</span>
                </div>
                <p className="text-xs text-gray-700 font-medium truncate">{c.cliente}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-[11px] text-gray-400 truncate">{c.cobertura}</p>
                  <p className="text-[11px] text-gray-400 shrink-0 ml-2">{c.fecha}</p>
                </div>
                <button
                  onClick={() => navigate(`/cotizaciones/${c.id}/tramitar`)}
                  className="mt-2.5 w-full py-1.5 rounded-lg border border-[#13193a]/20 text-[11px] font-bold text-[#13193a] hover:bg-[#13193a]/5 transition-all"
                >
                  Tramitar →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pólizas por vencer */}
      <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-amber-100 bg-amber-50/50">
          <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
          </svg>
          <div>
            <h2 className="text-sm font-bold text-amber-800">Pólizas próximas a vencer</h2>
            <p className="text-xs text-amber-600 mt-0.5">Requieren renovación en los próximos 7 días</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {["Póliza", "Asegurado", "Vehículo", "Vence", "Días restantes", ""].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {POR_VENCER.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs font-bold text-[#13193a]">{p.poliza}</td>
                  <td className="px-5 py-3 text-xs text-gray-700 font-medium">{p.asegurado}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{p.vehiculo}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{p.vence}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                      p.dias <= 3 ? "bg-red-50 text-red-600 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {p.dias} días
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => navigate(`/polizas/${p.poliza}/renovar`)}
                      className="text-xs text-blue-600 font-semibold hover:underline whitespace-nowrap"
                    >
                      Renovar →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}