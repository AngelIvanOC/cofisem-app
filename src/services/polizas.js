import { supabase } from "../supabaseClient";
import { EMPRESA } from "../components/pdf/mockData";
import { mockCoberturas, mockCondiciones } from "../components/pdf/mockData";

// Convierte cobertura_rubros de la BD al formato que espera Coberturas.jsx
function rubrosACoberturasPDF(rubros = []) {
  if (!rubros || rubros.length === 0) return mockCoberturas;
  const sorted = [...rubros].sort((a, b) => a.orden - b.orden);
  const result = [];
  let actual = null;
  for (const r of sorted) {
    if (!r.es_sublimite) {
      actual = {
        id:            r.id,
        nombre:        r.rubro,
        sumaAsegurada: r.monto_maximo || '',
        deduciblePct:  '',
        deducibleMax:  '',
        prima:         Number(r.prima_neta) || 0,
        subCoberturas: [],
      };
      result.push(actual);
    } else if (actual) {
      actual.subCoberturas.push({
        numero:   actual.subCoberturas.length + 1,
        concepto: r.rubro,
        monto:    r.monto_maximo || '',
      });
    }
  }
  return result.length > 0 ? result : mockCoberturas;
}

// ── Número en letras (español) ─────────────────────────────────────────────
const _UNI = ['','UN','DOS','TRES','CUATRO','CINCO','SEIS','SIETE','OCHO','NUEVE',
  'DIEZ','ONCE','DOCE','TRECE','CATORCE','QUINCE','DIECISÉIS','DIECISIETE','DIECIOCHO','DIECINUEVE'];
const _DEC = ['','','VEINTE','TREINTA','CUARENTA','CINCUENTA','SESENTA','SETENTA','OCHENTA','NOVENTA'];
const _CEN = ['','CIENTO','DOSCIENTOS','TRESCIENTOS','CUATROCIENTOS','QUINIENTOS',
  'SEISCIENTOS','SETECIENTOS','OCHOCIENTOS','NOVECIENTOS'];

function _grupo(n) {
  if (n === 0) return '';
  if (n === 100) return 'CIEN';
  if (n < 20) return _UNI[n];
  if (n < 100) {
    const u = n % 10, d = Math.floor(n / 10);
    if (n < 30) return u === 0 ? 'VEINTE' : 'VEINTI' + _UNI[u];
    return _DEC[d] + (u ? ' Y ' + _UNI[u] : '');
  }
  const c = Math.floor(n / 100), r = n % 100;
  return _CEN[c] + (r ? ' ' + _grupo(r) : '');
}

export function numeroALetras(n) {
  n = Math.round(n * 100) / 100;
  const entero = Math.floor(n);
  const cts = Math.round((n - entero) * 100);
  if (entero === 0) return 'CERO PESOS ' + String(cts).padStart(2,'0') + '/100 M.N.';
  const M = Math.floor(entero / 1_000_000);
  const K = Math.floor((entero % 1_000_000) / 1_000);
  const R = entero % 1_000;
  let t = '';
  if (M) t += M === 1 ? 'UN MILLÓN ' : _grupo(M) + ' MILLONES ';
  if (K) t += K === 1 ? 'MIL ' : _grupo(K) + ' MIL ';
  if (R) t += _grupo(R) + ' ';
  return (t + 'PESOS ' + String(cts).padStart(2,'0') + '/100 M.N.').trim();
}

// ── Formato fecha DD/MM/YYYY ───────────────────────────────────────────────
function fmtFecha(str) {
  if (!str) return '';
  const d = new Date(str + 'T12:00:00');
  return d.toLocaleDateString('es-MX', { day:'2-digit', month:'2-digit', year:'numeric' });
}

// ── Generar constancia ─────────────────────────────────────────────────────
// Formato: 01 + año(2) + oficina(2) + seq_global(8) - versión_vehiculo(2)
// Ejemplo: 01 26 01 00000001 - 01  →  0126010000000101-01
function generarConstancia(fecha, seqGlobal, seqVehiculo, oficinaId) {
  const yy   = String(fecha.getFullYear()).slice(-2);
  const ofic = String(oficinaId || 1).padStart(2, '0');
  return `01${yy}${ofic}${String(seqGlobal).padStart(8,'0')}-${String(seqVehiculo).padStart(2,'0')}`;
}

