// ============================================================
// src/services/paseMedicoPdf.js
// Arma los datos para el PDF "Orden de Admisión para Atención
// Médica" — uno POR LESIONADO (no uno por siniestro): cada lesionado
// decide con su propio switch "Pase médico" (paso "Lesionados") si
// necesita el suyo, así que puede haber 0, 1 o varios por siniestro.
// ============================================================
import { supabase } from "../supabaseClient";
import { getFirmaSignedUrl } from "./evidencias";

// !siniestro_id desambigua el embed — siniestros y siniestros_lesionados
// tienen 2 relaciones posibles (siniestro_id, y la vieja
// pase_medico_lesionado_id que ya no se usa pero sigue existiendo).
const SEL_PASE_MEDICO = `
  id, nombre, domicilio, telefono,
  region_cuerpo, causa_lesion, estado_lesionado, tipo_lesion, primeros_auxilios, motivo_traslado,
  pase_medico_numero, pase_medico_fecha_expedicion,
  hospital_asignado, hospital_telefono, hospital_domicilio,
  siniestros!siniestro_id(
    numero_siniestro, fecha_siniestro,
    firma_ajustador_url, firma_lesionado_url,
    polizas(
      numero_poliza, constancia, fecha_inicio,
      clientes(nombre, apellido),
      coberturas(nombre)
    ),
    ajustador:usuarios!siniestros_ajustador_id_fkey(nombre, apellido, telefono)
  )
`;

// Domicilio de la oficina del ajustador — no existe esa columna en
// `usuarios` ni en `oficinas`, es la misma dirección que ya aparece
// impresa en el PDF de ejemplo que dejó el usuario.
const DOMICILIO_AJUSTADOR = "Av. Emiliano Zapata 751 int. 2 Col. Tlaltenango";

// ── 1. Trae todo lo crudo de BD (de UN lesionado) + URLs firmadas ──
export async function fetchPaseMedicoData(lesionadoId) {
  const { data, error } = await supabase
    .from("siniestros_lesionados")
    .select(SEL_PASE_MEDICO)
    .eq("id", lesionadoId)
    .single();
  if (error) throw error;

  const s = data.siniestros ?? {};
  const [firmaAjustadorUrl, firmaLesionadoUrl] = await Promise.all([
    s.firma_ajustador_url ? getFirmaSignedUrl(s.firma_ajustador_url) : null,
    s.firma_lesionado_url ? getFirmaSignedUrl(s.firma_lesionado_url) : null,
  ]);

  return { ...data, siniestroInfo: s, firmaAjustadorUrl, firmaLesionadoUrl };
}

// ── 2. Da forma a los props que consume PaseMedicoPDF ──────────
export function buildPaseMedicoPDF(data) {
  const s  = data.siniestroInfo ?? {};
  const p  = s.polizas    ?? {};
  const cl = p.clientes   ?? {};
  const aj = s.ajustador  ?? {};

  return {
    numeroSiniestro: s.numero_siniestro,
    numeroPase: data.pase_medico_numero,
    fechaExpedicion: data.pase_medico_fecha_expedicion,
    fechaPercance: s.fecha_siniestro,
    asegurado: { nombre: [cl.nombre, cl.apellido].filter(Boolean).join(" ") },
    poliza: {
      numero: p.constancia || p.numero_poliza,
      vigencia: p.fecha_inicio,
      riesgo: p.coberturas?.nombre,
    },
    lesionado: {
      nombre: data.nombre,
      domicilio: data.domicilio,
      telefono: data.telefono,
      causaLesion: data.causa_lesion,
      estadoLesionado: data.estado_lesionado,
      tipoLesion: data.tipo_lesion,
      regionCuerpo: data.region_cuerpo ?? [],
      primerosAuxilios: data.primeros_auxilios,
      motivoTraslado: data.motivo_traslado,
      firmaUrl: data.firmaLesionadoUrl,
    },
    medico: {
      nombre: data.hospital_asignado,
      telefono: data.hospital_telefono,
      domicilio: data.hospital_domicilio,
    },
    ajustador: {
      nombre: [aj.nombre, aj.apellido].filter(Boolean).join(" "),
      telefono: aj.telefono,
      domicilio: DOMICILIO_AJUSTADOR,
      firmaUrl: data.firmaAjustadorUrl,
    },
  };
}
