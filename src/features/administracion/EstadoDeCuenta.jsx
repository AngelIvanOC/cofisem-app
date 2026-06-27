import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../../supabaseClient";
import { FileText, Loader2, Search, Download, Printer } from "lucide-react";

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const MESES_ABREV = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];

const PRECIO_CARRO = 100;
const PRECIO_MOTO  = 50;
const IVA_PCT      = 0.16;

function esMoto(nombre = "") {
  return /moto/i.test(nombre);
}

function ultimoDiaMes(year, month) {
  return new Date(year, month, 0).getDate();
}

function sumarUnMes(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const next = new Date(y, m - 1 + 1, d);
  // Si el día no existe en el siguiente mes, ajusta al último día
  if (next.getMonth() !== m % 12) next.setDate(0);
  return next.toISOString().split("T")[0];
}

function formatPeriodo(s, e) {
  const sd = new Date(s + "T12:00:00");
  const ed = new Date(e + "T12:00:00");
  const sm = MESES_ABREV[sd.getMonth()];
  const em = MESES_ABREV[ed.getMonth()];
  const sy = String(sd.getFullYear()).slice(-2);
  const ey = String(ed.getFullYear()).slice(-2);
  if (sm === em && sy === ey) return `PERIODO ${sm}-${sy}`;
  if (sy === ey) return `PERIODO ${sm}-${em} ${sy}`;
  return `PERIODO ${sm}-${sy} / ${em}-${ey}`;
}

