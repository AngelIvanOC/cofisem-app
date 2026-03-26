// ============================================================
// src/features/ajustador/siniestros/SiniestrosPage.jsx
// Vista split: lista izquierda + flujo de pasos derecha
// ============================================================
import { useState } from "react";
import Badge from "../../../shared/ui/Badge";
import StepBar, { PASOS } from "./pasos/StepBar";
import ConfirmarArribo from "./pasos/ConfirmarArribo";
import CapturaDatos from "./pasos/CapturaDatos";
import CapturaEvidencia from "./pasos/CapturaEvidencia";
import ModeloDanos from "./pasos/ModeloDanos";
import GenerarDocumentos from "./pasos/GenerarDocumentos";

const MIS_SINIESTROS = [
  {
    folio:"SIN-087", asegurado:"Roberto Díaz Ramos",  poliza:"3413167", tipo:"Robo parcial",
    fecha:"20/03/2026", hora:"08:32", lugar:"Centro Histórico, Cuernavaca",
    descripcion:"Le robaron la llanta de refacción y el estéreo mientras el vehículo estaba estacionado.",
    placas:"CHM-456B", vehiculo:"Toyota Corolla 2019", cobertura:"SERV. PÚB. 50/50 GAMAN 2", vigencia:"11/03/2027",
    ajustador:"Roberto Vega", estatus:"Asignado", tercero:null, notas:null,
  },
  {
    folio:"SIN-083", asegurado:"Lucía Peña Torres",   poliza:"3409005", tipo:"Colisión",
    fecha:"18/03/2026", hora:"15:20", lugar:"Blvd. Cuauhnáhuac, km 3",
    descripcion:"Impacto lateral. El asegurado pasó un alto.",
    placas:"MOR-9921", vehiculo:"Chevrolet Spark 2021", cobertura:"TAXI BÁSICA 2500", vigencia:"05/12/2026",
    ajustador:"Roberto Vega", estatus:"En proceso", tercero:{ nombre:"Pedro Ávila", placas:"MOR-4412", vehiculo:"VW Polo 2019", tel:"777-332-1100", lesionados:false },
    notas:"Tercero ya interpuso queja en CONDUSEF.",
  },
  {
    folio:"SIN-079", asegurado:"Ernesto Reyes Luna",  poliza:"3407441", tipo:"Daños a terceros",
    fecha:"15/03/2026", hora:"11:05", lugar:"Col. Lomas de Cortés, Cuernavaca",
    descripcion:"Al retroceder golpeó la barda del vecino causando daños en la estructura.",
    placas:"VRM-5544", vehiculo:"Nissan March 2018", cobertura:"TAXI BÁSICA 2500", vigencia:"02/10/2026",
    ajustador:"Roberto Vega", estatus:"En proceso", tercero:{ nombre:"Vecino Propietario", placas:"N/A", vehiculo:"Propiedad fija", tel:"777-000-1234", lesionados:false },
    notas:null,
  },
];

const PASO_KEYS = PASOS.map((p) => p.key);

const ESTATUS_ORDEN = { "Asignado": 0, "En proceso": 1, "Cerrado": 2, "Cancelado": 3 };

