import { useState, useEffect, useCallback } from "react";
import { INP, LBL } from "../constants/estilos";
import { getTodasMarcas, getTiposPorMarca, CLASE_AUTO } from "../../../services/vehiculos";
import SwitchClaseVehiculo from "../../../shared/components/SwitchClaseVehiculo";

// Colores más comunes en vehículos — lista fija, no viene de catálogo.
const COLORES_COMUNES = [
  "Blanco",
  "Negro",
  "Gris",
  "Plata",
  "Rojo",
  "Azul",
  "Café",
  "Verde",
  "Amarillo",
  "Naranja",
  "Dorado",
  "Vino",
  "Beige",
  "Morado",
];

// Años del catálogo AMIS (2000–actual+1, mismo rango que ya usa el resto
// de la app para "modo manual" independiente de una póliza específica).

const OTRO = "__otro__";

// Select respaldado por catálogo con opción "Otro" para texto libre —
// el valor real sigue siendo el mismo campo de texto en ambos modos
// (nunca se guarda "__otro__"), así que a quien lea el dato después
// (el ajustador) le da igual si vino del catálogo o capturado a mano.
function CampoSelectOtro({ label, value, options, onChange, placeholder }) {
  const [manual, setManual] = useState(!!value && !options.includes(value));

  return (
    <div>
      <label className={LBL}>{label}</label>
      {manual ? (
        <div className="flex gap-1.5">
          <input
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={INP}
          />
          <button
            type="button"
            onClick={() => {
              setManual(false);
              onChange("");
            }}
            title="Volver al catálogo"
            className="shrink-0 px-3 rounded-xl border border-gray-200 text-xs font-medium text-gray-400 hover:text-[#13193a] hover:border-gray-300 transition-all"
          >
            Catálogo
          </button>
        </div>
      ) : (
        <select
          value={value}
          onChange={(e) => {
            if (e.target.value === OTRO) {
              setManual(true);
              onChange("");
            } else onChange(e.target.value);
          }}
          className={INP}
        >
          <option value="">Selecciona...</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
          <option value={OTRO}>Otro (escribir)</option>
        </select>
      )}
    </div>
  );
}

export default function TerceroCard({
  tercero,
  index,
  onChange,
  onRemove,
  permitirEliminar,
}) {
  const set = useCallback(
    (k, v) => onChange(tercero.id, k, v),
    [tercero.id, onChange],
  );

  // Auto o moto — decide de qué catálogo AMIS salen marcas y modelos
  // (vehiculos_amis vs motos_amis). El valor viaja al siniestro
  // (siniestros_terceros.vehiculo_clase) para que el ajustador abra el
  // mismo catálogo al continuar el caso.
  const clase = tercero.vehiculoClase || CLASE_AUTO;

  // Modo manual (independiente de año) — mismas marcas que ya usa el
  // resto de la app para vehículos de terceros (ver getTodasMarcas en
  // services/vehiculos.js). No se relaciona con un id del catálogo,
  // solo se usa como fuente de texto para las opciones del select.
  const [marcas, setMarcas] = useState([]);
  useEffect(() => {
    let cancelado = false;
    getTodasMarcas(clase)
      .then((m) => { if (!cancelado) setMarcas(m); })
      .catch(() => { if (!cancelado) setMarcas([]); });
    return () => { cancelado = true; };
  }, [clase]);

  // Modelos disponibles para la marca seleccionada — sin filtro de año.
  const [modelos, setModelos] = useState([]);
  useEffect(() => {
    if (!tercero.vehiculoDesc) {
      setModelos([]);
      return;
    }
    let cancelado = false;
    getTiposPorMarca(tercero.vehiculoDesc, clase)
      .then((m) => { if (!cancelado) setModelos(m); })
      .catch(() => { if (!cancelado) setModelos([]); });
    return () => { cancelado = true; };
  }, [tercero.vehiculoDesc, clase]);

  // Cambiar de auto a moto (o al revés) invalida marca y modelo ya
  // capturados: los dos catálogos no comparten marcas. El `key` de los
  // selects también depende de la clase, para que CampoSelectOtro
  // reinicie su modo manual/catálogo.
  const cambiarClase = (nueva) => {
    set("vehiculoClase", nueva);
    set("vehiculoDesc", "");
    set("vehiculoModelo", "");
  };

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-[#13193a] text-white flex items-center justify-center text-xs font-bold shrink-0">
            {index + 1}
          </div>
          <span className="text-sm font-bold text-[#13193a]">
            Vehículo tercero #{index + 1}
          </span>
        </div>
        {permitirEliminar && (
          <button
            type="button"
            onClick={() => onRemove(tercero.id)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Eliminar
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        <SwitchClaseVehiculo value={clase} onChange={cambiarClase} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CampoSelectOtro
            key={`marca-${clase}`}
            label="Marca"
            value={tercero.vehiculoDesc}
            options={marcas}
            onChange={(v) => set("vehiculoDesc", v)}
            placeholder="Marca"
          />
          <CampoSelectOtro
            key={`modelo-${clase}`}
            label="Modelo"
            value={tercero.vehiculoModelo}
            options={modelos}
            onChange={(v) => set("vehiculoModelo", v)}
            placeholder="Modelo"
          />
          <CampoSelectOtro
            label="Color"
            value={tercero.vehiculoColor}
            options={COLORES_COMUNES}
            onChange={(v) => set("vehiculoColor", v)}
            placeholder="Color"
          />
          <div>
            <label className={LBL}>Placas</label>
            <input
              value={tercero.vehiculoPlacas}
              onChange={(e) => set("vehiculoPlacas", e.target.value)}
              placeholder="Placas"
              className={INP}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
