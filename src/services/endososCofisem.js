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
    .select("id, poliza_cofisem_id, fecha_endoso, descripcion, archivo_url, oficina_id, creado_por, created_at")
    .eq("poliza_cofisem_id", polizaCofisemId)
    .order("fecha_endoso", { ascending: false })
    .order("id", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function crearEndosoCofisem({ polizaCofisemId, fechaEndoso, descripcion, archivoUrl, oficinaId, creadoPor }) {
  const { data, error } = await supabase
    .from("endosos_cofisem")
    .insert({
      poliza_cofisem_id: polizaCofisemId,
      fecha_endoso:      fechaEndoso,
      descripcion:       descripcion || null,
      archivo_url:       archivoUrl || null,
      oficina_id:        oficinaId ?? null,
      creado_por:        creadoPor ?? null,
    })
    .select("id, poliza_cofisem_id, fecha_endoso, descripcion, archivo_url, oficina_id, creado_por, created_at")
    .single();
  if (error) throw error;
  return data;
}

export async function actualizarEndosoCofisem(id, { fechaEndoso, descripcion, archivoUrl }) {
  const patch = {};
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
    .select("id, fecha_endoso, descripcion, archivo_url, polizas_cofisem!inner(numero_poliza, folio, oficina_id)")
    .eq("fecha_endoso", fechaCorte);
  if (oficinaId) query = query.eq("polizas_cofisem.oficina_id", oficinaId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: `endoso-man-${row.id}`,
    _esManual: true,
    archivo_url: row.archivo_url ?? null,
    polizas: {
      numero_poliza: row.polizas_cofisem?.numero_poliza ?? row.polizas_cofisem?.folio ?? "—",
      constancia: null,
      oficina_id: row.polizas_cofisem?.oficina_id ?? null,
    },
    // Mediodía para que new Date(...).toLocaleDateString() no derive al día
    // anterior en zonas con offset negativo (el corte compara contra en-CA).
    cambiado_at: row.fecha_endoso ? `${row.fecha_endoso}T12:00:00` : null,
    notas: row.descripcion ?? "",
  }));
}
