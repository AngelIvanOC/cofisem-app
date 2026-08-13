// ============================================================
// src/services/comprobantesPago.js
// Compresión + subida a Storage de comprobantes de pago del corte
// (TDC, cheque/transferencia, vale, transferencia de efectivo del día).
// ============================================================
import imageCompression from "browser-image-compression";
import { supabase } from "../supabaseClient";

export const COMPROBANTE_BUCKET = "corte-comprobantes";
export const MAX_COMPROBANTE_BYTES = 8 * 1024 * 1024;

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

// Sube un comprobante a Storage bajo `${basePath}.<ext>`. Limpia otras
// extensiones del mismo basePath para no dejar huérfanos si el usuario
// reemplaza una foto por un PDF (o viceversa).
export async function subirComprobante(basePath, file) {
  const esImagen = file.type?.startsWith("image/");
  const procesado = esImagen ? await comprimirSiEsImagen(file) : file;
  const ext = esImagen ? "webp" : (file.name.split(".").pop()?.toLowerCase() || "pdf");
  const fullPath = `${basePath}.${ext}`;
  const otrasExt = ["webp", "jpg", "jpeg", "png", "heic", "pdf"].filter((e) => e !== ext);
  await supabase.storage.from(COMPROBANTE_BUCKET).remove(otrasExt.map((e) => `${basePath}.${e}`));
  const { error } = await supabase.storage
    .from(COMPROBANTE_BUCKET)
    .upload(fullPath, procesado, { contentType: procesado.type || file.type, upsert: true });
  if (error) throw error;
  return fullPath;
}

// Abre el comprobante en una pestaña nueva vía URL firmada (bucket privado).
export async function verComprobante(path) {
  if (!path) return;
  const { data, error } = await supabase.storage.from(COMPROBANTE_BUCKET).createSignedUrl(path, 3600);
  if (error) throw error;
  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}

export async function getComprobanteSignedUrl(path) {
  const { data, error } = await supabase.storage.from(COMPROBANTE_BUCKET).createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}
