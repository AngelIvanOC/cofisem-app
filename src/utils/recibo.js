import { supabase } from "../supabaseClient";

export function isoAMX(str) {
  if (!str) return "";
  const [y, m, d] = str.split("-");
  return `${d}/${m}/${y}`;
}

export function isoAMXCorto(str) {
  if (!str) return "";
  const [y, m, d] = str.split("-");
  return `${d}/${m}/${y.slice(-2)}`;
}

export function nCuotasDeFormaPago(formaPago) {
  if (formaPago === "CONTADO") return 1;
  const m = (formaPago ?? "").match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 1;
}

// Convierte una fila cruda de la tabla "pagos" a la forma de cuota usada
// por calcularImportesRecibo/abrirRecibo.
export function mapCuota(c, idx) {
  const vtoISO = c.fecha_vencimiento ?? "";
  const vigencia = vtoISO
    ? (() => {
        const d = new Date(vtoISO + "T12:00:00");
        d.setDate(d.getDate() + 7);
        return isoAMX(d.toISOString().split("T")[0]);
      })()
    : null;
  return {
    id: c.id,
    num: c.num_cuota ?? (idx + 1),
    vto: isoAMX(vtoISO),
    vigencia: vigencia,
    monto: Number(c.monto),
    estatus: c.estatus ?? "PENDIENTE",
    pagado: c.estatus === "PAGADO",
    fechaPago: c.fecha_pago ? isoAMX(c.fecha_pago) : null,
    forma: c.forma_pago ?? null,
    referencia: c.referencia ?? null,
    descargado: c.descargado ?? false,
  };
}

export function calcularImportesRecibo(poliza, cuota) {
  if (poliza.formaPago === "CONTADO") {
    return {
      primaNeta:        poliza.primaNeta,
      gastosExpedicion: poliza.derechos,
      iva:              poliza.iva,
      total:            poliza.primaTotal,
      importe:          cuota.monto,
    };
  }

  const n   = nCuotasDeFormaPago(poliza.formaPago);
  const iva = poliza.ivaPct ?? 16;

  // COSTOS_DIVIDIDOS: prima neta, derechos e IVA se dividen entre N cuotas
  if (poliza.reglaPago === "COSTOS_DIVIDIDOS") {
    const pnParcial  = +(poliza.primaNeta / n).toFixed(2);
    const derParcial = +(poliza.derechos  / n).toFixed(2);
    const ivaParcial = +((pnParcial + derParcial) * (iva / 100)).toFixed(2);
    const total      = +(pnParcial + derParcial + ivaParcial).toFixed(2);
    return { primaNeta: pnParcial, gastosExpedicion: derParcial, iva: ivaParcial, total, importe: total };
  }

  // PROGRESIVO: cuota.monto es el pago total (PT); se desglosa hacia atrás
  if (poliza.reglaPago === "PROGRESIVO" && poliza.primaBase) {
    const pt       = cuota.monto;
    const subtot   = +(pt / (1 + iva / 100)).toFixed(2);
    const emision  = +(poliza.derechos / n).toFixed(2);
    const pn       = +(subtot - emision).toFixed(2);
    const ivaCalc  = +(subtot * (iva / 100)).toFixed(2);
    return { primaNeta: pn, gastosExpedicion: emision, iva: ivaCalc, total: pt, importe: pt };
  }

  // ESTANDAR: cuota 1 lleva todos los gastos de expedición e IVA
  if (cuota.num === 1) {
    const total = cuota.monto + poliza.derechos + poliza.iva;
    return { primaNeta: cuota.monto, gastosExpedicion: poliza.derechos, iva: poliza.iva, total, importe: total };
  }
  return { primaNeta: cuota.monto, gastosExpedicion: 0, iva: 0, total: cuota.monto, importe: cuota.monto };
}

