import { useState } from "react";
import { CampoTexto, CampoSelect } from "../../../shared/forms/Campos";
import TerceroCard from "./TerceroCard";

const TIPOS = ["Colisión","Daño a terceros","Robo total","Robo parcial","Cristales","Daños por fenómeno natural","Responsabilidad civil","Gastos médicos","Asistencia vial","Otro"];
const TERCERO_INIT = { nombre:"", telefono:"", placas:"", modelo:"", danos:"" };

export default function FormSiniestro({ poliza, onConfirmar, onVolver }) {
  const [tipo,       setTipo]    = useState("");
  const [fecha,      setFecha]   = useState(new Date().toISOString().slice(0,16));
  const [ubicacion,  setUbic]    = useState("");
  const [descripcion,setDesc]    = useState("");
  const [conTercero, setConT]    = useState(false);
  const [tercero,    setTercero] = useState(TERCERO_INIT);
  const [enviando,   setEnv]     = useState(false);
  const [folio,      setFolio]   = useState(null);

  const valido = tipo && fecha && ubicacion && descripcion;

  const enviar = () => {
    if (!valido) return;
    setEnv(true);
    setTimeout(() => { setFolio(`SN-${Math.floor(10000 + Math.random() * 9000)}`); setEnv(false); }, 800);
  };

  if (folio) return (
    <div className="flex flex-col items-center justify-center gap-6 py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
      </div>
      <div>
        <p className="text-2xl font-bold text-[#13193a]">Siniestro reportado</p>
        <p className="text-gray-400 text-sm mt-1">El siniestro fue registrado correctamente</p>
        <p className="mt-4 font-mono text-xl font-bold tracking-widest text-[#13193a] bg-gray-100 px-5 py-2.5 rounded-xl inline-block">{folio}</p>
      </div>
      <button onClick={onConfirmar} className="px-8 py-3 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all">Ver en siniestros</button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 text-blue-600">📋</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-[#13193a]">{poliza.asegurado}</p>
          <p className="text-[11px] text-blue-600 font-mono">{poliza.id} · {poliza.placas} · {poliza.vehiculo}</p>
        </div>
        <button onClick={onVolver} className="text-[11px] text-blue-500 font-semibold hover:underline shrink-0">Cambiar</button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <CampoSelect label="Tipo de siniestro" value={tipo}  onChange={setTipo}  opciones={["", ...TIPOS]} req/>
        <CampoTexto  label="Fecha y hora"      value={fecha} onChange={setFecha} type="datetime-local" req/>
        <div className="col-span-2"><CampoTexto label="Ubicación" value={ubicacion}  onChange={setUbic} placeholder="Calle, colonia, ciudad..." req/></div>
        <div className="col-span-2"><CampoTexto label="Descripción" value={descripcion} onChange={setDesc} placeholder="Describe brevemente lo ocurrido..." rows={3} req/></div>
      </div>
      <div>
        <label className="flex items-center gap-2.5 cursor-pointer mb-3 select-none">
          <div onClick={() => setConT(!conTercero)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${conTercero ? "bg-[#13193a] border-[#13193a]" : "border-gray-300"}`}>
            {conTercero && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
          </div>
          <span className="text-sm font-semibold text-gray-700">¿Hay tercero involucrado?</span>
        </label>
        {conTercero && <TerceroCard tercero={tercero} onChange={setTercero}/>}
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onVolver} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all">Volver</button>
        <button onClick={enviar} disabled={!valido || enviando} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 transition-all">
          {enviando ? "Registrando..." : "Registrar siniestro"}
        </button>
      </div>
    </div>
  );
}
