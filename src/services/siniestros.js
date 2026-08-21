import { supabase } from "../supabaseClient";
import { calcularEstatus } from "./polizas";
import { getState } from "../auth";

// ── Registra un cambio de estatus en la línea de tiempo del siniestro
// (siniestros_historial). Es bitácora secundaria: si falla, no debe
// tumbar la operación principal (asignar, arribar, cerrar...), solo
// se registra en consola.
async function registrarHistorial(siniestroId, estatusAnt, estatusNuevo, notas, cambiadoPor, cambiadoAt) {
  const { error } = await supabase.from("siniestros_historial").insert({
    siniestro_id: siniestroId,
    estatus_ant:  estatusAnt   || null,
    estatus_nuevo: estatusNuevo || null,
    notas:        notas        || null,
    cambiado_por: cambiadoPor  || null,
    ...(cambiadoAt ? { cambiado_at: cambiadoAt } : {}),
  });
  if (error) console.error("No se pudo registrar historial del siniestro:", error);
}

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
  clientes(nombre, apellido, telefono),
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
    // Nombre y teléfono del cliente solos (sin "Y/O <concesionario>" del
    // titular) — para precargar "Conductor del Asegurado" en el reporte
    // de cabinero, asumiendo que el asegurado es quien maneja hasta que
    // se diga lo contrario.
    asegurado: { nombre, telefono: p.clientes?.telefono ?? "" },
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
  const { causa, circunstancia, detalles, ajustadorId, conductorNA, localizacion, terceros } = form;

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
      // Conductor del asegurado — nombre/telefono son de quien manejaba
      // (el operador): por default el propio asegurado (precargado desde
      // clientes en FormSiniestro), o alguien distinto si se marcó
      // operadorEsOtro. conductor_cabina_* es aparte y opcional: el
      // contacto de la cabina/radiotaxi que reporta, para localizar al
      // operador si no contesta — no reemplaza al operador, se guarda
      // además.
      conductor_nombre:            conductorNA?.nombre               || null,
      conductor_telefono:          conductorNA?.telefono             || null,
      conductor_es_tercero:        conductorNA?.operadorEsOtro       ?? false,
      conductor_cabina_nombre:     conductorNA?.cabinaNombre         || null,
      conductor_cabina_telefono:   conductorNA?.cabinaTelefono       || null,
      // Ajustador, estatus y tiempos del reporte
      ajustador_id:        ajustadorId      || null,
      estatus:             ajustadorId ? "Asignado" : "Reportado",
      reportado_por:       reportadoPor     || null,
      hora_inicio_reporte: horaInicioReporte || null,  // timestamptz — hora_fin = created_at
    })
    .select("id, numero_siniestro")
    .single();
  if (error) throw error;

  // "Reportado" siempre queda marcado, aunque el ajustador se elija en el
  // mismo momento de levantar el reporte — en ese caso "Asignado" se
  // registra 1 segundo después, para que el orden en la línea de tiempo
  // tenga sentido (Reportado siempre antes que Asignado).
  const ahora = new Date();
  await registrarHistorial(data.id, null, "Reportado", "Reporte levantado por cabina", reportadoPor, ahora.toISOString());
  if (ajustadorId) {
    await registrarHistorial(
      data.id, "Reportado", "Asignado", "Asignado desde cabina", reportadoPor,
      new Date(ahora.getTime() + 1000).toISOString(),
    );
  }

  // Vehículo(s) de terceros capturados por cabina — misma tabla y
  // columnas que usa después el ajustador (fetchPartesInvolucradas /
  // guardarPartesInvolucradas), así que al llegar al siniestro ya las
  // ve precargadas y solo las corrige si hace falta. Se descartan filas
  // que se hayan agregado y dejado completamente en blanco.
  const filasTerceros = (terceros ?? [])
    .filter((t) => t.vehiculoDesc || t.vehiculoColor || t.vehiculoModelo || t.vehiculoPlacas)
    .map((t) => ({
      siniestro_id:    data.id,
      vehiculo_desc:   t.vehiculoDesc   || null,
      vehiculo_color:  t.vehiculoColor  || null,
      vehiculo_modelo: t.vehiculoModelo || null,
      vehiculo_placas: t.vehiculoPlacas || null,
    }));
  if (filasTerceros.length) {
    const { error: errTerceros } = await supabase.from("siniestros_terceros").insert(filasTerceros);
    if (errTerceros) throw errTerceros;
  }

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
      municipio, estado, colonia, audio_url, vehiculo_descripcion_dano,
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
      tipo:             s.tipo_siniestro || "—",
      descripcion:      s.descripcion || "",
      danos:            s.vehiculo_descripcion_dano || "-",
      ajustador:        ajNombre,
      ajustadorId:      s.ajustador_id ?? null,
      estatus:          s.estatus || "Reportado",
      polizaId:         p.id,
      polizaConstancia: p.constancia || p.numero_poliza || "—",
      audioUrl:         s.audio_url    ?? null,
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

// ── Traduce un objeto `cambios` (llaves de formulario, solo las que de
// verdad cambiaron — ver soloCambios en shared.jsx) a un payload de
// columnas de BD, usando un mapa declarativo { campoFormulario: "columna" }.
// Si `cambios` no toca ninguna llave del mapa, el payload sale vacío y el
// caller debe evitar el round-trip a Supabase por completo.
function payloadDesdeCambios(cambios, mapa, normalizar = {}) {
  const payload = {};
  for (const [formKey, columna] of Object.entries(mapa)) {
    if (!(formKey in cambios)) continue;
    const v = cambios[formKey];
    payload[columna] = normalizar[formKey] ? normalizar[formKey](v) : (v || null);
  }
  return payload;
}

