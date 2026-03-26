import { useState } from "react";

const POLIZAS_MOCK = {
  "3413241": { asegurado:"Angel Ivan Ortega",  placas:"TRAMITE",  vehiculo:"Sedan 2022",  telefono:"777 100 2233", cobertura:"COBERTURA APP", estatus:"Vigente" },
  "3413167": { asegurado:"Roberto Díaz Ramos", placas:"CHM-456B", vehiculo:"Taxi 2020",   telefono:"777 200 1122", cobertura:"SERV. PÚB. 50/50", estatus:"Vigente" },
  "3413198": { asegurado:"María García López", placas:"VRM-123A", vehiculo:"Combi 2021",  telefono:"777 300 4455", cobertura:"TAXI BÁSICA 2500", estatus:"Vigente" },
};
const CLS = "block w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-[#13193a] cursor-default";

export default function FormBuscarPoliza({ onEncontrada }) {
  const [input,  setInput]  = useState("");
  const [result, setResult] = useState(null);
  const [error,  setError]  = useState("");

  const buscar = () => {
    const poliza = POLIZAS_MOCK[input.trim()];
    if (poliza) { setResult({ ...poliza, id: input.trim() }); setError(""); }
    else        { setResult(null); setError("No se encontró ninguna póliza activa con ese número."); }
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Número de póliza <span className="text-red-400">*</span></label>
        <div className="flex gap-2">
          <input value={input} onChange={(e) => { setInput(e.target.value); setResult(null); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && buscar()}
            placeholder="Ej. 3413241"
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/20 focus:border-[#13193a]/40"/>
          <button onClick={buscar} disabled={!input.trim()} className="px-5 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 transition-all">Buscar</button>
        </div>
      </div>
      {error && (
        <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
          {error}
        </div>
      )}
      {result && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              </div>
              <p className="text-sm font-bold text-[#13193a]">Póliza encontrada</p>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">{result.estatus}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[["Póliza",result.id],["Asegurado",result.asegurado],["Placas",result.placas],["Vehículo",result.vehiculo],["Teléfono",result.telefono],["Cobertura",result.cobertura]].map(([l,v]) => (
              <div key={l}><p className="text-[11px] text-gray-400 mb-1">{l}</p><input readOnly value={v} className={CLS}/></div>
            ))}
          </div>
          <button onClick={() => onEncontrada(result)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all">
            Continuar con esta póliza
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}
