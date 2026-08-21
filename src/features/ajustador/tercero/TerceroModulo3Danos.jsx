// ============================================================
// src/features/ajustador/tercero/TerceroModulo3Danos.jsx
// Tercero · Módulo 3: Daños — descripción + ¿abrir reserva? + monto
// estimado (automático, suma de los marcadores de "Daños del
// Siniestro") + versión de los hechos + mapa de daños (Siniestro +
// Preexistentes). Es el módulo que menos cambia: ya existía completo
// en PanelAfectado (CapturaEvidencia.jsx), solo se traslada.
// ============================================================
import { Campo, CampoSistema, PanelHeader, Seccion, sumaMontosDanos, formatMonto } from "../shared";
import DanosMarcadores from "../danos/DanosMarcadores";

export default function TerceroModulo3Danos({ datos, onDatos, onGuardar, guardando, errorGuardar, guardadoOk, onVolver }) {
  const sumaDanos = sumaMontosDanos(datos.danosSiniestro);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <PanelHeader titulo="Daños" subtitulo="Tercero · Módulo 3 de 5" onVolver={onVolver} />
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-4">

        <Seccion titulo="Daños del vehículo del tercero">
          <div className="space-y-3">
            <Campo label="Descripción de daños" placeholder="Describe los daños del vehículo..." rows={2}
              value={datos.descripcionDano} onChange={(v) => onDatos("descripcionDano", v)} />
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
            <CampoSistema label="Monto estimado del daño" value={formatMonto(sumaDanos)} />
          </div>
        </Seccion>

        <Seccion titulo="Versión de los hechos">
          <Campo label="Declaración del afectado" placeholder="Captura la versión de los hechos según indica el afectado..."
            rows={3} value={datos.declaracion} onChange={(v) => onDatos("declaracion", v)} />
        </Seccion>

        <Seccion titulo="Mapa de daños">
          <div className="space-y-3">
            <DanosMarcadores
              titulo="Daños del Siniestro"
              value={datos.danosSiniestro}
              onChange={(v) => { onDatos("danosSiniestro", v); onDatos("montoEstimado", sumaMontosDanos(v)); }}
            />
            <DanosMarcadores titulo="Daños Preexistentes" value={datos.danosPreexistente} onChange={(v) => onDatos("danosPreexistente", v)} soloNota />
          </div>
        </Seccion>

        <div className="pt-2 pb-6 space-y-2">
          {errorGuardar && <p className="text-xs text-red-500 text-center font-medium">{errorGuardar}</p>}
          {guardadoOk && !errorGuardar && <p className="text-xs text-emerald-600 text-center font-medium">Guardado.</p>}
          <button onClick={onGuardar} disabled={guardando}
            className="w-full py-3.5 rounded-2xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-[#13193a]/15 disabled:opacity-60 disabled:cursor-wait">
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
