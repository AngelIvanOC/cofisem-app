import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  AlertTriangle, ArrowRight, CheckCircle2, CreditCard,
  FileText, Loader2, Clock,
} from "lucide-react";

function fmt$(n) {
  return `$${Number(n || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })}`;
}
function fmtCorta(str) {
  if (!str) return "—";
  return new Date(str + "T12:00:00").toLocaleDateString("es-MX", {
    day: "2-digit", month: "short",
  });
}
function nombreCorto(pol) {
  const c = pol?.clientes;
  if (!c) return "—";
  return `${c.nombre ?? ""} ${(c.apellido ?? "").split(" ")[0]}`.trim();
}

function RingChart({ pagado, adeudo }) {
  const total = pagado + adeudo || 1;
  const r     = 42;
  const circ  = 2 * Math.PI * r;
  const dash  = (pagado / total) * circ;
  return (
    <div className="relative w-full min-h-0" style={{ height: "65%" }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="#10b981" strokeWidth="8"
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="butt" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-[#13193a] leading-none">
          {Math.round((pagado / total) * 100)}%
        </span>
        <span className="text-xs text-gray-400 font-semibold mt-1">aplicado</span>
      </div>
    </div>
  );
}

function TooltipPagos({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-bold text-[#13193a]">{payload[0]?.payload?.label}</p>
      <p className="text-amber-600 mt-0.5">Por aplicar: <strong>{payload[0]?.value}</strong></p>
      {payload[1] && <p className="text-emerald-600">Aplicados: <strong>{payload[1]?.value}</strong></p>}
    </div>
  );
}

export default function AnalistaDashboard({ usuario }) {
  const navigate = useNavigate();

  const [pagos,   setPagos]   = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);

  const h      = new Date().getHours();
  const saludo = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
  const HOY_LABEL = new Date().toLocaleDateString("es-MX", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const hoy = new Date().toISOString().split("T")[0];
      const [pagosRes, alertasRes] = await Promise.all([
        supabase
          .from("pagos")
          .select(`
            id, monto, num_cuota, estatus, fecha_pago,
            polizas(constancia, numero_poliza, forma_pago, estatus, fecha_fin,
              clientes(nombre, apellido),
              oficinas(nombre))
          `)
          .in("estatus", ["ADEUDO", "PAGADO"])
          .order("created_at", { ascending: false }),
        supabase
          .from("polizas")
          .select("id, constancia, numero_poliza, fecha_fin, clientes(nombre, apellido), oficinas(nombre)")
          .eq("estatus", "VENCIDA")
          .gte("fecha_fin", hoy)
          .order("fecha_fin", { ascending: true })
          .limit(8),
      ]);
      setPagos(pagosRes.data ?? []);
      setAlertas(alertasRes.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const pagosAdeudo = useMemo(() => pagos.filter(p => p.estatus === "ADEUDO"), [pagos]);
  const pagosPagado = useMemo(() => pagos.filter(p => p.estatus === "PAGADO"), [pagos]);

  const nAdeudo    = pagosAdeudo.length;
  const nPagado    = pagosPagado.length;
  const montoPend  = pagosAdeudo.reduce((s, p) => s + (p.monto || 0), 0);
  const montoAplic = pagosPagado.reduce((s, p) => s + (p.monto || 0), 0);

  const topPendientes = pagosAdeudo;

  const porOficina = useMemo(() => {
    const map = {}, mapAplic = {};
    pagosAdeudo.forEach(p => {
      const of = p.polizas?.oficinas?.nombre ?? "Sin oficina";
      map[of] = (map[of] || 0) + 1;
    });
    pagosPagado.forEach(p => {
      const of = p.polizas?.oficinas?.nombre ?? "Sin oficina";
      mapAplic[of] = (mapAplic[of] || 0) + 1;
      if (!map[of]) map[of] = 0;
    });
    return Object.keys(map)
      .map(nombre => ({
        label: nombre.replace(/^COFISEM\s*/i, "").replace(/^OFICINA\s*/i, ""),
        adeudo: map[nombre] || 0,
        pagado: mapAplic[nombre] || 0,
      }))
      .sort((a, b) => b.adeudo - a.adeudo)
      .slice(0, 6);
  }, [pagosAdeudo, pagosPagado]);

  const recientes = pagosPagado.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-full bg-[#f7f8fa]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden bg-[#f7f8fa]">
    <div
      className="max-w-7xl mx-auto h-full p-6"
      style={{ display: "grid", gridTemplateRows: "2fr 3fr 8fr 7fr", gap: "10px" }}
    >

      {/* ── Fila 1: Header (10%) ───────────────────────────── */}
      <div className="flex items-center justify-between gap-4 overflow-hidden mb-[10px]">
        <div>
          <p className="text-xs text-gray-400 capitalize">{HOY_LABEL}</p>
          <h1 className="text-xl font-bold text-[#13193a]">
            {saludo}, <span className="font-light">{usuario?.nombre ?? "Analista"}</span>
          </h1>
          <p className="text-xs text-gray-400">Panel de analista · Todas las oficinas</p>
        </div>
        <button
          onClick={() => navigate("/gaman/pagos")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#13193a] text-white text-sm font-semibold hover:bg-[#1e2a50] transition-all shadow-sm shrink-0"
        >
          <CreditCard className="w-4 h-4" />
          Ir a pagos
        </button>
      </div>

      {/* ── Fila 2: KPIs (15%) ─────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2 min-h-0">
        {[
          { label: "Por aplicar",     value: nAdeudo,         sub: "pagos pendientes",            num: "text-amber-500",   ico: "text-amber-400",   Icon: Clock,         onClick: () => navigate("/gaman/pagos") },
          { label: "Monto pendiente", value: fmt$(montoPend), sub: "por aplicar",                  num: "text-[#13193a]",   ico: "text-gray-400",    Icon: CreditCard,    onClick: () => navigate("/gaman/pagos") },
          { label: "Total aplicados", value: nPagado,          sub: fmt$(montoAplic),              num: "text-emerald-600", ico: "text-emerald-400", Icon: CheckCircle2,  onClick: () => navigate("/gaman/pagos") },
          { label: "Alertas de pago", value: alertas.length,   sub: "pólizas vencidas (sin pago)",
            num: alertas.length > 0 ? "text-red-500" : "text-gray-400",
            ico: alertas.length > 0 ? "text-red-400" : "text-gray-300",
            Icon: AlertTriangle, onClick: () => navigate("/gaman/polizas") },
        ].map(k => (
          <button key={k.label} onClick={k.onClick}
            className="bg-white border border-gray-100 rounded-xl px-3 py-2 text-left hover:shadow-sm transition-all h-full flex flex-col justify-center gap-0.5">
            <div className="flex items-start justify-between w-full mb-0.5">
              <p className={`text-xl font-black tabular-nums leading-none ${k.num}`}>{k.value}</p>
              <k.Icon className={`w-4 h-4 ${k.ico} shrink-0 mt-0.5`} />
            </div>
            <p className="text-[11px] font-semibold text-gray-700">{k.label}</p>
            <p className="text-[10px] text-gray-400">{k.sub}</p>
          </button>
        ))}
      </div>

      {/* ── Fila 3: Pendientes + Alertas (35%) ─────────────── */}
      <div className="grid grid-cols-3 gap-2 min-h-0">

        {/* Pendientes (2/3) */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex">

          {/* Izquierda: título + lista (70%) */}
          <div className="flex flex-col overflow-hidden" style={{ width: "75%" }}>
            <div className="px-3 py-2 border-b border-gray-50 shrink-0">
              <p className="text-sm font-bold text-[#13193a]">Pagos por aplicar</p>
              <p className="text-[11px] text-gray-400">Pendientes de confirmación</p>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              {topPendientes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-1 text-gray-400">
                  <CheckCircle2 className="w-7 h-7 text-emerald-300" />
                  <p className="text-sm font-medium">Todo al corriente</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {topPendientes.map(p => {
                    const pol = p.polizas;
                    const constancia = pol?.constancia || pol?.numero_poliza || "—";
                    const totalCuotas = pol?.forma_pago === "CONTADO" ? 1 : 4;
                    return (
                      <div key={p.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50/60 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#13193a] truncate">{nombreCorto(pol)}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{constancia} · {pol?.oficinas?.nombre ?? "—"}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {Array.from({ length: totalCuotas }, (_, i) => (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i+1 < (p.num_cuota??1) ? "bg-emerald-400" : i+1 === (p.num_cuota??1) ? "bg-amber-400" : "bg-gray-200"}`} />
                          ))}
                          <span className="text-[10px] text-gray-400 ml-1 tabular-nums">{p.num_cuota??1}/{totalCuotas}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-emerald-700 tabular-nums">{fmt$(p.monto)}</p>
                          <p className="text-[10px] text-gray-400">{p.fecha_pago ? fmtCorta(p.fecha_pago) : "Sin fecha"}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-3 py-1.5 border-t border-gray-50 shrink-0">
              <button onClick={() => navigate("/gaman/pagos")}
                className="flex items-center gap-1 text-xs font-semibold text-[#13193a] hover:underline">
                Ver todos los pagos <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Derecha: donut + stats (30%) */}
          <div className="flex flex-col items-center justify-center border-l border-gray-50 p-2 min-h-0" style={{ width: "25%" }}>
            <RingChart pagado={nPagado} adeudo={nAdeudo} />
            <div className="space-y-1.5 shrink-0 mt-2">
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-[11px] text-gray-500">Aplicados: <strong className="text-gray-700">{nPagado}</strong></span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span className="text-[11px] text-gray-500">Pendientes: <strong className="text-amber-700">{nAdeudo}</strong></span>
              </div>
            </div>
          </div>

        </div>

        {/* Alertas (1/3) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-50 shrink-0">
            <div className="w-6 h-6 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-3 h-3 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#13193a]">Alertas de pago</p>
              <p className="text-[11px] text-gray-400">Pólizas vencidas por adeudo</p>
            </div>
            {alertas.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                {alertas.length}
              </span>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {alertas.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-1 text-gray-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-300" />
                <p className="text-xs font-medium">Sin alertas</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {alertas.map(p => (
                  <div key={p.id} className="flex items-start justify-between gap-1 px-3 py-1.5">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#13193a] truncate">
                        {[p.clientes?.nombre, p.clientes?.apellido].filter(Boolean).join(" ") || "—"}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono">{p.constancia || p.numero_poliza}</p>
                      <p className="text-[10px] text-gray-400 truncate">{p.oficinas?.nombre ?? "—"}</p>
                    </div>
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                      Vence {fmtCorta(p.fecha_fin)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-3 py-1.5 border-t border-gray-50 shrink-0">
            <button onClick={() => navigate("/gaman/polizas")}
              className="flex items-center gap-1 text-xs font-semibold text-[#13193a] hover:underline">
              Ver pólizas <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Fila 4: Gráfica + Recientes (35%) ──────────────── */}
      <div className="grid grid-cols-[7fr_3fr] gap-2 min-h-0">

        {/* Gráfica por oficina */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-50 shrink-0">
            <div>
              <p className="text-sm font-bold text-[#13193a]">Pagos por oficina</p>
              <p className="text-[11px] text-gray-400">Pendientes vs aplicados</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                <span className="text-[11px] text-gray-500">Por aplicar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                <span className="text-[11px] text-gray-500">Aplicados</span>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0 p-3">
            {porOficina.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">Sin datos disponibles</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={porOficina} margin={{ top: 4, right: 8, left: 4, bottom: 0 }} barSize={8} barGap={2}>
                  <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }} tickLine={false} axisLine={false} width={60} />
                  <Tooltip content={<TooltipPagos />} cursor={{ fill: "#f8fafc" }} />
                  <Bar dataKey="adeudo" fill="#fbbf24" radius={[0,4,4,0]} name="Por aplicar" />
                  <Bar dataKey="pagado" fill="#10b981" radius={[0,4,4,0]} name="Aplicados" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Últimos aplicados */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-50 shrink-0">
            <div>
              <p className="text-sm font-bold text-[#13193a]">Últimos aplicados</p>
              <p className="text-[11px] text-gray-400">Pagos confirmados recientemente</p>
            </div>
            <FileText className="w-4 h-4 text-gray-300" />
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {recientes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-1 text-gray-400">
                <Clock className="w-6 h-6 text-gray-200" />
                <p className="text-xs font-medium">Sin actividad reciente</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recientes.map(p => {
                  const pol = p.polizas;
                  const constancia = pol?.constancia || pol?.numero_poliza || "—";
                  const totalCuotas = pol?.forma_pago === "CONTADO" ? 1 : 4;
                  return (
                    <div key={p.id} className="flex items-center gap-2 px-3 py-1.5">
                      <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#13193a] truncate">{nombreCorto(pol)}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{constancia} · cuota {p.num_cuota??1}/{totalCuotas}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-emerald-700 tabular-nums">{fmt$(p.monto)}</p>
                        <p className="text-[10px] text-gray-400">{p.fecha_pago ? fmtCorta(p.fecha_pago) : "—"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-3 py-1.5 border-t border-gray-50 shrink-0">
            <button onClick={() => navigate("/gaman/pagos")}
              className="flex items-center gap-1 text-xs font-semibold text-[#13193a] hover:underline">
              Ver historial de pagos <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

    </div>
    </div>
  );
}
