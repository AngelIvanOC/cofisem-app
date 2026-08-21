// ============================================================
// src/features/ajustador/LesionadosPanel.jsx
// Panel de lesionados reutilizable — antes vivía como su propio paso
// (Lesionados.jsx), ahora se incrusta dentro de cada Tercero-Módulo1
// (lesionados de ESE tercero) y dentro de NA-Módulo4 (ocupantes
// lesionados del vehículo asegurado, sin tercero). El almacenamiento
// sigue siendo UNA sola colección por siniestro (tabla
// siniestros_lesionados, participante_id="NA" o el id del tercero) —
// este panel filtra qué tarjetas MUESTRA por `terceroId`, pero cada
// guardado manda la colección COMPLETA (guardarLesionados reconcilia
// por fila, así que enviar solo el subsecuente filtrado borraría los
// lesionados de los demás participantes).
// ============================================================
import { useState, useCallback, useEffect } from "react";
import { Campo, CampoSistema, Sep, ToggleRow, REGIONES_CUERPO } from "./shared";
import { guardarLesionados, fetchLesionados } from "../../services/siniestros";
import { fetchHospitales } from "../../services/servicios";

const CAUSAS_LESION = ["Atropello", "Colisión"];
const ESTADOS_LESIONADO = ["Conciente", "Inconciente"];
const TIPOS_LESION = ["Contusión", "Herida"];
const MOTIVOS_TRASLADO = ["Incapacidad para Deambular", "Inconciencia"];

function Switch({ checked, onToggle, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={onToggle}
      className="w-full flex items-center justify-between gap-3 py-1">
      <span className="text-xs font-bold text-gray-600">{label}</span>
      <span className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? "bg-[#13193a]" : "bg-gray-300"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </span>
    </button>
  );
}

