// ============================================================
// src/components/pdf/mockData.js
//
// Modelo de datos CANÓNICO para la Carátula de Póliza.
// Esta es la ÚNICA fuente de verdad — PolizaPDF.jsx importa
// desde aquí; no debe haber mocks inline en otros archivos.
//
// Secciones:
//   EMPRESA          — datos estáticos de la aseguradora (GAMAN)
//   mockContratante  — asegurado / tomador / conductor
//   mockVehiculo     — vehículo asegurado (identificación técnica)
//   mockVigencia     — periodo, suma asegurada base, condiciones
//   mockPrima        — desglose completo de prima y forma de pago
//   mockCoberturas   — coberturas con sub-coberturas y deducibles
//   mockAgente       — agente de ventas (persona física)
//   mockAgencia      — oficina de ventas (Cofisem)
//   mockCotizacion   — metadatos del proceso de cotización
//   mockCondiciones  — bloque de condiciones nombradas
//   mockPoliza       — objeto completo listo para <PolizaPDF />
// ============================================================


// ── Empresa aseguradora ──────────────────────────────────────
// Estático por contrato con GAMAN.
// Los campos planos (domicilio, ciudad, telefono) son strings
// formateados listos para imprimir — Header.jsx los usa directamente.
export const EMPRESA = {
  razonSocial:          'GAMAN, S.A. DE C.V.',
  rfc:                  'GGA1711102U0',
  domicilio:            'Av. EMILIANO ZAPATA 751, Local 2, Col. BELLAVISTA',
  ciudad:               'CUERNAVACA, MORELOS, 62130',
  telefono:             '56187-34523',
  email:                'contacto@gaman.mx',
  telefonoSiniestros:   '800 999 1509',
  telefonoEmergencias:  '800 999 1509',
  web:                  'www.gaman.mx',
  logoPath:             null,   // ruta local o URL — pendiente de integrar
}


// ── Contratante / Asegurado ──────────────────────────────────
// Fuente en Supabase: tabla `asegurados`.
// `conductorSexo` y `conductorEdad` aplican cuando el conductor
// habitual es distinto del contratante.
// `constancia` = número de constancia de situación fiscal SHCP.
// `usoTarifario` = clave interna de tarificación de la aseguradora.
export const mockContratante = {
  nombre:            'NORA ERIKA MENDOZA HERNANDEZ',
  rfc:               'MEHN850312AB3',
  curp:              'MEHN850312MMSRRL09',
  telefono:          '777 272 2032',
  email:             'nora.mendoza@email.com',
  conductorHabitual: 'NORA ERIKA MENDOZA HERNANDEZ',
  conductorSexo:     'F',         // M / F
  conductorEdad:     '40',        // años cumplidos
  constancia:        '01250000427-01',
  usoTarifario:      '15',        // clave tarifaria de la aseguradora
  direccion: {
    calle:     'PRIV CLAVEL 30',
    colonia:   'CONJ HAB ARCOS DE XIUTEPEC',
    municipio: 'JIUTEPEC',
    estado:    'MORELOS',
    cp:        '62553',
  },
}


// ── Vehículo asegurado ───────────────────────────────────────
// Fuente: formulario de cotización.
// `uso` = categoría amplia para columna USO  (SERVICIO PUBLICO / PARTICULAR / APP)
// `tipo` = sub-tipo para columna TIPO (TAXI / UBER / DIDI / INDRIVER)
// `clase` = carrocería del vehículo (Sedán / SUV / Pickup / …); no se
//           imprime en la carátula pero es necesario para tarifación.
// `codAMIS` = clave AMIS usada por la aseguradora para identificar el modelo.
// `unidadSalvamento` = si el vehículo ya fue declarado pérdida total antes.
// `cpUbicacion` = CP donde se resguarda el vehículo (puede diferir del
//                 domicilio del contratante; afecta tarificación).
export const mockVehiculo = {
  marca:            'NISSAN',
  clase:            'Sedán',          // Sedán | SUV | Hatchback | Pickup | Van
  modelo:           'VERSA DRIVE BA AC STD',
  version:          'DRIVE BA AC STD',
  anio:             '2020',
  placas:           'A923LTZ',
  serie:            '3N1CN7AD5LK414352',
  motor:            'HR16132444V',
  capacidad:        '4 OCUPANTES',
  uso:              'SERVICIO PUBLICO',   // columna USO en la carátula
  tipo:             'TAXI',              // columna TIPO en la carátula
  codAMIS:          'NI-VER-20',
  unidadSalvamento: false,
  cpUbicacion:      '62553',
}


