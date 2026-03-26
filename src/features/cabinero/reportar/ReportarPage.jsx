// ============================================================
// src/features/cabinero/reportar/ReportarPage.jsx
// Orquestador: paso 1 buscar póliza -> paso 2 form -> éxito
// ============================================================
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FormBuscarPoliza from "./FormBuscarPoliza";
import FormSiniestro from "./FormSiniestro";

const PASOS = ["Buscar póliza", "Datos del siniestro", "Confirmación"];

export default function ReportarPage() {
  const [paso,       setPaso]       = useState(0);
  const [poliza,     setPoliza]     = useState(null);
  const [siniestro,  setSiniestro]  = useState(null);
  const navigate = useNavigate();

  const handlePoliza = (p) => { setPoliza(p); setPaso(1); };
  const handleGuardar = (s) => { setSiniestro(s); setPaso(2); };

  return (
    <div className="p-6 min-h-full bg-gray-50">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header + stepper */}
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Reportar siniestro</h1>
          <p className="text-gray-400 text-sm mt-0.5">Registra un nuevo siniestro de un asegurado</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-0">
          {PASOS.map((p, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2.5 shrink-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < paso ? "bg-emerald-500 text-white" : i === paso ? "bg-[#13193a] text-white" : "bg-gray-200 text-gray-400"}`}>
                  {i < paso ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  ) : i + 1}
                </div>
                <span className={`text-xs font-semibold ${i === paso ? "text-[#13193a]" : "text-gray-400"}`}>{p}</span>
              </div>
              {i < PASOS.length - 1 && <div className={`flex-1 h-0.5 mx-3 ${i < paso ? "bg-emerald-400" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        {/* Contenido por paso */}
        {paso === 0 && <FormBuscarPoliza onPolizaSeleccionada={handlePoliza} />}
        {paso === 1 && poliza && <FormSiniestro poliza={poliza} onGuardar={handleGuardar} onVolver={() => setPaso(0)} />}

        {/* Confirmación */}
        {paso === 2 && siniestro && (
          <div className="bg-white rounded-2xl border border-emerald-200 p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <p className="text-xl font-bold text-[#13193a]">Siniestro reportado</p>
              <p className="text-sm text-gray-400 mt-1">Folio asignado: <span className="font-mono font-bold text-[#13193a]">{siniestro.folio}</span></p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm">
              {[["Asegurado", siniestro.asegurado], ["Póliza", siniestro.poliza], ["Tipo", siniestro.tipo], ["Fecha/Hora", `${siniestro.fecha} ${siniestro.hora}`]].map(([l, v]) => (
                <div key={l} className="flex justify-between">
                  <span className="text-gray-400 font-semibold">{l}</span>
                  <span className="text-[#13193a] font-semibold">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setPaso(0); setPoliza(null); setSiniestro(null); }} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Reportar otro
              </button>
              <button onClick={() => navigate("/siniestros")} className="flex-1 py-3 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all">
                Ver siniestros
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
