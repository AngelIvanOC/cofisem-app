import { supabase } from "../supabaseClient";

function buildLabel(c) {
  return [c.nombre, c.apellido1, c.apellido2].filter(Boolean).join(" ").toUpperCase();
}

export async function fetchConcesionariosByCliente(clienteId) {
  const { data, error } = await supabase
    .from("concesionarios")
    .select("id, nombre, apellido1, apellido2")
    .eq("cliente_id", clienteId)
    .order("nombre");
  if (error) throw error;
  return data.map((c) => ({ id: c.id, label: buildLabel(c) }));
}

export async function actualizarNombreConcesionario(id, nombre, apellido1, apellido2) {
  const { error } = await supabase
    .from("concesionarios")
    .update({
      nombre:    nombre.toUpperCase().trim(),
      apellido1: apellido1?.toUpperCase().trim() || null,
      apellido2: apellido2?.toUpperCase().trim() || null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function crearConcesionario({ clienteId, nombre, apellido1, apellido2, creadoPor }) {
  const { data, error } = await supabase
    .from("concesionarios")
    .insert({
      cliente_id: clienteId,
      nombre:     nombre.toUpperCase().trim(),
      apellido1:  apellido1?.toUpperCase().trim() || null,
      apellido2:  apellido2?.toUpperCase().trim() || null,
      creado_por: creadoPor || null,
    })
    .select("id, nombre, apellido1, apellido2")
    .single();
  if (error) throw error;
  return { id: data.id, label: buildLabel(data) };
}
