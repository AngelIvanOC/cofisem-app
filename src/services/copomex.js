// ============================================================
// src/services/copomex.js
//
// Búsqueda de C.P. mexicano — sin librerías externas, solo fetch().
//
// Lanza 3 APIs en PARALELO. La primera que devuelva datos válidos
// gana (Promise.any). Si todas fallan, devuelve null y el componente
// muestra el botón "Reintentar".
//
// APIs usadas (todas gratis, sin token, CORS abierto):
//   1. mexico-api.devaleff.com    — open source 2025, formato d_estado/D_mnpio/d_asenta
//   2. sepomex.nitrostudio.com.mx — formato d_estado/d_mnpio/d_asenta
//   3. api-sepomex.hckdrk.mx      — formato array con response.{municipio,estado,asentamiento}
//
// Cada API tiene su propio parser que normaliza el resultado al formato:
//   { estado, municipio, colonias[] }
// ============================================================

const TIMEOUT_MS = 5000;
const REINTENTOS = 1;
const BACKOFF_MS = 500;

function timeout(ms) {
  return AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined;
}

function esperar(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Normaliza nombres de estado para que coincidan con tu catálogo ESTADOS_MX
const NORM_ESTADO = {
  "México":                          "Estado de México",
  "Mexico":                          "Estado de México",
  "MEXICO":                          "Estado de México",
  "Michoacán de Ocampo":             "Michoacán",
  "Michoacan de Ocampo":             "Michoacán",
  "MICHOACAN DE OCAMPO":             "Michoacán",
  "Coahuila de Zaragoza":            "Coahuila",
  "COAHUILA DE ZARAGOZA":            "Coahuila",
  "Veracruz de Ignacio de la Llave": "Veracruz",
  "VERACRUZ DE IGNACIO DE LA LLAVE": "Veracruz",
  "Distrito Federal":                "Ciudad de México",
  "CDMX":                            "Ciudad de México",
  "CIUDAD DE MEXICO":                "Ciudad de México",
};

// Convierte "MORELOS" a "Morelos", deja "Ciudad de México" como está, etc.
function titleCase(s) {
  if (!s) return "";
  // Si ya tiene mayúscula y minúscula mezcladas, lo dejamos tal cual
  if (s !== s.toUpperCase() && s !== s.toLowerCase()) return s;
  return s
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((w) => {
      if (w.match(/^\s+$/) || w === "-") return w;
      // Conectores en minúscula
      if (["de", "del", "la", "las", "los", "y", "el"].includes(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join("");
}

const normEstado = (s) => {
  if (!s) return "";
  const trimmed = s.trim();
  if (NORM_ESTADO[trimmed]) return NORM_ESTADO[trimmed];
  // Si viene en MAYÚSCULAS, lo title-caseamos y reintentamos lookup
  const tc = titleCase(trimmed);
  return NORM_ESTADO[tc] ?? tc;
};

const normTexto = (s) => {
  if (!s) return "";
  const trimmed = s.trim();
  // Si viene en MAYÚSCULAS, convertir a Title Case
  return trimmed === trimmed.toUpperCase() ? titleCase(trimmed) : trimmed;
};

// Limpia, deduplica y ordena un array de strings
function limpiar(arr) {
  const set = new Set();
  for (const v of arr) {
    if (v && typeof v === "string") {
      const t = normTexto(v);
      if (t) set.add(t);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, "es"));
}

// Helper para reintentar fetch ante errores de red transitorios
async function fetchSafe(url, opts = {}) {
  let ultimoError;
  for (let i = 0; i <= REINTENTOS; i++) {
    try {
      const r = await fetch(url, opts);
      return r.ok ? r : null;
    } catch (err) {
      ultimoError = err;
      if (i < REINTENTOS) await esperar(BACKOFF_MS);
    }
  }
  throw ultimoError;
}

// ── API 1: mexico-api.devaleff.com ──────────────────────────────────────
// GET /api/codigo-postal/{cp}
// Respuesta: { data: [{ d_codigo, d_estado, d_ciudad, d_asenta, D_mnpio, d_tipo_asenta }] }
async function desdeDevaleff(cp) {
  const r = await fetchSafe(
    `https://mexico-api.devaleff.com/api/codigo-postal/${cp}`,
    { signal: timeout(TIMEOUT_MS) },
  );
  if (!r) return null;
  const json = await r.json();
  const list = json?.data;
  if (!Array.isArray(list) || list.length === 0) return null;

  const first = list[0];
  const estado    = normEstado(first.d_estado);
  const municipio = normTexto(first.D_mnpio || first.d_mnpio);
  const colonias  = limpiar(list.map((it) => it.d_asenta));

  if (!estado || !municipio) return null;
  return { estado, municipio, colonias };
}

// ── API 2: sepomex.nitrostudio.com.mx ───────────────────────────────────
// GET /api/{VERSION}/cp/{cp}.json
async function desdeNitrostudio(cp) {
  const r = await fetchSafe(
    `https://sepomex.nitrostudio.com.mx/api/20241009/cp/${cp}.json`,
    { signal: timeout(TIMEOUT_MS) },
  );
  if (!r) return null;
  const json = await r.json();
  const list = json?.data;
  if (!Array.isArray(list) || list.length === 0) return null;

  const first = list[0];
  const estado    = normEstado(first.d_estado);
  const municipio = normTexto(first.d_mnpio || first.D_mnpio);
  const colonias  = limpiar(list.map((it) => it.d_asenta));

  if (!estado || !municipio) return null;
  return { estado, municipio, colonias };
}

// ── API 3: api-sepomex.hckdrk.mx ────────────────────────────────────────
// GET /query/info_cp/{cp}?type=simplified
// Respuesta: [{ error, response: { cp, asentamiento, municipio, estado, ciudad } }, ...]
async function desdeHckdrk(cp) {
  const r = await fetchSafe(
    `https://api-sepomex.hckdrk.mx/query/info_cp/${cp}?type=simplified`,
    { signal: timeout(TIMEOUT_MS) },
  );
  if (!r) return null;
  const data = await r.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  const items = data
    .filter((it) => !it.error && it.response)
    .map((it) => it.response);
  if (items.length === 0) return null;

  const first = items[0];
  const estado    = normEstado(first.estado);
  const municipio = normTexto(first.municipio);
  const colonias  = limpiar(items.map((it) => it.asentamiento));

  if (!estado || !municipio) return null;
  return { estado, municipio, colonias };
}

// Caché en memoria por sesión
const _cache = {};

// Promise.any necesita que las que devuelven null se rechacen
const requerir = (p) =>
  p.then((v) => (v ? v : Promise.reject(new Error("vacío"))));

export async function buscarCP(cp) {
  if (!cp || cp.length !== 5 || !/^\d{5}$/.test(cp)) return null;
  if (_cache[cp]) return _cache[cp];

  // Lanza las 3 APIs en paralelo. La primera que devuelva datos válidos gana.
  try {
    const resultado = await Promise.any([
      requerir(desdeDevaleff(cp).catch(() => null)),
      requerir(desdeNitrostudio(cp).catch(() => null)),
      requerir(desdeHckdrk(cp).catch(() => null)),
    ]);
    _cache[cp] = resultado;
    return resultado;
  } catch {
    return null;
  }
}