// ============================================================
// scripts/generar-pase-medico-grid.mjs
// Genera src/components/pdf/paseMedicoGrid.js a partir de
// archivos_apoyo/pase_medico/3 PASE DE ATENCION MEDICA_0.xlsx.
//
// El PDF de ejemplo (archivos_apoyo/pase_medico/PASE DE ATENCION
// MEDICA_0.pdf) SÍ mide Carta 612x792pt, pero el contenido real solo
// ocupa el tercio superior de esa hoja — el resto es blanco vacío. El
// contenido en sí, medido en sus unidades naturales del Excel (suma de
// anchos de columna en pt vs suma de alturas de fila), es más ANCHO
// que alto (~838x524pt, razón ~1.6:1) — casi exactamente la
// proporción de una media carta acostada (8.5x5.5in = 612x396pt,
// razón ~1.55:1). Por eso este generador NO estira el contenido para
// llenar una hoja Carta vertical (eso fue lo que se hizo al principio,
// y dejaba las fuentes gigantes y sin parecido al original) — en vez
// de eso escala TODO por un solo factor uniforme (no X/Y por separado)
// para que quepa dentro de esa media carta acostada, tal como se ve
// realmente impreso: como una ficha, no como una hoja completa.
//
// A diferencia del Excel de Pase Taller, este es una PLANTILLA EN
// BLANCO (sin caso de ejemplo horneado) — todo el texto presente es
// etiqueta estructural, así que no hace falta lógica de "vaciar dato
// de ejemplo". Los cuadros de checkbox del formato (Atropello/
// Colisión/Conciente/etc.) son formas de Excel, no extraíbles por
// ExcelJS (mismo caso que Pase Taller) — se dibujan en el componente
// con el mismo CheckMark anclado al borde derecho de la celda de la
// etiqueta.
//
// Uso: node scripts/generar-pase-medico-grid.mjs
// ============================================================
import ExcelJS from "exceljs";
import fs from "fs";

const SRC = "archivos_apoyo/pase_medico/3 PASE DE ATENCION MEDICA_0.xlsx";
const OUT = "src/components/pdf/paseMedicoGrid.js";
const SHEET = "Atención médica";

// Media carta ACOSTADA (8.5 x 5.5 in) — el formato de "ficha" pedido,
// en vez de la hoja Carta vertical completa que usan Pase Taller y
// Declaración (esos sí llenan la hoja de borde a borde).
const PAGE = { w: 612, h: 396 };

const THEME = {
  0: [255, 255, 255], // lt1
  1: [0, 0, 0],        // dk1
  2: [238, 236, 225],  // lt2
  3: [31, 73, 125],    // dk2
  4: [79, 129, 189],   // accent1
  5: [192, 80, 77],    // accent2
};

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

const MARGIN_TARGET = 10;

// Ajustes puntuales por celda cuando el ancho de Helvetica no alcanza a
// entrar en columnas angostas (columnas de 1 sola letra de ancho como
// "VIGENCIA"/"No. DE SINIESTRO"), o para acortar el relleno de espacios
// que el autor original usó para separar 2 opciones dentro de UNA sola
// celda combinada (pensado para el ancho más angosto de Calibri, no
// para Helvetica). Con el escalado uniforme (ficha, no hoja completa)
// las fuentes ya salen a un tamaño razonable de entrada, así que esta
// lista debería quedar mucho más corta que en el primer intento — se
// ajusta según lo que se vea en el render real.
const FONT_SCALE_FIXES = {};
const TEXT_FIXES = {
  "Incapacidad para Deambular                                                              Inconciencia":
    "Incapacidad para Deambular          Inconciencia",
};

