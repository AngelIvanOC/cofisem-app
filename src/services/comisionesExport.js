import * as XLSX from "xlsx-js-style";

/*
 * Exportador del Reporte de comisiones (/comisiones/reporte) a Excel.
 *
 * Una sola hoja: encabezado con periodo/filtros y, por cada vendedor, su
 * nombre, la tabla de cuotas cobradas y una fila de total — igual que se
 * ve en pantalla. Al final, el total general.
 *
 * Recibe los grupos ya "aplanados" (ver filaExport en
 * ReporteComisiones.jsx), así el Excel y el PDF muestran exactamente lo
 * mismo que la tabla.
 */

export const COLUMNAS_EXPORT = [
  { key: "aseguradora", label: "Aseguradora", w: 14 },
  { key: "poliza", label: "Póliza", w: 22 },
  { key: "vigInicio", label: "Inicio vigencia", w: 12, tipo: "fecha" },
  { key: "asegurado", label: "Asegurado", w: 30 },
  { key: "rfc", label: "RFC", w: 15 },
  { key: "cobertura", label: "Cobertura", w: 22 },
  { key: "tipo", label: "Tipo", w: 9 },
  { key: "serie", label: "Serie", w: 20 },
  { key: "formaPago", label: "Forma de pago", w: 13 },
  { key: "cuota", label: "Cuota", w: 7, tipo: "num" },
  { key: "fechaPago", label: "Fecha pago cuota", w: 12, tipo: "fecha" },
  { key: "primaPoliza", label: "Prima total póliza", w: 14, tipo: "dinero" },
  { key: "primaTotal", label: "Prima total cuota", w: 14, tipo: "dinero" },
  { key: "primaNeta", label: "Prima neta cuota", w: 14, tipo: "dinero" },
  { key: "comision", label: "Comisión $", w: 12, tipo: "dinero" },
  { key: "comisionPct", label: "Comisión %", w: 10, tipo: "pct" },
  { key: "gastosAdmin", label: "Gastos admin.", w: 12, tipo: "dinero" },
  { key: "iva", label: "Impuestos (IVA)", w: 13, tipo: "dinero" },
  { key: "fechaComision", label: "Fecha pago comisión", w: 13, tipo: "fecha" },
];

// Columnas que llevan total por vendedor y total general.
export const COLUMNAS_TOTAL = ["primaTotal", "primaNeta", "comision", "iva"];

const MONEY_FORMAT = "$#,##0.00";
const PCT_FORMAT = "0.00%";
const DATE_FORMAT = "dd/mm/yyyy";

const BORDE = {
  top: { style: "thin", color: { rgb: "FFBFBFBF" } },
  bottom: { style: "thin", color: { rgb: "FFBFBFBF" } },
  left: { style: "thin", color: { rgb: "FFBFBFBF" } },
  right: { style: "thin", color: { rgb: "FFBFBFBF" } },
};
const FONT = { name: "Arial", sz: 9 };

const S_TITULO = { font: { ...FONT, sz: 14, bold: true, color: { rgb: "FF1447E6" } } };
const S_SUB = { font: { ...FONT, color: { rgb: "FF595959" } } };
const S_VENDEDOR = {
  font: { ...FONT, sz: 11, bold: true, color: { rgb: "FFFFFFFF" } },
  fill: { fgColor: { rgb: "FF13193A" } },
};
const S_HEADER = {
  font: { ...FONT, bold: true },
  fill: { fgColor: { rgb: "FFD9D9D9" } },
  border: BORDE,
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
};
const S_CELDA = { font: FONT, border: BORDE };
const S_TOTAL = {
  font: { ...FONT, bold: true },
  fill: { fgColor: { rgb: "FFF2F2F2" } },
  border: BORDE,
};
const S_TOTAL_GENERAL = {
  font: { ...FONT, bold: true, color: { rgb: "FFFFFFFF" } },
  fill: { fgColor: { rgb: "FF1447E6" } },
  border: BORDE,
};

// "2026-09-15" → número de serie de Excel. Con un Date, la librería lo
// pasa a UTC y en México (UTC-6) la fecha se recorría un día hacia atrás.
function aSerialExcel(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86400000 + 25569;
}

function celda(col, valor, estiloBase) {
  if (valor == null || valor === "") return { v: "—", t: "s", s: estiloBase };
  switch (col.tipo) {
    case "dinero":
      return { v: Number(valor), t: "n", z: MONEY_FORMAT, s: estiloBase };
    case "pct":
      return { v: Number(valor) / 100, t: "n", z: PCT_FORMAT, s: estiloBase };
    case "num":
      return { v: Number(valor), t: "n", s: { ...estiloBase, alignment: { horizontal: "center" } } };
    case "fecha":
      return { v: aSerialExcel(valor), t: "n", z: DATE_FORMAT, s: estiloBase };
    default:
      return { v: String(valor), t: "s", s: estiloBase };
  }
}

function filaTotal(etiqueta, totales, estilo) {
  return COLUMNAS_EXPORT.map((col, i) => {
    if (i === 0) return { v: etiqueta, t: "s", s: estilo };
    if (COLUMNAS_TOTAL.includes(col.key))
      return { v: totales[col.key] ?? 0, t: "n", z: MONEY_FORMAT, s: estilo };
    return { v: "", t: "s", s: estilo };
  });
}

export function exportarComisionesExcel({
  grupos,
  periodoLabel,
  filtrosLabel,
  totalGeneral,
  nombreArchivo,
}) {
  const ultimaCol = COLUMNAS_EXPORT.length - 1;
  const filas = [];
  const merges = [];

  filas.push([{ v: "Reporte de comisiones", t: "s", s: S_TITULO }]);
  filas.push([{ v: `Periodo: ${periodoLabel}`, t: "s", s: S_SUB }]);
  filas.push([{ v: filtrosLabel, t: "s", s: S_SUB }]);
  filas.push([]);

  for (const g of grupos) {
    const r = filas.length;
    filas.push([
      {
        v: `${g.nombre}  ·  ${g.polizas} póliza(s) · ${g.filas.length} cuota(s)`,
        t: "s",
        s: S_VENDEDOR,
      },
      ...Array.from({ length: ultimaCol }, () => ({ v: "", t: "s", s: S_VENDEDOR })),
    ]);
    merges.push({ s: { r, c: 0 }, e: { r, c: ultimaCol } });
    filas.push(COLUMNAS_EXPORT.map((c) => ({ v: c.label, t: "s", s: S_HEADER })));
    for (const f of g.filas) {
      filas.push(COLUMNAS_EXPORT.map((c) => celda(c, f[c.key], S_CELDA)));
    }
    filas.push(filaTotal(`Total ${g.nombre}`, g.totales, S_TOTAL));
    filas.push([]);
  }

  filas.push(filaTotal("TOTAL GENERAL", totalGeneral, S_TOTAL_GENERAL));

  const ws = XLSX.utils.aoa_to_sheet(filas);
  ws["!cols"] = COLUMNAS_EXPORT.map((c) => ({ wch: c.w }));
  ws["!merges"] = merges;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Comisiones");
  XLSX.writeFile(wb, nombreArchivo || "Comisiones.xlsx");
}
