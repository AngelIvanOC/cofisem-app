// ============================================================
// src/shared/components/SwitchClaseVehiculo.jsx
// Selector Auto / Moto para el vehículo de un tercero. Decide de qué
// catálogo AMIS se alimentan los selects de Marca → Modelo/Submarca:
// "auto" → vehiculos_amis, "moto" → motos_amis (ver services/vehiculos.js).
//
// Lo usan cabina (TerceroCard) y ajustador (TerceroModulo2Vehiculo) con
// el mismo valor, que viaja en siniestros_terceros.vehiculo_clase — así
// el ajustador abre el catálogo que ya eligió el cabinero.
// ============================================================
import { CarFront, Motorbike } from "lucide-react";
import { CLASE_AUTO, CLASE_MOTO } from "../../services/vehiculos";

const OPCIONES = [
  { clase: CLASE_AUTO, label: "Auto", Icon: CarFront },
  { clase: CLASE_MOTO, label: "Moto", Icon: Motorbike },
];

export default function SwitchClaseVehiculo({ value, onChange, label = "Tipo de unidad" }) {
  const actual = value === CLASE_MOTO ? CLASE_MOTO : CLASE_AUTO;

  return (
    <div>
      {label && (
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
          {label}
        </label>
      )}
      <div
        role="radiogroup"
        aria-label={label || "Tipo de unidad"}
        className="inline-flex p-1 gap-1 rounded-xl bg-gray-100 border border-gray-200"
      >
        {OPCIONES.map((op) => {
          const activo = actual === op.clase;
          return (
            <button
              key={op.clase}
              type="button"
              role="radio"
              aria-checked={activo}
              title={op.label}
              onClick={() => { if (!activo) onChange(op.clase); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activo
                  ? "bg-[#13193a] text-white shadow-sm"
                  : "text-gray-500 hover:text-[#13193a] hover:bg-white/70"
              }`}
            >
              <op.Icon className="w-4 h-4" />
              {op.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
