// ============================================================
// src/services/evidencias.js
// Compresión + subida a Supabase Storage + registro en DB
// ============================================================
import imageCompression from "browser-image-compression";
import { supabase } from "../supabaseClient";
import { getState } from "../auth";

const BUCKET        = "siniestros-evidencia";
const FIRMAS_BUCKET = "siniestros-firmas";
const AUDIO_BUCKET   = "siniestros-audio";

const COMPRESSION_OPTS = {
  maxSizeMB:        0.4,     // objetivo 400 KB por foto
  maxWidthOrHeight: 1200,    // máximo 1200px en cualquier dimensión
  useWebWorker:     true,
  fileType:         "image/webp",
};

// ── Convierte un dataURL (canvas.toDataURL) a Blob subible ────
function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const mime   = header.match(/:(.*?);/)[1];
  const binary = atob(base64);
  const array  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
  return new Blob([array], { type: mime });
}

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
      fecha_siniestro, hora_siniestro, tipo_siniestro, circunstancia, descripcion,
      estado, municipio, colonia, cp,
      clasificacion_siniestro, version_asegurado, zona_accidente, sentido_circulacion,
      croquis_data, croquis_url,
      conductor_es_tercero, conductor_nombre, conductor_telefono,
      conductor_domicilio, licencia_tipo, licencia_numero, licencia_fecha_exp,
      licencia_lugar_exp, conductor_fecha_nacimiento,
      polizas(
        id, constancia, numero_poliza, placas, num_serie, anio, fecha_fin, color,
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
        color:  p.color ?? "",
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
      // Estructurada — la llenó el cabinero al reportar, el ajustador la
      // confirma/corrige en el paso 1 con el mismo select en cascada.
      ubicacionEstructurada: {
        estado:    s.estado    ?? "",
        municipio: s.municipio ?? "",
        colonia:   s.colonia   ?? "",
        cp:        s.cp        ?? "",
      },
      telefono:  cl.telefono ?? null,
      // Reportado por cabinero — para autorrellenar el paso 2 del ajustador
      fechaSiniestroReportada: s.fecha_siniestro ?? null,
      horaSiniestroReportada:  s.hora_siniestro  ?? null,
      causaReportada:          s.tipo_siniestro  ?? null,
      circunstanciaReportada:  s.circunstancia   ?? null,
      descripcionReportada:    s.descripcion     ?? null,
      // Ya capturado por el ajustador en una vuelta anterior a este paso —
      // para que al regresar no se vea vacío lo que ya se guardó.
      tipoAjustadorGuardado:      s.clasificacion_siniestro ?? null,
      versionAseguradoGuardado:   s.version_asegurado       ?? null,
      zonaAccidenteGuardada:      s.zona_accidente          ?? null,
      sentidoCirculacionGuardado: s.sentido_circulacion     ?? null,
      croquisData:             s.croquis_data    ?? null,
      // Se preserva si el ajustador vuelve a este paso sin volver a
      // dibujar/subir el croquis — sin esto, cada re-guardado del paso
      // "Cierre del Caso" borraba el croquis ya subido (lo pisaba con
      // null porque el estado local de la foto nueva siempre arranca
      // vacío).
      croquisUrl:              s.croquis_url     ?? null,
      // Quién manejaba, ya lo decidió el cabinero al levantar el
      // reporte — el ajustador ya no vuelve a preguntarlo (ver
      // Conductor en DatosSiniestro.jsx).
      conductorEsTerceroReportado: s.conductor_es_tercero ?? false,
      conductorNombreReportado:    s.conductor_nombre     ?? null,
      conductorTelefonoReportado:  s.conductor_telefono   ?? null,
      // Domicilio/licencia del conductor y fecha de nacimiento — los
      // captura el ajustador (paso "Datos del Siniestro"); se guardan
      // aparte porque, a diferencia del resto de este bloque, no vienen
      // de lo que reportó el cabinero.
      conductorDomicilioGuardado: s.conductor_domicilio    ?? null,
      licenciaTipoGuardado:       s.licencia_tipo          ?? null,
      licenciaNumeroGuardado:     s.licencia_numero        ?? null,
      licenciaFechaExpGuardado:   s.licencia_fecha_exp     ?? null,
      licenciaLugarExpGuardado:   s.licencia_lugar_exp     ?? null,
      fechaNacimientoGuardado:    s.conductor_fecha_nacimiento ?? null,
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

// ── Sube una firma (dataURL de canvas) — bucket separado ──────
// tipo: 'asegurado' | 'ajustador' | 'reclamante'
export async function subirFirma({ numeroSiniestro, tipo, dataUrl }) {
  const blob = dataUrlToBlob(dataUrl);
  const path = `${numeroSiniestro}/${tipo}.png`;
  const { error } = await supabase.storage
    .from(FIRMAS_BUCKET)
    .upload(path, blob, { contentType: "image/png", upsert: true });
  if (error) throw error;
  return path;
}

// ── Sube el croquis dibujado (dataURL de canvas) ──────────────
export async function subirCroquis({ numeroSiniestro, dataUrl }) {
  const blob = dataUrlToBlob(dataUrl);
  const path = `${numeroSiniestro}/croquis.png`;
  const { error } = await supabase.storage
    .from(FIRMAS_BUCKET)
    .upload(path, blob, { contentType: "image/png", upsert: true });
  if (error) throw error;
  return path;
}

// ── URL firmada temporal (1 hora) para una firma o croquis ────
export async function getFirmaSignedUrl(storagePath) {
  const { data, error } = await supabase.storage
    .from(FIRMAS_BUCKET)
    .createSignedUrl(storagePath, 3600);
  if (error) throw error;
  return data.signedUrl;
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

// ── Guarda coordenadas de arribo en el siniestro ─────────────
export async function registrarArribo(siniestroId, { lat, lng, precision, fotoLat, fotoLng }) {
  const { data: actual } = await supabase
    .from("siniestros").select("estatus").eq("id", siniestroId).maybeSingle();

  const { error } = await supabase
    .from("siniestros")
    .update({
      arribo_lat:       lat       ?? null,
      arribo_lng:       lng       ?? null,
      arribo_precision: precision ?? null,
      arribo_fecha:     new Date().toISOString(),
      arribo_foto_lat:  fotoLat   ?? null,
      arribo_foto_lng:  fotoLng   ?? null,
      estatus:          "En proceso",
    })
    .eq("id", siniestroId);
  if (error) throw error;

  // Bitácora de la línea de tiempo — secundaria, no debe tumbar el flujo.
  // "Arribo" y "En proceso" ocurren en el mismo instante real (la
  // confirmación de arribo es lo que dispara "En proceso"), pero se
  // registran como dos pasos separados —1 segundo aparte— para que la
  // línea de tiempo (5 pasos: Reportado/Asignado/Arribo/En proceso/
  // Cerrado) los muestre distintos en vez de saltarse "Arribo".
  const ahora        = new Date();
  const cambiadoPor   = getState().usuario?.id ?? null;
  const { error: errArribo } = await supabase.from("siniestros_historial").insert({
    siniestro_id:  siniestroId,
    estatus_ant:   actual?.estatus ?? null,
    estatus_nuevo: "Arribo",
    notas:         "Arribo confirmado con foto y GPS",
    cambiado_por:  cambiadoPor,
    cambiado_at:   ahora.toISOString(),
  });
  if (errArribo) console.error("No se pudo registrar historial del siniestro:", errArribo);

  const { error: errProceso } = await supabase.from("siniestros_historial").insert({
    siniestro_id:  siniestroId,
    estatus_ant:   "Arribo",
    estatus_nuevo: "En proceso",
    notas:         null,
    cambiado_por:  cambiadoPor,
    cambiado_at:   new Date(ahora.getTime() + 1000).toISOString(),
  });
  if (errProceso) console.error("No se pudo registrar historial del siniestro:", errProceso);
}

// ── Sube el audio adjunto al siniestro (un solo audio por siniestro,
// se sobrescribe si ya había uno) y guarda su storage_path en
// siniestros.audio_url ────────────────────────────────────────
export async function subirAudioSiniestro({ siniestroId, numeroSiniestro, file }) {
  const ext  = file.name?.split(".").pop() || "webm";
  const path = `${numeroSiniestro}/audio.${ext}`;

  const { error: storageErr } = await supabase.storage
    .from(AUDIO_BUCKET)
    .upload(path, file, { contentType: file.type || "audio/webm", upsert: true });
  if (storageErr) throw storageErr;

  const { error: dbErr } = await supabase
    .from("siniestros")
    .update({ audio_url: path })
    .eq("id", siniestroId);
  if (dbErr) throw dbErr;

  return path;
}

// ── URL firmada temporal (1 hora) para reproducir el audio ────
export async function getAudioSignedUrl(storagePath) {
  const { data, error } = await supabase.storage
    .from(AUDIO_BUCKET)
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
