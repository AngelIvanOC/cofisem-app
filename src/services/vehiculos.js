// Catálogo de vehículos.
// Modelos: NHTSA vPIC API (gratis, sin auth) + suplemento MX para modelos
// que NHTSA no cubre (mercado latinoamericano) o marcas sin presencia en EE.UU.

// ── Marcas permitidas ────────────────────────────────────────────────────────
// Solo estas aparecen en el selector. El nombre debe coincidir con NHTSA_MAKE.
const MARCAS = [
  "Chevrolet", "Dodge", "Ford", "Honda", "Hyundai", "JAC", "Kia",
  "Mazda", "Mitsubishi", "Nissan", "Peugeot", "Renault", "Seat",
  "Suzuki", "Toyota", "Volkswagen", "BAIC",
];

// Nombre que usa NHTSA para cada marca (null = sin cobertura, usar solo suplemento)
const NHTSA_MAKE = {
  Chevrolet:  "chevrolet",
  Dodge:      "dodge",
  Ford:       "ford",
  Honda:      "honda",
  Hyundai:    "hyundai",
  JAC:        null,
  Kia:        "kia",
  Mazda:      "mazda",
  Mitsubishi: "mitsubishi",
  Nissan:     "nissan",
  Peugeot:    "peugeot",
  Renault:    "renault",
  Seat:       "seat",
  Suzuki:     "suzuki",
  Toyota:     "toyota",
  Volkswagen: "volkswagen",
  BAIC:       null,
};

// ── Suplemento México ────────────────────────────────────────────────────────
// Modelos del mercado MX/LA que NHTSA no registra, y versiones conocidas.
// También cubre las marcas con nhtsa: null.
const SUPLEMENTO = {
  Nissan: [
    { nombre: "Tsuru",   inicio: 2000, fin: 2017, versiones: ["GS I", "GS II", "GS II EE"] },
    { nombre: "Platina", inicio: 2002, fin: 2009, versiones: ["Comfort", "Luxury"] },
    { nombre: "Tiida",   inicio: 2004, fin: 2016, versiones: ["Comfort", "Sense", "Advance"] },
  ],
  Toyota: [
    { nombre: "Avanza",  inicio: 2004, fin: 2021, versiones: ["Base", "Premium"] },
  ],
  Chevrolet: [
    { nombre: "Aveo",    inicio: 2004, fin: 2024, versiones: ["LS", "LT", "Base"] },
    { nombre: "Optra",   inicio: 2004, fin: 2010, versiones: ["Base", "LT", "LTZ"] },
    { nombre: "Cavalier",inicio: 2016, fin: 2026, versiones: ["LS", "LT", "RS"] },
  ],
  Volkswagen: [
    { nombre: "Gol",     inicio: 2000, fin: 2012, versiones: ["City", "Team", "Trendline", "Sport"] },
    { nombre: "Pointer", inicio: 2000, fin: 2009, versiones: ["City", "Team"] },
    { nombre: "Derby",   inicio: 2000, fin: 2005, versiones: ["CL", "GL"] },
    { nombre: "Vento",   inicio: 2012, fin: 2026, versiones: ["Startline", "Comfortline", "Highline"] },
    { nombre: "Virtus",  inicio: 2020, fin: 2026, versiones: ["Trendline", "Comfortline", "Highline"] },
  ],
  Dodge: [
    { nombre: "Attitude",inicio: 2006, fin: 2019, versiones: ["SE", "SXT"] },
    { nombre: "Neon",    inicio: 2000, fin: 2006, versiones: ["SE", "SXT"] },
  ],
  Renault: [
    { nombre: "Clio",    inicio: 2000, fin: 2015, versiones: ["Authentique", "Dynamique", "Expression"] },
    { nombre: "Logan",   inicio: 2005, fin: 2022, versiones: ["Authentique", "Expression", "Privilege"] },
    { nombre: "Symbol",  inicio: 2009, fin: 2016, versiones: ["Expression", "Privilege"] },
    { nombre: "Fluence", inicio: 2011, fin: 2017, versiones: ["Expression", "Privilege", "GT Line"] },
    { nombre: "Kwid",    inicio: 2018, fin: 2026, versiones: ["Zen", "Iconic"] },
    { nombre: "Stepway", inicio: 2018, fin: 2026, versiones: ["Zen", "Intens"] },
  ],
  Seat: [
    { nombre: "Ibiza",   inicio: 2000, fin: 2026, versiones: ["Reference", "Style", "FR", "Xcellence"] },
    { nombre: "Toledo",  inicio: 2000, fin: 2020, versiones: ["Reference", "Style", "FR"] },
    { nombre: "León",    inicio: 2000, fin: 2026, versiones: ["Reference", "Style", "FR", "Cupra"] },
  ],
  Peugeot: [
    { nombre: "206",     inicio: 2000, fin: 2013, versiones: ["XR", "XS", "XT"] },
    { nombre: "207",     inicio: 2008, fin: 2014, versiones: ["Active", "Allure"] },
    { nombre: "208",     inicio: 2013, fin: 2026, versiones: ["Active", "Allure", "GT Line"] },
    { nombre: "301",     inicio: 2014, fin: 2023, versiones: ["Active", "Allure"] },
    { nombre: "2008",    inicio: 2014, fin: 2026, versiones: ["Active", "Allure", "GT Line"] },
  ],
  BAIC: [
    { nombre: "D50",     inicio: 2018, fin: 2026, versiones: ["MT", "AT"] },
    { nombre: "D60",     inicio: 2020, fin: 2026, versiones: ["MT", "AT"] },
  ],
  JAC: [
    { nombre: "J3",      inicio: 2013, fin: 2020, versiones: ["MT", "AT"] },
    { nombre: "J4",      inicio: 2017, fin: 2026, versiones: ["MT", "AT"] },
    { nombre: "J7",      inicio: 2021, fin: 2026, versiones: ["MT", "AT"] },
  ],
};

