// ============================================================
// src/services/comprobantesPagoCofisem.js
// Compresión + subida a Storage de comprobantes de pago de las
// cuotas subsecuentes (2ª en adelante) de pólizas COFISEM.
// ============================================================
import imageCompression from "browser-image-compression";
import { supabase } from "../supabaseClient";

export const PAGOS_COMPROBANTE_BUCKET = "pagos-comprobantes";
export const MAX_PAGO_COMPROBANTE_BYTES = 8 * 1024 * 1024;

const COMPRESSION_OPTS = {
  maxSizeMB:        0.5,
  maxWidthOrHeight: 1600,
  useWebWorker:     true,
  fileType:         "image/webp",
};

async function comprimirSiEsImagen(file) {
  if (!file.type?.startsWith("image/")) return file;
  try {
    return await imageCompression(file, COMPRESSION_OPTS);
  } catch {
    return file;
  }
}

export async function subirComprobantePago(basePath, file) {
  const esImagen = file.type?.startsWith("image/");
  const procesado = esImagen ? await comprimirSiEsImagen(file) : file;
  const ext = esImagen ? "webp" : (file.name.split(".").pop()?.toLowerCase() || "pdf");
  const fullPath = `${basePath}.${ext}`;
  const otrasExt = ["webp", "jpg", "jpeg", "png", "heic", "pdf"].filter((e) => e !== ext);
  await supabase.storage.from(PAGOS_COMPROBANTE_BUCKET).remove(otrasExt.map((e) => `${basePath}.${e}`));
  const { error } = await supabase.storage
    .from(PAGOS_COMPROBANTE_BUCKET)
    .upload(fullPath, procesado, { contentType: procesado.type || file.type, upsert: true });
  if (error) throw error;
  return fullPath;
}

export async function verComprobantePago(path) {
  if (!path) return;
  const { data, error } = await supabase.storage.from(PAGOS_COMPROBANTE_BUCKET).createSignedUrl(path, 3600);
  if (error) throw error;
  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}
