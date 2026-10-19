// ============================================================
// src/features/cofisem/comisionesCalculo.js
// Cálculo de la comisión de CADA PAGO (cuota) de una póliza — fuente única
// para /comisiones (captura del vale), el reporte de comisiones y el panel
// de administración.
//
// Reglas (decisión del cliente 2026-10-11, tabla comision_reglas):
//   · Aseguradoras externas → % según el "Tipo de vehículo" de la póliza.
//   · GAMAN → % según el producto (nombre de la cobertura; el nombre se
//     conserva cuando administración cambia el precio).
//   · Monto = % × PRIMA NETA DE ESE PAGO (no de la póliza), a centavos.
//   · Cada cambio de % es una fila nueva con vigente_desde (siempre a futuro,
//     desde mañana). El % de una póliza es el vigente el DÍA EN QUE SE
//     REGISTRÓ EN EL SISTEMA (created_at): todos sus pagos lo conservan,
//     aunque el % cambie después; una renovación es póliza nueva y toma el
//     % vigente en ese momento.
//
// Un pago solo se puede capturar ("LISTA") cuando ya se cobró y tiene
// prima total y prima neta. Las pólizas creadas antes de
// configuracion_sistema.comisiones_auto_desde pueden seguir capturando el
// monto a mano si les falta algún dato (esquema anterior).
// ============================================================
import { supabase } from "../../supabaseClient";
import { hoyISO } from "../../utils/fecha";
import {
  construirPolizaRecibo,
  calcularImportesRecibo,
  mapCuota,
} from "../../utils/recibo";

const n = (v) => parseFloat(v) || 0;
const redondear = (v) => Math.round(v * 100) / 100;

// Catálogo único de "Tipo de vehículo" (formularios de /polizas y
// Completar). La comisión de las externas depende de este valor.
export const TIPOS_VEHICULO = [
  "AUTO",
  "TAXI",
  "AUTO APP",
  "MOTO APP",
  "COLECTIVO",
  "PICKUP",
  "CAMION",
  "EQUIPO PESADO",
  "MOTO",
  "CUATRIMOTO",
  "OTRO",
];

// Columnas que necesita el cálculo — para agregarlas al select de
// polizas_cofisem de cada pantalla.
export const SELECT_POLIZA_COMISION = `
  id, poliza_id, oficina_id, aseguradora, numero_poliza, asegurado_nombre,
  tipo, ramo, cobertura, created_at, fecha_emision, fecha_corte, forma_pago,
  prima_anual, prima_primer_pago, prima_primer_pago_neta,
  efectivo, cheque, tdc, pol_pend_pago, registro_parcial, num_cuota_pago,
  comprobante_cheque_url, comprobante_tdc_url,
  vendedor_id, vendedor_nombre,
  gaman:polizas!polizas_cofisem_poliza_id_fkey(
    id, forma_pago, fecha_inicio,
    coberturas(nombre, prima_neta, recargo, prima_total, regla_pago, prima_base),
    clientes(rfc)
  ),
  pagos_cofisem(*, pago_gaman:pagos(monto, estatus, fecha_pago, fecha_vencimiento))
`;

// Reglas, configuración de costos (para el desglose del recibo de GAMAN)
// y la fecha desde la que el monto es siempre automático.
export async function cargarContextoComisiones() {
  const [reglas, costos, auto] = await Promise.all([
    supabase
      .from("comision_reglas")
      .select("ambito, clave, porcentaje, vigente_desde")
      .order("vigente_desde", { ascending: false }),
    supabase
      .from("configuracion_costos")
      .select("clave, valor, vigente_desde")
      .order("vigente_desde", { ascending: false }),
    supabase
      .from("configuracion_sistema")
      .select("valor")
      .eq("clave", "comisiones_auto_desde")
      .maybeSingle(),
  ]);
  for (const r of [reglas, costos, auto]) if (r.error) throw r.error;
  return {
    reglas: reglas.data ?? [],
    filasConfig: costos.data ?? [],
    autoDesde: auto.data?.valor ?? "9999-12-31",
  };
}

