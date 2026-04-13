// ============================================================
// src/pages/supervisor/SupervisorAjustadores.jsx
// Supervisor: Carga de trabajo y rendimiento de ajustadores
// ============================================================
import { useState } from "react";

const AJUSTADORES_DATA = [
  {
    id: "AJ-01", nombre: "Félix Hernández", telefono: "777 100 1111", zona: "Jiutepec / Cuernavaca",
    activos: 2, completados: 18, tiempoPromedio: "2.8h", calificacion: 4.7,
    disponible: true,
    siniestrosActivos: [
      { folio:"SN-10234", asegurado:"Carlos Gómez",    tipo:"Colisión",   estatus:"En proceso",          inicio:"08:15" },
      { folio:"SN-10227", asegurado:"Roberto Díaz",    tipo:"Robo total", estatus:"Jurídico",            inicio:"07:30" },
    ],
    historial: [
      { folio:"SN-10215", tipo:"Colisión",       duracion:"1.5h", calif:5, fecha:"16/03/2026" },
      { folio:"SN-10198", tipo:"Daño a terceros",duracion:"2.1h", calif:4, fecha:"15/03/2026" },
      { folio:"SN-10185", tipo:"Volcadura",       duracion:"3.2h", calif:5, fecha:"14/03/2026" },
    ],
  },
  {
    id: "AJ-02", nombre: "Luis Martínez", telefono: "777 100 2222", zona: "Temixco / Cuautla",
    activos: 3, completados: 22, tiempoPromedio: "3.1h", calificacion: 4.5,
    disponible: true,
    siniestrosActivos: [
      { folio:"SN-10219", asegurado:"Pedro Ruiz",      tipo:"Colisión",   estatus:"Pendiente de arribo", inicio:"10:30" },
      { folio:"SN-10218", asegurado:"Sofía Torres",    tipo:"Cristales",  estatus:"En proceso",          inicio:"09:00" },
      { folio:"SN-10216", asegurado:"Miguel Herrera",  tipo:"Robo parcial",estatus:"En proceso",         inicio:"07:45" },
    ],
    historial: [
      { folio:"SN-10215", tipo:"Colisión",       duracion:"2.0h", calif:5, fecha:"16/03/2026" },
      { folio:"SN-10201", tipo:"Incendio",        duracion:"4.5h", calif:4, fecha:"15/03/2026" },
    ],
  },
  {
    id: "AJ-03", nombre: "Ana García", telefono: "777 100 3333", zona: "Cuernavaca centro",
    activos: 1, completados: 15, tiempoPromedio: "2.4h", calificacion: 4.9,
    disponible: true,
    siniestrosActivos: [
      { folio:"SN-10208", asegurado:"Luis Torres",     tipo:"Colisión",   estatus:"Jurídico",            inicio:"11:00" },
    ],
    historial: [
      { folio:"SN-10199", tipo:"Daño a terceros",duracion:"1.8h", calif:5, fecha:"16/03/2026" },
      { folio:"SN-10188", tipo:"Colisión",        duracion:"2.3h", calif:5, fecha:"14/03/2026" },
    ],
  },
  {
    id: "AJ-04", nombre: "Roberto Vega", telefono: "777 100 4444", zona: "Jiutepec / Xochitepec",
    activos: 0, completados: 9, tiempoPromedio: "3.8h", calificacion: 4.1,
    disponible: true,
    siniestrosActivos: [],
    historial: [
      { folio:"SN-10192", tipo:"Volcadura",       duracion:"4.0h", calif:4, fecha:"15/03/2026" },
    ],
  },
  {
    id: "AJ-05", nombre: "Sofía Torres", telefono: "777 100 5555", zona: "Todas las zonas",
    activos: 4, completados: 31, tiempoPromedio: "2.2h", calificacion: 4.8,
    disponible: false,
    siniestrosActivos: [
      { folio:"SN-10244", asegurado:"Ana Guzmán",      tipo:"Colisión",   estatus:"En proceso",          inicio:"06:30" },
      { folio:"SN-10241", asegurado:"Carlos Peña",     tipo:"Robo parcial",estatus:"En proceso",         inicio:"07:00" },
      { folio:"SN-10239", asegurado:"María Solís",     tipo:"Cristales",  estatus:"En proceso",          inicio:"08:00" },
      { folio:"SN-10235", asegurado:"Jorge Vásquez",   tipo:"Daño a terceros",estatus:"En proceso",      inicio:"08:45" },
    ],
    historial: [
      { folio:"SN-10229", tipo:"Colisión",       duracion:"1.9h", calif:5, fecha:"16/03/2026" },
      { folio:"SN-10221", tipo:"Volcadura",       duracion:"2.8h", calif:5, fecha:"15/03/2026" },
      { folio:"SN-10210", tipo:"Robo total",      duracion:"3.1h", calif:5, fecha:"14/03/2026" },
    ],
  },
];

