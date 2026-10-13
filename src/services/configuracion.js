import { supabase } from "../supabaseClient";
import { hoyISO } from "../utils/fecha";

// Carga TODAS las versiones históricas de configuracion_costos
// Útil cuando necesitas calcular el config de múltiples fechas sin N+1 queries
export async function fetchTodasVersionesConfig() {
  const { data } = await supabase
    .from("configuracion_costos")
    .select("clave, valor, vigente_desde")
    .order("vigente_desde", { ascending: false });
  return data ?? [];
}

// Dado un array de versiones ya cargadas, devuelve el config vigente para una fecha
// fecha: string 'YYYY-MM-DD' — si es null usa hoy
export function configParaFecha(todasVersiones, fecha = null) {
  const diaRef = fecha ?? hoyISO();
  const config = {};
  for (const row of todasVersiones) {
    // Ya vienen ordenadas DESC por vigente_desde, tomamos la primera que aplique
    if (row.vigente_desde <= diaRef && !(row.clave in config)) {
      config[row.clave] = Number(row.valor);
    }
  }
  return config;
}

// Carga el config para UNA fecha específica (query directo)
// Sin fecha → valores vigentes HOY (nuevas pólizas, UI general)
// Con fecha → valores que estaban vigentes ESE día (pólizas históricas)
export async function fetchConfigCostos(fecha = null) {
  const diaRef = fecha ?? hoyISO();
  const { data } = await supabase
    .from("configuracion_costos")
    .select("clave, valor")
    .lte("vigente_desde", diaRef)
    .order("vigente_desde", { ascending: false });
  const config = {};
  for (const row of data ?? []) {
    if (!(row.clave in config)) {
      config[row.clave] = Number(row.valor);
    }
  }
  return config;
}

// ── Configuración del sistema ─────────────────────────────────────────────

async function fetchFlag(clave) {
  const { data } = await supabase
    .from("configuracion_sistema")
    .select("valor")
    .eq("clave", clave)
    .maybeSingle();
  return data?.valor === "1";
}

async function setFlag(clave, activar, usuarioId = null) {
  const { error } = await supabase
    .from("configuracion_sistema")
    .upsert({
      clave,
      valor:      activar ? "1" : "0",
      updated_at: new Date().toISOString(),
      updated_by: usuarioId ?? null,
    }, { onConflict: "clave" });
  if (error) throw error;
}

export const fetchPermitirFechasPasadas = () => fetchFlag("permitir_fechas_pasadas");
export const setPermitirFechasPasadas   = (v, uid) => setFlag("permitir_fechas_pasadas", v, uid);

export const fetchPermitirNumeroManual  = () => fetchFlag("permitir_numero_manual");
export const setPermitirNumeroManual    = (v, uid) => setFlag("permitir_numero_manual", v, uid);

// Calcula IVA: (prima_neta + derechos) × iva_pct / 100
export function calcularIVA(primaNeta, derechos, ivaPct = 16) {
  return +((primaNeta + derechos) * (ivaPct / 100)).toFixed(2);
}

// Calcula prima total: prima_neta + derechos + iva
export function calcularTotal(primaNeta, derechos, ivaPct = 16) {
  return +(primaNeta + derechos + calcularIVA(primaNeta, derechos, ivaPct)).toFixed(2);
}

// Desglose anual de la prima de una cobertura (barra del PDF, detalle de
// póliza, verificación). `coberturas.recargo` es el recargo por pago
// fraccionado (hoy solo "TAXI BÁSICA PAGOS 2500": 150): NO es prima neta,
// así que la comisión — % sobre la prima neta — no lo incluye.
//   PN + recargo + derechos = subtotal;  IVA = subtotal × iva_pct
export function desglosePrimaCobertura(cobertura, derechos, ivaPct = 16) {
  const primaNeta = Number(cobertura?.prima_neta ?? 0);
  const recargo   = Number(cobertura?.recargo ?? 0);
  const subtotal  = +(primaNeta + recargo + derechos).toFixed(2);
  const iva       = +(subtotal * (ivaPct / 100)).toFixed(2);
  const total     = +(subtotal + iva).toFixed(2);
  return { primaNeta, recargo, derechos, subtotal, iva, total };
}
