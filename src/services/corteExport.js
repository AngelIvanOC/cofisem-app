import * as XLSX from "xlsx-js-style";

/*
 * Exportador del Corte Diario a Excel.
 *
 * El diseño (colores, encabezados agrupados, cajas de "OFICINA EMISORA" /
 * "FECHA DE CORTE", tabla de aseguradoras, tabla de gastos, etc.) está
 * calcado del formato oficial que ya se usaba en Excel (archivo
 * "CORTE_DIARIO_EXCEL...xls"), para que el archivo que genera el sistema
 * se vea igual al que ya conocen los operadores y administración.
 */

const n = (v) => {
  const num = Number.parseFloat(v);
  return Number.isFinite(num) ? num : 0;
};

const MONEY_FORMAT = "$#,##0.00";
const DATE_FORMAT = "dd/mm/yyyy";

// ---------------------------------------------------------------------
// Estilos base — colores y fuentes tomados del formato oficial
// ---------------------------------------------------------------------

const BORDER_THIN = {
  top: { style: "thin", color: { rgb: "FF808080" } },
  bottom: { style: "thin", color: { rgb: "FF808080" } },
  left: { style: "thin", color: { rgb: "FF808080" } },
  right: { style: "thin", color: { rgb: "FF808080" } },
};

const BORDER_MEDIUM = {
  top: { style: "medium", color: { rgb: "FF404040" } },
  bottom: { style: "medium", color: { rgb: "FF404040" } },
  left: { style: "medium", color: { rgb: "FF404040" } },
  right: { style: "medium", color: { rgb: "FF404040" } },
};

const FILL_HEADER = { fgColor: { rgb: "FFC0C0C0" } }; // gris — encabezados de tabla
const FILL_LABEL = { fgColor: { rgb: "FFCCCCFF" } }; // lila — etiquetas (Oficina, Fecha…)
const FILL_TITLE = { fgColor: { rgb: "FF99CCFF" } }; // azul — título de la hoja de resumen
const FILL_TOTAL = { fgColor: { rgb: "FFFFFFCC" } }; // amarillo — total final destacado
const FILL_CUOTA = { fgColor: { rgb: "FFFFF3E0" } }; // ámbar claro — pagos subsecuentes

const FONT_HEADER = { name: "Arial", sz: 9, bold: true, color: { rgb: "FF000000" } };
const FONT_BODY = { name: "Arial", sz: 8, color: { rgb: "FF000000" } };
const FONT_BODY_BOLD = { name: "Arial", sz: 8, bold: true, color: { rgb: "FF000000" } };
const FONT_LABEL = { name: "Arial", sz: 10, color: { rgb: "FF000000" } };
const FONT_LABEL_BOLD = { name: "Arial", sz: 10, bold: true, color: { rgb: "FF000000" } };
const FONT_TITLE = { name: "Arial", sz: 12, bold: true, color: { rgb: "FF000000" } };

function escribir(ws, ref, value, style, numFmt) {
  const t = typeof value === "number" ? "n" : value instanceof Date ? "d" : "s";
  ws[ref] = { v: value, t };
  if (style) ws[ref].s = style;
  if (numFmt) ws[ref].z = numFmt;
  return ws[ref];
}

function aplicarEstilo(ws, ref, style) {
  if (!ws[ref]) ws[ref] = { t: "s", v: "" };
  ws[ref].s = { ...(ws[ref].s || {}), ...style };
}

function establecerAnchos(ws, anchos) {
  ws["!cols"] = anchos.map((wch) => ({ wch }));
}

function fechaComoExcel(v) {
  if (!v) return "";
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d;
}

// ---------------------------------------------------------------------
// HOJA 1 — PÓLIZAS
// ---------------------------------------------------------------------

// Los grupos reproducen exactamente los que ya se ven en la tabla del
// sistema (Vigencia, Uso / Vehículo, Tipo de Pago, Respaldo), igual que
// el Excel de referencia agrupa "USO" en Placas/Tipo.
const GRUPOS = {
  VIGENCIA: "Vigencia",
  USO: "Uso / Vehículo",
  PAGO: "Tipo de Pago",
  RESPALDO: "Respaldo",
};

