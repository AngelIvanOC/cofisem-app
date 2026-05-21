// Catálogo estático de vehículos para servicio de taxi/Uber en México.
// Sin API externa — respuesta instantánea.
//
// Flujo: Año → Marcas disponibles ese año → Modelos → Versiones

const CATALOGO = [
  {
    marca: "Nissan",
    modelos: [
      { nombre: "Tsuru",    inicio: 2000, fin: 2017, versiones: ["GS I", "GS II", "GS II EE"] },
      { nombre: "Platina",  inicio: 2002, fin: 2009, versiones: ["Comfort", "Luxury"] },
      { nombre: "Tiida",    inicio: 2004, fin: 2016, versiones: ["Comfort", "Sense", "Advance"] },
      { nombre: "March",    inicio: 2011, fin: 2024, versiones: ["Sense", "Advance", "SR"] },
      { nombre: "Versa",    inicio: 2012, fin: 2026, versiones: ["Sense", "Drive", "Advance", "Exclusive"] },
      { nombre: "Sentra",   inicio: 2000, fin: 2026, versiones: ["Sense", "Advance", "Exclusive", "SR Turbo"] },
    ],
  },
  {
    marca: "Toyota",
    modelos: [
      { nombre: "Corolla",  inicio: 2000, fin: 2026, versiones: ["Base", "LE", "S", "SE", "XSE"] },
      { nombre: "Yaris",    inicio: 2006, fin: 2026, versiones: ["Core", "Base", "S", "R", "Premium"] },
      { nombre: "Camry",    inicio: 2000, fin: 2026, versiones: ["XLE", "SE", "XSE"] },
      { nombre: "Sienna",   inicio: 2004, fin: 2026, versiones: ["CE", "LE", "XLE", "Limited"] },
      { nombre: "Avanza",   inicio: 2004, fin: 2021, versiones: ["Base", "Premium"] },
    ],
  },
  {
    marca: "Chevrolet",
    modelos: [
      { nombre: "Aveo",     inicio: 2004, fin: 2024, versiones: ["LS", "LT", "Base"] },
      { nombre: "Optra",    inicio: 2004, fin: 2010, versiones: ["Base", "LT", "LTZ"] },
      { nombre: "Sonic",    inicio: 2012, fin: 2020, versiones: ["LT", "LTZ", "RS"] },
      { nombre: "Cavalier", inicio: 2016, fin: 2026, versiones: ["LS", "LT", "RS"] },
      { nombre: "Malibu",   inicio: 2013, fin: 2024, versiones: ["LT", "LTZ"] },
    ],
  },
  {
    marca: "Volkswagen",
    modelos: [
      { nombre: "Pointer",  inicio: 2000, fin: 2009, versiones: ["City", "Team"] },
      { nombre: "Derby",    inicio: 2000, fin: 2005, versiones: ["CL", "GL"] },
      { nombre: "Jetta",    inicio: 2000, fin: 2026, versiones: ["Trendline", "Comfortline", "Highline", "GLI"] },
      { nombre: "Golf",     inicio: 2000, fin: 2021, versiones: ["Comfortline", "Highline", "GTI"] },
      { nombre: "Vento",    inicio: 2012, fin: 2026, versiones: ["Startline", "Comfortline", "Highline"] },
      { nombre: "Virtus",   inicio: 2020, fin: 2026, versiones: ["Trendline", "Comfortline", "Highline"] },
    ],
  },
  {
    marca: "Hyundai",
    modelos: [
      { nombre: "Accent",   inicio: 2000, fin: 2026, versiones: ["GL", "GLS", "GS"] },
      { nombre: "Elantra",  inicio: 2000, fin: 2026, versiones: ["GL", "GLS", "Sport"] },
      { nombre: "Sonata",   inicio: 2000, fin: 2019, versiones: ["GLS", "Limited"] },
      { nombre: "i10",      inicio: 2013, fin: 2020, versiones: ["GL", "GLS"] },
    ],
  },
  {
    marca: "Kia",
    modelos: [
      { nombre: "Rio",      inicio: 2001, fin: 2026, versiones: ["L", "LX", "EX", "EX Pack"] },
      { nombre: "Forte",    inicio: 2010, fin: 2026, versiones: ["L", "LX", "EX", "EX Pack", "GT Line"] },
      { nombre: "Optima",   inicio: 2011, fin: 2020, versiones: ["LX", "EX", "SXL"] },
      { nombre: "K5",       inicio: 2021, fin: 2026, versiones: ["LX", "EX", "GT Line", "EX Tech"] },
    ],
  },
  {
    marca: "Ford",
    modelos: [
      { nombre: "Focus",    inicio: 2000, fin: 2019, versiones: ["S", "SE", "SEL", "Titanium"] },
      { nombre: "Fiesta",   inicio: 2011, fin: 2019, versiones: ["S", "SE", "SES", "Titanium"] },
      { nombre: "Fusion",   inicio: 2006, fin: 2020, versiones: ["S", "SE", "SEL", "Titanium"] },
      { nombre: "Figo",     inicio: 2011, fin: 2026, versiones: ["Impulse", "Ambiente", "Trend"] },
    ],
  },
  {
    marca: "Seat",
    modelos: [
      { nombre: "Ibiza",    inicio: 2000, fin: 2026, versiones: ["Reference", "Style", "FR", "Xcellence"] },
      { nombre: "Toledo",   inicio: 2000, fin: 2020, versiones: ["Reference", "Style", "FR"] },
      { nombre: "León",     inicio: 2000, fin: 2026, versiones: ["Reference", "Style", "FR", "Cupra"] },
    ],
  },
  {
    marca: "Honda",
    modelos: [
      { nombre: "City",     inicio: 2003, fin: 2026, versiones: ["LX", "EX", "EXL"] },
      { nombre: "Civic",    inicio: 2000, fin: 2026, versiones: ["LX", "EX", "Sport", "Touring"] },
      { nombre: "Fit",      inicio: 2008, fin: 2020, versiones: ["Fun", "Cool", "Sport"] },
    ],
  },
  {
    marca: "Mazda",
    modelos: [
      { nombre: "Mazda 3",  inicio: 2004, fin: 2026, versiones: ["i", "Sport", "Grand Touring"] },
      { nombre: "Mazda 6",  inicio: 2004, fin: 2021, versiones: ["i", "Grand Touring"] },
      { nombre: "Alegro",   inicio: 2000, fin: 2004, versiones: ["Base"] },
    ],
  },
  {
    marca: "Renault",
    modelos: [
      { nombre: "Clio",     inicio: 2000, fin: 2015, versiones: ["Authentique", "Dynamique", "Expression"] },
      { nombre: "Logan",    inicio: 2005, fin: 2022, versiones: ["Authentique", "Expression", "Privilege"] },
      { nombre: "Symbol",   inicio: 2009, fin: 2016, versiones: ["Expression", "Privilege"] },
      { nombre: "Fluence",  inicio: 2011, fin: 2017, versiones: ["Expression", "Privilege", "GT Line"] },
    ],
  },
  {
    marca: "Dodge",
    modelos: [
      { nombre: "Neon",     inicio: 2000, fin: 2006, versiones: ["SE", "SXT"] },
      { nombre: "Attitude", inicio: 2006, fin: 2019, versiones: ["SE", "SXT"] },
      { nombre: "Dart",     inicio: 2013, fin: 2019, versiones: ["SE", "SXT", "Limited"] },
    ],
  },
  {
    marca: "Mitsubishi",
    modelos: [
      { nombre: "Lancer",   inicio: 2000, fin: 2017, versiones: ["ES", "GLS", "GT", "Evolution"] },
      { nombre: "Mirage",   inicio: 2012, fin: 2026, versiones: ["ES", "GLS"] },
    ],
  },
  {
    marca: "Peugeot",
    modelos: [
      { nombre: "206",      inicio: 2000, fin: 2013, versiones: ["XR", "XS", "XT"] },
      { nombre: "207",      inicio: 2008, fin: 2014, versiones: ["Active", "Allure"] },
      { nombre: "208",      inicio: 2013, fin: 2026, versiones: ["Active", "Allure", "GT Line"] },
      { nombre: "301",      inicio: 2014, fin: 2023, versiones: ["Active", "Allure"] },
    ],
  },
  {
    marca: "Suzuki",
    modelos: [
      { nombre: "Swift",    inicio: 2005, fin: 2024, versiones: ["GA", "GLS", "Sport"] },
      { nombre: "Ciaz",     inicio: 2016, fin: 2022, versiones: ["GL", "GLX"] },
    ],
  },
  {
    marca: "BAIC",
    modelos: [
      { nombre: "D50",      inicio: 2018, fin: 2026, versiones: ["MT", "AT"] },
      { nombre: "D60",      inicio: 2020, fin: 2026, versiones: ["MT", "AT"] },
    ],
  },
  {
    marca: "JAC",
    modelos: [
      { nombre: "J3",       inicio: 2013, fin: 2020, versiones: ["MT", "AT"] },
      { nombre: "J4",       inicio: 2017, fin: 2026, versiones: ["MT", "AT"] },
    ],
  },
];

