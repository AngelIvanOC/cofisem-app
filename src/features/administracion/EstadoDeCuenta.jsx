import { useState, useEffect, useRef, forwardRef } from "react";
import ExcelJS from "exceljs";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "../../supabaseClient";
import { FileText, Loader2, Search, Download, Printer } from "lucide-react";

// Oficina E. Zapata: única oficina con dos operadoras; se desglosa una fila por operadora.
const OFICINA_EZAPATA_ID = 1;

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const MESES_ABREV = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];

const PRECIO_CARRO = 100;
const PRECIO_MOTO = 50;
const IVA_PCT = 0.16;

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

function fmtFecha(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Paleta categórica validada (skill dataviz — orden fijo, nunca ciclada;
// pasa CVD/contraste en scripts/validate_palette.js). Se usa tanto para
// identificar oficinas en las gráficas como para los 4 esquemas de abajo.
const PALETA_CATEGORICA = [
  "#2a78d6", // azul
  "#eb6834", // naranja
  "#1baf7a", // aqua
  "#eda100", // amarillo
  "#e87ba4", // magenta
  "#008300", // verde
  "#4a3aa7", // violeta
  "#e34948", // rojo
];
const COLOR_OTRAS = "#9a9890";

// Los 4 esquemas de precio/forma de pago que existen hoy (ver PRECIO_MATRIZ
// en features/operador/constants/cobertura.js): tarifa normal y de gestor,
// cada una de contado o en 4 parcialidades.
const DETALLE_GRUPOS = [
  { key: "c2200", titulo: "PÓLIZAS DE $2,200 — CONTADO", formaPago: "CONTADO", precio: 2200, color: PALETA_CATEGORICA[0] },
  { key: "c2500", titulo: "PÓLIZAS DE $2,500 — CONTADO", formaPago: "CONTADO", precio: 2500, color: PALETA_CATEGORICA[1] },
  { key: "p2200", titulo: "PÓLIZAS DE $2,200 — 4 PARCIALES", formaPago: "4 PARCIALES", precio: 2200, color: PALETA_CATEGORICA[2] },
  { key: "p2674", titulo: "PÓLIZAS DE $2,674 — 4 PARCIALES", formaPago: "4 PARCIALES", precio: 2674, color: PALETA_CATEGORICA[3] },
];

function claveDetalle(p) {
  const precio = Number(p.coberturas?.prima_total ?? 0);
  const fp = p.forma_pago;
  return DETALLE_GRUPOS.find((g) => g.formaPago === fp && g.precio === precio)?.key ?? null;
}

const th = (txt, extra = "") =>
  `<th style="background:#13193a;color:#fff;padding:6px 10px;border:1px solid #dde3f0;text-align:center;${extra}">${txt}</th>`;
const td = (txt, extra = "") =>
  `<td style="padding:6px 10px;border:1px solid #dde3f0;${extra}">${txt ?? ""}</td>`;

function totalesDetallePrimas(filas) {
  const sum = (f) => filas.reduce((s, o) => s + o[f], 0);
  const cant = { c2200: sum("c2200"), c2500: sum("c2500"), p2200: sum("p2200"), p2674: sum("p2674") };
  const monto = { c2200: sum("mc2200"), c2500: sum("mc2500"), p2200: sum("mp2200"), p2674: sum("mp2674") };
  const totContado = cant.c2200 + cant.c2500;
  const totPagos = cant.p2200 + cant.p2674;
  const montoContado = monto.c2200 + monto.c2500;
  const montoPagos = monto.p2200 + monto.p2674;
  return {
    cant,
    monto,
    totContado,
    totPagos,
    totGeneral: totContado + totPagos,
    montoContado,
    montoPagos,
    montoGeneral: montoContado + montoPagos,
  };
}

// Asigna un color fijo de la paleta categórica a cada oficina, en orden
// alfabético (mismo orden que ya usan las tablas). Más de 8 oficinas: las
// que exceden el cupo no reciben color individual y se pliegan en "Otras"
// dentro de las gráficas (las tablas sí las siguen listando una por una).
function construirColoresOficina(filas) {
  const ordenadas = [...filas].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const mapa = new Map();
  ordenadas.forEach((o, i) => {
    if (i < PALETA_CATEGORICA.length) mapa.set(o.nombre, PALETA_CATEGORICA[i]);
  });
  return mapa;
}

// Suma uno o más campos de `filas` (p.ej. cantidad o monto de los 4 esquemas)
// por oficina, y arma el arreglo {nombre, valor, color} para una gráfica de
// pastel, plegando en "Otras oficinas" a las que no tienen color asignado.
function construirDatosPieOficina(filas, campos, coloresOficina) {
  const conValor = filas
    .map((o) => ({ nombre: o.nombre, valor: campos.reduce((s, c) => s + o[c], 0) }))
    .filter((d) => d.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  const individuales = [];
  let otras = 0;
  for (const d of conValor) {
    const color = coloresOficina.get(d.nombre);
    if (color) individuales.push({ ...d, color });
    else otras += d.valor;
  }
  if (otras > 0) individuales.push({ nombre: "Otras oficinas", valor: otras, color: COLOR_OTRAS });
  return individuales;
}

function construirDatosPieTipoPrima(t) {
  return DETALLE_GRUPOS.map((g) => ({
    nombre: g.titulo.replace("PÓLIZAS DE ", "").replace(" — ", " · "),
    valor: t.cant[g.key],
    color: g.color,
  })).filter((d) => d.valor > 0);
}

// Serializa el <svg> de una gráfica ya renderizada, para incrustarlo tal
// cual en el HTML que se manda a imprimir como PDF.
function svgAString(svgEl) {
  if (!svgEl) return "";
  const clone = svgEl.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return new XMLSerializer().serializeToString(clone);
}

// Rasteriza el <svg> de una gráfica a PNG (data URL), para poder insertarla
// como imagen en el Excel — ExcelJS no soporta gráficas nativas.
function svgAPng(svgEl, scale = 2) {
  return new Promise((resolve) => {
    if (!svgEl) return resolve(null);
    const w = Number(svgEl.getAttribute("width")) || svgEl.clientWidth || 400;
    const h = Number(svgEl.getAttribute("height")) || svgEl.clientHeight || 300;
    const svgBlob = new Blob([svgAString(svgEl)], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve({ dataUrl: canvas.toDataURL("image/png"), width: w, height: h });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

// Leyenda de color hecha a mano (swatch + nombre + valor + %), para el PDF.
// No se reutiliza la leyenda HTML que genera recharts porque depende de una
// hoja de estilos que recharts inyecta en el documento principal — no
// existe dentro del iframe oculto que arma el PDF.
function leyendaHTML(datos, formato) {
  const total = datos.reduce((s, d) => s + d.valor, 0);
  const filas = datos
    .map((d) => {
      const pct = total > 0 ? Math.round((d.valor / total) * 100) : 0;
      return `<div style="display:flex;align-items:center;gap:6px;font-size:10px;padding:2px 0">
        <span style="width:10px;height:10px;border-radius:2px;background:${d.color};flex-shrink:0;display:inline-block"></span>
        <span style="flex:1;color:#111">${d.nombre}</span>
        <span style="color:#6b7280">${formato(d.valor)} (${pct}%)</span>
      </div>`;
    })
    .join("");
  return `<div style="margin-top:6px">${filas}</div>`;
}

// Componente de gráfica de pastel reutilizable en pantalla. `ref` apunta al
// contenedor del <svg> para poder capturarlo al exportar PDF/Excel.
const GraficaPastel = forwardRef(function GraficaPastel({ titulo, subtitulo, datos, formato }, ref) {
  if (datos.length === 0) {
    return (
      <div>
        <h3 className="text-xs font-semibold text-gray-600 text-center mb-1">{titulo}</h3>
        <p className="text-xs text-gray-400 text-center py-16">Sin datos para graficar.</p>
      </div>
    );
  }
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-600 text-center">{titulo}</h3>
      {subtitulo && <p className="text-[11px] text-gray-400 text-center mb-1">{subtitulo}</p>}
      <div ref={ref} style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={datos}
              dataKey="valor"
              nameKey="nombre"
              innerRadius="52%"
              outerRadius="80%"
              paddingAngle={1}
              stroke="#ffffff"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {datos.map((d) => (
                <Cell key={d.nombre} fill={d.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formato(value)} />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, lineHeight: "16px", maxWidth: "45%" }}
              formatter={(value, entry) => {
                const total = datos.reduce((s, d) => s + d.valor, 0);
                const v = entry?.payload?.valor ?? 0;
                const pct = total > 0 ? Math.round((v / total) * 100) : 0;
                return `${value} — ${formato(v)} (${pct}%)`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

const CL_TH_DARK = "bg-[#13193a] text-white";
const CL_TH_MID = "bg-[#1e2a50] text-white";
const CL_TH_LIGHT = "bg-[#2d3d6b] text-white";
const CL_TH_SUB = "bg-[#3d5080] text-white";
const CL_BORDER = "border border-[#dde3f0]";

export default function EstadoDeCuenta() {
  const hoy = new Date();
  const anioAct = hoy.getFullYear();
  const mesAct = hoy.getMonth() + 1;

  const [modo, setModo] = useState("mes");
  const [selMes, setSelMes] = useState(mesAct);
  const [selAnio, setSelAnio] = useState(anioAct);
  const [fInicio, setFInicio] = useState("");
  const [fFin, setFFin] = useState("");
  const [cargando, setCargando] = useState(false);
  const [datos, setDatos] = useState(null);
  const [polizasRaw, setPolizasRaw] = useState([]);
  const [rango, setRango] = useState({ s: "", e: "" });
  const [oficinas, setOficinas] = useState([]);
  const [usuariosZapata, setUsuariosZapata] = useState([]);

  // Contenedores de las gráficas de pastel en pantalla — se usan para
  // capturar su <svg> al exportar a PDF/Excel.
  const refChartCantOficina = useRef(null);
  const refChartMontoOficina = useRef(null);
  const refChartTipoPrima = useRef(null);

  const anios = Array.from({ length: 7 }, (_, i) => anioAct - 5 + i);

  useEffect(() => {
    (async () => {
      const [{ data: dOficinas }, { data: dUsuarios }] = await Promise.all([
        supabase
          .from("oficinas")
          .select("id, nombre")
          .order("nombre", { ascending: true }),
        supabase
          .from("usuarios")
          .select("id, id_muestra, roles(nombre)")
          .eq("oficina_id", OFICINA_EZAPATA_ID)
          .eq("activo", true),
      ]);
      setOficinas(dOficinas || []);
      setUsuariosZapata(
        (dUsuarios || []).filter((u) => u.roles?.nombre === "OPERADOR"),
      );
    })();
  }, []);

  const handleFechaInicio = (v) => {
    setFInicio(v);
    if (v) setFFin(sumarUnMes(v));
  };

  const puedeConsultar = modo === "mes" || (fInicio && fFin && fFin >= fInicio);

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
        .select(
          "id, constancia, created_at, forma_pago, oficina_id, creado_por, oficinas(id, nombre), coberturas(nombre, prima_total), usuarios!polizas_creado_por_fkey(id_muestra)",
        )
        .gte("created_at", `${r.s}T00:00:00`)
        .lte("created_at", `${r.e}T23:59:59`)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setPolizasRaw(data || []);
      setDatos(procesarPolizas(data || []));
    } catch (err) {
      console.error(err);
      setDatos([]);
    } finally {
      setCargando(false);
    }
  };

  const claveYNombre = (p) => {
    if (p.oficina_id === OFICINA_EZAPATA_ID) {
      const nombreOficina = p.oficinas?.nombre ?? "COFISEM AV. E.ZAPATA";
      const idMuestra = p.usuarios?.id_muestra;
      return {
        key: p.creado_por ? `z-${p.creado_por}` : "z-sin-operador",
        nombre:
          idMuestra != null ? `${nombreOficina} OP${idMuestra}` : nombreOficina,
      };
    }
    return {
      key: p.oficina_id ?? "sin-oficina",
      nombre: p.oficinas?.nombre ?? "Sin Oficina",
    };
  };

  const procesarPolizas = (polizas) => {
    const mapa = new Map();

    // Siembra todas las oficinas en 0 (E. Zapata desglosada por operadora)
    for (const of_ of oficinas) {
      if (of_.id === OFICINA_EZAPATA_ID) {
        for (const u of usuariosZapata) {
          mapa.set(`z-${u.id}`, {
            nombre: `${of_.nombre} OP${u.id_muestra}`,
            carros: 0,
            motos: 0,
          });
        }
      } else {
        mapa.set(of_.id, { nombre: of_.nombre, carros: 0, motos: 0 });
      }
    }

    for (const p of polizas) {
      const { key, nombre } = claveYNombre(p);
      const cob = p.coberturas?.nombre ?? "";
      if (!mapa.has(key)) mapa.set(key, { nombre, carros: 0, motos: 0 });
      const entry = mapa.get(key);
      if (esMoto(cob)) entry.motos++;
      else entry.carros++;
    }
    return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
  };

  // Agrupa las pólizas por oficina y por uno de los 4 esquemas de
  // precio/forma de pago (DETALLE_GRUPOS), para el reporte "Detalle de Primas".
  // Pólizas cuyo (prima_total, forma_pago) no calza con ninguno de los 4
  // esquemas se excluyen del reporte (p.ej. coberturas fuera de la matriz vigente).
  const agruparDetallePrimas = (polizas) => {
    const listas = { c2200: [], c2500: [], p2200: [], p2674: [] };
    const porOficina = new Map();

    const seed = (key, nombre) =>
      porOficina.set(key, {
        nombre,
        c2200: 0, c2500: 0, p2200: 0, p2674: 0,
        mc2200: 0, mc2500: 0, mp2200: 0, mp2674: 0,
      });

    for (const of_ of oficinas) {
      if (of_.id === OFICINA_EZAPATA_ID) {
        for (const u of usuariosZapata) seed(`z-${u.id}`, `${of_.nombre} OP${u.id_muestra}`);
      } else {
        seed(of_.id, of_.nombre);
      }
    }

    for (const p of polizas) {
      const grupo = claveDetalle(p);
      if (!grupo) continue;
      const { key: ofKey, nombre } = claveYNombre(p);
      if (!porOficina.has(ofKey)) seed(ofKey, nombre);
      const entry = porOficina.get(ofKey);
      const precio = Number(p.coberturas?.prima_total ?? 0);
      entry[grupo]++;
      entry[`m${grupo}`] += precio;
      listas[grupo].push({ ...p, _oficinaNombre: nombre });
    }

    const filas = [...porOficina.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
    return { filas, listas };
  };

  // Datos de Detalle de Primas calculados una sola vez por consulta y
  // compartidos entre las gráficas en pantalla y los exportadores de
  // Excel/PDF (evita recalcular tres veces lo mismo).
  const { filas: filasPrimas, listas: listasPrimas } = agruparDetallePrimas(polizasRaw);
  const totalesPrimas = totalesDetallePrimas(filasPrimas);
  const coloresOficina = construirColoresOficina(filasPrimas);
  const datosPieCantOficina = construirDatosPieOficina(
    filasPrimas, ["c2200", "c2500", "p2200", "p2674"], coloresOficina,
  );
  const datosPieMontoOficina = construirDatosPieOficina(
    filasPrimas, ["mc2200", "mc2500", "mp2200", "mp2674"], coloresOficina,
  );
  const datosPieTipoPrima = construirDatosPieTipoPrima(totalesPrimas);

  const totCarros = datos ? datos.reduce((s, o) => s + o.carros, 0) : 0;
  const totMotos = datos ? datos.reduce((s, o) => s + o.motos, 0) : 0;
  const stCarros = totCarros * PRECIO_CARRO;
  const stMotos = totMotos * PRECIO_MOTO;
  const grandTotal = stCarros + stMotos;
  const iva = grandTotal * IVA_PCT;
  const totalConIva = grandTotal + iva;
  const periodo = rango.s ? formatPeriodo(rango.s, rango.e) : "";

  // Mismos colores que la tabla en pantalla y el PDF, en ARGB para ExcelJS.
  const XL_DARK  = "FF13193A";
  const XL_MID   = "FF1E2A50";
  const XL_LIGHT = "FF2D3D6B";
  const XL_SUB   = "FF3D5080";
  const XL_ZEBRA = "FFF8FAFC";
  const XL_GRIS  = "FFF3F4F6";
  const XL_AZULC = "FFEFF6FF";
  const XL_BORDE = { style: "thin", color: { argb: "FFDDE3F0" } };
  const XL_BORDES = { top: XL_BORDE, bottom: XL_BORDE, left: XL_BORDE, right: XL_BORDE };

  const xlFill = (argb) => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
  const xlBlanco = { color: { argb: "FFFFFFFF" }, bold: true, size: 9 };
  const xlNegro = { color: { argb: "FF000000" }, size: 9 };
  const xlNegroBold = { color: { argb: "FF000000" }, bold: true, size: 9 };
  const xlMoneda = '"$"#,##0.00';

  function estilizarFila(row, { fill, font, align = "center", cols = 5, numFmtCols = [] } = {}) {
    for (let c = 1; c <= cols; c++) {
      const cell = row.getCell(c);
      if (fill) cell.fill = xlFill(fill);
      cell.font = font ?? xlNegro;
      cell.border = XL_BORDES;
      cell.alignment = { horizontal: c === 1 ? "left" : align, vertical: "middle" };
      if (numFmtCols.includes(c)) cell.numFmt = xlMoneda;
    }
  }

  const exportarExcel = async () => {
    if (!datos || datos.length === 0) return;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Estado de Cuenta");
    ws.columns = [
      { width: 34 },
      { width: 14 },
      { width: 16 },
      { width: 14 },
      { width: 16 },
    ];

    let r = 1;

    // — Periodo —
    ws.mergeCells(r, 1, r, 5);
    ws.getCell(r, 1).value = periodo;
    estilizarFila(ws.getRow(r), { fill: XL_DARK, font: { ...xlBlanco, size: 11 } });
    ws.getRow(r).height = 22;
    r++;

    // — Header resumen: CONCEPTO (alto completo) | VENTA / $100-$50 / Cant.-S-Total —
    const filaConcepto = r;
    ws.mergeCells(r, 1, r + 2, 1);
    ws.getCell(r, 1).value = "CONCEPTO";
    ws.mergeCells(r, 2, r, 5);
    ws.getCell(r, 2).value = "VENTA";
    r++;
    ws.mergeCells(r, 2, r, 3);
    ws.getCell(r, 2).value = "$100";
    ws.mergeCells(r, 4, r, 5);
    ws.getCell(r, 4).value = "$50";
    r++;
    ["Cant.", "S-Total", "Cant.", "S-Total"].forEach((h, i) => {
      ws.getCell(r, i + 2).value = h;
    });
    r++;
    for (let rr = filaConcepto; rr < r; rr++) {
      const bg = rr === filaConcepto ? XL_MID : rr === filaConcepto + 1 ? XL_LIGHT : XL_SUB;
      estilizarFila(ws.getRow(rr), { fill: bg, font: xlBlanco });
    }

    // — Filas de datos —
    datos.forEach((o, i) => {
      const row = ws.getRow(r);
      row.getCell(1).value = o.nombre;
      row.getCell(2).value = o.carros;
      row.getCell(3).value = o.carros * PRECIO_CARRO;
      row.getCell(4).value = o.motos;
      row.getCell(5).value = o.motos * PRECIO_MOTO;
      estilizarFila(row, { fill: i % 2 === 1 ? XL_ZEBRA : null, numFmtCols: [3, 5] });
      r++;
    });

    // — CONSTANCIAS —
    {
      const row = ws.getRow(r);
      row.getCell(1).value = "CONSTANCIAS";
      row.getCell(2).value = totCarros;
      row.getCell(3).value = stCarros;
      row.getCell(4).value = totMotos;
      row.getCell(5).value = stMotos;
      estilizarFila(row, { fill: XL_GRIS, font: xlNegroBold, numFmtCols: [3, 5] });
      r++;
    }

    // — TOTAL PENDIENTE DE PAGO —
    {
      ws.mergeCells(r, 1, r, 4);
      ws.getCell(r, 1).value = "TOTAL PENDIENTE DE PAGO";
      ws.getCell(r, 5).value = grandTotal;
      estilizarFila(ws.getRow(r), { fill: XL_AZULC, font: xlNegroBold, numFmtCols: [5] });
      r++;
    }

    // — IVA —
    {
      ws.mergeCells(r, 1, r, 4);
      const label = ws.getCell(r, 1);
      label.value = "IVA (16%)";
      label.font = { ...xlNegro, color: { argb: "FF4B5563" } };
      label.alignment = { horizontal: "right", vertical: "middle" };

      const val = ws.getCell(r, 5);
      val.value = iva;
      val.numFmt = xlMoneda;
      val.font = { ...xlNegro, color: { argb: "FF4B5563" } };
      val.fill = xlFill(XL_AZULC);
      val.border = XL_BORDES;
      val.alignment = { horizontal: "center", vertical: "middle" };
      r++;
    }

    // — TOTAL + IVA —
    {
      ws.mergeCells(r, 1, r, 4);
      const label = ws.getCell(r, 1);
      label.value = "TOTAL + IVA";
      label.font = xlNegroBold;
      label.alignment = { horizontal: "right", vertical: "middle" };

      const val = ws.getCell(r, 5);
      val.value = totalConIva;
      val.numFmt = xlMoneda;
      val.font = xlBlanco;
      val.fill = xlFill(XL_DARK);
      val.border = XL_BORDES;
      val.alignment = { horizontal: "center", vertical: "middle" };
      r++;
    }

    r += 2;

    // — Detalle por oficina — mismos datos que usa el PDF —
    const mapaOficinas = new Map();
    for (const p of polizasRaw) {
      const { key, nombre } = claveYNombre(p);
      if (!mapaOficinas.has(key)) mapaOficinas.set(key, { nombre, polizas: [] });
      mapaOficinas.get(key).polizas.push(p);
    }
    const oficinasOrdenadas = [...mapaOficinas.values()].sort((a, b) =>
      a.nombre.localeCompare(b.nombre),
    );
    ws.mergeCells(r, 1, r, 5);
    ws.getCell(r, 1).value = "DETALLE POR OFICINA";
    ws.getCell(r, 1).font = { ...xlNegroBold, size: 11 };
    r += 2;

    oficinasOrdenadas.forEach((of) => {
      // Cabecera de la oficina — celda combinada azul marino, letra blanca,
      // abarcando las 5 columnas (No. Póliza / Cobertura / Precio Total /
      // Forma de Pago / Fecha Emisión).
      ws.mergeCells(r, 1, r, 5);
      ws.getCell(r, 1).value = of.nombre;
      estilizarFila(ws.getRow(r), { fill: XL_DARK, font: { ...xlBlanco, size: 10 } });
      ws.getRow(r).height = 20;
      r++;

      ["No. Póliza", "Cobertura", "Precio Total", "Forma de Pago", "Fecha Emisión"].forEach((h, i) => {
        ws.getCell(r, i + 1).value = h;
      });
      estilizarFila(ws.getRow(r), { fill: XL_MID, font: xlBlanco });
      r++;

      of.polizas.forEach((p, i) => {
        const row = ws.getRow(r);
        row.getCell(1).value = p.constancia || "—";
        row.getCell(2).value = p.coberturas?.nombre || "—";
        row.getCell(3).value = Number(p.coberturas?.prima_total ?? 0);
        row.getCell(4).value = p.forma_pago || "—";
        row.getCell(5).value = fmtFecha(p.created_at);
        estilizarFila(row, { fill: i % 2 === 1 ? XL_ZEBRA : null, numFmtCols: [3] });
        row.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
        row.getCell(3).alignment = { horizontal: "right", vertical: "middle" };
        r++;
      });

      r++; // espacio entre oficinas
    });

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `estado-cuenta-${rango.s}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // — Detalle de Primas: hoja 1 (4 listados por precio/forma de pago) +
  // hoja 2 (cantidad y monto por oficina + resumen) —
  const exportarExcelPrimas = async () => {
    if (!datos || datos.length === 0) return;

    const filas = filasPrimas, listas = listasPrimas, t = totalesPrimas;

    const wb = new ExcelJS.Workbook();

    // ── Hoja 1: listados por precio/forma de pago ──
    const ws1 = wb.addWorksheet("Detalle de Primas");
    ws1.columns = [
      { width: 6 },
      { width: 26 },
      { width: 16 },
      { width: 24 },
      { width: 14 },
      { width: 14 },
      { width: 14 },
    ];

    let r = 1;
    ws1.mergeCells(r, 1, r, 7);
    ws1.getCell(r, 1).value = `DETALLE DE PRIMAS — ${periodo}`;
    estilizarFila(ws1.getRow(r), { fill: XL_DARK, font: { ...xlBlanco, size: 11 }, cols: 7 });
    ws1.getRow(r).height = 22;
    r += 2;

    DETALLE_GRUPOS.forEach((g) => {
      const pols = listas[g.key];
      const monto = pols.reduce((s, p) => s + Number(p.coberturas?.prima_total ?? 0), 0);

      ws1.mergeCells(r, 1, r, 7);
      ws1.getCell(r, 1).value = g.titulo;
      estilizarFila(ws1.getRow(r), { fill: XL_DARK, font: { ...xlBlanco, size: 10 }, cols: 7 });
      ws1.getRow(r).height = 20;
      r++;

      ["No.", "Oficina", "No. Póliza", "Cobertura", "Precio Total", "Forma de Pago", "Fecha Emisión"].forEach(
        (h, i) => {
          ws1.getCell(r, i + 1).value = h;
        },
      );
      estilizarFila(ws1.getRow(r), { fill: XL_MID, font: xlBlanco, cols: 7 });
      r++;

      if (pols.length === 0) {
        ws1.mergeCells(r, 1, r, 7);
        ws1.getCell(r, 1).value = "Sin pólizas en este periodo.";
        estilizarFila(ws1.getRow(r), { font: { ...xlNegro, color: { argb: "FF9CA3AF" } }, cols: 7 });
        r++;
      } else {
        pols.forEach((p, i) => {
          const row = ws1.getRow(r);
          row.getCell(1).value = i + 1;
          row.getCell(2).value = p._oficinaNombre;
          row.getCell(3).value = p.constancia || "—";
          row.getCell(4).value = p.coberturas?.nombre || "—";
          row.getCell(5).value = Number(p.coberturas?.prima_total ?? 0);
          row.getCell(6).value = p.forma_pago || "—";
          row.getCell(7).value = fmtFecha(p.created_at);
          estilizarFila(row, { fill: i % 2 === 1 ? XL_ZEBRA : null, cols: 7, numFmtCols: [5] });
          row.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
          row.getCell(4).alignment = { horizontal: "left", vertical: "middle" };
          r++;
        });
      }

      ws1.mergeCells(r, 1, r, 4);
      ws1.getCell(r, 1).value = `TOTAL: ${pols.length} pólizas`;
      ws1.mergeCells(r, 5, r, 7);
      ws1.getCell(r, 5).value = monto;
      estilizarFila(ws1.getRow(r), { fill: XL_GRIS, font: xlNegroBold, cols: 7, numFmtCols: [5] });
      r += 2;
    });

    // ── Hoja 2: cantidad y monto por oficina + resumen ──
    const ws2 = wb.addWorksheet("Resumen por Oficina");
    ws2.columns = [
      { width: 24 }, { width: 12 }, { width: 12 }, { width: 12 },
      { width: 24 }, { width: 12 }, { width: 12 }, { width: 12 },
    ];

    let r2 = 1;

    const construirTablaOficinas = (titulo, esMoneda) => {
      ws2.mergeCells(r2, 1, r2, 8);
      ws2.getCell(r2, 1).value = titulo;
      estilizarFila(ws2.getRow(r2), { fill: XL_DARK, font: { ...xlBlanco, size: 11 }, cols: 8 });
      ws2.getRow(r2).height = 22;
      r2++;

      const rHead1 = r2;
      ws2.mergeCells(rHead1, 1, rHead1 + 1, 1);
      ws2.getCell(rHead1, 1).value = "PÓLIZAS";
      ws2.mergeCells(rHead1, 2, rHead1, 4);
      ws2.getCell(rHead1, 2).value = "CONTADO";
      ws2.mergeCells(rHead1, 5, rHead1 + 1, 5);
      ws2.getCell(rHead1, 5).value = "PÓLIZAS";
      ws2.mergeCells(rHead1, 6, rHead1, 8);
      ws2.getCell(rHead1, 6).value = "PAGOS";
      r2++;
      ["2,200", "2,500", "TOTAL"].forEach((h, i) => { ws2.getCell(r2, 2 + i).value = h; });
      ["2,200", "2,674", "TOTAL"].forEach((h, i) => { ws2.getCell(r2, 6 + i).value = h; });
      r2++;
      for (let rr = rHead1; rr < r2; rr++) {
        estilizarFila(ws2.getRow(rr), { fill: rr === rHead1 ? XL_MID : XL_SUB, font: xlBlanco, cols: 8 });
      }

      const numFmtCols = esMoneda ? [2, 3, 4, 6, 7, 8] : [];

      filas.forEach((o, i) => {
        const c1 = esMoneda ? o.mc2200 : o.c2200;
        const c2 = esMoneda ? o.mc2500 : o.c2500;
        const p1 = esMoneda ? o.mp2200 : o.p2200;
        const p2 = esMoneda ? o.mp2674 : o.p2674;
        const row = ws2.getRow(r2);
        row.getCell(1).value = o.nombre;
        row.getCell(2).value = c1;
        row.getCell(3).value = c2;
        row.getCell(4).value = c1 + c2;
        row.getCell(5).value = o.nombre;
        row.getCell(6).value = p1;
        row.getCell(7).value = p2;
        row.getCell(8).value = p1 + p2;
        estilizarFila(row, { fill: i % 2 === 1 ? XL_ZEBRA : null, cols: 8, numFmtCols });
        row.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
        row.getCell(5).alignment = { horizontal: "left", vertical: "middle" };
        r2++;
      });

      {
        const row = ws2.getRow(r2);
        row.getCell(1).value = "TOTAL";
        row.getCell(2).value = esMoneda ? t.monto.c2200 : t.cant.c2200;
        row.getCell(3).value = esMoneda ? t.monto.c2500 : t.cant.c2500;
        row.getCell(4).value = esMoneda ? t.montoContado : t.totContado;
        row.getCell(5).value = "TOTAL";
        row.getCell(6).value = esMoneda ? t.monto.p2200 : t.cant.p2200;
        row.getCell(7).value = esMoneda ? t.monto.p2674 : t.cant.p2674;
        row.getCell(8).value = esMoneda ? t.montoPagos : t.totPagos;
        estilizarFila(row, { fill: XL_GRIS, font: xlNegroBold, cols: 8, numFmtCols });
        r2++;
      }

      {
        ws2.mergeCells(r2, 1, r2, 8);
        ws2.getCell(r2, 1).value = esMoneda
          ? `TOTAL GENERAL RECAUDADO DEL MES (CONTADO + PAGOS): ${fmt$(t.montoGeneral)}`
          : `TOTAL GENERAL DE PÓLIZAS DEL MES (CONTADO + PAGOS): ${t.totGeneral}`;
        estilizarFila(ws2.getRow(r2), { fill: XL_AZULC, font: xlNegroBold, cols: 8 });
        r2++;
      }

      r2 += 2;
    };

    construirTablaOficinas("CANTIDAD DE PÓLIZAS POR OFICINA", false);
    construirTablaOficinas("MONTO RECAUDADO POR OFICINA", true);

    // — RESUMEN —
    ws2.mergeCells(r2, 1, r2, 8);
    ws2.getCell(r2, 1).value = "RESUMEN";
    estilizarFila(ws2.getRow(r2), { fill: XL_DARK, font: { ...xlBlanco, size: 11 }, cols: 8 });
    r2++;

    [
      ["CONTADO", t.totContado, t.montoContado],
      ["PAGOS", t.totPagos, t.montoPagos],
    ].forEach(([label, cant, monto]) => {
      ws2.mergeCells(r2, 1, r2, 3);
      ws2.getCell(r2, 1).value = label;
      ws2.mergeCells(r2, 4, r2, 6);
      ws2.getCell(r2, 4).value = cant;
      ws2.mergeCells(r2, 7, r2, 8);
      ws2.getCell(r2, 7).value = monto;
      estilizarFila(ws2.getRow(r2), { cols: 8, numFmtCols: [7] });
      r2++;
    });

    ws2.mergeCells(r2, 1, r2, 3);
    ws2.getCell(r2, 1).value = "TOTAL";
    ws2.mergeCells(r2, 4, r2, 6);
    ws2.getCell(r2, 4).value = t.totGeneral;
    ws2.mergeCells(r2, 7, r2, 8);
    ws2.getCell(r2, 7).value = t.montoGeneral;
    estilizarFila(ws2.getRow(r2), { fill: XL_GRIS, font: xlNegroBold, cols: 8, numFmtCols: [7] });

    // ── Hoja 3: gráficas (imagen del pastel + leyenda de colores por oficina) ──
    // ExcelJS no soporta gráficas nativas: se inserta el <svg> ya renderizado
    // en pantalla, rasterizado a PNG.
    const ws3 = wb.addWorksheet("Gráficas");
    ws3.columns = [{ width: 4 }, { width: 28 }, { width: 14 }, { width: 10 }];

    const graficas = [
      {
        titulo: "CANTIDAD DE PÓLIZAS POR OFICINA",
        svg: refChartCantOficina.current?.querySelector("svg"),
        datos: datosPieCantOficina,
        moneda: false,
      },
      {
        titulo: "MONTO RECAUDADO POR OFICINA",
        svg: refChartMontoOficina.current?.querySelector("svg"),
        datos: datosPieMontoOficina,
        moneda: true,
      },
      {
        titulo: "DISTRIBUCIÓN POR TIPO DE PRIMA",
        svg: refChartTipoPrima.current?.querySelector("svg"),
        datos: datosPieTipoPrima,
        moneda: false,
      },
    ];

    let r3 = 1;
    for (const g of graficas) {
      ws3.mergeCells(r3, 1, r3, 4);
      ws3.getCell(r3, 1).value = g.titulo;
      estilizarFila(ws3.getRow(r3), { fill: XL_DARK, font: { ...xlBlanco, size: 11 }, cols: 4 });
      r3 += 2;

      const png = await svgAPng(g.svg, 2);
      if (png) {
        const altoImg = 220;
        const imgId = wb.addImage({ base64: png.dataUrl, extension: "png" });
        ws3.addImage(imgId, { tl: { col: 0.2, row: r3 - 1 }, ext: { width: 260, height: altoImg } });
        r3 += Math.ceil(altoImg / 20) + 1;
      } else {
        ws3.getCell(r3, 1).value = "(No fue posible generar la imagen de esta gráfica.)";
        r3 += 2;
      }

      const totalG = g.datos.reduce((s, d) => s + d.valor, 0);
      g.datos.forEach((d) => {
        const row = ws3.getRow(r3);
        row.getCell(1).fill = xlFill(`FF${d.color.replace("#", "").toUpperCase()}`);
        row.getCell(2).value = d.nombre;
        row.getCell(3).value = d.valor;
        row.getCell(4).value = totalG > 0 ? `${Math.round((d.valor / totalG) * 100)}%` : "0%";
        estilizarFila(row, { cols: 4, numFmtCols: g.moneda ? [3] : [] });
        row.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
        r3++;
      });

      r3 += 2;
    }

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `detalle-primas-${rango.s}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Imprime un documento HTML completo desde un iframe oculto anclado a esta
  // misma página, en vez de una pestaña nueva en about:blank — así el pie de
  // página que agrega el navegador al imprimir muestra la URL real de la app
  // en vez de "about:blank".
  const imprimirHTML = (html) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument;
    doc.open();
    doc.write(html);
    doc.close();

    const limpiar = () => iframe.remove();
    iframe.contentWindow.addEventListener("afterprint", limpiar);
    // Respaldo por si "afterprint" no dispara en algún navegador.
    setTimeout(limpiar, 60000);

    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  };

  const exportarPDF = () => {
    if (!datos || datos.length === 0) return;

    // — Tabla resumen —
    const filasDatos = datos
      .map(
        (o, i) => `<tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
          ${td(o.nombre)}
          ${td(o.carros, "text-align:center")}
          ${td(fmt$(o.carros * PRECIO_CARRO), "text-align:center")}
          ${td(o.motos, "text-align:center")}
          ${td(fmt$(o.motos * PRECIO_MOTO), "text-align:center")}
        </tr>`,
      )
      .join("");

    // — Detalle por oficina —
    const mapaOficinas = new Map();
    for (const p of polizasRaw) {
      const { key, nombre } = claveYNombre(p);
      if (!mapaOficinas.has(key))
        mapaOficinas.set(key, { nombre, polizas: [] });
      mapaOficinas.get(key).polizas.push(p);
    }
    const oficinasOrdenadas = [...mapaOficinas.values()].sort((a, b) =>
      a.nombre.localeCompare(b.nombre),
    );

    const seccionesOficinas = oficinasOrdenadas
      .map((of) => {
        const filas = of.polizas
          .map(
            (
              p,
              i,
            ) => `<tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
              ${td(p.constancia || "—")}
              ${td(p.coberturas?.nombre || "—")}
              ${td(fmt$(p.coberturas?.prima_total ?? 0), "text-align:right")}
              ${td(p.forma_pago || "—", "text-align:center")}
              ${td(fmtFecha(p.created_at), "text-align:center")}
            </tr>`,
          )
          .join("");
        return `
          <h3 style="margin:24px 0 6px;font-size:13px;color:#13193a;border-bottom:2px solid #13193a;padding-bottom:4px">
            ${of.nombre}
          </h3>
          <table style="border-collapse:collapse;width:100%;font-size:11px">
            <thead>
              <tr>
                ${th("No. Póliza")}
                ${th("Cobertura")}
                ${th("Precio Total")}
                ${th("Forma de Pago")}
                ${th("Fecha Emisión")}
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>`;
      })
      .join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>${periodo}</title>
      <style>
        body{font-family:sans-serif;font-size:12px;margin:24px;color:#111}
        table{border-collapse:collapse;width:100%}
        @media print{@page{margin:1.5cm} h3{page-break-before:auto}}
      </style>
      </head><body>
      <h2 style="text-align:center;margin-bottom:16px">${periodo}</h2>

      <!-- Tabla resumen -->
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

      <!-- Detalle por oficina -->
      <h2 style="margin-top:32px;margin-bottom:4px;font-size:14px">Detalle por Oficina</h2>
      ${seccionesOficinas}

      </body></html>`;

    imprimirHTML(html);
  };

  // — Detalle de Primas (PDF): 4 listados por precio/forma de pago, tabla de
  // cantidad de pólizas por oficina, tabla de monto recaudado por oficina, y
  // resumen final —
  const exportarPDFPrimas = () => {
    if (!datos || datos.length === 0) return;

    const filas = filasPrimas, listas = listasPrimas, t = totalesPrimas;

    // — Gráficas: se reutiliza el <svg> ya renderizado en pantalla —
    const graficaHTML = (titulo, svgEl, datos2, formato) => {
      if (!svgEl || datos2.length === 0) return "";
      return `
        <div style="flex:1;min-width:220px">
          <h4 style="text-align:center;font-size:11px;color:#374151;margin:0 0 4px">${titulo}</h4>
          <div style="max-width:260px;margin:0 auto">${svgAString(svgEl)}</div>
          ${leyendaHTML(datos2, formato)}
        </div>`;
    };
    const seccionGraficas = `
      <div style="display:flex;flex-wrap:wrap;gap:16px;margin:16px 0 28px;page-break-inside:avoid">
        ${graficaHTML("Cantidad de Pólizas por Oficina", refChartCantOficina.current?.querySelector("svg"), datosPieCantOficina, (n) => `${n}`)}
        ${graficaHTML("Monto Recaudado por Oficina", refChartMontoOficina.current?.querySelector("svg"), datosPieMontoOficina, fmt$)}
        ${graficaHTML("Distribución por Tipo de Prima", refChartTipoPrima.current?.querySelector("svg"), datosPieTipoPrima, (n) => `${n}`)}
      </div>`;

    const thSub = (txt) =>
      `<th style="background:#3d5080;color:#fff;padding:6px 10px;border:1px solid #dde3f0;text-align:center">${txt}</th>`;

    const seccionesListados = DETALLE_GRUPOS.map((g) => {
      const pols = listas[g.key];
      const monto = pols.reduce((s, p) => s + Number(p.coberturas?.prima_total ?? 0), 0);
      const filasHtml =
        pols.length === 0
          ? `<tr><td colspan="7" style="padding:10px;text-align:center;color:#9ca3af;border:1px solid #dde3f0">Sin pólizas en este periodo.</td></tr>`
          : pols
              .map(
                (p, i) => `<tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
                  ${td(i + 1, "text-align:center")}
                  ${td(p._oficinaNombre)}
                  ${td(p.constancia || "—")}
                  ${td(p.coberturas?.nombre || "—")}
                  ${td(fmt$(p.coberturas?.prima_total ?? 0), "text-align:right")}
                  ${td(p.forma_pago || "—", "text-align:center")}
                  ${td(fmtFecha(p.created_at), "text-align:center")}
                </tr>`,
              )
              .join("");
      return `
        <h3 style="margin:24px 0 6px;font-size:13px;color:#13193a;border-bottom:2px solid #13193a;padding-bottom:4px">
          ${g.titulo}
        </h3>
        <table style="border-collapse:collapse;width:100%;font-size:11px">
          <thead>
            <tr>
              ${th("No.")}${th("Oficina")}${th("No. Póliza")}${th("Cobertura")}${th("Precio Total")}${th("Forma de Pago")}${th("Fecha Emisión")}
            </tr>
          </thead>
          <tbody>
            ${filasHtml}
            <tr style="background:#f3f4f6;font-weight:bold">
              <td colspan="4" style="padding:6px 10px;border:1px solid #dde3f0">TOTAL: ${pols.length} pólizas</td>
              <td colspan="3" style="padding:6px 10px;border:1px solid #dde3f0;text-align:center">${fmt$(monto)}</td>
            </tr>
          </tbody>
        </table>`;
    }).join("");

    const tablaBloques = (filasHtml, filaTotales, textoGeneral) => `
      <table style="border-collapse:collapse;width:100%;font-size:11px;margin-bottom:8px">
        <thead>
          <tr>
            <th rowspan="2" style="background:#1e2a50;color:#fff;padding:6px 10px;border:1px solid #dde3f0">PÓLIZAS</th>
            <th colspan="3" style="background:#1e2a50;color:#fff;padding:6px 10px;border:1px solid #dde3f0;text-align:center">CONTADO</th>
            <th rowspan="2" style="background:#1e2a50;color:#fff;padding:6px 10px;border:1px solid #dde3f0">PÓLIZAS</th>
            <th colspan="3" style="background:#1e2a50;color:#fff;padding:6px 10px;border:1px solid #dde3f0;text-align:center">PAGOS</th>
          </tr>
          <tr>
            ${thSub("2,200")}${thSub("2,500")}${thSub("TOTAL")}
            ${thSub("2,200")}${thSub("2,674")}${thSub("TOTAL")}
          </tr>
        </thead>
        <tbody>
          ${filasHtml}
          ${filaTotales}
        </tbody>
      </table>
      <div style="background:#eff6ff;border:1px solid #dde3f0;padding:8px 10px;font-weight:bold;text-align:center;margin-bottom:24px">
        ${textoGeneral}
      </div>`;

    const filaOficinaCant = (o) => `<tr>
        ${td(o.nombre)}
        ${td(o.c2200, "text-align:center")}
        ${td(o.c2500, "text-align:center")}
        ${td(o.c2200 + o.c2500, "text-align:center;font-weight:bold")}
        ${td(o.nombre)}
        ${td(o.p2200, "text-align:center")}
        ${td(o.p2674, "text-align:center")}
        ${td(o.p2200 + o.p2674, "text-align:center;font-weight:bold")}
      </tr>`;
    const filaOficinaMonto = (o) => `<tr>
        ${td(o.nombre)}
        ${td(fmt$(o.mc2200), "text-align:right")}
        ${td(fmt$(o.mc2500), "text-align:right")}
        ${td(fmt$(o.mc2200 + o.mc2500), "text-align:right;font-weight:bold")}
        ${td(o.nombre)}
        ${td(fmt$(o.mp2200), "text-align:right")}
        ${td(fmt$(o.mp2674), "text-align:right")}
        ${td(fmt$(o.mp2200 + o.mp2674), "text-align:right;font-weight:bold")}
      </tr>`;

    const totalesCant = `<tr style="background:#f3f4f6;font-weight:bold">
        ${td("TOTAL")}
        ${td(t.cant.c2200, "text-align:center")}
        ${td(t.cant.c2500, "text-align:center")}
        ${td(t.totContado, "text-align:center")}
        ${td("TOTAL")}
        ${td(t.cant.p2200, "text-align:center")}
        ${td(t.cant.p2674, "text-align:center")}
        ${td(t.totPagos, "text-align:center")}
      </tr>`;
    const totalesMonto = `<tr style="background:#f3f4f6;font-weight:bold">
        ${td("TOTAL")}
        ${td(fmt$(t.monto.c2200), "text-align:right")}
        ${td(fmt$(t.monto.c2500), "text-align:right")}
        ${td(fmt$(t.montoContado), "text-align:right")}
        ${td("TOTAL")}
        ${td(fmt$(t.monto.p2200), "text-align:right")}
        ${td(fmt$(t.monto.p2674), "text-align:right")}
        ${td(fmt$(t.montoPagos), "text-align:right")}
      </tr>`;

    const tablaResumen = `
      <table style="border-collapse:collapse;width:60%;font-size:12px;margin-top:8px">
        <tbody>
          <tr>${th("RESUMEN", "text-align:left")}${th("Pólizas")}${th("Monto")}</tr>
          <tr>${td("CONTADO")}${td(t.totContado, "text-align:center")}${td(fmt$(t.montoContado), "text-align:right")}</tr>
          <tr>${td("PAGOS")}${td(t.totPagos, "text-align:center")}${td(fmt$(t.montoPagos), "text-align:right")}</tr>
          <tr style="background:#13193a;color:#fff;font-weight:bold">
            <td style="padding:6px 10px;border:1px solid #dde3f0">TOTAL</td>
            <td style="padding:6px 10px;border:1px solid #dde3f0;text-align:center">${t.totGeneral}</td>
            <td style="padding:6px 10px;border:1px solid #dde3f0;text-align:right">${fmt$(t.montoGeneral)}</td>
          </tr>
        </tbody>
      </table>`;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Detalle de Primas - ${periodo}</title>
      <style>
        body{font-family:sans-serif;font-size:12px;margin:24px;color:#111}
        table{border-collapse:collapse;width:100%}
        @media print{@page{margin:1.5cm} h2,h3{page-break-after:avoid}}
      </style>
      </head><body>
      <h2 style="text-align:center;margin-bottom:4px">DETALLE DE PRIMAS</h2>
      <h2 style="text-align:center;margin-top:0;margin-bottom:16px;font-size:13px;color:#4b5563">${periodo}</h2>

      ${seccionGraficas}

      ${seccionesListados}

      <h2 style="margin-top:32px;margin-bottom:8px;font-size:14px">Cantidad de Pólizas por Oficina</h2>
      ${tablaBloques(
        filas.map(filaOficinaCant).join(""),
        totalesCant,
        `TOTAL GENERAL DE PÓLIZAS DEL MES (CONTADO + PAGOS): ${t.totGeneral}`,
      )}

      <h2 style="margin-top:8px;margin-bottom:8px;font-size:14px">Monto Recaudado por Oficina</h2>
      ${tablaBloques(
        filas.map(filaOficinaMonto).join(""),
        totalesMonto,
        `TOTAL GENERAL RECAUDADO DEL MES (CONTADO + PAGOS): ${fmt$(t.montoGeneral)}`,
      )}

      <h2 style="margin-top:8px;margin-bottom:8px;font-size:14px">Resumen</h2>
      ${tablaResumen}

      </body></html>`;

    imprimirHTML(html);
  };

  const inp =
    "px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all";

  return (
    <div className="p-4 md:p-6 space-y-2 max-w-5xl mx-auto">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#13193a] flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[#13193a]">Estado de Cuenta</h1>
          <p className="text-xs text-gray-500">
            Resumen de pólizas emitidas por periodo
          </p>
        </div>
      </div>

      {/* Panel de filtro */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
        {/* Toggle modo */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-500">
            Consultar por:
          </span>
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            {[
              { id: "mes", label: "Mes" },
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
                    <option key={i} value={i + 1}>
                      {m}
                    </option>
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
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 font-medium">
                  Desde
                </label>
                <input
                  type="date"
                  value={fInicio}
                  onChange={(e) => handleFechaInicio(e.target.value)}
                  className={inp}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 font-medium">
                  Hasta
                </label>
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
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium hidden lg:inline">
                  Resumen por Oficina:
                </span>
                <button
                  onClick={exportarExcel}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-green-600 text-green-700 text-sm font-medium hover:bg-green-50 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </button>
                <button
                  onClick={exportarPDF}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500 text-red-600 text-sm font-medium hover:bg-red-50 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  PDF
                </button>
              </div>

              <div className="w-px h-8 bg-gray-200 hidden sm:block" />

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium hidden lg:inline">
                  Detalle de Primas:
                </span>
                <button
                  onClick={exportarExcelPrimas}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-700 text-emerald-800 text-sm font-medium hover:bg-emerald-50 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </button>
                <button
                  onClick={exportarPDFPrimas}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-600 text-rose-700 text-sm font-medium hover:bg-rose-50 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  PDF
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Gráficas de Detalle de Primas — NO se muestran en la app; se montan
          fuera de pantalla únicamente para poder capturar su <svg> y
          usarlo en las exportaciones de PDF y Excel. */}
      {datos !== null && datos.length > 0 && totalesPrimas.totGeneral > 0 && (
        <div style={{ position: "absolute", left: "-99999px", top: 0 }} aria-hidden="true">
          <div style={{ width: 480 }}>
            <GraficaPastel
              ref={refChartCantOficina}
              titulo="Pólizas por Oficina"
              datos={datosPieCantOficina}
              formato={(n) => `${n}`}
            />
          </div>
          <div style={{ width: 480 }}>
            <GraficaPastel
              ref={refChartMontoOficina}
              titulo="Monto Recaudado por Oficina"
              datos={datosPieMontoOficina}
              formato={fmt$}
            />
          </div>
          <div style={{ width: 480 }}>
            <GraficaPastel
              ref={refChartTipoPrima}
              titulo="Distribución por Tipo de Prima"
              datos={datosPieTipoPrima}
              formato={(n) => `${n}`}
            />
          </div>
        </div>
      )}

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
                    <tr
                      key={i}
                      className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}
                    >
                      <td
                        className={`${CL_BORDER} px-4 py-2 font-medium text-gray-700`}
                      >
                        {o.nombre}
                      </td>
                      <td
                        className={`${CL_BORDER} px-3 py-2 text-center text-gray-700`}
                      >
                        {o.carros}
                      </td>
                      <td
                        className={`${CL_BORDER} px-3 py-2 text-center text-gray-700`}
                      >
                        {fmt$(o.carros * PRECIO_CARRO)}
                      </td>
                      <td
                        className={`${CL_BORDER} px-3 py-2 text-center text-gray-700`}
                      >
                        {o.motos}
                      </td>
                      <td
                        className={`${CL_BORDER} px-3 py-2 text-center text-gray-700`}
                      >
                        {fmt$(o.motos * PRECIO_MOTO)}
                      </td>
                    </tr>
                  ))
                )}

                {/* CONSTANCIAS — totales por columna */}
                <tr className="bg-gray-100 font-semibold">
                  <td className={`${CL_BORDER} px-4 py-2 text-gray-800`}>
                    CONSTANCIAS
                  </td>
                  <td
                    className={`${CL_BORDER} px-3 py-2 text-center text-gray-800`}
                  >
                    {totCarros}
                  </td>
                  <td
                    className={`${CL_BORDER} px-3 py-2 text-center text-gray-800`}
                  >
                    {fmt$(stCarros)}
                  </td>
                  <td
                    className={`${CL_BORDER} px-3 py-2 text-center text-gray-800`}
                  >
                    {totMotos}
                  </td>
                  <td
                    className={`${CL_BORDER} px-3 py-2 text-center text-gray-800`}
                  >
                    {fmt$(stMotos)}
                  </td>
                </tr>

                {/* TOTAL PENDIENTE DE PAGO */}
                <tr className="bg-blue-50 font-bold">
                  <td
                    colSpan={4}
                    className={`${CL_BORDER} px-4 py-2.5 text-[#13193a] tracking-wide`}
                  >
                    TOTAL PENDIENTE DE PAGO
                  </td>
                  <td
                    className={`${CL_BORDER} px-3 py-2.5 text-center text-[#13193a]`}
                  >
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
                  <td
                    className={`${CL_BORDER} px-3 py-2 text-center text-gray-600 bg-blue-50`}
                  >
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
                  <td
                    className={`${CL_BORDER} px-3 py-2.5 text-center font-bold text-white bg-[#13193a]`}
                  >
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
