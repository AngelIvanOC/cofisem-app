// ============================================================
// Reporte de comisiones (ADMINISTRACION) — producción por vendedor.
//
// Una fila por CUOTA COBRADA dentro del rango de fechas, agrupadas por
// vendedor (polizas_cofisem.vendedor_id → vendedores). Las cuotas se
// arman e interpretan con la misma lógica de /pagos (cuotasCofisem.js),
// así que "cobrada" y "fecha de pago" significan lo mismo en ambos lados.
//
// Pendiente de definir por el cliente (por eso van en "—"):
//   - % de comisión que se pagará a cada vendedor.
//   - Gastos de administración.
// La comisión que sí se muestra es el vale capturado en /comisiones
// (comisiones_cofisem), uno POR CUOTA (UNIQUE poliza_cofisem_id +
// num_cuota); el "%" es ese vale entre la prima neta de la cuota.
// ============================================================
import { useState, useEffect, useMemo, useRef } from "react";
import {
  HandCoins,
  Loader2,
  Users,
  FileSpreadsheet,
  FileText,
  CalendarDays,
  ChevronDown,
  Check,
} from "lucide-react";
import { exportarComisionesExcel } from "../../services/comisionesExport";
import { supabase } from "../../supabaseClient";
import { hoyISO } from "../../utils/fecha";
import { cuotasDePoliza } from "../pagos/cuotasCofisem";
import {
  construirPolizaRecibo,
  calcularImportesRecibo,
  mapCuota,
} from "../../utils/recibo";

