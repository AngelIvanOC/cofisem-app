import { supabase } from "../supabaseClient";

export async function fetchCoberturasActivas() {
  const { data, error } = await supabase
    .from("coberturas")
    .select(`
      id, nombre, prima_neta, prima_total, duracion_meses,
      variante, id_par, prima_base, regla_pago,
      grupo_id, grupos_coberturas(nombre),
      cobertura_rubros(id, rubro, prima_neta, monto_maximo, es_sublimite, orden)
    `)
    .eq("activa", true)
    .order("nombre");
  if (error) throw error;
  return data ?? [];
}