function CardLesionado({ idx, datos, onDatos, onEliminar, hospitales, expandido, onToggleExpandir, copiaDisponible }) {
  const toggleRegion = (zona) => {
    const activa = datos.regionCuerpo.includes(zona);
    onDatos("regionCuerpo", activa ? datos.regionCuerpo.filter((z) => z !== zona) : [...datos.regionCuerpo, zona]);
  };

  const elegirTipoLesionado = (tipo) => {
    onDatos("tipoLesionado", tipo);
    if (tipo === "Conductor" && copiaDisponible) {
      onDatos("nombre", copiaDisponible.nombre || "");
      onDatos("domicilio", copiaDisponible.domicilio || "");
      onDatos("telefono", copiaDisponible.telefono || "");
      onDatos("edad", copiaDisponible.edad || "");
    }
  };

  const manualHospital = datos.hospitalId === "manual";
  const handleHospitalSelect = (val) => {
    if (val !== "manual" && val !== "") {
      const h = hospitales.find((x) => String(x.id) === val);
      onDatos("hospitalId", val);
      onDatos("hospital", h?.nombre || "");
      onDatos("hospitalTelefono", h?.telefono || "");
      onDatos("hospitalDomicilio", h?.domicilio || "");
    } else if (val === "manual") {
      onDatos("hospitalId", val);
      onDatos("hospital", "");
      onDatos("hospitalTelefono", "");
      onDatos("hospitalDomicilio", "");
    } else {
      onDatos("hospitalId", val);
    }
  };

  return (
    <div className="border-2 border-gray-100 rounded-2xl overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleExpandir}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggleExpandir(); } }}
        className="w-full bg-[#13193a] px-4 py-3 flex items-center justify-between gap-2 cursor-pointer select-none"
      >
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-bold text-white">Lesionado {idx + 1}</p>
          {!expandido && <p className="text-[11px] text-white/50 truncate">{datos.nombre || "Sin datos capturados"}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={(e) => { e.stopPropagation(); onEliminar(); }}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-red-500/80 flex items-center justify-center text-white transition-all">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <svg className={`w-4 h-4 text-white/60 transition-transform ${expandido ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {expandido && (
      <div className="p-4 space-y-3">
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Tipo de lesionado</label>
          <div className="flex gap-2">
            {["Conductor", "Ocupante"].map((op) => (
              <button key={op} onClick={() => elegirTipoLesionado(op)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${datos.tipoLesionado === op ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-500 border-gray-200"}`}>
                {op}
              </button>
            ))}
          </div>
        </div>

        <Sep label="Datos personales" />
        {datos.tipoLesionado === "Conductor" && copiaDisponible ? (
          <>
            <CampoSistema label="Nombre del lesionado" value={datos.nombre} />
            <CampoSistema label="Domicilio" value={datos.domicilio} />
            <div className="grid grid-cols-2 gap-3">
              <CampoSistema label="Teléfono" value={datos.telefono} />
              <CampoSistema label="Edad" value={datos.edad} />
            </div>
          </>
        ) : (
          <>
            <Campo label="Nombre del lesionado" placeholder="Nombre completo" value={datos.nombre} onChange={(v) => onDatos("nombre", v)} />
            <Campo label="Domicilio" placeholder="Calle, número, colonia, ciudad..." value={datos.domicilio} onChange={(v) => onDatos("domicilio", v)} />
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Teléfono" type="tel" placeholder="55 0000 0000" value={datos.telefono} onChange={(v) => onDatos("telefono", v)} />
              <Campo label="Edad" type="number" placeholder="Años" value={datos.edad} onChange={(v) => onDatos("edad", v)} />
            </div>
          </>
        )}

        <Sep label="Datos de la lesión" />
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Región del cuerpo afectada</label>
          <div className="flex gap-2 flex-wrap">
            {REGIONES_CUERPO.map((zona) => (
              <button key={zona} type="button" onClick={() => toggleRegion(zona)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${datos.regionCuerpo.includes(zona) ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-500 border-gray-200"}`}>
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
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Cobertura" value={datos.cobertura} onChange={(v) => onDatos("cobertura", v)} />
          <Campo label="Estimado de lesiones" type="number" placeholder="0.00" value={datos.estimadoLesiones} onChange={(v) => onDatos("estimadoLesiones", v)} />
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

        <Sep label="Pase Médico" />
        <Switch checked={datos.paseMedico} onToggle={() => onDatos("paseMedico", !datos.paseMedico)} label="Generar Pase Médico" />
        {datos.paseMedico && (
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Hospital / clínica asignada</label>
            <select value={datos.hospitalId} onChange={(e) => handleHospitalSelect(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all">
              <option value="">Selecciona...</option>
              {hospitales.map((h) => <option key={h.id} value={String(h.id)}>{h.nombre}</option>)}
              <option value="manual">Otro (capturar manualmente)</option>
            </select>
            {manualHospital && (
              <div className="space-y-3 bg-gray-50 rounded-xl p-3 mt-3">
                <Campo label="Nombre del hospital/clínica" placeholder="Nombre" value={datos.hospital} onChange={(v) => onDatos("hospital", v)} />
                <Campo label="Teléfono" type="tel" placeholder="55 0000 0000" value={datos.hospitalTelefono} onChange={(v) => onDatos("hospitalTelefono", v)} />
                <Campo label="Domicilio" placeholder="Dirección completa" value={datos.hospitalDomicilio} onChange={(v) => onDatos("hospitalDomicilio", v)} />
              </div>
            )}
          </div>
        )}

        <button type="button" onClick={onToggleExpandir}
          className="w-full py-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-bold hover:bg-emerald-100 transition-all flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Listo
        </button>
      </div>
      )}
    </div>
  );
}

const lesionadoVacio = (terceroId) => ({
  terceroId: terceroId || "",
  nombre: "", domicilio: "", telefono: "", edad: "",
  regionCuerpo: [], causaLesion: "", estadoLesionado: "", tipoLesion: "",
  primerosAuxilios: null, motivoTraslado: "",
  tipoLesionado: "",
  cobertura: "",
  abrirReserva: null, estimadoLesiones: "",
  paseMedico: true,
  hospitalId: "", hospital: "", hospitalTelefono: "", hospitalDomicilio: "",
  paseMedicoNumero: "", paseMedicoFechaExpedicion: "",
});

function filaAFormulario(row) {
  return {
    terceroId: row.participante_id && row.participante_id !== "NA" ? row.participante_id : "",
    nombre: row.nombre ?? "", domicilio: row.domicilio ?? "", telefono: row.telefono ?? "",
    edad: row.edad != null ? String(row.edad) : "",
    regionCuerpo: row.region_cuerpo ?? [], causaLesion: row.causa_lesion ?? "",
    estadoLesionado: row.estado_lesionado ?? "", tipoLesion: row.tipo_lesion ?? "",
    primerosAuxilios: row.primeros_auxilios, motivoTraslado: row.motivo_traslado ?? "",
    tipoLesionado: row.tipo_lesionado ?? "", cobertura: row.cobertura ?? "",
    abrirReserva: row.abrir_reserva, estimadoLesiones: row.estimado_lesiones != null ? String(row.estimado_lesiones) : "",
    paseMedico: row.pase_medico ?? true,
    hospitalId: "", hospital: row.hospital_asignado ?? "", hospitalTelefono: row.hospital_telefono ?? "",
    hospitalDomicilio: row.hospital_domicilio ?? "",
    paseMedicoNumero: row.pase_medico_numero ?? "", paseMedicoFechaExpedicion: row.pase_medico_fecha_expedicion ?? "",
  };
}

// `terceroId`: "" para lesionados del lado NA (sin vehículo tercero
// ligado); el id (string) de un tercero para mostrar solo los suyos.
// `copiaDisponible` (opcional): {nombre, domicilio, telefono, edad} del
// tercero actual — se usa para autocompletar cuando el lesionado es
// "Conductor" de ESE tercero (mismo comportamiento que antes tenía
// Lesionados.jsx al elegir "¿en qué vehículo iba?").
export default function LesionadosPanel({ siniestro, terceroId, copiaDisponible }) {
  const [lesionadosIds, setLesionadosIds] = useState([]);
  const [lesionados,    setLesionados]    = useState({});
  const [original,      setOriginal]      = useState({});
  const [hospitales,    setHospitales]    = useState([]);
  const [cargando,      setCargando]      = useState(true);
  const [guardando,     setGuardando]     = useState(false);
  const [errorGuardar,  setErrorGuardar]  = useState(null);
  const [guardadoOk,    setGuardadoOk]    = useState(false);
  const [expandedId,    setExpandedId]    = useState(null);
  const toggleExpandir = (id) => setExpandedId((cur) => (cur === id ? null : id));

  useEffect(() => {
    fetchHospitales().then(setHospitales).catch(() => setHospitales([]));
  }, []);

  useEffect(() => {
    fetchLesionados(siniestro.id)
      .then((rows) => {
        const ids = rows.map((r) => String(r.id));
        const porId = {};
        rows.forEach((r) => { porId[String(r.id)] = filaAFormulario(r); });
        setLesionadosIds(ids);
        setLesionados(porId);
        setOriginal(porId);
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [siniestro.id]);

  const idsVisibles = lesionadosIds.filter((id) => (lesionados[id]?.terceroId || "") === (terceroId || ""));

  const agregarLesionado = () => {
    const id = `L${Date.now()}`;
    const base = lesionadoVacio(terceroId);
    if (hospitales.length > 0) {
      const h = hospitales[0];
      base.hospitalId = String(h.id);
      base.hospital = h.nombre;
      base.hospitalTelefono = h.telefono;
      base.hospitalDomicilio = h.domicilio;
    }
    setLesionadosIds((ids) => [...ids, id]);
    setLesionados((l) => ({ ...l, [id]: base }));
    setExpandedId(id);
  };

  const eliminarLesionado = (id) => {
    setLesionadosIds((ids) => ids.filter((x) => x !== id));
    setLesionados((l) => { const n = { ...l }; delete n[id]; return n; });
    setExpandedId((cur) => (cur === id ? null : cur));
  };

  const actualizarDatoLesionado = useCallback((id, campo, valor) => {
    setLesionados((l) => ({ ...l, [id]: { ...l[id], [campo]: valor } }));
  }, []);

  const handleGuardar = async () => {
    setGuardando(true);
    setErrorGuardar(null);
    setGuardadoOk(false);
    try {
      // Manda la colección COMPLETA (todos los participantes, no solo
      // los visibles aquí) — ver nota arriba del archivo.
      await guardarLesionados(siniestro.id, { lesionadosIds, lesionados, original });
      setOriginal(lesionados);
      setGuardadoOk(true);
    } catch (err) {
      setErrorGuardar(err.message ?? "Error al guardar los lesionados");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-3">
      {!cargando && idsVisibles.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 h-24 bg-gray-50">
          <span className="text-xs font-semibold text-gray-400 px-4 text-center">Sin lesionados aquí — agrega uno si aplica.</span>
        </div>
      )}
      <div className="space-y-3">
        {idsVisibles.map((id, i) => (
          <CardLesionado
            key={id}
            idx={i}
            datos={lesionados[id] ?? lesionadoVacio(terceroId)}
            onDatos={(campo, valor) => actualizarDatoLesionado(id, campo, valor)}
            onEliminar={() => eliminarLesionado(id)}
            hospitales={hospitales}
            expandido={expandedId === id}
            onToggleExpandir={() => toggleExpandir(id)}
            copiaDisponible={copiaDisponible}
          />
        ))}
      </div>

      <button type="button" onClick={agregarLesionado}
        className="w-full py-3.5 rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-[#13193a]/40 hover:text-[#13193a] text-sm font-bold transition-all flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Agregar lesionado
      </button>

      <div className="space-y-2">
        {errorGuardar && <p className="text-xs text-red-500 text-center font-medium">{errorGuardar}</p>}
        {guardadoOk && !errorGuardar && <p className="text-xs text-emerald-600 text-center font-medium">Guardado.</p>}
        <button type="button" onClick={handleGuardar} disabled={guardando}
          className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#13193a] text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-wait">
          {guardando ? "Guardando..." : "Guardar lesionados"}
        </button>
      </div>
    </div>
  );
}
