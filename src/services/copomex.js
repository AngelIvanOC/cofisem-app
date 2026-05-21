// Búsqueda de C.P. mexicano — sin librerías externas, solo fetch()
//
// Flujo (hedged requests):
//   1. Caché en memoria  → respuesta instantánea si el CP ya se buscó
//   2. hckdrk (principal) arranca inmediatamente, timeout 3.5 s
//   3. zippopotam (respaldo) arranca 1 s después si la principal no respondió
//   4. Promise.any: el primero que devuelva datos gana
//   5. null → el componente muestra botón "Reintentar"

const TIMEOUT_PRINCIPAL = 3500;
const TIMEOUT_RESPALDO  = 4000;
const HEDGING_DELAY     = 1000; // ms antes de lanzar el respaldo

function timeout(ms) {
  return AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined;
}

function str(v) {
  if (!v) return "";
  return typeof v === "string" ? v.trim() : (v.nombre ?? v.name ?? String(v)).trim();
}

function lista(v) {
  if (!Array.isArray(v)) return [];
  return v
    .map(a => (typeof a === "string" ? a : (a?.nombre ?? "")).trim())
    .filter(Boolean)
    .sort();
}

const NORM = {
  "México":                          "Estado de México",
  "Mexico":                          "Estado de México",
  "Michoacán de Ocampo":             "Michoacán",
  "Michoacan de Ocampo":             "Michoacán",
  "Coahuila de Zaragoza":            "Coahuila",
  "Veracruz de Ignacio de la Llave": "Veracruz",
  "Distrito Federal":                "Ciudad de México",
  "CDMX":                            "Ciudad de México",
};

const norm = s => NORM[s] ?? s;

const _cache = {};

async function desdehckdrk(cp) {
  const r = await fetch(
    `https://api-sepomex.hckdrk.mx/query/info_cp/${cp}?type=simplified`,
    { signal: timeout(TIMEOUT_PRINCIPAL) },
  );
  if (!r.ok) return null;
  const d = await r.json();
  if (d.error) return null;
  const estado    = norm(str(d.estado)    || str(d.ESTADO));
  const municipio = str(d.municipio) || str(d.Municipio);
  const colonias  = lista(d.asentamientos ?? d.Asentamientos ?? []);
  return estado ? { estado, municipio, colonias } : null;
}

async function desdeZippopotam(cp) {
  const r = await fetch(
    `https://api.zippopotam.us/mx/${cp}`,
    { signal: timeout(TIMEOUT_RESPALDO) },
  );
  if (!r.ok) return null;
  const d = await r.json();
  const p = (d.places ?? [])[0];
  if (!p) return null;
  const estado = norm(p.state ?? "");
  return estado ? { estado, municipio: p["place name"] ?? "", colonias: [] } : null;
}

// Convierte null/undefined en rejection para que Promise.any espere al otro canal
const wrap = p => p.then(v => v ?? Promise.reject());

export async function buscarCP(cp) {
  if (!cp || cp.length !== 5 || !/^\d{5}$/.test(cp)) return null;
  if (_cache[cp]) return _cache[cp];

  // Principal arranca ya; respaldo arranca tras HEDGING_DELAY ms.
  // Si la principal responde rápido (caso normal), el respaldo nunca compite.
  // Si la principal es lenta o falla, el respaldo entra a los 1 s sin esperar el timeout completo.
  const principal = desdehckdrk(cp).catch(() => null);
  const respaldo  = new Promise(res =>
    setTimeout(
      () => desdeZippopotam(cp).then(res).catch(() => res(null)),
      HEDGING_DELAY,
    )
  );

  let r;
  try {
    r = await Promise.any([wrap(principal), wrap(respaldo)]);
  } catch {
    r = null;
  }

  if (r) { _cache[cp] = r; return r; }
  return null;
}
