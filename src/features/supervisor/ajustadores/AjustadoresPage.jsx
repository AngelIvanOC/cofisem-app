// ============================================================
// src/features/supervisor/ajustadores/AjustadoresPage.jsx
// Supervisor: Gestión de carga y perfil de cada ajustador
// ============================================================
import { useState } from "react";
import PerfilAjustador from "./PerfilAjustador";

const AJUSTADORES = [
  {
    id:"AJU-01", nombre:"Roberto Vega",    tel:"777-100-0001", zona:"Cuernavaca Norte",
    activos:3, disponibles:2, cerradosMes:12, tiempoProm:"2.1h",
    casos:[
      { folio:"SIN-087", tipo:"Robo parcial",     asegurado:"Roberto Díaz",   fecha:"20/03/2026", estatus:"Asignado",   lesionados:false },
      { folio:"SIN-083", tipo:"Colisión",          asegurado:"Lucía Peña",     fecha:"18/03/2026", estatus:"En proceso", lesionados:false },
      { folio:"SIN-080", tipo:"Daños a terceros",  asegurado:"Felipe Guerrero",fecha:"15/03/2026", estatus:"En proceso", lesionados:false },
    ],
  },
  {
    id:"AJU-02", nombre:"Sandra Moreno",   tel:"777-100-0002", zona:"Cuernavaca Sur",
    activos:1, disponibles:4, cerradosMes:8, tiempoProm:"2.8h",
    casos:[
      { folio:"SIN-086", tipo:"Daños a terceros", asegurado:"Carmen López",   fecha:"19/03/2026", estatus:"En proceso", lesionados:false },
    ],
  },
  {
    id:"AJU-03", nombre:"Felipe Castillo", tel:"777-100-0003", zona:"Temixco / Jiutepec",
    activos:5, disponibles:1, cerradosMes:9, tiempoProm:"3.2h",
    casos:[
      { folio:"SIN-085", tipo:"Robo total",        asegurado:"José Martínez",  fecha:"19/03/2026", estatus:"En proceso", lesionados:false },
      { folio:"SIN-082", tipo:"Colisión",          asegurado:"Andrés Ruiz",    fecha:"17/03/2026", estatus:"En proceso", lesionados:true  },
      { folio:"SIN-081", tipo:"Volcadura",         asegurado:"Graciela Nava",  fecha:"17/03/2026", estatus:"En proceso", lesionados:true  },
      { folio:"SIN-078", tipo:"Cristales",         asegurado:"Omar Vázquez",   fecha:"14/03/2026", estatus:"En proceso", lesionados:false },
      { folio:"SIN-075", tipo:"Robo parcial",      asegurado:"Itzel Sánchez",  fecha:"12/03/2026", estatus:"Asignado",   lesionados:false },
    ],
  },
  {
    id:"AJU-04", nombre:"Diana Ríos",      tel:"777-100-0004", zona:"Cuautla / Yecapixtla",
    activos:0, disponibles:5, cerradosMes:18, tiempoProm:"1.9h",
    casos:[],
  },
];

const CARGA_LABEL = { 0:"Libre", 1:"Baja", 2:"Baja", 3:"Media", 4:"Alta", 5:"Máxima" };
const CARGA_CLS   = (n) => n >= 5 ? "bg-red-50 text-red-600 border-red-200" : n >= 3 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200";
const BARRA_CLS   = (n) => n >= 5 ? "bg-red-400" : n >= 3 ? "bg-amber-400" : "bg-emerald-400";

export default function AjustadoresPage() {
  const [perfil, setPerfil] = useState(null);

  const totalActivos = AJUSTADORES.reduce((s, a) => s + a.activos, 0);
  const disponibles  = AJUSTADORES.filter((a) => a.activos < 5).length;

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Ajustadores</h1>
          <p className="text-gray-400 text-sm mt-0.5">Carga de trabajo y disponibilidad</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-center">
            <p className="text-xl font-bold text-blue-700">{totalActivos}</p>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mt-0.5">Casos activos</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-center">
            <p className="text-xl font-bold text-emerald-700">{disponibles}</p>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mt-0.5">Disponibles</p>
          </div>
        </div>
      </div>

      {/* Tarjetas de ajustadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {AJUSTADORES.map((a) => (
          <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header tarjeta */}
            <div className="p-5 border-b border-gray-50">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#13193a] text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {a.nombre.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#13193a]">{a.nombre}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{a.zona}</p>
                  </div>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${CARGA_CLS(a.activos)}`}>
                  {CARGA_LABEL[Math.min(a.activos, 5)]}
                </span>
              </div>

              {/* Barra de carga */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-400">{a.activos} activos / 6 max</span>
                  <span className="text-gray-400">{a.disponibles} disponibles</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${BARRA_CLS(a.activos)}`}
                    style={{ width: `${Math.min((a.activos / 6) * 100, 100)}%` }} />
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-3 divide-x divide-gray-50">
              {[
                { l:"Activos",  v:a.activos      },
                { l:"Este mes", v:a.cerradosMes  },
                { l:"T. prom.", v:a.tiempoProm   },
              ].map((m) => (
                <div key={m.l} className="text-center py-3">
                  <p className="text-base font-bold text-[#13193a]">{m.v}</p>
                  <p className="text-[10px] text-gray-400 font-semibold">{m.l}</p>
                </div>
              ))}
            </div>

            {/* Casos con lesionados */}
            {a.casos.some((c) => c.lesionados) && (
              <div className="px-4 py-2.5 bg-red-50 border-t border-red-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <p className="text-[11px] font-semibold text-red-600">
                  {a.casos.filter((c) => c.lesionados).length} caso(s) con lesionados
                </p>
              </div>
            )}

            {/* Botón */}
            <div className="px-4 pb-4 pt-3">
              <button onClick={() => setPerfil(a)}
                className="w-full py-2 rounded-xl border border-[#13193a]/20 text-xs font-bold text-[#13193a] hover:bg-[#13193a]/5 transition-all">
                Ver perfil completo
              </button>
            </div>
          </div>
        ))}
      </div>

      {perfil && <PerfilAjustador ajustador={perfil} onClose={() => setPerfil(null)} />}
    </div>
  );
}
