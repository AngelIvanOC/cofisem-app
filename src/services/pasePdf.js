// ============================================================
// src/services/pasePdf.js
// Arma los datos para el PDF "Pase para Taller / Orden de Admisión",
// a partir de lo capturado en el paso 6 del ajustador (GenerarDocumentos)
// y guardado por guardarPaseTaller().
// ============================================================
import { supabase } from "../supabaseClient";
import { getFirmaSignedUrl } from "./evidencias";

function fmtFecha(str) {
  if (!str) return null;
  return new Date(str + "T12:00:00").toLocaleDateString("es-MX", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

const SEL_PASE_TALLER = `
  numero_siniestro, ajustador_id,
  pase_taller_numero, pase_taller_clave, pase_taller_definicion, pase_taller_destino,
  pase_taller_vehiculo_tipo, pase_taller_vehiculo_puertas,
  pase_taller_taller_nombre, pase_taller_taller_calle, pase_taller_taller_colonia, pase_taller_taller_telefono,
  pase_taller_orden_condicionada, pase_taller_fecha_expedicion,
  municipio, firma_asegurado_url, firma_ajustador_url,
  polizas(
    numero_poliza, constancia, placas, color, fecha_inicio,
    clientes(nombre, apellido, telefono),
    vehiculos_amis(marca, tipo, anio)
  ),
  ajustador:usuarios!siniestros_ajustador_id_fkey(nombre, apellido, telefono),
  siniestros_terceros(propietario_nombre, propietario_telefono, firma_reclamante_url)
`;

// ── 1. Trae todo lo crudo de BD + genera URLs firmadas de firmas ──
export async function fetchPaseTallerData(siniestroId) {
  const { data, error } = await supabase
    .from("siniestros")
    .select(SEL_PASE_TALLER)
    .eq("id", siniestroId)
    .single();
  if (error) throw error;

  const esTercero = data.pase_taller_definicion === "Tercero";
  const tercero = data.siniestros_terceros?.[0] ?? null;

  const [firmaAseguradoUrl, firmaAjustadorUrl, firmaTerceroUrl] = await Promise.all([
    data.firma_asegurado_url ? getFirmaSignedUrl(data.firma_asegurado_url) : null,
    data.firma_ajustador_url ? getFirmaSignedUrl(data.firma_ajustador_url) : null,
    tercero?.firma_reclamante_url ? getFirmaSignedUrl(tercero.firma_reclamante_url) : null,
  ]);

  return { ...data, esTercero, tercero, firmaAseguradoUrl, firmaAjustadorUrl, firmaTerceroUrl };
}

// ── 2. Da forma a los props que consume PaseTallerPDF ──────────
export function buildPaseTallerPDF(data) {
  const p   = data.polizas ?? {};
  const cl  = p.clientes   ?? {};
  const veh = p.vehiculos_amis ?? {};
  const aj  = data.ajustador ?? {};
  const t   = data.tercero ?? {};

  const interesadoNombre  = data.esTercero ? t.propietario_nombre    : [cl.nombre, cl.apellido].filter(Boolean).join(" ");
  const interesadoTelefono = data.esTercero ? t.propietario_telefono : cl.telefono;
  const interesadoFirmaUrl = data.esTercero ? data.firmaTerceroUrl   : data.firmaAseguradoUrl;

  return {
    numeroSiniestro: data.numero_siniestro,
    placas: p.placas,
    tipoInteresado: data.esTercero ? "tercero" : "asegurado",
    poliza: {
      numero: p.constancia || p.numero_poliza,
      fecha:  p.fecha_inicio,
    },
    interesado: { nombre: interesadoNombre },
    // Hardcodeado por ahora — no hay todavía una fuente real de deducible
    // (ver aplicaDeducible/porcentajeDeducible hardcodeados en evidencias.js).
    deducible: "No",
    ajustador: { nombre: [aj.nombre, aj.apellido].filter(Boolean).join(" ") },
    clave: data.pase_taller_clave,
    numeroPase: data.pase_taller_numero,
    vehiculo: {
      marca: veh.marca,
      submarca: veh.tipo,
      tipo: data.pase_taller_vehiculo_tipo,
      modelo: veh.anio,
      puertas: data.pase_taller_vehiculo_puertas,
      color: p.color,
    },
    destino: data.pase_taller_destino === "Domicilio" ? "domicilio" : "taller",
    taller: {
      nombre: data.pase_taller_taller_nombre,
      calle: data.pase_taller_taller_calle,
      colonia: data.pase_taller_taller_colonia,
      telefono: data.pase_taller_taller_telefono,
    },
    ordenCondicionada: data.pase_taller_orden_condicionada,
    lugarFecha: [data.municipio, fmtFecha(data.pase_taller_fecha_expedicion)].filter(Boolean).join(", "),
    ajustadorFirma: { nombre: aj.nombre ? [aj.nombre, aj.apellido].filter(Boolean).join(" ") : null, telefono: aj.telefono, url: data.firmaAjustadorUrl },
    interesadoFirma: { nombre: interesadoNombre, telefono: interesadoTelefono, url: interesadoFirmaUrl },
  };
}
