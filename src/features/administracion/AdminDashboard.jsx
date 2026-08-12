// ============================================================
// src/features/administracion/AdminDashboard.jsx
// ============================================================
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { supabase } from "../../supabaseClient";
import ProduccionPorOficina from "../dashboard/ProduccionPorOficina";
import Meter from "../dashboard/Meter";
import { FileText, Clock, CreditCard, UserPlus, Loader2, AlertTriangle, CheckCircle2, KeyRound } from "lucide-react";

const HOY = new Date().toLocaleDateString("es-MX", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const ESTATUS_FINALES = ["VIGENTE", "POR VENCER", "VENCIDA", "CANCELADA", "ANULADA"];

// México Central no usa horario de verano desde 2022 → offset fijo.
const TZ_OFFSET = "-06:00";

// Fecha local en YYYY-MM-DD sin pasar por toISOString() (que convierte a UTC y
// puede regresar el día siguiente/anterior según la hora del día — ej. a las 8pm
// en México ya es después de medianoche en UTC).
function fechaLocalISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const ESTADO_COLOR = {
  VIGENTE: "#059669",
  "POR VENCER": "#f59e0b",
  VENCIDA: "#dc2626",
  CANCELADA: "#9ca3af",
};

function fmt$(n) {
  return "$" + new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 }).format(n ?? 0);
}

function joinSpanish(items) {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} y ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

function fmtHora(str) {
  return str
    ? new Date(str).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
    : "—";
}

// Donut multi-segmento — desglose de pólizas del mes por estado.
function Donut({ segmentos, size = 108, stroke = 20 }) {
  const total = segmentos.reduce((s, x) => s + x.value, 0);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let acumulado = 0;
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      {total === 0 ? (
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
      ) : (
        segmentos.map((s) => {
          if (s.value === 0) return null;
          const largo = (s.value / total) * c;
          const gap = 2;
          const dasharray = `${Math.max(largo - gap, 0)} ${c - Math.max(largo - gap, 0)}`;
          const dashoffset = -acumulado;
          acumulado += largo;
          return (
            <circle
              key={s.label} cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={s.color} strokeWidth={stroke} strokeDasharray={dasharray}
              strokeDashoffset={dashoffset} strokeLinecap="butt"
            />
          );
        })
      )}
    </svg>
  );
}