// Mismo criterio que fetchConfigCostos(fecha) (services/configuracion.js),
// sobre filas ya cargadas: para cada clave, el valor más reciente vigente.
export function configParaFecha(filasConfig, fecha) {
  const dia = fecha ?? hoyISO();
  const config = {};
  for (const row of filasConfig) {
    if (row.vigente_desde > dia) continue;
    if (!(row.clave in config)) config[row.clave] = Number(row.valor);
  }
  return config;
}

// Cuota ligada a un pago de GAMAN: GAMAN solo guarda el monto del pago; la
// prima neta/total/IVA salen de la MISMA fórmula del recibo oficial
// (utils/recibo.js), igual que primaGaman.js y RegistrarCobroModal.
export function importesCuotaGaman(p, c, filasConfig) {
  if (!c.pago_gaman_id || !c.pago_gaman || !p.gaman) return null;
  const cfg = configParaFecha(filasConfig, p.gaman.fecha_inicio);
  const polizaObj = construirPolizaRecibo(p.gaman, cfg);
  const cuota = mapCuota(
    { ...c.pago_gaman, num_cuota: c.num_cuota },
    (c.num_cuota ?? 1) - 1,
  );
  return calcularImportesRecibo(polizaObj, cuota);
}

// % vigente para (ámbito, clave) en una fecha. undefined = no hay regla;
// null = la regla existe pero administración aún no le pone %.
export function reglaVigente(reglas, ambito, clave, fecha) {
  if (!clave) return undefined;
  const dia = fecha ?? hoyISO();
  // La más reciente que ya esté vigente — sin depender del orden de llegada.
  let r = null;
  for (const x of reglas) {
    if (x.ambito !== ambito || x.clave !== clave || x.vigente_desde > dia) continue;
    if (!r || x.vigente_desde > r.vigente_desde) r = x;
  }
  if (!r) return undefined;
  return r.porcentaje == null ? null : Number(r.porcentaje);
}

// Día (hora local) en que la póliza se registró en el sistema — fija su %.
export function fechaRegistro(p) {
  return p.created_at ? new Date(p.created_at).toLocaleDateString("en-CA") : hoyISO();
}

// De qué regla depende la póliza.
export function claveRegla(p) {
  if (p.poliza_id) {
    return { ambito: "GAMAN", clave: p.gaman?.coberturas?.nombre ?? null };
  }
  // GMM / Vida / Daños: el % depende del producto (la cobertura).
  if (p.ramo === "OTROS") return { ambito: "RAMO", clave: p.cobertura || null };
  return { ambito: "EXTERNA", clave: p.tipo || null };
}

// ¿La póliza es del esquema nuevo (monto siempre automático)?
export function esEsquemaAutomatico(p, autoDesde) {
  const creada = p.created_at
    ? new Date(p.created_at).toLocaleDateString("en-CA")
    : "";
  return !!creada && creada >= autoDesde;
}

// ¿Póliza de contado? (GAMAN: su forma de pago en GAMAN).
export function esContado(p) {
  return (p.poliza_id ? (p.gaman?.forma_pago ?? p.forma_pago) : p.forma_pago) === "CONTADO";
}

// Gastos de administración por pago: cobertura OBLIGATORIO siempre usa su
// propia regla; GAMAN distingue contado / pagos; las externas, la forma de
// pago tal cual (CONTADO, SEMESTRAL, TRIMESTRAL, CUATRIMESTRAL, MENSUAL,
// 4 PARCIALES).
export function claveGastos(p) {
  if (!p.poliza_id && /^OBLIGATORI/i.test((p.cobertura ?? "").trim())) return "OBLIGATORIO";
  if (p.poliza_id) {
    const forma = p.gaman?.forma_pago ?? p.forma_pago;
    return forma === "CONTADO" ? "GAMAN CONTADO" : "GAMAN PAGOS";
  }
  return p.forma_pago || null;
}