export function getAnios() {
  const current = new Date().getFullYear();
  const list = [];
  for (let y = current + 1; y >= 2000; y--) list.push(String(y));
  return list;
}

/** Marcas que tuvieron al menos un modelo disponible en ese año. */
export function getMarcas(anio) {
  if (!anio) return [];
  const y = Number(anio);
  return CATALOGO
    .filter(m => m.modelos.some(mo => mo.inicio <= y && mo.fin >= y))
    .map(m => m.marca)
    .sort();
}

/** Modelos de una marca disponibles en ese año. */
export function getModelos(marca, anio) {
  if (!marca || !anio) return [];
  const y = Number(anio);
  const entry = CATALOGO.find(m => m.marca === marca);
  if (!entry) return [];
  return entry.modelos
    .filter(mo => mo.inicio <= y && mo.fin >= y)
    .map(mo => mo.nombre)
    .sort();
}

/** Versiones de un modelo. */
export function getVersiones(marca, modelo) {
  const entry = CATALOGO.find(m => m.marca === marca);
  if (!entry) return [];
  return entry.modelos.find(mo => mo.nombre === modelo)?.versiones ?? [];
}

// ── Índice AMIS ──────────────────────────────────────────────────────────────
// Código de 4 dígitos asignado secuencialmente en orden del catálogo.
// Determinístico: el mismo input siempre produce el mismo código.
// Rango: 1000–9999 (hasta 9 000 combinaciones únicas).

const _vehToAmis = new Map(); // "anio|marca|modelo|version" → "1234"
const _amisToVeh = new Map(); // "1234" → { anio, marca, modelo, version }

;(function _buildAmisIndex() {
  let seq = 1000;
  for (const { marca, modelos } of CATALOGO) {
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
})();

/**
 * Devuelve el código AMIS de 4 dígitos para la combinación dada.
 * Retorna "" si algún campo falta o la combinación no está en el catálogo.
 */
export function getCodigoAmis(anio, marca, modelo, version) {
  if (!anio || !marca || !modelo || !version) return "";
  return _vehToAmis.get(`${anio}|${marca}|${modelo}|${version}`) ?? "";
}

/**
 * Dado un código AMIS devuelve { anio, marca, modelo, version } o null.
 */
export function getVehiculoPorAmis(codigo) {
  return _amisToVeh.get(String(codigo)) ?? null;
}
