// ============================================================
// scripts/generar-declaracion-grid.mjs
// Genera src/components/pdf/declaracionGrid.js a partir de
// archivos_apoyo/declaracion_accidente/EXCEL.xlsx (hojas "Caratula"
// y "Reverso"), replicando EXACTAMENTE lo que Excel produce al
// imprimir: tamaño de papel Legal/Oficio 612x1008pt, con el %
// de escala de impresión y los márgenes reales de cada hoja.
//
// Uso: node scripts/generar-declaracion-grid.mjs
// ============================================================
import ExcelJS from "exceljs";
import fs from "fs";

const SRC = "archivos_apoyo/declaracion_accidente/EXCEL.xlsx";
const OUT = "src/components/pdf/declaracionGrid.js";

// Tamaño real de página confirmado con el PDF impreso desde Excel
// (MediaBox 612x1008pt = Legal/Oficio, 8.5x14in).
const PAGE = { w: 612, h: 1008 };

// Erratas reales del Excel (se armó rápido) — se corrigen aquí en vez
// de a mano en el archivo generado, para que sobrevivan a la próxima
// regeneración.
const TEXT_FIXES = {
  "Moivo de su calificación": "Motivo de su calificación",
};

// Los encabezados de sección (barra azul) deberían verse todos igual
// de gruesos por fuera, pero el Excel (se armó rápido) le puso borde
// delgado a unos y grueso a otros sin ningún patrón — mismo color de
// relleno, bordes distintos. Se normalizan todos al grosor "grueso"
// que ya tenía la mayoría (arriba/derecha/izquierda), dejando abajo
// como estaba (ya era parejo en cada hoja: 0.5pt en Carátula, 0 en
// Reverso — esa línea separa el encabezado de su primera fila de
// datos, no de la sección anterior).
const HEADER_FILL = "#558ED5";
function normalizarBordesEncabezado(rects, bottomWidth) {
  for (const r of rects) {
    if (r.fill !== HEADER_FILL) continue;
    const c = "#000000";
    r.border = { t: { w: 1.1, c }, r: { w: 1.1, c }, b: { w: bottomWidth, c }, l: { w: 1.1, c } };
  }
}

// Merges que faltan en el Excel (se armó rápido y se les olvidó
// fusionar estas celdas, a diferencia de su fila gemela) — sin esto
// "El Servicio del Ajustador fue:" queda en una celda de un solo
// ancho de columna (33pt) y el texto no cabe ni en 2 líneas, mientras
// que "El Servicio del Reporte telefónico fue:" (misma frase, fila de
// arriba) sí tiene B63:D63 fusionado.
const MERGE_FIXES = {
  Reverso: ["B65:D65"],
};

const THEME = {
  0: [255, 255, 255], // lt1
  1: [0, 0, 0],        // dk1
  2: [238, 236, 225],  // lt2
  3: [31, 73, 125],    // dk2
  4: [79, 129, 189],   // accent1
  5: [192, 80, 77],    // accent2
};

// El "tint" de un theme color en Excel NO es un lerp por canal RGB
// hacia blanco/negro — es un ajuste de luminosidad en espacio HSL (spec
// ECMA-376). Aplicarlo por canal da un azul grisáceo (#7992B1) en vez
// del azul real de Excel (#538DD5); en HSL, mismo tono/saturación,
// sólo cambia L, y sí reproduce el color real.
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s; const l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h, s, l];
}
function hue2rgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}
function hslToRgb(h, s, l) {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)].map((v) => Math.round(v * 255));
}
function tintRgb([r, g, b], tint) {
  const [h, s, l] = rgbToHsl(r, g, b);
  const l2 = tint < 0 ? l * (1 + tint) : l * (1 - tint) + tint;
  return hslToRgb(h, s, Math.max(0, Math.min(1, l2)));
}
function toHex([r, g, b]) {
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0").toUpperCase()).join("");
}
function resolveColor(colorObj) {
  if (!colorObj) return null;
  if (colorObj.argb) {
    const a = colorObj.argb.length === 8 ? colorObj.argb.slice(2) : colorObj.argb;
    return "#" + a.toUpperCase();
  }
  if (colorObj.theme !== undefined) {
    const base = THEME[colorObj.theme] ?? THEME[1];
    const tint = colorObj.tint ?? 0;
    return toHex(tintRgb(base, tint));
  }
  // indexed:64 = "automático" (negro) en el palette heredado de Excel.
  if (colorObj.indexed !== undefined) return "#000000";
  return null;
}

