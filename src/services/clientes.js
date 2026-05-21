import { supabase } from "../supabaseClient";

export async function fetchClientes() {
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nombre, apellido, rfc, curp, telefono, email, direccion, colonia, ciudad, estado, cp, activo, polizas(id)")
    .order("nombre");
  if (error) throw error;
  return data.map(c => ({ ...c, polizasCount: c.polizas?.length ?? 0 }));
}

export async function crearCliente(form, creadoPor) {
  const { data, error } = await supabase
    .from("clientes")
    .insert({
      nombre:     form.nombre.toUpperCase().trim(),
      apellido:   [form.apellido1, form.apellido2].filter(Boolean).map(s => s.toUpperCase().trim()).join(" ") || null,
      rfc:        form.rfc.toUpperCase().trim(),
      curp:       form.curp?.toUpperCase().trim() || null,
      telefono:   form.telefono?.trim() || null,
      email:      form.email?.trim() || null,
      direccion:  [form.calle?.trim(), form.numero?.trim()].filter(Boolean).join(", ") || null,
      colonia:    form.colonia?.trim() || null,
      ciudad:     form.municipio?.trim() || null,
      estado:     form.estado || null,
      cp:         form.cp?.trim() || null,
      creado_por: creadoPor,
    })
    .select("id, nombre, apellido, rfc, telefono, email, activo")
    .single();
  if (error) throw error;
  return data;
}

export async function actualizarCliente(id, form) {
  const { data, error } = await supabase
    .from("clientes")
    .update({
      nombre:   form.nombre.toUpperCase().trim(),
      apellido: [form.apellido1, form.apellido2].filter(Boolean).map(s => s.toUpperCase().trim()).join(" ") || null,
      rfc:      form.rfc.toUpperCase().trim(),
      curp:     form.curp?.toUpperCase().trim() || null,
      telefono: form.telefono?.trim() || null,
      email:    form.email?.trim() || null,
      direccion:[form.calle?.trim(), form.numero?.trim()].filter(Boolean).join(", ") || null,
      colonia:  form.colonia?.trim() || null,
      ciudad:   form.municipio?.trim() || null,
      estado:   form.estado || null,
      cp:       form.cp?.trim() || null,
    })
    .eq("id", id)
    .select("id, nombre, apellido, rfc, telefono, email, activo")
    .single();
  if (error) throw error;
  return data;
}