// Versiones para modelos que SÍ vienen de NHTSA
const VERSIONES_NHTSA = {
  Nissan: {
    March:  ["Sense", "Advance", "SR"],
    Versa:  ["Sense", "Drive", "Advance", "Exclusive"],
    Sentra: ["Sense", "Advance", "Exclusive", "SR Turbo"],
    "NP300 Frontier": ["SE", "PRO-4X", "LE"],
  },
  Toyota: {
    Corolla: ["Base", "LE", "S", "SE", "XSE"],
    Yaris:   ["Core", "Base", "S", "R", "Premium"],
    Camry:   ["XLE", "SE", "XSE"],
    Sienna:  ["CE", "LE", "XLE", "Limited"],
  },
  Volkswagen: {
    Jetta: ["Trendline", "Comfortline", "Highline", "GLI"],
    Golf:  ["Comfortline", "Highline", "GTI"],
  },
  Chevrolet: {
    Sonic:  ["LT", "LTZ", "RS"],
    Malibu: ["LT", "LTZ"],
  },
  Honda: {
    City:  ["LX", "EX", "EXL"],
    Civic: ["LX", "EX", "Sport", "Touring"],
    Fit:   ["Fun", "Cool", "Sport"],
  },
  Kia: {
    Rio:    ["L", "LX", "EX", "EX Pack"],
    Forte:  ["L", "LX", "EX", "EX Pack", "GT Line"],
    Optima: ["LX", "EX", "SXL"],
    K5:     ["LX", "EX", "GT Line", "EX Tech"],
  },
  Mazda: {
    "Mazda3": ["i", "Sport", "Grand Touring"],
    "Mazda6": ["i", "Grand Touring"],
  },
  Ford: {
    Focus:  ["S", "SE", "SEL", "Titanium"],
    Fiesta: ["S", "SE", "SES", "Titanium"],
    Fusion: ["S", "SE", "SEL", "Titanium"],
    Figo:   ["Impulse", "Ambiente", "Trend"],
  },
  Hyundai: {
    Accent:  ["GL", "GLS", "GS"],
    Elantra: ["GL", "GLS", "Sport"],
    Sonata:  ["GLS", "Limited"],
    i10:     ["GL", "GLS"],
  },
  Dodge: {
    Dart: ["SE", "SXT", "Limited"],
  },
  Mitsubishi: {
    Lancer: ["ES", "GLS", "GT", "Evolution"],
    Mirage: ["ES", "GLS"],
  },
  Suzuki: {
    Swift: ["GA", "GLS", "Sport"],
    Ciaz:  ["GL", "GLX"],
  },
};

