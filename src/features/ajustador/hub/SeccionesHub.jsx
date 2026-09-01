// ============================================================
// src/features/ajustador/hub/SeccionesHub.jsx
// Pantalla principal del caso (post-arribo): botón "Datos Generales"
// + las cajas de secciones (NA / una caja por Tercero + "Agregar
// tercero" / Evidencias / Cierre). Reemplaza el wizard lineal — cada
// caja se navega de forma independiente y regresa aquí al picar
// "atrás". El estado de los terceros vive aquí (useTercerosState)
// para que tanto las cajas del Hub como TerceroDetalle.jsx compartan
// la misma colección y el mismo guardado.
// ============================================================
import { useState } from "react";
import { ClipboardList, Car, CarFront, Images, CheckCircle2, Plus, ChevronRight } from "lucide-react";
import { Tile, PanelHeader } from "../shared";
import DatosGenerales from "../DatosGenerales";
import SeccionNA from "../na/SeccionNA";
import TerceroDetalle from "../tercero/TerceroDetalle";
import useTercerosState from "../tercero/useTercerosState";
import SeccionEvidencias from "../evidencias/SeccionEvidencias";
import SeccionCierre from "../cierre/SeccionCierre";

export default function SeccionesHub({ siniestro, onFinalizarCaso, onVolverALista }) {
  const [seccion, setSeccion] = useState(null);
  const [terceroActivo, setTerceroActivo] = useState(null);

  const terceros = useTercerosState(siniestro.id);

  if (seccion === "datosGenerales") return <DatosGenerales siniestro={siniestro} onVolver={() => setSeccion(null)} />;
  if (seccion === "na")             return <SeccionNA siniestro={siniestro} onVolver={() => setSeccion(null)} />;
  if (seccion === "evidencias")     return <SeccionEvidencias siniestro={siniestro} onVolver={() => setSeccion(null)} />;
  if (seccion === "cierre")         return <SeccionCierre siniestro={siniestro} onVolver={() => setSeccion(null)} onFinalizar={onFinalizarCaso} />;

  if (terceroActivo) {
    const idx = terceros.afectadosIds.indexOf(terceroActivo) + 1;
    return (
      <TerceroDetalle
        siniestro={siniestro}
        idx={idx}
        datos={terceros.afectados[terceroActivo] ?? {}}
        onDatos={(campo, valor) => terceros.actualizarDato(terceroActivo, campo, valor)}
        onGuardar={terceros.guardarTodo}
        guardando={terceros.guardando}
        errorGuardar={terceros.errorGuardar}
        guardadoOk={terceros.guardadoOk}
        onVolver={() => setTerceroActivo(null)}
        onEliminar={() => { terceros.eliminarAfectado(terceroActivo); setTerceroActivo(null); }}
      />
    );
  }

  const p = siniestro.polizaInfo ?? { numero: siniestro.poliza, vigencia: siniestro.vigencia, cobertura: "—" };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <PanelHeader titulo={siniestro.id} subtitulo={siniestro.asegurado} onVolver={onVolverALista} />
      <div className="shrink-0 px-4 pb-2 -mt-2 bg-white">
        <p className="text-xs text-gray-400">Póliza {p.numero} · Vigencia {p.vigencia} · {p.cobertura}</p>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-4">
        <button
          type="button"
          onClick={() => setSeccion("datosGenerales")}
          className="w-full text-left bg-[#13193a] rounded-2xl p-4 flex items-center gap-3 text-white hover:bg-[#1e2a50] transition-all active:scale-[0.98]"
        >
          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">Datos Generales</p>
            <p className="text-xs text-white/60 mt-0.5">Causa, circunstancia, ubicación, estatus de póliza</p>
          </div>
          <ChevronRight className="w-4 h-4 text-white/50 shrink-0" />
        </button>

        <Tile titulo="NA — Nuestro Asegurado" subtitulo="Datos, vehículo, daños, servicios" icon={<Car className="w-5 h-5 text-[#13193a]" />} onClick={() => setSeccion("na")} />

        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2 px-1">Terceros</p>
          <div className="space-y-3">
            {terceros.afectadosIds.map((id, i) => {
              const t = terceros.afectados[id];
              return (
                <Tile
                  key={id}
                  titulo={t?.nombre || `Tercero ${i + 1}`}
                  subtitulo={t?.tipoTercero || "Sin tipo asignado"}
                  icon={<CarFront className="w-5 h-5 text-[#13193a]" />}
                  onClick={() => setTerceroActivo(id)}
                />
              );
            })}
            <button
              type="button"
              onClick={() => setTerceroActivo(terceros.agregarAfectado())}
              className="w-full py-3.5 rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-[#13193a]/40 hover:text-[#13193a] text-sm font-bold transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar tercero
            </button>
          </div>
        </div>

        <Tile titulo="Evidencias" subtitulo="Fotos y documentación general" icon={<Images className="w-5 h-5 text-[#13193a]" />} onClick={() => setSeccion("evidencias")} />
        <Tile titulo="Cierre" subtitulo="Encuesta, ajuste, croquis, firma del ajustador y finalizar" icon={<CheckCircle2 className="w-5 h-5 text-[#13193a]" />} onClick={() => setSeccion("cierre")} />
      </div>
    </div>
  );
}
