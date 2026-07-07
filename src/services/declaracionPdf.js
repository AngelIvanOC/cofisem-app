// ============================================================
// src/services/declaracionPdf.js
// Arma los datos para el PDF "Declaración Relativa al Accidente"
// (2 páginas: Carátula + Reverso), a partir de todo lo capturado
// por cabinero y ajustador durante el proceso del siniestro.
// ============================================================
import { supabase } from "../supabaseClient";
import { getFirmaSignedUrl } from "./evidencias";

function fmtFecha(str) {
  if (!str) return null;
  return new Date(str + "T12:00:00").toLocaleDateString("es-MX", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}
function fmtHora(t) {
  return t ? t.slice(0, 5) : null;
}

const SEL_DECLARACION = `
  *,
  polizas(
    numero_poliza, constancia, estatus, fecha_inicio, fecha_fin,
    placas, num_serie, num_motor, anio,
    clientes(nombre, apellido, telefono, calle, colonia, ciudad, estado, cp),
    vehiculos_amis(marca, tipo, dc, dl, anio),
    coberturas(nombre)
  ),
  ajustador:usuarios!siniestros_ajustador_id_fkey(nombre, apellido),
  siniestros_terceros(*),
  siniestros_lesionados(*),
  siniestros_encuesta(*)
`;

// ── 1. Trae todo lo crudo de BD + genera URLs firmadas de imágenes ─
export async function fetchDeclaracionData(siniestroId) {
  const { data, error } = await supabase
    .from("siniestros")
    .select(SEL_DECLARACION)
    .eq("id", siniestroId)
    .single();
  if (error) throw error;

  const [firmaAseguradoUrl, firmaAjustadorUrl, croquisUrl] = await Promise.all([
    data.firma_asegurado_url ? getFirmaSignedUrl(data.firma_asegurado_url) : null,
    data.firma_ajustador_url ? getFirmaSignedUrl(data.firma_ajustador_url) : null,
    data.croquis_url         ? getFirmaSignedUrl(data.croquis_url)         : null,
  ]);

  const terceros = await Promise.all(
    (data.siniestros_terceros ?? []).map(async (t) => ({
      ...t,
      firmaUrl: t.firma_reclamante_url ? await getFirmaSignedUrl(t.firma_reclamante_url) : null,
    })),
  );

  return { ...data, firmaAseguradoUrl, firmaAjustadorUrl, croquisUrl, terceros };
}

// ── 2. Da forma a los props que consume DeclaracionAccidentePDF ───
export function buildDeclaracionPDF(data) {
  const p   = data.polizas ?? {};
  const cl  = p.clientes   ?? {};
  const veh = p.vehiculos_amis ?? {};
  const encuesta = data.siniestros_encuesta?.[0] ?? null;

  const fechaAccidente = data.fecha_siniestro ? new Date(data.fecha_siniestro + "T12:00:00") : null;

  return {
    encabezado: {
      dia:              fechaAccidente ? String(fechaAccidente.getDate()).padStart(2, "0")   : null,
      mes:              fechaAccidente ? String(fechaAccidente.getMonth() + 1).padStart(2, "0") : null,
      anio:             fechaAccidente ? fechaAccidente.getFullYear()                          : null,
      numeroSiniestro:  data.numero_siniestro,
      numeroRegistro:   data.numero_registro,
    },
    poliza: {
      numero:         p.constancia || p.numero_poliza,
      cobertura:      p.coberturas?.nombre,
      fechaInicio:    fmtFecha(p.fecha_inicio),
      fechaFin:       fmtFecha(p.fecha_fin),
      estatus:        p.estatus,
      moneda:         data.moneda,
      personaVerifico: data.persona_verifico,
    },
    asegurado: {
      nombre:    [cl.nombre, cl.apellido].filter(Boolean).join(" "),
      domicilio: [cl.calle, cl.colonia, cl.ciudad, cl.estado, cl.cp].filter(Boolean).join(", "),
      telefono:  cl.telefono,
    },
    accidente: {
      conductorNombre:    data.conductor_nombre,
      conductorTelefono:  data.conductor_telefono,
      licenciaTipo:       data.licencia_tipo,
      licenciaNumero:     data.licencia_numero,
      licenciaFechaExp:   fmtFecha(data.licencia_fecha_exp),
      licenciaLugarExp:   data.licencia_lugar_exp,
      fechaNacimiento:    fmtFecha(data.conductor_fecha_nacimiento),
      fecha:              fmtFecha(data.fecha_siniestro),
      hora:               fmtHora(data.hora_siniestro),
      lugar:              data.ubicacion,
      colonia:            data.colonia,
      municipio:          data.municipio,
      cp:                 data.cp,
      zona:               data.zona_accidente,
      sentido:            data.sentido_circulacion,
      narracion:          data.descripcion,
      versionAsegurado:   data.version_asegurado,
    },
    vehiculo: {
      marca:            veh.marca,
      tipo:              veh.tipo,
      modelo:            veh.anio || p.anio,
      placas:            p.placas,
      serie:             p.num_serie,
      motor:             p.num_motor,
      descripcionDano:   data.vehiculo_descripcion_dano,
      abrirReserva:      data.vehiculo_abrir_reserva,
      montoEstimado:     data.vehiculo_monto_estimado_dano,
      lugarEnvio:        data.vehiculo_lugar_envio,
    },
    terceros: (data.terceros ?? []).map((t) => ({
      propietarioNombre:    t.propietario_nombre,
      conductorNombre:      t.conductor_nombre,
      domicilio:            t.propietario_domicilio,
      telefono:             t.propietario_telefono,
      marca:                t.vehiculo_desc,
      tipo:                 t.vehiculo_tipo,
      modelo:               t.vehiculo_modelo,
      color:                t.vehiculo_color,
      placas:               t.vehiculo_placas,
      serie:                t.vehiculo_serie,
      motor:                t.vehiculo_motor,
      licenciaTipo:         t.licencia_tipo,
      licenciaNumero:       t.licencia_numero,
      licenciaFechaExp:     fmtFecha(t.licencia_fecha_exp),
      licenciaLugarExp:     t.licencia_lugar_exp,
      aseguradora:          t.aseguradora_nombre,
      polizaTercero:        t.poliza_tercero,
      reporteTercero:       t.reporte_tercero,
      coberturaTercero:     t.cobertura_tercero,
      vencimientoTercero:   fmtFecha(t.vencimiento_tercero),
      ajustadorTercero:     t.ajustador_tercero,
      ordenReparacion:      t.orden_reparacion,
      convenioGxg:          t.convenio_gxg,
      descripcionDano:      t.descripcion_dano,
      abrirReserva:         t.abrir_reserva,
      montoEstimado:        t.monto_estimado_dano,
      declaracion:          t.declaracion,
      firmaUrl:             t.firmaUrl,
    })),
    lesionados: (data.siniestros_lesionados ?? []).map((l) => ({
      nombre:           l.nombre,
      domicilio:        l.domicilio,
      telefono:         l.telefono,
      edad:             l.edad,
      lesion:           l.tipo_lesion || l.descripcion,
      tipoLesionado:    l.tipo_lesionado,
      hospital:         l.hospital_asignado,
      cobertura:        l.cobertura,
      abrirReserva:     l.abrir_reserva,
      estimadoLesiones: l.estimado_lesiones,
    })),
    ajuste: {
      ajustadorNombre:       data.ajustador ? [data.ajustador.nombre, data.ajustador.apellido].filter(Boolean).join(" ") : null,
      horaTomado:            fmtHora(data.hora_tomado),
      horaPasado:            fmtHora(data.hora_pasado),
      horaLlegada:           fmtHora(data.ajuste_hora_llegada),
      horaTermino:           fmtHora(data.hora_termino_ajuste),
      articuloInfringido:    data.articulo_infringido,
      requiereInvestigacion: data.requiere_investigacion,
      convenioGxg:           data.convenio_gxg,
      causa:                 data.tipo_siniestro,
      circunstancia:         data.circunstancia,
      culpabilidad:          data.culpabilidad,
      solicitoGrua:          data.solicito_grua,
      calificacionSiniestro: data.calificacion_siniestro,
      inicioAveriguacion:    data.inicio_averiguacion,
      numeroAveriguacion:    data.numero_averiguacion,
      numeroPartePfp:        data.numero_parte_pfp,
      solicitoAbogado:       data.solicito_abogado,
      despachoAbogado:       data.despacho_abogado,
      recuperacion:          data.recuperacion,
      tipoRecuperacion:      data.tipo_recuperacion,
      objetoGarantiaImporte: data.objeto_garantia_importe,
      conclusiones:          data.conclusiones,
    },
    croquisUrl:        data.croquisUrl,
    firmaAseguradoUrl: data.firmaAseguradoUrl,
    firmaAjustadorUrl: data.firmaAjustadorUrl,
    encuesta: encuesta && {
      horaReporte:                encuesta.hora_reporte ? fmtHora(encuesta.hora_reporte) : null,
      calificacionReporte:        encuesta.calificacion_reporte,
      motivoReporte:              encuesta.motivo_calificacion_reporte,
      horaLlegada:                encuesta.hora_llegada ? fmtHora(encuesta.hora_llegada) : null,
      calificacionAjustador:      encuesta.calificacion_ajustador,
      motivoAjustador:            encuesta.motivo_calificacion_ajustador,
      horaTermino:                encuesta.hora_termino ? fmtHora(encuesta.hora_termino) : null,
      comentarios:                encuesta.comentarios,
    },
  };
}
