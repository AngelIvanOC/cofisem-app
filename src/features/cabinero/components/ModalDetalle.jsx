import { useState } from "react";
import { STATUS_CLS } from "../constants/estilos";
import PanelAsignar from "./PanelAsignar";

export default function ModalDetalle({ s, onClose, onAsignar }) {
  const [modoAsignar, setModoAsignar] = useState(!s.ajustador);

  const etapas = [
    { label: "Reportado",  time: "17/03/26 10:30", done: true           },
    { label: "Arribo",     time: "Pendiente",       done: !!s.ajustador  },
    { label: "En proceso", time: "Pendiente",       done: false          },
    { label: "Cerrado",    time: "Pendiente",       done: false          },
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
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#13193a]/8 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#13193a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-sm font-bold text-[#13193a]">Detalle del siniestro</h2>
                <span className={`inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_CLS[s.estatus] ?? "bg-gray-100 text-gray-600"}`}>
                  {s.estatus}
                </span>
                {!s.ajustador && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Sin ajustador
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Folio <span className="font-mono font-semibold">{s.folio}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body 2 columnas */}
        <div className="flex flex-1 overflow-hidden">
          {/* Izquierda */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Información</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  ["Asegurado", s.asegurado],
                  ["Vehículo",  s.vehiculo],
                  ["Fecha",     s.fecha],
                  ["Teléfono",  "777 100 2233"],
                  ["Póliza",    "3413241"],
                  ["Cobertura", "TAXI BÁSICA 2500"],
                ].map(([l, v]) => (
                  <div key={l}>
                    <p className="text-[11px] text-gray-400 mb-0.5">{l}</p>
                    <p className="text-sm font-semibold text-gray-700">{v}</p>
                  </div>
                ))}
                <div className="col-span-2">
                  <p className="text-[11px] text-gray-400 mb-0.5">Ubicación</p>
                  <p className="text-sm text-gray-700">{s.ubicacion}</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Documentos</p>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">0 / 4 subidos</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  ["Póliza",      "📄"],
                  ["Evidencia",   "📷"],
                  ["No. Serie",   "🪪"],
                  ["Licencia(s)", "🪪"],
                ].map(([l, ic]) => (
                  <div key={l} className="border-2 border-dashed border-gray-200 rounded-xl p-3 flex flex-col items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-lg">{ic}</div>
                    <p className="text-[11px] text-gray-400 text-center">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Derecha */}
          <div className="w-64 shrink-0 overflow-y-auto p-5 space-y-5 bg-gray-50/50 border-l border-gray-100">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Seguimiento</p>
              {etapas.map((e, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${e.done ? "border-emerald-500 bg-emerald-500" : "border-gray-300 bg-white"}`}>
                      {e.done && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                      )}
                    </div>
                    {i < etapas.length - 1 && (
                      <div className={`w-0.5 h-7 my-1 rounded-full ${e.done ? "bg-emerald-200" : "bg-gray-200"}`} />
                    )}
                  </div>
                  <div className="pb-1">
                    <p className={`text-xs font-semibold ${e.done ? "text-[#13193a]" : "text-gray-400"}`}>{e.label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{e.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Ajustador</p>
              {s.ajustador && !modoAsignar ? (
                <>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#13193a] flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {s.ajustador.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#13193a]">{s.ajustador}</p>
                      <p className="text-[11px] text-gray-400">Asignado</p>
                    </div>
                  </div>
                  <span className="inline-flex text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-semibold">
                    Pendiente de arribo
                  </span>
                  <button
                    onClick={() => setModoAsignar(true)}
                    className="w-full text-xs text-gray-400 hover:text-[#13193a] font-medium mt-1"
                  >
                    Cambiar ajustador
                  </button>
                </>
              ) : !s.ajustador && !modoAsignar ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2.5 bg-red-50 rounded-xl border border-red-200">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                    <p className="text-xs text-red-700 font-bold">Sin ajustador</p>
                  </div>
                  <button
                    onClick={() => setModoAsignar(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-xs font-bold transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                    </svg>
                    Asignar ajustador
                  </button>
                </div>
              ) : null}
              {modoAsignar && (
                <PanelAsignar
                  s={s}
                  onConfirmar={(nombre) => {
                    onAsignar(s.folio, nombre);
                    setModoAsignar(false);
                  }}
                  onCancelar={() => setModoAsignar(false)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex items-center justify-between bg-white">
          <p className="text-xs text-gray-400">Última actualización: hoy</p>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-xs font-semibold transition-all">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
            </svg>
            Descargar reporte
          </button>
        </div>
      </div>
    </div>
  );
}
