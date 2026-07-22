// ============================================================
// src/features/ajustador/Lesionados.jsx
// Paso "Lesionados": se agregan y editan aparte de los terceros —
// cada tarjeta captura TODO sobre la persona en un solo lugar:
// primero sus datos personales, después lo relacionado a su lesión
// (incluye lo que antes se pedía por separado en el paso Documentos
// al armar el Pase Médico — región del cuerpo, causa, estado, tipo,
// primeros auxilios, motivo de traslado — porque son datos DE LA
// PERSONA, no del documento).
// ============================================================
import { useState, useCallback } from "react";
import { Campo, Sep, ToggleRow, REGIONES_CUERPO } from "./shared";
import { guardarLesionados } from "../../services/siniestros";

const CAUSAS_LESION = ["Atropello", "Colisión"];
const ESTADOS_LESIONADO = ["Conciente", "Inconciente"];
const TIPOS_LESION = ["Contusión", "Herida"];
const MOTIVOS_TRASLADO = ["Incapacidad para Deambular", "Inconciencia"];

function CardLesionado({ idx, datos, onDatos, onEliminar }) {
  const toggleRegion = (zona) => {
    const activa = datos.regionCuerpo.includes(zona);
    onDatos("regionCuerpo", activa ? datos.regionCuerpo.filter((z) => z !== zona) : [...datos.regionCuerpo, zona]);
  };

  return (
    <div className="border-2 border-gray-100 rounded-2xl overflow-hidden">
      <div className="bg-[#13193a] px-4 py-3 flex items-center justify-between">
        <p className="text-sm font-bold text-white">Lesionado AF{idx + 1}</p>
        <button onClick={onEliminar} className="w-6 h-6 rounded-full bg-white/10 hover:bg-red-500/80 flex items-center justify-center text-white transition-all">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-4 space-y-3">
        <Sep label="Datos personales" />
        <Campo label="Nombre del lesionado" placeholder="Nombre completo" value={datos.nombre} onChange={(v) => onDatos("nombre", v)} />
        <Campo label="Domicilio" placeholder="Calle, número, colonia, ciudad..." value={datos.domicilio} onChange={(v) => onDatos("domicilio", v)} />
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Teléfono" type="tel" placeholder="55 0000 0000" value={datos.telefono} onChange={(v) => onDatos("telefono", v)} />
          <Campo label="Edad" type="number" placeholder="Años" value={datos.edad} onChange={(v) => onDatos("edad", v)} />
        </div>

        <Sep label="Datos de la lesión" />
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Región del cuerpo afectada</label>
          <div className="flex gap-2 flex-wrap">
            {REGIONES_CUERPO.map((zona) => (
              <button
                key={zona}
                type="button"
                onClick={() => toggleRegion(zona)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${datos.regionCuerpo.includes(zona) ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-500 border-gray-200"}`}
              >
                {zona}
              </button>
            ))}
          </div>
        </div>
        <ToggleRow label="Causa de la lesión" options={CAUSAS_LESION} current={datos.causaLesion} onPick={(v) => onDatos("causaLesion", v)} />
        <ToggleRow label="Estado del lesionado" options={ESTADOS_LESIONADO} current={datos.estadoLesionado} onPick={(v) => onDatos("estadoLesionado", v)} />
        <ToggleRow label="Tipo de lesión" options={TIPOS_LESION} current={datos.tipoLesion} onPick={(v) => onDatos("tipoLesion", v)} />
        <ToggleRow
          label="¿Recibió atención de primeros auxilios?"
          options={["Sí", "No"]}
          current={datos.primerosAuxilios === true ? "Sí" : datos.primerosAuxilios === false ? "No" : null}
          onPick={(v) => onDatos("primerosAuxilios", v === "Sí")}
        />
        <ToggleRow
          label="Motivo de traslado en ambulancia"
          options={MOTIVOS_TRASLADO}
          current={datos.motivoTraslado}
          onPick={(v) => onDatos("motivoTraslado", v === datos.motivoTraslado ? "" : v)}
        />
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Tipo de lesionado</label>
          <div className="flex gap-2">
            {["Conductor", "Ocupante"].map((op) => (
              <button key={op} onClick={() => onDatos("tipoLesionado", op)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${datos.tipoLesionado === op ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-500 border-gray-200"}`}>
                {op}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Hospital asignado" value={datos.hospital} onChange={(v) => onDatos("hospital", v)} />
          <Campo label="Cobertura" value={datos.cobertura} onChange={(v) => onDatos("cobertura", v)} />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">¿Abrir reserva?</label>
          <div className="flex gap-2">
            {["Sí", "No"].map((op) => (
              <button key={op} onClick={() => onDatos("abrirReserva", op === "Sí")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                  (datos.abrirReserva === true  && op === "Sí") ? "bg-red-500 text-white border-red-500" :
                  (datos.abrirReserva === false && op === "No") ? "bg-[#13193a] text-white border-[#13193a]" :
                  "bg-white text-gray-500 border-gray-200"
                }`}>
                {op}
              </button>
            ))}
          </div>
        </div>
        <Campo label="Estimado de lesiones" type="number" placeholder="0.00" value={datos.estimadoLesiones} onChange={(v) => onDatos("estimadoLesiones", v)} />
      </div>
    </div>
  );
}

const lesionadoVacio = () => ({
  nombre: "", domicilio: "", telefono: "", edad: "",
  regionCuerpo: [], causaLesion: "", estadoLesionado: "", tipoLesion: "",
  primerosAuxilios: null, motivoTraslado: "",
  tipoLesionado: "",
  hospital: "", cobertura: "",
  abrirReserva: null, estimadoLesiones: "",
});

export default function Lesionados({ siniestro, onSiguiente }) {
  const [lesionadosIds, setLesionadosIds] = useState([]);
  const [lesionados,    setLesionados]    = useState({});
  const [guardando,    setGuardando]    = useState(false);
  const [errorGuardar, setErrorGuardar] = useState(null);

  const agregarLesionado = () => {
    const id = `L${Date.now()}`;
    setLesionadosIds((ids) => [...ids, id]);
    setLesionados((l) => ({ ...l, [id]: lesionadoVacio() }));
  };

  const eliminarLesionado = (id) => {
    setLesionadosIds((ids) => ids.filter((x) => x !== id));
    setLesionados((l) => { const n = { ...l }; delete n[id]; return n; });
  };

  const actualizarDatoLesionado = useCallback((id, campo, valor) => {
    setLesionados((l) => ({ ...l, [id]: { ...l[id], [campo]: valor } }));
  }, []);

  const handleSiguiente = async () => {
    setGuardando(true);
    setErrorGuardar(null);
    try {
      await guardarLesionados(siniestro.id, lesionadosIds, lesionados);
      onSiguiente();
    } catch (err) {
      setErrorGuardar(err.message ?? "Error al guardar los lesionados");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="px-4 py-4 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Lesionados ({lesionadosIds.length})</p>
        <button onClick={agregarLesionado}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-dashed border-gray-300 text-gray-400 hover:border-[#13193a]/40 hover:text-[#13193a] text-xs font-bold transition-all">
          + Agregar lesionado
        </button>
      </div>

      {lesionadosIds.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 h-28 bg-gray-50">
          <span className="text-xs font-semibold text-gray-400">Sin lesionados — toca "+ Agregar lesionado" si aplica, o continúa si no hay ninguno.</span>
        </div>
      )}
      {lesionadosIds.length > 4 && (
        <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          El PDF de Declaración solo imprime los primeros 4 lesionados (AF1–AF4).
        </p>
      )}
      <div className="space-y-3">
        {lesionadosIds.map((id, i) => (
          <CardLesionado
            key={id}
            idx={i}
            datos={lesionados[id] ?? lesionadoVacio()}
            onDatos={(campo, valor) => actualizarDatoLesionado(id, campo, valor)}
            onEliminar={() => eliminarLesionado(id)}
          />
        ))}
      </div>

      <div className="pt-2 pb-6 space-y-2">
        {errorGuardar && (
          <p className="text-xs text-red-500 text-center font-medium">{errorGuardar}</p>
        )}
        <button onClick={handleSiguiente} disabled={guardando}
          className="w-full py-3.5 rounded-2xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-[#13193a]/15 disabled:opacity-60 disabled:cursor-wait">
          {guardando ? "Guardando..." : "Continuar a Cierre del Caso →"}
        </button>
      </div>
    </div>
  );
}
