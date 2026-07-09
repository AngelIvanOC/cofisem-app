// ============================================================
// src/features/ajustador/DatosAjuste.jsx
// Nuevo paso: "Datos de Ajuste" (sección Reverso) + Croquis
// ============================================================
import { useState, useEffect } from "react";
import { Campo, CampoSistema, CampoSelect, Seccion, Sep } from "./shared";
import { CAUSAS, CIRCUNSTANCIAS } from "../cabinero/constants/catalogos";
import { guardarDatosAjuste, fetchTiemposSiniestro, horaLocal } from "../../services/siniestros";
import { subirCroquis } from "../../services/evidencias";
import CroquisEditor from "./croquis/CroquisEditor";

const CULPABILIDAD_OPTS = ["Culpable", "Compartida", "Dudosa", "No culpable"];
const RECUPERACION_OPTS = ["Si", "No", "Probable"];
const TIPO_RECUPERACION_OPTS = ["Efectivo", "Cheque", "T. de Crédito", "Objeto en garantía"];

// ── Toggle Si/No reutilizable ─────────────────────────────────
function ToggleSiNo({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">{label}</label>
      <div className="flex gap-2">
        {[{ v: true, l: "Sí" }, { v: false, l: "No" }].map((op) => (
          <button
            key={op.l}
            type="button"
            onClick={() => onChange(op.v)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
              value === op.v ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-500 border-gray-200"
            }`}
          >
            {op.l}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DatosAjuste({ siniestro, onSiguiente }) {
  const [d, setD] = useState({
    causa:                  siniestro.causaReportada ?? "",
    circunstancia:          siniestro.circunstanciaReportada ?? "",
    culpabilidad:           "",
    solicitoGrua:           null,
    calificacionSiniestro:  "",
    requiereInvestigacion:  null,
    convenioGxg:            null,
    articuloInfringido:     "",
    inicioAveriguacion:     null,
    numeroAveriguacion:     "",
    numeroPartePfp:         "",
    solicitoAbogado:        null,
    despachoAbogado:        "",
    recuperacion:           "",
    tipoRecuperacion:       "",
    objetoGarantiaImporte:  "",
    conclusiones:           "",
  });
  const set = (k, v) => setD((s) => ({ ...s, [k]: v }));

  const [croquisDataUrl, setCroquisDataUrl] = useState(null);
  const [guardando,      setGuardando]      = useState(false);
  const [errorGuardar,   setErrorGuardar]   = useState(null);

  // Horas oficiales — vienen del sistema, nunca las escribe el ajustador.
  const [tiempos, setTiempos] = useState(null);
  useEffect(() => {
    fetchTiemposSiniestro(siniestro.id).then(setTiempos).catch(() => setTiempos({}));
  }, [siniestro.id]);

  const handleSiguiente = async () => {
    setGuardando(true);
    setErrorGuardar(null);
    try {
      let croquisUrl = null;
      if (croquisDataUrl) {
        croquisUrl = await subirCroquis({
          numeroSiniestro: siniestro.numero_siniestro ?? siniestro.folio,
          dataUrl: croquisDataUrl,
        });
      }
      await guardarDatosAjuste(siniestro.id, {
        ...d,
        croquisUrl,
        horaTomado:  horaLocal(tiempos?.hora_inicio_reporte),
        horaPasado:  horaLocal(tiempos?.created_at),
        horaLlegada: horaLocal(tiempos?.arribo_fecha),
      });
      onSiguiente();
    } catch (err) {
      setErrorGuardar(err.message ?? "Error al guardar los datos de ajuste");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="px-4 py-4 space-y-4">

      <Seccion titulo="Causa y Circunstancia">
        <div className="space-y-3">
          <CampoSelect label="Causa del siniestro" value={d.causa} onChange={(v) => set("causa", v)}
            options={CAUSAS} placeholder="Selecciona la causa..." />
          <CampoSelect label="Circunstancias del accidente" value={d.circunstancia} onChange={(v) => set("circunstancia", v)}
            options={CIRCUNSTANCIAS} placeholder="Selecciona la circunstancia..." />
        </div>
      </Seccion>

      <Seccion titulo="Datos de Ajuste">
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
            Horas del proceso — registradas automáticamente por el sistema
          </p>
          <div className="grid grid-cols-3 gap-3">
            <CampoSistema label="Hora tomado"  value={horaLocal(tiempos?.hora_inicio_reporte)?.slice(0, 5)} />
            <CampoSistema label="Hora pasado"  value={horaLocal(tiempos?.created_at)?.slice(0, 5)} />
            <CampoSistema label="Hora llegada" value={horaLocal(tiempos?.arribo_fecha)?.slice(0, 5)} />
          </div>
          <Campo label="Artículo infringido" placeholder="Si aplica" value={d.articuloInfringido} onChange={(v) => set("articuloInfringido", v)} />

          <Sep label="Calificación" />
          <div className="grid grid-cols-2 gap-3">
            <CampoSelect label="Culpabilidad de N/A" value={d.culpabilidad} onChange={(v) => set("culpabilidad", v)}
              options={CULPABILIDAD_OPTS} placeholder="Selecciona..." />
            <Campo label="Calificación del siniestro" value={d.calificacionSiniestro} onChange={(v) => set("calificacionSiniestro", v)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <ToggleSiNo label="¿Solicitó grúa?"        value={d.solicitoGrua}          onChange={(v) => set("solicitoGrua", v)} />
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

          <Sep label="Abogado" />
          <ToggleSiNo label="¿Solicitó abogado?" value={d.solicitoAbogado} onChange={(v) => set("solicitoAbogado", v)} />
          {d.solicitoAbogado === true && (
            <Campo label="Nombre del despacho y del abogado" value={d.despachoAbogado} onChange={(v) => set("despachoAbogado", v)} />
          )}

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
        <Campo
          label="Conclusiones del ajustador"
          placeholder="Resumen final del caso..."
          rows={4}
          value={d.conclusiones}
          onChange={(v) => set("conclusiones", v)}
        />
      </Seccion>

      <Seccion titulo="Croquis del Accidente">
        <CroquisEditor onDataUrlChange={setCroquisDataUrl} />
      </Seccion>

      <div className="pt-2 pb-6 space-y-2">
        {errorGuardar && (
          <p className="text-xs text-red-500 text-center font-medium">{errorGuardar}</p>
        )}
        <button
          onClick={handleSiguiente}
          disabled={guardando}
          className="w-full py-3.5 rounded-2xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-[#13193a]/15 disabled:opacity-60 disabled:cursor-wait"
        >
          {guardando ? "Guardando..." : "Continuar a Encuesta →"}
        </button>
      </div>
    </div>
  );
}
