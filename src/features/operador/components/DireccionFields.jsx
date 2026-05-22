import { useState, useEffect, useRef, useCallback } from "react";
import { ESTADOS_MX } from "../constants/catalogos";
import { ESTADOS_MUNICIPIOS } from "../../../shared/data/mexicoMunicipios";
import { buscarCP } from "../../../services/copomex";

const inp =
  "w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all";
const dis = " opacity-50 cursor-not-allowed bg-gray-50";
const lbl =
  "block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5";
const reqMark = <span className="text-red-400 ml-0.5">*</span>;

/**
 * Campos de dirección con auto-relleno por C.P. y selects en cascada.
 *
 * Comportamiento:
 *   • Si el usuario escribe un CP válido (5 dígitos): se buscan en la API
 *     el ESTADO, MUNICIPIO y las COLONIAS de ese CP. Todos se llenan.
 *   • Si no escribe CP (flujo manual): el usuario elige Estado → Municipio
 *     desde los selects estáticos. La Colonia se escribe a mano porque sin
 *     CP no podemos saber qué colonias existen.
 *   • Si el municipio devuelto por la API no está en el catálogo estático,
 *     se añade dinámicamente como opción adicional para que sea seleccionable.
 *   • Calle y Número son siempre manuales.
 *
 * Props:
 *   values   = { cp, estado, municipio, colonia, calle, numeroExt, numeroInt }
 *   onChange(key, value)
 *   req      → boolean: muestra * en los labels obligatorios
 */