// ── Estatus efectivo según fecha_fin ──────────────────────────────────────
// El campo `estatus` en BD es estático; esta función lo recalcula en tiempo real.
// CANCELADA es permanente y nunca se sobreescribe.
export function calcularEstatus(dbEstatus, fechaFin) {
  // Estatus definitivos puestos explícitamente en la BD — nunca sobreescribir
  if (dbEstatus === 'CANCELADA' || dbEstatus === 'VENCIDA' || dbEstatus === 'ANULADA') {
    return dbEstatus;
  }
  // Para los demás, calcular dinámicamente según fecha_fin
  if (!fechaFin) return dbEstatus ?? 'VIGENTE';
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fin = new Date(fechaFin + 'T00:00:00');
  if (fin < hoy) return 'VENCIDA';
  const dias = Math.floor((fin - hoy) / 86_400_000);
  if (dias <= 30) return 'POR VENCER';
  return 'VIGENTE';
}

// ── Cuotas por forma de pago ───────────────────────────────────────────────
const _PRECIO = {
  normal: {
    "CONTADO":     { primerPago: 2500.00, pagoSubs: 0,      nSubs: 0 },
    "4 PARCIALES": { primerPago:  799.00, pagoSubs: 625.00, nSubs: 3 },
  },
  gestor: {
    "CONTADO":     { primerPago: 2200.00, pagoSubs: 0,      nSubs: 0 },
    "4 PARCIALES": { primerPago:  550.00, pagoSubs: 550.00, nSubs: 3 },
  },
};

// pagos: { primerPago, pagoSubs, nSubs } — si se pasa, se usa directamente (pricing desde DB)
// Si no se pasa, se usa la matriz _PRECIO (backward compat)
export async function generarCuotasPoliza(polizaId, formaPago, primaTotal, fechaInicio, esGestor, pagos = null) {
  if (!fechaInicio) return;
  let primerPago, pagoSubs, nSubs;
  if (pagos) {
    ({ primerPago, pagoSubs, nSubs } = pagos);
  } else {
    const tier   = esGestor ? 'gestor' : 'normal';
    const precio = _PRECIO[tier][formaPago] ?? _PRECIO[tier]['CONTADO'];
    primerPago = precio.primerPago;
    pagoSubs   = precio.pagoSubs;
    nSubs      = precio.nSubs;
  }
  const inicio = new Date(fechaInicio + 'T12:00:00');
  const nTotal = formaPago === '4 PARCIALES' ? 1 + nSubs : 1;
  const cuotas = [];
  for (let i = 0; i < nTotal; i++) {
    const d = new Date(inicio);
    d.setDate(d.getDate() + i * 7);
    cuotas.push({
      poliza_id:         polizaId,
      num_cuota:         i + 1,
      monto:             i === 0 ? primerPago : pagoSubs,
      fecha_vencimiento: d.toISOString().split('T')[0],
    });
  }
  // Limpiar cuotas previas de esta póliza antes de regenerar (evita acumulación
  // si se recalcula la forma de pago o se reactiva un folio antes cancelado).
  await supabase.from('pagos').delete().eq('poliza_id', polizaId);
  const { error } = await supabase.from('pagos').insert(cuotas);
  if (error) throw error;
}

