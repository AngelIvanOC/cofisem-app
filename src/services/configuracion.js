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

// Calcula IVA: (prima_neta + derechos) × iva_pct / 100
export function calcularIVA(primaNeta, derechos, ivaPct = 16) {
  return +((primaNeta + derechos) * (ivaPct / 100)).toFixed(2);
}

// Calcula prima total: prima_neta + derechos + iva
export function calcularTotal(primaNeta, derechos, ivaPct = 16) {
  return +(primaNeta + derechos + calcularIVA(primaNeta, derechos, ivaPct)).toFixed(2);
}
