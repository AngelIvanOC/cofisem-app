import { useMemo } from "react";
import { ESTADOS_MX, getMunicipios } from "../../../shared/data/mexicoMunicipios";
import Seccion from "./Seccion";
import { INP, INP_DISABLED, LBL } from "../constants/estilos";

export default function SeccionLocalizacion({ data, onChange }) {
  const set = (k, v) => onChange({ ...data, [k]: v });

  const onCambiarEstado = (estado) => {
    onChange({ ...data, estado, municipio: "" });
  };

  const municipios = useMemo(
    () => (data.estado ? getMunicipios(data.estado) : []),
    [data.estado],
  );

  return (
    <Seccion titulo="Localización del Siniestro">
      <div className="space-y-3">
        {/* Fila 1: Estado | Municipio | CP */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={LBL}>Estado <span className="text-red-400">*</span></label>
            <select
              value={data.estado}
              onChange={(e) => onCambiarEstado(e.target.value)}
              className={INP}
            >
              <option value="">Selecciona</option>
              {ESTADOS_MX.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={LBL}>
              Municipio{data.estado && <span className="text-red-400"> *</span>}
            </label>
            <select
              value={data.municipio}
              onChange={(e) => set("municipio", e.target.value)}
              disabled={!data.estado}
              className={data.estado ? INP : INP_DISABLED}
            >
              <option value="">{data.estado ? "Selecciona" : "Primero estado"}</option>
              {municipios.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={LBL}>Código Postal</label>
            <input
              value={data.cp}
              onChange={(e) => set("cp", e.target.value)}
              disabled={!data.municipio}
              placeholder="00000"
              maxLength={5}
              className={data.municipio ? INP : INP_DISABLED}
            />
          </div>
        </div>

        {/* Fila 2: Colonia | Calle | Número */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={LBL}>Colonia</label>
            <input
              value={data.colonia}
              onChange={(e) => set("colonia", e.target.value)}
              disabled={!data.municipio}
              placeholder={data.municipio ? "Nombre de la colonia" : "Primero municipio"}
              className={data.municipio ? INP : INP_DISABLED}
            />
          </div>
          <div>
            <label className={LBL}>Calle</label>
            <input
              value={data.calle}
              onChange={(e) => set("calle", e.target.value)}
              disabled={!data.colonia}
              placeholder={data.colonia ? "Av. Emiliano Zapata" : "Primero colonia"}
              className={data.colonia ? INP : INP_DISABLED}
            />
          </div>
          <div>
            <label className={LBL}>Número</label>
            <input
              value={data.numero}
              onChange={(e) => set("numero", e.target.value)}
              disabled={!data.calle}
              placeholder="145"
              className={data.calle ? INP : INP_DISABLED}
            />
          </div>
        </div>

        {/* Fila 3: Referencia (full width) */}
        <div>
          <label className={LBL}>Referencia / Punto de ubicación</label>
          <textarea
            rows={2}
            value={data.referencia}
            onChange={(e) => set("referencia", e.target.value)}
            placeholder="Ej: Frente al OXXO, esquina con Av. Plan de Ayala..."
            className={INP + " resize-none"}
          />
        </div>
      </div>
    </Seccion>
  );
}
