import { supabase } from "../supabaseClient";

async function nextCodigo() {
  const { data } = await supabase.from("vendedores").select("codigo");
  const nums = (data ?? [])
    .map(v => parseInt(v.codigo, 10))
    .filter(n => !isNaN(n) && n > 0);
  return nums.length === 0 ? "1" : String(Math.max(...nums) + 1);
}

export async function fetchVendedores(oficina) {
  let q = supabase
    .from("vendedores")
    .select("id, nombre, apellido, telefono, email, oficina, codigo, activo")
    .order("nombre");
  if (oficina) q = q.eq("oficina", oficina);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function crearVendedor(form, creadoPor) {
  const codigo = await nextCodigo();
  const { data, error } = await supabase
    .from("vendedores")
    .insert({
      nombre:     form.nombre.toUpperCase().trim(),
      apellido:   [form.apellido1, form.apellido2].filter(Boolean).map(s => s.toUpperCase().trim()).join(" ") || null,
      telefono:   form.telefono?.trim() || null,
      email:      form.email?.trim() || null,
      codigo,
      oficina:    form.oficina?.trim() || null,
      creado_por: creadoPor,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function actualizarVendedor(id, form) {
  const { error } = await supabase
    .from("vendedores")
    .update({
      nombre:   form.nombre.toUpperCase().trim(),
      apellido: [form.apellido1, form.apellido2].filter(Boolean).map(s => s.toUpperCase().trim()).join(" ") || null,
      telefono: form.telefono?.trim() || null,
      email:    form.email?.trim() || null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function toggleActivo(id, activo) {
  const { error } = await supabase
    .from("vendedores")
    .update({ activo })
    .eq("id", id);
  if (error) throw error;
}
