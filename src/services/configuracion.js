import { supabase } from "../supabaseClient";

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
  const diaRef = fecha ?? new Date().toISOString().split("T")[0];
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
  const diaRef = fecha ?? new Date().toISOString().split("T")[0];
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