const n = (v) => parseFloat(v) || 0;
const $ = (v) =>
  `$${n(v).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt = (d) =>
  d
    ? new Date(d + "T00:00:00").toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

// IVA 16% ya incluido en la prima total de la cuota (neta + derecho +
// IVA): 625.00 → 86.21 de IVA, igual que en los recibos. Solo para
// pólizas que no son de GAMAN — las de GAMAN usan el desglose del recibo.
const ivaIncluido = (total) => Math.round((n(total) * 0.16 / 1.16) * 100) / 100;

// Mismo criterio que fetchConfigCostos(fecha) (services/configuracion.js),
// pero sobre todas las filas ya cargadas, para no pedir el config una vez
// por póliza: para cada clave, el valor más reciente vigente a esa fecha.
function configParaFecha(filasConfig, fecha) {
  const dia = fecha ?? hoyISO();
  const config = {};
  for (const row of filasConfig) {
    if (row.vigente_desde > dia) continue;
    if (!(row.clave in config)) config[row.clave] = Number(row.valor);
  }
  return config;
}

// Cuota ligada a un pago de GAMAN: GAMAN solo guarda el monto del pago,
// así que la prima neta/total/IVA se desglosan con la MISMA fórmula del
// recibo oficial (utils/recibo.js), igual que primaGaman.js al completar
// en /corte y RegistrarCobroModal al cobrar una cuota subsecuente.
function importesCuotaGaman(p, c, filasConfig) {
  if (!c.pago_gaman_id || !c.pago_gaman || !p.gaman) return null;
  const cfg = configParaFecha(filasConfig, p.gaman.fecha_inicio);
  const polizaObj = construirPolizaRecibo(p.gaman, cfg);
  const cuota = mapCuota(
    { ...c.pago_gaman, num_cuota: c.num_cuota },
    (c.num_cuota ?? 1) - 1,
  );
  return calcularImportesRecibo(polizaObj, cuota);
}

// vendedor_id = 1 es "COFISEM" (venta de oficina, sin vendedor específico).
const VENDEDOR_COFISEM = 1;

const comisionesDe = (p) =>
  Array.isArray(p.comisiones_cofisem)
    ? p.comisiones_cofisem
    : p.comisiones_cofisem
      ? [p.comisiones_cofisem]
      : [];

function rangoMes(offset = 0) {
  const hoy = new Date();
  const ini = new Date(hoy.getFullYear(), hoy.getMonth() + offset, 1);
  const fin = new Date(hoy.getFullYear(), hoy.getMonth() + offset + 1, 0);
  return { desde: hoyISO(ini), hasta: hoyISO(fin) };
}

function nombreVendedor(p) {
  const v = p.vendedores;
  if (v?.id) {
    if (v.id === VENDEDOR_COFISEM) return "COFISEM (venta de oficina)";
    return [v.nombre, v.apellido].filter(Boolean).join(" ").trim() || `Vendedor ${v.id}`;
  }
  return p.vendedor_nombre
    ? `${p.vendedor_nombre} (sin vínculo al catálogo)`
    : "Sin vendedor";
}

// Fila de la tabla → valores planos para Excel/PDF (mismas columnas y
// mismo contenido que la pantalla; ver COLUMNAS_EXPORT).
function filaExport(f) {
  const p = f.p;
  return {
    id: f.id,
    aseguradora: p.aseguradora,
    poliza: p.numero_poliza,
    vigInicio: p.vigencia_inicio,
    asegurado: p.asegurado_nombre,
    rfc: p.gaman?.clientes?.rfc || null,
    cobertura: p.cobertura,
    tipo: p.tipo,
    serie: p.num_serie,
    formaPago: p.forma_pago,
    cuota: f.numCuota,
    fechaPago: f.fechaPago,
    primaPoliza: n(p.prima_anual),
    primaTotal: f.primaTotal,
    primaNeta: f.primaNeta,
    comision: f.comisionMonto,
    comisionPct: f.comisionPct,
    gastosAdmin: null,
    iva: f.iva,
    fechaComision: f.comisionFecha,
  };
}

// PostgREST corta en 1000 filas por petición — se pide por páginas.
async function traerTodo(construir) {
  const PAG = 1000;
  const todo = [];
  for (let desde = 0; ; desde += PAG) {
    const { data, error } = await construir().range(desde, desde + PAG - 1);
    if (error) throw error;
    todo.push(...(data ?? []));
    if (!data || data.length < PAG) break;
  }
  return todo;
}

const PERIODOS = [
  { k: "MES", label: "Este mes" },
  { k: "ANTERIOR", label: "Mes anterior" },
  { k: "RANGO", label: "Rango personalizado" },
];

const COLUMNAS = [
  { label: "Aseguradora" },
  { label: "Póliza" },
  { label: "Inicio vigencia" },
  { label: "Asegurado" },
  { label: "RFC" },
  { label: "Cobertura" },
  { label: "Tipo" },
  { label: "Serie" },
  { label: "Forma de pago" },
  { label: "Cuota", align: "center" },
  { label: "Fecha pago cuota" },
  { label: "Prima total póliza", align: "right" },
  { label: "Prima total cuota", align: "right" },
  { label: "Prima neta cuota", align: "right" },
  { label: "Comisión $", align: "right" },
  { label: "Comisión %", align: "right" },
  { label: "Gastos admin.", align: "right" },
  { label: "Impuestos (IVA)", align: "right" },
  { label: "Fecha pago comisión" },
];

export default function ReporteComisiones() {
  // Periodo: o un mes predefinido o un rango libre — nunca las dos cosas
  // a la vez, para que no haya duda de qué fechas se están usando.
  const [periodo, setPeriodo] = useState("MES");
  const [rangoLibre, setRangoLibre] = useState(() => rangoMes(0));
  const { desde, hasta } =
    periodo === "MES"
      ? rangoMes(0)
      : periodo === "ANTERIOR"
        ? rangoMes(-1)
        : rangoLibre;
  const rangoInvalido = !!desde && !!hasta && desde > hasta;
  const [vendedorId, setVendedorId] = useState("");
  const [oficinaId, setOficinaId] = useState("");
  const [excluirCofisem, setExcluirCofisem] = useState(false);
  const [vendedores, setVendedores] = useState([]);
  const [oficinas, setOficinas] = useState([]);
  const [polizas, setPolizas] = useState([]);
  const [filasConfig, setFilasConfig] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    Promise.all([
      supabase.from("vendedores").select("id, nombre, apellido").order("nombre"),
      supabase.from("oficinas").select("id, nombre").order("nombre"),
      supabase
        .from("configuracion_costos")
        .select("clave, valor, vigente_desde")
        .order("vigente_desde", { ascending: false }),
    ]).then(([v, o, cfg]) => {
      const error = v.error || o.error || cfg.error;
      if (error) {
        setErrorMsg(error.message);
        return;
      }
      setVendedores(v.data ?? []);
      setOficinas(o.data ?? []);
      setFilasConfig(cfg.data ?? []);
    });
  }, []);

  useEffect(() => {
    let cancelado = false;
    async function cargar() {
      setLoading(true);
      try {
        const data = await traerTodo(() => {
          let q = supabase
            .from("polizas_cofisem")
            .select(
              `
              id, poliza_id, oficina_id, aseguradora, numero_poliza, vigencia_inicio,
              fecha_emision, fecha_corte, asegurado_nombre, cobertura, tipo, num_serie,
              forma_pago, prima_anual, prima_primer_pago, prima_primer_pago_neta,
              efectivo, cheque, tdc, pol_pend_pago, registro_parcial, num_cuota_pago,
              comprobante_cheque_url, comprobante_tdc_url,
              vendedor_id, vendedor_nombre,
              vendedores(id, nombre, apellido),
              gaman:polizas!polizas_cofisem_poliza_id_fkey(
                id, forma_pago, fecha_inicio,
                coberturas(nombre, prima_neta, prima_total, regla_pago, prima_base),
                clientes(rfc)
              ),
              comisiones_cofisem(num_cuota, monto, fecha_pago),
              pagos_cofisem(*, pago_gaman:pagos(monto, estatus, fecha_pago, fecha_vencimiento))
            `,
            )
            .order("id");
          if (oficinaId) q = q.eq("oficina_id", oficinaId);
          if (vendedorId) q = q.eq("vendedor_id", vendedorId);
          return q;
        });
        if (cancelado) return;
        setPolizas(data);
        setErrorMsg(null);
      } catch (e) {
        if (!cancelado) setErrorMsg(e.message);
      } finally {
        if (!cancelado) setLoading(false);
      }
    }
    cargar();
    return () => {
      cancelado = true;
    };
  }, [oficinaId, vendedorId]);

  // Filas = cuotas cobradas (RECIBIDO/APLICADO, o PAGADO/ADEUDO en GAMAN)
  // cuya fecha de pago cae en el rango; agrupadas por vendedor.
  const todosGrupos = useMemo(() => {
    const porVendedor = new Map();
    for (const p of polizas) {
      const cuotas = cuotasDePoliza(p);
      const comisiones = comisionesDe(p);
      for (const c of cuotas) {
        const info = c._info;
        const cobrada = info.bucket === "RECIBIDO" || info.bucket === "APLICADO";
        if (!cobrada || !info.fecha) continue;
        if (desde && info.fecha < desde) continue;
        if (hasta && info.fecha > hasta) continue;

        const gaman = importesCuotaGaman(p, c, filasConfig);
        const primaTotal = gaman ? gaman.total : n(info.primaTotal);
        const primaNeta = gaman
          ? gaman.primaNeta
          : info.primaNeta != null && n(info.primaNeta) > 0
            ? n(info.primaNeta)
            : n(c.prima_neta) > 0
              ? n(c.prima_neta)
              : null;
        // Vale de ESTA cuota (la comisión se paga por cuota).
        const comision = comisiones.find((x) => x.num_cuota === c.num_cuota);
        const llevaComision = n(comision?.monto) > 0;
        const comisionMonto = llevaComision ? n(comision.monto) : null;

        const key = p.vendedor_id ?? `txt:${p.vendedor_nombre ?? ""}`;
        if (!porVendedor.has(key)) {
          porVendedor.set(key, {
            key,
            nombre: nombreVendedor(p),
            esCofisem: p.vendedor_id === VENDEDOR_COFISEM,
            filas: [],
          });
        }
        porVendedor.get(key).filas.push({
          id: `${p.id}-${c.id}`,
          p,
          numCuota: c.num_cuota,
          fechaPago: info.fecha,
          primaTotal,
          primaNeta,
          comisionMonto,
          comisionPct:
            comisionMonto != null && primaNeta ? (comisionMonto / primaNeta) * 100 : null,
          comisionFecha: llevaComision ? comision.fecha_pago : null,
          iva: gaman ? gaman.iva : ivaIncluido(primaTotal),
        });
      }
    }
    const arr = [...porVendedor.values()].map((g) => {
      g.filas.sort(
        (a, b) =>
          a.fechaPago.localeCompare(b.fechaPago) ||
          (a.p.numero_poliza ?? "").localeCompare(b.p.numero_poliza ?? ""),
      );
      g.totales = g.filas.reduce(
        (t, f) => ({
          primaTotal: t.primaTotal + f.primaTotal,
          primaNeta: t.primaNeta + n(f.primaNeta),
          comision: t.comision + n(f.comisionMonto),
          iva: t.iva + f.iva,
        }),
        { primaTotal: 0, primaNeta: 0, comision: 0, iva: 0 },
      );
      g.polizas = new Set(g.filas.map((f) => f.p.id)).size;
      return g;
    });
    // Vendedores reales por nombre; COFISEM y los sin vínculo al final.
    arr.sort((a, b) => {
      const ra = a.esCofisem ? 2 : typeof a.key === "string" ? 1 : 0;
      const rb = b.esCofisem ? 2 : typeof b.key === "string" ? 1 : 0;
      return ra - rb || a.nombre.localeCompare(b.nombre);
    });
    return arr;
  }, [polizas, filasConfig, desde, hasta]);

  // "Excluir COFISEM" oculta las ventas de oficina (vendedor_id = 1) en
  // pantalla, totales y exportaciones.
  const grupos = excluirCofisem
    ? todosGrupos.filter((g) => !g.esCofisem)
    : todosGrupos;

  const totalGeneral = grupos.reduce(
    (t, g) => ({
      cuotas: t.cuotas + g.filas.length,
      primaTotal: t.primaTotal + g.totales.primaTotal,
      primaNeta: t.primaNeta + g.totales.primaNeta,
      comision: t.comision + g.totales.comision,
      iva: t.iva + g.totales.iva,
    }),
    { cuotas: 0, primaTotal: 0, primaNeta: 0, comision: 0, iva: 0 },
  );

  // Lo mismo que se ve en pantalla, aplanado para el Excel y el PDF.
  function datosExport() {
    const vendedor = vendedores.find((v) => String(v.id) === String(vendedorId));
    const oficina = oficinas.find((o) => String(o.id) === String(oficinaId));
    const filtrosLabel = [
      `Vendedor: ${
        vendedor
          ? vendedor.id === VENDEDOR_COFISEM
            ? "COFISEM (venta de oficina)"
            : [vendedor.nombre, vendedor.apellido].filter(Boolean).join(" ")
          : "Todos"
      }`,
      `Oficina: ${oficina?.nombre ?? "Todas"}`,
      excluirCofisem ? "Sin ventas de oficina (COFISEM)" : "Incluye ventas de oficina (COFISEM)",
    ].join("  ·  ");
    return {
      periodoLabel: `${fmt(desde)} al ${fmt(hasta)}`,
      filtrosLabel,
      generado: new Date().toLocaleString("es-MX"),
      totalGeneral,
      grupos: grupos.map((g) => ({
        key: String(g.key),
        nombre: g.nombre,
        polizas: g.polizas,
        totales: g.totales,
        filas: g.filas.map(filaExport),
      })),
    };
  }

  function exportarExcel() {
    try {
      const d = datosExport();
      exportarComisionesExcel({
        ...d,
        nombreArchivo: `Comisiones_${desde}_a_${hasta}.xlsx`,
      });
    } catch (e) {
      setErrorMsg("No se pudo generar el Excel: " + e.message);
    }
  }

  function exportarPDF() {
    try {
      localStorage.setItem("comisiones_pdf_data", JSON.stringify(datosExport()));
      window.open("/gaman/comisiones-preview", "_blank");
    } catch (e) {
      setErrorMsg("No se pudo generar el PDF: " + e.message);
    }
  }

  // Al pasar a "Rango personalizado" se arranca con las fechas que ya se
  // estaban viendo, para ajustar a partir de ahí.
  function elegirPeriodo(k) {
    if (k === "RANGO" && periodo !== "RANGO") setRangoLibre({ desde, hasta });
    setPeriodo(k);
  }

  const inputCls =
    "px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1447e6]/15 focus:border-[#1447e6] bg-white";

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#1447e6] flex items-center gap-2">
            <HandCoins className="w-6 h-6" />
            Reporte de comisiones
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Producción y comisiones de cada vendedor según las cuotas cobradas
            en el periodo.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={exportarExcel}
            disabled={loading || rangoInvalido || grupos.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
          <button
            type="button"
            onClick={exportarPDF}
            disabled={loading || rangoInvalido || grupos.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          {errorMsg}
          <button
            onClick={() => setErrorMsg(null)}
            className="text-red-400 hover:text-red-600 ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Filtros + resumen en una sola tarjeta. La fila de filtros es
          SIEMPRE una sola línea: el periodo vive en un panel flotante para
          que las fechas no empujen nada. ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-4 py-3 flex items-center gap-3 flex-nowrap">
          <SelectorPeriodo
            periodo={periodo}
            desde={desde}
            hasta={hasta}
            rangoLibre={rangoLibre}
            rangoInvalido={rangoInvalido}
            onPeriodo={elegirPeriodo}
            onRango={setRangoLibre}
          />
          <div className="w-px h-7 bg-gray-100 shrink-0" />
          <select
            value={vendedorId}
            onChange={(e) => setVendedorId(e.target.value)}
            aria-label="Vendedor"
            className={`${inputCls} flex-1 min-w-[7rem] max-w-[13rem] truncate`}
          >
            <option value="">Todos los vendedores</option>
            {vendedores.map((v) => (
              <option key={v.id} value={v.id}>
                {v.id === VENDEDOR_COFISEM
                  ? "COFISEM (venta de oficina)"
                  : [v.nombre, v.apellido].filter(Boolean).join(" ")}
              </option>
            ))}
          </select>
          <select
            value={oficinaId}
            onChange={(e) => setOficinaId(e.target.value)}
            aria-label="Oficina"
            className={`${inputCls} flex-1 min-w-[7rem] max-w-[12rem] truncate`}
          >
            <option value="">Todas las oficinas</option>
            {oficinas.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre}
              </option>
            ))}
          </select>
          <label
            className="ml-auto flex items-center gap-2 cursor-pointer select-none shrink-0"
            title="Oculta las ventas de oficina (sin vendedor) del reporte y de las descargas"
          >
            <span className="text-sm text-gray-600 whitespace-nowrap">Excluir COFISEM</span>
            <button
              type="button"
              role="switch"
              aria-checked={excluirCofisem}
              onClick={() => setExcluirCofisem((v) => !v)}
              className={`relative w-9 h-5 rounded-full transition-colors ${
                excluirCofisem ? "bg-[#1447e6]" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  excluirCofisem ? "translate-x-4" : ""
                }`}
              />
            </button>
          </label>
        </div>

        {/* ── Resumen: misma tarjeta, repartido a todo el ancho ── */}
        <div className="grid grid-cols-4 divide-x divide-gray-100 border-t border-gray-100 bg-gray-50/40 rounded-b-2xl">
          {[
            { label: "Vendedores", valor: grupos.length },
            { label: "Cuotas cobradas", valor: totalGeneral.cuotas },
            { label: "Cobrado", valor: $(totalGeneral.primaTotal) },
            { label: "Comisiones", valor: $(totalGeneral.comision), destacado: true },
          ].map((k) => (
            <div
              key={k.label}
              className="px-5 py-2.5 flex items-center justify-between gap-2 min-w-0"
            >
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide truncate">
                {k.label}
              </span>
              <span
                className={`text-base font-bold whitespace-nowrap ${
                  k.destacado ? "text-[#1447e6]" : "text-gray-800"
                }`}
              >
                {loading ? "—" : k.valor}
              </span>
            </div>
          ))}
        </div>
      </div>

      {rangoInvalido ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          La fecha "Desde" es posterior a "Hasta" — corrige el rango.
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-gray-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando…
        </div>
      ) : grupos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-2 py-16 text-gray-400">
          <Users className="w-8 h-8" />
          <span className="text-sm font-semibold">
            No hay cuotas cobradas con estos filtros.
          </span>
        </div>
      ) : (
        grupos.map((g) => <TablaVendedor key={g.key} grupo={g} />)
      )}
    </div>
  );
}

// Botón compacto con el periodo activo; al abrirlo muestra las opciones y,
// solo en "Rango personalizado", las fechas. Cambia en vivo (sin "Aplicar").
function SelectorPeriodo({
  periodo,
  desde,
  hasta,
  rangoLibre,
  rangoInvalido,
  onPeriodo,
  onRango,
}) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    };
    const esc = (e) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", cerrar);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", cerrar);
      document.removeEventListener("keydown", esc);
    };
  }, [abierto]);

  const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const corto = (iso) => {
    if (!iso) return "…";
    const [y, m, d] = iso.split("-").map(Number);
    const anio = y !== new Date().getFullYear() ? ` ${y}` : "";
    return `${d} ${MESES[m - 1]}${anio}`;
  };
  const etiqueta = PERIODOS.find((p) => p.k === periodo)?.label;
  const inputFecha = `w-full px-3 py-2 rounded-xl border text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1447e6]/15 focus:border-[#1447e6] ${
    rangoInvalido ? "border-red-300" : "border-gray-200"
  }`;

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors w-72 ${
          rangoInvalido
            ? "border-red-300 bg-red-50"
            : abierto
              ? "border-[#1447e6] ring-2 ring-[#1447e6]/15 bg-white"
              : "border-gray-200 bg-white hover:bg-gray-50"
        }`}
      >
        <CalendarDays className="w-4 h-4 text-[#1447e6] shrink-0" />
        <span className="font-semibold text-gray-800 whitespace-nowrap">
          {periodo === "RANGO" ? "Rango" : etiqueta}
        </span>
        <span className="text-gray-400 whitespace-nowrap truncate">
          {corto(desde)} – {corto(hasta)}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 ml-auto shrink-0 transition-transform ${
            abierto ? "rotate-180" : ""
          }`}
        />
      </button>

      {abierto && (
        <div className="absolute left-0 top-full mt-2 z-30 w-80 bg-white rounded-2xl border border-gray-100 shadow-xl p-2">
          {PERIODOS.map((p) => (
            <button
              key={p.k}
              type="button"
              onClick={() => {
                onPeriodo(p.k);
                if (p.k !== "RANGO") setAbierto(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                periodo === p.k
                  ? "bg-[#1447e6]/5 text-[#1447e6] font-semibold"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {p.label}
              {periodo === p.k && <Check className="w-4 h-4" />}
            </button>
          ))}
          {periodo === "RANGO" && (
            <div className="mt-2 pt-3 px-1 pb-1 border-t border-gray-100 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    Desde
                  </span>
                  <input
                    type="date"
                    value={rangoLibre.desde}
                    onChange={(e) => onRango((r) => ({ ...r, desde: e.target.value }))}
                    className={inputFecha}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    Hasta
                  </span>
                  <input
                    type="date"
                    value={rangoLibre.hasta}
                    onChange={(e) => onRango((r) => ({ ...r, hasta: e.target.value }))}
                    className={inputFecha}
                  />
                </label>
              </div>
              {rangoInvalido && (
                <p className="text-xs text-red-600">
                  "Desde" no puede ser posterior a "Hasta".
                </p>
              )}
              <button
                type="button"
                onClick={() => setAbierto(false)}
                disabled={rangoInvalido}
                className="w-full py-2 rounded-xl bg-[#1447e6] hover:bg-[#1239c4] text-white text-sm font-semibold disabled:opacity-40"
              >
                Listo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TablaVendedor({ grupo }) {
  const { nombre, filas, totales, polizas, esCofisem } = grupo;
  const td = "px-3 py-2 whitespace-nowrap";
  const vacio = <span className="text-gray-300">—</span>;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-gray-100 flex-wrap">
        <h2
          className={`text-sm font-bold ${esCofisem ? "text-gray-500" : "text-[#13193a]"}`}
        >
          {nombre}
        </h2>
        <p className="text-xs text-gray-400">
          {polizas} póliza{polizas === 1 ? "" : "s"} · {filas.length} cuota
          {filas.length === 1 ? "" : "s"} · Comisión:{" "}
          <strong className="text-[#1447e6]">{$(totales.comision)}</strong>
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {COLUMNAS.map((c) => (
                <th
                  key={c.label}
                  className={`text-[10px] font-bold text-gray-400 uppercase tracking-wide px-3 py-2 whitespace-nowrap ${
                    c.align === "right"
                      ? "text-right"
                      : c.align === "center"
                        ? "text-center"
                        : "text-left"
                  }`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filas.map((f) => {
              const p = f.p;
              // Solo las pólizas de GAMAN traen RFC (del cliente).
              const rfc = p.gaman?.clientes?.rfc;
              return (
                <tr key={f.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className={`${td} font-semibold text-gray-700`}>
                    {p.aseguradora || "—"}
                  </td>
                  <td className={`${td} font-mono font-bold text-[#1447e6]`}>
                    {p.numero_poliza || "—"}
                  </td>
                  <td className={`${td} text-gray-500`}>{fmt(p.vigencia_inicio)}</td>
                  <td className={`${td} text-gray-700 max-w-[180px] truncate`}>
                    {p.asegurado_nombre || "—"}
                  </td>
                  <td className={`${td} font-mono text-gray-500`}>{rfc || vacio}</td>
                  <td className={`${td} text-gray-600`}>{p.cobertura || "—"}</td>
                  <td className={`${td} text-gray-600`}>{p.tipo || "—"}</td>
                  <td className={`${td} font-mono text-gray-500`}>{p.num_serie || vacio}</td>
                  <td className={`${td} text-gray-600`}>{p.forma_pago || "—"}</td>
                  <td className={`${td} text-center text-gray-600`}>
                    {f.numCuota}
                  </td>
                  <td className={`${td} text-gray-500`}>{fmt(f.fechaPago)}</td>
                  <td className={`${td} text-right text-gray-600`}>{$(p.prima_anual)}</td>
                  <td className={`${td} text-right font-semibold text-gray-700`}>
                    {$(f.primaTotal)}
                  </td>
                  <td className={`${td} text-right text-gray-600`}>
                    {f.primaNeta != null ? $(f.primaNeta) : vacio}
                  </td>
                  <td className={`${td} text-right font-bold text-emerald-700`}>
                    {f.comisionMonto != null ? $(f.comisionMonto) : vacio}
                  </td>
                  <td className={`${td} text-right text-gray-600`}>
                    {f.comisionPct != null ? `${f.comisionPct.toFixed(2)}%` : vacio}
                  </td>
                  <td className={`${td} text-right`}>{vacio}</td>
                  <td className={`${td} text-right text-gray-600`}>{$(f.iva)}</td>
                  <td className={`${td} text-gray-500`}>
                    {f.comisionFecha ? fmt(f.comisionFecha) : vacio}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t border-gray-200 font-bold text-gray-700">
              <td className={td} colSpan={12}>
                Total {nombre}
              </td>
              <td className={`${td} text-right`}>{$(totales.primaTotal)}</td>
              <td className={`${td} text-right`}>{$(totales.primaNeta)}</td>
              <td className={`${td} text-right text-emerald-700`}>
                {$(totales.comision)}
              </td>
              <td className={td} />
              <td className={td} />
              <td className={`${td} text-right`}>{$(totales.iva)}</td>
              <td className={td} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
