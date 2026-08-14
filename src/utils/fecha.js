// `new Date().toISOString().split("T")[0]` da la fecha en UTC, no la fecha
// local — en México (UTC-6) eso hace que "hoy" cambie al día siguiente
// desde las 6pm hora local en vez de a medianoche. hoyISO() usa los
// componentes de fecha LOCALES del navegador, así que el corte del día
// corresponde de verdad a las 00:00–23:59 hora local.
export function hoyISO(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