// ── Guardar Paso 2 del ajustador (datos generales del siniestro) ─
// Nota: "tipo" es la clasificación propia del ajustador (catálogo TIPOS_SINIESTRO)
// y se guarda aparte de tipo_siniestro/circunstancia, que son la causa ya
// capturada por el cabinero (catálogo CAUSAS/CIRCUNSTANCIAS) y no se debe pisar.
// Recibe `cambios` (solo las llaves que soloCambios() detectó como
// modificadas respecto al snapshot con el que arrancó el formulario) — no
// el estado completo — para hacer un UPDATE mínimo. conductor_es_tercero/
// conductor_nombre/conductor_telefono NO se tocan aquí — ya los definió el
// cabinero al levantar el reporte (ver crearSiniestro) y el ajustador no
// vuelve a decidir quién manejaba.
const MAPA_DATOS_SINIESTRO = {
  tipo:                "clasificacion_siniestro",
  fechaAccidente:      "fecha_siniestro",
  horaAccidente:        "hora_siniestro",
  lugar:                "ubicacion",
  descripcion:          "descripcion",
  versionAsegurado:     "version_asegurado",
  zonaAccidente:        "zona_accidente",
  sentidoCirculacion:   "sentido_circulacion",
  // causa/circunstancia: confirmadas/corregidas por el ajustador — pisan
  // lo que puso el cabinero a propósito (decisión de negocio).
  causa:                "tipo_siniestro",
  circunstancia:        "circunstancia",
  estado:               "estado",
  municipio:            "municipio",
  colonia:              "colonia",
  cp:                   "cp",
  conductorDomicilio:   "conductor_domicilio",
  licenciaTipo:         "licencia_tipo",
  licenciaNumero:       "licencia_numero",
  licenciaFechaExp:     "licencia_fecha_exp",
  licenciaLugarExp:     "licencia_lugar_exp",
  fechaNacimiento:      "conductor_fecha_nacimiento",
  // NA-Módulo1 (rediseño por secciones): sexo del conductor/asegurado y
  // el flujo de licencia (checkbox "presenta documento" + switch
  // permanente/vigencia) que antes no existían en este paso.
  sexo:                 "conductor_sexo",
  presentaLicencia:     "presenta_licencia",
  licenciaPermanente:   "licencia_permanente",
  licenciaFechaVigencia:"licencia_fecha_vigencia",
};
// presentaLicencia/licenciaPermanente son booleanos tri-state — con el
// fallback por defecto de payloadDesdeCambios (`v || null`) un `false`
// real se volvería `null`, así que necesitan normalizar con `??` (mismo
// patrón que NORMALIZAR_DATOS_AJUSTE más abajo).
const NORMALIZAR_DATOS_SINIESTRO = {
  presentaLicencia:   (v) => v ?? null,
  licenciaPermanente: (v) => v ?? null,
};

// ── Datos generales del siniestro (paso "Datos del Siniestro") — fetch en
// vivo para hidratar al montar. El objeto `siniestro` que trae este paso
// como prop viene de la lista (fetchSiniestrosAjustador en
// services/evidencias.js), que solo se carga una vez al abrir la
// pantalla de "Siniestros Asignados" — si el ajustador guarda aquí,
// sale al detalle de otro siniestro y regresa a este SIN recargar la
// página, esa lista nunca se refrescó y el prop trae los datos
// desactualizados (parece que "no se guardó nada"). Por eso este paso,
// igual que los demás, pide sus propios datos frescos directo a
// Supabase en vez de confiar en el prop.
export async function fetchDatosSiniestro(siniestroId) {
  const { data: s, error } = await supabase
    .from("siniestros")
    .select(`
      clasificacion_siniestro, fecha_siniestro, hora_siniestro, ubicacion, descripcion,
      version_asegurado, zona_accidente, sentido_circulacion, tipo_siniestro, circunstancia,
      estado, municipio, colonia, cp,
      conductor_es_tercero, conductor_nombre, conductor_telefono, conductor_domicilio,
      licencia_tipo, licencia_numero, licencia_fecha_exp, licencia_lugar_exp,
      conductor_fecha_nacimiento, conductor_sexo, presenta_licencia,
      licencia_permanente, licencia_fecha_vigencia
    `)
    .eq("id", siniestroId)
    .maybeSingle();
  if (error) throw error;
  if (!s) return null;
  return {
    tipo:               s.clasificacion_siniestro ?? "",
    fechaAccidente:     s.fecha_siniestro ?? "",
    horaAccidente:      s.hora_siniestro?.slice(0, 5) ?? "",
    lugar:              s.ubicacion ?? "",
    descripcion:        s.descripcion ?? "",
    versionAsegurado:   s.version_asegurado ?? "",
    zonaAccidente:      s.zona_accidente ?? "",
    sentidoCirculacion: s.sentido_circulacion ?? "",
    causa:              s.tipo_siniestro ?? "",
    circunstancia:      s.circunstancia ?? "",
    estado:             s.estado    ?? "",
    municipio:          s.municipio ?? "",
    colonia:            s.colonia   ?? "",
    cp:                 s.cp        ?? "",
    conductorEsTercero:         s.conductor_es_tercero ?? false,
    conductorNombreReportado:   s.conductor_nombre      ?? null,
    conductorTelefonoReportado: s.conductor_telefono    ?? null,
    conductorDomicilio: s.conductor_domicilio     ?? "",
    licenciaTipo:       s.licencia_tipo           ?? "",
    licenciaNumero:     s.licencia_numero         ?? "",
    licenciaFechaExp:   s.licencia_fecha_exp      ?? "",
    licenciaLugarExp:   s.licencia_lugar_exp      ?? "",
    fechaNacimiento:    s.conductor_fecha_nacimiento ?? "",
    sexo:                   s.conductor_sexo             ?? "",
    presentaLicencia:       s.presenta_licencia          ?? true,
    licenciaPermanente:     s.licencia_permanente        ?? null,
    licenciaFechaVigencia:  s.licencia_fecha_vigencia    ?? "",
  };
}

export async function actualizarDatosSiniestro(siniestroId, cambios) {
  const payload = payloadDesdeCambios(cambios, MAPA_DATOS_SINIESTRO, NORMALIZAR_DATOS_SINIESTRO);
  if (!Object.keys(payload).length) return;

  const { error } = await supabase
    .from("siniestros")
    .update(payload)
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

const MAPA_NA = {
  descripcionDano: "vehiculo_descripcion_dano",
  abrirReserva:    "vehiculo_abrir_reserva",
  montoEstimado:   "vehiculo_monto_estimado_dano",
  // NA-Módulo3: mapa visual de daños, modo solo-nota (sin monto) — se
  // agrega al lado de la descripción/monto manual, no los reemplaza
  // (ambos alimentan la Declaración del Accidente).
  danosMarcadores: "danos_marcadores",
};
const NORMALIZAR_NA = {
  abrirReserva:  (v) => v ?? null,
  montoEstimado: (v) => (v ? Number(v) : null),
};

// Arma la fila completa de un tercero — se usa igual para INSERT que para
// UPDATE porque la reconciliación es a nivel de fila (ver
// guardarPartesInvolucradas): si algo de la fila cambió, se manda
// completa, no columna por columna dentro de la fila.
function filaTercero(siniestroId, d) {
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
    edad:                  d.edad ? Number(d.edad) : null,
    sexo:                  d.sexo        || null,
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
    licencia_permanente:      d.licenciaPermanente     ?? null,
    licencia_fecha_vigencia:  d.licenciaFechaVigencia  || null,
    reporte_tercero:       d.reporteTercero   || null,
    cobertura_tercero:     d.coberturaTercero || null,
    vencimiento_tercero:   d.vencimientoTercero || null,
    ajustador_tercero:     d.ajustadorTercero || null,
    descripcion_dano:      d.descripcionDano  || null,
    abrir_reserva:         d.abrirReserva     ?? null,
    monto_estimado_dano:   d.montoEstimado ? Number(d.montoEstimado) : null,
    danos_siniestro_marcadores:    d.danosSiniestro    ?? null,
    danos_preexistente_marcadores: d.danosPreexistente ?? null,
    // Tipo de tercero (Conductor/Propietario del bien/Lesionado) y si se
    // solicitó grúa para este vehículo — nuevos, ver rediseño por
    // secciones. solicito_grua es tri-state, no usar `|| null`.
    tipo_tercero:          d.tipoTercero || null,
    solicito_grua:         d.solicitoGrua ?? null,
  };
}