// ── Vigencia y condiciones de contratación ───────────────────
// `tipoVigencia`       = ANUAL / POR MESES (define cómo se calcula la prima)
// `periodoGracia`      = días de gracia para pago de subsecuentes
// `moneda`             = PESOS / DOLARES
// `tipoSumaAsegurada`  = VALOR CONVENIDO / VALOR COMERCIAL / VALOR FACTURA
// `sumaAseguradaVehiculo` = valor base asegurado del vehículo (distinto de
//                            las sumas aseguradas por cobertura individual).
// `polizaAnterior`     = número de póliza a renovar (cuando renovacion=true).
export const mockVigencia = {
  inicio:                '18/07/2025',
  inicioHora:            '12:00:00 hrs.',
  fin:                   '18/07/2026',
  finHora:               '12:00:00 hrs.',
  tipoVigencia:          'ANUAL',           // ANUAL | POR MESES
  duracionMeses:         12,
  periodoGracia:         '14 DÍAS',
  moneda:                'PESOS',           // PESOS | DOLARES
  tipoSumaAsegurada:     'VALOR CONVENIDO', // VALOR CONVENIDO | VALOR COMERCIAL | VALOR FACTURA
  sumaAseguradaVehiculo: 449000,            // valor base del vehículo para tarifación
  renovacion:            false,
  polizaAnterior:        null,
}


// ── Prima — desglose completo ────────────────────────────────
// Flujo de cálculo:
//   neta
//   - descuento  (bonificación técnica + descuentos comerciales)
//   = premioNeto
//   + recargo    (recargo por forma de pago distinta a contado)
//   + derechos   (expedición de póliza)
//   = subtotal
//   + iva        (16 % del subtotal)
//   = total
//
// `bonificacionTecnica` = % de descuento técnico aplicado (0-35 %).
// `tasaFinanciamiento`  = monto de la tasa de financiamiento (negativo
//                          para contado porque hay descuento por pronto pago).
// `primerPago`          = monto del primer pago (= total si CONTADO).
// `pagoSubsecuente`     = monto de cada pago subsecuente (0 si CONTADO).
// `parciales`           = detalle de cada parcialidad cuando formaPago ≠ CONTADO.
export const mockPrima = {
  neta:                1619.00,
  descuento:             0.00,    // monto monetario de descuentos aplicados
  descuentoPct:          0,       // porcentaje de descuento comercial
  bonificacionTecnica:   0,       // porcentaje de bonificación técnica (0-35%)
  premioNeto:          1619.00,   // neta − descuento
  recargo:               0.00,
  tasaFinanciamiento:    0.00,    // negativo = ahorro por contado
  derechos:            400.00,
  subtotal:           2019.00,    // premioNeto + recargo + derechos
  iva:                 323.00,
  total:              2342.00,
  primerPago:         2342.00,    // igual a total cuando formaPago = CONTADO
  pagoSubsecuente:       0.00,    // 0 cuando formaPago = CONTADO
  enLetras: 'DOS MIL TRESCIENTOS CUARENTA Y DOS PESOS 00/100 M.N.',
  formaPago: 'CONTADO',          // CONTADO | SEMESTRAL | TRIMESTRAL | MENSUAL
  parciales: [
    // Se llena solo cuando formaPago !== 'CONTADO'
    // { numero: 1, monto: 1171.00, fechaLimite: '18/07/2025' },
    // { numero: 2, monto: 1171.00, fechaLimite: '18/01/2026' },
  ],
}


