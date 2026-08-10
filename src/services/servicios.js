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

// ── Proveedores activos de cualquier tipo — usado por el registro de
// costos del supervisor (taller/grúa/hospital/legal...). A diferencia
// de fetchTalleres/fetchHospitales (pensadas para los PDFs de pases,
// que necesitan la dirección ya formateada distinto cada una), esta
// devuelve un shape genérico.
export async function fetchProveedores(tipo) {
  const { data, error } = await supabase
    .from("servicios")
    .select("id, nombre, calle, telefono, direcciones(colonia, municipio, estado)")
    .eq("tipo", tipo)
    .eq("activo", true)
    .order("nombre");
  if (error) throw error;
  return (data ?? []).map((s) => ({
    id: s.id,
    nombre: s.nombre,
    telefono: s.telefono,
    calle: s.calle,
    domicilio: [s.calle, s.direcciones?.colonia, s.direcciones?.municipio, s.direcciones?.estado].filter(Boolean).join(", "),
  }));
}

// ── Resuelve el id de una fila ya existente en el catálogo SEPOMEX
// `direcciones` (cp, colonia) — DireccionCascada entrega el par
// colonia+cp, nunca el id, porque el catálogo no se edita desde la app.
export async function resolverDireccionId({ cp, colonia }) {
  if (!cp || !colonia) return null;
  const { data, error } = await supabase
    .from("direcciones")
    .select("id")
    .eq("cp", cp)
    .eq("colonia", colonia)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

// ── Da de alta un proveedor nuevo en el directorio (taller, grúa,
// hospital, despacho legal...) — lo que capture DireccionCascada se
// resuelve primero a un direccion_id real del catálogo SEPOMEX.
export async function crearProveedor({ tipo, nombre, calle, telefono, cp, colonia }) {
  const direccionId = await resolverDireccionId({ cp, colonia });
  if (!direccionId) throw new Error("No se pudo resolver la dirección seleccionada");

  const { data, error } = await supabase
    .from("servicios")
    .insert({ tipo, nombre, calle, telefono, direccion_id: direccionId })
    .select("id, nombre, calle, telefono")
    .single();
  if (error) throw error;
  return { id: data.id, nombre: data.nombre, telefono: data.telefono, calle: data.calle, domicilio: [data.calle, colonia].filter(Boolean).join(", ") };
}

// ── Directorio completo (cualquier tipo, activos e inactivos) — para
// la pantalla de administración que gestiona el catálogo.
export async function fetchTodosLosServicios() {
  const { data, error } = await supabase
    .from("servicios")
    .select("id, tipo, nombre, calle, telefono, activo, created_at, direccion_id, direcciones(estado, municipio, colonia, cp)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((s) => ({
    id:          s.id,
    tipo:        s.tipo,
    nombre:      s.nombre,
    calle:       s.calle,
    telefono:    s.telefono,
    activo:      s.activo,
    direccionId: s.direccion_id,
    estado:      s.direcciones?.estado    ?? "",
    municipio:   s.direcciones?.municipio ?? "",
    colonia:     s.direcciones?.colonia   ?? "",
    cp:          s.direcciones?.cp        ?? "",
  }));
}

// ── Edita un proveedor existente — si se manda cp+colonia nuevos, se
// vuelve a resolver el direccion_id; si no, se deja el que ya tenía.
export async function actualizarProveedor(id, { tipo, nombre, calle, telefono, cp, colonia }) {
  const payload = { tipo, nombre, calle: calle || null, telefono: telefono || null };
  if (cp && colonia) {
    const direccionId = await resolverDireccionId({ cp, colonia });
    if (!direccionId) throw new Error("No se pudo resolver la dirección seleccionada");
    payload.direccion_id = direccionId;
  }
  const { error } = await supabase.from("servicios").update(payload).eq("id", id);
  if (error) throw error;
}

export async function toggleActivoProveedor(id, activo) {
  const { error } = await supabase.from("servicios").update({ activo }).eq("id", id);
  if (error) throw error;
}