export default function AjustadorSiniestros() {
  const [siniestros,  setSiniestros]  = useState(MIS_SINIESTROS);
  const [seleccionado,setSeleccionado]= useState(null);
  const [pasoIdx,     setPasoIdx]     = useState(0);
  const [datos,       setDatos]       = useState({});   // datos acumulados de todos los pasos

  const seleccionar = (s) => { setSeleccionado(s); setPasoIdx(0); setDatos({}); };

  const siguiente = (datosDelPaso) => {
    setDatos((prev) => ({ ...prev, [PASO_KEYS[pasoIdx]]: datosDelPaso }));
    if (pasoIdx < PASO_KEYS.length - 1) {
      setPasoIdx(pasoIdx + 1);
      setSiniestros((ss) => ss.map((s) => s.folio === seleccionado.folio ? { ...s, estatus: "En proceso" } : s));
    }
  };

  const anterior = () => pasoIdx > 0 && setPasoIdx(pasoIdx - 1);

  const finalizar = (datosFinales) => {
    setDatos((prev) => ({ ...prev, resolucion: datosFinales }));
    setSiniestros((ss) => ss.map((s) => s.folio === seleccionado.folio ? { ...s, estatus: "Cerrado" } : s));
    setSeleccionado(null);
    setPasoIdx(0);
    setDatos({});
  };

  const sorted = [...siniestros].sort((a, b) => (ESTATUS_ORDEN[a.estatus] ?? 9) - (ESTATUS_ORDEN[b.estatus] ?? 9));

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden">
      {/* ── Lista izquierda ── */}
      <div className={`flex flex-col bg-white border-r border-gray-100 transition-all ${seleccionado ? "w-80 shrink-0" : "flex-1"}`}>
        <div className="px-5 py-4 border-b border-gray-100 shrink-0">
          <h1 className="text-lg font-bold text-[#13193a]">Mis siniestros</h1>
          <p className="text-xs text-gray-400 mt-0.5">{siniestros.filter((s) => s.estatus !== "Cerrado").length} activos</p>
        </div>
        <div className="flex-1 overflow-auto divide-y divide-gray-50">
          {sorted.map((s) => {
            const activo = seleccionado?.folio === s.folio;
            return (
              <button
                key={s.folio}
                onClick={() => seleccionar(s)}
                className={`w-full text-left px-4 py-4 hover:bg-gray-50/70 transition-colors ${activo ? "bg-[#13193a]/5 border-l-2 border-[#13193a]" : ""}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-xs font-bold text-[#13193a] font-mono">{s.folio}</p>
                  <Badge estatus={s.estatus} showDot />
                </div>
                <p className="text-sm font-semibold text-gray-700 leading-snug">{s.asegurado}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.tipo} · {s.fecha}</p>
                {s.tercero?.lesionados && (
                  <span className="inline-flex mt-1.5 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                    ⚠ Lesionados
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Panel de pasos (derecha) ── */}
      {seleccionado ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 shrink-0">
            <button onClick={() => setSeleccionado(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
              </svg>
            </button>
            <div className="flex-1">
              <p className="text-sm font-bold text-[#13193a]">{seleccionado.asegurado}</p>
              <p className="text-xs text-gray-400 font-mono">{seleccionado.folio} · {seleccionado.tipo}</p>
            </div>
          </div>

          {/* Stepper */}
          <div className="bg-white border-b border-gray-100 px-6 py-4 shrink-0">
            <StepBar pasoActual={PASO_KEYS[pasoIdx]} />
          </div>

          {/* Contenido del paso */}
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-base font-bold text-[#13193a] mb-4">{PASOS[pasoIdx].label}</h2>
              {pasoIdx === 0 && <ConfirmarArribo siniestro={seleccionado} onSiguiente={siguiente} />}
              {pasoIdx === 1 && <CapturaDatos siniestro={seleccionado} onSiguiente={siguiente} onAnterior={anterior} />}
              {pasoIdx === 2 && <CapturaEvidencia onSiguiente={siguiente} onAnterior={anterior} />}
              {pasoIdx === 3 && <ModeloDanos onSiguiente={siguiente} onAnterior={anterior} />}
              {pasoIdx === 4 && (
                <GenerarDocumentos
                  siniestro={seleccionado}
                  datosAcumulados={datos}
                  onFinalizar={finalizar}
                  onAnterior={anterior}
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center p-8">
          <div>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-400">Selecciona un siniestro de la lista</p>
            <p className="text-xs text-gray-300 mt-1">para iniciar el flujo de atención</p>
          </div>
        </div>
      )}
    </div>
  );
}
