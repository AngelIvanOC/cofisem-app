// ============================================================
// src/features/ajustador/siniestros/pasos/GenerarDocumentos.jsx
// Paso 5: Tipo de resolución y generación de documentos
// ============================================================
import { useState } from "react";

const RESOLUCIONES = [
  { key:"valuacion",   label:"Orden de valuación",  desc:"Enviar al taller para presupuesto de reparación",       icon:"🔧" },
  { key:"reparacion",  label:"Orden de reparación",  desc:"Autorizar reparación directa en taller convenio",       icon:"⚙️" },
  { key:"pago",        label:"Pago directo",          desc:"Liquidación económica al asegurado o tercero",          icon:"💰" },
  { key:"medico",      label:"Servicio médico",       desc:"Canalización a médico o reembolso de gastos médicos",   icon:"🏥" },
  { key:"grua",        label:"Servicio de grúa",      desc:"Solicitar grúa para traslado del vehículo",             icon:"🚛" },
  { key:"juridico",    label:"Asistencia jurídica",   desc:"Canalizar a área jurídica o abogado externo",           icon:"⚖️" },
];

export default function GenerarDocumentos({ siniestro, datosAcumulados, onFinalizar, onAnterior }) {
  const [resolucion, setResolucion] = useState(null);
  const [taller,     setTaller]     = useState("");
  const [monto,      setMonto]      = useState("");
  const [observ,     setObserv]     = useState("");
  const [generando,  setGenerando]  = useState(false);

  const finalizar = () => {
    setGenerando(true);
    setTimeout(() => {
      onFinalizar({ resolucion: resolucion?.key, taller, monto, observ });
      setGenerando(false);
    }, 1000);
  };

  const requiereTaller = ["valuacion","reparacion"].includes(resolucion?.key);
  const requiereMonto  = ["pago","medico"].includes(resolucion?.key);
  const valido = resolucion && (requiereTaller ? taller : true) && (requiereMonto ? monto : true);

  return (
    <div className="space-y-5">
      {/* Resumen del caso */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-2 text-xs">
        <p className="font-bold text-[#13193a] text-sm mb-2">Resumen del caso</p>
        {[
          ["Folio",           siniestro.folio],
          ["Asegurado",       siniestro.asegurado],
          ["Tipo",            siniestro.tipo],
          ["Daños registrados", Object.keys(datosAcumulados.danos ?? {}).length + " zona(s)"],
          ["Evidencia",       datosAcumulados.evidencia ? Object.values(datosAcumulados.evidencia.checklist).filter(Boolean).length + " fotos / docs confirmados" : "—"],
        ].map(([l, v]) => (
          <div key={l} className="flex justify-between">
            <span className="text-gray-400 font-semibold">{l}</span>
            <span className="text-[#13193a] font-semibold">{v}</span>
          </div>
        ))}
      </div>

      {/* Tipo de resolución */}
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-3">Tipo de resolución <span className="text-red-400">*</span></p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {RESOLUCIONES.map((r) => (
            <button
              key={r.key}
              onClick={() => setResolucion(r)}
              className={[
                "flex items-start gap-3 p-3.5 rounded-2xl border-2 text-left transition-all",
                resolucion?.key === r.key ? "border-[#13193a] bg-[#13193a]/5" : "border-gray-100 hover:border-gray-200 bg-white",
              ].join(" ")}
            >
              <span className="text-xl shrink-0 mt-0.5">{r.icon}</span>
              <div>
                <p className="text-sm font-bold text-[#13193a]">{r.label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{r.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Campos condicionales */}
      {requiereTaller && (
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">
            Taller asignado <span className="text-red-400">*</span>
          </label>
          <input value={taller} onChange={(e) => setTaller(e.target.value)} placeholder="Nombre del taller convenio..."
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 focus:outline-none focus:border-[#13193a] text-sm transition-colors" />
        </div>
      )}
      {requiereMonto && (
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">
            Monto estimado (MXN) <span className="text-red-400">*</span>
          </label>
          <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 focus:outline-none focus:border-[#13193a] text-sm transition-colors" />
        </div>
      )}
      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Observaciones finales</label>
        <textarea rows={2} value={observ} onChange={(e) => setObserv(e.target.value)} placeholder="Notas para el expediente..."
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm resize-none focus:outline-none focus:border-[#13193a] transition-colors" />
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onAnterior} className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">← Atrás</button>
        <button onClick={finalizar} disabled={!valido || generando} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all disabled:opacity-40 shadow-lg shadow-emerald-600/15">
          {generando ? "Cerrando caso..." : "✓ Cerrar caso"}
        </button>
      </div>
    </div>
  );
}