export default function DireccionFields({ values, onChange, req: required }) {
  const [municipiosCat, setMunicipiosCat] = useState([]); // del catálogo estático
  const [coloniasAPI, setColoniasAPI] = useState([]); // de la API (cuando hay CP)
  const [buscando, setBuscando] = useState(false);
  const [cpError, setCpError] = useState(false);

  const lastCp = useRef("");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // ── Búsqueda en API ──────────────────────────────────────────────────────
  const ejecutarBusqueda = useCallback(
    async (cp) => {
      if (!mounted.current) return;
      lastCp.current = cp;
      setBuscando(true);
      setCpError(false);

      const res = await buscarCP(cp);

      if (!mounted.current) return;
      setBuscando(false);

      if (!res) {
        setCpError(true);
        setColoniasAPI([]);
        return;
      }

      // Aplica TODOS los campos resueltos por la API en un solo "batch"
      onChange("estado", res.estado);
      onChange("municipio", res.municipio);
      // Si hay una sola colonia, se autoselecciona. Si hay varias, queda
      // vacío para que el usuario elija.
      onChange("colonia", res.colonias.length === 1 ? res.colonias[0] : "");
      setColoniasAPI(res.colonias);
    },
    [onChange],
  );

  // ── Cuando cambia el C.P. → buscar ──────────────────────────────────────
  useEffect(() => {
    const cp = (values.cp ?? "").trim();
    if (cp.length !== 5) {
      // CP incompleto → limpia el indicador de error pero no toca el resto
      if (cpError) setCpError(false);
      return;
    }
    if (!/^\d{5}$/.test(cp)) return;
    if (cp === lastCp.current) return;
    ejecutarBusqueda(cp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.cp]);

  // ── Cuando cambia el estado → cargar municipios del catálogo estático ───
  useEffect(() => {
    setMunicipiosCat(
      values.estado ? (ESTADOS_MUNICIPIOS[values.estado] ?? []) : [],
    );
  }, [values.estado]);

  // ── Cambios manuales ─────────────────────────────────────────────────────
  const handleEstado = (e) => {
    // Si el usuario cambia el estado manualmente, invalida la búsqueda previa
    lastCp.current = "";
    setColoniasAPI([]);
    onChange("estado", e.target.value);
    onChange("municipio", "");
    onChange("colonia", "");
  };

  const handleMunicipio = (e) => {
    // Si el usuario cambia el municipio manualmente, limpia las colonias de la API
    // (porque eran de otro municipio)
    setColoniasAPI([]);
    onChange("municipio", e.target.value);
    onChange("colonia", "");
  };

  const handleCP = (e) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 5);
    setCpError(false);
    onChange("cp", v);
  };

  const handleReintento = () => {
    const cp = (values.cp ?? "").trim();
    if (cp.length !== 5) return;
    lastCp.current = "";
    ejecutarBusqueda(cp);
  };

  // Si el municipio actual no está en el catálogo estático (pasó por API
  // o tiene formato distinto), se añade como opción dinámica
  const munExtra =
    values.municipio && !municipiosCat.includes(values.municipio)
      ? values.municipio
      : null;

  // Decidir qué mostrar para colonia:
  // - Si hay colonias de la API → select
  // - Si no, pero hay un municipio → input texto (no podemos listar colonias sin CP)
  const usarSelectColonia = coloniasAPI.length > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* C.P. */}
      <div>
        <label className={lbl}>
          C.P.{required && reqMark}
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
          onChange={handleCP}
          placeholder="62000"
          maxLength={5}
          inputMode="numeric"
          className={
            inp +
            (cpError
              ? " border-red-300 focus:border-red-400 focus:ring-red-200"
              : "")
          }
        />
      </div>

      {/* Estado */}
      <div>
        <label className={lbl}>Estado{required && reqMark}</label>
        <select
          value={values.estado ?? ""}
          onChange={handleEstado}
          className={inp}
        >
          <option value="">Selecciona estado</option>
          {ESTADOS_MX.map((e) => (
            <option key={e}>{e}</option>
          ))}
        </select>
      </div>

      {/* Municipio */}
      <div>
        <label className={lbl}>Municipio{required && reqMark}</label>
        {municipiosCat.length > 0 || munExtra ? (
          <select
            value={values.municipio ?? ""}
            onChange={handleMunicipio}
            disabled={!values.estado}
            className={inp + (!values.estado ? dis : "")}
          >
            <option value="">Selecciona municipio</option>
            {munExtra && <option value={munExtra}>{munExtra}</option>}
            {municipiosCat.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        ) : (
          <input
            value={values.municipio ?? ""}
            onChange={(e) => onChange("municipio", e.target.value)}
            disabled={!values.estado}
            placeholder={
              values.estado ? "Municipio" : "Elige estado o ingresa C.P."
            }
            className={inp + (!values.estado ? dis : "")}
          />
        )}
      </div>

      {/* Colonia */}
      <div>
        <label className={lbl}>
          Colonia{required && reqMark}
          {!usarSelectColonia && values.municipio && (
            <span className="ml-1.5 normal-case font-normal text-gray-300 text-[10px]">
              (escribe el C.P. para listar)
            </span>
          )}
        </label>
        {usarSelectColonia ? (
          <select
            value={values.colonia ?? ""}
            onChange={(e) => onChange("colonia", e.target.value)}
            className={inp}
          >
            <option value="">Selecciona colonia</option>
            {coloniasAPI.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        ) : (
          <input
            value={values.colonia ?? ""}
            onChange={(e) => onChange("colonia", e.target.value)}
            disabled={!values.municipio}
            placeholder={
              values.municipio
                ? "Nombre de la colonia"
                : "Primero municipio o C.P."
            }
            className={inp + (!values.municipio ? dis : "")}
          />
        )}
      </div>

      {/* Calle */}
      <div className="sm:col-span-2">
        <label className={lbl}>Calle{required && reqMark}</label>
        <input
          value={values.calle ?? ""}
          onChange={(e) => onChange("calle", e.target.value)}
          placeholder="Av. Emiliano Zapata"
          className={inp}
        />
      </div>

      {/* No. Exterior */}
      <div>
        <label className={lbl}>No. Exteior{required && reqMark}</label>
        <input
          value={values.numeroExt ?? ""}
          onChange={(e) => onChange("numeroExt", e.target.value)}
          placeholder="145"
          className={inp}
        />
      </div>

      {/* No. Interior */}
      <div>
        <label className={lbl}>No. Interior</label>
        <input
          value={values.numeroInt ?? ""}
          onChange={(e) => onChange("numeroInt", e.target.value)}
          placeholder="2B (opcional)"
          className={inp}
        />
      </div>
    </div>
  );
}
