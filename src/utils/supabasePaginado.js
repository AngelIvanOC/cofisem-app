// Supabase (PostgREST) corta cada respuesta en 1000 filas SIN avisar: la
// consulta "funciona" pero las filas de más simplemente no llegan. Con
// pagos_cofisem / pagos ya por encima de ese número, cualquier lista que
// no pagine pierde registros (así desapareció del corte la cuota 2 de la
// 01260100001430-01). Toda consulta que pueda pasar de 1000 filas debe
// usar esto.
//
// `construir` es una función que arma la consulta desde cero en cada
// página (los builders de supabase-js no se pueden reusar). Se añade
// `id` como último criterio de orden para que las páginas no se
// encimen ni se salten filas aunque el orden principal tenga empates.
const PAGINA = 1000;

export async function traerTodo(construir, { columnaOrden = "id" } = {}) {
  const todo = [];
  for (let desde = 0; ; desde += PAGINA) {
    let q = construir();
    if (columnaOrden) q = q.order(columnaOrden, { ascending: true });
    const { data, error } = await q.range(desde, desde + PAGINA - 1);
    if (error) throw error;
    todo.push(...(data ?? []));
    if (!data || data.length < PAGINA) break;
  }
  return todo;
}

// Misma idea, pero devuelve { data, error } como supabase-js — para
// cambiar consultas existentes sin tocar su manejo de errores.
export async function traerTodoConError(construir, opciones) {
  try {
    return { data: await traerTodo(construir, opciones), error: null };
  } catch (error) {
    return { data: null, error };
  }
}
