// ============================================================
// src/services/paseMedicoPdf.js
// Arma los datos para el PDF "Orden de Admisión para Atención
// Médica", a partir de lo capturado en el paso 6 del ajustador
// (GenerarDocumentos) y guardado por guardarPaseMedico().
// ============================================================
import { supabase } from "../supabaseClient";
import { getFirmaSignedUrl } from "./evidencias";

const SEL_PASE_MEDICO = `
  numero_siniestro, fecha_siniestro, ajustador_id,
  pase_medico_lesionado_id,
  pase_medico_clinica_nombre, pase_medico_clinica_telefono,
  pase_medico_clinica_domicilio, pase_medico_fecha_expedicion,
  firma_ajustador_url, firma_lesionado_url,
  polizas(
    numero_poliza, constancia, fecha_inicio,
    clientes(nombre, apellido),
    coberturas(nombre)
  ),
  ajustador:usuarios!siniestros_ajustador_id_fkey(nombre, apellido, telefono),
  siniestros_lesionados!siniestro_id(
    id, nombre, domicilio, telefono,
    region_cuerpo, causa_lesion, estado_lesionado, tipo_lesion, primeros_auxilios, motivo_traslado
  )
`;

// Domicilio de la oficina del ajustador — no existe esa columna en
// `usuarios` ni en `oficinas`, es la misma dirección que ya aparece
// impresa en el PDF de ejemplo que dejó el usuario.
const DOMICILIO_AJUSTADOR = "Av. Emiliano Zapata 751 int. 2 Col. Tlaltenango";

// ── 1. Trae todo lo crudo de BD + genera URLs firmadas de firmas ──
export async function fetchPaseMedicoData(siniestroId) {
  const { data, error } = await supabase
    .from("siniestros")
    .select(SEL_PASE_MEDICO)
    .eq("id", siniestroId)
    .single();
  if (error) throw error;

  const lesionado = (data.siniestros_lesionados ?? []).find((l) => l.id === data.pase_medico_lesionado_id) ?? null;

  const [firmaAjustadorUrl, firmaLesionadoUrl] = await Promise.all([
    data.firma_ajustador_url ? getFirmaSignedUrl(data.firma_ajustador_url) : null,
    data.firma_lesionado_url ? getFirmaSignedUrl(data.firma_lesionado_url) : null,
  ]);

  return { ...data, lesionadoInfo: lesionado, firmaAjustadorUrl, firmaLesionadoUrl };
}

// ── 2. Da forma a los props que consume PaseMedicoPDF ──────────
export function buildPaseMedicoPDF(data) {
  const p  = data.polizas ?? {};
  const cl = p.clientes   ?? {};
  const aj = data.ajustador ?? {};
  const l  = data.lesionadoInfo ?? {};

  return {
    numeroSiniestro: data.numero_siniestro,
    fechaExpedicion: data.pase_medico_fecha_expedicion,
    fechaPercance: data.fecha_siniestro,
    asegurado: { nombre: [cl.nombre, cl.apellido].filter(Boolean).join(" ") },
    poliza: {
      numero: p.constancia || p.numero_poliza,
      vigencia: p.fecha_inicio,
      riesgo: p.coberturas?.nombre,
    },
    lesionado: {
      nombre: l.nombre,
      domicilio: l.domicilio,
      telefono: l.telefono,
      // causa/estado/tipo/región/primeros auxilios/motivo de traslado se
      // capturan en el paso "Lesionados", no aquí — se leen del
      // lesionado ya elegido (pase_medico_lesionado_id).
      causaLesion: l.causa_lesion,
      estadoLesionado: l.estado_lesionado,
      tipoLesion: l.tipo_lesion,
      regionCuerpo: l.region_cuerpo ?? [],
      primerosAuxilios: l.primeros_auxilios,
      motivoTraslado: l.motivo_traslado,
      firmaUrl: data.firmaLesionadoUrl,
    },
    medico: {
      nombre: data.pase_medico_clinica_nombre,
      telefono: data.pase_medico_clinica_telefono,
      domicilio: data.pase_medico_clinica_domicilio,
    },
    ajustador: {
      nombre: [aj.nombre, aj.apellido].filter(Boolean).join(" "),
      telefono: aj.telefono,
      domicilio: DOMICILIO_AJUSTADOR,
      firmaUrl: data.firmaAjustadorUrl,
    },
  };
}
