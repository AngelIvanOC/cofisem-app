import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../supabaseClient";
import { calcularEstatus } from "../../services/polizas";
import StatusBadge from "../operador/components/StatusBadge";
import { usePagination } from "../../hooks/usePagination";
import Paginator from "../../components/Paginator";
import { ChevronLeft, Loader2, Search, X, CheckCircle2, Clock, AlertTriangle, Ban } from "lucide-react";

function fmtFecha(str) {
  if (!str) return "—";
  return new Date(str + "T12:00:00").toLocaleDateString("es-MX", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function fmtMXN(n) {
  return `$${Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Estatus de cuota ─────────────────────────────────────────
function CuotaEstatus({ estatus }) {
  const e = (estatus ?? "").toUpperCase();
  if (e === "PAGADO" || e === "PAGADA")
    return <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">Pagado</span>;
  if (e === "VENCIDO" || e === "VENCIDA")
    return <span className="text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">Vencido</span>;
  return <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">Pendiente</span>;
}

// ── Panel de detalle ──────────────────────────────────────────
function DetallePoliza({ poliza, pagos, onVolver }) {
  const cliente      = poliza.clientes     ?? {};
  const vendedor     = poliza.vendedores   ?? {};
  const concesionario= poliza.concesionarios ?? null;
  const oficina      = poliza.oficinas     ?? {};

  const clienteLabel = [cliente.nombre, cliente.apellido].filter(Boolean).join(" ") || "—";
  const vendedorLabel= [vendedor.nombre, vendedor.apellido].filter(Boolean).join(" ") || "—";
  const concLabel    = concesionario
    ? [concesionario.nombre, concesionario.apellido1, concesionario.apellido2].filter(Boolean).join(" ")
    : "—";

  const emision = poliza.created_at
    ? new Date(poliza.created_at).toLocaleDateString("es-MX", { day:"2-digit", month:"2-digit", year:"numeric" })
    : "—";

  const filas = [
    { l: "No. Póliza",         v: poliza.constancia || poliza.numero_poliza || "—" },
    { l: "Vendedor",           v: vendedorLabel },
    { l: "Asegurado",          v: clienteLabel },
    { l: "Concesionario",      v: concLabel },
    { l: "Cobertura",          v: poliza.coberturas?.nombre || "—" },
    { l: "Modalidad de pago",  v: poliza.forma_pago || "—" },
    { l: "Inicio de vigencia", v: fmtFecha(poliza.fecha_inicio) },
    { l: "Fin de vigencia",    v: fmtFecha(poliza.fecha_fin) },
    { l: "Oficina",            v: oficina.nombre || "—" },
    { l: "Placas",             v: poliza.placas || "—" },
  ];

  return (
    <div className="space-y-5">
      <button
        onClick={onVolver}
        className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#13193a] transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Volver a pólizas
      </button>

      {/* Banner */}
      <div className="bg-[#13193a] rounded-2xl px-5 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-white/40 mb-0.5">No. Póliza</p>
            <p className="text-white font-mono font-bold">{poliza.constancia || poliza.numero_poliza}</p>
          </div>
          <div>
            <p className="text-white/40 mb-0.5">Fecha emisión</p>
            <p className="text-white font-semibold">{emision}</p>
          </div>
          <div>
            <p className="text-white/40 mb-0.5">Estatus</p>
            <StatusBadge estatus={poliza.estatus} />
          </div>
          <div>
            <p className="text-white/40 mb-0.5">Oficina</p>
            <p className="text-white font-semibold truncate">{oficina.nombre || "—"}</p>
          </div>
        </div>
      </div>

      {/* Datos */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        {/* Características */}
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
            Características de la póliza
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
            {filas.map(({ l, v }) => (
              <div key={l}>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">{l}</p>
                <p className="font-semibold text-[#13193a] text-xs leading-snug">{v}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm font-bold text-gray-500">Prima total</p>
            <p className="text-3xl font-black text-[#13193a] tabular-nums">
              {fmtMXN(poliza.coberturas?.prima_total)}
            </p>
          </div>
        </div>

        {/* Cuotas de pago */}
        {pagos && pagos.length > 0 && (
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Cuotas de Pago
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[...pagos]
                .sort((a, b) => new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento))
                .map((q, i) => (
                  <div key={q.id} className="bg-white rounded-xl border border-gray-100 p-2.5 text-center">
                    <p className="text-[10px] text-gray-400 mb-1">Cuota {i + 1}</p>
                    <p className="text-sm font-bold text-[#13193a]">{fmtMXN(q.monto)}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 mb-1.5">{fmtFecha(q.fecha_vencimiento)}</p>
                    <CuotaEstatus estatus={q.estatus} />
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function AnalistaPolizas() {
  const [polizas,         setPolizas]         = useState([]);
  const [cargando,        setCargando]        = useState(true);
  const [busqueda,        setBusqueda]        = useState("");
  const [busquedaFiltro,  setBusquedaFiltro]  = useState("");
  const [filtroOficina,   setFiltroOficina]   = useState("Todas");
  const [filtroVendedor,  setFiltroVendedor]  = useState("Todos");
  const [filtroEstatus,   setFiltroEstatus]   = useState("Todos");
  const [filtroFormaPago, setFiltroFormaPago] = useState("Todas");
  const [filtroCobertura, setFiltroCobertura] = useState("Todas");
  const [detalleData,     setDetalleData]     = useState(null);
  const [loadingDetalleId,setLoadingDetalleId]= useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from("polizas")
      .select(`
        id, numero_poliza, constancia, estatus, forma_pago,
        fecha_inicio, fecha_fin, placas, created_at,
        cliente_id, cobertura_id, oficina_id,
        clientes(nombre, apellido),
        vendedores(nombre, apellido),
        concesionarios(nombre, apellido1, apellido2),
        oficinas(id, nombre),
        coberturas(nombre, prima_neta, prima_total)
      `)
      .in("estatus", ["VIGENTE", "POR VENCER", "VENCIDA", "CANCELADA", "ANULADA"])
      .order("fecha_inicio", { ascending: false });

    if (error) console.error("Error cargando pólizas analista:", error.message);
    setPolizas(
      (data ?? []).map((p) => ({
        ...p,
        estatus: calcularEstatus(p.estatus, p.fecha_fin),
      })),
    );
    setCargando(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    const t = setTimeout(() => setBusquedaFiltro(busqueda), 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  // Listas únicas para filtros
  const listaOficinas = useMemo(() =>
    [...new Set(polizas.map((p) => p.oficinas?.nombre).filter(Boolean))].sort(),
  [polizas]);

  const listaVendedores = useMemo(() =>
    [...new Set(polizas.map((p) =>
      `${p.vendedores?.nombre || ""} ${p.vendedores?.apellido || ""}`.trim()
    ).filter(Boolean))].sort(),
  [polizas]);

  const listaCoberturas = useMemo(() =>
    [...new Set(polizas.map((p) => p.coberturas?.nombre).filter(Boolean))].sort(),
  [polizas]);

  const listaEstatus = ["Todos", "VIGENTE", "POR VENCER", "VENCIDA", "CANCELADA", "ANULADA"];

  // Métricas
  const nVigentes  = polizas.filter((p) => p.estatus === "VIGENTE").length;
  const nPorVencer = polizas.filter((p) => p.estatus === "POR VENCER").length;
  const nVencidas  = polizas.filter((p) => p.estatus === "VENCIDA").length;
  const nCanceladas= polizas.filter((p) => p.estatus === "CANCELADA").length;

  const filtradas = useMemo(() => {
    const b = busquedaFiltro.toLowerCase();
    return polizas.filter((p) => {
      const txt = `${p.constancia || p.numero_poliza} ${p.clientes?.nombre || ""} ${p.clientes?.apellido || ""} ${p.placas || ""}`.toLowerCase();
      const mb = txt.includes(b);
      const mo = filtroOficina   === "Todas" || p.oficinas?.nombre === filtroOficina;
      const mv = filtroVendedor  === "Todos" ||
        `${p.vendedores?.nombre || ""} ${p.vendedores?.apellido || ""}`.trim() === filtroVendedor;
      const me = filtroEstatus   === "Todos" || p.estatus === filtroEstatus;
      const mfp= filtroFormaPago === "Todas" || p.forma_pago === filtroFormaPago;
      const mc = filtroCobertura === "Todas" || p.coberturas?.nombre === filtroCobertura;
      return mb && mo && mv && me && mfp && mc;
    });
  }, [polizas, busquedaFiltro, filtroOficina, filtroVendedor, filtroEstatus, filtroFormaPago, filtroCobertura]);

  const { paginated: paginadas, page, setPage, totalPages, total } = usePagination(filtradas);

  const abrirDetalle = async (p) => {
    setLoadingDetalleId(p.id);
    try {
      const [polizaRes, pagosRes] = await Promise.all([
        supabase
          .from("polizas")
          .select(`
            id, numero_poliza, constancia, estatus, forma_pago,
            fecha_inicio, fecha_fin, placas, created_at,
            clientes(nombre, apellido),
            vendedores(nombre, apellido),
            concesionarios(nombre, apellido1, apellido2),
            oficinas(id, nombre),
            coberturas(nombre, prima_neta, prima_total)
          `)
          .eq("id", p.id)
          .single(),
        supabase
          .from("pagos")
          .select("id, monto, fecha_vencimiento, estatus")
          .eq("poliza_id", p.id)
          .order("fecha_vencimiento", { ascending: true }),
      ]);
      if (polizaRes.data) {
        setDetalleData({
          poliza: { ...polizaRes.data, estatus: calcularEstatus(polizaRes.data.estatus, polizaRes.data.fecha_fin) },
          pagos: pagosRes.data ?? [],
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetalleId(null);
    }
  };

  const selCls = "text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 max-w-[160px]";

  if (detalleData) {
    return (
      <div className="p-6 min-h-full bg-gray-50">
        <DetallePoliza poliza={detalleData.poliza} pagos={detalleData.pagos} onVolver={() => setDetalleData(null)} />
      </div>
    );
  }

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#13193a]">Pólizas</h1>
        <p className="text-gray-400 text-sm mt-0.5">Consulta de pólizas — todas las oficinas</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Vigentes",   value: nVigentes,   Icon: CheckCircle2,  num: "text-emerald-600", ico: "text-emerald-500", est: "VIGENTE"    },
          { label: "Por vencer", value: nPorVencer,  Icon: Clock,         num: "text-amber-500",   ico: "text-amber-400",   est: "POR VENCER" },
          { label: "Vencidas",   value: nVencidas,   Icon: AlertTriangle, num: "text-red-500",     ico: "text-red-400",     est: "VENCIDA"    },
          { label: "Canceladas", value: nCanceladas, Icon: Ban,           num: "text-gray-500",    ico: "text-gray-400",    est: "CANCELADA"  },
        ].map((m) => (
          <button
            key={m.label}
            onClick={() => setFiltroEstatus(m.est)}
            className="bg-white border border-gray-100 rounded-2xl p-4 text-left hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between mb-1">
              <p className={`text-2xl font-bold tabular-nums ${m.num}`}>{m.value}</p>
              <m.Icon className={`w-5 h-5 ${m.ico} mt-0.5 shrink-0`} />
            </div>
            <p className={`text-xs font-semibold ${m.num}`}>{m.label}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Filtros */}
        <div className="flex flex-wrap items-end gap-2 px-5 py-3 border-b border-gray-100">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">Buscar</span>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Póliza, asegurado, placas..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] w-52 bg-white"
              />
            </div>
          </div>

          {[
            { label: "Oficina",       value: filtroOficina,   set: setFiltroOficina,
              opts: [["Todas","Todas las oficinas"], ...listaOficinas.map(o => [o,o])] },
            { label: "Vendedor",      value: filtroVendedor,  set: setFiltroVendedor,
              opts: [["Todos","Todos los vendedores"], ...listaVendedores.map(v => [v,v])] },
            { label: "Estatus",       value: filtroEstatus,   set: setFiltroEstatus,
              opts: listaEstatus.map(o => [o,o]) },
            { label: "Forma de pago", value: filtroFormaPago, set: setFiltroFormaPago,
              opts: [["Todas","Todas"],["CONTADO","Contado"],["PARCIALES","Parciales"]] },
            { label: "Cobertura",     value: filtroCobertura, set: setFiltroCobertura,
              opts: [["Todas","Todas"], ...listaCoberturas.map(c => [c,c])] },
          ].map(({ label, value, set, opts }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">{label}</span>
              <select value={value} onChange={(e) => set(e.target.value)} className={selCls}>
                {opts.map(([v, lbl]) => <option key={v} value={v}>{lbl}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          {cargando ? (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
              <Loader2 className="animate-spin w-5 h-5" />
              <span className="text-sm">Cargando pólizas…</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  {["Constancia","Asegurado","Oficina","Vendedor","Cobertura","Placas","Prima","Vence","Estatus"].map((h) => (
                    <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-3 py-2 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtradas.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-sm text-gray-400">
                      No se encontraron pólizas.
                    </td>
                  </tr>
                ) : (
                  paginadas.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => abrirDetalle(p)}
                      className={`hover:bg-gray-50/60 transition-colors cursor-pointer ${
                        loadingDetalleId === p.id ? "opacity-60" : ""
                      }`}
                    >
                      <td className="px-3 py-1.5 font-mono text-xs font-bold text-[#13193a] whitespace-nowrap">
                        {p.constancia || p.numero_poliza}
                      </td>
                      <td className="px-3 py-1.5 text-xs font-semibold text-gray-700 max-w-[9rem] truncate">
                        {p.clientes?.nombre} {p.clientes?.apellido}
                      </td>
                      <td className="px-3 py-1.5 text-xs text-gray-500 max-w-[6rem] truncate">
                        {p.oficinas?.nombre || "—"}
                      </td>
                      <td className="px-3 py-1.5 text-xs text-gray-500 max-w-[8rem] truncate">
                        {p.vendedores?.nombre} {p.vendedores?.apellido}
                      </td>
                      <td className="px-3 py-1.5 text-xs text-gray-500 max-w-[9rem] truncate">
                        {p.coberturas?.nombre}
                      </td>
                      <td className="px-3 py-1.5 font-mono text-xs text-gray-600 whitespace-nowrap">
                        {p.placas || "—"}
                      </td>
                      <td className="px-3 py-1.5 text-xs font-bold text-emerald-700 whitespace-nowrap">
                        {fmtMXN(p.coberturas?.prima_total)}
                      </td>
                      <td className="px-3 py-1.5 text-xs text-gray-500 whitespace-nowrap">
                        {fmtFecha(p.fecha_fin)}
                      </td>
                      <td className="px-3 py-1.5">
                        <StatusBadge estatus={p.estatus} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        <Paginator page={page} totalPages={totalPages} total={total} pageSize={10} onPage={setPage} />
      </div>
    </div>
  );
}