const COLUMNAS = [
  { header: "No.", key: "no", tipo: "num" },
  { header: "Aseguradora", key: "aseguradora", tipo: "code" },
  { header: "Póliza", key: "numero_poliza", tipo: "code" },
  { header: "F. Emisión", key: "fecha_emision", tipo: "fecha" },
  { header: "Inicio", key: "vigencia_inicio", tipo: "fecha", grupo: "VIGENCIA" },
  { header: "Fin", key: "vigencia_fin", tipo: "fecha", grupo: "VIGENCIA" },
  { header: "Folio", key: "folio", tipo: "code" },
  { header: "Vendedor", key: "vendedor_nombre", tipo: "texto" },
  { header: "Asegurado", key: "asegurado_nombre", tipo: "texto" },
  { header: "Vale $", key: "vale", tipo: "dinero" },
  { header: "Prima T. Anual", key: "prima_anual", tipo: "dinero" },
  { header: "Prima Neta Anual", key: "prima_neta", tipo: "dinero" },
  { header: "Cuota", key: "num_cuota_pago", tipo: "num" },
  { header: "Prima T. Pago", key: "prima_primer_pago", tipo: "dinero" },
  { header: "Cobertura", key: "cobertura", tipo: "code" },
  { header: "Placas", key: "placas", tipo: "code", grupo: "USO" },
  { header: "Tipo", key: "tipo", tipo: "code", grupo: "USO" },
  { header: "Uso", key: "uso", tipo: "code", grupo: "USO" },
  { header: "Servicio", key: "servicio", tipo: "code", grupo: "USO" },
  { header: "Forma Pago", key: "forma_pago", tipo: "texto" },
  { header: "Efectivo", key: "efectivo", tipo: "dinero", grupo: "PAGO" },
  { header: "Cheq/Dep", key: "cheque", tipo: "dinero", grupo: "PAGO" },
  { header: "TDC", key: "tdc", tipo: "dinero", grupo: "PAGO" },
  { header: "Autorización", key: "autorizacion", tipo: "texto", grupo: "PAGO" },
  { header: "Pól. Pend. Pago", key: "pol_pend_pago", tipo: "dinero" },
  { header: "Teléfono", key: "telefono", tipo: "code" },
  { header: "Observaciones", key: "observaciones", tipo: "texto" },
  { header: "Fotos", key: "fotos_url", tipo: "doc", grupo: "RESPALDO" },
  { header: "Fact.", key: "factura_url", tipo: "doc", grupo: "RESPALDO" },
  { header: "T. Circ.", key: "t_circ_url", tipo: "doc", grupo: "RESPALDO" },
  { header: "Identif.", key: "identif_url", tipo: "doc", grupo: "RESPALDO" },
  { header: "Pol. Ant.", key: "pol_ant_url", tipo: "doc", grupo: "RESPALDO" },
  { header: "Otro", key: "otro_url", tipo: "doc", grupo: "RESPALDO" },
  { header: "Completado", key: "completado", tipo: "bool" },
];

const ANCHOS_POLIZAS = [
  4, 12, 13, 11, 11, 11, 9, 13, 30, 10, 13, 14, 7, 13, 11, 10, 10, 10, 10, 10,
  11, 11, 11, 12, 12, 12, 22, 7, 7, 8, 8, 8, 7, 10,
];

function valorColumna(r, col, index) {
  if (col.key === "no") return index + 1;
  const raw = r?.[col.key];
  switch (col.tipo) {
    case "dinero":
      return n(raw);
    case "fecha":
      return raw ? fechaComoExcel(raw) : "";
    case "doc":
      return raw ? "XXX" : "-";
    case "bool":
      return raw ? "Sí" : "No";
    case "num":
      return col.key === "num_cuota_pago" ? raw ?? 1 : raw ?? "";
    default:
      return raw ?? "";
  }
}

function alineacionColumna(tipo) {
  if (tipo === "dinero") return "right";
  if (tipo === "texto") return "left";
  return "center";
}

