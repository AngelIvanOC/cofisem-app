import Seccion from "./Seccion";
import { INP, LBL } from "../constants/estilos";

export default function SeccionConductorNA({ data, onChange }) {
  const set = (k, v) => onChange({ ...data, [k]: v });

  return (
    <Seccion titulo="Conductor del Asegurado (NA / Operador)">
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <label className={LBL}>Nombre del conductor</label>
            <input
              value={data.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              placeholder="Nombre completo"
              className={INP}
            />
          </div>
          <div className="flex-1">
            <label className={LBL}>Teléfono</label>
            <input
              type="tel"
              value={data.telefono}
              onChange={(e) => set("telefono", e.target.value)}
              placeholder="55 0000 0000"
              className={INP}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer shrink-0 pb-2.5 sm:pl-2">
            <button
              type="button"
              onClick={() => set("esTercero", !data.esTercero)}
              role="checkbox"
              aria-checked={data.esTercero}
              className={[
                "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                data.esTercero
                  ? "bg-[#13193a] border-[#13193a]"
                  : "bg-white border-gray-300 hover:border-gray-400",
              ].join(" ")}
            >
              {data.esTercero && (
                <svg
                  className="w-2.5 h-2.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="3.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
            <span
              onClick={() => set("esTercero", !data.esTercero)}
              className="text-xs font-medium text-gray-600 select-none whitespace-nowrap"
            >
              El conductor es un tercero
            </span>
          </label>
        </div>

        {data.esTercero && (
          <div className="space-y-3 pt-1">
            <div>
              <label className={LBL}>Nombre de contacto extra</label>
              <input
                value={data.contactoExtraNombre}
                onChange={(e) => set("contactoExtraNombre", e.target.value)}
                placeholder="Nombre"
                className={INP}
              />
            </div>
            <div>
              <label className={LBL}>Número de contacto extra</label>
              <input
                type="tel"
                value={data.contactoExtraTelefono}
                onChange={(e) => set("contactoExtraTelefono", e.target.value)}
                placeholder="55 0000 0000"
                className={INP}
              />
            </div>
          </div>
        )}
      </div>
    </Seccion>
  );
}
