// ============================================================
// src/features/ajustador/CapturaDatos.jsx
// Paso 2: Datos del siniestro (afectados + póliza)
// ============================================================
import { useState } from "react";
import { Campo, Seccion, AfectadoTag } from "./shared";

export default function CapturaDatos({ siniestro, onSiguiente }) {
  const [afectadoActivo, setAfectadoActivo] = useState("NA");
  const [afectados, setAfectados] = useState([
    { id: "NA",  label: "NA",   nombre: "", rfc: "", curp: "", direccion: "", telefono: "" },
    { id: "AF1", label: "AF 1", nombre: "", rfc: "", curp: "", direccion: "", telefono: "" },
  ]);

  const idx    = afectados.findIndex(a => a.id === afectadoActivo);
  const actual = afectados[idx];
  const setF   = (campo, val) => setAfectados(arr => arr.map((a, i) => i === idx ? { ...a, [campo]: val } : a));

  const agregarAfectado = () => {
    const n     = afectados.filter(a => a.id !== "NA").length + 1;
    const nuevo = { id: `AF${n}`, label: `AF ${n}`, nombre: "", rfc: "", curp: "", direccion: "", telefono: "" };
    setAfectados(arr => [...arr, nuevo]);
    setAfectadoActivo(nuevo.id);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

        {/* Selector de afectados */}
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Afectado</label>
          <div className="flex items-center gap-2 flex-wrap">
            {afectados.map(a => (
              <AfectadoTag key={a.id} label={a.label} active={afectadoActivo === a.id} onClick={() => setAfectadoActivo(a.id)}/>
            ))}
            <button onClick={agregarAfectado}
              className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 text-gray-400 hover:border-[#13193a]/40 hover:text-[#13193a] flex items-center justify-center font-bold text-lg transition-all"
              title="Agregar afectado">+</button>
          </div>
        </div>

        {/* Datos personales */}
        <Seccion titulo={`1. Datos Personales — ${actual?.label}`}>
          <div className="space-y-3">
            <Campo label="Nombre completo" placeholder="Nombre del afectado"  value={actual?.nombre}    onChange={v => setF("nombre", v)}/>
            <Campo label="RFC"             placeholder="RFC"                  value={actual?.rfc}       onChange={v => setF("rfc", v)}/>
            <Campo label="CURP"            placeholder="CURP"                 value={actual?.curp}      onChange={v => setF("curp", v)}/>
            <Campo label="Dirección"       placeholder="Dirección"            value={actual?.direccion} onChange={v => setF("direccion", v)}/>
            <Campo label="Teléfono"        placeholder="55 0000 0000" type="tel" value={actual?.telefono} onChange={v => setF("telefono", v)}/>
          </div>
        </Seccion>

        {/* Datos de póliza */}
        <Seccion titulo="2. Datos de Póliza">
          <div className="space-y-3">
            <Campo label="No. Póliza" value={siniestro.poliza}  readonly/>
            <Campo label="Vigencia"   value={siniestro.vigencia} readonly/>
          </div>
        </Seccion>

        {/* Declaraciones (no para NA) */}
        {afectadoActivo !== "NA" && (
          <Seccion titulo="3. Declaraciones Iniciales">
            <Campo label="Versión de los hechos según el afectado" placeholder="Describir lo sucedido..." rows={3}/>
          </Seccion>
        )}
      </div>

      <div className="px-4 py-4 border-t border-gray-100 bg-white shrink-0">
        <button onClick={onSiguiente}
          className="w-full py-3.5 rounded-2xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-[#13193a]/15">
          Continuar a Evidencia →
        </button>
      </div>
    </div>
  );
}