// ── Guardar Paso 3 del ajustador (N.A. + terceros) ────────────
// `cambiosNA`: diff de datosNA contra su snapshot inicial (ver
// soloCambios). `afectadosIds`/`afectados`: estado vigente del formulario
// (mismo shape que produce CapturaEvidencia.jsx). `originalTerceros`:
// snapshot con el que se hidrató el paso, keyed por el mismo id de
// cliente (AF1, AF2...) que usa `afectados` — viene de
// fetchPartesInvolucradas(). Reconciliación por fila: id con `_dbId` real
// y contenido sin cambios → no se toca; con cambios → UPDATE; sin
// `_dbId` → INSERT; fila que estaba en originalTerceros pero ya no está
// en afectadosIds → DELETE. Reemplaza el patrón anterior de "borra todo,
// inserta todo".
export async function guardarPartesInvolucradas(siniestroId, { cambiosNA, afectadosIds, afectados, originalTerceros }) {
  if (cambiosNA && Object.keys(cambiosNA).length) {
    const payloadNA = payloadDesdeCambios(cambiosNA, MAPA_NA, NORMALIZAR_NA);
    if (Object.keys(payloadNA).length) {
      const { error: errNA } = await supabase.from("siniestros").update(payloadNA).eq("id", siniestroId);
      if (errNA) throw errNA;
    }
  }

  // Espejo en Costos del daño estimado del vehículo asegurado — se lee
  // el valor ya guardado (no el diff) para que quede sincronizado sin
  // importar si cambió justo en este guardado. Es bitácora secundaria:
  // si falla, NUNCA debe tumbar el guardado real de terceros/NA.
  try {
    const { data: sinActual } = await supabase
      .from("siniestros").select("vehiculo_monto_estimado_dano").eq("id", siniestroId).maybeSingle();
    if (sinActual) {
      await sincronizarEstimadoCosto({
        siniestroId, origenCampo: "vehiculo_asegurado", origenRegistroId: null,
        categoriaId: "taller", descripcion: "Daño estimado — vehículo asegurado",
        montoEstimado: sinActual.vehiculo_monto_estimado_dano,
      });
    }
  } catch (e) {
    console.error("No se pudo sincronizar el estimado a Costos:", e);
  }

  const original    = originalTerceros ?? {};
  const dbIdsVigentes = new Set();

  for (const id of afectadosIds ?? []) {
    const d   = afectados[id];
    const row = filaTercero(siniestroId, d);
    const descripcionTercero = `Daño estimado — Tercero${d.nombre ? ` (${d.nombre})` : ""}`;

    if (d._dbId) {
      dbIdsVigentes.add(d._dbId);
      const antes = original[id];
      const cambio = !antes || JSON.stringify({ ...antes, _dbId: undefined }) !== JSON.stringify({ ...d, _dbId: undefined });
      if (cambio) {
        const { error } = await supabase.from("siniestros_terceros").update(row).eq("id", d._dbId);
        if (error) throw error;
      }
      try {
        await sincronizarEstimadoCosto({
          siniestroId, origenCampo: "vehiculo_tercero", origenRegistroId: d._dbId,
          categoriaId: "taller", descripcion: descripcionTercero,
          montoEstimado: d.montoEstimado,
        });
      } catch (e) {
        console.error("No se pudo sincronizar el estimado a Costos:", e);
      }
    } else {
      const { data: nuevo, error } = await supabase.from("siniestros_terceros").insert(row).select("id").single();
      if (error) throw error;
      dbIdsVigentes.add(nuevo.id);
      try {
        await sincronizarEstimadoCosto({
          siniestroId, origenCampo: "vehiculo_tercero", origenRegistroId: nuevo.id,
          categoriaId: "taller", descripcion: descripcionTercero,
          montoEstimado: d.montoEstimado,
        });
      } catch (e) {
        console.error("No se pudo sincronizar el estimado a Costos:", e);
      }
    }
  }

  const dbIdsOriginales = Object.values(original).map((t) => t._dbId).filter(Boolean);
  const dbIdsABorrar = dbIdsOriginales.filter((dbId) => !dbIdsVigentes.has(dbId));
  if (dbIdsABorrar.length) {
    const { error } = await supabase.from("siniestros_terceros").delete().in("id", dbIdsABorrar);
    if (error) throw error;
    for (const dbId of dbIdsABorrar) {
      try {
        await eliminarEstimadoCosto({ siniestroId, origenCampo: "vehiculo_tercero", origenRegistroId: dbId });
      } catch (e) {
        console.error("No se pudo limpiar el estimado en Costos:", e);
      }
    }
  }
}