function fmt$(n) {
  return `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const CL_TH_DARK   = "bg-[#13193a] text-white";
const CL_TH_MID    = "bg-[#1e2a50] text-white";
const CL_TH_LIGHT  = "bg-[#2d3d6b] text-white";
const CL_TH_SUB    = "bg-[#3d5080] text-white";
const CL_BORDER    = "border border-[#dde3f0]";

export default function EstadoDeCuenta() {
  const hoy      = new Date();
  const anioAct  = hoy.getFullYear();
  const mesAct   = hoy.getMonth() + 1;

  const [modo,       setModo]       = useState("mes");
  const [selMes,     setSelMes]     = useState(mesAct);
  const [selAnio,    setSelAnio]    = useState(anioAct);
  const [fInicio,    setFInicio]    = useState("");
  const [fFin,       setFFin]       = useState("");
  const [cargando,   setCargando]   = useState(false);
  const [datos,      setDatos]      = useState(null);
  const [rango,      setRango]      = useState({ s: "", e: "" });

  const anios = Array.from({ length: 7 }, (_, i) => anioAct - 5 + i);

  const handleFechaInicio = (v) => {
    setFInicio(v);
    if (v) setFFin(sumarUnMes(v));
  };

  const puedeConsultar =
    modo === "mes" || (fInicio && fFin && fFin >= fInicio);

  const calcRango = () => {
    if (modo === "mes") {
      const ultimo = ultimoDiaMes(selAnio, selMes);
      return {
        s: `${selAnio}-${String(selMes).padStart(2, "0")}-01`,
        e: `${selAnio}-${String(selMes).padStart(2, "0")}-${String(ultimo).padStart(2, "0")}`,
      };
    }
    return { s: fInicio, e: fFin };
  };

  const handleBuscar = async () => {
    const r = calcRango();
    setCargando(true);
    setDatos(null);
    setRango(r);
    try {
      const { data, error } = await supabase
        .from("polizas")
        .select("id, created_at, oficina_id, oficinas(id, nombre), coberturas(nombre)")
        .gte("created_at", `${r.s}T00:00:00`)
        .lte("created_at", `${r.e}T23:59:59`);
      if (error) throw error;
      setDatos(procesarPolizas(data || []));
    } catch (err) {
      console.error(err);
      setDatos([]);
    } finally {
      setCargando(false);
    }
  };

  const procesarPolizas = (polizas) => {
    const mapa = new Map();
    for (const p of polizas) {
      const key    = p.oficina_id ?? "sin-oficina";
      const nombre = p.oficinas?.nombre ?? "Sin Oficina";
      const cob    = p.coberturas?.nombre ?? "";
      if (!mapa.has(key)) mapa.set(key, { nombre, carros: 0, motos: 0 });
      const entry = mapa.get(key);
      if (esMoto(cob)) entry.motos++;
      else              entry.carros++;
    }
    return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
  };

  const totCarros   = datos ? datos.reduce((s, o) => s + o.carros, 0) : 0;
  const totMotos    = datos ? datos.reduce((s, o) => s + o.motos,  0) : 0;
  const stCarros    = totCarros * PRECIO_CARRO;
  const stMotos     = totMotos  * PRECIO_MOTO;
  const grandTotal  = stCarros + stMotos;
  const iva         = grandTotal * IVA_PCT;
  const totalConIva = grandTotal + iva;
  const periodo     = rango.s ? formatPeriodo(rango.s, rango.e) : "";

  const exportarExcel = () => {
    if (!datos || datos.length === 0) return;
    const filas = [
      [periodo],
      ["CONCEPTO", "Cant. $100", "S-Total $100", "Cant. $50", "S-Total $50"],
      ...datos.map((o) => [
        o.nombre,
        o.carros,
        o.carros * PRECIO_CARRO,
        o.motos,
        o.motos * PRECIO_MOTO,
      ]),
      ["CONSTANCIAS", totCarros, stCarros, totMotos, stMotos],
      [],
      ["TOTAL PENDIENTE DE PAGO", "", "", "", grandTotal],
      ["IVA (16%)", "", "", "", iva],
      ["TOTAL + IVA", "", "", "", totalConIva],
    ];
    const ws = XLSX.utils.aoa_to_sheet(filas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Estado de Cuenta");
    XLSX.writeFile(wb, `estado-cuenta-${rango.s}.xlsx`);
  };

  const exportarPDF = () => {
    if (!datos || datos.length === 0) return;
    const th = (txt) =>
      `<th style="background:#13193a;color:#fff;padding:6px 10px;border:1px solid #dde3f0;text-align:center">${txt}</th>`;
    const td = (txt, extra = "") =>
      `<td style="padding:6px 10px;border:1px solid #dde3f0;${extra}">${txt}</td>`;
    const filasDatos = datos
      .map(
        (o, i) => `<tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
          ${td(o.nombre)}
          ${td(o.carros, "text-align:center")}
          ${td(fmt$(o.carros * PRECIO_CARRO), "text-align:center")}
          ${td(o.motos, "text-align:center")}
          ${td(fmt$(o.motos * PRECIO_MOTO), "text-align:center")}
        </tr>`
      )
      .join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>${periodo}</title>
      <style>body{font-family:sans-serif;font-size:12px;margin:24px}
      table{border-collapse:collapse;width:100%}
      @media print{@page{margin:1cm}}</style>
      </head><body>
      <h2 style="text-align:center;margin-bottom:12px">${periodo}</h2>
      <table>
        <thead>
          <tr>${th("CONCEPTO")}${th("Cant.")}${th("S-Total")}${th("Cant.")}${th("S-Total")}</tr>
          <tr>
            <th style="background:#1e2a50;color:#fff;padding:4px 10px;border:1px solid #dde3f0"></th>
            <th colspan="2" style="background:#2d3d6b;color:#fff;padding:4px 10px;border:1px solid #dde3f0;text-align:center">$100</th>
            <th colspan="2" style="background:#2d3d6b;color:#fff;padding:4px 10px;border:1px solid #dde3f0;text-align:center">$50</th>
          </tr>
        </thead>
        <tbody>
          ${filasDatos}
          <tr style="background:#f3f4f6;font-weight:bold">
            ${td("CONSTANCIAS")}
            ${td(totCarros, "text-align:center")}
            ${td(fmt$(stCarros), "text-align:center")}
            ${td(totMotos, "text-align:center")}
            ${td(fmt$(stMotos), "text-align:center")}
          </tr>
          <tr style="background:#eff6ff;font-weight:bold">
            <td colspan="4" style="padding:6px 10px;border:1px solid #dde3f0">TOTAL PENDIENTE DE PAGO</td>
            ${td(fmt$(grandTotal), "text-align:center;font-weight:bold")}
          </tr>
          <tr>
            <td colspan="4" style="padding:6px 10px;text-align:right;color:#4b5563">IVA (16%)</td>
            <td style="padding:6px 10px;border:1px solid #dde3f0;text-align:center;background:#eff6ff;color:#4b5563">${fmt$(iva)}</td>
          </tr>
          <tr>
            <td colspan="4" style="padding:6px 10px;text-align:right;font-weight:bold">TOTAL + IVA</td>
            <td style="padding:6px 10px;border:1px solid #dde3f0;text-align:center;background:#13193a;color:#fff;font-weight:bold">${fmt$(totalConIva)}</td>
          </tr>
        </tbody>
      </table>
      <script>window.onload=()=>{window.print();}<\/script>
      </body></html>`;
    const w = window.open("", "_blank", "width=900,height=700");
    w.document.write(html);
    w.document.close();
  };

  const inp = "px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all";

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#13193a] flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[#13193a]">Estado de Cuenta</h1>
          <p className="text-xs text-gray-500">Resumen de pólizas emitidas por periodo</p>
        </div>
      </div>

      {/* Panel de filtro */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
        {/* Toggle modo */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-500">Consultar por:</span>
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            {[
              { id: "mes",      label: "Mes" },
              { id: "intervalo", label: "Intervalo de fechas" },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setModo(opt.id)}
                className={`px-4 py-1.5 text-xs font-medium transition-all ${
                  modo === opt.id
                    ? "bg-[#13193a] text-white"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="flex flex-wrap items-end gap-3">
          {modo === "mes" ? (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 font-medium">Mes</label>
                <select
                  value={selMes}
                  onChange={(e) => setSelMes(Number(e.target.value))}
                  className={inp}
                >
                  {MESES.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 font-medium">Año</label>
                <select
                  value={selAnio}
                  onChange={(e) => setSelAnio(Number(e.target.value))}
                  className={inp}
                >
                  {anios.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 font-medium">Desde</label>
                <input
                  type="date"
                  value={fInicio}
                  onChange={(e) => handleFechaInicio(e.target.value)}
                  className={inp}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 font-medium">Hasta</label>
                <input
                  type="date"
                  value={fFin}
                  min={fInicio}
                  onChange={(e) => setFFin(e.target.value)}
                  className={inp}
                />
              </div>
            </>
          )}

          <button
            onClick={handleBuscar}
            disabled={!puedeConsultar || cargando}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#13193a] text-white text-sm font-medium disabled:opacity-40 hover:bg-[#1e2a50] transition-all"
          >
            {cargando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Consultar
          </button>

          {datos !== null && datos.length > 0 && (
            <>
              <button
                onClick={exportarExcel}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-green-600 text-green-700 text-sm font-medium hover:bg-green-50 transition-all"
              >
                <Download className="w-4 h-4" />
                Exportar Excel
              </button>
              <button
                onClick={exportarPDF}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500 text-red-600 text-sm font-medium hover:bg-red-50 transition-all"
              >
                <Printer className="w-4 h-4" />
                Exportar PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabla de resultados */}
      {datos !== null && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                {/* Fila 1 — Periodo */}
                <tr>
                  <th
                    colSpan={5}
                    className={`${CL_TH_DARK} ${CL_BORDER} text-center py-2.5 px-4 text-sm font-bold tracking-widest`}
                  >
                    {periodo}
                  </th>
                </tr>

                {/* Fila 2 — CONCEPTO (rowSpan=3) | VENTA (colSpan=4) */}
                <tr>
                  <th
                    rowSpan={3}
                    className={`${CL_TH_MID} ${CL_BORDER} text-center px-4 py-2 font-bold`}
                    style={{ width: "30%" }}
                  >
                    CONCEPTO
                  </th>
                  <th
                    colSpan={4}
                    className={`${CL_TH_MID} ${CL_BORDER} text-center px-4 py-2 font-bold`}
                  >
                    VENTA
                  </th>
                </tr>

                {/* Fila 3 — $100 (colSpan=2) | $50 (colSpan=2) */}
                <tr>
                  <th
                    colSpan={2}
                    className={`${CL_TH_LIGHT} ${CL_BORDER} text-center px-4 py-1.5 font-semibold`}
                    style={{ width: "35%" }}
                  >
                    $100
                  </th>
                  <th
                    colSpan={2}
                    className={`${CL_TH_LIGHT} ${CL_BORDER} text-center px-4 py-1.5 font-semibold`}
                    style={{ width: "35%" }}
                  >
                    $50
                  </th>
                </tr>

                {/* Fila 4 — Cant. | S-Total | Cant. | S-Total */}
                <tr>
                  {["Cant.", "S-Total", "Cant.", "S-Total"].map((h, i) => (
                    <th
                      key={i}
                      className={`${CL_TH_SUB} ${CL_BORDER} text-center px-3 py-1.5 font-medium`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {datos.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className={`${CL_BORDER} text-center py-10 text-gray-400`}
                    >
                      No se encontraron pólizas en el periodo seleccionado.
                    </td>
                  </tr>
                ) : (
                  datos.map((o, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className={`${CL_BORDER} px-4 py-2 font-medium text-gray-700`}>
                        {o.nombre}
                      </td>
                      <td className={`${CL_BORDER} px-3 py-2 text-center text-gray-700`}>
                        {o.carros}
                      </td>
                      <td className={`${CL_BORDER} px-3 py-2 text-center text-gray-700`}>
                        {fmt$(o.carros * PRECIO_CARRO)}
                      </td>
                      <td className={`${CL_BORDER} px-3 py-2 text-center text-gray-700`}>
                        {o.motos}
                      </td>
                      <td className={`${CL_BORDER} px-3 py-2 text-center text-gray-700`}>
                        {fmt$(o.motos * PRECIO_MOTO)}
                      </td>
                    </tr>
                  ))
                )}

                {/* CONSTANCIAS — totales por columna */}
                <tr className="bg-gray-100 font-semibold">
                  <td className={`${CL_BORDER} px-4 py-2 text-gray-800`}>CONSTANCIAS</td>
                  <td className={`${CL_BORDER} px-3 py-2 text-center text-gray-800`}>{totCarros}</td>
                  <td className={`${CL_BORDER} px-3 py-2 text-center text-gray-800`}>{fmt$(stCarros)}</td>
                  <td className={`${CL_BORDER} px-3 py-2 text-center text-gray-800`}>{totMotos}</td>
                  <td className={`${CL_BORDER} px-3 py-2 text-center text-gray-800`}>{fmt$(stMotos)}</td>
                </tr>

                {/* TOTAL PENDIENTE DE PAGO */}
                <tr className="bg-blue-50 font-bold">
                  <td
                    colSpan={4}
                    className={`${CL_BORDER} px-4 py-2.5 text-[#13193a] tracking-wide`}
                  >
                    TOTAL PENDIENTE DE PAGO
                  </td>
                  <td className={`${CL_BORDER} px-3 py-2.5 text-center text-[#13193a]`}>
                    {fmt$(grandTotal)}
                  </td>
                </tr>

                {/* IVA */}
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-2 text-right text-gray-600 bg-white"
                  >
                    IVA (16%)
                  </td>
                  <td className={`${CL_BORDER} px-3 py-2 text-center text-gray-600 bg-blue-50`}>
                    {fmt$(iva)}
                  </td>
                </tr>

                {/* TOTAL + IVA */}
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-2.5 text-right font-bold text-gray-800 bg-white"
                  >
                    TOTAL + IVA
                  </td>
                  <td className={`${CL_BORDER} px-3 py-2.5 text-center font-bold text-white bg-[#13193a]`}>
                    {fmt$(totalConIva)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
