// ============================================================
// src/features/ajustador/na/NAModulo2Vehiculo.jsx
// Sección NA · Módulo 2: Vehículo Asegurado — datos del sistema
// (readonly) + fotos de los 4 vértices obligatorios + foto de número
// de serie (con el de sistema como referencia para comparar).
// ============================================================
import { Car, Hash } from "lucide-react";
import { PanelHeader, CampoSistema, Seccion } from "../shared";
import { BtnEvidencia, useEvidencias } from "../EvidenciaUI";

export default function NAModulo2Vehiculo({ siniestro, onVolver }) {
  const sid = siniestro.id;
  const num = siniestro.numero_siniestro ?? siniestro.folio;
  const v = siniestro.vehiculoInfo ?? {};

  // Hooks llamados de forma fija (4 vértices siempre, nunca dinámico) —
  // no se arma con .map/useEvidencias para no romper las Reglas de los
  // Hooks.
  const vFrontalIzq = useEvidencias(sid, num, "NA", "vertice_frontal_izq");
  const vFrontalDer = useEvidencias(sid, num, "NA", "vertice_frontal_der");
  const vTraseroIzq = useEvidencias(sid, num, "NA", "vertice_trasero_izq");
  const vTraseroDer = useEvidencias(sid, num, "NA", "vertice_trasero_der");
  const vertices = [
    { label: "Frontal izquierdo", ev: vFrontalIzq },
    { label: "Frontal derecho",   ev: vFrontalDer },
    { label: "Trasero izquierdo", ev: vTraseroIzq },
    { label: "Trasero derecho",   ev: vTraseroDer },
  ];
  const serie = useEvidencias(sid, num, "NA", "numero_serie");

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <PanelHeader titulo="Vehículo Asegurado" subtitulo="NA · Módulo 2 de 4" onVolver={onVolver} />
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-4">

        <Seccion titulo="Datos del sistema">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <CampoSistema label="Marca"  value={v.marca}  />
              <CampoSistema label="Modelo" value={v.modelo} />
              <CampoSistema label="Año"    value={v.anio}   />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <CampoSistema label="Color"    value={v.color}  />
              <CampoSistema label="Placas"   value={v.placas} />
              <CampoSistema label="No. Serie" value={v.serie} />
            </div>
          </div>
        </Seccion>

        <Seccion titulo="Fotografías de los 4 vértices (obligatorio)">
          <div className="grid grid-cols-2 gap-3">
            {vertices.map((x) => (
              <BtnEvidencia key={x.label} label={x.label} icon={<Car className="w-4 h-4 text-gray-400" />} items={x.ev.items} onAdd={x.ev.agregar} onRemove={x.ev.eliminar} permitirGaleria />
            ))}
          </div>
        </Seccion>

        <Seccion titulo="Número de serie">
          <div className="space-y-3">
            <CampoSistema label="Número de serie de sistema (compara contra la foto)" value={v.serie} />
            <BtnEvidencia
              label="Foto del número de serie"
              icon={<Hash className="w-4 h-4 text-gray-400" />}
              items={serie.items}
              onAdd={serie.agregar}
              onRemove={serie.eliminar}
              guiaCamara={{ titulo: "Número de serie (VIN)", instructivo: "Encuadra los 17 caracteres del número de serie dentro del recuadro" }}
            />
          </div>
        </Seccion>
      </div>
    </div>
  );
}
