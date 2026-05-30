import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { SPARK_POLIZAS, SPARK_COBRO } from "./data/dashboardData";
import SparkBar from "./components/SparkBar";
import { AlertTriangle, ChevronRight, ClipboardList, FileText, Plus, Ticket } from "lucide-react";

const HOY = new Date().toLocaleDateString("es-MX", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const fmt$ = (n) =>
  "$" + new Intl.NumberFormat("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n ?? 0);

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
  const [kpiPrima,      setKpiPrima]      = useState(0);
  const [ultimas,       setUltimas]       = useState([]);
  const [vencen,        setVencen]        = useState([]);
  const [cotizaciones,  setCotizaciones]  = useState(() => {
    try { return JSON.parse(localStorage.getItem("cofisem_cotizaciones") || "[]"); }
    catch { return []; }
  });

  useEffect(() => {
    const load = async () => {
      const oid = usuario?.oficinas?.id;
      if (!oid) { setLoading(false); return; }

      const today    = new Date().toISOString().split("T")[0];
      const en7      = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

      try {
        const [
          { count: cHoy },
          { count: cVencer },
          { data: dUltimas },
          { data: dVencen },
          { data: dPrima },
        ] = await Promise.all([
          supabase.from("polizas").select("id", { count: "exact", head: true })
            .eq("oficina_id", oid).neq("estatus", "COTIZACION")
            .gte("created_at", today + "T00:00:00").lte("created_at", today + "T23:59:59"),

          supabase.from("polizas").select("id", { count: "exact", head: true })
            .eq("oficina_id", oid).in("estatus", ["VIGENTE", "POR VENCER"])
            .gte("fecha_fin", today).lte("fecha_fin", en7),

          supabase.from("polizas")
            .select("id, constancia, numero_poliza, estatus, tipo_poliza, clientes(nombre, apellido), created_at, coberturas(prima_total)")
            .eq("oficina_id", oid).neq("estatus", "COTIZACION")
            .order("created_at", { ascending: false }).limit(5),

          supabase.from("polizas")
            .select("id, constancia, numero_poliza, fecha_fin, clientes(nombre, apellido)")
            .eq("oficina_id", oid).in("estatus", ["VIGENTE", "POR VENCER"])
            .gte("fecha_fin", today).lte("fecha_fin", en7)
            .order("fecha_fin", { ascending: true }).limit(5),

          supabase.from("polizas")
            .select("coberturas(prima_total)")
            .eq("oficina_id", oid).neq("estatus", "COTIZACION")
            .gte("created_at", inicioMes + "T00:00:00"),
        ]);

        setKpiHoy(cHoy ?? 0);
        setKpiVencer(cVencer ?? 0);
        setKpiPrima((dPrima || []).reduce((s, r) => s + (r.coberturas?.prima_total ?? 0), 0));
        setUltimas(dUltimas || []);
        setVencen(dVencen || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [usuario]);

  return (
    <div className="h-full overflow-y-auto bg-[#f7f8fa]">
      <div className="max-w-7xl mx-auto p-6 space-y-5">

        {/* ── TOP: saludo + acciones ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
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
            {/* Corte del día — deshabilitado temporalmente */}
            <button
              disabled
              title="Próximamente"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-400 opacity-40 cursor-not-allowed select-none"
            >
              <Ticket className="w-4 h-4" />
              Corte del día
            </button>
          </div>
        </div>

        {/* ── FILA 1: KPIs ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pólizas emitidas hoy — REAL */}
          <button
            onClick={() => navigate("/gaman/polizas")}
            className="bg-white rounded-2xl border border-gray-100 p-4 text-left hover:shadow-md hover:border-gray-200 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs text-gray-400 font-medium leading-snug">Pólizas emitidas hoy</p>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 transition-colors shrink-0 ml-2" />
            </div>
            <p className="text-2xl font-bold text-[#13193a] tabular-nums mb-2">{loading ? "—" : kpiHoy}</p>
            <SparkBar data={SPARK_POLIZAS} color="#13193a" />
            <p className="text-[11px] font-medium mt-2 flex items-center gap-1 text-emerald-600">
              ↑ en esta oficina
            </p>
          </button>

          {/* Cotizaciones guardadas — localStorage */}
          <button
            onClick={() => navigate("/gaman/polizas")}
            className="bg-white rounded-2xl border border-gray-100 p-4 text-left hover:shadow-md hover:border-gray-200 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs text-gray-400 font-medium leading-snug">Cotizaciones guardadas</p>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 transition-colors shrink-0 ml-2" />
            </div>
            <p className="text-2xl font-bold text-[#13193a] tabular-nums mb-2">{cotizaciones.length}</p>
            <SparkBar data={[1, 2, 3, 2, 4, 3, 3]} color="#d97706" />
            <p className="text-[11px] font-medium mt-2 flex items-center gap-1 text-amber-600">
              · Ver en pólizas
            </p>
          </button>

          {/* Pólizas por vencer — REAL */}
          <button
            onClick={() => navigate("/gaman/polizas")}
            className="bg-white rounded-2xl border border-gray-100 p-4 text-left hover:shadow-md hover:border-gray-200 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs text-gray-400 font-medium leading-snug">Pólizas por vencer</p>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 transition-colors shrink-0 ml-2" />
            </div>
            <p className="text-2xl font-bold text-[#13193a] tabular-nums mb-2">{loading ? "—" : kpiVencer}</p>
            <SparkBar data={[2, 1, 3, 2, 4, 3, 5]} color="#ef4444" />
            <p className="text-[11px] font-medium mt-2 flex items-center gap-1 text-red-500">
              ↓ Próximos 7 días
            </p>
          </button>

          {/* Prima acumulada del mes — REAL */}
          <button
            onClick={() => navigate("/gaman/polizas")}
            className="bg-white rounded-2xl border border-gray-100 p-4 text-left hover:shadow-md hover:border-gray-200 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs text-gray-400 font-medium leading-snug">Prima acumulada del mes</p>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 transition-colors shrink-0 ml-2" />
            </div>
            <p className="text-2xl font-bold text-[#13193a] tabular-nums mb-2">{loading ? "—" : fmt$(kpiPrima)}</p>
            <SparkBar data={SPARK_COBRO} color="#059669" />
            <p className="text-[11px] font-medium mt-2 flex items-center gap-1 text-emerald-600">
              ↑ pólizas emitidas este mes
            </p>
          </button>
        </div>

        {/* ── FILA 2: Pólizas + Cotizaciones + Por vencer ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Últimas pólizas — REAL */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <p className="text-sm font-bold text-[#13193a]">Pólizas emitidas hoy</p>
              <button onClick={() => navigate("/gaman/polizas")} className="text-xs text-blue-500 font-semibold hover:underline">
                Ver todas
              </button>
            </div>
            <div className="divide-y divide-gray-50">
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

          {/* Cotizaciones */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <p className="text-sm font-bold text-[#13193a]">
                Cotizaciones guardadas
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
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <ClipboardList className="w-8 h-8 text-gray-200 mb-2" />
                <p className="text-xs text-gray-400">No hay cotizaciones guardadas</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {cotizaciones.slice(0, 4).map((c, i) => (
                  <button
                    key={i}
                    onClick={() => navigate("/gaman/polizas")}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 transition-colors text-left"
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
                {cotizaciones.length > 4 && (
                  <button onClick={() => navigate("/gaman/polizas")} className="w-full text-center py-2.5 text-[11px] text-blue-500 font-semibold hover:bg-gray-50 transition-colors">
                    +{cotizaciones.length - 4} más → Ver todas
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Próximas a vencer */}
          <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-4 border-b border-amber-50 bg-amber-50/50">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-sm font-bold text-amber-800">Por vencer</p>
            </div>
            <div className="divide-y divide-amber-50/50">
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


      </div>
    </div>
  );
}
