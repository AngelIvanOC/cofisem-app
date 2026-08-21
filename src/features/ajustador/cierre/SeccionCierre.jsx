// ============================================================
// src/features/ajustador/cierre/SeccionCierre.jsx
// Sección "Cierre": Horas del proceso, Encuesta, Datos de Ajuste (sin
// Abogado ni Grúa — se movieron a NA-Módulo4/Tercero-Módulo4),
// Croquis del accidente, firmas y "Finalizar siniestro". Fusiona lo
// que antes eran CierreCaso.jsx + Documentos.jsx (sin el bloque de
// Pase Taller, que ahora vive en Tercero-Módulo4).
// ============================================================
import { useState, useEffect, useRef } from "react";
import { Campo, CampoSistema, CampoSelect, Seccion, Sep, PanelHeader, soloCambios } from "../shared";
import {
  guardarDatosAjuste, guardarEncuesta, fetchDatosAjuste, fetchEncuesta,
  fetchTiemposSiniestro, horaLocal, fetchLesionados, asignarFolioPaseMedico,
  guardarFirmas, cerrarSiniestro, obtenerSiguienteFolio, fetchPaseTaller, guardarPaseTaller,
} from "../../../services/siniestros";
import { subirCroquis, subirFirma } from "../../../services/evidencias";
import CroquisSection from "../croquis/CroquisSection";

const CULPABILIDAD_OPTS = ["Culpable", "Compartida", "Dudosa", "No culpable"];
const RECUPERACION_OPTS = ["Si", "No", "Probable"];
const TIPO_RECUPERACION_OPTS = ["Efectivo", "Cheque", "T. de Crédito", "Objeto en garantía"];
const CALIFICACIONES = ["Excelente", "Bien", "Deficiente"];

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

function CalificacionTag({ value, onChange }) {
  return (
    <div className="flex gap-2">
      {CALIFICACIONES.map((c) => (
        <button key={c} type="button" onClick={() => onChange(c)}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${value === c ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-500 border-gray-200"}`}>
          {c}
        </button>
      ))}
    </div>
  );
}

function ModalFirma({ label, onConfirmar, onCerrar }) {
  const canvasRef  = useRef(null);
  const dibujando  = useRef(false);
  const ultimoPto  = useRef(null);

  const getXY = (e, canvas) => {
    const r   = canvas.getBoundingClientRect();
    const src = e.touches?.[0] ?? e;
    return { x: (src.clientX - r.left) * (canvas.width / r.width), y: (src.clientY - r.top) * (canvas.height / r.height) };
  };
  const draw = (from, to, ctx) => {
    ctx.beginPath(); ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = "#13193a"; ctx.lineWidth = 2.5;
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
  };
  const onDown = (e) => { dibujando.current = true; ultimoPto.current = getXY(e, canvasRef.current); if (e.cancelable) e.preventDefault(); };
  const onMove = (e) => {
    if (!dibujando.current) return;
    if (e.cancelable) e.preventDefault();
    const to = getXY(e, canvasRef.current);
    draw(ultimoPto.current, to, canvasRef.current.getContext("2d"));
    ultimoPto.current = to;
  };
  const onUp = () => { dibujando.current = false; };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(10,15,40,0.6)" }} onClick={onCerrar}>
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
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
          <canvas ref={canvasRef} width={460} height={200} className="w-full border-2 border-dashed border-gray-300 rounded-2xl touch-none bg-gray-50" style={{ height: 180 }}
            onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
            onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp} />
          <div className="flex gap-3 mt-4">
            <button onClick={() => { const ctx = canvasRef.current?.getContext("2d"); if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); }}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Limpiar</button>
            <button onClick={() => onConfirmar(canvasRef.current.toDataURL())}
              className="flex-1 py-3 rounded-xl bg-[#13193a] text-white text-sm font-bold hover:bg-[#1e2a50] shadow-lg shadow-[#13193a]/15">Confirmar Firma</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const encuestaVacia = () => ({
  calificacionReporte: "", motivoReporte: "", calificacionAjustador: "", motivoAjustador: "", comentarios: "",
});

