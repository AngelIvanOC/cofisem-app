// ============================================================
// scripts/generar-pase-taller-grid.mjs
// Genera src/components/pdf/paseTallerGrid.js a partir de
// archivos_apoyo/pase_taller/EXCEL.xlsx (hoja "Hoja1"), replicando
// EXACTAMENTE lo que Excel produce al imprimir: página Carta
// 612x792pt, con el % de escala de impresión real.
//
// A diferencia del Excel de Declaración (plantilla en blanco), este
// Excel trae un EJEMPLO YA LLENADO (siniestro M0094, Ford Courier,
// Cesar Guillermo...) horneado en las celdas. Las celdas etiqueta
// (fondo azul FF0000FF, texto blanco) son estructurales y siempre se
// conservan; el resto del texto sin ese relleno es dato de ejemplo
// de un caso real y se vacía aquí para que el componente lo llene en
// tiempo de ejecución con los datos del siniestro actual.
//
// Uso: node scripts/generar-pase-taller-grid.mjs
// ============================================================
import ExcelJS from "exceljs";
import fs from "fs";

const SRC = "archivos_apoyo/pase_taller/EXCEL.xlsx";
const OUT = "src/components/pdf/paseTallerGrid.js";
const SHEET = "Hoja1";

// Tamaño real de página confirmado con archivos_apoyo/pase_taller/pdf.pdf
// (MediaBox 612x792pt = Carta, 8.5x11in).
const PAGE = { w: 612, h: 792 };

// Todas las celdas etiqueta/encabezado del formato usan este mismo
// relleno azul (texto blanco encima) — es una señal 100% confiable
// para distinguir "etiqueta estructural" de "dato capturado".
const LABEL_FILL = "FF0000FF";

// Celdas SIN relleno azul que aun así son texto fijo del formato (título,
// avisos legales, notas, etiquetas de checkbox) y no dato de ejemplo —
// se conservan tal cual. Todo lo demás sin relleno azul se vacía.
const STATIC_KEEP = new Set([
  "D1", // "ORDEN DE ADMISIÓN"
  "G2", // "ESTE PASE EXPIRA 30 DÍAS DESPUÉS DE SU FECHA DE EXPEDICIÓN"
  "A15", // aviso de valuación de daños
  "A34", // "NOTAS: Queda entendido..."
  "A13", // "Taller asignado" (etiqueta de checkbox)
  "A14", // "Enviar a domicilio" (etiqueta de checkbox, se le quita la "X" horneada)
  "I4",  // "Asegurado" (etiqueta de checkbox)
  "I5",  // "Tercero" (etiqueta de checkbox, se le quita la "X" horneada)
]);

// Erratas reales del Excel + "X" horneadas de checkboxes que en el
// sistema deben marcarse dinámicamente según el dato real, no siempre
// fijas en "Tercero"/"Enviar a domicilio".
const TEXT_FIXES = {
  "NUEMRO DE SINIESTRO": "NÚMERO DE SINIESTRO",
  "NOMBRE, TELEFONO Y FIRMA DEL AJUSADOR": "NOMBRE, TELEFONO Y FIRMA DEL AJUSTADOR",
  "Enviar a domicilio        X": "Enviar a domicilio",
  "Tercero             X": "Tercero",
};

