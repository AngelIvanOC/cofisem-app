// ============================================================
// src/features/ajustador/na/NAModulo4Servicios.jsx
// Sección NA · Módulo 4: Servicios — Abogado (antes vivía en
// CierreCaso, es del caso pero se reubica visualmente aquí) + Pase
// Médico / lesionados propios del vehículo asegurado (ocupantes sin
// tercero ligado — mismo formulario que Lesionados.jsx de siempre,
// vía LesionadosPanel con terceroId="").
// ============================================================
import { useState, useEffect } from "react";
import { PanelHeader, Seccion, Campo, soloCambios } from "../shared";
import { fetchDatosAjuste, guardarAbogado } from "../../../services/siniestros";
import LesionadosPanel from "../LesionadosPanel";

function ToggleSiNo({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">{label}</label>
      <div className="flex gap-2">
        {[{ v: true, l: "Sí" }, { v: false, l: "No" }].map((op) => (
          <button key={op.l} type="button" onClick={() => onChange(op.v)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${value === op.v ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-500 border-gray-200"}`}>
            {op.l}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function NAModulo4Servicios({ siniestro, onVolver }) {
  const [solicitoAbogado, setSolicitoAbogado] = useState(null);
  const [despachoAbogado, setDespachoAbogado] = useState("");
  const [original, setOriginal] = useState({ solicitoAbogado: null, despachoAbogado: "" });
  const [guardando,    setGuardando]    = useState(false);
  const [errorGuardar, setErrorGuardar] = useState(null);
  const [guardadoOk,   setGuardadoOk]   = useState(false);

  useEffect(() => {
    fetchDatosAjuste(siniestro.id).then((row) => {
      if (!row) return;
      setSolicitoAbogado(row.solicitoAbogado);
      setDespachoAbogado(row.despachoAbogado || "");
      setOriginal({ solicitoAbogado: row.solicitoAbogado, despachoAbogado: row.despachoAbogado || "" });
    }).catch(() => {});
  }, [siniestro.id]);

  const handleGuardar = async () => {
    setGuardando(true);
    setErrorGuardar(null);
    setGuardadoOk(false);
    try {
      const actual = { solicitoAbogado, despachoAbogado };
      const cambios = soloCambios(original, actual);
      if (Object.keys(cambios).length) {
        await guardarAbogado(siniestro.id, cambios);
        setOriginal(actual);
      }
      setGuardadoOk(true);
    } catch (err) {
      setErrorGuardar(err.message ?? "Error al guardar el servicio de abogado");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <PanelHeader titulo="Servicios" subtitulo="NA · Módulo 4 de 4" onVolver={onVolver} />
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-4">

        <Seccion titulo="Abogado">
          <div className="space-y-3">
            <ToggleSiNo label="¿Solicitó abogado?" value={solicitoAbogado} onChange={setSolicitoAbogado} />
            {solicitoAbogado === true && (
              <Campo label="Nombre del despacho y del abogado" value={despachoAbogado} onChange={setDespachoAbogado} />
            )}
          </div>
          <div className="pt-3 space-y-2">
            {errorGuardar && <p className="text-xs text-red-500 text-center font-medium">{errorGuardar}</p>}
            {guardadoOk && !errorGuardar && <p className="text-xs text-emerald-600 text-center font-medium">Guardado.</p>}
            <button type="button" onClick={handleGuardar} disabled={guardando}
              className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#13193a] text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-wait">
              {guardando ? "Guardando..." : "Guardar abogado"}
            </button>
          </div>
        </Seccion>

        <Seccion titulo="Pase Médico — lesionados del vehículo asegurado">
          <LesionadosPanel siniestro={siniestro} terceroId="" responsableNombre={siniestro.asegurado} />
        </Seccion>
      </div>
    </div>
  );
}
