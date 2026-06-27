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
  cliente_id, placas, num_serie, num_motor, anio, capacidad,
  clientes(nombre, apellido),
  oficinas(nombre),
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
    veh?.dl || [veh?.marca, veh?.tipo, veh?.dc].filter(Boolean).join(" ") || "—";

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
        id, constancia, numero_poliza, placas, anio,
        clientes(nombre, apellido, telefono),
        vehiculos_amis(marca, tipo),
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
    const vehiculo = [veh?.marca, veh?.tipo, p.anio].filter(Boolean).join(" ") || p.placas || "—";
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

// ── Cerrar siniestro (paso final del ajustador) ───────────────
export async function cerrarSiniestro(siniestroId) {
  const { error } = await supabase
    .from("siniestros")
    .update({ estatus: "Cerrado" })
    .eq("id", siniestroId);
  if (error) throw error;
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