async function extractSheet(wb, sheetName) {
  const ws = wb.getWorksheet(sheetName);

  const colWidthsRaw = [0];
  for (let c = 1; c <= ws.columnCount; c++) colWidthsRaw[c] = colWidthToPt(ws.getColumn(c).width);
  const rowHeightsRaw = [0];
  for (let r = 1; r <= ws.rowCount; r++) rowHeightsRaw[r] = ws.getRow(r).height ?? 15;

  const rawContentW = colWidthsRaw.reduce((a, b) => a + b, 0);
  const rawContentH = rowHeightsRaw.reduce((a, b) => a + b, 0);

  // A diferencia de Pase Taller/Declaración (donde el contenido SÍ llena
  // toda la hoja y conviene escalar X/Y por separado), aquí el contenido
  // natural ya es casi la misma proporción que la media carta acostada
  // (~1.6:1 vs ~1.55:1) — un solo factor uniforme evita deformar las
  // celdas y mantiene el aspecto real del formato, como una ficha.
  const scale = Math.min(
    (PAGE.w - 2 * MARGIN_TARGET) / rawContentW,
    (PAGE.h - 2 * MARGIN_TARGET) / rawContentH,
  );
  const scaleX = scale;
  const scaleY = scale;

  const contentW = rawContentW * scale;
  const contentH = rawContentH * scale;

  // Centrado en AMBOS ejes (antes solo horizontal) — ya no hay una franja
  // vertical de sobra que rellenar, así que la ficha queda pareja.
  const offsetX = (PAGE.w - contentW) / 2;
  const offsetY = (PAGE.h - contentH) / 2;

  const colLeft = [offsetX];
  for (let c = 1; c <= ws.columnCount; c++) colLeft[c] = colLeft[c - 1] + colWidthsRaw[c] * scaleX;
  const rowTop = [offsetY];
  for (let r = 1; r <= ws.rowCount; r++) rowTop[r] = rowTop[r - 1] + rowHeightsRaw[r] * scaleY;

  const merges = ws.model.merges.map(parseRange);
  const covered = new Set();
  for (const mg of merges) {
    for (let r = mg.r1; r <= mg.r2; r++)
      for (let c = mg.c1; c <= mg.c2; c++) covered.add(`${r}_${c}`);
  }

  function borderSide(side) {
    if (!side || !side.style) return { w: 0, c: "#000000" };
    const w = side.style === "medium" || side.style === "thick" ? 1.1 : 0.5;
    return { w, c: resolveColor(side.color) ?? "#000000" };
  }
  function cellInfo(r1, c1) {
    const cell = ws.getCell(r1, c1);
    let text = cell.value != null && typeof cell.value !== "object"
      ? String(cell.value).trim()
      : (cell.value?.richText ? cell.value.richText.map((t) => t.text).join("").trim() : null);
    if (text && TEXT_FIXES[text]) text = TEXT_FIXES[text];
    const fill = cell.fill?.pattern === "solid" ? resolveColor(cell.fill.fgColor) : null;
    const font = cell.font ?? {};
    const bold = !!font.bold;
    // 0.9: mismo factor de compresión Calibri→Helvetica que Pase Taller y
    // Declaración — ya no hace falta el 0.72 agresivo del primer intento,
    // que solo compensaba haber estirado el contenido a una hoja completa.
    const fontSizePt = (font.size ?? 11) * scaleY * 0.9 * (FONT_SCALE_FIXES[text] ?? 1);
    const color = resolveColor(font.color) ?? "#000000";
    // Los encabezados azules van centrados; casi todo lo demás (etiquetas
    // de opción, "Nombre:"/"Domicilio:"/etc.) va alineado a la izquierda
    // en el Excel real — a diferencia de Pase Taller, aquí SÍ importa
    // porque estas celdas combinan etiqueta+valor en una sola celda.
    const align = cell.alignment?.horizontal ?? "left";
    return { text: text || null, fill, bold, fontSizePt, color, align };
  }
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
  rects.sort((a, b) => a.t - b.t || a.l - b.l);

  // Única imagen del sheet: el logo GAMAN (esquina superior derecha).
  const images = ws.getImages().map((im) => {
    const tl = im.range.tl, br = im.range.br;
    const l = colLeft[tl.nativeCol] + (tl.nativeColOff / 12700) * scaleX;
    const t = rowTop[tl.nativeRow] + (tl.nativeRowOff / 12700) * scaleY;
    const r = colLeft[br.nativeCol] + (br.nativeColOff / 12700) * scaleX;
    const b = rowTop[br.nativeRow] + (br.nativeRowOff / 12700) * scaleY;
    return { l: round2(l), t: round2(t), w: round2(r - l), h: round2(b - t) };
  });

  return { rects, images, size: { w: round2(contentW + offsetX), h: round2(contentH + offsetY) } };
}

function round2(n) { return Math.round(n * 100) / 100; }

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(SRC);
const sheet = await extractSheet(wb, SHEET);

function serializeRects(rects) {
  return rects.map((r) => {
    const parts = [`l:${r.l}`, `t:${r.t}`, `w:${r.w}`, `h:${r.h}`, `r1:${r.r1}`, `c1:${r.c1}`, `r2:${r.r2}`, `c2:${r.c2}`];
    parts.push(`text:${r.text ? JSON.stringify(r.text) : "null"}`);
    parts.push(`fill:${r.fill ? JSON.stringify(r.fill) : "null"}`);
    if (r.bold) parts.push(`bold:true`);
    parts.push(`fontSize:${round2(r.fontSizePt)}`);
    parts.push(`color:${JSON.stringify(r.color)}`);
    parts.push(`align:${JSON.stringify(r.align)}`);
    const side = (s) => `{w:${s.w},c:${JSON.stringify(s.c)}}`;
    parts.push(`border:{t:${side(r.border.t)},r:${side(r.border.r)},b:${side(r.border.b)},l:${side(r.border.l)}}`);
    return `{${parts.join(",")}}`;
  }).join(",\n");
}

const logo = sheet.images[0];

const out = `// Auto-generado desde archivos_apoyo/pase_medico/3 PASE DE ATENCION MEDICA_0.xlsx
// (no editar a mano — regenerar con: node scripts/generar-pase-medico-grid.mjs)
// Formato "ficha" — media carta ACOSTADA (8.5x5.5in = 612x396pt), no la
// hoja Carta completa: el contenido real del Excel es naturalmente más
// ancho que alto y solo ocupaba el tercio superior de una hoja Carta en
// el PDF de ejemplo. Ver comentario grande al inicio del generador.

export const PAGE_SIZE = { w: 612, h: 396 };
export const CONTENT_SIZE = ${JSON.stringify(sheet.size)};

export const LOGO = ${JSON.stringify(logo)};

export const RECTS = [
${serializeRects(sheet.rects)}
];
`;

fs.writeFileSync(OUT, out);
console.log("Escrito", OUT);
console.log("size:", sheet.size, "rects:", sheet.rects.length, "images:", sheet.images.length);
console.log("logo:", logo);