// ── Hidrata el paso "Partes y Evidencia" — sin esto, cada vez que el
// ajustador vuelve a entrar aquí el formulario arranca en blanco y, al
// picar Continuar, se perdían los terceros ya guardados (borrado+
// reinserción completa). Devuelve datosNA y los terceros ya en el shape
// de formulario de CapturaEvidencia.jsx (con `_dbId` para poder
// reconciliar filas al guardar — ver guardarPartesInvolucradas).
export async function fetchPartesInvolucradas(siniestroId) {
  const { data: sin, error: errSin } = await supabase
    .from("siniestros")
    .select("vehiculo_descripcion_dano, vehiculo_abrir_reserva, vehiculo_monto_estimado_dano, danos_marcadores")
    .eq("id", siniestroId)
    .maybeSingle();
  if (errSin) throw errSin;

  const { data: terceros, error: errT } = await supabase
    .from("siniestros_terceros")
    .select(`
      id, vehiculo_desc, vehiculo_modelo, vehiculo_color, vehiculo_placas, vehiculo_serie,
      vehiculo_tipo, vehiculo_motor, propietario_nombre, propietario_domicilio,
      propietario_telefono, edad, sexo, rfc, curp, email, aseguradora_nombre, poliza_tercero,
      declaracion, licencia_tipo, licencia_numero, licencia_fecha_exp, licencia_lugar_exp,
      licencia_permanente, licencia_fecha_vigencia,
      reporte_tercero, cobertura_tercero, vencimiento_tercero, ajustador_tercero,
      descripcion_dano, abrir_reserva, monto_estimado_dano,
      danos_siniestro_marcadores, danos_preexistente_marcadores,
      tipo_tercero, solicito_grua
    `)
    .eq("siniestro_id", siniestroId)
    .order("id", { ascending: true });
  if (errT) throw errT;

  return {
    datosNA: sin ? {
      descripcionDano: sin.vehiculo_descripcion_dano || "",
      abrirReserva:    sin.vehiculo_abrir_reserva ?? null,
      montoEstimado:   sin.vehiculo_monto_estimado_dano != null ? String(sin.vehiculo_monto_estimado_dano) : "",
      danosMarcadores: sin.danos_marcadores ?? {},
    } : null,
    terceros: (terceros ?? []).map((t) => ({
      _dbId: t.id,
      nombre: t.propietario_nombre || "", edad: t.edad != null ? String(t.edad) : "", sexo: t.sexo || "",
      telefono: t.propietario_telefono || "", email: t.email || "",
      rfc: t.rfc || "", curp: t.curp || "", direccion: t.propietario_domicilio || "",
      direccionEstado: "", direccionMunicipio: "", direccionColonia: "", direccionCp: "", direccionCalle: "", direccionNumero: "",
      vehiculo: t.vehiculo_desc || "", vehiculoMarca: "", vehiculoSubmarca: "",
      anio: t.vehiculo_modelo || "", color: t.vehiculo_color || "", placas: t.vehiculo_placas || "", serie: t.vehiculo_serie || "",
      vehiculoTipo: t.vehiculo_tipo || "", vehiculoMotor: t.vehiculo_motor || "",
      aseguradora: t.aseguradora_nombre || "", polizaTercero: t.poliza_tercero || "",
      reporteTercero: t.reporte_tercero || "", coberturaTercero: t.cobertura_tercero || "",
      vencimientoTercero: t.vencimiento_tercero || "", ajustadorTercero: t.ajustador_tercero || "",
      licenciaTipo: t.licencia_tipo || "", licenciaNumero: t.licencia_numero || "",
      licenciaFechaExp: t.licencia_fecha_exp || "", licenciaLugarExp: t.licencia_lugar_exp || "",
      licenciaPermanente: t.licencia_permanente ?? null, licenciaFechaVigencia: t.licencia_fecha_vigencia || "",
      descripcionDano: t.descripcion_dano || "", abrirReserva: t.abrir_reserva ?? null,
      montoEstimado: t.monto_estimado_dano != null ? String(t.monto_estimado_dano) : "",
      danosSiniestro: t.danos_siniestro_marcadores ?? {}, danosPreexistente: t.danos_preexistente_marcadores ?? {},
      declaracion: t.declaracion || "",
      tipoTercero: t.tipo_tercero || "", solicitoGrua: t.solicito_grua ?? null,
    })),
  };
}