// Esta celda mide sólo 1 renglón de alto (igual que en el Excel real,
// donde el texto cabe en una sola línea con Calibri) — con Helvetica
// (más ancha) y el mismo tamaño no alcanza a entrar en el ancho de la
// celda y react-pdf lo trunca con "…" en vez de desbordar. El resto del
// texto fijo ya cabe bien con el factor 0.9 normal; sólo ésta necesita
// un poco más de compresión.
const FONT_SCALE_FIXES = {
  "ESTE PASE EXPIRA 30 DÍAS DESPUÉS DE SU FECHA DE EXPEDICIÓN": 0.82,
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
// hacia blanco/negro — es un ajuste de luminosidad en espacio HSL.
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

// Márgenes objetivo, mismo criterio que en Declaración: minimizar
// espacio en blanco a los lados sin pegar el contenido al borde.
const H_MARGIN_TARGET = 10;
const V_MARGIN_TARGET = 16;

async function extractSheet(wb, sheetName) {
  const ws = wb.getWorksheet(sheetName);

  const colWidthsRaw = [0]; // 1-indexed
  for (let c = 1; c <= ws.columnCount; c++) colWidthsRaw[c] = colWidthToPt(ws.getColumn(c).width);
  const rowHeightsRaw = [0];
  for (let r = 1; r <= ws.rowCount; r++) rowHeightsRaw[r] = ws.getRow(r).height ?? 15;

  const rawContentW = colWidthsRaw.reduce((a, b) => a + b, 0);
  const rawContentH = rowHeightsRaw.reduce((a, b) => a + b, 0);

  // La página está limitada por ALTO (scaleByHeight < scaleByWidth), así
  // que con una sola escala acoplada el ancho se queda muy por debajo de
  // los 10pt de margen objetivo — sobra espacio en blanco a los lados
  // (~29pt en vez de 10pt). Igual que en Carátula de Declaración: se
  // desacopla la escala horizontal (ensancha columnas hasta el margen
  // real) de la vertical (alto de fila / tamaño de letra, sin cambios),
  // así el formato usa el ancho completo de la hoja sin verse más alto.
  const scaleByWidth = (PAGE.w - 2 * H_MARGIN_TARGET) / rawContentW;
  const scaleByHeight = (PAGE.h - 2 * V_MARGIN_TARGET) / rawContentH;
  const scaleX = scaleByWidth;
  const scaleY = scaleByHeight;

  const contentW = rawContentW * scaleX;
  const contentH = rawContentH * scaleY;

  const offsetX = (PAGE.w - contentW) / 2;
  const offsetY = V_MARGIN_TARGET;

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
  function cellInfo(r1, c1, addr) {
    const cell = ws.getCell(r1, c1);
    let text = cell.value != null && typeof cell.value !== "object" ? String(cell.value).trim() : (cell.value?.richText ? cell.value.richText.map((t) => t.text).join("") : null);
    const fill = cell.fill?.pattern === "solid" ? resolveColor(cell.fill.fgColor) : null;
    const isLabel = cell.fill?.pattern === "solid" && cell.fill.fgColor?.argb === LABEL_FILL;
    if (text && !isLabel && !STATIC_KEEP.has(addr)) text = null; // dato de ejemplo horneado -> se vacía
    if (text && TEXT_FIXES[text]) text = TEXT_FIXES[text];
    const font = cell.font ?? {};
    const bold = !!font.bold;
    const fontSizePt = (font.size ?? 11) * scaleY * 0.9 * (FONT_SCALE_FIXES[text] ?? 1);
    const color = resolveColor(font.color) ?? "#000000";
    return { text: text || null, fill, bold, fontSizePt, color };
  }
  function mergeBorder(r1, c1, r2, c2) {
    const top = ws.getCell(r1, c1).border?.top;
    const left = ws.getCell(r1, c1).border?.left;
    const right = ws.getCell(r1, c2).border?.right;
    const bottom = ws.getCell(r2, c1).border?.bottom;
    return { t: borderSide(top), r: borderSide(right), b: borderSide(bottom), l: borderSide(left) };
  }
  function colLetter(c) {
    let s = "";
    while (c > 0) { const m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = Math.floor((c - 1) / 26); }
    return s;
  }

  const rects = [];
  for (const mg of merges) {
    const addr = `${colLetter(mg.c1)}${mg.r1}`;
    const info = cellInfo(mg.r1, mg.c1, addr);
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
      const addr = `${colLetter(c)}${r}`;
      const info = cellInfo(r, c, addr);
      rects.push({
        l: round2(colLeft[c - 1]), t: round2(rowTop[r - 1]),
        w: round2(colLeft[c] - colLeft[c - 1]), h: round2(rowTop[r] - rowTop[r - 1]),
        r1: r - 1, c1: c - 1, r2: r - 1, c2: c - 1,
        ...info, border: mergeBorder(r, c, r, c),
      });
    }
  }
  rects.sort((a, b) => a.t - b.t || a.l - b.l);

  // A42 (teléfono del ajustador, bajo su firma) nunca se llenó en el
  // ejemplo horneado del Excel, así que se quedó con el formato chico
  // de una celda sin usar (fontSize mucho menor) en vez del tamaño real
  // de dato que sí tiene su celda gemela G42 (teléfono del interesado).
  // Se copia el tamaño ya escalado de G42 para que ambos teléfonos de
  // firma se vean del mismo tamaño.
  {
    const a42 = rects.find((r) => r.r1 === 41 && r.c1 === 0);
    const g42 = rects.find((r) => r.r1 === 41 && r.c1 === 6);
    if (a42 && g42) a42.fontSizePt = g42.fontSizePt;
  }

  // Imágenes incrustadas: logo GAMAN (arriba-izq) + 3 diagramas de
  // daños, cada uno repetido una vez en "Daños del Siniestro" y otra
  // en "Daños Preexistentes" (mismo dibujo, dos instancias).
  const images = ws.getImages().map((im) => {
    const tl = im.range.tl, br = im.range.br;
    const l = colLeft[tl.nativeCol] + (tl.nativeColOff / 12700) * scaleX;
    const t = rowTop[tl.nativeRow] + (tl.nativeRowOff / 12700) * scaleY;
    const r = colLeft[br.nativeCol] + (br.nativeColOff / 12700) * scaleX;
    const b = rowTop[br.nativeRow] + (br.nativeRowOff / 12700) * scaleY;
    return { l: round2(l), t: round2(t), w: round2(r - l), h: round2(b - t), imageId: im.imageId };
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
    const side = (s) => `{w:${s.w},c:${JSON.stringify(s.c)}}`;
    parts.push(`border:{t:${side(r.border.t)},r:${side(r.border.r)},b:${side(r.border.b)},l:${side(r.border.l)}}`);
    return `{${parts.join(",")}}`;
  }).join(",\n");
}