const MAX_ACTIVOS = 4;

function Estrellas({ n }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-3 h-3 ${i <= Math.round(n) ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
      <span className="text-[11px] text-gray-500 ml-0.5 font-semibold">{n}</span>
    </div>
  );
}

function BarraCarga({ activos, max }) {
  return (
    <div className="flex gap-0.5 items-center">
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} className={`h-2.5 flex-1 rounded-full transition-colors ${
          i < activos
            ? activos === max ? "bg-red-500" : activos >= max - 1 ? "bg-amber-500" : "bg-blue-500"
            : "bg-gray-100"
        }`}/>
      ))}
    </div>
  );
}

const STATUS_CLS = {
  "Pendiente de arribo": "bg-amber-50  text-amber-700  border-amber-200",
  "En proceso":          "bg-blue-50   text-blue-700   border-blue-200",
  "Jurídico":            "bg-purple-50 text-purple-700 border-purple-200",
  "Asignado":            "bg-gray-100  text-gray-600   border-gray-200",
};

export default function SupervisorAjustadores() {
  const [ajustadores] = useState(AJUSTADORES_DATA);
  const [seleccionado, setSeleccionado] = useState(null);

  const totalActivos    = ajustadores.reduce((s, a) => s + a.activos, 0);
  const totalDisponibles = ajustadores.filter(a => a.activos < MAX_ACTIVOS && a.disponible).length;
  const llenos          = ajustadores.filter(a => a.activos >= MAX_ACTIVOS).length;
  const promCalif       = (ajustadores.reduce((s, a) => s + a.calificacion, 0) / ajustadores.length).toFixed(1);

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#13193a]">Ajustadores</h1>
        <p className="text-gray-400 text-sm mt-0.5">Carga de trabajo y rendimiento del equipo</p>
      </div>

      {/* Métricas globales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { l:"Siniestros activos",  v:totalActivos,    a:"blue"    },
          { l:"Con capacidad",       v:totalDisponibles, a:"emerald" },
          { l:"Sin capacidad",       v:llenos,           a:"red"     },
          { l:"Calificación prom.",  v:promCalif,        a:"amber"   },
        ].map(m => {
          const c = { blue:"bg-blue-50 border-blue-200 text-blue-700", emerald:"bg-emerald-50 border-emerald-200 text-emerald-700", red:"bg-red-50 border-red-200 text-red-600", amber:"bg-amber-50 border-amber-200 text-amber-700" };
          return (
            <div key={m.l} className={`${c[m.a]} border rounded-2xl p-4`}>
              <p className="text-2xl font-bold tabular-nums">{m.v}</p>
              <p className="text-xs font-semibold mt-0.5 opacity-80">{m.l}</p>
            </div>
          );
        })}
      </div>

      {/* Grid de ajustadores */}
      <div className={`grid grid-cols-1 lg:grid-cols-${seleccionado ? 2 : 1} gap-5`}>
        
        {/* Lista de ajustadores */}
        <div className="space-y-3">
          {ajustadores.map(aj => {
            const lleno = aj.activos >= MAX_ACTIVOS;
            const isSelected = seleccionado?.id === aj.id;
            return (
              <button key={aj.id} onClick={() => setSeleccionado(isSelected ? null : aj)}
                className={[
                  "w-full bg-white border rounded-2xl p-5 text-left hover:shadow-md transition-all duration-150",
                  isSelected ? "border-[#13193a] ring-2 ring-[#13193a]/10 shadow-md" : "border-gray-100 shadow-sm hover:border-gray-200",
                  !aj.disponible ? "opacity-70" : "",
                ].join(" ")}>
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold text-white shrink-0 ${
                    lleno ? "bg-red-500" : aj.activos === 0 ? "bg-gray-400" : "bg-[#13193a]"
                  }`}>
                    {aj.nombre.split(" ").map(w=>w[0]).join("").slice(0,2)}
                  </div>

                  {/* Info principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-[#13193a]">{aj.nombre}</p>
                      {!aj.disponible && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">Inactivo</span>
                      )}
                      {lleno && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">Sin capacidad</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{aj.zona} · {aj.telefono}</p>

                    {/* Barra de carga */}
                    <div className="mt-3 space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-500">Carga</span>
                        <span className={`font-bold ${lleno ? "text-red-600" : aj.activos === 0 ? "text-gray-400" : "text-blue-600"}`}>
                          {aj.activos}/{MAX_ACTIVOS} siniestros
                        </span>
                      </div>
                      <BarraCarga activos={aj.activos} max={MAX_ACTIVOS}/>
                    </div>
                  </div>

                  {/* Stats derecha */}
                  <div className="text-right shrink-0 space-y-1">
                    <Estrellas n={aj.calificacion}/>
                    <p className="text-[11px] text-gray-400">{aj.tiempoPromedio} prom.</p>
                    <p className="text-[11px] text-gray-400">{aj.completados} completados</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detalle del ajustador seleccionado */}
        {seleccionado && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" style={{ maxHeight:"75vh" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div>
                <p className="text-sm font-bold text-[#13193a]">{seleccionado.nombre}</p>
                <p className="text-xs text-gray-400 mt-0.5">{seleccionado.zona}</p>
              </div>
              <button onClick={() => setSeleccionado(null)} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Estadísticas */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { l:"Activos",      v:seleccionado.activos,        color:"text-blue-700"   },
                  { l:"Completados",  v:seleccionado.completados,    color:"text-emerald-700" },
                  { l:"Tiempo prom.", v:seleccionado.tiempoPromedio, color:"text-[#13193a]"   },
                ].map(s => (
                  <div key={s.l} className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                    <p className={`text-xl font-bold ${s.color}`}>{s.v}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{s.l}</p>
                  </div>
                ))}
              </div>

              {/* Siniestros activos */}
              {seleccionado.siniestrosActivos.length > 0 ? (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Siniestros activos</p>
                  <div className="space-y-2">
                    {seleccionado.siniestrosActivos.map((s, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-xs font-bold text-[#13193a]">{s.folio}</p>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_CLS[s.estatus] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>{s.estatus}</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">{s.asegurado} · {s.tipo}</p>
                        </div>
                        <p className="text-xs text-gray-400 shrink-0">Desde {s.inicio}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-gray-400">
                  <svg className="w-8 h-8 text-gray-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Sin siniestros activos — disponible
                </div>
              )}

              {/* Historial reciente */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Historial reciente</p>
                <div className="space-y-2">
                  {seleccionado.historial.map((h, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-xs font-bold text-[#13193a]">{h.folio}</p>
                          <p className="text-xs text-gray-500">{h.tipo}</p>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">{h.fecha} · {h.duracion}</p>
                      </div>
                      <Estrellas n={h.calif}/>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}