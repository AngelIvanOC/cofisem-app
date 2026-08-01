// ============================================================
// src/features/ajustador/Documentos.jsx
// Paso "Documentos": configura Pase Taller y Pase Médico, captura las
// firmas de cierre y finaliza el siniestro — todo en un solo paso.
// El Pase Médico ya no pide datos de la lesión (viven en el paso
// Lesionados) — aquí solo elige a cuál lesionado corresponde, muestra
// su lesión como resumen de solo lectura para verificar, y pide el
// médico/clínica asignada + fecha de expedición.
// ============================================================
import { useState, useEffect, useRef } from "react";
import { guardarPaseTaller, fetchPaseTaller, fetchLesionados, asignarFolioPaseMedico, guardarFirmas, cerrarSiniestro, obtenerSiguienteFolio } from "../../services/siniestros";
import { fetchTalleres } from "../../services/servicios";
import { subirFirma } from "../../services/evidencias";
import { Campo, CampoSistema, Sep, soloCambios } from "./shared";

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function DocToggle({ titulo, desc, activo, onToggle, children }) {
  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all ${activo ? "border-[#13193a]" : "border-gray-200"}`}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4">
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${activo ? "border-[#13193a] bg-[#13193a]" : "border-gray-300"}`}>
          {activo && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <div className="text-left flex-1">
          <p className="text-sm font-bold text-[#13193a]">{titulo}</p>
          <p className="text-xs text-gray-400">{desc}</p>
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${activo ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {activo && <div className="px-4 pb-4 border-t border-gray-100 pt-3">{children}</div>}
    </div>
  );
}

