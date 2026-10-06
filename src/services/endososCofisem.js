// ============================================================
// src/services/endososCofisem.js
// Endosos manuales de una póliza Cofisem — sin pago de por medio. Se
// crean desde /polizas (PoliciasDia → ModalEndososPoliza) y se muestran
// como nota gris al final del corte (operador, analista, Excel, PDF) en
// la fecha_endoso elegida.
// ============================================================
import { supabase } from "../supabaseClient";
import { PAGOS_COMPROBANTE_BUCKET } from "./comprobantesPagoCofisem";

// ── Endosos de una póliza (para el modal de administración) ───
export async function fetchEndososPoliza(polizaCofisemId) {
  const { data, error } = await supabase
    .from("endosos_cofisem")
    .select("id, poliza_cofisem_id, folio, fecha_endoso, descripcion, archivo_url, oficina_id, creado_por, created_at")
    .eq("poliza_cofisem_id", polizaCofisemId)
    .order("fecha_endoso", { ascending: false })
    .order("id", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function crearEndosoCofisem({ polizaCofisemId, folio, fechaEndoso, descripcion, archivoUrl, oficinaId, creadoPor }) {
  const { data, error } = await supabase
    .from("endosos_cofisem")
    .insert({
      poliza_cofisem_id: polizaCofisemId,
      // Folio propio del endoso — no se hereda el de la póliza.
      folio:             folio || null,
      fecha_endoso:      fechaEndoso,
      descripcion:       descripcion || null,
      archivo_url:       archivoUrl || null,
      oficina_id:        oficinaId ?? null,
      creado_por:        creadoPor ?? null,
    })
    .select("id, poliza_cofisem_id, folio, fecha_endoso, descripcion, archivo_url, oficina_id, creado_por, created_at")
    .single();
  if (error) throw error;
  return data;
}

export async function actualizarEndosoCofisem(id, { folio, fechaEndoso, descripcion, archivoUrl }) {
  const patch = {};
  if (folio !== undefined) patch.folio = folio || null;
  if (fechaEndoso !== undefined) patch.fecha_endoso = fechaEndoso;
  if (descripcion !== undefined) patch.descripcion = descripcion || null;
  if (archivoUrl !== undefined) patch.archivo_url = archivoUrl || null;
  const { error } = await supabase.from("endosos_cofisem").update(patch).eq("id", id);
  if (error) throw error;
}

export async function eliminarEndosoCofisem(id, archivoUrl) {
  const { error } = await supabase.from("endosos_cofisem").delete().eq("id", id);
  if (error) throw error;
  if (archivoUrl) {
    await supabase.storage.from(PAGOS_COMPROBANTE_BUCKET).remove([archivoUrl]).catch(() => {});
  }
}

// ── Endosos manuales de una fecha, ya con la forma de una nota de
// endoso (misma que notaAFila en services/corteExport.js y el .map de
// la fila gris en CorteOperador/CorteAnalista) para poder mezclarlos
// directo en `notasEndoso` sin tocar Excel/PDF. `_esManual` + `archivo_url`
// son extras que solo usan las vistas interactivas. `oficinaId` opcional:
// el operador filtra por su oficina; el analista lo omite (trae todas) y
// filtra por oficina al render (notasOficina).
export async function fetchEndososManualesDia(fechaCorte, oficinaId) {
  let query = supabase
    .from("endosos_cofisem")
    .select("id, folio, fecha_endoso, descripcion, archivo_url, polizas_cofisem!inner(numero_poliza, oficina_id)")
    .eq("fecha_endoso", fechaCorte);
  if (oficinaId) query = query.eq("polizas_cofisem.oficina_id", oficinaId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: `endoso-man-${row.id}`,
    _esManual: true,
    archivo_url: row.archivo_url ?? null,
    // Folio DEL ENDOSO (no el de la póliza) — es lo que se muestra en la
    // columna Folio del corte para esta nota.
    folio: row.folio ?? null,
    polizas: {
      numero_poliza: row.polizas_cofisem?.numero_poliza ?? "—",
      constancia: null,
      oficina_id: row.polizas_cofisem?.oficina_id ?? null,
    },
    // Mediodía para que new Date(...).toLocaleDateString() no derive al día
    // anterior en zonas con offset negativo (el corte compara contra en-CA).
    cambiado_at: row.fecha_endoso ? `${row.fecha_endoso}T12:00:00` : null,
    notas: row.descripcion ?? "",
  }));
}

// ── Endosos de pólizas GAMAN ───────────────────────────────────
// Los endosos de una póliza de GAMAN SOLO se generan en GAMAN
// (polizas_historial tipo A/C) y ya llegan solos al corte con su fecha y
// su nota. COFISEM solo les agrega FOLIO y ARCHIVO, en su propia tabla
// endosos_gaman_cofisem (1 fila por endoso; fecha/oficina las pone un
// trigger). Ver archivos_apoyo/migracion_endosos_gaman_adjuntos.sql.
export async function fetchEndososGamanPoliza(polizaGamanId) {
  const { data, error } = await supabase
    .from("polizas_historial")
    .select("id, tipo_endoso, notas, cambiado_at, endosos_gaman_cofisem(folio, archivo_url)")
    .eq("poliza_id", polizaGamanId)
    .in("tipo_endoso", ["A", "C"])
    .order("cambiado_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(aplanarAdjuntoGaman);
}

export async function guardarAdjuntoEndosoGaman(historialId, { folio, archivoUrl, capturadoPor }) {
  const { error } = await supabase.from("endosos_gaman_cofisem").upsert(
    {
      historial_id: historialId,
      folio: folio || null,
      archivo_url: archivoUrl || null,
      capturado_por: capturadoPor ?? null,
    },
    { onConflict: "historial_id" },
  );
  if (error) throw error;
}

// El embed 1-a-1 llega como objeto (o arreglo según la versión de
// PostgREST); se sube folio/archivo_url al nivel de la nota para que el
// corte, el Excel y el PDF los lean igual que en un endoso manual.
export function aplanarAdjuntoGaman(row) {
  const adj = Array.isArray(row.endosos_gaman_cofisem)
    ? row.endosos_gaman_cofisem[0]
    : row.endosos_gaman_cofisem;
  return { ...row, folio: adj?.folio ?? null, archivo_url: adj?.archivo_url ?? null };
}