// ── Coberturas ───────────────────────────────────────────────
// `deduciblePct` = porcentaje de deducible (e.g., '3%', '5%', o '' si no aplica)
// `deducibleMax` = cantidad máxima en UMAs  (e.g., '0 UMAS', '250 UMAS')
// `tasa`         = tasa de la aseguradora (informativo — no siempre disponible)
// `subCoberturas`= sublímites dentro de una cobertura principal
export const mockCoberturas = [
  {
    id:            1,
    nombre:        'RESP. CIVIL A TERCEROS BIENES Y PERSONAS',
    sumaAsegurada: '$1,700,000.00',
    deduciblePct:  '',
    deducibleMax:  '0 UMAS',
    tasa:          '4/MAS',
    prima:          729.28,
    subCoberturas: [],
  },
  {
    id:            2,
    nombre:        'RESPONSABILIDAD CIVIL COMPLEMENT. PERSONAS',
    sumaAsegurada: '$3,000,000.00',
    deduciblePct:  '',
    deducibleMax:  '0 UMAS',
    tasa:          '4/MAS',
    prima:          133.90,
    subCoberturas: [],
  },
  {
    id:            3,
    nombre:        'GASTOS MÉDICOS CONDUCTOR Y FAMILIARES',
    sumaAsegurada: '$50,000.00',
    deduciblePct:  '',
    deducibleMax:  '',
    tasa:          '',
    prima:          197.10,
    subCoberturas: [],
  },
  {
    id:            4,
    nombre:        'MUERTE DE CONDUCTOR P/AA',
    sumaAsegurada: '$50,000.00',
    deduciblePct:  '',
    deducibleMax:  '',
    tasa:          '',
    prima:           88.92,
    subCoberturas: [],
  },
  {
    id:            5,
    nombre:        'GASTOS LEGALES',
    sumaAsegurada: 'AMPARADOS',
    deduciblePct:  '',
    deducibleMax:  '',
    tasa:          '',
    prima:          382.87,
    subCoberturas: [],
  },
  {
    id:            6,
    nombre:        'RESPONSABILIDAD CIVIL VIAJERO',
    sumaAsegurada: '5,000 UMAS P/PASAJERO',
    deduciblePct:  '',
    deducibleMax:  '',
    tasa:          '',
    prima:          373.12,
    subCoberturas: [
      { numero: 1, concepto: 'Muerte o 2. Incapacidad Total Y Permanente', monto: 'SubLímite 5,000 UMA' },
      { numero: 3, concepto: 'Gastos Médicos',                              monto: 'SubLímite 5,000 UMA' },
      { numero: 4, concepto: 'Gastos Funerarios',                           monto: 'SubLímite   300 UMA' },
      { numero: 5, concepto: 'Equipaje',                                    monto: 'SubLímite    80 UMA' },
    ],
  },
]


// ── Agente de ventas ─────────────────────────────────────────
// Corresponde a la persona física que cotizó/emitió la póliza.
// Fuente en Supabase: tabla `usuarios` con rol OPERADOR.
export const mockAgente = {
  nombre:   'LAURA ROSHER',
  codigo:   'LR-0126',
  telefono: '777 234 5678',
  email:    'laura.rosher@cofisem.mx',
}


// ── Agencia / Oficina de ventas ──────────────────────────────
// `codigo`   = código de agencia en el sistema de la aseguradora
// `operador` = código de operador (para la carátula)
// `vendedor` = código de vendedor (para la carátula)
// Los demás campos son de contacto para uso interno / correspondencia.
export const mockAgencia = {
  codigo:   '03',
  nombre:   'COFISEM CIVAC - PZA U.',
  id:       'civac',
  operador: '032',
  vendedor: '12',
  domicilio: {
    calle:     'Av. Emiliano Zapata 751, Local 3',
    colonia:   'BELLAVISTA',
    municipio: 'CUERNAVACA',
    estado:    'MORELOS',
    cp:        '62130',
  },
  telefonos: {
    oficina:  '777 315 0000',
    whatsapp: '777 315 0001',
  },
  email: 'ventas.civac@cofisem.mx',
}