// ── Terceros ya capturados (paso 3) — para el paso "Lesionados": si
// el lesionado es el CONDUCTOR de uno de estos vehículos, sus datos
// personales ya se conocen y no hace falta volver a pedirlos.
export async function fetchTerceros(siniestroId) {
  const { data, error } = await supabase
    .from("siniestros_terceros")
    .select("id, propietario_nombre, propietario_domicilio, propietario_telefono, edad")
    .eq("siniestro_id", siniestroId)
    .order("id", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ── Terceros con el detalle completo — para la vista de supervisor
// (vehículo, daños, aseguradora, declaración), a diferencia de
// fetchTerceros() que solo trae la identidad básica para el paso
// "Lesionados" del ajustador.
export async function fetchTercerosDetalle(siniestroId) {
  const { data, error } = await supabase
    .from("siniestros_terceros")
    .select(`
      id, propietario_nombre, propietario_domicilio, propietario_telefono,
      vehiculo_desc, vehiculo_color, vehiculo_modelo, vehiculo_placas,
      aseguradora_nombre, poliza_tercero, descripcion_dano, monto_estimado_dano, declaracion
    `)
    .eq("siniestro_id", siniestroId)
    .order("id", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// Arma la fila completa de un lesionado — reconciliación a nivel de fila
// (ver guardarLesionados), así que se manda completa tanto en INSERT
// como en UPDATE. region_cuerpo/causa_lesion/estado_lesionado/
// tipo_lesion/primeros_auxilios/motivo_traslado son los mismos datos que
// antes vivían en el paso "Documentos" (pase_medico_*) — ahora se
// capturan aquí, junto con el resto de la persona.
function filaLesionado(siniestroId, l) {
  return {
    siniestro_id:     siniestroId,
    // id real del tercero (siniestros_terceros.id) si el lesionado
    // iba en uno de esos vehículos; "NA" si no se ligó a ninguno.
    participante_id:  l.terceroId || "NA",
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
    hospital_telefono: l.hospitalTelefono || null,
    hospital_domicilio: l.hospitalDomicilio || null,
    cobertura:        l.cobertura || null,
    abrir_reserva:    l.abrirReserva ?? null,
    estimado_lesiones: l.estimadoLesiones ? Number(l.estimadoLesiones) : null,
    pase_medico:      l.paseMedico ?? true,
    // No se editan desde este paso — si ya se habían asignado (el
    // lesionado se hidrató con ellos al montar), se preservan; si no,
    // se quedan null hasta que se asignen al finalizar (paso Documentos).
    pase_medico_numero:           l.paseMedicoNumero           || null,
    pase_medico_fecha_expedicion: l.paseMedicoFechaExpedicion  || null,
  };
}

// ── Guardar paso "Lesionados" del ajustador ───────────────────
// Reconciliación por fila, igual que guardarPartesInvolucradas: `id` en
// `lesionadosIds` es el id real de BD (numérico, string) para lesionados
// hidratados, o `L<timestamp>` para uno agregado en esta sesión (ver
// agregarLesionado en Lesionados.jsx) — así se distingue INSERT de
// UPDATE sin un campo aparte. `original`: snapshot con el que se
// hidrató el paso (mismo shape que produce filaAFormulario en
// Lesionados.jsx), keyed por esos mismos ids — lo que ya no aparece en
// `lesionadosIds` se borra.
export async function guardarLesionados(siniestroId, { lesionadosIds, lesionados, original }) {
  const original_ = original ?? {};
  const idsVigentes = new Set();

  for (const id of lesionadosIds ?? []) {
    const l   = lesionados[id];
    const row = filaLesionado(siniestroId, l);
    const esNuevo = !/^\d+$/.test(id);
    const descripcionLesionado = `Estimado de lesiones${l.nombre ? ` — ${l.nombre}` : ""}`;

    if (esNuevo) {
      const { data: nuevo, error } = await supabase.from("siniestros_lesionados").insert(row).select("id").single();
      if (error) throw error;
      idsVigentes.add(String(nuevo.id));
      try {
        await sincronizarEstimadoCosto({
          siniestroId, origenCampo: "lesionado", origenRegistroId: nuevo.id,
          categoriaId: "medico", descripcion: descripcionLesionado,
          montoEstimado: l.estimadoLesiones,
        });
      } catch (e) {
        console.error("No se pudo sincronizar el estimado a Costos:", e);
      }
    } else {
      idsVigentes.add(id);
      const antes  = original_[id];
      const cambio = !antes || JSON.stringify(antes) !== JSON.stringify(l);
      if (cambio) {
        const { error } = await supabase.from("siniestros_lesionados").update(row).eq("id", id);
        if (error) throw error;
      }
      try {
        await sincronizarEstimadoCosto({
          siniestroId, origenCampo: "lesionado", origenRegistroId: Number(id),
          categoriaId: "medico", descripcion: descripcionLesionado,
          montoEstimado: l.estimadoLesiones,
        });
      } catch (e) {
        console.error("No se pudo sincronizar el estimado a Costos:", e);
      }
    }
  }

  const idsABorrar = Object.keys(original_).filter((id) => !idsVigentes.has(id));
  if (idsABorrar.length) {
    const { error } = await supabase.from("siniestros_lesionados").delete().in("id", idsABorrar);
    if (error) throw error;
    for (const id of idsABorrar) {
      try {
        await eliminarEstimadoCosto({ siniestroId, origenCampo: "lesionado", origenRegistroId: Number(id) });
      } catch (e) {
        console.error("No se pudo limpiar el estimado en Costos:", e);
      }
    }
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
const MAPA_DATOS_AJUSTE = {
  culpabilidad:            "culpabilidad",
  solicitoGrua:            "solicito_grua",
  calificacionSiniestro:   "calificacion_siniestro",
  requiereInvestigacion:   "requiere_investigacion",
  convenioGxg:             "convenio_gxg",
  articuloInfringido:      "articulo_infringido",
  inicioAveriguacion:      "inicio_averiguacion",
  numeroAveriguacion:      "numero_averiguacion",
  numeroPartePfp:          "numero_parte_pfp",
  solicitoAbogado:         "solicito_abogado",
  despachoAbogado:         "despacho_abogado",
  recuperacion:            "recuperacion",
  tipoRecuperacion:        "tipo_recuperacion",
  objetoGarantiaImporte:   "objeto_garantia_importe",
  conclusiones:            "conclusiones",
};
// solicitoGrua/requiereInvestigacion/convenioGxg/inicioAveriguacion/
// solicitoAbogado son booleanos tri-state (true/false/null) — con el
// fallback por defecto de payloadDesdeCambios (`v || null`) un `false`
// real se volvería `null`, así que necesitan normalizar con `??`.
const NORMALIZAR_DATOS_AJUSTE = {
  solicitoGrua:          (v) => v ?? null,
  requiereInvestigacion: (v) => v ?? null,
  convenioGxg:           (v) => v ?? null,
  inicioAveriguacion:    (v) => v ?? null,
  solicitoAbogado:       (v) => v ?? null,
};

// ── Datos de Ajuste ya capturados (paso "Cierre del Caso") — para
// hidratar el formulario al volver a entrar; sin esto arrancaba en
// blanco y se perdía de vista lo ya guardado (aunque no se borraba,
// porque este paso es una sola fila — a diferencia de Partes y
// Evidencia/Lesionados, aquí no había riesgo de pérdida de datos, solo
// de mostrar el formulario vacío).
export async function fetchDatosAjuste(siniestroId) {
  const { data, error } = await supabase
    .from("siniestros")
    .select(`
      culpabilidad, solicito_grua, calificacion_siniestro, requiere_investigacion,
      convenio_gxg, articulo_infringido, inicio_averiguacion, numero_averiguacion,
      numero_parte_pfp, solicito_abogado, despacho_abogado, recuperacion,
      tipo_recuperacion, objeto_garantia_importe, conclusiones
    `)
    .eq("id", siniestroId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    culpabilidad:           data.culpabilidad            ?? "",
    solicitoGrua:           data.solicito_grua            ?? null,
    calificacionSiniestro:  data.calificacion_siniestro   ?? "",
    requiereInvestigacion:  data.requiere_investigacion   ?? null,
    convenioGxg:            data.convenio_gxg             ?? null,
    articuloInfringido:     data.articulo_infringido      ?? "",
    inicioAveriguacion:     data.inicio_averiguacion       ?? null,
    numeroAveriguacion:     data.numero_averiguacion      ?? "",
    numeroPartePfp:         data.numero_parte_pfp         ?? "",
    solicitoAbogado:        data.solicito_abogado         ?? null,
    despachoAbogado:        data.despacho_abogado         ?? "",
    recuperacion:           data.recuperacion             ?? "",
    tipoRecuperacion:       data.tipo_recuperacion        ?? "",
    objetoGarantiaImporte:  data.objeto_garantia_importe  ?? "",
    conclusiones:           data.conclusiones             ?? "",
  };
}

// `cambios`: solo los campos que soloCambios() detectó como editados por
// el ajustador. `sistema` son valores derivados que SIEMPRE se mandan
// (no son "campo que cambia o no" — el croquis recién subido y las horas
// oficiales se recalculan/resuben en cada guardado de este paso).
export async function guardarDatosAjuste(siniestroId, cambios, sistema = {}) {
  const { croquisUrl, croquisData, horaTomado, horaPasado, horaLlegada } = sistema;
  const payload = {
    ...payloadDesdeCambios(cambios, MAPA_DATOS_AJUSTE, NORMALIZAR_DATOS_AJUSTE),
    croquis_url:          croquisUrl   || null,
    croquis_data:         croquisData  || null,
    hora_tomado:          horaTomado   || null,
    hora_pasado:          horaPasado   || null,
    ajuste_hora_llegada:  horaLlegada  || null,
  };
  const { error } = await supabase
    .from("siniestros")
    .update(payload)
    .eq("id", siniestroId);
  if (error) throw error;
}

const MAPA_ABOGADO = {
  solicitoAbogado:  "solicito_abogado",
  despachoAbogado:  "despacho_abogado",
};
const NORMALIZAR_ABOGADO = {
  solicitoAbogado: (v) => v ?? null,
};

// ── Abogado (NA-Módulo4 Servicios) — a propósito NO reutiliza
// guardarDatosAjuste: esa función siempre reescribe croquis_url/
// croquis_data/hora_tomado/hora_pasado/ajuste_hora_llegada a partir de
// `sistema` porque asume que solo la llama la pantalla de Cierre: si
// se le llamara desde aquí sin pasar `sistema`, esos campos se
// pondrían en NULL en cada guardado y se perdería el croquis ya
// capturado. Este UPDATE solo toca las 2 columnas de abogado.
export async function guardarAbogado(siniestroId, cambios) {
  const payload = payloadDesdeCambios(cambios, MAPA_ABOGADO, NORMALIZAR_ABOGADO);
  if (!Object.keys(payload).length) return;
  const { error } = await supabase.from("siniestros").update(payload).eq("id", siniestroId);
  if (error) throw error;
}

// ── Folio consecutivo del pase (Taller/Médico, contadores
// independientes) — se pide hasta que el ajustador FINALIZA el
// siniestro, no al activar el toggle del documento, para no quemar
// folios de pases que se activan y luego se cancelan. Ver
// archivos_apoyo/migracion_folios_pase.sql (tabla folios_pase +
// función siguiente_folio, UPDATE...RETURNING atómico).
export async function obtenerSiguienteFolio(tipoPase) {
  const { data, error } = await supabase.rpc("siguiente_folio", { p_tipo: tipoPase });
  if (error) throw error;
  return data;
}

// ── Pase Taller ya capturado (paso "Documentos") — para hidratar el
// formulario si el ajustador sale de este paso y vuelve antes de
// finalizar el siniestro.
export async function fetchPaseTaller(siniestroId) {
  const { data, error } = await supabase
    .from("siniestros")
    .select(`
      pase_taller_numero, pase_taller_clave, pase_taller_definicion,
      pase_taller_destino, pase_taller_vehiculo_tipo, pase_taller_vehiculo_puertas,
      pase_taller_taller_nombre, pase_taller_taller_calle,
      pase_taller_taller_colonia, pase_taller_taller_telefono,
      pase_taller_orden_condicionada, pase_taller_fecha_expedicion
    `)
    .eq("id", siniestroId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

const MAPA_PASE_TALLER = {
  clave:              "pase_taller_clave",
  definicion:          "pase_taller_definicion",
  destino:             "pase_taller_destino",
  vehiculoTipo:        "pase_taller_vehiculo_tipo",
  vehiculoPuertas:     "pase_taller_vehiculo_puertas",
  ordenCondicionada:   "pase_taller_orden_condicionada",
  // Editable por el ajustador (arranca en la fecha de hoy, pero se
  // puede cambiar) — a diferencia de numeroPase, que sí es 100% del
  // sistema (folio consecutivo, se asigna solo al finalizar).
  fechaExpedicion:     "pase_taller_fecha_expedicion",
};
const CAMPOS_TALLER = ["tallerNombre", "tallerCalle", "tallerColonia", "tallerTel"];

// ── Guardar Pase Taller (paso 6 del ajustador) ────────────────
// El taller elegido de la tabla `servicios` (ver fetchTalleres en
// services/servicios.js) o capturado manualmente se guarda ya "aplanado"
// (nombre/tel/calle/colonia sueltos) — el PDF no necesita saber si vino
// de la lista fija o fue manual.
// `cambios`: diff contra el snapshot con el que arrancó el formulario.
// `actual`: estado completo vigente — se necesita para la regla de
// negocio "los datos del taller solo aplican si destino === 'Taller'"
// (si destino cambió a otra cosa hay que limpiarlos aunque ellos mismos
// no se hayan tocado). `sistema.numeroPase`: folio consecutivo, lo
// asigna el sistema al finalizar (ver obtenerSiguienteFolio) — nunca lo
// escribe el ajustador, se manda siempre que venga.
export async function guardarPaseTaller(siniestroId, cambios, actual, sistema = {}) {
  const payload = payloadDesdeCambios(cambios, MAPA_PASE_TALLER);

  // "definicion" ya no tiene control en la UI (siempre es del tercero,
  // ver PASE_TALLER_DEFAULT en Documentos.jsx) — como nunca cambia
  // contra su propio snapshot inicial, soloCambios() jamás lo mete en
  // `cambios` y se queda NULL en BD para siempre. Se manda siempre fijo
  // en vez de depender del diff: pasePdf.js decide con este valor si lee
  // los marcadores de daños del tercero o del asegurado, y con NULL
  // termina leyendo del lado equivocado (siempre vacío) — todos los
  // lados salen "SIN DAÑOS" aunque sí se hayan marcado en el tercero.
  payload.pase_taller_definicion = actual?.definicion || "Tercero";

  const esTaller      = actual?.destino === "Taller";
  const tallerTocado  = CAMPOS_TALLER.some((k) => k in cambios);
  if ("destino" in cambios || tallerTocado) {
    payload.pase_taller_taller_nombre   = esTaller ? (actual.tallerNombre  || null) : null;
    payload.pase_taller_taller_calle    = esTaller ? (actual.tallerCalle   || null) : null;
    payload.pase_taller_taller_colonia  = esTaller ? (actual.tallerColonia || null) : null;
    payload.pase_taller_taller_telefono = esTaller ? (actual.tallerTel     || null) : null;
  }

  if (sistema.numeroPase) payload.pase_taller_numero = sistema.numeroPase;

  if (!Object.keys(payload).length) return;

  const { error } = await supabase
    .from("siniestros")
    .update(payload)
    .eq("id", siniestroId);
  if (error) throw error;
}

// ── Lesionados ya capturados (paso "Lesionados") — se usa tanto para
// hidratar el propio paso al volver a entrar (por eso trae TODAS las
// columnas, incluidas las de Pase Médico) como, más adelante, para
// generar cada Pase Médico ya asignado.
export async function fetchLesionados(siniestroId) {
  const { data, error } = await supabase
    .from("siniestros_lesionados")
    .select(`
      id, nombre, domicilio, telefono, edad, participante_id,
      region_cuerpo, causa_lesion, estado_lesionado, tipo_lesion,
      primeros_auxilios, motivo_traslado, tipo_lesionado,
      hospital_asignado, hospital_telefono, hospital_domicilio,
      cobertura, abrir_reserva, estimado_lesiones,
      pase_medico, pase_medico_numero, pase_medico_fecha_expedicion
    `)
    .eq("siniestro_id", siniestroId)
    .order("id", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ── Asigna el folio de Pase Médico a UN lesionado (paso Documentos,
// al finalizar) — cada lesionado con el switch "Pase médico" activado
// recibe su propio folio, ya que ahora puede haber varios Pase Médico
// en un mismo siniestro (antes era uno solo por siniestro).
export async function asignarFolioPaseMedico(lesionadoId, { numeroPase, fechaExpedicion }) {
  const { error } = await supabase
    .from("siniestros_lesionados")
    .update({
      pase_medico_numero:           numeroPase      || null,
      pase_medico_fecha_expedicion: fechaExpedicion || null,
    })
    .eq("id", lesionadoId);
  if (error) throw error;
}

// ── Encuesta ya capturada (paso "Cierre del Caso") — para hidratar al
// volver a entrar.
export async function fetchEncuesta(siniestroId) {
  const { data, error } = await supabase
    .from("siniestros_encuesta")
    .select("calificacion_reporte, motivo_calificacion_reporte, calificacion_ajustador, motivo_calificacion_ajustador, comentarios")
    .eq("siniestro_id", siniestroId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    calificacionReporte:   data.calificacion_reporte            ?? "",
    motivoReporte:         data.motivo_calificacion_reporte     ?? "",
    calificacionAjustador: data.calificacion_ajustador          ?? "",
    motivoAjustador:       data.motivo_calificacion_ajustador   ?? "",
    comentarios:           data.comentarios                     ?? "",
  };
}

const MAPA_ENCUESTA = {
  calificacionReporte:   "calificacion_reporte",
  motivoReporte:         "motivo_calificacion_reporte",
  calificacionAjustador: "calificacion_ajustador",
  motivoAjustador:       "motivo_calificacion_ajustador",
  comentarios:           "comentarios",
};

// ── Guardar Encuesta de satisfacción (captura el ajustador) ───
// `sistema` (horaReporte/horaLlegada/horaTermino) son horas oficiales, no
// las escribe el ajustador — se mandan siempre. El resto sale de `cambios`.
// El upsert de PostgREST solo toca en el UPDATE las columnas presentes en
// el payload, así que un campo ausente en `cambios` no pisa lo ya guardado.
export async function guardarEncuesta(siniestroId, cambios, sistema = {}) {
  const { horaReporte, horaLlegada, horaTermino } = sistema;
  const payload = {
    siniestro_id: siniestroId,
    ...payloadDesdeCambios(cambios, MAPA_ENCUESTA),
    hora_reporte:  horaReporte  || null,
    hora_llegada:  horaLlegada  || null,
    hora_termino:  horaTermino  || null,
  };
  const { error } = await supabase
    .from("siniestros_encuesta")
    .upsert(payload, { onConflict: "siniestro_id" });
  if (error) throw error;
}

// ── Cerrar siniestro (paso final del ajustador) ───────────────
// hora_termino_ajuste: se sella con la hora real del servidor/dispositivo
// en el momento del cierre — el ajustador nunca la escribe.
export async function cerrarSiniestro(siniestroId) {
  const horaTermino = horaLocal(new Date().toISOString());

  const { data: actual } = await supabase
    .from("siniestros").select("estatus").eq("id", siniestroId).maybeSingle();

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

  await registrarHistorial(
    siniestroId, actual?.estatus, "Cerrado",
    "Caso cerrado — documentos enviados", getState().usuario?.id,
  );
}

// ── Asignar ajustador a un siniestro ──────────────────────────
export async function asignarAjustador(siniestroId, { id: ajustadorId }) {
  const { data: actual } = await supabase
    .from("siniestros").select("estatus").eq("id", siniestroId).maybeSingle();

  const { error } = await supabase
    .from("siniestros")
    .update({ ajustador_id: ajustadorId, estatus: "Asignado" })
    .eq("id", siniestroId);
  if (error) throw error;

  await registrarHistorial(
    siniestroId, actual?.estatus, "Asignado",
    "Ajustador asignado", getState().usuario?.id,
  );
}

// ── Ajustadores disponibles (usuarios con rol AJUSTADOR) ───────
export async function fetchAjustadores() {
  const { data: rol } = await supabase
    .from("roles").select("id").ilike("nombre", "ajustador").maybeSingle();
  if (!rol) return [];
  const { data } = await supabase
    .from("usuarios")
    .select("id, nombre, apellido, telefono")
    .eq("rol_id", rol.id)
    .eq("activo", true)
    .order("nombre");
  return (data ?? []).map((u) => ({
    id:       u.id,
    nombre:   [u.nombre, u.apellido].filter(Boolean).join(" "),
    telefono: u.telefono ?? null,
  }));
}

// ── Calificaciones de encuesta agrupadas por ajustador — para el
// resumen de rendimiento del supervisor. La encuesta solo tiene un
// valor categórico (Excelente/Bien/Deficiente), no una estrella 1-5,
// así que se agregan conteos por categoría en vez de inventar un
// promedio numérico que la BD no respalda.
export async function fetchCalificacionesAjustadores() {
  const { data, error } = await supabase
    .from("siniestros_encuesta")
    .select("calificacion_ajustador, siniestros!inner(ajustador_id)")
    .not("calificacion_ajustador", "is", null);
  if (error) throw error;

  const porAjustador = {};
  (data ?? []).forEach((row) => {
    const ajustadorId = row.siniestros?.ajustador_id;
    if (!ajustadorId) return;
    const acc = porAjustador[ajustadorId] ??= { excelente: 0, bien: 0, deficiente: 0, total: 0 };
    acc.total += 1;
    if (row.calificacion_ajustador === "Excelente") acc.excelente += 1;
    else if (row.calificacion_ajustador === "Bien") acc.bien += 1;
    else if (row.calificacion_ajustador === "Deficiente") acc.deficiente += 1;
  });
  return porAjustador; // { [uuid]: { excelente, bien, deficiente, total } }
}

// ── Tiempo de respuesta: desde que el cabinero levantó el reporte
// (created_at) hasta que el ajustador confirmó su arribo con foto + GPS
// (arribo_fecha) — es el único intervalo que la BD respalda con dos
// timestamps reales; no hay fecha de cierre guardada para medir nada más.
export function horasHastaArribo(s) {
  if (!s.reportadoFecha || !s.arribo_fecha) return null;
  const ms = new Date(s.arribo_fecha) - new Date(s.reportadoFecha);
  if (!(ms > 0)) return null;
  return ms / 3600000;
}

export function promedioHorasArribo(siniestros) {
  const horas = siniestros.map(horasHastaArribo).filter((h) => h != null);
  if (!horas.length) return null;
  return horas.reduce((a, b) => a + b, 0) / horas.length;
}

export function fmtHoras(h) {
  return h == null ? "-" : `${h.toFixed(1)}h`;
}

// ── Documentos adjuntos de un siniestro — tabla existe pero hoy nada
// escribe en ella, así que normalmente regresa vacío. Se deja conectada
// de verdad para que el día que algo empiece a subir aquí, se vea solo.
export async function fetchDocumentos(siniestroId) {
  const { data, error } = await supabase
    .from("siniestros_documentos")
    .select("id, tipo, url, nombre_archivo, created_at")
    .eq("siniestro_id", siniestroId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ── Línea de tiempo de cambios de estatus — misma situación que
// siniestros_documentos: la tabla existe pero nada la llena todavía.
export async function fetchHistorial(siniestroId) {
  const { data, error } = await supabase
    .from("siniestros_historial")
    .select("id, estatus_ant, estatus_nuevo, notas, cambiado_at")
    .eq("siniestro_id", siniestroId)
    .order("cambiado_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
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

// ── Costos de UN siniestro (tab "Costos" del modal de supervisor) ──
export async function fetchCostos(siniestroId) {
  const { data, error } = await supabase
    .from("siniestros_costos")
    .select("id, categoria_id, categoria_nombre, servicio_id, descripcion, fecha, monto, monto_estimado, estatus, notas, origen, servicios(nombre)")
    .eq("siniestro_id", siniestroId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c) => ({
    id:              c.id,
    categoriaId:     c.categoria_id,
    categoriaNombre: c.categoria_nombre,
    servicioId:      c.servicio_id,
    servicioNombre:  c.servicios?.nombre ?? null,
    descripcion:     c.descripcion,
    fecha:           c.fecha,
    monto:           c.monto != null ? Number(c.monto) : null,
    montoEstimado:   c.monto_estimado != null ? Number(c.monto_estimado) : null,
    estatus:         c.estatus,
    notas:           c.notas,
    origen:          c.origen,
  }));
}

export async function crearCosto(siniestroId, { categoriaId, categoriaNombre, servicioId, descripcion, fecha, monto, estatus, notas }) {
  const { data, error } = await supabase
    .from("siniestros_costos")
    .insert({
      siniestro_id:     siniestroId,
      categoria_id:     categoriaId,
      categoria_nombre: categoriaNombre || null,
      servicio_id:      servicioId || null,
      descripcion,
      fecha:            fecha || null,
      monto,
      estatus:          estatus || "pendiente",
      notas:            notas || null,
      creado_por:       getState().usuario?.id ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function actualizarEstatusCosto(costoId, estatus) {
  const { error } = await supabase.from("siniestros_costos").update({ estatus }).eq("id", costoId);
  if (error) throw error;
}

export async function eliminarCosto(costoId) {
  const { error } = await supabase.from("siniestros_costos").delete().eq("id", costoId);
  if (error) throw error;
}

// ── El supervisor captura el monto real de un costo que llegó como
// estimado del ajustador (o de cualquier costo, en realidad) — a
// partir de aquí el estimado queda congelado (ver sincronizarEstimadoCosto).
export async function actualizarMontoReal(costoId, monto) {
  const { error } = await supabase.from("siniestros_costos").update({ monto }).eq("id", costoId);
  if (error) throw error;
}

// ── Crea o actualiza el renglón "espejo" en Costos para un monto
// estimado que captura el ajustador (daño del vehículo, daño de un
// tercero, estimado de lesiones...). Se llama cada vez que el
// ajustador guarda el paso correspondiente — es idempotente: busca
// por (siniestro_id, origen_campo, origen_registro_id).
//
// Mientras el supervisor NO haya capturado un monto real, el estimado
// se sigue actualizando solo en cada guardado del ajustador. En cuanto
// hay monto real, el renglón queda congelado (no se vuelve a tocar
// aunque el ajustador seguirá editando su lado).
export async function sincronizarEstimadoCosto({ siniestroId, origenCampo, origenRegistroId, categoriaId, descripcion, montoEstimado }) {
  let query = supabase
    .from("siniestros_costos")
    .select("id, monto")
    .eq("siniestro_id", siniestroId)
    .eq("origen_campo", origenCampo);
  query = origenRegistroId == null ? query.is("origen_registro_id", null) : query.eq("origen_registro_id", origenRegistroId);
  const { data: existente, error: errSel } = await query.maybeSingle();
  if (errSel) throw errSel;

  const monto = montoEstimado ? Number(montoEstimado) : null;

  if (!existente) {
    if (!monto) return; // sin estimado todavía — no hay nada que reflejar
    const { error } = await supabase.from("siniestros_costos").insert({
      siniestro_id:        siniestroId,
      categoria_id:        categoriaId,
      descripcion,
      monto:               null,
      monto_estimado:      monto,
      estatus:             "pendiente",
      origen:              "ajustador",
      origen_campo:        origenCampo,
      origen_registro_id:  origenRegistroId ?? null,
    });
    if (error) throw error;
    return;
  }

  if (existente.monto != null) return; // ya hay monto real — congelado

  if (!monto) {
    // El ajustador quitó el daño/estimado y todavía no había monto real: se borra el renglón huérfano.
    const { error } = await supabase.from("siniestros_costos").delete().eq("id", existente.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("siniestros_costos")
    .update({ monto_estimado: monto, descripcion })
    .eq("id", existente.id);
  if (error) throw error;
}

// ── Limpia el costo espejo de un tercero/lesionado que se borró del
// formulario del ajustador — solo si todavía no tenía monto real
// capturado (si ya lo tenía, se deja como registro histórico).
export async function eliminarEstimadoCosto({ siniestroId, origenCampo, origenRegistroId }) {
  const { error } = await supabase
    .from("siniestros_costos")
    .delete()
    .eq("siniestro_id", siniestroId)
    .eq("origen_campo", origenCampo)
    .eq("origen_registro_id", origenRegistroId)
    .is("monto", null);
  if (error) throw error;
}

// ── Todos los costos de todos los siniestros — vista global de
// SupervisorCostos.jsx.
export async function fetchCostosTodos() {
  const { data, error } = await supabase
    .from("siniestros_costos")
    .select(`
      id, categoria_id, categoria_nombre, descripcion, fecha, monto, monto_estimado, estatus, notas, origen,
      servicios(nombre),
      siniestros(
        id, numero_siniestro, estatus, tipo_siniestro, fecha_siniestro,
        polizas(placas, anio, notas, clientes(nombre, apellido), vehiculos_amis(marca, tipo, dl))
      )
    `)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((c) => {
    const s   = c.siniestros ?? {};
    const p   = s.polizas ?? {};
    const veh = p.vehiculos_amis;
    const cl  = p.clientes ?? {};
    return {
      id:              c.id,
      categoriaId:     c.categoria_id,
      categoriaNombre: c.categoria_nombre,
      servicioNombre:  c.servicios?.nombre ?? null,
      descripcion:     c.descripcion,
      fecha:           c.fecha,
      monto:           c.monto != null ? Number(c.monto) : null,
      montoEstimado:   c.monto_estimado != null ? Number(c.monto_estimado) : null,
      estatus:         c.estatus,
      notas:           c.notas,
      origen:          c.origen,
      siniestroId:     s.id,
      folio:           s.numero_siniestro ?? "—",
      siniestroEstatus: s.estatus ?? "—",
      tipo:            s.tipo_siniestro ?? "—",
      asegurado:       [cl.nombre, cl.apellido].filter(Boolean).join(" ") || "—",
      vehiculo:        veh?.dl || [veh?.marca, veh?.tipo].filter(Boolean).join(" ") || p.notas || p.placas || "—",
      fechaSiniestro:  fmtFecha(s.fecha_siniestro),
    };
  });
}