// solicitoGrua/solicitoAbogado/despachoAbogado YA NO viven aquí — se
// movieron a Tercero-Módulo4 y NA-Módulo4 respectivamente. Sus
// columnas en `siniestros` se conservan (guardarAbogado /
// filaTercero.solicito_grua las escriben desde allá).
const datosAjusteVacios = () => ({
  culpabilidad: "", calificacionSiniestro: "", requiereInvestigacion: null, convenioGxg: null,
  articuloInfringido: "", inicioAveriguacion: null, numeroAveriguacion: "", numeroPartePfp: "",
  recuperacion: "", tipoRecuperacion: "", objetoGarantiaImporte: "", conclusiones: "",
});

export default function SeccionCierre({ siniestro, onVolver, onFinalizar }) {
  const [encuesta, setEncuesta] = useState(encuestaVacia());
  const setE = (k, v) => setEncuesta((s) => ({ ...s, [k]: v }));
  const [d, setD] = useState(datosAjusteVacios());
  const set = (k, v) => setD((s) => ({ ...s, [k]: v }));

  const [originalD,        setOriginalD]        = useState(datosAjusteVacios());
  const [originalEncuesta, setOriginalEncuesta]  = useState(encuestaVacia());

  const [croquisDataUrl, setCroquisDataUrl] = useState(null);
  const [croquisEscena,  setCroquisEscena]  = useState(siniestro.croquisData ?? null);
  const [guardando,      setGuardando]      = useState(false);
  const [errorGuardar,   setErrorGuardar]   = useState(null);
  const [guardadoOk,     setGuardadoOk]     = useState(false);

  const [tiempos, setTiempos] = useState(null);
  useEffect(() => { fetchTiemposSiniestro(siniestro.id).then(setTiempos).catch(() => setTiempos({})); }, [siniestro.id]);

  useEffect(() => {
    fetchDatosAjuste(siniestro.id).then((row) => {
      if (row) {
        // Se destructuran a propósito para excluirlos de `resto`: viven
        // ahora en NA-Módulo4/Tercero-Módulo4, no en este formulario.
        const { solicitoGrua: _solicitoGrua, solicitoAbogado: _solicitoAbogado, despachoAbogado: _despachoAbogado, ...resto } = row;
        setD(resto); setOriginalD(resto);
      }
    }).catch(() => {});
    fetchEncuesta(siniestro.id).then((row) => { if (row) { setEncuesta(row); setOriginalEncuesta(row); } }).catch(() => {});
  }, [siniestro.id]);

  const handleGuardar = async () => {
    setGuardando(true);
    setErrorGuardar(null);
    setGuardadoOk(false);
    try {
      let croquisUrl = siniestro.croquisUrl ?? null;
      if (croquisDataUrl) {
        croquisUrl = await subirCroquis({ numeroSiniestro: siniestro.numero_siniestro ?? siniestro.folio, dataUrl: croquisDataUrl });
      }
      const cambiosD = soloCambios(originalD, d);
      await guardarDatosAjuste(siniestro.id, cambiosD, {
        croquisUrl, croquisData: croquisEscena,
        horaTomado:  horaLocal(tiempos?.hora_inicio_reporte),
        horaPasado:  horaLocal(tiempos?.created_at),
        horaLlegada: horaLocal(tiempos?.arribo_fecha),
      });
      const cambiosEncuesta = soloCambios(originalEncuesta, encuesta);
      await guardarEncuesta(siniestro.id, cambiosEncuesta, {
        horaReporte: horaLocal(tiempos?.hora_inicio_reporte),
        horaLlegada: horaLocal(tiempos?.arribo_fecha),
      });
      setOriginalD(d);
      setOriginalEncuesta(encuesta);
      setGuardadoOk(true);
    } catch (err) {
      setErrorGuardar(err.message ?? "Error al guardar el cierre del caso");
    } finally {
      setGuardando(false);
    }
  };

  // ── Firmas + Finalizar ──────────────────────────────────────
  const [lesionados, setLesionados] = useState([]);
  const [firmas,     setFirmas]     = useState({ asegurado: null, afectado: null, ajustador: null, lesionado: null });
  const [firmando,   setFirmando]   = useState(null);
  const [cerrando,   setCerrando]   = useState(false);
  const [errorCierre, setErrorCierre] = useState(null);

  useEffect(() => { fetchLesionados(siniestro.id).then(setLesionados).catch(() => setLesionados([])); }, [siniestro.id]);

  const hayPaseMedico = lesionados.some((l) => l.pase_medico);
  const FIRMAS_CONFIG = [
    { id: "asegurado", label: "Firma del Asegurado", sub: siniestro.asegurado },
    { id: "afectado",  label: "Firma del Afectado",  sub: "Tercero involucrado" },
    { id: "ajustador", label: "Firma del Ajustador", sub: "Ajustador asignado" },
    ...(hayPaseMedico ? [{ id: "lesionado", label: "Firma del Lesionado", sub: "Recibe el Pase Médico" }] : []),
  ];

  const handleFinalizar = async () => {
    setCerrando(true);
    setErrorCierre(null);
    try {
      // El Pase Taller se configura en Tercero-Módulo4; aquí solo se
      // detecta si de verdad se capturó algo, para asignarle folio
      // real al finalizar (igual que antes en Documentos.jsx). Un solo
      // folio, una sola escritura — nunca tocar guardarDatosAjuste
      // aquí sin `sistema`, o borraría el croquis/horas recién
      // guardados (ver nota en services/siniestros.js).
      const paseTallerRow = await fetchPaseTaller(siniestro.id);
      const hayPaseTaller = paseTallerRow && Object.values(paseTallerRow).some((v) => v != null && v !== "");
      const docs = { taller: !!hayPaseTaller };
      if (hayPaseTaller && !paseTallerRow.pase_taller_numero) {
        const numeroPase = await obtenerSiguienteFolio("taller");
        await guardarPaseTaller(siniestro.id, {}, {}, { numeroPase });
      }

      const hoy = new Date().toISOString().slice(0, 10);
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
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <PanelHeader titulo="Cierre" subtitulo={`${siniestro.id} · ${siniestro.asegurado}`} onVolver={onVolver} />
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-4">

        <Seccion titulo="Horas del Proceso">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Registradas automáticamente por el sistema</p>
            <div className="grid grid-cols-3 gap-3">
              <CampoSistema label="Hora del reporte" value={horaLocal(tiempos?.hora_inicio_reporte)?.slice(0, 5)} />
              <CampoSistema label="Hora pasado"      value={horaLocal(tiempos?.created_at)?.slice(0, 5)} />
              <CampoSistema label="Hora de llegada"  value={horaLocal(tiempos?.arribo_fecha)?.slice(0, 5)} />
            </div>
          </div>
        </Seccion>

        <Seccion titulo="Servicio del Reporte Telefónico">
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Calificación del servicio</label>
              <CalificacionTag value={encuesta.calificacionReporte} onChange={(v) => setE("calificacionReporte", v)} />
            </div>
            {encuesta.calificacionReporte && encuesta.calificacionReporte !== "Excelente" && (
              <Campo label="Motivo de su calificación" rows={2} value={encuesta.motivoReporte} onChange={(v) => setE("motivoReporte", v)} />
            )}
          </div>
        </Seccion>

        <Seccion titulo="Servicio del Ajustador">
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Calificación del servicio</label>
              <CalificacionTag value={encuesta.calificacionAjustador} onChange={(v) => setE("calificacionAjustador", v)} />
            </div>
            {encuesta.calificacionAjustador && encuesta.calificacionAjustador !== "Excelente" && (
              <Campo label="Motivo de su calificación" rows={2} value={encuesta.motivoAjustador} onChange={(v) => setE("motivoAjustador", v)} />
            )}
          </div>
        </Seccion>

        <Seccion titulo="Comentarios">
          <Campo label="Comentarios" rows={3} placeholder="Comentarios adicionales..." value={encuesta.comentarios} onChange={(v) => setE("comentarios", v)} />
        </Seccion>

        <Seccion titulo="Datos de Ajuste">
          <div className="space-y-3">
            <Campo label="Artículo infringido" placeholder="Si aplica" value={d.articuloInfringido} onChange={(v) => set("articuloInfringido", v)} />
            <Sep label="Calificación" />
            <div className="grid grid-cols-2 gap-3">
              <CampoSelect label="Culpabilidad de N/A" value={d.culpabilidad} onChange={(v) => set("culpabilidad", v)}
                options={CULPABILIDAD_OPTS} placeholder="Selecciona..." />
              <Campo label="Calificación del siniestro" value={d.calificacionSiniestro} onChange={(v) => set("calificacionSiniestro", v)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ToggleSiNo label="Requiere investigación" value={d.requiereInvestigacion} onChange={(v) => set("requiereInvestigacion", v)} />
              <ToggleSiNo label="Convenio G x G"          value={d.convenioGxg}           onChange={(v) => set("convenioGxg", v)} />
            </div>
          </div>
        </Seccion>

        <Seccion titulo="Averiguación y Recuperación">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <ToggleSiNo label="¿Inició averiguación?" value={d.inicioAveriguacion} onChange={(v) => set("inicioAveriguacion", v)} />
              <Campo label="Número de Averiguación Previa" value={d.numeroAveriguacion} onChange={(v) => set("numeroAveriguacion", v)} />
            </div>
            <Campo label="Número de Parte de Accidente (PFP)" value={d.numeroPartePfp} onChange={(v) => set("numeroPartePfp", v)} />

            <Sep label="Recuperación" />
            <CampoSelect label="Recuperación" value={d.recuperacion} onChange={(v) => set("recuperacion", v)}
              options={RECUPERACION_OPTS} placeholder="Selecciona..." />
            {d.recuperacion && d.recuperacion !== "No" && (
              <>
                <CampoSelect label="Tipo de recuperación" value={d.tipoRecuperacion} onChange={(v) => set("tipoRecuperacion", v)}
                  options={TIPO_RECUPERACION_OPTS} placeholder="Selecciona..." />
                <Campo label="Objeto en garantía y/o importe recuperado" value={d.objetoGarantiaImporte} onChange={(v) => set("objetoGarantiaImporte", v)} />
              </>
            )}
          </div>
        </Seccion>

        <Seccion titulo="Conclusiones">
          <Campo label="Conclusiones del ajustador" placeholder="Resumen final del caso..." rows={4} value={d.conclusiones} onChange={(v) => set("conclusiones", v)} />
        </Seccion>

        <Seccion titulo="Croquis del Accidente">
          <CroquisSection
            croquisDataUrl={croquisDataUrl} onDataUrlChange={setCroquisDataUrl}
            croquisEscena={croquisEscena} onEscenaChange={setCroquisEscena}
          />
        </Seccion>

        <div className="pt-2 space-y-2">
          {errorGuardar && <p className="text-xs text-red-500 text-center font-medium">{errorGuardar}</p>}
          {guardadoOk && !errorGuardar && <p className="text-xs text-emerald-600 text-center font-medium">Guardado.</p>}
          <button onClick={handleGuardar} disabled={guardando}
            className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#13193a] text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-wait">
            {guardando ? "Guardando..." : "Guardar cierre"}
          </button>
        </div>

        <Seccion titulo="Firmas requeridas">
          <div className="space-y-3">
            {FIRMAS_CONFIG.map((f) => (
              <div key={f.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-[#13193a]">{f.label}</p>
                    <p className="text-xs text-gray-400">{f.sub}</p>
                  </div>
                  {firmas[f.id] && (
                    <button onClick={() => setFirmas((p) => ({ ...p, [f.id]: null }))} className="text-xs text-red-400 hover:text-red-600 font-medium">Borrar</button>
                  )}
                </div>
                {firmas[f.id] ? (
                  <div className="p-3 bg-gray-50 flex items-center justify-center h-16">
                    <img src={firmas[f.id]} alt="Firma" className="h-full" style={{ filter: "invert(1) brightness(0.15)" }} />
                  </div>
                ) : (
                  <button onClick={() => setFirmando(f.id)} className="w-full px-4 py-5 flex flex-col items-center gap-2 text-gray-400 hover:bg-gray-50 transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                    <span className="text-xs font-semibold">Toca para firmar</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </Seccion>

        <div className="pt-2 pb-6 space-y-2">
          {errorCierre && <p className="text-xs text-red-500 text-center font-medium">{errorCierre}</p>}
          <button onClick={handleFinalizar} disabled={cerrando}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-wait text-white text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2">
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