// ── Cotización — metadatos del proceso ───────────────────────
// Datos generados durante el flujo de cotización antes de la emisión.
// `numeroCotizacion` = folio asignado por la aseguradora al cotizar.
// `tarifa`           = código de tarifa aplicado (e.g., "2604").
// `tipoPaquete`      = paquete seleccionado (AMPLIA / PLUS / BÁSICA / LIMITADA).
export const mockCotizacion = {
  numeroCotizacion: '1145712459',
  tarifa:           '2604',
  tipoPaquete:      'TAXI BÁSICA 2500',
}


// ── Condiciones nombradas ────────────────────────────────────
// El texto varía según el tipo de póliza / estado / condiciones especiales.
// `leyendaRecibo` aparece en la parte inferior de cada ejemplar.
export const mockCondiciones = {
  version:      '2025-A',
  tipoPlan:     'TAXI BÁSICA',
  texto:
    'LA EMPRESA PODRÁ INSPECCIONAR O VERIFICAR LA EXISTENCIA Y ESTADO FÍSICO DEL VEHÍCULO EN CUALQUIER MOMENTO EN DÍAS Y HORAS HÁBILES, '+
    'ESTE PROCEDIMIENTO SERÁ REALIZADO POR PERSONAL DEBIDAMENTE AUTORIZADO, ' +
    'SI EL CONTRATANTE IMPIDE U OBSTACULIZA ESTA INSPECCIÓN, LA EMPRESA SE RESERVA EL DERECHO DE RESCINDIR EL CONTRATO EN TÉRMINOS DE LAS CONDICIONES GENERALES APLICABLES.\n' +
    'LOS DEDUCIBLES, COASEGUROS Y FRANQUICIAS NO REGISTRADAS EN ESTA CARATULA, ESTARÁN INDICADAS EN LAS ESPECIFICACIONES ANEXAS.\n' +
    'ATENCIÓN DE CUALQUIER COBERTURA DESCRITA EN LA CARATULA DE LA PÓLIZA FUERA DEL ESTADO DE MORELOS, SE APLICARÁ UN DEDUCIBLE DE 250 UMAS.\n' +
    'ESTE CONTRATO QUEDA SUJETO A LAS CONDICIONES GENERALES, INCLUYENDO LAS EXCLUSIONES.\n',
  leyendaRecibo: 'EXIJA SU RECIBO OFICIAL DE PAGO AL MOMENTO DE LIQUIDAR SUS PRIMAS',
}


// ── Póliza completa (objeto ensamblado) ──────────────────────
// Este es el único objeto que recibe <PolizaPDF poliza={...} />.
// Al conectar Supabase, el hook usePolizaData deberá devolver
// un objeto con exactamente esta forma.
//
// `emision`     = fecha de emisión del documento
// `emisionHora` = hora exacta de emisión (para la carátula)
// `estatus`     = estado actual de la póliza
// `codigoQR`    = URL de verificación en línea (se convierte a imagen QR)
export const mockPoliza = {
  // ── Identificación ──────────────────────────────────────
  numeroPoliza:  '4-LN30000002740',
  tipoPlan:      'TAXI BÁSICA 2500',
  emision:       '18/07/2025',
  emisionHora:   '11:38:41 hrs.',
  estatus:       'VIGENTE',          // VIGENTE | POR VENCER | VENCIDA | CANCELADA
  codigoQR:      'https://verificar.gaman.mx/poliza/4-LN30000002740',

  // ── Secciones ───────────────────────────────────────────
  empresa:     EMPRESA,
  contratante: mockContratante,
  vehiculo:    mockVehiculo,
  vigencia:    mockVigencia,
  prima:       mockPrima,
  coberturas:  mockCoberturas,
  agente:      mockAgente,
  agencia:     mockAgencia,
  cotizacion:  mockCotizacion,
  condiciones: mockCondiciones,
}


