import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import ProduccionPorOficina from "../dashboard/ProduccionPorOficina";
import Meter from "../dashboard/Meter";
import { AlertTriangle, CheckCircle2, Clock, ClipboardList, FileText, Loader2, Plus, UserPlus } from "lucide-react";

// Oficina E. Zapata: única oficina con dos operadoras; cada una ve solo lo que ella registró.
const OFICINA_EZAPATA_ID = 1;

// México Central no usa horario de verano desde 2022 → offset fijo.
const TZ_OFFSET = "-06:00";

const HOY = new Date().toLocaleDateString("es-MX", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const fmt$ = (n) =>
  "$" + new Intl.NumberFormat("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n ?? 0);

// Fecha local en YYYY-MM-DD sin pasar por toISOString() (que convierte a UTC y
// puede regresar el día siguiente/anterior según la hora del día).
function fechaLocalISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const STATUS_ROW = {
  VIGENTE:      "bg-emerald-50 text-emerald-700",
  "POR VENCER": "bg-amber-50 text-amber-700",
  VENCIDA:      "bg-red-50 text-red-700",
  CANCELADA:    "bg-gray-100 text-gray-500",
};

function diasHasta(fechaStr) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const fin  = new Date(fechaStr + "T12:00:00");
  return Math.round((fin - hoy) / 86400000);
}

export default function OperadorDashboard({ usuario }) {
  const navigate = useNavigate();
  const h = new Date().getHours();
  const saludo = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";

  const [loading,       setLoading]       = useState(true);
  const [kpiHoy,        setKpiHoy]        = useState(0);
  const [kpiVencer,     setKpiVencer]     = useState(0);
  const [kpiClientes,   setKpiClientes]   = useState(0);
  const [ultimas,       setUltimas]       = useState([]);
  const [vencen,        setVencen]        = useState([]);
  const [cobranza,      setCobranza]      = useState({ pagado: 0, total: 0 });
  const [sinPagoCount,  setSinPagoCount]  = useState(0);
  const [cotizaciones,  setCotizaciones]  = useState(() => {
    try { return JSON.parse(localStorage.getItem("cofisem_cotizaciones") || "[]"); }
    catch { return []; }
  });

  useEffect(() => {
    const load = async () => {
      const oid = usuario?.oficinas?.id;
      if (!oid) { setLoading(false); return; }
      const propias = oid === OFICINA_EZAPATA_ID && usuario?.id;

      const hoy = new Date();
      const today    = fechaLocalISO(hoy);
      const en7      = fechaLocalISO(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 7));
      const inicioMes = fechaLocalISO(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
      const finMes    = fechaLocalISO(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0));

      const conAutor = (q) => propias ? q.eq("creado_por", usuario.id) : q;

      let cuotasQ = supabase.from("pagos")
        .select("monto, estatus, polizas!inner(oficina_id, creado_por)")
        .eq("polizas.oficina_id", oid)
        .gte("fecha_vencimiento", inicioMes).lte("fecha_vencimiento", finMes);
      if (propias) cuotasQ = cuotasQ.eq("polizas.creado_por", usuario.id);

      try {
        const [
          { count: cHoy },
          { count: cVencer },
          { data: dUltimas },
          { data: dVencen },
          { count: cClientes },
          { data: dCuotas },
          { data: dSinPago },
        ] = await Promise.all([
          conAutor(supabase.from("polizas").select("id", { count: "exact", head: true })
            .eq("oficina_id", oid).neq("estatus", "COTIZACION")
            .gte("created_at", `${today}T00:00:00${TZ_OFFSET}`).lte("created_at", `${today}T23:59:59${TZ_OFFSET}`)),

          conAutor(supabase.from("polizas").select("id", { count: "exact", head: true })
            .eq("oficina_id", oid).in("estatus", ["VIGENTE", "POR VENCER"])
            .gte("fecha_fin", today).lte("fecha_fin", en7)),

          conAutor(supabase.from("polizas")
            .select("id, constancia, numero_poliza, estatus, tipo_poliza, clientes(nombre, apellido), created_at, coberturas(prima_total)")
            .eq("oficina_id", oid).neq("estatus", "COTIZACION")
            .order("created_at", { ascending: false }).limit(5)),

          conAutor(supabase.from("polizas")
            .select("id, constancia, numero_poliza, fecha_fin, clientes(nombre, apellido)")
            .eq("oficina_id", oid).in("estatus", ["VIGENTE", "POR VENCER"])
            .gte("fecha_fin", today).lte("fecha_fin", en7)
            .order("fecha_fin", { ascending: true }).limit(5)),

          supabase.from("clientes").select("id", { count: "exact", head: true })
            .eq("creado_por", usuario?.id)
            .gte("created_at", `${inicioMes}T00:00:00${TZ_OFFSET}`),

          cuotasQ,

          conAutor(supabase.from("polizas")
            .select("id, pagos(estatus)")
            .eq("oficina_id", oid).neq("estatus", "COTIZACION")
            .gte("created_at", `${inicioMes}T00:00:00${TZ_OFFSET}`).lte("created_at", `${finMes}T23:59:59${TZ_OFFSET}`)),
        ]);

        setKpiHoy(cHoy ?? 0);
        setKpiVencer(cVencer ?? 0);
        setKpiClientes(cClientes ?? 0);
        setUltimas(dUltimas || []);
        setVencen(dVencen || []);

        const cuotas = dCuotas ?? [];
        const total = cuotas.reduce((s, c) => s + Number(c.monto ?? 0), 0);
        const pagado = cuotas.filter((c) => c.estatus === "PAGADO").reduce((s, c) => s + Number(c.monto ?? 0), 0);
        setCobranza({ pagado, total });

        setSinPagoCount(
          (dSinPago ?? []).filter((p) => (p.pagos?.length ?? 0) > 0 && !p.pagos.some((c) => c.estatus === "PAGADO")).length,
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [usuario]);

  return (
    <div className="h-full flex flex-col p-6 bg-[#f7f8fa] overflow-hidden">
      <div className="max-w-7xl mx-auto w-full flex-1 min-h-0 flex flex-col gap-4">

        {/* ── TOP: saludo + acciones ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap shrink-0">
          <div>
            <p className="text-xs text-gray-400 capitalize">{HOY}</p>
            <h1 className="text-2xl font-bold text-[#13193a] mt-0.5">
              {saludo},{" "}
              <span className="font-light">{usuario?.nombre ?? "Operador"}</span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              {usuario?.oficinas?.nombre ?? "—"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/gaman/cotizaciones/nueva")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#13193a] text-white text-sm font-semibold hover:bg-[#1e2a50] transition-all shadow-sm shadow-[#13193a]/20"
            >
              <Plus className="w-4 h-4" />
              Nueva cotización
            </button>
          </div>
        </div>

        {/* ── FILA 1: KPIs — compactas, estilo tarjeta de Pólizas ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          {[
            { label: "Pólizas emitidas hoy", value: loading ? "—" : kpiHoy, Icon: FileText, color: "#13193a", path: "/gaman/polizas" },
            { label: "Cotizaciones guardadas", value: cotizaciones.length, Icon: ClipboardList, color: "#d97706", path: "/gaman/polizas" },
            { label: "Pólizas por vencer", value: loading ? "—" : kpiVencer, Icon: Clock, color: "#ef4444", path: "/gaman/polizas" },
            { label: "Clientes nuevos (mes)", value: loading ? "—" : kpiClientes, Icon: UserPlus, color: "#059669", path: "/gaman/clientes" },
          ].map((k) => (
            <button
              key={k.label}
              onClick={() => navigate(k.path)}
              className="bg-white rounded-2xl border border-gray-100 p-3.5 text-left hover:shadow-md hover:border-gray-200 transition-all"
            >
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] text-gray-400 font-medium leading-snug truncate pr-2">{k.label}</p>
                <k.Icon className="w-3.5 h-3.5 shrink-0" style={{ color: k.color }} />
              </div>
              <p className="text-xl font-bold text-[#13193a] tabular-nums">{k.value}</p>
            </button>
          ))}
        </div>

        {/* ── FILA 2: Producción por oficina · Últimas pólizas · Por vencer ── */}
        <div className="flex-[3] min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5 min-h-0">
            <ProduccionPorOficina variant="porcentaje" fillHeight />
          </div>

          {/* Últimas pólizas — REAL */}
          <div className="lg:col-span-4 min-h-0 bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 shrink-0">
              <p className="text-sm font-bold text-[#13193a]">Pólizas emitidas hoy</p>
              <button onClick={() => navigate("/gaman/polizas")} className="text-xs text-blue-500 font-semibold hover:underline">
                Ver todas
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-50">
              {loading ? (
                <p className="text-center text-sm text-gray-400 py-8">Cargando...</p>
              ) : ultimas.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">Sin pólizas emitidas hoy</p>
              ) : ultimas.map((p) => {
                const asegurado = [p.clientes?.nombre, p.clientes?.apellido].filter(Boolean).join(" ");
                const hora = p.created_at
                  ? new Date(p.created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
                  : "—";
                return (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-[#13193a]/6 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-[#13193a]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#13193a] truncate">{asegurado || "—"}</p>
                      <p className="text-[11px] text-gray-400 truncate">{p.tipo_poliza || "TAXI BÁSICA"} · {hora}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-emerald-700">{fmt$(p.coberturas?.prima_total)}</p>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_ROW[p.estatus] ?? "bg-gray-100 text-gray-500"}`}>
                        {p.estatus}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Próximas a vencer */}
          <div className="lg:col-span-3 min-h-0 bg-white rounded-2xl border border-amber-100 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 px-4 py-4 border-b border-amber-50 bg-amber-50/50 shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-sm font-bold text-amber-800">Por vencer</p>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-amber-50/50">
              {loading ? (
                <p className="text-center text-sm text-gray-400 py-6">Cargando...</p>
              ) : vencen.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-6 px-3">Sin vencimientos próximos</p>
              ) : vencen.map((p) => {
                const asegurado = [p.clientes?.nombre, p.clientes?.apellido].filter(Boolean).join(" ");
                const dias = diasHasta(p.fecha_fin);
                return (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3 gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#13193a] truncate">{asegurado || "—"}</p>
                      <p className="text-[10px] font-mono text-gray-400 truncate">{p.constancia || p.numero_poliza}</p>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${dias <= 3 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                      {dias}d
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── FILA 3: Cotizaciones guardadas · Cobranza del mes · Requiere atención ── */}
        <div className="flex-[2] min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Cotizaciones — normalmente máximo 3, así que ocupa menos ancho */}
          <div className="lg:col-span-3 min-h-0 bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 shrink-0">
              <p className="text-sm font-bold text-[#13193a]">
                Cotizaciones
                {cotizaciones.length > 0 && (
                  <span className="ml-2 bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {cotizaciones.length}
                  </span>
                )}
              </p>
              <button onClick={() => navigate("/gaman/polizas")} className="text-xs text-blue-500 font-semibold hover:underline">
                Ver todas
              </button>
            </div>
            {cotizaciones.length === 0 ? (
              <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-4 text-center">
                <ClipboardList className="w-7 h-7 text-gray-200 mb-2" />
                <p className="text-xs text-gray-400">Sin cotizaciones guardadas</p>
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-50">
                {cotizaciones.slice(0, 3).map((c, i) => (
                  <button
                    key={i}
                    onClick={() => navigate("/gaman/polizas")}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50/60 transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                      <ClipboardList className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#13193a] truncate">{c.cliente || "—"}</p>
                      <p className="text-[11px] text-gray-400 truncate">{c.cobertura || "—"}</p>
                    </div>
                    <p className="text-xs font-bold text-amber-600 shrink-0">{fmt$(c.total)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cobranza del mes — real, de la oficina/registros propios */}
          <div className="lg:col-span-3 min-h-0 bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-50 shrink-0">
              <p className="text-sm font-bold text-[#13193a]">Cobranza del mes</p>
            </div>
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-2 px-4 py-3">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
              ) : cobranza.total === 0 ? (
                <p className="text-center text-xs text-gray-400">Sin cuotas con vencimiento este mes.</p>
              ) : (
                <>
                  <div className="relative shrink-0">
                    <Meter pct={cobranza.total > 0 ? (cobranza.pagado / cobranza.total) * 100 : 0} size={92} stroke={10} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-base font-black text-[#13193a] tabular-nums">
                        {cobranza.total > 0 ? Math.round((cobranza.pagado / cobranza.total) * 100) : 0}%
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

          {/* Requiere atención — real */}
          <div className="lg:col-span-6 min-h-0 bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50 shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <p className="text-sm font-bold text-[#13193a]">Requiere atención</p>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-50">
              {loading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Cargando…</span>
                </div>
              ) : sinPagoCount === 0 ? (
                <div className="flex items-center justify-center gap-2 py-8 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-semibold">Todo en orden este mes.</span>
                </div>
              ) : (
                <button
                  onClick={() => navigate("/gaman/pagos")}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-gray-50/70 transition-colors group"
                >
                  <span className="w-2 h-2 rounded-full shrink-0 bg-amber-400" />
                  <p className="flex-1 text-xs font-semibold text-gray-800 leading-snug">
                    {sinPagoCount} pólizas emitidas este mes sin ningún pago registrado
                  </p>
                  <svg className="w-3.5 h-3.5 text-gray-300 shrink-0 group-hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
