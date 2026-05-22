import { supabase } from "../supabaseClient";
import { EMPRESA } from "../components/pdf/mockData";
import { mockCoberturas, mockCondiciones } from "../components/pdf/mockData";

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
function generarConstancia(fecha, seqGlobal, seqCliente) {
  const dd = String(fecha.getDate()).padStart(2,'0');
  const mm = String(fecha.getMonth() + 1).padStart(2,'0');
  const yy = String(fecha.getFullYear()).slice(-2);
  return `${dd}${mm}${yy}${String(seqGlobal).padStart(8,'0')}-${String(seqCliente).padStart(2,'0')}`;
}

// ── Emitir póliza ──────────────────────────────────────────────────────────
export async function emitirPoliza({
  clienteId, vendedorId, marca, modelo, anio, serie, numMotor, placas,
  codAmis, capacidad, version, uso, tipoServicio, primaNeta, primaTotal,
  formaPago, fechaInicio, derechos, iva, enLetras, cpAsegurado, creadoPor,
  conductorHabitual, conductorSexo, conductorEdad, concesionarioId, oficinaId,
}) {
  const ahora   = new Date();
  const horaStr = ahora.toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false }) + ' hrs.';

  // Calcular fecha_fin (+1 año)
  const inicio = new Date(fechaInicio + 'T12:00:00');
  const fin    = new Date(inicio);
  fin.setFullYear(fin.getFullYear() + 1);
  const fechaFin = fin.toISOString().split('T')[0];

  // Número de póliza provisional (se actualizará con constancia)
  const numPolizaProv = `COF-${Date.now()}`;

  // 1. Insertar póliza
  const { data: nueva, error: e1 } = await supabase
    .from('polizas')
    .insert({
      numero_poliza:     numPolizaProv,
      cliente_id:        clienteId,
      vendedor_id:       vendedorId || null,
      marca,
      modelo,
      anio:              parseInt(anio) || null,
      placas:            placas?.toUpperCase() || null,
      num_serie:         serie?.toUpperCase() || null,
      num_motor:         numMotor?.toUpperCase() || null,
      cod_amis:          codAmis || null,
      capacidad:         capacidad || '4 OCUPANTES',
      version:           version || null,
      uso:               uso || 'SERVICIO PUBLICO',
      tipo_servicio:     tipoServicio || 'TAXI',
      aseguradora:       'GAMAN S.A. DE C.V.',
      tipo_poliza:       'TAXI BÁSICA 2500',
      cobertura:         'BÁSICA',
      prima_neta:        primaNeta,
      prima_total:       primaTotal,
      forma_pago:        formaPago,
      fecha_inicio:      fechaInicio,
      fecha_fin:         fechaFin,
      hora_inicio:       '00:00:00 hrs.',
      hora_fin:          '23:59:59 hrs.',
      emision_hora:      horaStr,
      descuento:         0,
      recargo:           0,
      derechos:          derechos || 400,
      iva,
      en_letras:         enLetras,
      cp_asegurado:          cpAsegurado || null,
      uso_tarifario:         '15',
      conductor_habitual:    conductorHabitual || null,
      conductor_sexo:        conductorSexo || null,
      conductor_edad:        conductorEdad || null,
      ...(concesionarioId != null ? { concesionario_id: concesionarioId } : {}),
      estatus:               'VIGENTE',
      creado_por:            creadoPor || null,
      oficina_id:            oficinaId || null,
    })
    .select('id, cliente_id')
    .single();
  if (e1) throw e1;

  const newId = nueva.id;

  // 2. Contar pólizas emitidas globales (para seq de 8 dígitos)
  const { count: globalSeq } = await supabase
    .from('polizas')
    .select('id', { count: 'exact', head: true })
    .in('estatus', ['VIGENTE','POR VENCER','VENCIDA','CANCELADA'])
    .lte('id', newId);

  // 3. Contar pólizas emitidas de este cliente (para sufijo)
  const { count: clienteSeq } = await supabase
    .from('polizas')
    .select('id', { count: 'exact', head: true })
    .eq('cliente_id', clienteId)
    .in('estatus', ['VIGENTE','POR VENCER','VENCIDA','CANCELADA'])
    .lte('id', newId);

  const constancia = generarConstancia(ahora, globalSeq ?? 1, clienteSeq ?? 1);

  // 4. Actualizar con constancia y numero_poliza definitivo
  const { data: final, error: e2 } = await supabase
    .from('polizas')
    .update({ constancia, numero_poliza: constancia })
    .eq('id', newId)
    .select(`
      *,
      clientes(id, nombre, apellido, rfc, curp, telefono, email, direccion, colonia, ciudad, estado, cp),
      vendedores(id, nombre, apellido, codigo),
      concesionarios(id, nombre, apellido1, apellido2),
      oficinas(id, nombre),
      usuarios!polizas_creado_por_fkey(id_muestra)
    `)
    .single();
  if (e2) throw e2;

  return final;
}

