// ============================================================
// src/features/supervisor/siniestros/PanelCanalizar.jsx
// Panel para canalizar siniestro a asistencia jurídica o abogado
// ============================================================
import { useState } from "react";
import { CampoTexto } from "../../../shared/forms/Campos";

const DESTINOS = [
  { key:"juridico_interno", label:"Jurídico interno",   desc:"Área legal de COFISEM",          icon:"🏢" },
  { key:"abogado_externo",  label:"Abogado externo",    desc:"Despacho externo convenio",       icon:"⚖️" },
  { key:"condusef",         label:"CONDUSEF",           desc:"Comisión Nacional de Seguros",    icon:"🏛️" },
  { key:"ministerio",       label:"Ministerio Público", desc:"Seguimiento a denuncia penal",    icon:"🚔" },
];

const ABOGADOS = ["Lic. Jorge Medina", "Lic. Ana Castellanos", "Despacho Vega & Asociados", "Lic. Rafael Torres"];

export default function PanelCanalizar({ siniestro, onClose, onConfirmar }) {
  const [destino,    setDestino]    = useState(null);
  const [abogado,    setAbogado]    = useState("");
  const [noExpediente, setNoExpediente] = useState("");
  const [instrucciones, setInstrucciones] = useState("");
  const [cargando,   setCargando]   = useState(false);

  const confirmar = () => {
    setCargando(true);
    setTimeout(() => { onConfirmar(siniestro.folio, { destino: destino.key, abogado, noExpediente, instrucciones }); }, 700);
  };

  const requiereAbogado = destino?.key === "abogado_externo";
  const valido = destino && (requiereAbogado ? abogado : true);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-sm bg-white shadow-2xl flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-[#13193a]">Canalizar caso</p>
            <p className="text-xs text-gray-400 mt-0.5">{siniestro?.folio} · {siniestro?.tipo}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {siniestro?.tercero?.lesionados && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-semibold">
              ⚠ Este siniestro tiene personas lesionadas
            </div>
          )}

          <div className="space-y-2">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Canalizar a</p>
            {DESTINOS.map((d) => (
              <button key={d.key} onClick={() => setDestino(d)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${destino?.key === d.key ? "border-[#13193a] bg-[#13193a]/5" : "border-gray-100 hover:border-gray-200"}`}>
                <span className="text-xl shrink-0">{d.icon}</span>
                <div>
                  <p className="text-sm font-bold text-[#13193a]">{d.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{d.desc}</p>
                </div>
                {destino?.key === d.key && (
                  <div className="ml-auto w-5 h-5 rounded-full bg-[#13193a] flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          {requiereAbogado && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Abogado asignado *</p>
              <div className="space-y-1.5">
                {ABOGADOS.map((a) => (
                  <button key={a} onClick={() => setAbogado(a)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl border-2 text-sm transition-all ${abogado === a ? "border-[#13193a] bg-[#13193a]/5 font-bold text-[#13193a]" : "border-gray-100 text-gray-600 hover:border-gray-200"}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}

          <CampoTexto label="No. expediente" value={noExpediente} onChange={setNoExpediente} placeholder="Número de expediente / folio externo" />
          <CampoTexto label="Instrucciones" value={instrucciones} onChange={setInstrucciones} placeholder="Indicaciones para el área receptora..." rows={2} />
        </div>

        <div className="px-4 py-4 border-t border-gray-100 flex gap-2.5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={confirmar} disabled={!valido || cargando}
            className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold transition-all disabled:opacity-40">
            {cargando ? "Canalizando..." : "Canalizar"}
          </button>
        </div>
      </div>
    </div>
  );
}