// Excel width(caracteres) -> px -> pt (Calibri 11, MDW=7px)
function colWidthToPt(widthChars) {
  const w = widthChars ?? 8.43;
  const px = Math.floor(((256 * w + Math.floor(128 / 7)) / 256) * 7);
  return (px * 72) / 96;
}

function colLetterToIndex(letters) {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n; // 1-indexed
}
function parseRange(range) {
  const [a, b] = range.split(":");
  const pa = a.match(/([A-Z]+)(\d+)/);
  const pb = b.match(/([A-Z]+)(\d+)/);
  return {
    c1: colLetterToIndex(pa[1]), r1: Number(pa[2]),
    c2: colLetterToIndex(pb[1]), r2: Number(pb[2]),
  };
}

// Márgenes objetivo (a pedido: minimizar espacio en blanco a los lados,
// pero sin pegar el contenido al borde de arriba). El contenido se
// escala al máximo uniforme que cabe respetando ambos márgenes sin
// desbordar ningún eje, y se centra — ya no se usa el % de impresión
// ni los márgenes/centrado que traía guardados el propio Excel (esos
// daban de sobra en los lados para Carátula y dejaban medio Reverso en
// blanco abajo). Carátula está limitada por altura, así que el margen
// vertical sí le quita algo de escala/ancho lateral; Reverso está
// limitado por ancho, así que V_MARGIN_TARGET no le afecta en nada.
const H_MARGIN_TARGET = 10;
// Carátula es más alta que ancha en proporción a la hoja Legal, así
// que cualquier margen vertical le cuesta margen horizontal extra (a
// V=0 el mínimo horizontal ya es ~28pt, muy por encima de los 10pt del
// Reverso — no hay forma de igualar exactamente los dos sin desbordar
// la altura de Carátula o sacrificar su margen vertical). 16pt es el
// que se confirmó que se ve bien arriba/abajo del título.
// También se usa como margen superior fijo del Reverso (verticalAlign
// "top" — el Reverso no lleva centrado vertical, se queda pegado
// arriba como el Excel original y el sobrante cae todo abajo).
const V_MARGIN_TARGET = 16;

