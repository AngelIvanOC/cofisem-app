import * as XLSX from "xlsx-js-style";

/*
 * Exportador del Corte Diario a Excel.
 *
 * El diseño (colores, encabezados agrupados, cajas de "OFICINA EMISORA" /
 * "FECHA DE CORTE", tabla de aseguradoras, tabla de gastos, caja de
 * "CORTE" con el conteo de billetes por denominación, etc.) está calcado
 * celda por celda del formato oficial que ya se usaba en Excel — ver
 * CorteExcel/ en la raíz del proyecto — para que el archivo que genera el
 * sistema se vea igual al que ya conocen los operadores y administración.
 * Las columnas que el formato original no tenía (Vigencia Inicio/Fin,
 * Cuota, Prima T. Pago, Uso, Servicio) se agregaron porque el sistema ya
 * las captura; el resto (posiciones, colores, grosor de bordes, tamaños
 * de fila/columna) es intencionalmente idéntico al original.
 */

const n = (v) => {
  const num = Number.parseFloat(v);
  return Number.isFinite(num) ? num : 0;
};

const MONEY_FORMAT = "$#,##0.00";
const DATE_FORMAT = "dd/mm/yyyy";
const DENOMINACIONES = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.5];

// ---------------------------------------------------------------------
// Estilos base — colores y fuentes tomados celda por celda del formato
// oficial (CorteExcel/*.xls) vía COM de Excel.
// ---------------------------------------------------------------------

const BORDER_THIN = {
  top: { style: "thin", color: { rgb: "FF000000" } },
  bottom: { style: "thin", color: { rgb: "FF000000" } },
  left: { style: "thin", color: { rgb: "FF000000" } },
  right: { style: "thin", color: { rgb: "FF000000" } },
};

const BORDER_MEDIUM = {
  top: { style: "medium", color: { rgb: "FF000000" } },
  bottom: { style: "medium", color: { rgb: "FF000000" } },
  left: { style: "medium", color: { rgb: "FF000000" } },
  right: { style: "medium", color: { rgb: "FF000000" } },
};

function borde(top, bottom, left, right) {
  const b = {};
  if (top) b.top = { style: top, color: { rgb: "FF000000" } };
  if (bottom) b.bottom = { style: bottom, color: { rgb: "FF000000" } };
  if (left) b.left = { style: left, color: { rgb: "FF000000" } };
  if (right) b.right = { style: right, color: { rgb: "FF000000" } };
  return b;
}

const FILL_LABEL_H1 = { fgColor: { rgb: "FFC5D9F1" } }; // azul claro — cajas OFICINA/FECHA/GENERADO POR (Hoja 1)
const FILL_HEADER_H1 = { fgColor: { rgb: "FFD9D9D9" } }; // gris claro — encabezados de la tabla de pólizas
const FILL_TITLE_H2 = { fgColor: { rgb: "FF99CCFF" } }; // azul — título de la hoja de resumen
const FILL_HEADER_H2 = { fgColor: { rgb: "FFC0C0C0" } }; // gris — encabezados de la tabla por aseguradora / gastos / FECHA
const FILL_TOTAL = { fgColor: { rgb: "FFFFFFCC" } }; // amarillo — total efectivo final destacado
const FILL_CUOTA = { fgColor: { rgb: "FFFFF3E0" } }; // ámbar claro — pagos subsecuentes (propio del sistema)
const FILL_COMISION = { fgColor: { rgb: "FFFCE4E4" } }; // rojo pastel — filas de comisión (propio del sistema)

const FONT_LABEL_H1 = { name: "Arial", sz: 10, color: { rgb: "FF000000" } };
const FONT_VALUE_H1 = { name: "Arial", sz: 12, bold: true, color: { rgb: "FF000000" } };
const FONT_VALUE_H1_SM = { name: "Arial", sz: 10, bold: true, color: { rgb: "FF000000" } };
const FONT_TABLE_HEADER_H1 = { name: "Arial", sz: 9, bold: true, color: { rgb: "FF000000" } };
const FONT_BODY_H1 = { name: "Arial", sz: 8, bold: true, color: { rgb: "FF000000" } };
const FONT_BODY_H1_PLAIN = { name: "Arial", sz: 8, color: { rgb: "FF000000" } };
const FONT_COMISION = { name: "Arial", sz: 8, bold: true, color: { rgb: "FFB91C1C" } };
const FONT_TOTAL_H1 = { name: "Arial", sz: 10, bold: true, color: { rgb: "FF000000" } };
const FONT_RESUMEN_LABEL = { name: "Arial", sz: 6, color: { rgb: "FF000000" } };
const FONT_RESUMEN_VALUE = { name: "Arial", sz: 7, bold: true, color: { rgb: "FF000000" } };

const FONT_TITLE_H2 = { name: "Arial", sz: 12, bold: true, color: { rgb: "FF000000" } };
const FONT_HEADER_H2 = { name: "Arial", sz: 10, bold: true, color: { rgb: "FF000000" } };
const FONT_BODY_H2 = { name: "Arial", sz: 10, color: { rgb: "FF000000" } };
const FONT_BODY_H2_BOLD = { name: "Arial", sz: 10, bold: true, color: { rgb: "FF000000" } };
const FONT_LABEL_H2 = { name: "Arial", sz: 10, color: { rgb: "FF000000" } };

