import { useState, useEffect, useRef, useCallback } from "react";
import { ESTADOS_MX } from "../constants/catalogos";
import { ESTADOS_MUNICIPIOS } from "../../../shared/data/mexicoMunicipios";
import { buscarCP } from "../../../services/copomex";

const inp = "w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all";
const dis = " opacity-50 cursor-not-allowed bg-gray-50";
const lbl = "block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5";

/**
 * Campos de dirección con auto-relleno por C.P. y selects en cascada.
 *
 * Flujo C.P. (5 dígitos) → SEPOMEX API → Estado + Municipio + Colonia (selects)
 * Flujo manual           → Estado select → Municipio select → Colonia texto
 * Siempre manuales (abajo): Calle · Número
 *
 * Props:
 *   values   = { cp, estado, municipio, colonia, calle, numero }
 *   onChange(key, value)
 */
const req = <span className="text-red-400 ml-0.5">*</span>;

export default function DireccionFields({ values, onChange, req: required }) {
  const [municipios, setMunicipios] = useState([]);
  const [colonias,   setColonias]   = useState([]);
  const [buscando,   setBuscando]   = useState(false);
  const [cpError,    setCpError]    = useState(false);

  const lastCp    = useRef("");
  const mounted   = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // ── Buscar en la API ─────────────────────────────────────────────────────
  const ejecutarBusqueda = useCallback(async (cp) => {
    if (!mounted.current) return;
    lastCp.current = cp;
    setBuscando(true);
    setCpError(false);

    const res = await buscarCP(cp);

    if (!mounted.current) return;
    setBuscando(false);

    if (!res) {
      setCpError(true);
      return;
    }

    onChange("estado",    res.estado);
    onChange("municipio", res.municipio);
    onChange("colonia",   res.colonias[0] ?? "");
    setColonias(res.colonias);
  }, [onChange]);

  // ── Cuando cambia el C.P. → buscar ──────────────────────────────────────
  useEffect(() => {
    const cp = (values.cp ?? "").trim();
    setCpError(false);
    if (cp.length !== 5 || !/^\d{5}$/.test(cp) || cp === lastCp.current) return;
    ejecutarBusqueda(cp);
  }, [values.cp, ejecutarBusqueda]);

  // ── Cuando cambia el estado → cargar municipios ──────────────────────────
  useEffect(() => {
    setMunicipios(values.estado ? (ESTADOS_MUNICIPIOS[values.estado] ?? []) : []);
  }, [values.estado]);

  // ── Cambios manuales ─────────────────────────────────────────────────────
  const handleEstado = e => {
    lastCp.current = "";
    setColonias([]);
    onChange("estado",    e.target.value);
    onChange("municipio", "");
    onChange("colonia",   "");
  };

  const handleMunicipio = e => {
    setColonias([]);
    onChange("municipio", e.target.value);
    onChange("colonia",   "");
  };

  const handleReintento = () => {
    const cp = (values.cp ?? "").trim();
    if (cp.length !== 5) return;
    lastCp.current = "";
    ejecutarBusqueda(cp);
  };

  // Si el municipio del API no está en la lista estática, lo añadimos
  const munExtra =
    values.municipio && !municipios.includes(values.municipio)
      ? values.municipio
      : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

      {/* C.P. */}
      <div>
        <label className={lbl}>
          C.P.{required && req}
          {buscando && (
            <span className="ml-1.5 normal-case font-normal text-gray-300 text-[10px]">
              buscando…
            </span>
          )}
          {cpError && !buscando && (
            <button
              type="button"
              onClick={handleReintento}
              className="ml-1.5 normal-case font-normal text-red-400 text-[10px] hover:text-red-600 underline"
            >
              No encontrado — Reintentar
            </button>
          )}
        </label>
        <input
          value={values.cp ?? ""}
          onChange={e => {
            setCpError(false);
            onChange("cp", e.target.value);
          }}
          placeholder="62000"
          maxLength={5}
          className={inp + (cpError ? " border-red-300 focus:border-red-400 focus:ring-red-200" : "")}
        />
      </div>

      {/* Estado */}
      <div>
        <label className={lbl}>Estado{required && req}</label>
        <select
          value={values.estado ?? ""}
          onChange={handleEstado}
          className={inp}
        >
          <option value="">Selecciona estado</option>
          {ESTADOS_MX.map(e => <option key={e}>{e}</option>)}
        </select>
      </div>

      {/* Municipio */}
      <div>
        <label className={lbl}>Municipio{required && req}</label>
        {municipios.length > 0 ? (
          <select
            value={values.municipio ?? ""}
            onChange={handleMunicipio}
            className={inp}
          >
            <option value="">Selecciona municipio</option>
            {munExtra && <option value={munExtra}>{munExtra}</option>}
            {municipios.map(m => <option key={m}>{m}</option>)}
          </select>
        ) : (
          <input
            value={values.municipio ?? ""}
            onChange={e => { onChange("municipio", e.target.value); }}
            disabled={!values.estado}
            placeholder={values.estado ? "Municipio" : "Ingresa C.P. o elige estado"}
            className={inp + (!values.estado ? dis : "")}
          />
        )}
      </div>

      {/* Colonia */}
      <div>
        <label className={lbl}>Colonia{required && req}</label>
        <select
          value={values.colonia ?? ""}
          onChange={e => onChange("colonia", e.target.value)}
          disabled={!values.municipio}
          className={inp + (!values.municipio ? dis : "")}
        >
          <option value="">Selecciona colonia</option>
          {colonias.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Calle */}
      <div className="sm:col-span-2">
        <label className={lbl}>Calle{required && req}</label>
        <input
          value={values.calle ?? ""}
          onChange={e => onChange("calle", e.target.value)}
          placeholder="Av. Emiliano Zapata"
          className={inp}
        />
      </div>

      {/* No. Exterior */}
      <div>
        <label className={lbl}>No. Exterior{required && req}</label>
        <input
          value={values.numeroExt ?? ""}
          onChange={e => onChange("numeroExt", e.target.value)}
          placeholder="145"
          className={inp}
        />
      </div>

      {/* No. Interior */}
      <div>
        <label className={lbl}>No. Interior</label>
        <input
          value={values.numeroInt ?? ""}
          onChange={e => onChange("numeroInt", e.target.value)}
          placeholder="2B (opcional)"
          className={inp}
        />
      </div>

    </div>
  );
}
