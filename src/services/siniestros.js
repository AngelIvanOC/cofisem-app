import { supabase } from "../supabaseClient";
import { calcularEstatus } from "./polizas";

// ── Helpers ────────────────────────────────────────────────────
function fmtFecha(str) {
  if (!str) return "—";
  const d = new Date(str + "T12:00:00");
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const fmtMXN = (n) =>
  `$${Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

// ── Detección de tipo de búsqueda ──────────────────────────────
export function detectarTipoBusqueda(v) {
  const s      = v.trim();
  const largo  = s.length > 10;
  const tieneDash   = s.includes("-");
  const tieneLetras = /[A-Za-z]/.test(s);
  const tieneNumeros = /[0-9]/.test(s);
  const soloNumeros  = /^[0-9]+$/.test(s);

  if (tieneDash)                            return "poliza";  // largo con guión
  if (largo && tieneLetras && tieneNumeros) return "serie";   // largo, letras + números, sin guión
  if (!largo && tieneLetras && tieneNumeros) return "placas"; // corto, letras + números
  if (!largo && soloNumeros)                return "reporte"; // corto, solo números
  return "poliza";
}

// ── SELECT completo para cargar una póliza con todos sus datos ─
const SEL_POLIZA = `
  id, constancia, numero_poliza, estatus, fecha_inicio, fecha_fin,
  cliente_id, placas, num_serie, num_motor, anio, capacidad, notas,
  clientes(nombre, apellido),
  oficinas(nombre),
  vendedores(nombre, apellido),
  concesionarios(nombre, apellido1, apellido2),
  vehiculos_amis(marca, tipo, dc, dl, anio),
  coberturas(nombre, prima_total, prima_neta,
    cobertura_rubros(id, rubro, monto_maximo, es_sublimite, orden)),
  pagos(id, monto, fecha_vencimiento, estatus),
  siniestros(
    id, numero_siniestro, fecha_siniestro, estatus,
    ajustador:usuarios!siniestros_ajustador_id_fkey(nombre, apellido)
  )
`;

// ── Mapea fila de polizas → formato que espera PolizaCard ──────
function mapPolizaACard(p) {
  const nombre = [p.clientes?.nombre, p.clientes?.apellido]
    .filter(Boolean).join(" ").toUpperCase();
  const conc = p.concesionarios
    ? [p.concesionarios.nombre, p.concesionarios.apellido1, p.concesionarios.apellido2]
        .filter(Boolean).join(" ").toUpperCase()
    : null;
  const titular = conc ? `${nombre} Y/O ${conc}` : nombre || "—";

  const primaTotal = parseFloat(p.coberturas?.prima_total ?? 0);

  const cuotas = [...(p.pagos ?? [])]
    .sort((a, b) => new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento))
    .map((q, i) => ({
      num: i + 1,
      vto: fmtFecha(q.fecha_vencimiento),
      monto: fmtMXN(q.monto),
      estatus: q.estatus
        ? q.estatus.charAt(0) + q.estatus.slice(1).toLowerCase()
        : "Pendiente",
    }));

  const veh = p.vehiculos_amis;
  const descripcion =
    veh?.dl || [veh?.marca, veh?.tipo, veh?.dc].filter(Boolean).join(" ") || p.notas || "—";

  const coberturas = [...(p.coberturas?.cobertura_rubros ?? [])]
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    .map((r) => ({
      desc: r.es_sublimite ? `└ ${r.rubro}` : r.rubro,
      monto: r.monto_maximo ?? "—",
      ded: "0.00",
      imp: "0",
      sub: r.es_sublimite ?? false,
    }));

  const siniestros = [...(p.siniestros ?? [])].map((s) => {
    const ajNombre = s.ajustador
      ? [s.ajustador.nombre, s.ajustador.apellido].filter(Boolean).join(" ")
      : null;
    return {
      reporte:   s.numero_siniestro,
      folio:     s.numero_siniestro,
      fecha:     fmtFecha(s.fecha_siniestro),
      ajustador: ajNombre ?? "—",
      estatus:   s.estatus
        ? s.estatus.charAt(0) + s.estatus.slice(1).toLowerCase()
        : "Reportado",
    };
  });

  return {
    id:        p.id,
    clienteId: p.cliente_id,   // necesario para crearSiniestro
    numero:    p.constancia || p.numero_poliza,
    titular,
    vendedor:  [p.vendedores?.nombre, p.vendedores?.apellido].filter(Boolean).join(" ") || null,
    prima:     fmtMXN(primaTotal),
    estatus:   calcularEstatus(p.estatus, p.fecha_fin),
    agencia:   p.oficinas?.nombre ?? "—",
    vigenciaDesde: fmtFecha(p.fecha_inicio),
    vigenciaHasta: fmtFecha(p.fecha_fin),
    saldo:     "$0.00",
    cobertura: p.coberturas?.nombre ?? "—",
    cuotas,
    vehiculo: {
      descripcion,
      modelo:   String(veh?.anio ?? p.anio ?? "—"),
      placas:   p.placas ?? "—",
      serie:    p.num_serie ?? "—",
      motor:    p.num_motor ?? "—",
      capacidad: p.capacidad ?? "4 OCUPANTES",
    },
    coberturas,
    siniestros,
  };
}

// ── Buscar póliza por constancia / serie / placas / folio ──────
export async function buscarPolizaParaSiniestro(valor) {
  const v = valor.trim();
  if (!v) return null;
  const tipo = detectarTipoBusqueda(v);
  let rawPoliza = null;

  if (tipo === "serie") {
    const { data } = await supabase
      .from("polizas").select(SEL_POLIZA)
      .ilike("num_serie", v)
      .not("estatus", "in", '("GUARDADO","SUBSECUENTE")')
      .order("fecha_inicio", { ascending: false })
      .limit(1).maybeSingle();
    rawPoliza = data;

  } else if (tipo === "placas") {
    const { data } = await supabase
      .from("polizas").select(SEL_POLIZA)
      .ilike("placas", v)
      .not("estatus", "in", '("GUARDADO","SUBSECUENTE")')
      .order("fecha_inicio", { ascending: false })
      .limit(1).maybeSingle();
    rawPoliza = data;

  } else if (tipo === "reporte") {
    const { data: sin } = await supabase
      .from("siniestros").select("poliza_id")
      .eq("numero_siniestro", v).maybeSingle();
    if (sin?.poliza_id) {
      const { data } = await supabase
        .from("polizas").select(SEL_POLIZA)
        .eq("id", sin.poliza_id).maybeSingle();
      rawPoliza = data;
    }

  } else {
    const upper = v.toUpperCase();
    const { data } = await supabase
      .from("polizas").select(SEL_POLIZA)
      .or(`constancia.ilike.%${upper}%,numero_poliza.ilike.%${upper}%`)
      .not("estatus", "in", '("GUARDADO","SUBSECUENTE")')
      .order("fecha_inicio", { ascending: false })
      .limit(1).maybeSingle();
    rawPoliza = data;
  }

  return rawPoliza ? mapPolizaACard(rawPoliza) : null;
}

// ── Insertar nuevo siniestro ───────────────────────────────────
export async function crearSiniestro({ polizaId, clienteId, folio, form, reportadoPor, horaInicioReporte }) {
  const { causa, circunstancia, detalles, ajustadorId, conductorNA, localizacion } = form;

  // Cadena condensada para display rápido
  const ubicacion = [
    localizacion?.calle
      ? `${localizacion.calle}${localizacion.numero ? ` #${localizacion.numero}` : ""}`
      : null,
    localizacion?.colonia ? `Col. ${localizacion.colonia}` : null,
    localizacion?.municipio,
    localizacion?.estado,
    localizacion?.cp ? `C.P. ${localizacion.cp}` : null,
  ].filter(Boolean).join(", ") || null;

  const now     = new Date();
  const horaStr = now.toLocaleTimeString("es-MX", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });

  const { data, error } = await supabase
    .from("siniestros")
    .insert({
      numero_siniestro: folio,
      poliza_id:        polizaId,
      cliente_id:       clienteId,
      fecha_siniestro:  now.toISOString().split("T")[0],
      hora_siniestro:   horaStr,
      // Siniestro
      tipo_siniestro: causa         || null,
      circunstancia:  circunstancia || null,
      descripcion:    detalles      || null,
      // Localización
      ubicacion,
      estado:     localizacion?.estado     || null,
      municipio:  localizacion?.municipio  || null,
      cp:         localizacion?.cp         || null,
      colonia:    localizacion?.colonia    || null,
      calle:      localizacion?.calle      || null,
      numero_ext: localizacion?.numero     || null,
      referencia: localizacion?.referencia || null,
      // Conductor del asegurado
      conductor_nombre:            conductorNA?.nombre               || null,
      conductor_telefono:          conductorNA?.telefono             || null,
      conductor_es_tercero:        conductorNA?.esTercero            ?? false,
      conductor_contacto_nombre:   conductorNA?.contactoExtraNombre  || null,
      conductor_contacto_telefono: conductorNA?.contactoExtraTelefono || null,
      // Ajustador, estatus y tiempos del reporte
      ajustador_id:        ajustadorId      || null,
      estatus:             ajustadorId ? "Asignado" : "Reportado",
      reportado_por:       reportadoPor     || null,
      hora_inicio_reporte: horaInicioReporte || null,  // timestamptz — hora_fin = created_at
    })
    .select("id, numero_siniestro")
    .single();
  if (error) throw error;

  return data;
}

// ── Lista de siniestros para Siniestros.jsx ───────────────────
export async function fetchSiniestros() {
  const { data, error } = await supabase
    .from("siniestros")
    .select(`
      id, numero_siniestro, tipo_siniestro, descripcion, estatus,
      fecha_siniestro, ubicacion, ajustador_id,
      arribo_fecha, arribo_lat, arribo_lng, created_at,
      municipio, estado, colonia,
      polizas(
        id, constancia, numero_poliza, placas, anio, notas,
        clientes(nombre, apellido, telefono),
        vehiculos_amis(marca, tipo, dl),
        coberturas(nombre)
      ),
      ajustador:usuarios!siniestros_ajustador_id_fkey(nombre, apellido)
    `)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((s) => {
    const p   = s.polizas ?? {};
    const veh = p.vehiculos_amis;
    const cl  = p.clientes ?? {};
    const cliente  = [cl.nombre, cl.apellido].filter(Boolean).join(" ") || "—";
    const vehiculo = veh?.dl
      || (veh ? [veh.marca, veh.tipo, p.anio].filter(Boolean).join(" ") : null)
      || p.notas
      || p.placas
      || "—";
    const ajNombre = s.ajustador
      ? [s.ajustador.nombre, s.ajustador.apellido].filter(Boolean).join(" ")
      : null;
    return {
      id:               s.id,
      folio:            s.numero_siniestro,
      asegurado:        cliente,
      vehiculo,
      fecha:            fmtFecha(s.fecha_siniestro),
      ubicacion:        s.ubicacion || "—",
      ajustador:        ajNombre,
      estatus:          s.estatus || "Reportado",
      polizaId:         p.id,
      polizaConstancia: p.constancia || p.numero_poliza || "—",
      cobertura:        p.coberturas?.nombre ?? "—",
      telefono:         cl.telefono ?? "—",
      arribo_fecha:     s.arribo_fecha ?? null,
      arribo_lat:       s.arribo_lat   ?? null,
      arribo_lng:       s.arribo_lng   ?? null,
      municipio:        s.municipio    ?? null,
      estado:           s.estado       ?? null,
      colonia:          s.colonia      ?? null,
      reportadoFecha:   s.created_at  ?? null,
    };
  });
}

// ── Guardar Paso 2 del ajustador (datos generales del siniestro) ─
// Nota: "tipo" es la clasificación propia del ajustador (catálogo TIPOS_SINIESTRO)
// y se guarda aparte de tipo_siniestro/circunstancia, que son la causa ya
// capturada por el cabinero (catálogo CAUSAS/CIRCUNSTANCIAS) y no se debe pisar.
export async function actualizarDatosSiniestro(siniestroId, {
  tipo, fechaAccidente, horaAccidente, lugar, descripcion, versionAsegurado,
  zonaAccidente, sentidoCirculacion,
  causa, circunstancia,
  estado, municipio, colonia, cp,
  conductorEsTercero, conductorNombre, conductorTelefono, conductorDomicilio,
  licenciaTipo, licenciaNumero, licenciaFechaExp, licenciaLugarExp, fechaNacimiento,
}) {
  // conductor_*/conductor_es_tercero llegan `undefined` (no `null`) cuando
  // el ajustador no contestó "¿el conductor es el contratante?" — en ese
  // caso se omiten del payload para no pisar con vacío lo que ya haya
  // capturado el cabinero al reportar el siniestro.
  const { error } = await supabase
    .from("siniestros")
    .update({
      clasificacion_siniestro: tipo             || null,
      fecha_siniestro:         fechaAccidente   || null,
      hora_siniestro:          horaAccidente    || null,
      ubicacion:               lugar            || null,
      descripcion:             descripcion      || null,
      version_asegurado:       versionAsegurado || null,
      zona_accidente:          zonaAccidente       || null,
      sentido_circulacion:     sentidoCirculacion  || null,
      // causa/circunstancia: confirmadas/corregidas por el ajustador — pisan
      // lo que puso el cabinero a propósito (decisión de negocio).
      tipo_siniestro:          causa         || null,
      circunstancia:           circunstancia || null,
      estado:                  estado    || null,
      municipio:               municipio || null,
      colonia:                 colonia   || null,
      cp:                      cp        || null,
      ...(conductorEsTercero !== undefined && { conductor_es_tercero: conductorEsTercero }),
      ...(conductorNombre    !== undefined && { conductor_nombre:     conductorNombre    || null }),
      ...(conductorTelefono  !== undefined && { conductor_telefono:   conductorTelefono  || null }),
      ...(conductorDomicilio !== undefined && { conductor_domicilio:  conductorDomicilio || null }),
      licencia_tipo:           licenciaTipo        || null,
      licencia_numero:         licenciaNumero      || null,
      licencia_fecha_exp:      licenciaFechaExp    || null,
      licencia_lugar_exp:      licenciaLugarExp    || null,
      conductor_fecha_nacimiento: fechaNacimiento   || null,
    })
    .eq("id", siniestroId);
  if (error) throw error;
}

// ── Horas oficiales del proceso — nunca las escribe el ajustador ─
// Se derivan de datos que el sistema ya registra solo (hora en que se
// levantó el reporte, hora en que quedó registrado el caso, y hora de
// llegada por GPS al confirmar el arribo), para que no se puedan falsear.
export async function fetchTiemposSiniestro(siniestroId) {
  const { data, error } = await supabase
    .from("siniestros")
    .select("hora_inicio_reporte, created_at, arribo_fecha")
    .eq("id", siniestroId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ── Formatea un timestamp ISO a "HH:MM:SS" hora local ─────────
export function horaLocal(isoStr) {
  if (!isoStr) return null;
  return new Date(isoStr).toLocaleTimeString("es-MX", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
}

// ── Guardar Paso 3 del ajustador (N.A. + terceros) ────────────
// Reemplaza por completo lo guardado previamente para este siniestro,
// así el ajustador puede regresar y corregir sin generar duplicados.
// Los lesionados se guardan aparte — ver guardarLesionados más abajo,
// tienen su propio paso en el flujo.
export async function guardarPartesInvolucradas(siniestroId, afectadosIds, afectados, datosNA) {
  if (datosNA) {
    const { error: errNA } = await supabase
      .from("siniestros")
      .update({
        vehiculo_descripcion_dano:   datosNA.descripcionDano || null,
        vehiculo_abrir_reserva:      datosNA.abrirReserva ?? null,
        vehiculo_monto_estimado_dano: datosNA.montoEstimado ? Number(datosNA.montoEstimado) : null,
        danos_siniestro_marcadores:    datosNA.danosSiniestro    ?? null,
        danos_preexistente_marcadores: datosNA.danosPreexistente ?? null,
      })
      .eq("id", siniestroId);
    if (errNA) throw errNA;
  }

  const { error: errDelT } = await supabase.from("siniestros_terceros").delete().eq("siniestro_id", siniestroId);
  if (errDelT) throw errDelT;

  const terceros = afectadosIds.map((id) => {
    const d = afectados[id];
    return {
      siniestro_id:          siniestroId,
      vehiculo_desc:         d.vehiculo    || null,
      vehiculo_modelo:       d.anio        || null,
      vehiculo_color:        d.color       || null,
      vehiculo_placas:       d.placas      || null,
      vehiculo_serie:        d.serie       || null,
      vehiculo_tipo:         d.vehiculoTipo  || null,
      vehiculo_motor:        d.vehiculoMotor || null,
      // Nota: la UI aún no distingue propietario vs conductor del tercero;
      // se usa el mismo nombre para ambos hasta que se agregue ese campo.
      propietario_nombre:    d.nombre      || null,
      conductor_nombre:      d.nombre      || null,
      propietario_domicilio: d.direccion   || null,
      propietario_telefono:  d.telefono    || null,
      rfc:                   d.rfc         || null,
      curp:                  d.curp        || null,
      email:                 d.email       || null,
      aseguradora_nombre:    d.aseguradora || null,
      poliza_tercero:        d.polizaTercero || null,
      declaracion:           d.declaracion || null,
      licencia_tipo:         d.licenciaTipo     || null,
      licencia_numero:       d.licenciaNumero   || null,
      licencia_fecha_exp:    d.licenciaFechaExp || null,
      licencia_lugar_exp:    d.licenciaLugarExp || null,
      reporte_tercero:       d.reporteTercero   || null,
      cobertura_tercero:     d.coberturaTercero || null,
      vencimiento_tercero:   d.vencimientoTercero || null,
      ajustador_tercero:     d.ajustadorTercero || null,
      descripcion_dano:      d.descripcionDano  || null,
      abrir_reserva:         d.abrirReserva     ?? null,
      monto_estimado_dano:   d.montoEstimado ? Number(d.montoEstimado) : null,
      danos_siniestro_marcadores:    d.danosSiniestro    ?? null,
      danos_preexistente_marcadores: d.danosPreexistente ?? null,
    };
  });
  if (terceros.length) {
    const { error } = await supabase.from("siniestros_terceros").insert(terceros);
    if (error) throw error;
  }

}

// ── Guardar paso "Lesionados" del ajustador ───────────────────
// Mismo criterio que guardarPartesInvolucradas: borra y vuelve a
// insertar todo lo del siniestro, para poder agregar/quitar
// lesionados libremente sin generar duplicados ni ids huérfanos.
// region_cuerpo/causa_lesion/estado_lesionado/tipo_lesion/
// primeros_auxilios/motivo_traslado son los mismos datos que antes
// vivían en el paso "Documentos" (pase_medico_*) — ahora se capturan
// aquí, junto con el resto de la persona.
export async function guardarLesionados(siniestroId, lesionadosIds, lesionados) {
  const { error: errDelL } = await supabase.from("siniestros_lesionados").delete().eq("siniestro_id", siniestroId);
  if (errDelL) throw errDelL;

  const lesionadosRows = (lesionadosIds ?? []).map((id) => {
    const l = lesionados[id];
    return {
      siniestro_id:     siniestroId,
      participante_id:  "NA",
      nombre:           l.nombre    || null,
      domicilio:        l.domicilio || null,
      telefono:         l.telefono  || null,
      edad:             l.edad ? Number(l.edad) : null,
      region_cuerpo:    l.regionCuerpo || null,
      causa_lesion:     l.causaLesion  || null,
      estado_lesionado: l.estadoLesionado || null,
      tipo_lesion:      l.tipoLesion   || null,
      primeros_auxilios: l.primerosAuxilios ?? null,
      motivo_traslado:  l.motivoTraslado || null,
      tipo_lesionado:   l.tipoLesionado || null,
      hospital_asignado: l.hospital || null,
      cobertura:        l.cobertura || null,
      abrir_reserva:    l.abrirReserva ?? null,
      estimado_lesiones: l.estimadoLesiones ? Number(l.estimadoLesiones) : null,
    };
  });
  if (lesionadosRows.length) {
    const { error } = await supabase.from("siniestros_lesionados").insert(lesionadosRows);
    if (error) throw error;
  }
}

// ── Guardar firmas (paso 4 — al cerrar el siniestro) ──────────
// Recibe storage paths ya subidos (ver subirFirma en services/evidencias.js).
// Nota: "reclamante" hoy es una sola firma para todos los terceros; si el
// siniestro tiene más de un tercero, se asigna al primero registrado.
export async function guardarFirmas(siniestroId, { asegurado, ajustador, reclamante, lesionado } = {}) {
  const updates = {};
  if (asegurado) updates.firma_asegurado_url = asegurado;
  if (ajustador) updates.firma_ajustador_url = ajustador;
  if (lesionado) updates.firma_lesionado_url = lesionado;
  if (Object.keys(updates).length) {
    const { error } = await supabase.from("siniestros").update(updates).eq("id", siniestroId);
    if (error) throw error;
  }

  if (reclamante) {
    const { data: tercero, error: errSel } = await supabase
      .from("siniestros_terceros")
      .select("id")
      .eq("siniestro_id", siniestroId)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (errSel) throw errSel;
    if (tercero) {
      const { error: errUpd } = await supabase
        .from("siniestros_terceros")
        .update({ firma_reclamante_url: reclamante })
        .eq("id", tercero.id);
      if (errUpd) throw errUpd;
    }
  }
}

// ── Guardar Datos de Ajuste (sección Reverso) + croquis ───────
// causa/circunstancia ya NO se guardan aquí — se confirman/corrigen en el
// paso "Datos del Siniestro" (ver actualizarDatosSiniestro), donde vive el
// resto de lo reportado por el cabinero.
// horaTomado/horaPasado/horaLlegada: NO vienen de un input del ajustador —
// el componente las llena con fetchTiemposSiniestro()/horaLocal(), nunca
// con texto libre, para que no se puedan falsear.
export async function guardarDatosAjuste(siniestroId, datos) {
  const { error } = await supabase
    .from("siniestros")
    .update({
      culpabilidad:            datos.culpabilidad             || null,
      solicito_grua:           datos.solicitoGrua,
      calificacion_siniestro:  datos.calificacionSiniestro   || null,
      requiere_investigacion:  datos.requiereInvestigacion,
      convenio_gxg:            datos.convenioGxg,
      articulo_infringido:     datos.articuloInfringido      || null,
      hora_tomado:             datos.horaTomado              || null,
      hora_pasado:             datos.horaPasado              || null,
      ajuste_hora_llegada:     datos.horaLlegada             || null,
      inicio_averiguacion:     datos.inicioAveriguacion,
      numero_averiguacion:     datos.numeroAveriguacion      || null,
      numero_parte_pfp:        datos.numeroPartePfp          || null,
      solicito_abogado:        datos.solicitoAbogado,
      despacho_abogado:        datos.despachoAbogado         || null,
      recuperacion:            datos.recuperacion            || null,
      tipo_recuperacion:       datos.tipoRecuperacion        || null,
      objeto_garantia_importe: datos.objetoGarantiaImporte   || null,
      conclusiones:            datos.conclusiones            || null,
      croquis_url:             datos.croquisUrl              || null,
      croquis_data:            datos.croquisData             || null,
    })
    .eq("id", siniestroId);
  if (error) throw error;
}

// ── Guardar Pase Taller (paso 6 del ajustador) ────────────────
// El taller elegido de TALLERES_LISTA o capturado manualmente se
// guarda ya "aplanado" (nombre/tel/calle/colonia sueltos) — el
// PDF no necesita saber si vino de la lista fija o fue manual.
export async function guardarPaseTaller(siniestroId, datos) {
  const { error } = await supabase
    .from("siniestros")
    .update({
      pase_taller_numero:              datos.numeroPase          || null,
      pase_taller_clave:               datos.clave               || null,
      pase_taller_definicion:          datos.definicion          || null,
      pase_taller_destino:             datos.destino             || null,
      pase_taller_vehiculo_tipo:       datos.vehiculoTipo        || null,
      pase_taller_vehiculo_puertas:    datos.vehiculoPuertas     || null,
      pase_taller_taller_nombre:       datos.destino === "Taller" ? datos.tallerNombre  || null : null,
      pase_taller_taller_calle:        datos.destino === "Taller" ? datos.tallerCalle   || null : null,
      pase_taller_taller_colonia:      datos.destino === "Taller" ? datos.tallerColonia || null : null,
      pase_taller_taller_telefono:     datos.destino === "Taller" ? datos.tallerTel     || null : null,
      pase_taller_orden_condicionada:  datos.ordenCondicionada   || null,
      pase_taller_fecha_expedicion:    datos.fechaExpedicion     || null,
    })
    .eq("id", siniestroId);
  if (error) throw error;
}

// ── Lesionados ya capturados (paso 3) — para elegir a cuál de ellos
// corresponde el Pase Médico (paso 6) ─────────────────────────
// tipo_lesion (región del cuerpo, capturada como checkboxes en el paso 3)
// y hospital_asignado se incluyen para poder precargarlos en el Pase
// Médico del paso 6 en vez de volver a pedirlos desde cero (ver
// PaseMedico en GenerarDocumentos.jsx).
export async function fetchLesionados(siniestroId) {
  const { data, error } = await supabase
    .from("siniestros_lesionados")
    .select("id, nombre, domicilio, telefono, participante_id, region_cuerpo, causa_lesion, estado_lesionado, tipo_lesion, primeros_auxilios, motivo_traslado, tipo_lesionado, hospital_asignado")
    .eq("siniestro_id", siniestroId)
    .order("id", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ── Guardar Pase Médico (paso Documentos del ajustador) ───────
// Un solo pase médico por siniestro (mismo alcance que Pase Taller) —
// solo lo que de verdad es "del documento": a cuál lesionado
// corresponde y el médico/clínica asignada. Los datos de la lesión en
// sí (causa/estado/tipo/región/primeros auxilios/motivo de traslado)
// se capturan en el paso Lesionados (guardarLesionados) y se leen en
// tiempo de generar el PDF desde siniestros_lesionados.
export async function guardarPaseMedico(siniestroId, datos) {
  const { error } = await supabase
    .from("siniestros")
    .update({
      pase_medico_lesionado_id:      datos.lesionadoId          || null,
      pase_medico_clinica_nombre:    datos.clinicaNombre        || null,
      pase_medico_clinica_telefono:  datos.clinicaTel           || null,
      pase_medico_clinica_domicilio: datos.clinicaDir           || null,
      pase_medico_fecha_expedicion:  datos.fechaExpedicion      || null,
    })
    .eq("id", siniestroId);
  if (error) throw error;
}

// ── Guardar Encuesta de satisfacción (captura el ajustador) ───
export async function guardarEncuesta(siniestroId, datos) {
  const { error } = await supabase
    .from("siniestros_encuesta")
    .upsert({
      siniestro_id:                  siniestroId,
      hora_reporte:                  datos.horaReporte             || null,
      calificacion_reporte:          datos.calificacionReporte     || null,
      motivo_calificacion_reporte:   datos.motivoReporte           || null,
      hora_llegada:                  datos.horaLlegada             || null,
      calificacion_ajustador:        datos.calificacionAjustador   || null,
      motivo_calificacion_ajustador: datos.motivoAjustador         || null,
      hora_termino:                  datos.horaTermino             || null,
      comentarios:                   datos.comentarios             || null,
    }, { onConflict: "siniestro_id" });
  if (error) throw error;
}

// ── Cerrar siniestro (paso final del ajustador) ───────────────
// hora_termino_ajuste: se sella con la hora real del servidor/dispositivo
// en el momento del cierre — el ajustador nunca la escribe.
export async function cerrarSiniestro(siniestroId) {
  const horaTermino = horaLocal(new Date().toISOString());

  const { error } = await supabase
    .from("siniestros")
    .update({ estatus: "Cerrado", hora_termino_ajuste: horaTermino })
    .eq("id", siniestroId);
  if (error) throw error;

  // Si ya existe la encuesta de este siniestro, se le refleja la misma hora de cierre.
  await supabase
    .from("siniestros_encuesta")
    .update({ hora_termino: horaTermino })
    .eq("siniestro_id", siniestroId);
}

// ── Asignar ajustador a un siniestro ──────────────────────────
export async function asignarAjustador(siniestroId, { id: ajustadorId }) {
  const { error } = await supabase
    .from("siniestros")
    .update({ ajustador_id: ajustadorId, estatus: "Asignado" })
    .eq("id", siniestroId);
  if (error) throw error;
}

// ── Ajustadores disponibles (usuarios con rol AJUSTADOR) ───────
export async function fetchAjustadores() {
  const { data: rol } = await supabase
    .from("roles").select("id").ilike("nombre", "ajustador").maybeSingle();
  if (!rol) return [];
  const { data } = await supabase
    .from("usuarios")
    .select("id, nombre, apellido")
    .eq("rol_id", rol.id)
    .eq("activo", true)
    .order("nombre");
  return (data ?? []).map((u) => ({
    id:     u.id,
    nombre: [u.nombre, u.apellido].filter(Boolean).join(" "),
  }));
}

// ── Carga activa por ajustador (para indicadores de slots) ─────
export async function fetchCargaAjustadores() {
  const { data } = await supabase
    .from("siniestros")
    .select("ajustador_id")
    .in("estatus", ["Asignado", "En proceso"]);
  const counts = {};
  (data ?? []).forEach((s) => {
    if (s.ajustador_id) counts[s.ajustador_id] = (counts[s.ajustador_id] || 0) + 1;
  });
  return counts; // { [uuid]: count }
}
