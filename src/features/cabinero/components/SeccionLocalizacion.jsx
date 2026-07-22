import Seccion from "./Seccion";
import { INP, LBL } from "../constants/estilos";
import DireccionCascada from "../../../shared/components/DireccionCascada";

export default function SeccionLocalizacion({ data, onChange }) {
  const set = (k, v) => onChange({ ...data, [k]: v });

  return (
    <Seccion titulo="Localización del Siniestro">
      <div className="space-y-3">

        {/* Estado → Municipio → Colonia → C.P. (el C.P. es el resultado,
            no el punto de partida — la gente rara vez lo sabe de memoria
            al reportar un siniestro por teléfono). */}
        <DireccionCascada
          values={{ estado: data.estado, municipio: data.municipio, colonia: data.colonia, cp: data.cp }}
          onChange={(patch) => onChange({ ...data, ...patch })}
        />

        {/* Fila: Calle | Número */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={LBL}>Calle</label>
            <input
              value={data.calle ?? ""}
              onChange={(e) => set("calle", e.target.value)}
              placeholder="Av. Emiliano Zapata"
              className={INP}
            />
          </div>
          <div>
            <label className={LBL}>Número</label>
            <input
              value={data.numero ?? ""}
              onChange={(e) => set("numero", e.target.value)}
              placeholder="145"
              className={INP}
            />
          </div>
        </div>

        {/* Referencia */}
        <div>
          <label className={LBL}>Referencia / Punto de ubicación</label>
          <textarea
            rows={2}
            value={data.referencia ?? ""}
            onChange={(e) => set("referencia", e.target.value)}
            placeholder="Ej: Frente al OXXO, esquina con Av. Plan de Ayala..."
            className={INP + " resize-none"}
          />
        </div>

      </div>
    </Seccion>
  );
}
