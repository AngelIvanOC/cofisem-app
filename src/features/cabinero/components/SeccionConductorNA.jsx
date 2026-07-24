import { useState } from "react";
import { Pencil, X } from "lucide-react";
import Seccion from "./Seccion";
import { INP, INP_RO, LBL } from "../constants/estilos";

// Un solo elemento con un solo onClick — nada de <button> anidado
// dentro de un <label> (eso hace que el navegador reenvíe el click al
// control interno, disparando onToggle 2 veces por click y dejando el
// checkbox "trabado" en clicks seguidos).
function Checkbox({ checked, onToggle, label }) {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
      className="flex items-center gap-2 cursor-pointer shrink-0 pb-2.5 sm:pl-2 select-none"
    >
      <span
        className={[
          "w-4 h-4 rounded border-2 flex items-center justify-center transition-all shrink-0",
          checked
            ? "bg-[#13193a] border-[#13193a]"
            : "bg-white border-gray-300 hover:border-gray-400",
        ].join(" ")}
      >
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      <span className="text-xs font-medium text-gray-600">{label}</span>
    </div>
  );
}

// Modal chico para corregir solo el teléfono precargado del asegurado —
// el nombre no se edita desde aquí, viene de la póliza.
function ModalEditarTelefono({ valorInicial, onGuardar, onCerrar }) {
  const [valor, setValor] = useState(valorInicial);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onCerrar}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-[#13193a]">Editar teléfono</p>
          <button type="button" onClick={onCerrar} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <input
          type="tel"
          autoFocus
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="55 0000 0000"
          className={INP}
        />
        <button
          type="button"
          onClick={() => onGuardar(valor)}
          className="w-full mt-4 py-2.5 rounded-xl bg-[#13193a] text-white text-sm font-bold hover:bg-[#1e2a50] transition-all"
        >
          Guardar
        </button>
      </div>
    </div>
  );
}

export default function SeccionConductorNA({ data, onChange, asegurado }) {
  const set = (k, v) => onChange({ ...data, [k]: v });
  const [editandoTelefono, setEditandoTelefono] = useState(false);

  const toggleOperadorEsOtro = () => {
    const next = !data.operadorEsOtro;
    onChange({
      ...data,
      operadorEsOtro: next,
      nombre:   next ? "" : (asegurado?.nombre   ?? ""),
      telefono: next ? "" : (asegurado?.telefono ?? ""),
    });
  };

  return (
    <Seccion titulo="Conductor del Asegurado (NA / Operador)">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <label className={LBL}>Nombre del conductor</label>
            {data.operadorEsOtro ? (
              <input
                value={data.nombre}
                onChange={(e) => set("nombre", e.target.value)}
                placeholder="Nombre completo"
                className={INP}
              />
            ) : (
              <input readOnly value={data.nombre} className={INP_RO} />
            )}
          </div>
          <div className="flex-1">
            <label className={LBL}>Teléfono</label>
            {data.operadorEsOtro ? (
              <input
                type="tel"
                value={data.telefono}
                onChange={(e) => set("telefono", e.target.value)}
                placeholder="55 0000 0000"
                className={INP}
              />
            ) : (
              <div className="relative">
                <input readOnly value={data.telefono} className={INP_RO + " pr-8"} />
                <button
                  type="button"
                  onClick={() => setEditandoTelefono(true)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#13193a]/40 hover:text-[#13193a]"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          <Checkbox
            checked={data.operadorEsOtro}
            onToggle={toggleOperadorEsOtro}
            label="El operador no es el asegurado"
          />
        </div>

        <div className="pt-3 border-t border-gray-100 space-y-2">
          <p className={LBL + " mb-0"}>Contacto de cabina (opcional)</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={data.cabinaNombre}
              onChange={(e) => set("cabinaNombre", e.target.value)}
              placeholder="Nombre"
              className={INP + " flex-1"}
            />
            <input
              type="tel"
              value={data.cabinaTelefono}
              onChange={(e) => set("cabinaTelefono", e.target.value)}
              placeholder="55 0000 0000"
              className={INP + " flex-1"}
            />
          </div>
        </div>
      </div>

      {editandoTelefono && (
        <ModalEditarTelefono
          valorInicial={data.telefono}
          onGuardar={(v) => { set("telefono", v); setEditandoTelefono(false); }}
          onCerrar={() => setEditandoTelefono(false)}
        />
      )}
    </Seccion>
  );
}
