import * as XLSX from "xlsx";

const n = (v) => parseFloat(v) || 0;

const COLUMNAS = [
  { header: "No.",                key: "no" },
  { header: "Aseguradora",        key: "aseguradora" },
  { header: "Póliza",             key: "numero_poliza" },
  { header: "F. Emisión",         key: "fecha_emision" },
  { header: "Vigencia inicio",    key: "vigencia_inicio" },
  { header: "Vigencia fin",       key: "vigencia_fin" },
  { header: "Folio",              key: "folio" },
  { header: "Vendedor",           key: "vendedor_nombre" },
  { header: "Asegurado",          key: "asegurado_nombre" },
  { header: "Teléfono",           key: "telefono" },
  { header: "Vale $",             key: "vale" },
  { header: "Prima T. Anual",     key: "prima_anual" },
  { header: "Prima Neta Anual",   key: "prima_neta" },
  { header: "Prima T. 1er Pago",  key: "prima_primer_pago" },
  { header: "Cobertura",          key: "cobertura" },
  { header: "Placas",             key: "placas" },
  { header: "Tipo",               key: "tipo" },
  { header: "Forma Pago",         key: "forma_pago" },
  { header: "Efectivo",           key: "efectivo" },
  { header: "Cheque/Dep",         key: "cheque" },
  { header: "TDC",                key: "tdc" },
  { header: "Autorización",       key: "autorizacion" },
  { header: "Pól. Pend. Pago",    key: "pol_pend_pago" },
  { header: "Observaciones",      key: "observaciones" },
  { header: "Fotos",              key: "fotos_url" },
  { header: "Factura",            key: "factura_url" },
  { header: "T. Circulación",     key: "t_circ_url" },
  { header: "Identificación",     key: "identif_url" },
  { header: "Póliza Anterior",    key: "pol_ant_url" },
  { header: "Otro",               key: "otro_url" },
  { header: "Completado",         key: "completado" },
];

function valorCelda(r, key) {
  const v = r[key];
  if (["vale", "prima_anual", "prima_neta", "prima_primer_pago", "efectivo", "cheque", "tdc", "pol_pend_pago"].includes(key)) {
    return n(v);
  }
  if (["fotos_url", "factura_url", "t_circ_url", "identif_url", "pol_ant_url", "otro_url"].includes(key)) {
    return v ? "Sí" : "No";
  }
  if (key === "completado") {
    return v ? "Sí" : "No";
  }
  return v ?? "";
}

export function exportarCorteExcel({ registros, oficina, fechaLabel, fechaIso, totales }) {
  const filas = registros.map((r, i) => {
    const fila = {};
    for (const c of COLUMNAS) {
      fila[c.header] = c.key === "no" ? i + 1 : valorCelda(r, c.key);
    }
    return fila;
  });

  const wsPolizas = XLSX.utils.json_to_sheet(filas, { header: COLUMNAS.map((c) => c.header) });
  wsPolizas["!cols"] = COLUMNAS.map((c) => ({ wch: Math.max(c.header.length + 2, 10) }));

  const filasResumen = [
    { Concepto: "Oficina", Valor: oficina },
    { Concepto: "Fecha de corte", Valor: fechaLabel },
    { Concepto: "Pólizas registradas", Valor: registros.length },
    { Concepto: "", Valor: "" },
    { Concepto: "Efectivo", Valor: n(totales?.efectivo) },
    { Concepto: "Vales", Valor: n(totales?.vale) },
    { Concepto: "T. Crédito / Débito", Valor: n(totales?.tdc) },
    { Concepto: "Fichas Cheques/Trans", Valor: n(totales?.cheque) },
    { Concepto: "Gastos", Valor: n(totales?.gastos) },
    { Concepto: "Subtotal efectivo", Valor: n(totales?.subEfectivo) },
    { Concepto: "Total cobrado", Valor: n(totales?.totalCobro) },
    { Concepto: "Pólizas pend. de pago", Valor: n(totales?.polPendPago) },
    { Concepto: "Prima total anual", Valor: n(totales?.primaAnual) },
    { Concepto: "Prima neta total", Valor: n(totales?.primaNeta) },
    { Concepto: "Prima total 1er pago", Valor: n(totales?.primerPago) },
  ];
  const wsResumen = XLSX.utils.json_to_sheet(filasResumen, { header: ["Concepto", "Valor"], skipHeader: false });
  wsResumen["!cols"] = [{ wch: 26 }, { wch: 18 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");
  XLSX.utils.book_append_sheet(wb, wsPolizas, "Pólizas");

  const nombreOficina = (oficina || "corte").replace(/[^\w\-]+/g, "_");
  XLSX.writeFile(wb, `Corte_${nombreOficina}_${fechaIso}.xlsx`);
}