// Construye las dos filas de encabezado (grupo + subcolumna), igual que
// "USO" -> "Placas"/"Tipo" en el Excel de referencia, y regresa los merges
// que hay que aplicar (tanto los de grupo como los verticales de las
// columnas que no tienen subdivisión).
function construirEncabezadoTabla(ws, filaGrupo, filaSub) {
  const merges = [];
  let c = 0;
  while (c < COLUMNAS.length) {
    const col = COLUMNAS[c];
    if (col.grupo) {
      let fin = c;
      while (fin + 1 < COLUMNAS.length && COLUMNAS[fin + 1].grupo === col.grupo) fin++;

      const refGrupo = XLSX.utils.encode_cell({ r: filaGrupo - 1, c });
      escribir(ws, refGrupo, GRUPOS[col.grupo], {
        font: FONT_HEADER,
        fill: FILL_HEADER,
        alignment: { horizontal: "center", vertical: "center" },
        border: BORDER_MEDIUM,
      });
      if (fin > c) merges.push({ s: { r: filaGrupo - 1, c }, e: { r: filaGrupo - 1, c: fin } });

      for (let cc = c; cc <= fin; cc++) {
        const refSub = XLSX.utils.encode_cell({ r: filaSub - 1, c: cc });
        escribir(ws, refSub, COLUMNAS[cc].header, {
          font: FONT_HEADER,
          fill: FILL_HEADER,
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: BORDER_THIN,
        });
      }
      c = fin + 1;
    } else {
      const refGrupo = XLSX.utils.encode_cell({ r: filaGrupo - 1, c });
      escribir(ws, refGrupo, col.header, {
        font: FONT_HEADER,
        fill: FILL_HEADER,
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: BORDER_MEDIUM,
      });
      const refSub = XLSX.utils.encode_cell({ r: filaSub - 1, c });
      escribir(ws, refSub, "", { font: FONT_HEADER, fill: FILL_HEADER, border: BORDER_THIN });
      merges.push({ s: { r: filaGrupo - 1, c }, e: { r: filaSub - 1, c } });
      c++;
    }
  }
  return merges;
}

