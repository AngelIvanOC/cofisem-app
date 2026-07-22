// ============================================================
// src/services/direcciones.js
// Consultas INVERSAS contra la tabla propia `direcciones`
// (cp, colonia, municipio, estado) — a diferencia de copomex.js
// (busca por C.P. exacto), aquí se navega Estado → Municipio →
// Colonia y el C.P. sale al final, no al principio.
//
// Usa RPC (get_estados/get_municipios_por_estado/get_colonias_por_
// municipio, ver archivos_apoyo/migracion_direcciones_rpc.sql) en vez
// de un SELECT directo: `direcciones` tiene el catálogo SEPOMEX
// completo (cientos de miles de filas) y un SELECT normal se topa con
// el límite de 1000 filas por respuesta de PostgREST antes de poder
// deduplicar del lado del cliente. Haciendo el DISTINCT en Postgres la
// respuesta ya viene chica (32 estados, cientos de municipios/colonias
// cuando mucho) y nunca choca con ese límite.
// ============================================================
import { supabase } from "../supabaseClient";

export async function fetchEstados() {
  const { data, error } = await supabase.rpc("get_estados");
  if (error) throw error;
  return (data ?? []).map((r) => r.estado).filter(Boolean);
}

export async function fetchMunicipios(estado) {
  if (!estado) return [];
  const { data, error } = await supabase.rpc("get_municipios_por_estado", { p_estado: estado });
  if (error) throw error;
  return (data ?? []).map((r) => r.municipio).filter(Boolean);
}

// Devuelve [{ colonia, cp }] — puede haber varias colonias con el mismo
// nombre pero distinto C.P. dentro del mismo municipio; se deja tal cual
// (no se deduplica por nombre) para no perder esa distinción.
export async function fetchColonias(estado, municipio) {
  if (!estado || !municipio) return [];
  const { data, error } = await supabase.rpc("get_colonias_por_municipio", { p_estado: estado, p_municipio: municipio });
  if (error) throw error;
  return (data ?? []).filter((r) => r.colonia && r.cp);
}
