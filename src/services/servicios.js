// ============================================================
// src/services/servicios.js
// Directorio de proveedores de servicio (talleres, hospitales...) —
// ver archivos_apoyo/migracion_servicios.sql para el porqué de una
// sola tabla `servicios` con columna `tipo` en vez de una tabla por
// tipo.
// ============================================================
import { supabase } from "../supabaseClient";

// ── Talleres activos, con su dirección ya resuelta ─────────────
// `colonia` es solo la colonia (no colonia+municipio+estado) — el
// Pase Taller PDF tiene una columna angosta con encabezado "COLONIA"
// nada más (ver DATOS DEL TALLER en paseTallerGrid.js); meterle el
// municipio y el estado ahí desborda la celda.
export async function fetchTalleres() {
  const { data, error } = await supabase
    .from("servicios")
    .select("id, nombre, calle, telefono, direcciones(colonia)")
    .eq("tipo", "taller")
    .eq("activo", true)
    .order("nombre");
  if (error) throw error;

  return (data ?? []).map((s) => ({
    id: s.id,
    nombre: s.nombre,
    telefono: s.telefono,
    calle: s.calle,
    colonia: s.direcciones?.colonia ?? "",
  }));
}

// ── Hospitales/clínicas activos, más reciente primero ──────────
// Pase Médico espera un solo campo "domicilio" (a diferencia de Pase
// Taller, que separa calle/colonia en columnas propias) — se arma
// uniendo calle + colonia + municipio + estado.
export async function fetchHospitales() {
  const { data, error } = await supabase
    .from("servicios")
    .select("id, nombre, calle, telefono, direcciones(colonia, municipio, estado)")
    .eq("tipo", "hospital")
    .eq("activo", true)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((s) => ({
    id: s.id,
    nombre: s.nombre,
    telefono: s.telefono,
    domicilio: [s.calle, s.direcciones?.colonia, s.direcciones?.municipio, s.direcciones?.estado].filter(Boolean).join(", "),
  }));
}