// ── Cargar póliza completa por ID (para generar PDF) ──────────────────────
export async function fetchPolizaById(id) {
  const { data, error } = await supabase
    .from('polizas')
    .select(`
      *,
      clientes(id, nombre, apellido, rfc, curp, telefono, direccion, colonia, ciudad, estado, cp),
      vendedores(id, nombre, apellido, codigo),
      concesionarios(id, nombre, apellido1, apellido2),
      oficinas(id, nombre),
      usuarios!polizas_creado_por_fkey(id_muestra)
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// ── Cargar pólizas de la lista ─────────────────────────────────────────────
export async function fetchPolizas() {
  const { data, error } = await supabase
    .from('polizas')
    .select(`
      id, numero_poliza, constancia, estatus, prima_total, forma_pago,
      fecha_inicio, fecha_fin, cobertura, created_at,
      clientes(nombre, apellido),
      vendedores(nombre, apellido)
    `)
    .neq('estatus', 'COTIZACION')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// ── Mapear póliza DB → objeto PolizaPDF ───────────────────────────────────
export function buildPolizaPDF(poliza, oficina) {
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
    estatus:      poliza.estatus || 'VIGENTE',
    codigoQR:     poliza.constancia
      ? `${window.location.origin}/verificar/${poliza.constancia}`
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
        calle:    cliente.direccion || '',
        colonia:  cliente.colonia   || '',
        municipio:cliente.ciudad    || '',
        estado:   cliente.estado    || '',
        cp:       cliente.cp        || '',
      },
    },

    vehiculo: {
      marca:     poliza.marca          || '',
      modelo:    poliza.modelo         || '',
      version:   poliza.version        || poliza.modelo || '',
      anio:      poliza.anio?.toString()|| '',
      placas:    poliza.placas         || '',
      serie:     poliza.num_serie      || '',
      motor:     poliza.num_motor      || '',
      capacidad: poliza.capacidad      || '4 OCUPANTES',
      uso:       poliza.uso            || 'SERVICIO PUBLICO',
      tipo:      poliza.tipo_servicio  || 'TAXI',
      codAMIS:   poliza.cod_amis       || '',
      clase:     'Sedán',
    },

    vigencia: {
      inicio:     fmtFecha(poliza.fecha_inicio),
      inicioHora: poliza.hora_inicio || '00:00:00 hrs.',
      fin:        fmtFecha(poliza.fecha_fin),
      finHora:    poliza.hora_fin    || '23:59:59 hrs.',
    },

    prima: {
      neta:      poliza.prima_neta   || 0,
      descuento: poliza.descuento    || 0,
      premioNeto:poliza.prima_neta   || 0,
      recargo:   poliza.recargo      || 0,
      derechos:  poliza.derechos     || 400,
      iva:       poliza.iva          || 0,
      total:     poliza.prima_total  || 0,
      enLetras:  poliza.en_letras    || '',
      formaPago: poliza.forma_pago   || 'CONTADO',
    },

    coberturas: mockCoberturas,

    agencia: {
      id:       oficinaPDF?.id     ?? null,
      nombre:   oficinaPDF?.nombre ?? '',
      operador: creadorMuestra != null ? `${creadorMuestra}` : '',
      vendedor: vendedor.codigo || '',
    },

    condiciones: mockCondiciones,
  };
}
