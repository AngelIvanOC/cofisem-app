// ============================================================
// src/features/ajustador/Encuesta.jsx
// Nuevo paso: Encuesta de satisfacción — la captura el ajustador
// preguntándole al asegurado en el momento.
// Las horas se muestran de referencia (solo lectura, del sistema);
// "Hora de término" no se pide aquí — se sella sola al cerrar el caso.
// ============================================================
import { useState, useEffect } from "react";
import { Campo, CampoSistema, Seccion, Sep } from "./shared";
import { guardarEncuesta, fetchTiemposSiniestro, horaLocal } from "../../services/siniestros";

const CALIFICACIONES = ["Excelente", "Bien", "Deficiente"];

function CalificacionTag({ value, onChange }) {
  return (
    <div className="flex gap-2">
      {CALIFICACIONES.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
            value === c ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-500 border-gray-200"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

export default function Encuesta({ siniestro, onSiguiente }) {
  const [d, setD] = useState({
    calificacionReporte:   "",
    motivoReporte:         "",
    calificacionAjustador: "",
    motivoAjustador:       "",
    comentarios:           "",
  });
  const set = (k, v) => setD((s) => ({ ...s, [k]: v }));

  const [guardando,    setGuardando]    = useState(false);
  const [errorGuardar, setErrorGuardar] = useState(null);

  // Horas oficiales — vienen del sistema, nunca las escribe el ajustador.
  const [tiempos, setTiempos] = useState(null);
  useEffect(() => {
    fetchTiemposSiniestro(siniestro.id).then(setTiempos).catch(() => setTiempos({}));
  }, [siniestro.id]);

  const handleSiguiente = async () => {
    setGuardando(true);
    setErrorGuardar(null);
    try {
      await guardarEncuesta(siniestro.id, {
        ...d,
        horaReporte: horaLocal(tiempos?.hora_inicio_reporte),
        horaLlegada: horaLocal(tiempos?.arribo_fecha),
      });
      onSiguiente();
    } catch (err) {
      setErrorGuardar(err.message ?? "Error al guardar la encuesta");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <p className="text-xs text-gray-400 -mt-1">
        Pregúntale al asegurado sobre el servicio recibido y captura sus respuestas.
      </p>

      <Seccion titulo="Servicio del Reporte Telefónico">
        <div className="space-y-3">
          <CampoSistema label="Hora del reporte" value={horaLocal(tiempos?.hora_inicio_reporte)?.slice(0, 5)} />
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Calificación del servicio</label>
            <CalificacionTag value={d.calificacionReporte} onChange={(v) => set("calificacionReporte", v)} />
          </div>
          {d.calificacionReporte && d.calificacionReporte !== "Excelente" && (
            <Campo label="Motivo de su calificación" rows={2} value={d.motivoReporte} onChange={(v) => set("motivoReporte", v)} />
          )}
        </div>
      </Seccion>

      <Seccion titulo="Servicio del Ajustador">
        <div className="space-y-3">
          <CampoSistema label="Hora de llegada" value={horaLocal(tiempos?.arribo_fecha)?.slice(0, 5)} />
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Calificación del servicio</label>
            <CalificacionTag value={d.calificacionAjustador} onChange={(v) => set("calificacionAjustador", v)} />
          </div>
          {d.calificacionAjustador && d.calificacionAjustador !== "Excelente" && (
            <Campo label="Motivo de su calificación" rows={2} value={d.motivoAjustador} onChange={(v) => set("motivoAjustador", v)} />
          )}
        </div>
      </Seccion>

      <Seccion titulo="Comentarios">
        <Sep label="Comentarios del asegurado" />
        <Campo label="Comentarios" rows={3} placeholder="Comentarios adicionales..." value={d.comentarios} onChange={(v) => set("comentarios", v)} />
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
          {guardando ? "Guardando..." : "Continuar a Documentos →"}
        </button>
      </div>
    </div>
  );
}