function construirHojaPolizas({ registros, oficina, fechaLabel, generadoPor, totales }) {
  const ws = {};
  const numCols = COLUMNAS.length;
  const lastCol = numCols - 1;
  const lastColLetter = XLSX.utils.encode_col(lastCol);
  const merges = [];

  // ---- Cajas superiores: Oficina emisora / Generado por / Fecha ----
  escribir(ws, "A1", "OFICINA EMISORA", {
    font: FONT_LABEL,
    fill: FILL_LABEL,
    alignment: { horizontal: "left", vertical: "center" },
    border: BORDER_THIN,
  });
  escribir(ws, "D1", oficina || "COFISEM", {
    font: FONT_TITLE,
    alignment: { horizontal: "center", vertical: "center" },
    border: BORDER_THIN,
  });
  escribir(ws, "J1", "GENERADO POR:", {
    font: FONT_LABEL,
    fill: FILL_LABEL,
    alignment: { horizontal: "left", vertical: "center" },
    border: BORDER_THIN,
  });
  escribir(ws, "L1", generadoPor || "—", {
    font: FONT_LABEL_BOLD,
    alignment: { horizontal: "center", vertical: "center" },
    border: BORDER_THIN,
  });

  escribir(ws, "A3", "FECHA DE CORTE", {
    font: FONT_LABEL,
    fill: FILL_LABEL,
    alignment: { horizontal: "left", vertical: "center" },
    border: BORDER_THIN,
  });
  escribir(ws, "D3", fechaLabel || "", {
    font: FONT_TITLE,
    alignment: { horizontal: "center", vertical: "center" },
    border: BORDER_THIN,
  });
  escribir(ws, "J3", "PÓLIZAS REGISTRADAS", {
    font: FONT_LABEL,
    fill: FILL_LABEL,
    alignment: { horizontal: "left", vertical: "center" },
    border: BORDER_THIN,
  });
  escribir(ws, "L3", registros.length, {
    font: FONT_LABEL_BOLD,
    alignment: { horizontal: "center", vertical: "center" },
    border: BORDER_THIN,
  });

  merges.push(
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, // A1:C1
    { s: { r: 0, c: 3 }, e: { r: 0, c: 8 } }, // D1:I1
    { s: { r: 0, c: 9 }, e: { r: 0, c: 10 } }, // J1:K1
    { s: { r: 0, c: 11 }, e: { r: 0, c: 14 } }, // L1:O1
    { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } },
    { s: { r: 2, c: 3 }, e: { r: 2, c: 8 } },
    { s: { r: 2, c: 9 }, e: { r: 2, c: 10 } },
    { s: { r: 2, c: 11 }, e: { r: 2, c: 14 } },
  );

  // ---- Encabezado de tabla (fila 5 = grupo, fila 6 = subcolumna) ----
  const filaGrupo = 5;
  const filaSub = 6;
  const filaDatosInicio = 7;
  merges.push(...construirEncabezadoTabla(ws, filaGrupo, filaSub));

  // ---- Filas de datos ----
  registros.forEach((r, i) => {
    const fila = filaDatosInicio + i;
    COLUMNAS.forEach((col, c) => {
      const ref = XLSX.utils.encode_cell({ r: fila - 1, c });
      const valor = valorColumna(r, col, i);
      const style = {
        font: FONT_BODY_BOLD,
        alignment: {
          horizontal: alineacionColumna(col.tipo),
          vertical: "center",
          wrapText: col.tipo === "texto",
        },
        border: BORDER_THIN,
        fill: r._esCuotaSubsecuente ? FILL_CUOTA : undefined,
      };
      escribir(
        ws,
        ref,
        valor,
        style,
        col.tipo === "dinero" ? MONEY_FORMAT : col.tipo === "fecha" ? DATE_FORMAT : undefined,
      );
    });
  });

  const filaDatosFin = Math.max(filaDatosInicio, filaDatosInicio + registros.length - 1);

  // ---- Fila TOTAL ----
  const filaTotal = filaDatosFin + 1;
  const sumasPorClave = {
    vale: n(totales?.vale),
    prima_anual: n(totales?.primaAnual),
    prima_neta: n(totales?.primaNeta),
    prima_primer_pago: n(totales?.primerPago),
    efectivo: n(totales?.efectivo),
    cheque: n(totales?.cheque),
    tdc: n(totales?.tdc),
    pol_pend_pago: n(totales?.polPendPago),
  };

  merges.push({ s: { r: filaTotal - 1, c: 0 }, e: { r: filaTotal - 1, c: 8 } });
  escribir(ws, XLSX.utils.encode_cell({ r: filaTotal - 1, c: 0 }), "TOTAL", {
    font: FONT_BODY_BOLD,
    fill: FILL_HEADER,
    alignment: { horizontal: "right", vertical: "center" },
    border: BORDER_MEDIUM,
  });

  COLUMNAS.forEach((col, c) => {
    if (c <= 8) {
      if (c > 0) {
        escribir(ws, XLSX.utils.encode_cell({ r: filaTotal - 1, c }), "", {
          fill: FILL_HEADER,
          border: BORDER_MEDIUM,
        });
      }
      return;
    }
    const ref = XLSX.utils.encode_cell({ r: filaTotal - 1, c });
    const valor = sumasPorClave[col.key];
    if (valor !== undefined) {
      escribir(
        ws,
        ref,
        valor,
        {
          font: FONT_BODY_BOLD,
          fill: FILL_HEADER,
          alignment: { horizontal: "right", vertical: "center" },
          border: BORDER_MEDIUM,
        },
        MONEY_FORMAT,
      );
    } else {
      escribir(ws, ref, "", { fill: FILL_HEADER, border: BORDER_MEDIUM });
    }
  });

  // ---- Resumen de cobro / Corte de efectivo (igual a lo que ya se ve
  //      en pantalla, para no perder ese dato al exportar) ----
  const filaResumenInicio = filaTotal + 3;

  escribir(ws, XLSX.utils.encode_cell({ r: filaResumenInicio - 1, c: 0 }), "RESUMEN DE COBRO", {
    font: FONT_HEADER,
    fill: FILL_HEADER,
    border: BORDER_THIN,
    alignment: { horizontal: "left", vertical: "center" },
  });
  merges.push({ s: { r: filaResumenInicio - 1, c: 0 }, e: { r: filaResumenInicio - 1, c: 1 } });

  const resumenFilas = [
    ["Efectivo", n(totales?.efectivo), false],
    ["Vales", n(totales?.vale), false],
    ["Gastos", n(totales?.gastos), false],
    ["Subtotal efectivo", n(totales?.subEfectivo), false],
    ["T. Crédito/Débito", n(totales?.tdc), false],
    ["Cheques/Depósitos", n(totales?.cheque), false],
    ["TOTAL COBRADO", n(totales?.totalCobro), true],
    ["Pólizas pend. pago", n(totales?.polPendPago), false],
  ];
  resumenFilas.forEach(([label, valor, esTotal], idx) => {
    const fila = filaResumenInicio + 1 + idx;
    escribir(ws, XLSX.utils.encode_cell({ r: fila - 1, c: 0 }), label, {
      font: esTotal ? FONT_BODY_BOLD : FONT_BODY,
      border: BORDER_THIN,
      alignment: { horizontal: "left", vertical: "center" },
    });
    escribir(
      ws,
      XLSX.utils.encode_cell({ r: fila - 1, c: 1 }),
      valor,
      {
        font: esTotal ? FONT_BODY_BOLD : FONT_BODY,
        border: BORDER_THIN,
        alignment: { horizontal: "right", vertical: "center" },
        fill: esTotal ? FILL_TOTAL : undefined,
      },
      MONEY_FORMAT,
    );
  });

  escribir(ws, XLSX.utils.encode_cell({ r: filaResumenInicio - 1, c: 3 }), "CORTE DE EFECTIVO", {
    font: FONT_HEADER,
    fill: FILL_HEADER,
    border: BORDER_THIN,
    alignment: { horizontal: "left", vertical: "center" },
  });
  merges.push({ s: { r: filaResumenInicio - 1, c: 3 }, e: { r: filaResumenInicio - 1, c: 4 } });

  const billetesFilas = [
    ["Total billetes", n(totales?.totalBilletes), false],
    ["Total cobrado", n(totales?.totalCobro), false],
    ["Diferencia", n(totales?.diferencia), true],
  ];
  billetesFilas.forEach(([label, valor, esDif], idx) => {
    const fila = filaResumenInicio + 1 + idx;
    escribir(ws, XLSX.utils.encode_cell({ r: fila - 1, c: 3 }), label, {
      font: FONT_BODY,
      border: BORDER_THIN,
      alignment: { horizontal: "left", vertical: "center" },
    });
    escribir(
      ws,
      XLSX.utils.encode_cell({ r: fila - 1, c: 4 }),
      valor,
      {
        font: FONT_BODY_BOLD,
        border: BORDER_THIN,
        alignment: { horizontal: "right", vertical: "center" },
        fill: esDif ? FILL_TOTAL : undefined,
      },
      MONEY_FORMAT,
    );
  });

  // ---- Pie: Elaboró ----
  const filaFooter =
    Math.max(filaResumenInicio + resumenFilas.length, filaResumenInicio + billetesFilas.length) + 2;
  escribir(ws, XLSX.utils.encode_cell({ r: filaFooter - 1, c: 0 }), "Elaboró:", {
    font: FONT_LABEL,
    alignment: { horizontal: "left", vertical: "center" },
  });
  escribir(ws, XLSX.utils.encode_cell({ r: filaFooter - 1, c: 1 }), generadoPor || "—", {
    font: FONT_LABEL_BOLD,
    alignment: { horizontal: "left", vertical: "center" },
  });

  const ultimaFila = filaFooter;

  ws["!merges"] = merges;
  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: ultimaFila - 1, c: lastCol } });

  ws["!freeze"] = { xSplit: 0, ySplit: filaSub };
  ws["!autofilter"] = { ref: `A${filaSub}:${lastColLetter}${filaDatosFin}` };

  establecerAnchos(ws, ANCHOS_POLIZAS);

  ws["!rows"] = [{ hpt: 16 }, { hpt: 8 }, { hpt: 16 }, { hpt: 8 }, { hpt: 22 }, { hpt: 30 }];

  ws["!pageSetup"] = { orientation: "landscape", fitToWidth: 1, fitToHeight: 0 };

  return ws;
}

