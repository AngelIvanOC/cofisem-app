// ============================================================
// src/features/ajustador/na/NAModulo3Danos.jsx
// Sección NA · Módulo 3: Daños — descripción + ¿abrir reserva? + monto
// estimado (manual, como siempre — la aseguradora no paga el daño del
// propio asegurado, así que no hay marcadores con dinero) + mapa
// visual de daños en modo "solo nota" (agregado, no reemplaza lo
// anterior — ambos alimentan la Declaración del Accidente).
// ============================================================
import { useState, useEffect } from "react";
import { Campo, PanelHeader, Seccion, soloCambios } from "../shared";
import { guardarPartesInvolucradas, fetchPartesInvolucradas } from "../../../services/siniestros";
import DanosMarcadores from "../danos/DanosMarcadores";

const datosNAVacio = () => ({ descripcionDano: "", abrirReserva: null, montoEstimado: "", danosMarcadores: {} });

export default function NAModulo3Danos({ siniestro, onVolver }) {
  const [datos,    setDatos]    = useState(datosNAVacio());
  const [original, setOriginal] = useState(datosNAVacio());
  const [guardando,    setGuardando]    = useState(false);
  const [errorGuardar, setErrorGuardar] = useState(null);

  useEffect(() => {
    fetchPartesInvolucradas(siniestro.id).then(({ datosNA }) => {
      if (datosNA) { setDatos(datosNA); setOriginal(datosNA); }
    }).catch(() => {});
  }, [siniestro.id]);

  const set = (campo, valor) => setDatos((d) => ({ ...d, [campo]: valor }));

  const handleGuardar = async () => {
    setGuardando(true);
    setErrorGuardar(null);
    try {
      const cambiosNA = soloCambios(original, datos);
      // afectadosIds/afectados/originalTerceros van vacíos a propósito:
      // este módulo NUNCA toca terceros, y guardarPartesInvolucradas
      // solo borra un tercero si su _dbId está en `originalTerceros`
      // pero ya no en `afectadosIds` — al pasar ambos vacíos, ese
      // cálculo da lista vacía y ningún tercero se ve afectado.
      await guardarPartesInvolucradas(siniestro.id, { cambiosNA, afectadosIds: [], afectados: {}, originalTerceros: {} });
      setOriginal(datos);
      // Guardado OK → volver a la grilla de módulos, igual que la flecha atrás.
      onVolver();
    } catch (err) {
      setErrorGuardar(err.message ?? "Error al guardar los daños");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <PanelHeader titulo="Daños" subtitulo="NA · Módulo 3 de 4" onVolver={onVolver} />
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-4">

        <Seccion titulo="Daños del vehículo asegurado">
          <div className="space-y-3">
            <Campo label="Descripción de daños" placeholder="Describe los daños del vehículo..." rows={2}
              value={datos.descripcionDano} onChange={(v) => set("descripcionDano", v)} />
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">¿Abrir reserva?</label>
              <div className="flex gap-2">
                {["Sí", "No"].map((op) => (
                  <button key={op} onClick={() => set("abrirReserva", op === "Sí")}
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
            <Campo label="Monto estimado del daño" type="number" placeholder="0.00"
              value={datos.montoEstimado} onChange={(v) => set("montoEstimado", v)} />
          </div>
        </Seccion>

        <Seccion titulo="Mapa de daños">
          <DanosMarcadores
            titulo="Daños del vehículo asegurado"
            value={datos.danosMarcadores}
            onChange={(v) => set("danosMarcadores", v)}
            soloNota
          />
        </Seccion>

        <div className="pt-2 pb-6 space-y-2">
          {errorGuardar && <p className="text-xs text-red-500 text-center font-medium">{errorGuardar}</p>}
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="w-full py-3.5 rounded-2xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-[#13193a]/15 disabled:opacity-60 disabled:cursor-wait"
          >
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