// Construye el objeto "datos" del recibo, lo guarda en localStorage y abre
// la vista previa en una pestaña nueva. Por defecto marca la cuota como
// descargada (entregada al cliente), registrando cuándo y quién — pasa
// marcarDescargado: false cuando quien abre el recibo no es quien lo
// entrega (p. ej. un admin auditando), y usuarioId con el id del usuario
// que sí lo entrega para dejarlo registrado en descargado_por.
export function abrirRecibo(poliza, cuota, operador, { marcarDescargado = true, usuarioId = null } = {}) {
  const hoy = new Date().toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const importes = calcularImportesRecibo(poliza, cuota);
  const cl = poliza.clienteData ?? {};
  const ultimaCuota = poliza.cuotas
    ? [...poliza.cuotas].sort((a, b) => b.num - a.num)[0]
    : null;
  const vencPGracia =
    ultimaCuota?.vigencia ?? ultimaCuota?.vto ?? isoAMX(poliza.fechaFin);
  const saldo = (poliza.cuotas ?? [])
    .filter((c) => c.num > cuota.num)
    .reduce((s, c) => s + c.monto, 0);
  const siguienteCuota = (poliza.cuotas ?? []).find((c) => c.num === cuota.num + 1);
  const vigenciaSiguiente = siguienteCuota?.vigencia ?? siguienteCuota?.vto ?? "";

  const cuotasOrdenadas = [...(poliza.cuotas ?? [])].sort((a, b) => a.num - b.num);
  const idxActual = cuotasOrdenadas.findIndex((c) => c.num === cuota.num);
  const esUltimaCuota = idxActual === cuotasOrdenadas.length - 1;
  const periodoDesde =
    idxActual === 0
      ? isoAMX(poliza.fechaInicio)
      : (cuotasOrdenadas[idxActual - 1].vigencia ?? cuotasOrdenadas[idxActual - 1].vto ?? "");
  const periodoHasta = esUltimaCuota
    ? isoAMX(poliza.fechaFin)
    : (cuota.vigencia ?? cuota.vto ?? "");

  const datos = {
    constancia: poliza.id,
    oficina: poliza.oficina,
    noRecibo: cuota.id,
    asegurado: poliza.asegurado,
    calle: cl.calle ?? cl.direccion ?? "",
    numExt: cl.numero_ext ?? "",
    numInt: cl.numero_int ?? "",
    colonia: cl.colonia ?? "",
    municipio: cl.ciudad ?? "",
    estado: cl.estado ?? "",
    cp: cl.cp ?? "",
    rfc: cl.rfc ?? "",
    curp: cl.curp ?? "",
    ...importes,
    vencimiento: vencPGracia,
    primaTotal: poliza.primaTotal,
    saldo,
    vtoActual: cuota.vigencia ?? cuota.vto,
    vigenciaSiguiente,
    periodoDesde,
    periodoHasta,
    pagoDe: cuota.num,
    pagoTotal: poliza.formaPago === "CONTADO" ? 1 : 4,
    formaPago: poliza.formaPago,
    fechaRecibo: hoy,
    vigenciaDesde: poliza.fechaInicio
      ? `${isoAMX(poliza.fechaInicio)} ${poliza.horaInicio}`
      : "",
    vigenciaHasta: poliza.fechaFin
      ? `${isoAMXCorto(poliza.fechaFin)} ${poliza.horaFin}`
      : "",
    conducto: poliza.conducto,
    operador: operador ?? "",
  };
  if (marcarDescargado) {
    supabase
      .from("pagos")
      .update({
        descargado: true,
        descargado_en: new Date().toISOString(),
        descargado_por: usuarioId,
      })
      .eq("id", cuota.id)
      .then();
  }
  localStorage.setItem("recibo_data", JSON.stringify(datos));
  window.open("/gaman/recibo-preview", "_blank");
}

// Dada una fila de "polizas" (con joins clientes/oficinas/vendedores/coberturas)
// y el config vigente para su fecha_inicio, construye el objeto "poliza" que
// espera calcularImportesRecibo/abrirRecibo. Misma forma que usa Pagos.jsx (operador).
export function construirPolizaRecibo(pol, cfg) {
  const derechos = cfg.derechos_emision ?? 400;
  const ivaPct = cfg.iva_pct ?? 16;
  const nombreCliente = [pol.clientes?.nombre, pol.clientes?.apellido]
    .filter(Boolean)
    .join(" ");
  const primaNeta = Number(pol.coberturas?.prima_neta ?? 0);
  const iva = +((primaNeta + derechos) * (ivaPct / 100)).toFixed(2);
  return {
    id: pol.constancia ?? pol.numero_poliza ?? String(pol.id),
    polizaId: pol.id,
    asegurado: nombreCliente,
    oficina: pol.oficinas?.nombre ?? "",
    reglaPago: pol.coberturas?.regla_pago ?? "ESTANDAR",
    primaBase: pol.coberturas?.prima_base ?? null,
    formaPago: pol.forma_pago,
    primaTotal: Number(pol.coberturas?.prima_total ?? 0),
    primaNeta,
    iva,
    ivaPct,
    derechos,
    fechaInicio: pol.fecha_inicio ?? "",
    fechaFin: pol.fecha_fin ?? "",
    horaInicio: pol.hora_inicio ?? "12:00:00 hrs.",
    horaFin: pol.hora_fin ?? "12:00:00 hrs.",
    conducto: pol.vendedores?.codigo || "-",
    clienteData: pol.clientes ?? {},
    estatusPoliza: pol.estatus ?? "VIGENTE",
    cuotas: null,
  };
}