function escribir(ws, ref, value, style, numFmt) {
  const t = typeof value === "number" ? "n" : value instanceof Date ? "d" : "s";
  ws[ref] = { v: value, t };
  if (style) ws[ref].s = style;
  if (numFmt) ws[ref].z = numFmt;
  return ws[ref];
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
// sistema (Vigencia, Uso / Vehículo, Tipo de Pago, Respaldo) y en el
// Excel de referencia ("TIPO DE PAGO:" y "Respaldo" son grupos textuales
// idénticos ahí).
const GRUPOS = {
  VIGENCIA: "Vigencia",
  USO: "Uso / Vehículo",
  PAGO: "Tipo de Pago",
  RESPALDO: "Respaldo",
};

// Columnas — igual que el formato oficial (No., Aseguradora, Póliza,
// Fecha de emisión, Folio, Vendedor, Asegurado, Prima Total/Neta Anual,
// Cobertura, Uso [Placas/Tipo], luego un segundo "No." que marca el
// arranque de la mitad "Pago y respaldo" — igual que en el Excel de
// referencia, donde esa mitad repite su propia caja de OFICINA
// EMISORA/FECHA/GENERADO POR — seguido de Forma de Pago, Tipo de Pago,
// Pól. Pend. Pago, Teléfono, Observaciones y Respaldo.
// Las columnas marcadas [NUEVA] no existían en el formato original — se
// agregaron porque el sistema ya captura esos datos.
const COLUMNAS = [
  { header: "No.", key: "no", tipo: "num" },
  { header: "Aseguradora", key: "aseguradora", tipo: "code" },
  { header: "Póliza", key: "numero_poliza", tipo: "code" },
  { header: "F. Emisión", key: "fecha_emision", tipo: "fecha" },
  { header: "Inicio", key: "vigencia_inicio", tipo: "fecha", grupo: "VIGENCIA" }, // [NUEVA]
  { header: "Fin", key: "vigencia_fin", tipo: "fecha", grupo: "VIGENCIA" }, // [NUEVA]
  { header: "Folio", key: "folio", tipo: "code" },
  { header: "Vendedor", key: "vendedor_nombre", tipo: "texto" },
  { header: "Asegurado", key: "asegurado_nombre", tipo: "texto" },
  { header: "Prima Total ANUAL", key: "prima_anual", tipo: "dinero" },
  { header: "Prima Neta ANUAL", key: "prima_neta", tipo: "dinero" },
  { header: "Cuota", key: "num_cuota_pago", tipo: "num" }, // [NUEVA]
  { header: "Prima T. Pago", key: "prima_primer_pago", tipo: "dinero" }, // [NUEVA]
  { header: "Cobertura", key: "cobertura", tipo: "code" },
  { header: "Placas", key: "placas", tipo: "code", grupo: "USO" },
  { header: "Tipo", key: "tipo", tipo: "code", grupo: "USO" },
  { header: "Uso", key: "uso", tipo: "code", grupo: "USO" }, // [NUEVA]
  { header: "Servicio", key: "servicio", tipo: "code", grupo: "USO" }, // [NUEVA]
  { header: "No.", key: "no2", tipo: "num" },
  { header: "Forma de Pago", key: "forma_pago", tipo: "texto" },
  { header: "Efectivo", key: "efectivo", tipo: "dinero", grupo: "PAGO" },
  { header: "Cheq/Dep", key: "cheque", tipo: "dinero", grupo: "PAGO" },
  { header: "TDC", key: "tdc", tipo: "dinero", grupo: "PAGO" },
  { header: "AUTORIZACION", key: "autorizacion", tipo: "texto", grupo: "PAGO" },
  { header: "Pend. Pago", key: "pol_pend_pago", tipo: "dinero" },
  { header: "Teléfono", key: "telefono", tipo: "code" },
  { header: "Observaciones", key: "observaciones", tipo: "texto" },
  { header: "FOTOS", key: "fotos_url", tipo: "doc", grupo: "RESPALDO" },
  { header: "FACT.", key: "factura_url", tipo: "doc", grupo: "RESPALDO" },
  { header: "T. CIRC.", key: "t_circ_url", tipo: "doc", grupo: "RESPALDO" },
  { header: "IDENTIF.", key: "identif_url", tipo: "doc", grupo: "RESPALDO" },
  { header: "POL. ANT.", key: "pol_ant_url", tipo: "doc", grupo: "RESPALDO" },
  { header: "OTRO", key: "otro_url", tipo: "doc", grupo: "RESPALDO" },
];

// Anchos (wch) — los del formato original para las columnas que existían
// ahí; para las columnas nuevas se usa un ancho similar al de sus
// vecinas.
const ANCHOS_POLIZAS = [
  3, 11, 11, 9, 9, 9, 6, 11, 34, 10, 10, 6, 10, 9, 6, 9, 9, 11, 3, 9, 9, 9, 9,
  13, 10, 9, 20, 6, 7, 7, 7, 8, 7,
];

const IDX_NO = 0;
const IDX_ASEGURO_INICIO = 1; // primera col después de "No."
const IDX_SERVICIO = COLUMNAS.findIndex((c) => c.key === "servicio");
const IDX_PRIMA_T_PAGO = COLUMNAS.findIndex((c) => c.key === "prima_primer_pago");
const IDX_NO2 = COLUMNAS.findIndex((c) => c.key === "no2");
const IDX_OBSERVACIONES = COLUMNAS.findIndex((c) => c.key === "observaciones");
const IDX_FOTOS = COLUMNAS.findIndex((c) => c.key === "fotos_url");
const IDX_ULTIMA = COLUMNAS.length - 1;

// Columnas que sí aplican a una fila de comisión (vale) — el resto se deja
// en blanco porque una comisión no es una póliza: no tiene efectivo,
// respaldo ni forma de pago propios, solo resta del "Prima T. Pago" (misma
// columna que en pantalla se reutiliza para mostrar el monto en negativo).
const CLAVES_COMISION = new Set([
  "no", "no2", "aseguradora", "numero_poliza", "fecha_emision", "folio",
  "vendedor_nombre", "asegurado_nombre", "prima_primer_pago",
]);

function comisionAFila(c) {
  const pc = c?.polizas_cofisem ?? {};
  return {
    _esComision: true,
    aseguradora: pc.aseguradora,
    numero_poliza: pc.numero_poliza,
    fecha_emision: c?.fecha_pago,
    folio: pc.folio,
    vendedor_nombre: pc.vendedor_nombre,
    asegurado_nombre: pc.asegurado_nombre,
    prima_primer_pago: -n(c?.monto),
  };
}

function valorColumna(r, col, index) {
  if (col.key === "no" || col.key === "no2") return r?._esComision ? "−" : index + 1;
  if (r?._esComision && !CLAVES_COMISION.has(col.key)) return "";
  const raw = r?.[col.key];
  switch (col.tipo) {
    case "dinero":
      return n(raw);
    case "fecha":
      return raw ? fechaComoExcel(raw) : "";
    case "doc":
      return raw ? "XXX" : "-";
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

// Borde de una celda de datos/encabezado según su posición dentro de la
// tabla — igual que el original: borde medio en el contorno exterior de
// la tabla y en las líneas que separan sus grandes secciones (antes del
// segundo "No." y antes de "Respaldo"), delgado en todo lo demás.
function bordeTabla(c, { esTop, esBottom } = {}) {
  const left = c === IDX_NO || c === IDX_NO2 ? "medium" : "thin";
  const right =
    c === IDX_SERVICIO || c === IDX_OBSERVACIONES || c === IDX_ULTIMA
      ? "medium"
      : "thin";
  const top = esTop ? "medium" : "thin";
  const bottom = esBottom ? "medium" : "thin";
  return borde(top, bottom, left, right);
}

// Construye las dos filas de encabezado (grupo + subcolumna), igual que
// "USO" -> "Placas"/"Tipo"/"Uso"/"Servicio" en el Excel de referencia, y
// regresa los merges que hay que aplicar.
function construirEncabezadoTabla(ws, filaGrupo, filaSub) {
  const merges = [];
  let c = 0;
  while (c < COLUMNAS.length) {
    const col = COLUMNAS[c];
    const estilo = {
      font: FONT_TABLE_HEADER_H1,
      fill: FILL_HEADER_H1,
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
    };
    if (col.grupo) {
      let fin = c;
      while (fin + 1 < COLUMNAS.length && COLUMNAS[fin + 1].grupo === col.grupo) fin++;

      const refGrupo = XLSX.utils.encode_cell({ r: filaGrupo - 1, c });
      escribir(ws, refGrupo, GRUPOS[col.grupo], {
        ...estilo,
        border: bordeTabla(c, { esTop: true }),
      });
      if (fin > c) merges.push({ s: { r: filaGrupo - 1, c }, e: { r: filaGrupo - 1, c: fin } });
      for (let cc = c + 1; cc <= fin; cc++) {
        escribir(ws, XLSX.utils.encode_cell({ r: filaGrupo - 1, c: cc }), "", {
          ...estilo,
          border: bordeTabla(cc, { esTop: true }),
        });
      }

      for (let cc = c; cc <= fin; cc++) {
        const refSub = XLSX.utils.encode_cell({ r: filaSub - 1, c: cc });
        escribir(ws, refSub, COLUMNAS[cc].header, {
          ...estilo,
          border: bordeTabla(cc, { esBottom: true }),
        });
      }
      c = fin + 1;
    } else {
      const refGrupo = XLSX.utils.encode_cell({ r: filaGrupo - 1, c });
      escribir(ws, refGrupo, col.header, {
        ...estilo,
        border: bordeTabla(c, { esTop: true }),
      });
      const refSub = XLSX.utils.encode_cell({ r: filaSub - 1, c });
      escribir(ws, refSub, "", { ...estilo, border: bordeTabla(c, { esBottom: true }) });
      merges.push({ s: { r: filaGrupo - 1, c }, e: { r: filaSub - 1, c } });
      c++;
    }
  }
  return merges;
}

// Caja "OFICINA EMISORA / <valor> ... FECHA DE CORTE / <valor> ...
// GENERADO POR / <valor>" — se dibuja dos veces (izquierda y derecha),
// igual que en el formato original, que repetía esta caja para que cada
// mitad de la hoja impresa quedara identificada por sí sola.
function construirCajaEncabezado(ws, merges, { colInicio, colFin, oficina, fechaLabel, generadoPor }) {
  const labelStyle = {
    font: FONT_LABEL_H1,
    fill: FILL_LABEL_H1,
    alignment: { horizontal: "left", vertical: "center" },
    border: BORDER_THIN,
  };
  const valueStyle = (font) => ({
    font,
    alignment: { horizontal: "center", vertical: "bottom" },
    border: BORDER_THIN,
  });

  // labelSpan/valueSpan en columnas — igual que el original: la caja
  // "OFICINA EMISORA"/"FECHA DE CORTE" siempre usa 3+4, y lo que sobra del
  // bloque (colFin - colInicio + 1) después de esas 7 más 1 columna de
  // hueco se lo lleva "GENERADO POR:" (2 de label + el resto de valor) —
  // así la caja izquierda (más angosta) y la derecha (más ancha) terminan
  // con anchos distintos, igual que en el formato original.
  function caja(fila, colIni, labelSpan, valueSpan, texto, valor, font) {
    const labelFin = colIni + labelSpan - 1;
    for (let c = colIni; c <= labelFin; c++) {
      escribir(ws, XLSX.utils.encode_cell({ r: fila - 1, c }), c === colIni ? texto : "", labelStyle);
    }
    if (labelSpan > 1) merges.push({ s: { r: fila - 1, c: colIni }, e: { r: fila - 1, c: labelFin } });
    const valIni = labelFin + 1;
    const valFin = valIni + valueSpan - 1;
    for (let c = valIni; c <= valFin; c++) {
      escribir(ws, XLSX.utils.encode_cell({ r: fila - 1, c }), c === valIni ? valor : "", valueStyle(font));
    }
    if (valueSpan > 1) merges.push({ s: { r: fila - 1, c: valIni }, e: { r: fila - 1, c: valFin } });
    return valFin;
  }

  caja(1, colInicio, 3, 4, "OFICINA EMISORA", oficina || "COFISEM", FONT_VALUE_H1);

  const finFecha = caja(3, colInicio, 3, 4, "FECHA DE CORTE", fechaLabel || "", FONT_VALUE_H1);
  const inicioGenerado = finFecha + 2; // 1 columna de hueco, igual que el original
  const restante = colFin - inicioGenerado + 1;
  if (restante >= 3) {
    caja(3, inicioGenerado, 2, restante - 2, "GENERADO POR:", generadoPor || "—", FONT_VALUE_H1_SM);
  }
}

function construirHojaPolizas({ registros, comisiones = [], billetes = {}, observaciones, oficina, fechaLabel, generadoPor, totales }) {
  const ws = {};
  const numCols = COLUMNAS.length;
  const lastCol = numCols - 1;
  const lastColLetter = XLSX.utils.encode_col(lastCol);
  const merges = [];

  // ---- Cajas superiores: se repiten a la izquierda (cols 0..8, hasta
  //      "Asegurado") y a la derecha (cols IDX_NO2..última), igual que el
  //      formato original repetía la caja en cada mitad de la hoja. ----
  construirCajaEncabezado(ws, merges, {
    colInicio: 0,
    colFin: IDX_PRIMA_T_PAGO,
    oficina,
    fechaLabel,
    generadoPor,
  });
  construirCajaEncabezado(ws, merges, {
    colInicio: IDX_NO2,
    colFin: IDX_ULTIMA,
    oficina,
    fechaLabel,
    generadoPor,
  });

  // ---- Encabezado de tabla (fila 5 = grupo, fila 6 = subcolumna) ----
  const filaGrupo = 5;
  const filaSub = 6;
  const filaDatosInicio = 7;
  merges.push(...construirEncabezadoTabla(ws, filaGrupo, filaSub));

  // ---- Filas de datos — pólizas y, al final, las comisiones (vale) del
  //      día como filas aparte en rojo, con "−" en "No." y el monto en
  //      negativo bajo "Prima T. Pago" (igual que en pantalla). ----
  const filasDatos = [...registros, ...comisiones.map(comisionAFila)];
  filasDatos.forEach((r, i) => {
    const fila = filaDatosInicio + i;
    const esUltima = i === filasDatos.length - 1;
    COLUMNAS.forEach((col, c) => {
      const ref = XLSX.utils.encode_cell({ r: fila - 1, c });
      const valor = valorColumna(r, col, i);
      const esIndice = col.key === "no" || col.key === "no2";
      const style = {
        font: r._esComision ? FONT_COMISION : esIndice ? FONT_BODY_H1_PLAIN : FONT_BODY_H1,
        alignment: {
          horizontal: alineacionColumna(col.tipo),
          vertical: "center",
          wrapText: col.tipo === "texto",
        },
        border: bordeTabla(c, { esBottom: esUltima }),
        fill: r._esComision ? FILL_COMISION : r._esCuotaSubsecuente ? FILL_CUOTA : undefined,
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

  const filaDatosFin = Math.max(filaDatosInicio, filaDatosInicio + filasDatos.length - 1);

  // ---- Fila TOTAL ----
  const filaTotal = filaDatosFin + 1;
  const sumasPorClave = {
    prima_anual: n(totales?.primaAnual),
    prima_neta: n(totales?.primaNeta),
    prima_primer_pago: n(totales?.primerPago),
    efectivo: n(totales?.efectivo),
    cheque: n(totales?.cheque),
    tdc: n(totales?.tdc),
    pol_pend_pago: n(totales?.polPendPago),
  };

  merges.push({ s: { r: filaTotal - 1, c: 0 }, e: { r: filaTotal - 1, c: IDX_ASEGURO_INICIO } });
  escribir(ws, XLSX.utils.encode_cell({ r: filaTotal - 1, c: 0 }), "TOTAL", {
    font: FONT_TOTAL_H1,
    alignment: { horizontal: "right", vertical: "center" },
    border: borde("medium", "medium", "medium", "thin"),
  });

  COLUMNAS.forEach((col, c) => {
    if (c <= IDX_ASEGURO_INICIO) {
      if (c > 0) {
        escribir(ws, XLSX.utils.encode_cell({ r: filaTotal - 1, c }), "", {
          border: borde("medium", "medium", "thin", c === IDX_ASEGURO_INICIO ? "thin" : "thin"),
        });
      }
      return;
    }
    const ref = XLSX.utils.encode_cell({ r: filaTotal - 1, c });
    const valor = sumasPorClave[col.key];
    const b = bordeTabla(c, { esTop: true, esBottom: true });
    if (valor !== undefined) {
      escribir(
        ws,
        ref,
        valor,
        {
          font: FONT_TOTAL_H1,
          alignment: { horizontal: "right", vertical: "center" },
          border: b,
        },
        MONEY_FORMAT,
      );
    } else {
      escribir(ws, ref, "", { border: b });
    }
  });

  // ---- Resumen compacto (Efectivo/Vales/Gastos/Subt./TDC/Cheques/
  //      Total/Pól. Pend.) + conteo de billetes por denominación + caja
  //      de comprobación — reproduce exactamente la caja del formato
  //      original que vivía junto a la tabla, a la derecha del total. ----
  const filaResumenInicio = filaTotal + 2;
  const colResumenLabel = IDX_SERVICIO + 3; // misma columna que "Efectivo" (después del 2do "No." y "Forma de Pago")
  const colResumenValor = colResumenLabel + 1;
  const colBilletesDenom = colResumenLabel + 3;
  const colBilletesCant = colBilletesDenom + 1;
  const colBilletesSub = colBilletesCant + 1;

  const resumenFilas = [
    ["EFECTIVO", n(totales?.efectivo)],
    ["VALES", n(totales?.vale)],
    ["GASTOS", n(totales?.gastos)],
    ["SUBT EFECTIVO", n(totales?.subEfectivo)],
    ["T. CRED O DEB", n(totales?.tdc)],
    ["FICHAS-CHEQUES-TRANSF", n(totales?.cheque)],
    ["TOTAL", n(totales?.totalCobro)],
    ["POL PEND PAGO", n(totales?.polPendPago)],
  ];
  resumenFilas.forEach(([label, valor], idx) => {
    const fila = filaResumenInicio + idx;
    const esUltima = idx === resumenFilas.length - 1;
    escribir(
      ws,
      XLSX.utils.encode_cell({ r: fila - 1, c: colResumenLabel }),
      label,
      {
        font: FONT_RESUMEN_LABEL,
        alignment: { horizontal: "right", vertical: "center" },
        border: borde("thin", esUltima ? "medium" : "thin", "medium", "thin"),
      },
    );
    escribir(
      ws,
      XLSX.utils.encode_cell({ r: fila - 1, c: colResumenValor }),
      valor,
      {
        font: FONT_RESUMEN_VALUE,
        alignment: { horizontal: "left", vertical: "center" },
        border: borde("thin", esUltima ? "medium" : "thin", "thin", "medium"),
      },
      MONEY_FORMAT,
    );
  });

  // ---- Conteo de billetes por denominación ("CORTE") ----
  escribir(
    ws,
    XLSX.utils.encode_cell({ r: filaResumenInicio - 1, c: colBilletesDenom }),
    "CORTE",
    {
      font: FONT_LABEL_H1,
      alignment: { horizontal: "center", vertical: "center" },
      border: borde(undefined, "thin"),
    },
  );
  let totalBilletesCalc = 0;
  DENOMINACIONES.forEach((den, idx) => {
    const fila = filaResumenInicio + 1 + idx;
    const cant = n(billetes?.[den]);
    const sub = cant * den;
    totalBilletesCalc += sub;
    escribir(
      ws,
      XLSX.utils.encode_cell({ r: fila - 1, c: colBilletesDenom }),
      den,
      { font: FONT_BODY_H2, alignment: { horizontal: "center", vertical: "center" }, border: BORDER_THIN },
      MONEY_FORMAT,
    );
    escribir(
      ws,
      XLSX.utils.encode_cell({ r: fila - 1, c: colBilletesCant }),
      cant || "",
      { font: FONT_BODY_H2, alignment: { horizontal: "center", vertical: "center" }, border: BORDER_THIN },
    );
    escribir(
      ws,
      XLSX.utils.encode_cell({ r: fila - 1, c: colBilletesSub }),
      sub,
      { font: FONT_BODY_H2, alignment: { horizontal: "center", vertical: "center" }, border: BORDER_THIN },
      MONEY_FORMAT,
    );
  });
  const filaBilletesTotal = filaResumenInicio + 1 + DENOMINACIONES.length;
  escribir(ws, XLSX.utils.encode_cell({ r: filaBilletesTotal - 1, c: colBilletesCant }), "TOTAL", {
    font: FONT_TOTAL_H1,
    alignment: { horizontal: "right", vertical: "center" },
    border: borde("medium", "medium", "medium", "thin"),
  });
  escribir(
    ws,
    XLSX.utils.encode_cell({ r: filaBilletesTotal - 1, c: colBilletesSub }),
    n(totales?.totalBilletes) || totalBilletesCalc,
    {
      font: FONT_TOTAL_H1,
      alignment: { horizontal: "center", vertical: "center" },
      border: borde("medium", "medium", "thin", "medium"),
    },
    MONEY_FORMAT,
  );

  // ---- Caja de comprobación (billetes contados vs. efectivo esperado) ----
  const filaComprobacion = filaBilletesTotal + 1;
  merges.push({
    s: { r: filaComprobacion - 1, c: colBilletesDenom },
    e: { r: filaComprobacion - 1, c: colBilletesCant },
  });
  escribir(ws, XLSX.utils.encode_cell({ r: filaComprobacion - 1, c: colBilletesDenom }), "COMPROBACION", {
    font: FONT_TOTAL_H1,
    alignment: { horizontal: "center", vertical: "center" },
    border: BORDER_MEDIUM,
  });
  const comprobacionFilas = [
    ["EFECTIVO", n(totales?.efectivo)],
    ["DIFERENCIA", n(totales?.diferencia)],
  ];
  comprobacionFilas.forEach(([label, valor], idx) => {
    const fila = filaComprobacion + 1 + idx;
    escribir(ws, XLSX.utils.encode_cell({ r: fila - 1, c: colBilletesDenom }), label, {
      font: FONT_TOTAL_H1,
      alignment: { horizontal: "right", vertical: "center" },
      border: bordeTabla(colBilletesDenom, { esTop: idx === 0, esBottom: idx === comprobacionFilas.length - 1 }),
    });
    escribir(
      ws,
      XLSX.utils.encode_cell({ r: fila - 1, c: colBilletesCant }),
      valor,
      {
        font: FONT_TOTAL_H1,
        alignment: { horizontal: "center", vertical: "center" },
        border: bordeTabla(colBilletesCant, { esTop: idx === 0, esBottom: idx === comprobacionFilas.length - 1 }),
      },
      MONEY_FORMAT,
    );
  });

  // ---- Observaciones del corte ----
  const filaObservaciones = filaComprobacion + comprobacionFilas.length + 3;
  escribir(ws, XLSX.utils.encode_cell({ r: filaObservaciones - 1, c: 0 }), "Observaciones:", {
    font: FONT_LABEL_H1,
    alignment: { horizontal: "left", vertical: "top" },
  });
  merges.push({ s: { r: filaObservaciones - 1, c: 1 }, e: { r: filaObservaciones - 1, c: 10 } });
  escribir(
    ws,
    XLSX.utils.encode_cell({ r: filaObservaciones - 1, c: 1 }),
    observaciones || "—",
    { font: FONT_BODY_H1_PLAIN, alignment: { horizontal: "left", vertical: "top", wrapText: true } },
  );

  // ---- Pie: Elaboró ----
  const filaFooter = filaObservaciones + 2;
  escribir(ws, XLSX.utils.encode_cell({ r: filaFooter - 1, c: 0 }), "Elaboró:", {
    font: FONT_LABEL_H1,
    alignment: { horizontal: "left", vertical: "center" },
  });
  escribir(ws, XLSX.utils.encode_cell({ r: filaFooter - 1, c: 1 }), generadoPor || "—", {
    font: FONT_VALUE_H1_SM,
    alignment: { horizontal: "left", vertical: "center" },
  });

  const ultimaFila = filaFooter;

  ws["!merges"] = merges;
  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: ultimaFila - 1, c: lastCol } });

  ws["!freeze"] = { xSplit: 0, ySplit: filaSub };
  ws["!autofilter"] = { ref: `A${filaSub}:${lastColLetter}${filaDatosFin}` };

  establecerAnchos(ws, ANCHOS_POLIZAS);

  ws["!rows"] = [{ hpt: 16 }, { hpt: 8 }, { hpt: 16 }, { hpt: 8 }, { hpt: 14 }, { hpt: 12 }];

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

function agruparPorAseguradora(registros, comisiones = []) {
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
    item.cheque += n(r?.cheque);
    item.tdc += n(r?.tdc);
    item.polPendPago += n(r?.pol_pend_pago);
  }

  // Las comisiones (vale) se agrupan por la aseguradora de la póliza a la
  // que pertenecen — ya no viven en polizas_cofisem, sino en su propia
  // tabla comisiones_cofisem, así que se suman aparte.
  for (const c of comisiones) {
    const nombre =
      String(c?.polizas_cofisem?.aseguradora || "SIN ASEGURADORA").trim().toUpperCase() || "SIN ASEGURADORA";
    if (!mapa.has(nombre)) {
      mapa.set(nombre, { aseguradora: nombre, efectivo: 0, vale: 0, cheque: 0, tdc: 0, polPendPago: 0 });
    }
    mapa.get(nombre).vale += n(c?.monto);
  }

  const fijas = ASEGURADORAS_FIJAS.map((nombre) => mapa.get(nombre));
  const extras = [...mapa.entries()]
    .filter(([nombre]) => !ASEGURADORAS_FIJAS.includes(nombre))
    .map(([, valor]) => valor)
    .sort((a, b) => a.aseguradora.localeCompare(b.aseguradora, "es"));

  return [...fijas, ...extras];
}

function construirHojaResumen({ registros, comisiones = [], observaciones, oficina, fechaLabel, totales, generadoPor }) {
  const grupos = agruparPorAseguradora(registros, comisiones);
  const ws = {};
  const merges = [];

  // ---- Título ----
  escribir(ws, "A3", oficina || "COFISEM TRANSPORTES", {
    font: FONT_TITLE_H2,
    fill: FILL_TITLE_H2,
    alignment: { horizontal: "center", vertical: "center" },
    border: BORDER_MEDIUM,
  });
  merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: 6 } });

  escribir(ws, "F5", "FECHA", {
    font: FONT_HEADER_H2,
    fill: FILL_HEADER_H2,
    alignment: { horizontal: "center", vertical: "center" },
    border: BORDER_THIN,
  });
  escribir(ws, "G5", fechaLabel || new Date(), {
    font: FONT_HEADER_H2,
    fill: FILL_HEADER_H2,
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
      font: FONT_HEADER_H2,
      fill: FILL_HEADER_H2,
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: BORDER_MEDIUM,
    });
    merges.push({ s: { r: filaEncabezado - 1, c }, e: { r: filaEncabezado, c } });
  });

  // ---- Filas por aseguradora ----
  const filaInicio = filaEncabezado + 2;
  grupos.forEach((g, index) => {
    const fila = filaInicio + index;
    // Las comisiones (vale) se restan del efectivo, igual que en pantalla.
    const totalEfectivo = g.efectivo - g.vale;
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
          font: FONT_BODY_H2,
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
  // Las comisiones (vale) se restan del efectivo, igual que en pantalla.
  // subEfectivo/totalCobro ya vienen calculados así desde CorteOperador —
  // se usan tal cual (no con `||`, que trataría un 0 legítimo como vacío).
  const totalEfectivoConVales = totalEfectivo - totalVale;
  const gastosGenerales = n(totales?.gastos);
  const subtotalEfectivoGeneral = n(totales?.subEfectivo);
  const totalCobradoGeneral = n(totales?.totalCobro);

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
        font: FONT_BODY_H2_BOLD,
        alignment: { horizontal: c === 0 ? "left" : "right", vertical: "center" },
        border: BORDER_MEDIUM,
      },
      c > 0 ? MONEY_FORMAT : undefined,
    );
  });

  // ---- Tabla de GASTOS — arranca 2 filas después del TOTAL (1 fila en
  //      blanco de por medio), igual que el formato original. ----
  const filaGastosTitulo = filaTotal + 2;
  const filaGastosInicio = filaGastosTitulo + 1;
  const NUM_FILAS_GASTOS = 5;
  // Después de las 5 filas de gastos hay 1 fila en blanco antes del TOTAL,
  // igual que el original (fila 28 en blanco entre la fila 27 y el TOTAL
  // en fila 29).
  const filaGastosTotal = filaGastosInicio + NUM_FILAS_GASTOS + 1;

  const encabezadosGastos = ["GASTOS", "IMPORTE", "IMPORTE", "TOTAL", "COMENTARIO"];
  encabezadosGastos.forEach((h, c) => {
    const ref = XLSX.utils.encode_cell({ r: filaGastosTitulo - 1, c });
    escribir(ws, ref, h, {
      font: FONT_HEADER_H2,
      fill: FILL_HEADER_H2,
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
      font: FONT_BODY_H2,
      border: BORDER_THIN,
      alignment: { horizontal: "left", vertical: "center" },
    });
    escribir(
      ws,
      XLSX.utils.encode_cell({ r: fila - 1, c: 1 }),
      importe,
      { font: FONT_BODY_H2, border: BORDER_THIN, alignment: { horizontal: "right", vertical: "center" } },
      MONEY_FORMAT,
    );
    escribir(
      ws,
      XLSX.utils.encode_cell({ r: fila - 1, c: 2 }),
      0,
      { font: FONT_BODY_H2, border: BORDER_THIN, alignment: { horizontal: "right", vertical: "center" } },
      MONEY_FORMAT,
    );
    escribir(
      ws,
      XLSX.utils.encode_cell({ r: fila - 1, c: 3 }),
      importe,
      { font: FONT_BODY_H2, border: BORDER_THIN, alignment: { horizontal: "right", vertical: "center" } },
      MONEY_FORMAT,
    );
    escribir(ws, XLSX.utils.encode_cell({ r: fila - 1, c: 4 }), comentario, {
      font: FONT_BODY_H2,
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
        font: FONT_BODY_H2_BOLD,
        alignment: { horizontal: c === 0 ? "left" : "right", vertical: "center" },
        border: BORDER_MEDIUM,
      },
      c > 0 ? MONEY_FORMAT : undefined,
    );
  });

  // ---- TOTAL EFECTIVO final ----
  // subtotalEfectivoGeneral (= totales.subEfectivo) ya viene con gastos y
  // comisiones restados una vez — no se vuelve a restar aquí.
  const filaEfectivoFinal = filaGastosTotal + 3;
  const totalEfectivoFinal = subtotalEfectivoGeneral;

  escribir(ws, XLSX.utils.encode_cell({ r: filaEfectivoFinal - 1, c: 0 }), "TOTAL EFECTIVO", {
    font: FONT_BODY_H2_BOLD,
    alignment: { horizontal: "left", vertical: "center" },
    border: BORDER_MEDIUM,
  });
  escribir(
    ws,
    XLSX.utils.encode_cell({ r: filaEfectivoFinal - 1, c: 3 }),
    totalEfectivoFinal,
    {
      font: FONT_BODY_H2_BOLD,
      fill: FILL_TOTAL,
      alignment: { horizontal: "right", vertical: "center" },
      border: BORDER_MEDIUM,
    },
    MONEY_FORMAT,
  );

  // ---- Comentarios y Elaboró — van justo después de TOTAL EFECTIVO,
  //      igual que el formato original (sin el bloque de información
  //      adicional que no existía ahí). ----
  const filaComentarios = filaEfectivoFinal + 3;
  escribir(ws, XLSX.utils.encode_cell({ r: filaComentarios - 1, c: 0 }), "COMENTARIOS:", {
    font: FONT_LABEL_H2,
    alignment: { horizontal: "left", vertical: "top" },
  });
  merges.push({ s: { r: filaComentarios - 1, c: 1 }, e: { r: filaComentarios - 1, c: 8 } });
  escribir(ws, XLSX.utils.encode_cell({ r: filaComentarios - 1, c: 1 }), observaciones || "—", {
    font: FONT_BODY_H2,
    alignment: { horizontal: "left", vertical: "top", wrapText: true },
  });

  const filaElaboro = filaComentarios + 2;
  escribir(ws, XLSX.utils.encode_cell({ r: filaElaboro - 1, c: 0 }), "Elaboró:", {
    font: FONT_LABEL_H2,
    alignment: { horizontal: "left", vertical: "center" },
  });
  escribir(ws, XLSX.utils.encode_cell({ r: filaElaboro - 1, c: 1 }), generadoPor || "—", {
    font: FONT_BODY_H2_BOLD,
    alignment: { horizontal: "left", vertical: "center" },
  });

  ws["!merges"] = merges;
  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: filaElaboro - 1, c: 8 } });

  establecerAnchos(ws, [10, 11, 11, 11, 11, 11, 11, 11, 11]);

  ws["!rows"] = [
    { hpt: 8 },
    { hpt: 14 },
    { hpt: 16 },
    { hpt: 13 },
    { hpt: 8 },
    { hpt: 18 },
    { hpt: 8 },
    { hpt: 13 },
    { hpt: 13 },
  ];

  ws["!pageSetup"] = { orientation: "landscape", fitToWidth: 1, fitToHeight: 1 };

  return ws;
}

// ---------------------------------------------------------------------
// Exportación
// ---------------------------------------------------------------------

export function exportarCorteExcel({
  registros = [],
  comisiones = [],
  billetes = {},
  observaciones,
  oficina,
  fechaLabel,
  fechaIso,
  totales = {},
  generadoPor,
}) {
  const wb = XLSX.utils.book_new();

  const wsPolizas = construirHojaPolizas({ registros, comisiones, billetes, observaciones, oficina, fechaLabel, generadoPor, totales });
  const wsResumen = construirHojaResumen({ registros, comisiones, observaciones, oficina, fechaLabel, totales, generadoPor });

  XLSX.utils.book_append_sheet(wb, wsPolizas, "Pólizas");
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

  const nombreOficina = String(oficina || "corte").replace(/[^\w-]+/g, "_");
  const fechaArchivo = fechaIso || new Date().toISOString().slice(0, 10);

  XLSX.writeFile(wb, `Corte_${nombreOficina}_${fechaArchivo}.xlsx`);
}
