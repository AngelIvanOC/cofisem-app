// Catálogo de vehículos — fuente: tablas vehiculos_amis (autos) y
// motos_amis (motocicletas) en Supabase.
// Todas las funciones son async. Los resultados se cachean en memoria
// para evitar consultas repetidas durante la sesión.

import { supabase } from "../supabaseClient";

const _cache = new Map();

async function cached(key, fn) {
  if (_cache.has(key)) return _cache.get(key);
  const result = await fn();
  _cache.set(key, result);
  return result;
}

// ── Años disponibles (rango estático — la BD cubre 2012-2027) ───────────────
export function getAnios() {
  const result = [];
  for (let y = new Date().getFullYear() + 1; y >= 2000; y--) result.push(String(y));
  return result;
}

// ── Marcas disponibles para un año ──────────────────────────────────────────
export async function getMarcas(anio) {
  if (!anio) return [];
  return cached(`marcas|${anio}`, async () => {
    const { data, error } = await supabase
      .from("vehiculos_amis")
      .select("marca")
      .eq("anio", Number(anio));
    if (error) throw error;
    return [...new Set(data.map((r) => r.marca))].sort();
  });
}

// ── Tipos (modelos) para marca + año ────────────────────────────────────────
export async function getModelos(marca, anio) {
  if (!marca || !anio) return [];
  return cached(`modelos|${marca}|${anio}`, async () => {
    const { data, error } = await supabase
      .from("vehiculos_amis")
      .select("tipo")
      .eq("marca", marca)
      .eq("anio", Number(anio));
    if (error) throw error;
    return [...new Set(data.map((r) => r.tipo))].sort();
  });
}

// ── Versiones (descripción corta) para marca + tipo + año ───────────────────
export async function getVersiones(marca, modelo, anio) {
  if (!marca || !modelo || !anio) return [];
  return cached(`versiones|${marca}|${modelo}|${anio}`, async () => {
    const { data, error } = await supabase
      .from("vehiculos_amis")
      .select("dc")
      .eq("marca", marca)
      .eq("tipo", modelo)
      .eq("anio", Number(anio))
      .order("dc");
    if (error) throw error;
    return [...new Set(data.map((r) => r.dc))];
  });
}

// ── Código CVE para la combinación dada ─────────────────────────────────────
export async function getCodigoAmis(anio, marca, modelo, version) {
  if (!anio || !marca || !modelo || !version) return "";
  return cached(`cve|${anio}|${marca}|${modelo}|${version}`, async () => {
    const { data, error } = await supabase
      .from("vehiculos_amis")
      .select("cve")
      .eq("anio", Number(anio))
      .eq("marca", marca)
      .eq("tipo", modelo)
      .eq("dc", version)
      .limit(1)
      .single();
    if (error) return "";
    return data ? String(data.cve) : "";
  });
}

// ── Descripción larga (columna dl) — se guarda en polizas.descripcion ───────
export async function getDescripcionAmis(anio, marca, modelo, version) {
  if (!anio || !marca || !modelo || !version) return "";
  return cached(`dl|${anio}|${marca}|${modelo}|${version}`, async () => {
    const { data, error } = await supabase
      .from("vehiculos_amis")
      .select("dl")
      .eq("anio", Number(anio))
      .eq("marca", marca)
      .eq("tipo", modelo)
      .eq("dc", version)
      .limit(1)
      .single();
    if (error) return "";
    return data?.dl ?? "";
  });
}

// ── Buscar vehículo por CVE ─────────────────────────────────────────────────
export async function getVehiculoPorAmis(cve) {
  if (!cve) return null;
  return cached(`porCve|${cve}`, async () => {
    const { data, error } = await supabase
      .from("vehiculos_amis")
      .select("id, cve, marca, tipo, dc, anio")
      .eq("cve", Number(cve))
      .limit(1)
      .single();
    if (error || !data) return null;
    return { id: data.id, anio: String(data.anio), marca: data.marca, modelo: data.tipo, version: data.dc };
  });
}

// ── Registro completo para una combinación dada (devuelve id + todos los campos)
export async function getVehiculoAmisRecord(anio, marca, modelo, version) {
  if (!anio || !marca || !modelo || !version) return null;
  return cached(`full|${anio}|${marca}|${modelo}|${version}`, async () => {
    const { data, error } = await supabase
      .from("vehiculos_amis")
      .select("id, cve, mr, marca, tipo, dc, dl, anio")
      .eq("anio", Number(anio))
      .eq("marca", marca)
      .eq("tipo", modelo)
      .eq("dc", version)
      .limit(1)
      .single();
    if (error || !data) return null;
    return data;
  });
}

// ── "Modo manual" (independiente de año) — mismas RPC que ya usa
// FormCotizacion.jsx para vehículos que no van a quedar ligados a una
// póliza/año específico (ej. el vehículo de un tercero en un siniestro).
//
// `clase` elige el catálogo: "auto" → vehiculos_amis, "moto" → motos_amis.
// Las RPC de motos son espejo exacto de las de autos (mismo shape de
// retorno), así que lo único que cambia es el nombre de la función. El
// default "auto" mantiene intactos a los llamadores que no pasan clase.
export const CLASE_AUTO = "auto";
export const CLASE_MOTO = "moto";

const RPC = {
  [CLASE_AUTO]: {
    marcas:    "get_todas_marcas",
    tipos:     "get_tipos_por_marca",
    versiones: "get_versiones_por_marca_tipo",
  },
  [CLASE_MOTO]: {
    marcas:    "get_todas_marcas_moto",
    tipos:     "get_tipos_por_marca_moto",
    versiones: "get_versiones_por_marca_tipo_moto",
  },
};

const rpcDe = (clase) => RPC[clase] ?? RPC[CLASE_AUTO];

export async function getTodasMarcas(clase = CLASE_AUTO) {
  return cached(`rpc|todasMarcas|${clase}`, async () => {
    const { data, error } = await supabase.rpc(rpcDe(clase).marcas);
    if (error) throw error;
    return (data ?? []).map((r) => r.marca).sort();
  });
}

export async function getTiposPorMarca(marca, clase = CLASE_AUTO) {
  if (!marca) return [];
  return cached(`rpc|tipos|${clase}|${marca}`, async () => {
    const { data, error } = await supabase.rpc(rpcDe(clase).tipos, { p_marca: marca });
    if (error) throw error;
    return (data ?? []).map((r) => r.tipo).sort();
  });
}

export async function getVersionesPorMarcaTipo(marca, tipo, clase = CLASE_AUTO) {
  if (!marca || !tipo) return [];
  return cached(`rpc|versiones|${clase}|${marca}|${tipo}`, async () => {
    const { data, error } = await supabase.rpc(rpcDe(clase).versiones, { p_marca: marca, p_tipo: tipo });
    if (error) throw error;
    return (data ?? []).map((r) => r.dc).sort();
  });
}