// ── Cache de llamadas a NHTSA ────────────────────────────────────────────────
const _cache = new Map();

async function fetchNHTSA(nhtsaMake, anio) {
  const key = `${nhtsaMake}|${anio}`;
  if (_cache.has(key)) return _cache.get(key);
  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${nhtsaMake}/modelyear/${anio}?format=json`,
      { signal: AbortSignal.timeout(5000) },
    );
    const json = await res.json();
    const modelos = json.Results?.map((r) => r.Model_Name) ?? [];
    _cache.set(key, modelos);
    return modelos;
  } catch {
    return [];
  }
}

// ── API pública ──────────────────────────────────────────────────────────────

export function getAnios() {
  const current = new Date().getFullYear();
  const list = [];
  for (let y = current + 1; y >= 2000; y--) list.push(String(y));
  return list;
}

/** Devuelve las marcas soportadas (síncrono). */
export function getMarcas() {
  return [...MARCAS].sort();
}

/**
 * Devuelve los modelos para marca+año.
 * Mezcla NHTSA (si aplica) con el suplemento MX. Async.
 */
export async function getModelos(marca, anio) {
  if (!marca || !anio) return [];
  const y = Number(anio);

  // Modelos del suplemento MX para este año
  const splModelos = (SUPLEMENTO[marca] ?? [])
    .filter((m) => m.inicio <= y && m.fin >= y)
    .map((m) => m.nombre);

  const nhtsaMake = NHTSA_MAKE[marca];
  if (!nhtsaMake) return splModelos.sort();

  const fromNHTSA = await fetchNHTSA(nhtsaMake, anio);

  // Unión sin duplicados (suplemento tiene prioridad de nombres exactos MX)
  const todos = [...new Set([...fromNHTSA, ...splModelos])];
  return todos.sort();
}

/** Versiones para un modelo (síncrono, local). */
export function getVersiones(marca, modelo) {
  // Primero busca en el suplemento
  const splEntry = (SUPLEMENTO[marca] ?? []).find((m) => m.nombre === modelo);
  if (splEntry) return splEntry.versiones;
  // Luego en las versiones conocidas de NHTSA
  return VERSIONES_NHTSA[marca]?.[modelo] ?? [];
}

// ── Índice AMIS (solo modelos del suplemento) ────────────────────────────────
const _vehToAmis = new Map();
const _amisToVeh = new Map();

;(function _buildAmisIndex() {
  let seq = 1000;
  for (const [marca, modelos] of Object.entries(SUPLEMENTO)) {
    for (const { nombre: modelo, inicio, fin, versiones } of modelos) {
      for (const version of versiones) {
        for (let anio = inicio; anio <= fin; anio++) {
          const key  = `${anio}|${marca}|${modelo}|${version}`;
          const code = String(seq++);
          _vehToAmis.set(key, code);
          _amisToVeh.set(code, { anio: String(anio), marca, modelo, version });
        }
      }
    }
  }
  // También indexa modelos NHTSA con versiones conocidas
  for (const [marca, modelosMap] of Object.entries(VERSIONES_NHTSA)) {
    for (const [modelo, versiones] of Object.entries(modelosMap)) {
      for (const version of versiones) {
        for (let anio = 2000; anio <= new Date().getFullYear() + 1; anio++) {
          const key = `${anio}|${marca}|${modelo}|${version}`;
          if (!_vehToAmis.has(key)) {
            const code = String(seq++);
            _vehToAmis.set(key, code);
            _amisToVeh.set(code, { anio: String(anio), marca, modelo, version });
          }
        }
      }
    }
  }
})();

export function getCodigoAmis(anio, marca, modelo, version) {
  if (!anio || !marca || !modelo || !version) return "";
  return _vehToAmis.get(`${anio}|${marca}|${modelo}|${version}`) ?? "";
}

export function getVehiculoPorAmis(codigo) {
  return _amisToVeh.get(String(codigo)) ?? null;
}