async function extractSheet(wb, sheetName, excludeRows = [], verticalAlign = "center", decoupleScale = false, headerBottomWidth = 0.5) {
  const ws = wb.getWorksheet(sheetName);

  // Anchos/altos crudos (sin escalar) en pt.
  const colWidthsRaw = [0]; // 1-indexed
  for (let c = 1; c <= ws.columnCount; c++) colWidthsRaw[c] = colWidthToPt(ws.getColumn(c).width);
  const rowHeightsRaw = [0];
  for (let r = 1; r <= ws.rowCount; r++) rowHeightsRaw[r] = ws.getRow(r).height ?? 15;

  const rawContentW = colWidthsRaw.reduce((a, b) => a + b, 0);
  const rawContentH = rowHeightsRaw.reduce((a, b) => a + b, 0);

  // Escala horizontal y vertical: por defecto acopladas (una sola,
  // como imprime Excel — el Reverso ya está bien así, sólo limitado
  // por ancho). Con decoupleScale=true (Carátula) van CADA UNA por su
  // lado: scaleX sólo ensancha columnas (y por lo tanto reduce el
  // margen lateral) para llegar al margen horizontal objetivo, sin
  // exigir más alto — scaleY (filas + tamaño de letra) sigue dando el
  // buen espaciado arriba/abajo que ya se había ajustado. Así Carátula
  // puede tener el mismo margen lateral que el Reverso sin desbordar
  // la altura de la página.
  const scaleByWidth = (PAGE.w - 2 * H_MARGIN_TARGET) / rawContentW;
  const scaleByHeight = (PAGE.h - 2 * V_MARGIN_TARGET) / rawContentH;
  const scaleX = decoupleScale ? scaleByWidth : Math.min(scaleByWidth, scaleByHeight);
  const scaleY = decoupleScale ? scaleByHeight : Math.min(scaleByWidth, scaleByHeight);

  const contentW = rawContentW * scaleX;
  const contentH = rawContentH * scaleY;

  // Horizontal siempre centrado. Vertical: "center" reparte el sobrante
  // arriba y abajo por igual (Carátula); "top" lo deja todo pegado
  // arriba con un margen chico fijo y el resto del espacio abajo, tal
  // cual el Excel original del Reverso (no se le pide centrado vertical).
  const offsetX = (PAGE.w - contentW) / 2;
  const offsetY = verticalAlign === "top" ? V_MARGIN_TARGET : (PAGE.h - contentH) / 2;

  // Posiciones absolutas (escaladas + offset) de cada borde de columna/fila.
  const colLeft = [offsetX];
  for (let c = 1; c <= ws.columnCount; c++) colLeft[c] = colLeft[c - 1] + colWidthsRaw[c] * scaleX;
  const rowTop = [offsetY];
  for (let r = 1; r <= ws.rowCount; r++) rowTop[r] = rowTop[r - 1] + rowHeightsRaw[r] * scaleY;

  // Mapa de celdas cubiertas por un merge (para no duplicarlas sueltas).
  const merges = [...ws.model.merges, ...(MERGE_FIXES[sheetName] ?? [])].map(parseRange);
  const covered = new Set();
  for (const mg of merges) {
    for (let r = mg.r1; r <= mg.r2; r++)
      for (let c = mg.c1; c <= mg.c2; c++) covered.add(`${r}_${c}`);
  }

  // Ancho Y color reales del borde — Excel a veces pinta un borde "thin"
  // en blanco a propósito (o por formato heredado) para que sea
  // invisible; si sólo copiamos el ancho e ignoramos el color, ese
  // borde se ve negro y aparece una cuadrícula donde en el Excel real
  // no se ve nada (ej. detrás del logo).
  function borderSide(side) {
    if (!side || !side.style) return { w: 0, c: "#000000" };
    const w = side.style === "medium" || side.style === "thick" ? 1.1 : 0.5;
    return { w, c: resolveColor(side.color) ?? "#000000" };
  }
  function cellInfo(r1, c1) {
    const cell = ws.getCell(r1, c1);
    let text = cell.value != null && typeof cell.value !== "object" ? String(cell.value).trim() : (cell.value?.richText ? cell.value.richText.map((t) => t.text).join("") : null);
    if (text && TEXT_FIXES[text]) text = TEXT_FIXES[text];
    const fill = cell.fill?.pattern === "solid" ? resolveColor(cell.fill.fgColor) : null;
    const font = cell.font ?? {};
    const bold = !!font.bold;
    // El Excel usa Calibri (más angosta); react-pdf sólo trae las 14
    // fuentes estándar (Helvetica, más ancha). 0.9 compensa el ancho
    // promedio de glifo para que el texto siga cabiendo en columnas
    // angostas sin tener que recortar etiquetas reales del formato.
    // Usa scaleY (no scaleX): el tamaño de letra va ligado al alto de
    // fila, no al ancho de columna — ensanchar columnas no debe agrandar
    // el texto.
    const fontSizePt = (font.size ?? 11) * scaleY * 0.9;
    const color = resolveColor(font.color) ?? "#000000";
    return { text: text || null, fill, bold, fontSizePt, color };
  }
  // El borde de una celda combinada vive repartido entre las celdas de
  // sus 4 orillas (arriba-izq da top+left, pero el right real está en
  // la celda del extremo derecho y el bottom en la del extremo
  // inferior) — leer todo de la celda superior-izquierda deja el lado
  // derecho/inferior más delgado de lo que Excel realmente dibuja.
  function mergeBorder(r1, c1, r2, c2) {
    const top = ws.getCell(r1, c1).border?.top;
    const left = ws.getCell(r1, c1).border?.left;
    const right = ws.getCell(r1, c2).border?.right;
    const bottom = ws.getCell(r2, c1).border?.bottom;
    return { t: borderSide(top), r: borderSide(right), b: borderSide(bottom), l: borderSide(left) };
  }

  const rects = [];
  for (const mg of merges) {
    const info = cellInfo(mg.r1, mg.c1);
    const border = mergeBorder(mg.r1, mg.c1, mg.r2, mg.c2);
    rects.push({
      l: round2(colLeft[mg.c1 - 1]), t: round2(rowTop[mg.r1 - 1]),
      w: round2(colLeft[mg.c2] - colLeft[mg.c1 - 1]), h: round2(rowTop[mg.r2] - rowTop[mg.r1 - 1]),
      r1: mg.r1 - 1, c1: mg.c1 - 1, r2: mg.r2 - 1, c2: mg.c2 - 1,
      ...info, border,
    });
  }
  for (let r = 1; r <= ws.rowCount; r++) {
    for (let c = 1; c <= ws.columnCount; c++) {
      if (covered.has(`${r}_${c}`)) continue;
      const info = cellInfo(r, c);
      rects.push({
        l: round2(colLeft[c - 1]), t: round2(rowTop[r - 1]),
        w: round2(colLeft[c] - colLeft[c - 1]), h: round2(rowTop[r] - rowTop[r - 1]),
        r1: r - 1, c1: c - 1, r2: r - 1, c2: c - 1,
        ...info, border: mergeBorder(r, c, r, c),
      });
    }
  }
  const visible = excludeRows.length
    ? rects.filter((r) => !excludeRows.some((er) => er >= r.r1 && er <= r.r2))
    : rects;
  normalizarBordesEncabezado(visible, headerBottomWidth);
  visible.sort((a, b) => a.t - b.t || a.l - b.l);

  // Imágenes incrustadas (logo, fondo de croquis): anchor oneCell en EMU.
  const images = ws.getImages().map((im) => {
    const tl = im.range.tl, br = im.range.br;
    const l = colLeft[tl.nativeCol] + (tl.nativeColOff / 12700) * scaleX;
    const t = rowTop[tl.nativeRow] + (tl.nativeRowOff / 12700) * scaleY;
    const r = colLeft[br.nativeCol] + (br.nativeColOff / 12700) * scaleX;
    const b = rowTop[br.nativeRow] + (br.nativeRowOff / 12700) * scaleY;
    return { l: round2(l), t: round2(t), w: round2(r - l), h: round2(b - t) };
  });

  return { rects: visible, images, size: { w: round2(contentW + offsetX), h: round2(contentH + offsetY) } };
}

