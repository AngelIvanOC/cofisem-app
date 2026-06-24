// ============================================================
// src/services/copomex.js
//
// Búsqueda de C.P. mexicano — sin librerías externas, solo fetch().
//
// Estrategia en 3 etapas:
//   1. Supabase propio (tabla direcciones) — siempre confiable.
//   2. 3 APIs SEPOMEX externas en paralelo — para CPs no cargados aún.
//   3. Zippopotam como último recurso — solo estado + municipio.
//
// Para cargar el catálogo SEPOMEX completo en Supabase, ver:
//   src/supabase/README.md → sección "Catálogo de Códigos Postales"
// ============================================================
import { supabase } from "../supabaseClient";

const TIMEOUT_MS = 6000;
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
  if (s !== s.toUpperCase() && s !== s.toLowerCase()) return s;
  return s
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((w) => {
      if (w.match(/^\s+$/) || w === "-") return w;
      if (["de", "del", "la", "las", "los", "y", "el"].includes(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join("");
}

const normEstado = (s) => {
  if (!s) return "";
  const trimmed = s.trim();
  if (NORM_ESTADO[trimmed]) return NORM_ESTADO[trimmed];
  const tc = titleCase(trimmed);
  return NORM_ESTADO[tc] ?? tc;
};

const normTexto = (s) => {
  if (!s) return "";
  const trimmed = s.trim();
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

// ── Fuente 1 (principal): Supabase — tabla direcciones ─────────────
// Estructura: cp CHAR(5), colonia TEXT, municipio TEXT, estado TEXT
// Si la tabla no existe o está vacía, retorna null y se cae a las APIs.
async function desdeSupabase(cp) {
  try {
    const { data, error } = await supabase
      .from("direcciones")
      .select("colonia, municipio, estado")
      .eq("cp", cp);

    if (error || !data || data.length === 0) return null;

    const estado    = normEstado(data[0].estado);
    const municipio = normTexto(data[0].municipio);
    const colonias  = limpiar(data.map((it) => it.colonia));

    if (!estado || !municipio) return null;
    return { estado, municipio, colonias };
  } catch {
    return null;
  }
}

// ── Fuente 2: mexico-api.devaleff.com ───────────────────────────────────
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

// ── Fuente 3: sepomex.nitrostudio.com.mx ────────────────────────────────
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

// ── Fuente 4: api-sepomex.hckdrk.mx ────────────────────────────────────
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

// ── Fuente 5 (último recurso): api.zippopotam.us ────────────────────────
// No provee colonias — solo estado + municipio.
async function desdeZippopotam(cp) {
  const r = await fetchSafe(
    `https://api.zippopotam.us/mx/${cp}`,
    { signal: timeout(TIMEOUT_MS) },
  );
  if (!r) return null;
  const json = await r.json();
  if (!json?.places || json.places.length === 0) return null;

  const estado    = normEstado(json.places[0].state);
  const municipio = normTexto(json.places[0]["place name"]);

  if (!estado) return null;
  return { estado, municipio, colonias: [] };
}

// Caché en memoria por sesión
const _cache = {};

// Promise.any necesita que las que devuelven null se rechacen
const requerir = (p) =>
  p.then((v) => (v ? v : Promise.reject(new Error("vacío"))));

export async function buscarCP(cp) {
  if (!cp || cp.length !== 5 || !/^\d{5}$/.test(cp)) return null;
  if (_cache[cp]) return _cache[cp];

  // Etapa 1: Supabase propio — siempre tiene prioridad
  const deSupabase = await desdeSupabase(cp);
  if (deSupabase) {
    _cache[cp] = deSupabase;
    return deSupabase;
  }

  // Etapa 2: 3 APIs SEPOMEX externas en paralelo
  try {
    const resultado = await Promise.any([
      requerir(desdeDevaleff(cp).catch(() => null)),
      requerir(desdeNitrostudio(cp).catch(() => null)),
      requerir(desdeHckdrk(cp).catch(() => null)),
    ]);
    _cache[cp] = resultado;
    return resultado;
  } catch {
    // Etapa 3: Zippopotam — al menos rellena estado + municipio
    try {
      const res = await desdeZippopotam(cp);
      if (res) {
        _cache[cp] = res;
        return res;
      }
    } catch { /* silencio */ }
    return null;
  }
}