// ---------------------------------------------------------------------
// HOJA 2 — RESUMEN
// ---------------------------------------------------------------------

// Lista fija de aseguradoras que siempre debe aparecer en el resumen
// (tomada del formato oficial), aunque no haya tenido ventas ese día.
// Cualquier aseguradora nueva que aparezca en los registros y no esté
// en esta lista se agrega automáticamente al final.
const ASEGURADORAS_FIJAS = [
  "QUALITAS",
  "BANORTE",
  "AFIRME",
  "LATINO",
  "ANA",
  "SURA",
  "ATLAS",
  "MAPFRE",
  "HDI",
  "GAMAN",
];

function agruparPorAseguradora(registros) {
  const mapa = new Map();

  ASEGURADORAS_FIJAS.forEach((nombre) => {
    mapa.set(nombre, { aseguradora: nombre, efectivo: 0, vale: 0, cheque: 0, tdc: 0, polPendPago: 0 });
  });

  for (const r of registros) {
    const nombre = String(r?.aseguradora || "SIN ASEGURADORA").trim().toUpperCase() || "SIN ASEGURADORA";

    if (!mapa.has(nombre)) {
      mapa.set(nombre, { aseguradora: nombre, efectivo: 0, vale: 0, cheque: 0, tdc: 0, polPendPago: 0 });
    }

    const item = mapa.get(nombre);
    item.efectivo += n(r?.efectivo);
    item.vale += n(r?.vale);
    item.cheque += n(r?.cheque);
    item.tdc += n(r?.tdc);
    item.polPendPago += n(r?.pol_pend_pago);
  }

  const fijas = ASEGURADORAS_FIJAS.map((nombre) => mapa.get(nombre));
  const extras = [...mapa.entries()]
    .filter(([nombre]) => !ASEGURADORAS_FIJAS.includes(nombre))
    .map(([, valor]) => valor)
    .sort((a, b) => a.aseguradora.localeCompare(b.aseguradora, "es"));

  return [...fijas, ...extras];
}

