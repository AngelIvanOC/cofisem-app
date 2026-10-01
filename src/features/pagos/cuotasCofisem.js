// Lógica compartida de cuotas COFISEM: cómo se arma la lista de cuotas
// de una póliza (reales de pagos_cofisem + la cuota propia "virtual") y
// cómo se interpreta cada una (cajón PENDIENTE/RECIBIDO/APLICADO, monto,
// fecha). La usan /pagos (PagosOperador) y el reporte de comisiones del
// administrador, para que ambos cuenten los cobros exactamente igual.

const n = (v) => parseFloat(v) || 0;

export const ESTATUS_META = {
  PENDIENTE: {
    label: "Pendiente",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  RECIBIDO: {
    label: "Recibido — por aplicar",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
  },
  APLICADO: {
    label: "Aplicado",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

// La cuota que se capturó directo en polizas_cofisem (prima_primer_pago +
// efectivo/cheque/tdc/pol_pend_pago) — cuota 1 de una póliza completa, o
// la cuota num_cuota_pago de un registro parcial ("No tengo la póliza")
// — nunca vive en pagos_cofisem. Aquí solo se representa de solo lectura
// para que "Pagos" sea el historial completo; no se duplica el dato ni
// se puede editar desde esta vista (se edita vía Completar).
export const VIRTUAL_META = {
  PENDIENTE: {
    label: "Pendiente",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  APLICADO: {
    label: "Cobrado al vender",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};
export function cuotaPropiaVirtual(p) {
  const cobrado = n(p.efectivo) + n(p.cheque) + n(p.tdc);
  const numCuota = p.registro_parcial ? (p.num_cuota_pago ?? 1) : 1;
  return {
    id: `virtual-${numCuota}-${p.id}`,
    poliza_cofisem_id: p.id,
    num_cuota: numCuota,
    prima_total: p.prima_primer_pago,
    prima_neta: p.prima_primer_pago_neta,
    fecha_vencimiento: p.fecha_emision,
    fecha_recibido: cobrado > 0 ? p.fecha_emision : null,
    estatus: cobrado > 0 ? "APLICADO" : "PENDIENTE",
    comprobante_url: p.comprobante_cheque_url || p.comprobante_tdc_url || null,
    pago_gaman_id: null,
    polizas_cofisem: p,
    _virtual: true,
  };
}

// Pagos de GAMAN: el estatus real vive en la tabla `pagos` de GAMAN — aquí
// solo se lee (nunca se copia ni se modifica). Se traduce a mi mismo cajón
// PENDIENTE/RECIBIDO/APLICADO solo para que los filtros de esta tabla
// funcionen igual con ambos tipos de fila, pero la ETIQUETA que se muestra
// usa las palabras propias de GAMAN para no mezclar dos vocabularios.
export const GAMAN_BUCKET = {
  PENDIENTE: "PENDIENTE",
  ADEUDO: "RECIBIDO",
  PAGADO: "APLICADO",
};
export const GAMAN_META = {
  PENDIENTE: {
    label: "Pendiente (GAMAN)",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  ADEUDO: {
    label: "Adeudo (GAMAN)",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
  },
  PAGADO: {
    label: "Pagado (GAMAN)",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

export function infoFila(c, p) {
  // ── Cuota 1 que quedó como "pól. pend. pago" al emitir (no se cobró ese
  //    día). Aplica IGUAL a GAMAN y a cualquier otra aseguradora. El cobro
  //    se registra aparte con "Registrar cobro" y entra al corte del día en
  //    que el cliente vino a pagar; el corte de emisión sigue mostrándola
  //    como pendiente. No se usa el estatus de GAMAN para nada de esto.
  const esCuota1 = (c.num_cuota ?? 1) === 1 && !p?.registro_parcial;
  if (esCuota1 && n(p?.pol_pend_pago) > 0) {
    const cobrado = n(c.efectivo) + n(c.cheque) + n(c.tdc);
    const yaCobrado =
      !c._virtual &&
      (cobrado > 0 || c.estatus === "RECIBIDO" || c.estatus === "APLICADO");
    if (yaCobrado) {
      return {
        esGaman: !!c.pago_gaman_id,
        // El folio/monto de esta cuota los capturó a mano un operador
        // (no vienen sincronizados de GAMAN), aunque quede ligada a un
        // pago_gaman_id — debe poder reabrirse para corregirla.
        _capturaLocal: true,
        bucket: c.estatus === "APLICADO" ? "APLICADO" : "RECIBIDO",
        meta: {
          label: "Cobrado",
          cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
        },
        primaTotal: cobrado || p.pol_pend_pago,
        primaNeta: c.prima_neta ?? null,
        fecha: c.fecha_recibido,
        vence: p.fecha_corte,
      };
    }
    return {
      esGaman: !!c.pago_gaman_id,
      _saldoPendiente: true,
      bucket: "PENDIENTE",
      meta: {
        label: "Pendiente de pago",
        cls: "bg-amber-50 text-amber-700 border-amber-200",
      },
      primaTotal: p.pol_pend_pago,
      primaNeta: null,
      fecha: null,
      vence: p.fecha_corte,
    };
  }

  if (c._virtual) {
    return {
      esGaman: false,
      bucket: c.estatus,
      meta: VIRTUAL_META[c.estatus] ?? VIRTUAL_META.PENDIENTE,
      primaTotal: c.prima_total,
      primaNeta: c.prima_neta,
      fecha: c.fecha_recibido,
      vence: c.fecha_vencimiento,
    };
  }
  if (c.pago_gaman_id) {
    // pagos_cofisem.estatus solo llega a RECIBIDO/APLICADO desde
    // RegistrarCobroModal: esta cuota (2+, "pago subsecuente") ya la
    // cobró a mano un operador COFISEM, con su propio folio/forma de
    // pago/fecha — no depende del estatus en vivo de GAMAN. Debe poder
    // reabrirse para corregirla, igual que la cuota 1 "pago tardío".
    if (c.estatus === "RECIBIDO" || c.estatus === "APLICADO") {
      return {
        esGaman: true,
        _capturaLocal: true,
        bucket: c.estatus,
        meta: ESTATUS_META[c.estatus],
        primaTotal: n(c.efectivo) + n(c.cheque) + n(c.tdc),
        primaNeta: c.prima_neta ?? null,
        fecha: c.fecha_recibido,
        vence: c.fecha_vencimiento,
      };
    }
    const g = c.pago_gaman ?? {};
    return {
      esGaman: true,
      bucket: GAMAN_BUCKET[g.estatus] ?? "PENDIENTE",
      meta: GAMAN_META[g.estatus] ?? GAMAN_META.PENDIENTE,
      primaTotal: g.monto,
      primaNeta: null,
      fecha: g.fecha_pago,
      vence: g.fecha_vencimiento,
    };
  }
  return {
    esGaman: false,
    bucket: c.estatus,
    meta: ESTATUS_META[c.estatus] ?? ESTATUS_META.PENDIENTE,
    primaTotal: c.prima_total,
    primaNeta: c.prima_neta,
    fecha: c.fecha_recibido,
    vence: c.fecha_vencimiento,
  };
}

// Todas las cuotas de una póliza — las reales de pagos_cofisem (incluida
// la cuota 1 enlazada de GAMAN cuando aplica) más, si falta, la cuota
// propia virtual (cuota 1 de una póliza completa, o num_cuota_pago de un
// registro parcial — ver arriba).
export function cuotasDePoliza(p) {
  const reales = (p.pagos_cofisem ?? []).map((c) => ({
    ...c,
    polizas_cofisem: p,
    _info: infoFila(c, p),
  }));
  if (p.poliza_id) return reales;
  const numCuotaPropia = p.registro_parcial ? (p.num_cuota_pago ?? 1) : 1;
  if (reales.some((c) => c.num_cuota === numCuotaPropia)) return reales;
  const virtual = cuotaPropiaVirtual(p);
  return [{ ...virtual, _info: infoFila(virtual, p) }, ...reales];
}
