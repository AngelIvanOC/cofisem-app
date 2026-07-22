// ============================================================
// src/shared/components/DireccionCascada.jsx
// Selects encadenados Estado → Municipio → Colonia — el C.P. es
// el RESULTADO de elegir la colonia, no el punto de partida (la
// gente rara vez sabe su C.P. de memoria al reportar un siniestro
// por teléfono). Cada nivel se deshabilita hasta que el anterior
// tiene valor, y cambiar un nivel limpia los siguientes.
//
// No incluye calle/número/referencia — esos siguen siendo inputs
// de texto libre en el formulario que use este componente.
// ============================================================
import { useState, useEffect, useRef } from "react";
import { fetchEstados, fetchMunicipios, fetchColonias } from "../../services/direcciones";

const INP = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all";
const INP_DISABLED = "w-full border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-400 bg-gray-50 cursor-not-allowed";
const INP_RO = "w-full border border-gray-100 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#13193a] bg-[#13193a]/4 cursor-default select-none";
const LBL = "block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5";

export default function DireccionCascada({ values, onChange }) {
  const { estado = "", municipio = "", colonia = "", cp = "" } = values ?? {};

  const [estados,    setEstados]    = useState([]);
  const [municipios,  setMunicipios] = useState([]);
  const [colonias,    setColonias]   = useState([]);
  const [cargando,    setCargando]   = useState({ estados: false, municipios: false, colonias: false });

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    setCargando((c) => ({ ...c, estados: true }));
    fetchEstados()
      .then((r) => mounted.current && setEstados(r))
      .finally(() => mounted.current && setCargando((c) => ({ ...c, estados: false })));
  }, []);

  useEffect(() => {
    if (!estado) { setMunicipios([]); return; }
    setCargando((c) => ({ ...c, municipios: true }));
    fetchMunicipios(estado)
      .then((r) => mounted.current && setMunicipios(r))
      .finally(() => mounted.current && setCargando((c) => ({ ...c, municipios: false })));
  }, [estado]);

  useEffect(() => {
    if (!estado || !municipio) { setColonias([]); return; }
    setCargando((c) => ({ ...c, colonias: true }));
    fetchColonias(estado, municipio)
      .then((r) => mounted.current && setColonias(r))
      .finally(() => mounted.current && setCargando((c) => ({ ...c, colonias: false })));
  }, [estado, municipio]);

  const handleEstado = (e) => {
    onChange({ estado: e.target.value, municipio: "", colonia: "", cp: "" });
  };
  const handleMunicipio = (e) => {
    onChange({ municipio: e.target.value, colonia: "", cp: "" });
  };
  const handleColonia = (e) => {
    const nombre = e.target.value;
    const fila = colonias.find((c) => c.colonia === nombre);
    onChange({ colonia: nombre, cp: fila?.cp ?? "" });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label className={LBL}>Estado</label>
        <select value={estado} onChange={handleEstado} className={INP}>
          <option value="">{cargando.estados ? "Cargando..." : "Selecciona"}</option>
          {estados.map((e) => <option key={e}>{e}</option>)}
        </select>
      </div>

      <div>
        <label className={LBL}>Municipio</label>
        <select
          value={municipio}
          onChange={handleMunicipio}
          disabled={!estado}
          className={estado ? INP : INP_DISABLED}
        >
          <option value="">{!estado ? "Primero estado" : cargando.municipios ? "Cargando..." : "Selecciona"}</option>
          {municipios.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>

      <div>
        <label className={LBL}>Colonia</label>
        <select
          value={colonia}
          onChange={handleColonia}
          disabled={!municipio}
          className={municipio ? INP : INP_DISABLED}
        >
          <option value="">{!municipio ? "Primero municipio" : cargando.colonias ? "Cargando..." : "Selecciona"}</option>
          {colonias.map((c) => <option key={`${c.colonia}-${c.cp}`} value={c.colonia}>{c.colonia}</option>)}
        </select>
      </div>

      {cp && (
        <div className="sm:col-span-3 sm:max-w-[200px]">
          <label className={LBL}>Código Postal</label>
          <input readOnly value={cp} className={INP_RO} />
        </div>
      )}
    </div>
  );
}