function construirHojaResumen({ registros, oficina, fechaLabel, totales, generadoPor }) {
  const grupos = agruparPorAseguradora(registros);
  const ws = {};
  const merges = [];

  // ---- Título ----
  escribir(ws, "A3", oficina || "COFISEM TRANSPORTES", {
    font: FONT_TITLE,
    fill: FILL_TITLE,
    alignment: { horizontal: "center", vertical: "center" },
    border: BORDER_MEDIUM,
  });
  merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: 6 } });

  escribir(ws, "F5", "FECHA", {
    font: FONT_LABEL,
    fill: FILL_LABEL,
    alignment: { horizontal: "center", vertical: "center" },
    border: BORDER_THIN,
  });
  escribir(ws, "G5", fechaLabel || new Date(), {
    font: FONT_TITLE,
    alignment: { horizontal: "center", vertical: "center" },
    border: BORDER_THIN,
  });

  // ---- Encabezado de la tabla por aseguradora ----
  const encabezados = [
    "Aseguradora",
    "Efectivo",
    "Total\nEfectivo",
    "Gastos",
    "SUBTOTAL\nEFECTIVO",
    "Tarjeta de\nCrédito",
    "Cheques\nDepósitos",
    "TOTAL",
    "Pol. Pend\nPago",
  ];
  const filaEncabezado = 8;
  encabezados.forEach((h, c) => {
    const ref = XLSX.utils.encode_cell({ r: filaEncabezado - 1, c });
    escribir(ws, ref, h, {
      font: FONT_HEADER,
      fill: FILL_HEADER,
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: BORDER_MEDIUM,
    });
    merges.push({ s: { r: filaEncabezado - 1, c }, e: { r: filaEncabezado, c } });
  });

  // ---- Filas por aseguradora ----
  const filaInicio = filaEncabezado + 2;
  grupos.forEach((g, index) => {
    const fila = filaInicio + index;
    const totalEfectivo = g.efectivo + g.vale;
    const gastosFila = 0;
    const subtotalEfectivo = totalEfectivo - gastosFila;
    const total = subtotalEfectivo + g.tdc + g.cheque;

    const valores = [g.aseguradora, g.efectivo, totalEfectivo, gastosFila, subtotalEfectivo, g.tdc, g.cheque, total, g.polPendPago];

    valores.forEach((valor, c) => {
      const ref = XLSX.utils.encode_cell({ r: fila - 1, c });
      escribir(
        ws,
        ref,
        valor,
        {
          font: FONT_BODY,
          alignment: { horizontal: c === 0 ? "left" : "right", vertical: "center" },
          border: BORDER_THIN,
        },
        c > 0 ? MONEY_FORMAT : undefined,
      );
    });
  });

  // ---- TOTAL general ----
  const filaTotal = filaInicio + grupos.length;
  const totalEfectivo = n(totales?.efectivo);
  const totalVale = n(totales?.vale);
  const totalCheque = n(totales?.cheque);
  const totalTdc = n(totales?.tdc);
  const totalPendiente = n(totales?.polPendPago);
  const totalEfectivoConVales = totalEfectivo + totalVale;
  const gastosGenerales = n(totales?.gastos);
  const subtotalEfectivoGeneral = n(totales?.subEfectivo) || totalEfectivoConVales - gastosGenerales;
  const totalCobradoGeneral = n(totales?.totalCobro) || subtotalEfectivoGeneral + totalTdc + totalCheque;

  const filaTotalValores = [
    "TOTAL",
    totalEfectivo,
    totalEfectivoConVales,
    gastosGenerales,
    subtotalEfectivoGeneral,
    totalTdc,
    totalCheque,
    totalCobradoGeneral,
    totalPendiente,
  ];
  filaTotalValores.forEach((valor, c) => {
    const ref = XLSX.utils.encode_cell({ r: filaTotal - 1, c });
    escribir(
      ws,
      ref,
      valor,
      {
        font: FONT_BODY_BOLD,
        alignment: { horizontal: c === 0 ? "left" : "right", vertical: "center" },
        border: BORDER_MEDIUM,
      },
      c > 0 ? MONEY_FORMAT : undefined,
    );
  });

  // ---- Tabla de GASTOS ----
  const filaGastosTitulo = filaTotal + 3;
  const filaGastosInicio = filaGastosTitulo + 1;
  const NUM_FILAS_GASTOS = 5;
  const filaGastosTotal = filaGastosInicio + NUM_FILAS_GASTOS;

  const encabezadosGastos = ["GASTOS", "IMPORTE", "IMPORTE", "TOTAL", "COMENTARIO"];
  encabezadosGastos.forEach((h, c) => {
    const ref = XLSX.utils.encode_cell({ r: filaGastosTitulo - 1, c });
    escribir(ws, ref, h, {
      font: FONT_HEADER,
      fill: FILL_HEADER,
      alignment: { horizontal: c === 0 || c === 4 ? "left" : "center", vertical: "center", wrapText: true },
      border: BORDER_THIN,
    });
  });
  merges.push({ s: { r: filaGastosTitulo - 1, c: 4 }, e: { r: filaGastosTitulo - 1, c: 6 } });

  for (let i = 0; i < NUM_FILAS_GASTOS; i++) {
    const fila = filaGastosInicio + i;
    const esPrimera = i === 0;
    const importe = esPrimera ? gastosGenerales : 0;
    const comentario = esPrimera ? "Gastos registrados en el corte" : "";

    escribir(ws, XLSX.utils.encode_cell({ r: fila - 1, c: 0 }), esPrimera ? "Gastos del corte" : "", {
      font: FONT_BODY,
      border: BORDER_THIN,
      alignment: { horizontal: "left", vertical: "center" },
    });
    escribir(
      ws,
      XLSX.utils.encode_cell({ r: fila - 1, c: 1 }),
      importe,
      { font: FONT_BODY, border: BORDER_THIN, alignment: { horizontal: "right", vertical: "center" } },
      MONEY_FORMAT,
    );
    escribir(
      ws,
      XLSX.utils.encode_cell({ r: fila - 1, c: 2 }),
      0,
      { font: FONT_BODY, border: BORDER_THIN, alignment: { horizontal: "right", vertical: "center" } },
      MONEY_FORMAT,
    );
    escribir(
      ws,
      XLSX.utils.encode_cell({ r: fila - 1, c: 3 }),
      importe,
      { font: FONT_BODY, border: BORDER_THIN, alignment: { horizontal: "right", vertical: "center" } },
      MONEY_FORMAT,
    );
    escribir(ws, XLSX.utils.encode_cell({ r: fila - 1, c: 4 }), comentario, {
      font: FONT_BODY,
      border: BORDER_THIN,
      alignment: { horizontal: "left", vertical: "center", wrapText: true },
    });
    merges.push({ s: { r: fila - 1, c: 4 }, e: { r: fila - 1, c: 6 } });
  }

  ["TOTAL", gastosGenerales, 0, gastosGenerales].forEach((valor, c) => {
    const ref = XLSX.utils.encode_cell({ r: filaGastosTotal - 1, c });
    escribir(
      ws,
      ref,
      valor,
      {
        font: FONT_BODY_BOLD,
        alignment: { horizontal: c === 0 ? "left" : "right", vertical: "center" },
        border: BORDER_MEDIUM,
      },
      c > 0 ? MONEY_FORMAT : undefined,
    );
  });

  // ---- TOTAL EFECTIVO final ----
  const filaEfectivoFinal = filaGastosTotal + 3;
  const totalEfectivoFinal = subtotalEfectivoGeneral - gastosGenerales;

  escribir(ws, XLSX.utils.encode_cell({ r: filaEfectivoFinal - 1, c: 0 }), "TOTAL EFECTIVO", {
    font: FONT_BODY_BOLD,
    alignment: { horizontal: "left", vertical: "center" },
    border: BORDER_MEDIUM,
  });
  escribir(
    ws,
    XLSX.utils.encode_cell({ r: filaEfectivoFinal - 1, c: 3 }),
    totalEfectivoFinal,
    {
      font: FONT_BODY_BOLD,
      fill: FILL_TOTAL,
      alignment: { horizontal: "right", vertical: "center" },
      border: BORDER_MEDIUM,
    },
    MONEY_FORMAT,
  );

  // ---- Información adicional ----
  const filaInfo = filaEfectivoFinal + 3;
  const infoFilas = [
    ["PÓLIZAS REGISTRADAS", registros.length, false],
    ["PRIMA TOTAL ANUAL", n(totales?.primaAnual), true],
    ["PRIMA NETA TOTAL", n(totales?.primaNeta), true],
    ["PRIMA TOTAL 1ER PAGO", n(totales?.primerPago), true],
  ];
  infoFilas.forEach(([label, valor, esDinero], idx) => {
    const fila = filaInfo + idx;
    escribir(ws, XLSX.utils.encode_cell({ r: fila - 1, c: 0 }), label, {
      font: FONT_LABEL,
      fill: FILL_LABEL,
      border: BORDER_THIN,
    });
    escribir(
      ws,
      XLSX.utils.encode_cell({ r: fila - 1, c: 1 }),
      valor,
      {
        font: FONT_BODY_BOLD,
        border: BORDER_THIN,
        alignment: { horizontal: esDinero ? "right" : "center" },
      },
      esDinero ? MONEY_FORMAT : undefined,
    );
  });

  // ---- Comentarios y Elaboró ----
  const filaComentarios = filaInfo + infoFilas.length + 2;
  escribir(ws, XLSX.utils.encode_cell({ r: filaComentarios - 1, c: 0 }), "COMENTARIOS:", {
    font: FONT_LABEL,
    alignment: { horizontal: "left", vertical: "center" },
  });

  const filaElaboro = filaComentarios + 3;
  escribir(ws, XLSX.utils.encode_cell({ r: filaElaboro - 1, c: 0 }), "Elaboró:", {
    font: FONT_LABEL,
    alignment: { horizontal: "left", vertical: "center" },
  });
  escribir(ws, XLSX.utils.encode_cell({ r: filaElaboro - 1, c: 1 }), generadoPor || "—", {
    font: FONT_LABEL_BOLD,
    alignment: { horizontal: "left", vertical: "center" },
  });

  ws["!merges"] = merges;
  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: filaElaboro - 1, c: 8 } });

  establecerAnchos(ws, [19, 13, 13, 11, 15, 13, 13, 13, 12]);

  ws["!rows"] = [
    { hpt: 8 },
    { hpt: 8 },
    { hpt: 22 },
    { hpt: 8 },
    { hpt: 18 },
    { hpt: 8 },
    { hpt: 8 },
    { hpt: 28 },
    { hpt: 20 },
  ];

  ws["!pageSetup"] = { orientation: "landscape", fitToWidth: 1, fitToHeight: 1 };

  return ws;
}

// ---------------------------------------------------------------------
// Exportación
// ---------------------------------------------------------------------

export function exportarCorteExcel({
  registros = [],
  oficina,
  fechaLabel,
  fechaIso,
  totales = {},
  generadoPor,
}) {
  const wb = XLSX.utils.book_new();

  const wsPolizas = construirHojaPolizas({ registros, oficina, fechaLabel, generadoPor, totales });
  const wsResumen = construirHojaResumen({ registros, oficina, fechaLabel, totales, generadoPor });

  XLSX.utils.book_append_sheet(wb, wsPolizas, "Pólizas");
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

  const nombreOficina = String(oficina || "corte").replace(/[^\w-]+/g, "_");
  const fechaArchivo = fechaIso || new Date().toISOString().slice(0, 10);

  XLSX.writeFile(wb, `Corte_${nombreOficina}_${fechaArchivo}.xlsx`);
}