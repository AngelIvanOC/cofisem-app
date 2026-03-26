// ============================================================
// src/features/cabinero/dashboard/DashboardPage.jsx
// Cabinero: KPIs del día + tabla de últimos siniestros
// ============================================================
import { useNavigate } from "react-router-dom";

const HOY = new Date().toLocaleDateString("es-MX", {
  weekday: "long", day: "2-digit", month: "long", year: "numeric",
});

const KPIS = [
  { label: "Reportados hoy",    value: "4",  accent: "blue",    path: "/siniestros" },
  { label: "Pend. asignar",     value: "2",  accent: "amber",   path: "/siniestros" },
  { label: "En proceso",        value: "7",  accent: "indigo",  path: "/siniestros" },
  { label: "Cerrados este mes", value: "19", accent: "emerald", path: "/siniestros" },
];

const ULTIMOS = [
  { folio:"SIN-088", asegurado:"Angel Ivan Ortega",   poliza:"3413241", tipo:"Colisión",         hora:"09:14", estatus:"Sin asignar" },
  { folio:"SIN-087", asegurado:"Roberto Díaz Ramos",  poliza:"3413167", tipo:"Robo parcial",     hora:"08:32", estatus:"Asignado"    },
  { folio:"SIN-086", asegurado:"Carmen López Vargas", poliza:"3411002", tipo:"Daños a terceros", hora:"Ayer",  estatus:"En proceso"  },
  { folio:"SIN-085", asegurado:"José Martínez Ruiz",  poliza:"3410888", tipo:"Robo total",       hora:"Ayer",  estatus:"En proceso"  },
  { folio:"SIN-084", asegurado:"María García López",  poliza:"3413198", tipo:"Colisión",         hora:"17/03", estatus:"Cerrado"     },
];

const AC = {
  blue:    "bg-blue-50    border-blue-200    text-blue-700",
  amber:   "bg-amber-50   border-amber-200   text-amber-700",
  indigo:  "bg-indigo-50  border-indigo-200  text-indigo-700",
  emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
};

const ESTATUS_CLS = {
  "Sin asignar": "bg-amber-50   text-amber-700   border-amber-200",
  "Asignado":    "bg-blue-50    text-blue-700    border-blue-200",
  "En proceso":  "bg-indigo-50  text-indigo-700  border-indigo-200",
  "Cerrado":     "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function CabiDashboard({ usuario }) {
  const navigate = useNavigate();
  const h = new Date().getHours();
  const saludo = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="h-full flex flex-col gap-5 p-6 bg-gray-50 overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{saludo}, <span className="font-semibold text-[#13193a]">{usuario?.nombre ?? "Cabinero"}</span></p>
          <h1 className="text-2xl font-bold text-[#13193a] mt-0.5">Siniestros</h1>
          <p className="text-xs text-gray-400 mt-0.5 capitalize">{HOY}</p>
        </div>
        <button onClick={() => navigate("/reportar-siniestro")} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all shadow-lg shadow-[#13193a]/15">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
          Reportar siniestro
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {KPIS.map((k) => (
          <button key={k.label} onClick={() => navigate(k.path)} className={`${AC[k.accent]} border rounded-2xl p-4 text-left hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all`}>
            <p className="text-3xl font-bold tabular-nums">{k.value}</p>
            <p className="text-xs font-semibold mt-1 opacity-80 leading-tight">{k.label}</p>
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden min-h-0">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <p className="text-sm font-bold text-[#13193a]">Siniestros recientes</p>
          <button onClick={() => navigate("/siniestros")} className="text-xs font-semibold text-[#13193a] opacity-60 hover:opacity-100 transition-opacity">Ver todos →</button>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 sticky top-0">
                {["Folio","Asegurado","Póliza","Tipo","Hora","Estatus","Acción"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ULTIMOS.map((s, i) => (
                <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-[#13193a]">{s.folio}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">{s.asegurado}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.poliza}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{s.tipo}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{s.hora}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border ${ESTATUS_CLS[s.estatus]}`}>{s.estatus}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => navigate("/siniestros")} className="text-xs font-bold text-[#13193a] border border-[#13193a]/20 px-2.5 py-1.5 rounded-xl hover:bg-[#13193a]/5 transition-all">Ver</button>
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