function round2(n) { return Math.round(n * 100) / 100; }

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(SRC);
// Fila 74 (0-indexed): renglón en blanco entre "Lugar y fecha" y el pie
// "DRA001" — no aporta nada, se quita. Fila 75: "DRA001" (folio interno
// de plantilla) — se oculta por ahora a pedido.
const CARATULA_EXCLUDE_ROWS = [74, 75];
const caratula = await extractSheet(wb, "Caratula", CARATULA_EXCLUDE_ROWS, "center", true, 0.5);
const reverso = await extractSheet(wb, "Reverso", [], "top", false, 0);

function serializeRects(rects) {
  return rects.map((r) => {
    const parts = [`l:${r.l}`, `t:${r.t}`, `w:${r.w}`, `h:${r.h}`, `r1:${r.r1}`, `c1:${r.c1}`, `r2:${r.r2}`, `c2:${r.c2}`];
    parts.push(`text:${r.text ? JSON.stringify(r.text) : "null"}`);
    parts.push(`fill:${r.fill ? JSON.stringify(r.fill) : "null"}`);
    if (r.bold) parts.push(`bold:true`);
    parts.push(`fontSize:${round2(r.fontSizePt)}`);
    parts.push(`color:${JSON.stringify(r.color)}`);
    const side = (s) => `{w:${s.w},c:${JSON.stringify(s.c)}}`;
    parts.push(`border:{t:${side(r.border.t)},r:${side(r.border.r)},b:${side(r.border.b)},l:${side(r.border.l)}}`);
    return `{${parts.join(",")}}`;
  }).join(",\n");
}

const out = `// Auto-generado desde archivos_apoyo/declaracion_accidente/EXCEL.xlsx
// (no editar a mano — regenerar con: node scripts/generar-declaracion-grid.mjs)
// Página real de impresión: Legal/Oficio 612x1008pt (8.5x14in), confirmada
// contra archivos_apoyo/declaracion_accidente/PDF.pdf.

export const PAGE_SIZE = { w: 612, h: 1008 };
export const CARATULA_SIZE = ${JSON.stringify(caratula.size)};
export const REVERSO_SIZE  = ${JSON.stringify(reverso.size)};

export const LOGO_CARATULA      = ${JSON.stringify(caratula.images[0] ?? null)};
export const LOGO_REVERSO       = ${JSON.stringify(reverso.images[0] ?? null)};
export const CROQUIS_BG_REVERSO = ${JSON.stringify(reverso.images[1] ?? null)};

export const CARATULA_RECTS = [
${serializeRects(caratula.rects)}
];

export const REVERSO_RECTS = [
${serializeRects(reverso.rects)}
];
`;

fs.writeFileSync(OUT, out);
console.log("Escrito", OUT);
console.log("Caratula size:", caratula.size, "rects:", caratula.rects.length, "images:", caratula.images.length);
console.log("Reverso  size:", reverso.size, "rects:", reverso.rects.length, "images:", reverso.images.length);
