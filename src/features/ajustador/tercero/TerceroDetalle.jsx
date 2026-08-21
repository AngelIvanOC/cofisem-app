// ============================================================
// src/features/ajustador/tercero/TerceroDetalle.jsx
// Detalle de UN tercero: tipo de tercero + 5 módulos mostrados como
// cajas (Datos personales, Vehículo, Daños, Lesionados, Servicios).
// Se llega aquí directo desde la caja del tercero en el Hub — ya no
// hay una pantalla intermedia de "lista de terceros" (esa lista y el
// botón "+ Agregar tercero" ahora viven en el Hub).
// ============================================================
import { useState } from "react";
import { IdCard, CarFront, Wrench, HeartPulse, Truck } from "lucide-react";
import { PanelHeader, Tile } from "../shared";
import TerceroModulo1Datos from "./TerceroModulo1Datos";
import TerceroModulo2Vehiculo from "./TerceroModulo2Vehiculo";
import TerceroModulo3Danos from "./TerceroModulo3Danos";
import TerceroModulo4Lesionados from "./TerceroModulo4Lesionados";
import TerceroModulo5Servicios from "./TerceroModulo4Servicios";

const TIPOS_TERCERO = ["Conductor", "Propietario del bien", "Lesionado"];

const MODULOS = [
  { id: "datos",      titulo: "Datos personales", subtitulo: "Datos, licencia, fotos",      Icon: IdCard },
  { id: "vehiculo",   titulo: "Vehículo",         subtitulo: "Datos y fotos del vehículo",  Icon: CarFront },
  { id: "danos",      titulo: "Daños",            subtitulo: "Mapa de daños del siniestro", Icon: Wrench },
  { id: "lesionados", titulo: "Lesionados",       subtitulo: "Personas lesionadas de este tercero", Icon: HeartPulse },
  { id: "servicios",  titulo: "Servicios",        subtitulo: "Taller, grúa",                Icon: Truck },
];

export default function TerceroDetalle({ siniestro, idx, datos, onDatos, onGuardar, guardando, errorGuardar, guardadoOk, onVolver, onEliminar }) {
  const [modulo, setModulo] = useState(null);

  if (modulo) {
    const props = { siniestro, datos, onDatos, onGuardar, guardando, errorGuardar, guardadoOk, onVolver: () => setModulo(null) };
    if (modulo === "datos")      return <TerceroModulo1Datos {...props} />;
    if (modulo === "vehiculo")   return <TerceroModulo2Vehiculo {...props} />;
    if (modulo === "danos")      return <TerceroModulo3Danos {...props} />;
    if (modulo === "lesionados") return <TerceroModulo4Lesionados {...props} />;
    if (modulo === "servicios")  return <TerceroModulo5Servicios {...props} />;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <PanelHeader
        titulo={datos.nombre || `Tercero ${idx}`}
        subtitulo={datos.tipoTercero || "Sin tipo asignado"}
        onVolver={onVolver}
        accion={
          <button onClick={onEliminar} className="text-xs text-red-400 hover:text-red-600 font-medium shrink-0">
            Eliminar
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-4">
        <div className="bg-gray-50 rounded-2xl p-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Tipo de tercero</p>
          <div className="flex gap-2 flex-wrap">
            {TIPOS_TERCERO.map((t) => (
              <button key={t} onClick={() => onDatos("tipoTercero", t)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${datos.tipoTercero === t ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-500 border-gray-200"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {MODULOS.map((m) => (
            <Tile key={m.id} titulo={m.titulo} subtitulo={m.subtitulo} icon={<m.Icon className="w-5 h-5 text-[#13193a]" />} onClick={() => setModulo(m.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}