// Logo GAMAN = la imagen anclada arriba-izquierda (A1:F5). Diagramas de
// daños: los otros 6, agrupados por imageId (3 dibujos distintos x 2
// secciones). Se separan por posición vertical: los de arriba (t menor)
// son "Daños del Siniestro", los de abajo "Daños Preexistentes".
const sorted = [...sheet.images].sort((a, b) => a.t - b.t || a.l - b.l);
const logo = sorted.find((im) => im.l < 20 && im.t < 20) ?? sorted[0];
const resto = sorted.filter((im) => im !== logo).sort((a, b) => a.t - b.t || a.l - b.l);
const mitad = resto.length / 2;
const diagramasSiniestro = resto.slice(0, mitad).sort((a, b) => a.l - b.l);
const diagramasPreexistentes = resto.slice(mitad).sort((a, b) => a.l - b.l);

const out = `// Auto-generado desde archivos_apoyo/pase_taller/EXCEL.xlsx
// (no editar a mano — regenerar con: node scripts/generar-pase-taller-grid.mjs)
// Página real de impresión: Carta 612x792pt (8.5x11in), confirmada
// contra archivos_apoyo/pase_taller/pdf.pdf.

export const PAGE_SIZE = { w: 612, h: 792 };
export const CONTENT_SIZE = ${JSON.stringify(sheet.size)};

export const LOGO = ${JSON.stringify({ l: logo.l, t: logo.t, w: logo.w, h: logo.h })};
export const DIAGRAMAS_SINIESTRO = ${JSON.stringify(diagramasSiniestro.map(({ l, t, w, h }) => ({ l, t, w, h })))};
export const DIAGRAMAS_PREEXISTENTES = ${JSON.stringify(diagramasPreexistentes.map(({ l, t, w, h }) => ({ l, t, w, h })))};

export const RECTS = [
${serializeRects(sheet.rects)}
];
`;

fs.writeFileSync(OUT, out);
console.log("Escrito", OUT);
console.log("size:", sheet.size, "rects:", sheet.rects.length, "images:", sheet.images.length);
console.log("logo:", logo);
console.log("diagramas siniestro:", diagramasSiniestro.length, "preexistentes:", diagramasPreexistentes.length);