export default function AdminDashboard({ usuario }) {
  const navigate = useNavigate();
  const h = new Date().getHours();
  const saludo = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";

  const [cargando, setCargando] = useState(true);
  const [kpiHoy, setKpiHoy] = useState(0);
  const [kpiVencer, setKpiVencer] = useState(0);
  const [kpiPorCobrar, setKpiPorCobrar] = useState(0);
  const [kpiClientes, setKpiClientes] = useState(0);
  const [ultimas, setUltimas] = useState([]);
  const [cobranza, setCobranza] = useState({ pagado: 0, total: 0 });
  const [resumenMes, setResumenMes] = useState({ vigente: 0, porVencer: 0, vencida: 0, cancelada: 0, total: 0 });
  const [atencion, setAtencion] = useState({ oficinasSinVentas: [], sinPago: 0, oficinasTopAdeudo: [] });
  const [liberaciones, setLiberaciones] = useState([]);
  const [liberandoId, setLiberandoId] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const hoy = new Date();
    const hoyISO = fechaLocalISO(hoy);
    const en7 = fechaLocalISO(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 7));
    const inicioMes = fechaLocalISO(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    const finMes = fechaLocalISO(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0));
    const en30 = fechaLocalISO(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 30));

    try {
      const [
        { count: cHoy },
        { count: cVencer },
        { count: cPorCobrar },
        { count: cClientes },
        { data: dPolizasMes },
        { data: dCuotas },
        { data: dOficinas },
        { data: dLiberaciones },
        { count: cVencidaExplicita },
        { count: cVencidaDinamica },
        { count: cPorVencerCartera },
        { count: cVigenteCartera },
        { count: cCanceladaCartera },
      ] = await Promise.all([
        supabase.from("polizas").select("id", { count: "exact", head: true })
          .in("estatus", ESTATUS_FINALES)
          .gte("created_at", `${hoyISO}T00:00:00${TZ_OFFSET}`).lte("created_at", `${hoyISO}T23:59:59${TZ_OFFSET}`),

        supabase.from("polizas").select("id", { count: "exact", head: true })
          .in("estatus", ["VIGENTE", "POR VENCER"])
          .gte("fecha_fin", hoyISO).lte("fecha_fin", en7),

        supabase.from("pagos").select("id", { count: "exact", head: true })
          .in("estatus", ["PENDIENTE", "ADEUDO"]),

        supabase.from("clientes").select("id", { count: "exact", head: true })
          .gte("created_at", `${inicioMes}T00:00:00${TZ_OFFSET}`),

        supabase.from("polizas")
          .select(`
            id, constancia, numero_poliza, created_at, estatus, fecha_fin, oficina_id,
            clientes(nombre, apellido), oficinas(nombre), coberturas(prima_total),
            pagos(estatus)
          `)
          .in("estatus", ESTATUS_FINALES)
          .gte("created_at", `${inicioMes}T00:00:00${TZ_OFFSET}`).lte("created_at", `${finMes}T23:59:59${TZ_OFFSET}`)
          .order("created_at", { ascending: false }),

        supabase.from("pagos")
          .select("monto, estatus, polizas(oficina_id, oficinas(nombre))")
          .gte("fecha_vencimiento", inicioMes).lte("fecha_vencimiento", finMes),

        supabase.from("oficinas").select("id, nombre").order("nombre"),

        // Solicitudes de liberación de No. Serie — pendientes de autorizar por admin
        supabase.from("polizas")
          .select("id, constancia, numero_poliza, num_serie, clientes(nombre, apellido), oficinas(nombre)")
          .eq("estado_serie", "SOLICITADA")
          .order("id", { ascending: false }),

        // Resumen de cartera completa (no solo lo emitido este mes) — mismo criterio
        // dinámico que calcularEstatus(), replicado en la consulta para no traer filas.
        supabase.from("polizas").select("id", { count: "exact", head: true })
          .eq("estatus", "VENCIDA"),
        supabase.from("polizas").select("id", { count: "exact", head: true })
          .in("estatus", ["VIGENTE", "POR VENCER"]).lt("fecha_fin", hoyISO),
        supabase.from("polizas").select("id", { count: "exact", head: true })
          .in("estatus", ["VIGENTE", "POR VENCER"]).gte("fecha_fin", hoyISO).lte("fecha_fin", en30),
        supabase.from("polizas").select("id", { count: "exact", head: true })
          .in("estatus", ["VIGENTE", "POR VENCER"]).gt("fecha_fin", en30),
        supabase.from("polizas").select("id", { count: "exact", head: true })
          .in("estatus", ["CANCELADA", "ANULADA"]),
      ]);

      setKpiHoy(cHoy ?? 0);
      setKpiVencer(cVencer ?? 0);
      setKpiPorCobrar(cPorCobrar ?? 0);
      setKpiClientes(cClientes ?? 0);
      setLiberaciones(dLiberaciones ?? []);

      const polizasMes = dPolizasMes ?? [];
      setUltimas(polizasMes.slice(0, 6));

      const oficinasConVentas = new Set();
      for (const p of polizasMes) {
        if (p.oficina_id) oficinasConVentas.add(p.oficina_id);
      }

      // Resumen de la cartera completa por estado (no solo lo emitido este mes:
      // una póliza recién emitida casi nunca está "por vencer/vencida" — su fecha_fin
      // es ~1 año a futuro — así que ese corte siempre daba 0 ahí).
      setResumenMes({
        vigente: cVigenteCartera ?? 0,
        porVencer: cPorVencerCartera ?? 0,
        vencida: (cVencidaExplicita ?? 0) + (cVencidaDinamica ?? 0),
        cancelada: cCanceladaCartera ?? 0,
        total:
          (cVigenteCartera ?? 0) + (cPorVencerCartera ?? 0) +
          (cVencidaExplicita ?? 0) + (cVencidaDinamica ?? 0) + (cCanceladaCartera ?? 0),
      });

      // Pólizas del mes sin ningún pago aplicado
      const sinPago = polizasMes.filter(
        (p) => (p.pagos?.length ?? 0) > 0 && !p.pagos.some((c) => c.estatus === "PAGADO"),
      ).length;

      // Oficinas sin ninguna venta este mes
      const oficinasSinVentas = (dOficinas ?? [])
        .filter((o) => !oficinasConVentas.has(o.id))
        .map((o) => o.nombre);

      // Cobranza del mes + oficina con más pendiente de cobro
      const cuotas = dCuotas ?? [];
      const total = cuotas.reduce((s, c) => s + Number(c.monto ?? 0), 0);
      const pagado = cuotas
        .filter((c) => c.estatus === "PAGADO")
        .reduce((s, c) => s + Number(c.monto ?? 0), 0);
      setCobranza({ pagado, total });

      const pendientePorOficina = new Map();
      for (const c of cuotas) {
        if (c.estatus === "PAGADO") continue;
        const nombreOf = c.polizas?.oficinas?.nombre ?? "Sin oficina";
        pendientePorOficina.set(nombreOf, (pendientePorOficina.get(nombreOf) ?? 0) + Number(c.monto ?? 0));
      }
      const oficinasTopAdeudo = [...pendientePorOficina.entries()]
        .filter(([, monto]) => monto > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([nombre, monto]) => ({ nombre, monto }));

      setAtencion({
        oficinasSinVentas,
        sinPago,
        oficinasTopAdeudo,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Mismo flujo que AdminPolizas.jsx: estado_serie "SOLICITADA" → "LIBERADA" + bitácora.
  const liberarSerie = async (p) => {
    const { isConfirmed } = await Swal.fire({
      icon: "question",
      title: "Liberar No. Serie",
      text: `¿Autorizas liberar el No. Serie de la póliza ${p.constancia || p.numero_poliza} para permitir una nueva póliza con el mismo número?`,
      showCancelButton: true,
      confirmButtonColor: "#13193a",
      confirmButtonText: "Sí, liberar",
      cancelButtonText: "Cancelar",
    });
    if (!isConfirmed) return;
    setLiberandoId(p.id);
    try {
      await supabase.from("polizas").update({ estado_serie: "LIBERADA" }).eq("id", p.id);
      await supabase.from("polizas_historial").insert({
        poliza_id: p.id,
        estatus_nuevo: "SERIE_LIBERADA",
        notas: `Se autorizó la liberación del No. Serie ${p.num_serie || ""} para permitir una nueva póliza.`,
        cambiado_por: usuario?.id ?? null,
      });
      setLiberaciones((prev) => prev.filter((x) => x.id !== p.id));
      Swal.fire({
        icon: "success",
        title: "Serie liberada",
        text: `El No. Serie de la póliza ${p.constancia || p.numero_poliza} ya está disponible.`,
        confirmButtonColor: "#13193a",
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo liberar la serie: " + e.message, confirmButtonColor: "#13193a" });
    } finally {
      setLiberandoId(null);
    }
  };

  const pctCobrado = cobranza.total > 0 ? (cobranza.pagado / cobranza.total) * 100 : 0;
  const mesNombre = MESES[new Date().getMonth()];

  const KPIS = [
    { label: "Pólizas emitidas hoy", value: kpiHoy, Icon: FileText, accent: "#13193a", path: "/gaman/polizas" },
    { label: "Por vencer (7 días)", value: kpiVencer, Icon: Clock, accent: "#d97706", path: "/gaman/vencimientos" },
    { label: "Pagos por cobrar", value: kpiPorCobrar, Icon: CreditCard, accent: "#ef4444", path: "/gaman/pagos" },
    { label: "Clientes nuevos (mes)", value: kpiClientes, Icon: UserPlus, accent: "#059669", path: "/gaman/clientes" },
  ];

  const segmentosResumen = [
    { label: "Vigentes", value: resumenMes.vigente, color: ESTADO_COLOR.VIGENTE },
    { label: "Por vencer", value: resumenMes.porVencer, color: ESTADO_COLOR["POR VENCER"] },
    { label: "Vencidas", value: resumenMes.vencida, color: ESTADO_COLOR.VENCIDA },
    { label: "Canceladas", value: resumenMes.cancelada, color: ESTADO_COLOR.CANCELADA },
  ];

  const itemsAtencion = [
    ...(atencion.oficinasSinVentas.length > 0
      ? [{
          msg: `${joinSpanish(atencion.oficinasSinVentas)} no ${atencion.oficinasSinVentas.length > 1 ? "han" : "ha"} vendido ninguna póliza este mes`,
          path: "/gaman/polizas",
        }]
      : []),
    ...(atencion.sinPago > 0
      ? [{ msg: `${atencion.sinPago} pólizas emitidas este mes sin ningún pago registrado`, path: "/gaman/pagos" }]
      : []),
    ...atencion.oficinasTopAdeudo.map((o) => ({
      msg: `${o.nombre} tiene ${fmt$(o.monto)} pendiente de cobro`,
      path: "/gaman/pagos",
    })),
  ];

  return (
    <div className="h-full flex flex-col p-6 gap-4 bg-[#f7f8fa] overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap shrink-0">
        <div>
          <p className="text-xs text-gray-400 capitalize">{HOY}</p>
          <h1 className="text-2xl font-bold text-[#13193a] mt-0.5">
            {saludo}, <span className="font-light">{usuario?.nombre ?? "Administrador"}</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Control general · Todas las oficinas</p>
        </div>
      </div>

      {/* KPIs reales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        {KPIS.map((k) => (
          <button
            key={k.label}
            onClick={() => navigate(k.path)}
            className="bg-white rounded-2xl border border-gray-100 p-3.5 text-left hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-6 h-0.5 rounded-full" style={{ background: k.accent }} />
              <k.Icon className="w-3.5 h-3.5 text-gray-300" />
            </div>
            <p className="text-xl font-black text-[#13193a] tabular-nums">
              {cargando ? "—" : k.value}
            </p>
            <p className="text-[10px] font-semibold text-gray-600 mt-1 leading-tight">
              {k.label}
            </p>
          </button>
        ))}
      </div>

      {/* Fila 1: Producción · Últimas pólizas · Cobranza del mes */}
      <div className="flex-[11] min-h-0 grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-5 min-h-0">
          <ProduccionPorOficina variant="real" fillHeight />
        </div>

        {/* Últimas pólizas emitidas — real, todas las oficinas */}
        <div className="col-span-12 lg:col-span-4 min-h-0 bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 shrink-0">
            <p className="text-sm font-bold text-[#13193a]">Últimas pólizas emitidas</p>
            <button onClick={() => navigate("/gaman/polizas")} className="text-xs text-blue-500 font-semibold hover:underline">
              Ver todas
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-50">
            {cargando ? (
              <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Cargando…</span>
              </div>
            ) : ultimas.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">Sin pólizas emitidas.</p>
            ) : (
              ultimas.map((p) => {
                const asegurado = [p.clientes?.nombre, p.clientes?.apellido].filter(Boolean).join(" ");
                return (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50/60 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#13193a] truncate">{asegurado || "—"}</p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {p.oficinas?.nombre || "—"} · {fmtHora(p.created_at)}
                      </p>
                    </div>
                    <p className="text-xs font-bold text-emerald-700 shrink-0">
                      {fmt$(p.coberturas?.prima_total)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Resumen del mes — donut por estado, compacto */}
        <div className="col-span-12 lg:col-span-3 min-h-0 bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-50 shrink-0">
            <p className="text-sm font-bold text-[#13193a] capitalize">Resumen de {mesNombre} — pólizas</p>
          </div>
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 px-5 py-4">
            {cargando ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
            ) : resumenMes.total === 0 ? (
              <p className="text-center text-sm text-gray-400">Sin pólizas emitidas este mes.</p>
            ) : (
              <>
                <div className="relative shrink-0">
                  <Donut segmentos={segmentosResumen} size={92} stroke={16} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-base font-black text-[#13193a] tabular-nums leading-none">{resumenMes.total}</span>
                    <span className="text-[8px] text-gray-400 mt-0.5">pólizas</span>
                  </div>
                </div>
                <div className="w-full space-y-1">
                  {segmentosResumen.map((s) => (
                    <div key={s.label} className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="text-gray-500 truncate flex-1">{s.label}</span>
                      <span className="font-bold text-[#13193a] tabular-nums">{s.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Fila 2: Cobranza del mes · Liberaciones de serie · Requiere atención */}
      <div className="flex-[8] min-h-0 grid grid-cols-12 gap-4">
        {/* Cobranza del mes — real, compacta */}
        <div className="col-span-12 lg:col-span-2 min-h-0 bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-50 shrink-0">
            <p className="text-sm font-bold text-[#13193a]">Cobranza del mes</p>
          </div>
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-2 px-4 py-3">
            {cargando ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
            ) : cobranza.total === 0 ? (
              <p className="text-center text-xs text-gray-400">Sin cuotas con vencimiento este mes.</p>
            ) : (
              <>
                <div className="relative shrink-0">
                  <Meter pct={pctCobrado} size={92} stroke={10} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-base font-black text-[#13193a] tabular-nums">
                      {pctCobrado.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-emerald-700 tabular-nums">{fmt$(cobranza.pagado)}</p>
                  <p className="text-[10px] text-gray-400">cobrado de {fmt$(cobranza.total)}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Liberaciones de No. Serie pendientes — real, acción rápida */}
        <div className="col-span-12 lg:col-span-4 min-h-0 bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50 shrink-0">
            <KeyRound className="w-4 h-4 text-violet-500" />
            <p className="text-sm font-bold text-[#13193a]">Liberaciones de serie</p>
            {liberaciones.length > 0 && (
              <span className="ml-auto bg-violet-100 text-violet-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {liberaciones.length}
              </span>
            )}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-50">
            {cargando ? (
              <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Cargando…</span>
              </div>
            ) : liberaciones.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-10 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-semibold">Sin solicitudes pendientes.</span>
              </div>
            ) : (
              liberaciones.map((p) => {
                const asegurado = [p.clientes?.nombre, p.clientes?.apellido].filter(Boolean).join(" ");
                return (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#13193a] truncate">{asegurado || "—"}</p>
                      <p className="text-[10px] font-mono text-gray-400 truncate">
                        {p.constancia || p.numero_poliza} · {p.num_serie || "—"}
                      </p>
                    </div>
                    <button
                      onClick={() => liberarSerie(p)}
                      disabled={liberandoId === p.id}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 text-[11px] font-semibold hover:bg-violet-100 disabled:opacity-50 transition-colors"
                    >
                      {liberandoId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Liberar"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Requiere atención — real */}
        <div className="col-span-12 lg:col-span-6 min-h-0 bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50 shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <p className="text-sm font-bold text-[#13193a]">Requiere atención</p>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-50">
            {cargando ? (
              <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Cargando…</span>
              </div>
            ) : itemsAtencion.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-10 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-semibold">Todo en orden este mes.</span>
              </div>
            ) : (
              itemsAtencion.map((it, i) => (
                <button
                  key={i}
                  onClick={() => navigate(it.path)}
                  className="w-full flex items-center gap-3 px-5 py-1.5 text-left hover:bg-gray-50/70 transition-colors group"
                >
                  <span className="w-2 h-2 rounded-full shrink-0 bg-amber-400" />
                  <p className="flex-1 text-xs font-semibold text-gray-800 leading-snug">{it.msg}</p>
                  <svg className="w-3.5 h-3.5 text-gray-300 shrink-0 group-hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
