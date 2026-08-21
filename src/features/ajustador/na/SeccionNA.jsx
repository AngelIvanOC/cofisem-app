// ============================================================
// src/features/ajustador/na/SeccionNA.jsx
// Sección "NA — Nuestro Asegurado": 4 módulos mostrados como cajas.
// Al picar una, entra a ese módulo; "atrás" regresa a esta grilla.
// ============================================================
import { useState } from "react";
import { IdCard, Car, Wrench, Stethoscope } from "lucide-react";
import { PanelHeader, Tile } from "../shared";
import NAModulo1Asegurado from "./NAModulo1Asegurado";
import NAModulo2Vehiculo from "./NAModulo2Vehiculo";
import NAModulo3Danos from "./NAModulo3Danos";
import NAModulo4Servicios from "./NAModulo4Servicios";

const MODULOS = [
  { id: "asegurado", titulo: "Datos del Asegurado", subtitulo: "Datos personales, licencia, tarjeta de circulación", Icon: IdCard },
  { id: "vehiculo",   titulo: "Vehículo Asegurado",  subtitulo: "Vértices, número de serie",                        Icon: Car },
  { id: "danos",      titulo: "Daños",               subtitulo: "Descripción y mapa de daños",                     Icon: Wrench },
  { id: "servicios",  titulo: "Servicios",           subtitulo: "Abogado, pase médico",                            Icon: Stethoscope },
];

export default function SeccionNA({ siniestro, onVolver }) {
  const [modulo, setModulo] = useState(null);

  if (modulo === "asegurado") return <NAModulo1Asegurado siniestro={siniestro} onVolver={() => setModulo(null)} />;
  if (modulo === "vehiculo")   return <NAModulo2Vehiculo   siniestro={siniestro} onVolver={() => setModulo(null)} />;
  if (modulo === "danos")      return <NAModulo3Danos      siniestro={siniestro} onVolver={() => setModulo(null)} />;
  if (modulo === "servicios")  return <NAModulo4Servicios  siniestro={siniestro} onVolver={() => setModulo(null)} />;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <PanelHeader titulo="NA — Nuestro Asegurado" subtitulo={`${siniestro.id} · ${siniestro.asegurado}`} onVolver={onVolver} />
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-3">
        {MODULOS.map((m) => (
          <Tile key={m.id} titulo={m.titulo} subtitulo={m.subtitulo} icon={<m.Icon className="w-5 h-5 text-[#13193a]" />} onClick={() => setModulo(m.id)} />
        ))}
      </div>
    </div>
  );
}