// ── Pase Taller ───────────────────────────────────────────────
function PaseTaller({ siniestro, value, onChange, talleres }) {
  const set = (patch) => onChange((v) => ({ ...v, ...patch }));

  const p      = siniestro.polizaInfo ?? {};
  const manual = value.tallerIdx === "manual";
  const taller = !manual && value.tallerIdx !== "" ? talleres.find((t) => String(t.id) === value.tallerIdx) : null;

  const handleTallerSelect = (val) => {
    if (val !== "manual" && val !== "") {
      const t = talleres.find((x) => String(x.id) === val);
      if (t) set({ tallerIdx: val, tallerNombre: t.nombre, tallerTel: t.telefono, tallerCalle: t.calle, tallerColonia: t.colonia });
    } else if (val === "manual") {
      set({ tallerIdx: val, tallerNombre: "", tallerTel: "", tallerCalle: "", tallerColonia: "" });
    } else {
      set({ tallerIdx: val });
    }
  };

  // El Pase Taller solo aplica al vehículo del tercero — la aseguradora
  // solo vende responsabilidad civil, nunca paga (ni manda a taller) el
  // daño del propio asegurado. Ya no se pregunta de quién es el
  // vehículo, siempre es del tercero (definicion queda fija en
  // PASE_TALLER_DEFAULT).
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Destino del vehículo</label>
        <div className="flex gap-2">
          {["Taller", "Domicilio"].map((op) => (
            <button
              key={op}
              onClick={() => set({ destino: op })}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${value.destino === op ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-500 border-gray-200"}`}
            >
              {op}
            </button>
          ))}
        </div>
      </div>

      {value.destino === "Taller" && (
        <>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Taller asignado</label>
            <select
              value={value.tallerIdx}
              onChange={(e) => handleTallerSelect(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all"
            >
              <option value="">Selecciona un taller...</option>
              {talleres.map((t) => <option key={t.id} value={String(t.id)}>{t.nombre}</option>)}
              <option value="manual">Otro taller (capturar manualmente)</option>
            </select>
          </div>

          {(manual || taller) && (
            <div className={manual ? "space-y-3 bg-gray-50 rounded-xl p-3" : "bg-gray-50 rounded-xl p-3 space-y-1.5"}>
              {manual ? (
                <>
                  <Campo label="Nombre del taller" placeholder="Nombre" value={value.tallerNombre} onChange={(v) => set({ tallerNombre: v })} />
                  <div className="grid grid-cols-2 gap-3">
                    <Campo label="Teléfono" type="tel" placeholder="55 0000 0000" value={value.tallerTel} onChange={(v) => set({ tallerTel: v })} />
                  </div>
                  <Campo label="Calle, No. Exterior e interior" placeholder="Calle y número" value={value.tallerCalle} onChange={(v) => set({ tallerCalle: v })} />
                  <Campo label="Colonia" placeholder="Colonia" value={value.tallerColonia} onChange={(v) => set({ tallerColonia: v })} />
                </>
              ) : (
                <>
                  <p className="text-xs font-bold text-[#13193a]">{taller.nombre}</p>
                  <p className="text-xs text-gray-500">{taller.telefono}</p>
                  <p className="text-xs text-gray-400">{taller.calle}, {taller.colonia}</p>
                </>
              )}
            </div>
          )}
        </>
      )}

      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Tipo de resolución</label>
        <div className="flex gap-2">
          {["Reparación", "Pérdida total"].map((op) => (
            <button
              key={op}
              onClick={() => set({ tipoResolucion: op })}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${value.tipoResolucion === op ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-500 border-gray-200"}`}
            >
              {op}
            </button>
          ))}
        </div>
      </div>

      <Sep label="Deducible (póliza)" />
      <div className="grid grid-cols-2 gap-3">
        <CampoSistema label="Aplica deducible" value={p.aplicaDeducible ? "Sí" : "No"} />
        <CampoSistema label="Porcentaje"       value={p.aplicaDeducible ? `${p.porcentajeDeducible}%` : "—"} />
      </div>

      <Sep label="Datos del pase" />
      <div className="grid grid-cols-2 gap-3">
        <CampoSistema label="Número de pase" value={value.numeroPase} placeholder="Se asigna al finalizar" />
        <Campo label="Clave" placeholder="000" value={value.clave} onChange={(v) => set({ clave: v })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Tipo (carrocería)" placeholder="Sedán, Pickup..." value={value.vehiculoTipo} onChange={(v) => set({ vehiculoTipo: v })} />
        <Campo label="Puertas" placeholder="4" value={value.vehiculoPuertas} onChange={(v) => set({ vehiculoPuertas: v })} />
      </div>
      <Campo label="Fecha de expedición" type="date" value={value.fechaExpedicion} onChange={(v) => set({ fechaExpedicion: v })} />
      <Campo
        label="Orden condicionada a"
        placeholder="Ej. Pago en efectivo de $... en..."
        rows={3}
        value={value.ordenCondicionada}
        onChange={(v) => set({ ordenCondicionada: v })}
      />
    </div>
  );
}

// ── Modal de firma táctil ─────────────────────────────────────
function ModalFirma({ label, onConfirmar, onCerrar }) {
  const canvasRef  = useRef(null);
  const dibujando  = useRef(false);
  const ultimoPto  = useRef(null);

  const getXY = (e, canvas) => {
    const r   = canvas.getBoundingClientRect();
    const src = e.touches?.[0] ?? e;
    return {
      x: (src.clientX - r.left) * (canvas.width  / r.width),
      y: (src.clientY - r.top)  * (canvas.height / r.height),
    };
  };
  const draw = (from, to, ctx) => {
    ctx.beginPath(); ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = "#13193a"; ctx.lineWidth = 2.5;
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
  };

  const onDown = (e) => {
    dibujando.current = true;
    ultimoPto.current = getXY(e, canvasRef.current);
    if (e.cancelable) e.preventDefault();
  };
  const onMove = (e) => {
    if (!dibujando.current) return;
    if (e.cancelable) e.preventDefault();
    const to = getXY(e, canvasRef.current);
    draw(ultimoPto.current, to, canvasRef.current.getContext("2d"));
    ultimoPto.current = to;
  };
  const onUp = () => { dibujando.current = false; };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(10,15,40,0.6)" }}
      onClick={onCerrar}
    >
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="font-bold text-[#13193a] text-sm">Capturar firma</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
          <button onClick={onCerrar} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          <p className="text-xs text-gray-400 mb-3 text-center">Firma dentro del recuadro con el dedo o el lápiz</p>
          <canvas
            ref={canvasRef}
            width={460}
            height={200}
            className="w-full border-2 border-dashed border-gray-300 rounded-2xl touch-none bg-gray-50"
            style={{ height: 180 }}
            onMouseDown={onDown}  onMouseMove={onMove}  onMouseUp={onUp}   onMouseLeave={onUp}
            onTouchStart={onDown} onTouchMove={onMove}  onTouchEnd={onUp}
          />
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => { const ctx = canvasRef.current?.getContext("2d"); if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); }}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >Limpiar</button>
            <button
              onClick={() => onConfirmar(canvasRef.current.toDataURL())}
              className="flex-1 py-3 rounded-xl bg-[#13193a] text-white text-sm font-bold hover:bg-[#1e2a50] shadow-lg shadow-[#13193a]/15"
            >Confirmar Firma</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// numeroPase NO se captura aquí — se asigna solo (folio consecutivo,
// ver obtenerSiguienteFolio) hasta que el ajustador finaliza el
// siniestro, no es un dato que se escriba a mano.
const PASE_TALLER_DEFAULT = {
  definicion: "Tercero", destino: "Taller",
  tallerIdx: "", tallerNombre: "", tallerTel: "", tallerCalle: "", tallerColonia: "",
  tipoResolucion: "Reparación",
  clave: "", vehiculoTipo: "", vehiculoPuertas: "",
  fechaExpedicion: hoyISO(), ordenCondicionada: "",
};

export default function Documentos({ siniestro, onFinalizar }) {
  const [docs,       setDocs]       = useState({ taller: false });
  const [paseTaller, setPaseTaller] = useState(PASE_TALLER_DEFAULT);
  // Snapshot con el que arrancó el formulario — para guardado
  // diferencial (soloCambios). Solo importa si el ajustador ya había
  // activado el toggle y capturado algo antes de salir de este paso sin
  // llegar a Finalizar (guardarPaseTaller solo se llama ahí).
  const [originalPaseTaller, setOriginalPaseTaller] = useState(PASE_TALLER_DEFAULT);
  const [lesionados, setLesionados] = useState([]);
  const [talleres,   setTalleres]   = useState([]);
  const [firmas,     setFirmas]     = useState({ asegurado: null, afectado: null, ajustador: null, lesionado: null });
  const [firmando,   setFirmando]   = useState(null);
  const [cerrando,   setCerrando]   = useState(false);
  const [errorCierre, setErrorCierre] = useState(null);

  useEffect(() => {
    fetchLesionados(siniestro.id).then(setLesionados).catch(() => setLesionados([]));
  }, [siniestro.id]);

  useEffect(() => {
    fetchTalleres().then(setTalleres).catch(() => setTalleres([]));
  }, []);

  // Hidrata el Pase Taller si el ajustador ya lo había capturado en una
  // visita anterior a este paso (sin llegar a Finalizar, que es cuando
  // se guarda) — así no lo encuentra en blanco.
  useEffect(() => {
    fetchPaseTaller(siniestro.id).then((row) => {
      if (!row) return;
      const huboAlgo = Object.values(row).some((v) => v != null && v !== "");
      if (!huboAlgo) return;
      const tallerNombre = row.pase_taller_taller_nombre || "";
      const hydrated = {
        ...PASE_TALLER_DEFAULT,
        clave:             row.pase_taller_clave             || "",
        definicion:        row.pase_taller_definicion         || PASE_TALLER_DEFAULT.definicion,
        destino:           row.pase_taller_destino            || PASE_TALLER_DEFAULT.destino,
        // No se guardó el id de `servicios` elegido, solo su copia
        // aplanada — se hidrata como "manual" para que los campos con
        // los datos ya capturados se sigan viendo y se puedan editar.
        tallerIdx:         tallerNombre ? "manual" : "",
        tallerNombre,
        tallerTel:         row.pase_taller_taller_telefono     || "",
        tallerCalle:       row.pase_taller_taller_calle        || "",
        tallerColonia:     row.pase_taller_taller_colonia      || "",
        vehiculoTipo:      row.pase_taller_vehiculo_tipo       || "",
        vehiculoPuertas:   row.pase_taller_vehiculo_puertas    || "",
        fechaExpedicion:   row.pase_taller_fecha_expedicion    || PASE_TALLER_DEFAULT.fechaExpedicion,
        ordenCondicionada: row.pase_taller_orden_condicionada  || "",
        numeroPase:        row.pase_taller_numero              || "",
      };
      setPaseTaller(hydrated);
      setOriginalPaseTaller(hydrated);
      setDocs((d) => ({ ...d, taller: true }));
    }).catch(() => {});
  }, [siniestro.id]);

  const toggleTaller = () => setDocs((d) => ({ ...d, taller: !d.taller }));

  // Pase Médico ya no es un toggle manual aquí — cada lesionado decide
  // con su propio switch "Generar Pase Médico" (paso Lesionados). Si al
  // menos uno lo tiene activado, se sigue pidiendo la firma del
  // lesionado.
  const hayPaseMedico = lesionados.some((l) => l.pase_medico);

  const FIRMAS_CONFIG = [
    { id: "asegurado", label: "Firma del Asegurado", sub: siniestro.asegurado        },
    { id: "afectado",  label: "Firma del Afectado",  sub: "Tercero involucrado"       },
    { id: "ajustador", label: "Firma del Ajustador", sub: "Ajustador asignado"        },
    ...(hayPaseMedico ? [{ id: "lesionado", label: "Firma del Lesionado", sub: "Recibe el Pase Médico" }] : []),
  ];

  const handleFinalizar = async () => {
    setCerrando(true);
    setErrorCierre(null);
    try {
      // El folio se pide justo aquí, al finalizar de verdad — si el
      // ajustador solo activó el toggle y luego lo desactivó antes de
      // llegar hasta acá, nunca se le pidió folio y no queda un hueco
      // en el consecutivo. Cada lesionado con el switch activado recibe
      // su propio folio — puede haber varios Pase Médico en un mismo
      // siniestro.
      if (docs.taller) {
        const numeroPase = paseTaller.numeroPase || await obtenerSiguienteFolio("taller");
        const cambios = soloCambios(originalPaseTaller, paseTaller);
        await guardarPaseTaller(siniestro.id, cambios, paseTaller, { numeroPase });
      }
      const hoy = hoyISO();
      for (const l of lesionados) {
        if (!l.pase_medico) continue;
        const numeroPase = await obtenerSiguienteFolio("medico");
        await asignarFolioPaseMedico(l.id, { numeroPase, fechaExpedicion: hoy });
      }

      const numeroSiniestro = siniestro.numero_siniestro ?? siniestro.folio;
      const paths = {};
      if (firmas.asegurado) paths.asegurado  = await subirFirma({ numeroSiniestro, tipo: "asegurado",  dataUrl: firmas.asegurado });
      if (firmas.ajustador) paths.ajustador  = await subirFirma({ numeroSiniestro, tipo: "ajustador",  dataUrl: firmas.ajustador });
      if (firmas.afectado)  paths.reclamante = await subirFirma({ numeroSiniestro, tipo: "reclamante", dataUrl: firmas.afectado });
      if (firmas.lesionado) paths.lesionado  = await subirFirma({ numeroSiniestro, tipo: "lesionado",  dataUrl: firmas.lesionado });
      await guardarFirmas(siniestro.id, paths);
      await cerrarSiniestro(siniestro.id);
      onFinalizar(docs);
    } catch (err) {
      setErrorCierre(err.message ?? "Error al cerrar el siniestro");
      setCerrando(false);
    }
  };

  return (
    <div className="px-4 py-4 space-y-5">
      <div className="space-y-3">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Selecciona los documentos a generar</p>
        <DocToggle titulo="Pase Taller" desc="Autorización para reparación del vehículo" activo={docs.taller} onToggle={toggleTaller}>
          <PaseTaller siniestro={siniestro} value={paseTaller} onChange={setPaseTaller} talleres={talleres} />
        </DocToggle>
      </div>

      <div className="space-y-3">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Firmas requeridas</p>
        {FIRMAS_CONFIG.map((f) => (
          <div key={f.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-semibold text-[#13193a]">{f.label}</p>
                <p className="text-xs text-gray-400">{f.sub}</p>
              </div>
              {firmas[f.id] && (
                <button
                  onClick={() => setFirmas((p) => ({ ...p, [f.id]: null }))}
                  className="text-xs text-red-400 hover:text-red-600 font-medium"
                >Borrar</button>
              )}
            </div>
            {firmas[f.id] ? (
              <div className="p-3 bg-gray-50 flex items-center justify-center h-16">
                <img src={firmas[f.id]} alt="Firma" className="h-full" style={{ filter: "invert(1) brightness(0.15)" }} />
              </div>
            ) : (
              <button
                onClick={() => setFirmando(f.id)}
                className="w-full px-4 py-5 flex flex-col items-center gap-2 text-gray-400 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
                <span className="text-xs font-semibold">Toca para firmar</span>
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="pt-2 pb-6 space-y-2">
        {errorCierre && (
          <p className="text-xs text-red-500 text-center font-medium">{errorCierre}</p>
        )}
        <button
          onClick={handleFinalizar}
          disabled={cerrando}
          className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-wait text-white text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
        >
          {cerrando ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Cerrando siniestro...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Finalizar y Enviar Documentos
            </>
          )}
        </button>
      </div>

      {firmando && (
        <ModalFirma
          label={FIRMAS_CONFIG.find((f) => f.id === firmando)?.label ?? ""}
          onConfirmar={(dataUrl) => { setFirmas((p) => ({ ...p, [firmando]: dataUrl })); setFirmando(null); }}
          onCerrar={() => setFirmando(null)}
        />
      )}
    </div>
  );
}
