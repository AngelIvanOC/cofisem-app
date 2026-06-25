// ============================================================
// src/services/evidencias.js
// Compresión + subida a Supabase Storage + registro en DB
// ============================================================
import imageCompression from "browser-image-compression";
import { supabase } from "../supabaseClient";
import { getState } from "../auth";

const BUCKET = "siniestros-evidencia";

const COMPRESSION_OPTS = {
  maxSizeMB:        0.4,     // objetivo 400 KB por foto
  maxWidthOrHeight: 1200,    // máximo 1200px en cualquier dimensión
  useWebWorker:     true,
  fileType:         "image/webp",
};

// ── Comprime un File — devuelve el File comprimido ────────────
export async function comprimirImagen(file) {
  try {
    return await imageCompression(file, COMPRESSION_OPTS);
  } catch {
    return file; // si falla la compresión sube el original
  }
}

// ── Tiempo relativo desde una fecha ISO ───────────────────────
export function tiempoRelativo(fechaStr) {
  const diff = Date.now() - new Date(fechaStr).getTime();
  const min  = Math.floor(diff / 60000);
  if (min < 1)   return "Hace un momento";
  if (min < 60)  return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h  < 24)   return `Hace ${h} h`;
  return `Hace ${Math.floor(h / 24)} días`;
}

// ── Fetch siniestros asignados al ajustador autenticado ───────
export async function fetchSiniestrosAjustador(ajustadorId) {
  const { data, error } = await supabase
    .from("siniestros")
    .select(`
      id, numero_siniestro, estatus, ubicacion, created_at,
      fecha_siniestro, tipo_siniestro, descripcion,
      polizas(
        id, constancia, numero_poliza, placas, num_serie, anio, fecha_fin,
        clientes(nombre, apellido, rfc, curp, telefono, email,
                 calle, colonia, ciudad, estado, cp),
        vehiculos_amis(marca, tipo, dc, dl, anio),
        coberturas(nombre)
      )
    `)
    .eq("ajustador_id", ajustadorId)
    .not("estatus", "eq", "Cerrado")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((s) => {
    const p   = s.polizas        ?? {};
    const cl  = p.clientes       ?? {};
    const veh = p.vehiculos_amis ?? {};

    const nombre    = [cl.nombre, cl.apellido].filter(Boolean).join(" ") || "—";
    const polizaNum = p.constancia || p.numero_poliza || "—";
    const vigencia  = p.fecha_fin
      ? new Date(p.fecha_fin + "T12:00:00").toLocaleDateString("es-MX", {
          day: "2-digit", month: "2-digit", year: "numeric",
        })
      : "—";

    const vehiculoDescr = [veh.marca, veh.tipo || veh.dc || veh.dl, p.anio]
      .filter(Boolean).join(" ") || p.placas || "—";

    const direccion = [cl.calle, cl.colonia, cl.ciudad, cl.estado, cl.cp]
      .filter(Boolean).join(", ") || "—";

    return {
      // IDs reales — críticos para subida de evidencias
      id:              s.id,
      numero_siniestro: s.numero_siniestro,
      // Compat con componentes de ajustador
      folio:           s.numero_siniestro,
      asegurado:       nombre,
      aseguradoInfo: {
        nombre,
        rfc:      cl.rfc      ?? "",
        curp:     cl.curp     ?? "",
        telefono: cl.telefono ?? "",
        email:    cl.email    ?? "",
        direccion,
      },
      vehiculo: vehiculoDescr,
      vehiculoInfo: {
        marca:  veh.marca ?? "",
        modelo: veh.tipo || veh.dc || veh.dl || "",
        anio:   String(veh.anio || p.anio || ""),
        color:  "",
        serie:  p.num_serie ?? "",
        placas: p.placas    ?? "",
      },
      polizaInfo: {
        numero:              polizaNum,
        vigencia,
        cobertura:           p.coberturas?.nombre ?? "—",
        aplicaDeducible:     false,
        porcentajeDeducible: 0,
      },
      ubicacion: s.ubicacion ?? null,
      coords:    null,
      telefono:  cl.telefono ?? null,
      tiempo:    tiempoRelativo(s.created_at),
      estatus:   s.estatus ?? "Asignado",
      poliza:    polizaNum,
      vigencia,
    };
  });
}

// ── Sube una imagen comprimida y registra en DB ───────────────
// tipo: 'llegada' | 'vehiculo' | 'danos' | 'documentos' | 'licencias' | 'fotos_siniestro'
export async function subirEvidencia({ siniestroId, numeroSiniestro, participante = "NA", tipo, file }) {
  const uploadedBy = getState().usuario?.id ?? null;

  // 1. Comprimir
  const compressed = await comprimirImagen(file);

  // 2. Path: {numero_siniestro}/{participante}/{tipo}/{uuid}.webp
  const uuid = crypto.randomUUID();
  const path = `${numeroSiniestro}/${participante}/${tipo}/${uuid}.webp`;

  // 3. Subir a Storage
  const { error: storageErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, compressed, { contentType: "image/webp", upsert: false });
  if (storageErr) throw storageErr;

  // 4. Registrar en DB
  const { error: dbErr } = await supabase
    .from("siniestro_evidencias")
    .insert({
      siniestro_id:     siniestroId,
      numero_siniestro: String(numeroSiniestro),
      participante,
      tipo,
      storage_path:    path,
      nombre_original: file.name,
      tamanio_bytes:   compressed.size,
      uploaded_by:     uploadedBy,
    });
  if (dbErr) throw dbErr;

  return path;
}

// ── Elimina una evidencia de Storage y de la tabla ────────────
export async function eliminarEvidencia(storagePath) {
  await supabase.storage.from(BUCKET).remove([storagePath]);
  await supabase.from("siniestro_evidencias").delete().eq("storage_path", storagePath);
}

// ── URL firmada temporal (1 hora) para visualizar ─────────────
export async function getSignedUrl(storagePath) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}

// ── Todas las evidencias de un siniestro ─────────────────────
export async function fetchEvidencias(siniestroId) {
  const { data, error } = await supabase
    .from("siniestro_evidencias")
    .select("*")
    .eq("siniestro_id", siniestroId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
