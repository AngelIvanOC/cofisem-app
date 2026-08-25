// ============================================================
// src/services/primaGaman.js
// Para pólizas COFISEM que vienen de una póliza real de GAMAN
// (polizas_cofisem.poliza_id IS NOT NULL): las primas (anual, neta,
// 1er pago total/neta) ya NO se capturan a mano — se leen en vivo de
// GAMAN, con el mismo cálculo que usa el recibo PDF oficial
// (ver utils/recibo.js), para que nunca se desincronicen.
// ============================================================
import { supabase } from "../supabaseClient";
import { fetchConfigCostos } from "./configuracion";
import { construirPolizaRecibo, calcularImportesRecibo, mapCuota } from "../utils/recibo";

// Devuelve { primaAnual, primaNetaAnual, primaPrimerPago, primaPrimerPagoNeta,
//            cuota1Pagada } para la póliza real de GAMAN con id = polizaId.
// cuota1Pagada = false cuando GAMAN todavía no tiene registrado el cobro del
// primer pago (pagos.estatus === 'PENDIENTE' o no existe la cuota 1) — en ese
// caso el primer pago tampoco se puede dar por recibido aquí en COFISEM.
export async function obtenerPrimaGaman(polizaId) {
  const { data: pol, error } = await supabase
    .from("polizas")
    .select(`
      id, forma_pago, fecha_inicio,
      coberturas(nombre, prima_neta, prima_total, regla_pago, prima_base)
    `)
    .eq("id", polizaId)
    .single();
  if (error) throw error;

  const cfg = await fetchConfigCostos(pol.fecha_inicio);
  const polizaObj = construirPolizaRecibo(pol, cfg);

  const { data: pagoUno } = await supabase
    .from("pagos")
    .select("id, num_cuota, monto, estatus, fecha_pago, fecha_vencimiento")
    .eq("poliza_id", polizaId)
    .eq("num_cuota", 1)
    .maybeSingle();

  if (!pagoUno) {
    return {
      primaAnual: polizaObj.primaTotal,
      primaNetaAnual: polizaObj.primaNeta,
      primaPrimerPago: 0,
      primaPrimerPagoNeta: 0,
      cuota1Pagada: false,
    };
  }

  const cuota = mapCuota(pagoUno, 0);
  const importes = calcularImportesRecibo(polizaObj, cuota);

  return {
    primaAnual: polizaObj.primaTotal,
    primaNetaAnual: polizaObj.primaNeta,
    primaPrimerPago: importes.total,
    primaPrimerPagoNeta: importes.primaNeta,
    cuota1Pagada: cuota.estatus !== "PENDIENTE",
  };
}

// Igual que obtenerPrimaGaman, pero para CUALQUIER cuota (2, 3, 4...) de una
// póliza real de GAMAN — se usa al registrar el cobro de una cuota
// subsecuente (RegistrarCobroModal) para que "Prima Neta de la cuota" salga
// calculada con la misma fórmula del recibo oficial, en vez de quedar en
// blanco esperando que el operador la saque a mano del recibo físico.
export async function obtenerImportesCuotaGaman(polizaId, numCuota) {
  const { data: pol, error } = await supabase
    .from("polizas")
    .select(`
      id, forma_pago, fecha_inicio,
      coberturas(nombre, prima_neta, prima_total, regla_pago, prima_base)
    `)
    .eq("id", polizaId)
    .single();
  if (error) throw error;

  const cfg = await fetchConfigCostos(pol.fecha_inicio);
  const polizaObj = construirPolizaRecibo(pol, cfg);

  const { data: pago, error: errPago } = await supabase
    .from("pagos")
    .select("id, num_cuota, monto, estatus, fecha_pago, fecha_vencimiento")
    .eq("poliza_id", polizaId)
    .eq("num_cuota", numCuota)
    .maybeSingle();
  if (errPago) throw errPago;
  if (!pago) return null;

  const cuota = mapCuota(pago, numCuota - 1);
  const importes = calcularImportesRecibo(polizaObj, cuota);
  return { primaTotal: importes.total, primaNeta: importes.primaNeta };
}
