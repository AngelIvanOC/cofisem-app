import { supabase } from "../supabaseClient";

export async function fetchOperadores() {
  // 1. Obtener el id del rol "operador"
  const { data: rol, error: eRol } = await supabase
    .from("roles")
    .select("id")
    .ilike("nombre", "operador")
    .maybeSingle();

  if (eRol) throw eRol;
  if (!rol) return [];

  // 2. Traer usuarios activos con ese rol_id
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nombre, apellido, oficinas(nombre)")
    .eq("rol_id", rol.id)
    .eq("activo", true)
    .order("nombre");

  if (error) throw error;
  return data ?? [];
}