export const ESTADO_COMISION = {
  NO_COBRADA: "Falta registrar el cobro de este pago",
  FALTA_PRIMA: "Falta la prima total o la prima neta de este pago",
  FALTA_TIPO: "Falta el tipo de vehículo de la póliza",
  SIN_REGLA: "Sin regla de comisión para este producto (administración)",
  SIN_DEDUCCION: "Falta configurar el retenido, el impuesto o los gastos de esta forma de pago (administración)",
  NETO_CERO: "El neto sale en $0 o menos (los gastos superan la comisión) — lo revisa administración",
  LISTA: "Lista para capturar",
};

// Comisión de UNA cuota (de cuotasDePoliza). No toca la BD.
export function calcularComisionCuota(p, c, ctx) {
  const info = c._info ?? {};
  const cobrada =
    (info.bucket === "RECIBIDO" || info.bucket === "APLICADO") && !!info.fecha;
  const gaman = importesCuotaGaman(p, c, ctx.filasConfig);

  const primaTotal = gaman ? n(gaman.total) : n(info.primaTotal);
  const primaNeta = gaman
    ? n(gaman.primaNeta)
    : n(info.primaNeta) > 0
      ? n(info.primaNeta)
      : n(c.prima_neta);

  const { ambito, clave } = claveRegla(p);
  const fecha = fechaRegistro(p);
  const pct = reglaVigente(ctx.reglas, ambito, clave, fecha);
  const pctRetenido = reglaVigente(ctx.reglas, "DEDUCCION", "RETENIDO", fecha);
  const pctImpuesto = reglaVigente(ctx.reglas, "DEDUCCION", "IMPUESTO", fecha);
  const gastos = reglaVigente(ctx.reglas, "GASTOS", claveGastos(p), fecha);

  // Cadena exacta (sin redondear en medio):
  //   comisión − retenido − impuesto (sobre lo que queda) − gastos = neto.
  // Neto: CONTADO se redondea al peso; en pagos se deja a centavos.
  let bruto = null, retenido = null, impuesto = null, netoExacto = null, neto = null;
  if (pct != null && primaNeta > 0) {
    bruto = (primaNeta * pct) / 100;
    if (pctRetenido != null && pctImpuesto != null && gastos != null) {
      retenido = (bruto * pctRetenido) / 100;
      impuesto = ((bruto - retenido) * pctImpuesto) / 100;
      netoExacto = bruto - retenido - impuesto - gastos;
      neto = netoExacto > 0 ? (esContado(p) ? Math.round(netoExacto) : redondear(netoExacto)) : null;
    }
  }

  // Primer motivo que impide capturar, en el orden en que se resuelve.
  let estado = "LISTA";
  if (!cobrada) estado = "NO_COBRADA";
  else if (!(primaTotal > 0 && primaNeta > 0)) estado = "FALTA_PRIMA";
  // Un tipo fuera del catálogo (p. ej. "SP TAXI" de capturas viejas) cuenta
  // como faltante: hay que elegir uno de la lista.
  else if (ambito === "EXTERNA" && !TIPOS_VEHICULO.includes(clave)) estado = "FALTA_TIPO";
  else if (pct == null) estado = "SIN_REGLA";
  else if (netoExacto == null) estado = "SIN_DEDUCCION";
  else if (netoExacto <= 0) estado = "NETO_CERO";

  return {
    cobrada,
    fechaCobro: info.fecha ?? null,
    primaTotal: primaTotal || null,
    primaNeta: primaNeta || null,
    iva: gaman ? n(gaman.iva) : null,
    porcentaje: pct ?? null,
    // Desglose: comisión (lo que ve el admin en "Comisión $"), retenido,
    // impuesto, gastos y el NETO A PAGAR (monto del vale).
    comision: bruto != null ? redondear(bruto) : null,
    retenido: retenido != null ? redondear(retenido) : null,
    impuesto: impuesto != null ? redondear(impuesto) : null,
    gastos: gastos ?? null,
    pctRetenido: pctRetenido ?? null,
    pctImpuesto: pctImpuesto ?? null,
    monto: neto,
    estado,
    motivo: ESTADO_COMISION[estado],
    ambito,
    clave,
  };
}