// ── Guardar cotización como borrador ──────────────────────────────────────
export async function guardarCotizacion({ form, total, enLetras, usuario }) {
  // Usar coberturaId del form si existe (nuevo flujo con selección de cobertura)
  // Fallback: lookup por prima_total (flujo legacy)
  let coberturaId = form.coberturaId ?? null;
  let coberturaNombre = form.coberturaData?.nombre ?? null;
  if (!coberturaId) {
    const { data: cob } = await supabase.from('coberturas').select('id, nombre').eq('prima_total', total).eq('activa', true).maybeSingle();
    coberturaId = cob?.id ?? null;
    coberturaNombre = coberturaNombre ?? cob?.nombre ?? null;
  } else if (!coberturaNombre) {
    const { data: cob } = await supabase.from('coberturas').select('nombre').eq('id', coberturaId).maybeSingle();
    coberturaNombre = cob?.nombre ?? null;
  }

  const { data, error } = await supabase
    .from('polizas')
    .insert({
      numero_poliza:      `BORR-${Date.now()}`,
      cliente_id:         form.clienteId,
      vendedor_id:        form.vendedorId || null,
      vehiculo_amis_id:   form.vehiculoAmisId || null,
      anio:               parseInt(form.modelo) || null,
      placas:             form.placas?.toUpperCase() || null,
      num_serie:          form.serie?.toUpperCase() || null,
      num_motor:          form.motor?.toUpperCase() || null,
      capacidad:          '4 OCUPANTES',
      uso:                'SERVICIO PUBLICO',
      tipo_servicio:      'TAXI',
      aseguradora:        'GAMAN S.A. DE C.V.',
      tipo_poliza:        coberturaNombre ?? 'TAXI BÁSICA 2500',
      cobertura_id:       coberturaId,
      forma_pago:         form.formaPago,
      fecha_inicio:       form.fechaInicio || null,
      conductor_habitual: form.conductorHabitual || null,
      conductor_sexo:     form.conductorSexo || null,
      conductor_edad:     form.conductorEdad || null,
      ...(form.concesionario != null ? { concesionario_id: form.concesionario } : {}),
      estatus:            'GUARDADO',
      creado_por:         usuario?.id || null,
      oficina_id:         usuario?.oficinas?.id || null,
      en_letras:          enLetras || null,
      notas:              JSON.stringify({ esGestor: form.esGestor ?? false }),
    })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

// ── Actualizar borrador existente ─────────────────────────────────────────
export async function actualizarCotizacion({ polizaId, form, total, enLetras, usuario }) {
  let coberturaId = form.coberturaId ?? null;
  if (!coberturaId) {
    const { data: cob } = await supabase.from('coberturas').select('id').eq('prima_total', total).eq('activa', true).maybeSingle();
    coberturaId = cob?.id ?? null;
  }

  const { error } = await supabase
    .from('polizas')
    .update({
      cliente_id:         form.clienteId,
      vendedor_id:        form.vendedorId || null,
      vehiculo_amis_id:   form.vehiculoAmisId || null,
      anio:               parseInt(form.modelo) || null,
      placas:             form.placas?.toUpperCase() || null,
      num_serie:          form.serie?.toUpperCase() || null,
      num_motor:          form.motor?.toUpperCase() || null,
      cobertura_id:       coberturaId,
      forma_pago:         form.formaPago,
      fecha_inicio:       form.fechaInicio || null,
      conductor_habitual: form.conductorHabitual || null,
      conductor_sexo:     form.conductorSexo || null,
      conductor_edad:     form.conductorEdad || null,
      ...(form.concesionario != null ? { concesionario_id: form.concesionario } : {}),
      en_letras:          enLetras || null,
      notas:              JSON.stringify({ esGestor: form.esGestor ?? false }),
      actualizado_por:    usuario?.id || null,
      actualizado_at:     new Date().toISOString(),
    })
    .eq('id', polizaId)
    .eq('estatus', 'GUARDADO');
  if (error) throw error;
}

// ── Leer borradores del usuario ───────────────────────────────────────────
export async function fetchCotizacionesGuardadas(usuarioId) {
  const { data, error } = await supabase
    .from('polizas')
    .select(`
      id, forma_pago, fecha_inicio, created_at, notas,
      anio, placas, num_serie, num_motor,
      cliente_id, vendedor_id, concesionario_id, vehiculo_amis_id,
      conductor_habitual, conductor_sexo, conductor_edad,
      clientes(nombre, apellido),
      vendedores(nombre, apellido),
      coberturas(nombre, prima_total),
      vehiculos_amis(id, cve, marca, tipo, dc, dl)
    `)
    .eq('estatus', 'GUARDADO')
    .eq('creado_por', usuarioId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ── Verificar si una constancia ya existe ────────────────────────────────
export async function verificarConstanciaExistente(constancia) {
  const { data } = await supabase
    .from('polizas')
    .select('constancia, fecha_inicio, clientes(nombre, apellido)')
    .eq('constancia', constancia.trim().toUpperCase())
    .not('estatus', 'in', '("GUARDADO","SUBSECUENTE")')
    .maybeSingle();
  return data ?? null;
}

// ── Eliminar borrador ─────────────────────────────────────────────────────
export async function eliminarCotizacion(id) {
  const { error } = await supabase
    .from('polizas')
    .delete()
    .eq('id', id)
    .eq('estatus', 'GUARDADO');
  if (error) throw error;
}

// ── Crear póliza subsecuente (constancia reservada) ───────────────────────
// Hereda cliente y cobertura de la póliza cancelada. Genera constancia real.
export async function crearPolizaSubsecuente({ polizaOriginalId, clienteId, coberturaId, oficina_id, creadoPor = null }) {
  const hoy = new Date();
  const fin = new Date(hoy);
  fin.setFullYear(fin.getFullYear() + 1);

  const { data: nueva, error: e1 } = await supabase
    .from('polizas')
    .insert({
      numero_poliza: `SUBS-${Date.now()}`,
      cliente_id:    clienteId,
      cobertura_id:  coberturaId,
      estatus:       'SUBSECUENTE',
      fecha_inicio:  hoy.toISOString().split('T')[0],
      fecha_fin:     fin.toISOString().split('T')[0],
      oficina_id:    oficina_id || null,
      creado_por:    creadoPor || null,
      notas:         JSON.stringify({ polizaOrigenId: polizaOriginalId }),
    })
    .select('id')
    .single();
  if (e1) throw e1;

  const { count: globalSeq } = await supabase
    .from('polizas')
    .select('id', { count: 'exact', head: true })
    .in('estatus', ['VIGENTE','POR VENCER','VENCIDA','CANCELADA','SUBSECUENTE'])
    .lte('id', nueva.id);

  const constancia = generarConstancia(hoy, globalSeq ?? 1, 1, oficina_id);

  const { error: e2 } = await supabase
    .from('polizas')
    .update({ constancia, numero_poliza: constancia })
    .eq('id', nueva.id);
  if (e2) throw e2;

  return { id: nueva.id, constancia };
}

// ── Leer pólizas subsecuentes asignadas a un operador ────────────────────
export async function fetchPolizasSubsecuentes(usuarioId) {
  const { data, error } = await supabase
    .from('polizas')
    .select(`
      id, constancia, numero_poliza, fecha_inicio, fecha_fin, created_at,
      cliente_id, notas,
      clientes(id, nombre, apellido),
      coberturas(id, nombre, prima_neta, prima_total, duracion_meses,
        cobertura_rubros(id, rubro, prima_neta, monto_maximo, es_sublimite, orden))
    `)
    .eq('estatus', 'SUBSECUENTE')
    .eq('creado_por', usuarioId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ── Emitir póliza ──────────────────────────────────────────────────────────
export async function emitirPoliza({
  polizaId = null,
  clienteId, vendedorId, vehiculoAmisId, anio, serie, numMotor, placas,
  capacidad, uso, tipoServicio, primaNeta, primaTotal,
  formaPago, fechaInicio, enLetras, cpAsegurado, creadoPor,
  conductorHabitual, conductorSexo, conductorEdad, concesionarioId, oficinaId,
  esGestor, coberturaId, coberturaNombre = null, pagos = null, numeroManual = null,
}) {
  const ahora   = new Date();
  const horaStr = ahora.toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false }) + ' hrs.';

  const inicio = new Date(fechaInicio + 'T12:00:00');
  const fin    = new Date(inicio);
  fin.setFullYear(fin.getFullYear() + 1);
  const fechaFin = fin.toISOString().split('T')[0];

  // Resolver coberturaId por prima_total si no se pasó explícitamente
  let resolvedCoberturaId = coberturaId ?? null;
  let resolvedCoberturaNombre = coberturaNombre;
  if (!resolvedCoberturaId && primaTotal) {
    const { data: cob } = await supabase
      .from('coberturas')
      .select('id, nombre')
      .eq('prima_total', primaTotal)
      .eq('activa', true)
      .single();
    resolvedCoberturaId = cob?.id ?? null;
    resolvedCoberturaNombre = resolvedCoberturaNombre ?? cob?.nombre ?? null;
  } else if (!resolvedCoberturaNombre && resolvedCoberturaId) {
    const { data: cob } = await supabase.from('coberturas').select('nombre').eq('id', resolvedCoberturaId).maybeSingle();
    resolvedCoberturaNombre = cob?.nombre ?? null;
  }

  const camposBase = {
    cliente_id:         clienteId,
    vendedor_id:        vendedorId || null,
    vehiculo_amis_id:   vehiculoAmisId || null,
    anio:               parseInt(anio) || null,
    placas:             placas?.toUpperCase() || null,
    num_serie:          serie?.toUpperCase() || null,
    num_motor:          numMotor?.toUpperCase() || null,
    capacidad:          capacidad || '4 OCUPANTES',
    uso:                uso || 'SERVICIO PUBLICO',
    tipo_servicio:      tipoServicio || 'TAXI',
    aseguradora:        'GAMAN S.A. DE C.V.',
    tipo_poliza:        resolvedCoberturaNombre ?? 'TAXI BÁSICA 2500',
    cobertura_id:       resolvedCoberturaId,
    forma_pago:         formaPago,
    fecha_inicio:       fechaInicio,
    fecha_fin:          fechaFin,
    hora_inicio:        '12:00:00 hrs.',
    hora_fin:           '12:00:00 hrs.',
    emision_hora:       horaStr,
    descuento:          0,
    recargo:            0,
    en_letras:          enLetras,
    cp_asegurado:       cpAsegurado || null,
    uso_tarifario:      '15',
    conductor_habitual: conductorHabitual || null,
    conductor_sexo:     conductorSexo || null,
    conductor_edad:     conductorEdad || null,
    ...(concesionarioId != null ? { concesionario_id: concesionarioId } : {}),
    estatus:            'VIGENTE',
    oficina_id:         oficinaId || null,
  };

  const SELECT_FULL = `
    *,
    clientes(id, nombre, apellido, rfc, curp, telefono, email, direccion, calle, numero_ext, numero_int, colonia, ciudad, estado, cp),
    vendedores(id, nombre, apellido, codigo),
    concesionarios(id, nombre, apellido1, apellido2),
    oficinas(id, nombre),
    usuarios!polizas_creado_por_fkey(id_muestra),
    vehiculos_amis(id, cve, mr, marca, tipo, dc, dl, anio),
    coberturas(nombre, prima_neta, prima_total, cobertura_rubros(id, rubro, prima_neta, monto_maximo, es_sublimite, orden))
  `;

  let newId;

  if (polizaId) {
    // Detectar si es SUBSECUENTE o RENOVACION (constancia pre-asignada — no regenerar)
    const { data: existente } = await supabase
      .from('polizas').select('estatus, notas').eq('id', polizaId).single();
    const esSubsecuente = existente?.estatus === 'SUBSECUENTE';
    const esRenovacion  = existente?.estatus === 'RENOVACION';

    // Leer renovacionDeId ANTES de que el update limpie notas
    let renovacionDeId = null;
    if (esRenovacion) {
      try { renovacionDeId = JSON.parse(existente.notas ?? '{}').renovacionDeId ?? null; } catch {}
    }

    const { error: eu } = await supabase
      .from('polizas')
      .update({
        ...camposBase,
        notas:           null,
        actualizado_por: creadoPor || null,
        actualizado_at:  new Date().toISOString(),
      })
      .eq('id', polizaId);
    if (eu) throw eu;
    newId = polizaId;

    if (esSubsecuente || esRenovacion) {
      // Constancia ya está asignada — solo actualizar datos y generar cuotas
      const { data: final, error: ef } = await supabase
        .from('polizas').update({ estatus: 'VIGENTE' }).eq('id', newId)
        .select(SELECT_FULL).single();
      if (ef) throw ef;
      await generarCuotasPoliza(newId, formaPago, primaTotal, fechaInicio, esGestor ?? false, pagos);
      // Si es renovación: solo marcar la póliza anterior como VENCIDA si ya expiró.
      // Si aún está dentro de su vigencia (renovación anticipada), no se toca — expirará
      // naturalmente en su fecha_fin y calcularEstatus la mostrará como VENCIDA.
      if (esRenovacion && renovacionDeId) {
        const hoy = new Date().toISOString().split('T')[0];
        const { data: origAnterior } = await supabase
          .from('polizas').select('fecha_fin').eq('id', renovacionDeId).single();
        if (origAnterior && origAnterior.fecha_fin <= hoy) {
          await supabase.from('polizas').update({ estatus: 'VENCIDA' }).eq('id', renovacionDeId);
        }
      }
      return final;
    }
  } else {
    // Insertar nueva póliza
    const numProv = numeroManual
      ? numeroManual.trim().toUpperCase()
      : `COF-${Date.now()}`;
    const { data: nueva, error: e1 } = await supabase
      .from('polizas')
      .insert({
        numero_poliza: numProv,
        ...camposBase,
        creado_por: creadoPor || null,
      })
      .select('id')
      .single();
    if (e1) throw e1;
    newId = nueva.id;
  }

  // Si se proporcionó número manual: usarlo directamente, sin generar constancia
  if (numeroManual) {
    const constanciaManual = numeroManual.trim().toUpperCase();
    const { data: final, error: e2 } = await supabase
      .from('polizas')
      .update({ constancia: constanciaManual, numero_poliza: constanciaManual })
      .eq('id', newId)
      .select(SELECT_FULL)
      .single();
    if (e2) throw e2;
    await generarCuotasPoliza(newId, formaPago, primaTotal, fechaInicio, esGestor ?? false, pagos);
    return final;
  }

  // Contar pólizas emitidas globales (seq de 8 dígitos)
  const { count: globalSeq } = await supabase
    .from('polizas')
    .select('id', { count: 'exact', head: true })
    .in('estatus', ['VIGENTE','POR VENCER','VENCIDA','CANCELADA'])
    .lte('id', newId);

  // Toda emisión nueva es siempre la primera versión (-01) de ese número de póliza.
  // El incremento del sufijo solo ocurre al renovar (ver renovarPoliza).
  const constancia = generarConstancia(ahora, globalSeq ?? 1, 1, oficinaId);

  const { data: final, error: e2 } = await supabase
    .from('polizas')
    .update({ constancia, numero_poliza: constancia })
    .eq('id', newId)
    .select(SELECT_FULL)
    .single();
  if (e2) throw e2;

  await generarCuotasPoliza(newId, formaPago, primaTotal, fechaInicio, esGestor ?? false, pagos);

  return final;
}

// ── Renovar póliza (incrementa el sufijo de la constancia) ───────────────
// Ejemplo: 01261100000159-01 → 01261100000159-02
export async function renovarPoliza(polizaId, creadoPor) {
  // 1. Obtener póliza original
  const { data: original, error: e0 } = await supabase
    .from('polizas')
    .select('*')
    .eq('id', polizaId)
    .single();
  if (e0) throw e0;

  // 2. Parsear constancia y calcular siguiente sufijo
  const constanciaOrig = original.constancia ?? original.numero_poliza ?? '';
  const match = constanciaOrig.match(/^(.+)-(\d+)$/);
  if (!match) throw new Error('Formato de constancia inválido para renovación');
  const base           = match[1];
  const siguienteSufijo = String(parseInt(match[2], 10) + 1).padStart(2, '0');
  const nuevaConstancia = `${base}-${siguienteSufijo}`;

  // 3. Verificar que la nueva constancia no exista.
  // Si ya existe pero está CANCELADA (p.ej. una renovación previa mal capturada
  // y cancelada), se reutiliza ese registro en vez de bloquear la renovación.
  const { data: duplicado } = await supabase
    .from('polizas')
    .select('id, estatus')
    .eq('constancia', nuevaConstancia)
    .maybeSingle();
  if (duplicado && duplicado.estatus !== 'CANCELADA') {
    throw new Error(`La póliza ${nuevaConstancia} ya existe`);
  }

  // 4. Calcular nuevas fechas (inicio = día siguiente al vencimiento original)
  const fechaInicioNueva = (() => {
    const d = new Date((original.fecha_fin ?? new Date().toISOString().split('T')[0]) + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();
  const fechaFinNueva = (() => {
    const d = new Date(fechaInicioNueva + 'T12:00:00');
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  })();

  // 5. Insertar nueva póliza copiando los datos del original
  // (o actualizar el registro CANCELADO reutilizado, ya que `constancia` es UNIQUE en BD)
  const notasOrig = (() => {
    try { return JSON.parse(original.notas ?? '{}'); } catch { return {}; }
  })();
  const datosRenovacion = {
    constancia:         nuevaConstancia,
    numero_poliza:      nuevaConstancia,
    cliente_id:         original.cliente_id,
    vendedor_id:        original.vendedor_id,
    vehiculo_amis_id:   original.vehiculo_amis_id,
    concesionario_id:   original.concesionario_id ?? null,
    anio:               original.anio,
    placas:             original.placas,
    num_serie:          original.num_serie,
    num_motor:          original.num_motor,
    capacidad:          original.capacidad,
    uso:                original.uso,
    tipo_servicio:      original.tipo_servicio,
    aseguradora:        original.aseguradora,
    tipo_poliza:        original.tipo_poliza,
    cobertura_id:       original.cobertura_id,
    forma_pago:         original.forma_pago,
    fecha_inicio:       fechaInicioNueva,
    fecha_fin:          fechaFinNueva,
    hora_inicio:        '12:00:00 hrs.',
    hora_fin:           '12:00:00 hrs.',
    en_letras:          original.en_letras,
    cp_asegurado:       original.cp_asegurado,
    uso_tarifario:      original.uso_tarifario,
    conductor_habitual: original.conductor_habitual,
    conductor_sexo:     original.conductor_sexo,
    conductor_edad:     original.conductor_edad,
    descuento:          0,
    recargo:            0,
    estatus:            'RENOVACION',
    oficina_id:         original.oficina_id,
    creado_por:         creadoPor || null,
    notas:              JSON.stringify({ ...notasOrig, renovacionDeId: polizaId }),
  };

  let nueva, e1;
  if (duplicado) {
    // Las cuotas de la captura anterior (cancelada) se limpian en generarCuotasPoliza
    // al completar esta renovación.
    ({ data: nueva, error: e1 } = await supabase
      .from('polizas').update(datosRenovacion).eq('id', duplicado.id).select('id').single());
  } else {
    ({ data: nueva, error: e1 } = await supabase
      .from('polizas').insert(datosRenovacion).select('id').single());
  }
  if (e1) throw e1;

  return { id: nueva.id, constancia: nuevaConstancia };
}

// ── Cargar póliza completa por ID (para generar PDF) ──────────────────────
export async function fetchPolizaById(id) {
  const { data, error } = await supabase
    .from('polizas')
    .select(`
      *,
      clientes(id, nombre, apellido, rfc, curp, telefono, direccion, calle, numero_ext, numero_int, colonia, ciudad, estado, cp),
      vendedores(id, nombre, apellido, codigo),
      concesionarios(id, nombre, apellido1, apellido2),
      oficinas(id, nombre),
      usuarios!polizas_creado_por_fkey(id_muestra),
      vehiculos_amis(id, cve, mr, marca, tipo, dc, dl, anio),
      coberturas(nombre, prima_neta, prima_total, cobertura_rubros(id, rubro, prima_neta, monto_maximo, es_sublimite, orden))
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return { ...data, estatus: calcularEstatus(data.estatus, data.fecha_fin) };
}

// ── Cancelar póliza ───────────────────────────────────────────────────────
export async function cancelarPoliza(id, motivo, canceladoPor) {
  const { error: e1 } = await supabase
    .from('polizas')
    .update({ estatus: 'CANCELADA', notas: motivo || null })
    .eq('id', id);
  if (e1) throw e1;

  await supabase.from('polizas_historial').insert({
    poliza_id:    id,
    estatus_nuevo: 'CANCELADA',
    notas:         motivo || null,
    cambiado_por:  canceladoPor || null,
  });
}

// ── Editar póliza (datos vehículo) ────────────────────────────────────────
export async function editarPoliza(id, { numSerie, numMotor, placas }, editadoPor, motivo) {
  const updates = {
    actualizado_por: editadoPor || null,
    actualizado_at:  new Date().toISOString(),
  };
  if (numSerie !== undefined) updates.num_serie = numSerie?.toUpperCase() || null;
  if (numMotor !== undefined) updates.num_motor = numMotor?.toUpperCase() || null;
  if (placas   !== undefined) updates.placas   = placas?.toUpperCase()   || null;

  const { error } = await supabase.from('polizas').update(updates).eq('id', id);
  if (error) throw error;

  await supabase.from('polizas_historial').insert({
    poliza_id:    id,
    estatus_nuevo: 'EDITADA',
    notas:         motivo || null,
    cambiado_por:  editadoPor || null,
  });
}

// ── Contar pólizas activas de un cliente ──────────────────────────────────
export async function contarPolizasCliente(clienteId) {
  if (!clienteId) return 0;
  const { count, error } = await supabase
    .from('polizas')
    .select('id', { count: 'exact', head: true })
    .eq('cliente_id', clienteId)
    .in('estatus', ['VIGENTE','POR VENCER','VENCIDA','CANCELADA','ANULADA']);
  if (error) throw error;
  return count ?? 0;
}

// ── Contar pólizas activas de un concesionario ────────────────────────────
export async function contarPolizasConcesionario(concesionarioId) {
  if (!concesionarioId) return 0;
  const { count, error } = await supabase
    .from('polizas')
    .select('id', { count: 'exact', head: true })
    .eq('concesionario_id', concesionarioId)
    .in('estatus', ['VIGENTE','POR VENCER','VENCIDA','CANCELADA','ANULADA']);
  if (error) throw error;
  return count ?? 0;
}

// ── Cargar pólizas de la lista ─────────────────────────────────────────────
export async function fetchPolizas(oficinaId = null) {
  let q = supabase
    .from('polizas')
    .select(`
      id, numero_poliza, constancia, estatus, forma_pago,
      fecha_inicio, fecha_fin, created_at,
      clientes(nombre, apellido),
      vendedores(nombre, apellido),
      coberturas(nombre, prima_neta, prima_total, cobertura_rubros(id, rubro, prima_neta, monto_maximo, es_sublimite, orden))
    `)
    .in('estatus', ['VIGENTE','POR VENCER','VENCIDA','CANCELADA','ANULADA'])
    .order('fecha_inicio', { ascending: false });
  if (oficinaId) q = q.eq('oficina_id', oficinaId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(p => ({ ...p, estatus: calcularEstatus(p.estatus, p.fecha_fin) }));
}

// ── Mapear póliza DB → objeto PolizaPDF ───────────────────────────────────
export function buildPolizaPDF(poliza, oficina, config = {}) {
  const derechos  = config.derechos_emision ?? 400;
  const ivaPct    = config.iva_pct          ?? 16;
  const primaNeta = poliza.coberturas?.prima_neta ?? 0;
  const iva       = +((primaNeta + derechos) * (ivaPct / 100)).toFixed(2);
  const cliente       = poliza.clientes       ?? {};
  const vendedor      = poliza.vendedores     ?? {};
  const concesionario = poliza.concesionarios ?? null;
  const oficinaPDF    = poliza.oficinas ?? oficina ?? null;
  const creadorMuestra = poliza.usuarios?.id_muestra ?? null;
  const nombreBase   = [cliente.nombre, cliente.apellido].filter(Boolean).join(' ').toUpperCase();
  const nombreConc   = concesionario
    ? [concesionario.nombre, concesionario.apellido1, concesionario.apellido2]
        .filter(Boolean).join(' ').toUpperCase()
    : null;
  const nombre = nombreConc ? `${nombreBase} Y/O ${nombreConc}` : nombreBase;

  return {
    empresa:      EMPRESA,
    numeroPoliza: poliza.constancia || poliza.numero_poliza,
    tipoPlan:     poliza.tipo_poliza || 'TAXI BÁSICA 2500',
    emision:      fmtFecha(poliza.created_at?.split('T')[0]),
    emisionHora:  poliza.emision_hora || '',
    estatus:      calcularEstatus(poliza.estatus, poliza.fecha_fin),
    codigoQR:     poliza.constancia
      ? `${window.location.origin}/gaman/verificar/${poliza.constancia}`
      : '',

    contratante: {
      nombre,
      rfc:              cliente.rfc || '',
      curp:             cliente.curp || '',
      telefono:         cliente.telefono || '',
      conductorHabitual:poliza.conductor_habitual || '',
      conductorSexo:    poliza.conductor_sexo    || '',
      conductorEdad:    poliza.conductor_edad    || '',
      constancia:       poliza.constancia || '—',
      usoTarifario:     poliza.uso_tarifario || '15',
      direccion: {
        calle: cliente.direccion
          || [
               cliente.calle,
               cliente.numero_ext,
               cliente.numero_int ? `Int. ${cliente.numero_int}` : null,
             ].filter(Boolean).join(' ')
          || '',
        colonia:   cliente.colonia || '',
        municipio: cliente.ciudad  || '',
        estado:    cliente.estado  || '',
        cp:        cliente.cp      || '',
      },
    },

    vehiculo: {
      marca:       (poliza.vehiculos_amis?.marca) || '',
      modelo:      (poliza.vehiculos_amis?.tipo)  || '',
      version:     (poliza.vehiculos_amis?.dc)    || '',
      descripcion: (poliza.vehiculos_amis?.dl)    || poliza.notas || '',
      anio:        poliza.anio?.toString()         || '',
      placas:    poliza.placas                           || '',
      serie:     poliza.num_serie                        || '',
      motor:     poliza.num_motor                        || '',
      capacidad: poliza.capacidad                        || '4 OCUPANTES',
      uso:       poliza.uso                              || 'SERVICIO PUBLICO',
      tipo:      poliza.tipo_servicio                    || 'TAXI',
      codAMIS:   String(poliza.vehiculos_amis?.cve ?? '') || '',
      clase:     'Sedán',
    },

    vigencia: {
      inicio:     fmtFecha(poliza.fecha_inicio),
      inicioHora: poliza.hora_inicio || '12:00:00 hrs.',
      fin:        fmtFecha(poliza.fecha_fin),
      finHora:    poliza.hora_fin    || '12:00:00 hrs.',
    },

    prima: {
      neta:      primaNeta,
      descuento: poliza.descuento || 0,
      premioNeto:primaNeta,
      recargo:   poliza.recargo   || 0,
      derechos,
      iva,
      total:     +(primaNeta + derechos + iva).toFixed(2),
      enLetras:  poliza.en_letras    || '',
      formaPago: poliza.forma_pago   || 'CONTADO',
    },

    coberturas: rubrosACoberturasPDF(poliza.coberturas?.cobertura_rubros),

    agencia: {
      id:       oficinaPDF?.id     ?? null,
      nombre:   oficinaPDF?.nombre ?? '',
      operador: creadorMuestra != null ? `${creadorMuestra}` : '',
      vendedor: vendedor.id === 1 ? '1' : (vendedor.codigo || '—'),
    },

    condiciones: mockCondiciones,
  };
}
