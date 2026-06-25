import { useState, useEffect, useRef, useCallback } from "react";
import { ESTADOS_MX, getMunicipios } from "../../../shared/data/mexicoMunicipios";
import { buscarCP } from "../../../services/copomex";
import Seccion from "./Seccion";
import { INP, INP_DISABLED, LBL } from "../constants/estilos";

const INP_RO = INP + " bg-gray-50 text-gray-500 cursor-default";

export default function SeccionLocalizacion({ data, onChange }) {
  const set = (k, v) => onChange({ ...data, [k]: v });

  const [colonias,  setColonias]  = useState([]);
  const [buscando,  setBuscando]  = useState(false);
  const [cpError,   setCpError]   = useState(false);
  const [cpBloq,    setCpBloq]    = useState(false); // estado/municipio bloqueados por CP

  const lastCp   = useRef("");
  const mounted  = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // ── Llamar API cuando CP llega a 5 dígitos ─────────────────
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
      setCpBloq(false);
      setColonias([]);
      return;
    }

    setColonias(res.colonias);
    setCpBloq(true);
    // Functional update para no depender del data capturado en el closure
    onChange((prev) => ({
      ...prev,
      estado:    res.estado,
      municipio: res.municipio,
      colonia:   res.colonias.length === 1 ? res.colonias[0] : "",
    }));
  }, [onChange]);

  useEffect(() => {
    const cp = (data.cp ?? "").trim();
    if (cp.length !== 5 || !/^\d{5}$/.test(cp)) {
      setCpError(false);
      // Usar lastCp (ref estable) en lugar de cpBloq (state potencialmente stale)
      if (lastCp.current !== "") {
        lastCp.current = "";
        setCpBloq(false);
        setColonias([]);
      }
      return;
    }
    if (cp === lastCp.current) return;
    ejecutarBusqueda(cp);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.cp]);

  const handleCP = (e) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 5);
    setCpError(false);
    set("cp", v);
  };

  const handleReintento = () => {
    const cp = (data.cp ?? "").trim();
    if (cp.length !== 5) return;
    lastCp.current = "";
    ejecutarBusqueda(cp);
  };

  // Para el flujo manual (sin CP) necesitamos municipios del catálogo
  const municipiosCat = data.estado && !cpBloq ? getMunicipios(data.estado) : [];
  const munExtra =
    data.municipio && !municipiosCat.includes(data.municipio) ? data.municipio : null;

  const handleEstadoManual = (e) => {
    onChange({ ...data, estado: e.target.value, municipio: "", colonia: "" });
  };

  const handleMunicipioManual = (e) => {
    onChange({ ...data, municipio: e.target.value, colonia: "" });
  };

  const usarSelectColonia = colonias.length > 0;

  return (
    <Seccion titulo="Localización del Siniestro">
      <div className="space-y-3">

        {/* Fila 1: CP | Estado | Municipio */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

          {/* CP — primer campo, siempre activo */}
          <div>
            <label className={LBL}>
              Código Postal
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
              value={data.cp ?? ""}
              onChange={handleCP}
              placeholder="62000"
              maxLength={5}
              inputMode="numeric"
              className={
                INP + (cpError ? " border-red-300 focus:border-red-400 focus:ring-red-200" : "")
              }
            />
          </div>

          {/* Estado — readonly cuando CP lo llenó; select manual si no */}
          <div>
            <label className={LBL}>Estado <span className="text-red-400">*</span></label>
            {cpBloq ? (
              <input readOnly value={data.estado ?? ""} className={INP_RO} />
            ) : (
              <select
                value={data.estado ?? ""}
                onChange={handleEstadoManual}
                className={INP}
              >
                <option value="">Selecciona</option>
                {ESTADOS_MX.map((e) => <option key={e}>{e}</option>)}
              </select>
            )}
          </div>

          {/* Municipio — readonly cuando CP lo llenó; select manual si no */}
          <div>
            <label className={LBL}>
              Municipio{data.estado && <span className="text-red-400"> *</span>}
            </label>
            {cpBloq ? (
              <input readOnly value={data.municipio ?? ""} className={INP_RO} />
            ) : municipiosCat.length > 0 || munExtra ? (
              <select
                value={data.municipio ?? ""}
                onChange={handleMunicipioManual}
                disabled={!data.estado}
                className={data.estado ? INP : INP_DISABLED}
              >
                <option value="">{data.estado ? "Selecciona" : "Primero estado"}</option>
                {munExtra && <option value={munExtra}>{munExtra}</option>}
                {municipiosCat.map((m) => <option key={m}>{m}</option>)}
              </select>
            ) : (
              <input
                value={data.municipio ?? ""}
                onChange={(e) => onChange({ ...data, municipio: e.target.value, colonia: "" })}
                disabled={!data.estado}
                placeholder={data.estado ? "Municipio" : "Primero estado o C.P."}
                className={data.estado ? INP : INP_DISABLED}
              />
            )}
          </div>
        </div>

        {/* Fila 2: Colonia | Calle | Número */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

          {/* Colonia — select si CP trajo colonias, sino texto libre */}
          <div>
            <label className={LBL}>
              Colonia
              {!usarSelectColonia && data.municipio && !cpBloq && (
                <span className="ml-1.5 normal-case font-normal text-gray-300 text-[10px]">
                  (ingresa C.P. para listar)
                </span>
              )}
            </label>
            {usarSelectColonia ? (
              <select
                value={data.colonia ?? ""}
                onChange={(e) => set("colonia", e.target.value)}
                className={INP}
              >
                <option value="">Selecciona colonia</option>
                {data.colonia && !colonias.includes(data.colonia) && (
                  <option key="__saved" value={data.colonia}>{data.colonia}</option>
                )}
                {colonias.map((c) => <option key={c}>{c}</option>)}
              </select>
            ) : (
              <input
                value={data.colonia ?? ""}
                onChange={(e) => set("colonia", e.target.value)}
                placeholder="Nombre de la colonia"
                className={INP}
              />
            )}
          </div>

          {/* Calle — siempre manual */}
          <div>
            <label className={LBL}>Calle</label>
            <input
              value={data.calle ?? ""}
              onChange={(e) => set("calle", e.target.value)}
              placeholder="Av. Emiliano Zapata"
              className={INP}
            />
          </div>

          {/* Número — siempre manual */}
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

        {/* Fila 3: Referencia */}
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
