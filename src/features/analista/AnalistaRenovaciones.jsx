import { useState, useEffect, useCallback, useMemo } from "react";
import ExcelJS from "exceljs";
import { pdf } from "@react-pdf/renderer";
import { supabase } from "../../supabaseClient";
import { calcularEstatus } from "../../services/polizas";
import StatusBadge from "../operador/components/StatusBadge";
import { usePagination } from "../../hooks/usePagination";
import Paginator from "../../components/Paginator";
import RenovacionesPDF from "../../components/pdf/RenovacionesPDF";
import {
  RefreshCw,
  Loader2,
  Search,
  Download,
  FileText,
  Calendar,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function ultimoDiaMes(anio, mes) {
  return new Date(anio, mes, 0).getDate();
}

function fmtFecha(str) {
  if (!str) return "—";
  return new Date(str + "T12:00:00").toLocaleDateString("es-MX", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function diasInfo(fechaFin) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fin = new Date(fechaFin + "T00:00:00");
  const dias = Math.floor((fin - hoy) / 86_400_000);
  if (dias < 0) return { txt: `Venció hace ${Math.abs(dias)} d.`, cls: "text-red-600 font-semibold", dias };
  if (dias === 0) return { txt: "Vence hoy", cls: "text-red-600 font-bold", dias };
  if (dias <= 7) return { txt: `En ${dias} d.`, cls: "text-amber-600 font-semibold", dias };
  return { txt: `En ${dias} d.`, cls: "text-gray-500", dias };
}

// Mismo criterio que en Pagos y cuotas (AnalistaPolizas.jsx): PAGADO/ADEUDO
// vienen de la BD, VENCIDO se calcula por fecha cuando sigue PENDIENTE.
function estatusEfectivoCuota(estatus, fechaVencimiento) {
  const e = (estatus ?? "").toUpperCase();
  if (e === "PAGADO" || e === "PAGADA") return "PAGADO";
  if (e === "ADEUDO") return "ADEUDO";
  if (!fechaVencimiento) return "PENDIENTE";
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const venc = new Date(fechaVencimiento + "T00:00:00");
  return venc < hoy ? "VENCIDO" : "PENDIENTE";
}

// La constancia sigue el formato BASE-NN; renovar incrementa el sufijo
// (ver renovarPoliza en services/polizas.js). Si no matchea el formato,
// no se puede determinar la sucesora y se asume pendiente.
function siguienteConstancia(constancia) {
  const m = (constancia || "").match(/^(.+)-(\d+)$/);
  if (!m) return null;
  return `${m[1]}-${String(parseInt(m[2], 10) + 1).padStart(2, "0")}`;
}

function RenovacionBadge({ estado }) {
  if (estado === "RENOVADA") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
        <CheckCircle2 className="w-3 h-3" /> Renovada
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[11px] px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200 font-semibold">
      Pendiente
    </span>
  );
}

function AdeudoBadge({ tieneAdeudo }) {
  if (!tieneAdeudo) return <span className="text-gray-300 text-xs">—</span>;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border bg-blue-50 text-blue-700 border-blue-200 font-semibold">
      <AlertTriangle className="w-3 h-3" /> Adeudo
    </span>
  );
}

export default function AnalistaRenovaciones() {
  const hoy = new Date();

  const [selMes, setSelMes] = useState(hoy.getMonth() + 1);
  const [selAnio, setSelAnio] = useState(hoy.getFullYear());
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [polizas, setPolizas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaFiltro, setBusquedaFiltro] = useState("");
  const [filtroOficina, setFiltroOficina] = useState("Todas");
  const [filtroEstatus, setFiltroEstatus] = useState("Todos");
  const [filtroRenovacion, setFiltroRenovacion] = useState("Todos");
  const [filtroAdeudo, setFiltroAdeudo] = useState("Todos");

  const anios = Array.from({ length: 5 }, (_, i) => hoy.getFullYear() - 2 + i);

  const cargar = useCallback(async () => {
    setCargando(true);
    const ultimo = ultimoDiaMes(selAnio, selMes);
    const inicio = `${selAnio}-${String(selMes).padStart(2, "0")}-01`;
    const fin = `${selAnio}-${String(selMes).padStart(2, "0")}-${String(ultimo).padStart(2, "0")}`;

    const { data, error } = await supabase
      .from("polizas")
      .select(`
        id, numero_poliza, constancia, estatus, fecha_fin, oficina_id,
        oficinas(nombre),
        vendedores(nombre, apellido, telefono, email),
        clientes(nombre, apellido, telefono, email)
      `)
      .gte("fecha_fin", inicio)
      .lte("fecha_fin", fin)
      .in("estatus", ["VIGENTE", "POR VENCER", "VENCIDA"])
      .order("fecha_fin", { ascending: true });

    if (error) console.error("Error cargando renovaciones:", error.message);

    const candidatas = (data ?? []).map((p) => ({
      ...p,
      estatus: calcularEstatus(p.estatus, p.fecha_fin),
      _siguiente: siguienteConstancia(p.constancia || p.numero_poliza),
    }));

    if (candidatas.length === 0) {
      setPolizas([]);
      setCargando(false);
      return;
    }

    const siguientesUnicas = [...new Set(candidatas.map((p) => p._siguiente).filter(Boolean))];
    const ids = candidatas.map((p) => p.id);

    const [sucesorasRes, pagosRes] = await Promise.all([
      siguientesUnicas.length > 0
        ? supabase.from("polizas").select("id, constancia, estatus").in("constancia", siguientesUnicas)
        : Promise.resolve({ data: [] }),
      supabase.from("pagos").select("poliza_id, estatus, fecha_vencimiento").in("poliza_id", ids),
    ]);

    const mapaSucesoras = new Map((sucesorasRes.data ?? []).map((s) => [s.constancia, s]));
    const cuotasPorPoliza = new Map();
    (pagosRes.data ?? []).forEach((c) => {
      const arr = cuotasPorPoliza.get(c.poliza_id) ?? [];
      arr.push(c);
      cuotasPorPoliza.set(c.poliza_id, arr);
    });

    setPolizas(
      candidatas.map((p) => {
        const sucesora = p._siguiente ? mapaSucesoras.get(p._siguiente) : null;
        const renovada = !!sucesora && sucesora.estatus !== "CANCELADA" && sucesora.estatus !== "ANULADA";
        const cuotas = cuotasPorPoliza.get(p.id) ?? [];
        const tieneAdeudo = cuotas.some((c) => {
          const e = estatusEfectivoCuota(c.estatus, c.fecha_vencimiento);
          return e === "ADEUDO" || e === "VENCIDO";
        });
        return { ...p, renovacionEstado: renovada ? "RENOVADA" : "PENDIENTE", tieneAdeudo };
      }),
    );
    setCargando(false);
  }, [selMes, selAnio]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    const t = setTimeout(() => setBusquedaFiltro(busqueda), 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  const listaOficinas = useMemo(() =>
    [...new Set(polizas.map((p) => p.oficinas?.nombre).filter(Boolean))].sort(),
  [polizas]);

  const filtradas = useMemo(() => {
    const b = busquedaFiltro.toLowerCase();
    return polizas.filter((p) => {
      const txt = `${p.constancia || p.numero_poliza} ${p.clientes?.nombre || ""} ${p.clientes?.apellido || ""} ${p.clientes?.telefono || ""} ${p.vendedores?.nombre || ""} ${p.vendedores?.apellido || ""}`.toLowerCase();
      const mb = txt.includes(b);
      const mo = filtroOficina === "Todas" || p.oficinas?.nombre === filtroOficina;
      const me = filtroEstatus === "Todos" || p.estatus === filtroEstatus;
      const mr = filtroRenovacion === "Todos" || p.renovacionEstado === filtroRenovacion;
      const ma = filtroAdeudo === "Todos" || (filtroAdeudo === "CON_ADEUDO" ? p.tieneAdeudo : !p.tieneAdeudo);
      return mb && mo && me && mr && ma;
    });
  }, [polizas, busquedaFiltro, filtroOficina, filtroEstatus, filtroRenovacion, filtroAdeudo]);

  const { paginated: paginadas, page, setPage, totalPages, total } = usePagination(filtradas);

  const nPendientes = polizas.filter((p) => p.renovacionEstado === "PENDIENTE").length;
  const nRenovadas = polizas.filter((p) => p.renovacionEstado === "RENOVADA").length;
  const nAdeudo = polizas.filter((p) => p.tieneAdeudo).length;
  const nVencidasSinRenovar = polizas.filter((p) => p.estatus === "VENCIDA" && p.renovacionEstado === "PENDIENTE").length;

  const filaExport = (p) => ({
    poliza: p.constancia || p.numero_poliza || "—",
    oficina: p.oficinas?.nombre || "—",
    cliente: [p.clientes?.nombre, p.clientes?.apellido].filter(Boolean).join(" ") || "—",
    telCliente: p.clientes?.telefono || "—",
    correoCliente: p.clientes?.email || "—",
    vendedor: [p.vendedores?.nombre, p.vendedores?.apellido].filter(Boolean).join(" ") || "—",
    telVendedor: p.vendedores?.telefono || "—",
    correoVendedor: p.vendedores?.email || "—",
    vence: fmtFecha(p.fecha_fin),
    estatus: p.estatus,
    renovacion: p.renovacionEstado === "RENOVADA" ? "Renovada" : "Pendiente",
    adeudo: p.tieneAdeudo ? "Sí" : "No",
  });

  const exportarExcel = async () => {
    if (filtradas.length === 0) return;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Renovaciones");
    ws.columns = [
      { header: "No. Póliza", key: "poliza", width: 18 },
      { header: "Oficina", key: "oficina", width: 20 },
      { header: "Cliente", key: "cliente", width: 26 },
      { header: "Tel. Cliente", key: "telCliente", width: 14 },
      { header: "Correo Cliente", key: "correoCliente", width: 26 },
      { header: "Vendedor", key: "vendedor", width: 24 },
      { header: "Tel. Vendedor", key: "telVendedor", width: 14 },
      { header: "Correo Vendedor", key: "correoVendedor", width: 26 },
      { header: "Fecha Vencimiento", key: "vence", width: 15 },
      { header: "Estatus", key: "estatus", width: 13 },
      { header: "Renovación", key: "renovacion", width: 14 },
      { header: "Adeudo", key: "adeudo", width: 9 },
    ];
    ws.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF13193A" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    filtradas.forEach((p) => ws.addRow(filaExport(p)));

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `renovaciones-${selAnio}-${String(selMes).padStart(2, "0")}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportarPDF = async () => {
    if (filtradas.length === 0) return;
    setExportando(true);
    try {
      const blob = await pdf(
        <RenovacionesPDF
          datos={{
            mesLabel: `${MESES[selMes - 1]} ${selAnio}`,
            registros: filtradas.map(filaExport),
          }}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `renovaciones-${selAnio}-${String(selMes).padStart(2, "0")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportando(false);
    }
  };

  const selCls =
    "text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 max-w-[160px]";

  return (
    <div className="h-full flex flex-col p-6 bg-gray-50 gap-5">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#13193a] flex items-center justify-center shrink-0">
          <RefreshCw className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Renovaciones</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Pólizas por renovar en {MESES[selMes - 1]} {selAnio}
          </p>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          {
            label: "Total del mes", value: polizas.length, Icon: Calendar,
            num: "text-[#13193a]", ico: "text-[#13193a]/60",
            onClick: () => { setFiltroRenovacion("Todos"); setFiltroAdeudo("Todos"); setFiltroEstatus("Todos"); },
          },
          {
            label: "Pendientes por renovar", value: nPendientes, Icon: RefreshCw,
            num: "text-amber-500", ico: "text-amber-400",
            onClick: () => { setFiltroRenovacion("PENDIENTE"); setFiltroAdeudo("Todos"); },
          },
          {
            label: "Ya renovadas", value: nRenovadas, Icon: CheckCircle2,
            num: "text-emerald-600", ico: "text-emerald-500",
            onClick: () => { setFiltroRenovacion("RENOVADA"); setFiltroAdeudo("Todos"); },
          },
          {
            label: "Con adeudo", value: nAdeudo, Icon: CreditCard,
            num: "text-blue-600", ico: "text-blue-500",
            onClick: () => setFiltroAdeudo("CON_ADEUDO"),
          },
          {
            label: "Vencidas sin renovar", value: nVencidasSinRenovar, Icon: AlertTriangle,
            num: "text-red-500", ico: "text-red-400",
            onClick: () => { setFiltroEstatus("VENCIDA"); setFiltroRenovacion("PENDIENTE"); },
          },
        ].map((m) => (
          <button
            key={m.label}
            onClick={m.onClick}
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

      <div className="flex-1 min-h-0 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Filtros */}
        <div className="flex flex-wrap items-end justify-between gap-3 px-5 py-3 border-b border-gray-100">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">Buscar</span>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Póliza, cliente, vendedor..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] w-56 bg-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">Oficina</span>
              <select value={filtroOficina} onChange={(e) => setFiltroOficina(e.target.value)} className={selCls}>
                <option value="Todas">Todas las oficinas</option>
                {listaOficinas.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">Estado</span>
              <select value={filtroEstatus} onChange={(e) => setFiltroEstatus(e.target.value)} className={selCls}>
                {["Todos", "VIGENTE", "POR VENCER", "VENCIDA"].map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">Renovación</span>
              <select value={filtroRenovacion} onChange={(e) => setFiltroRenovacion(e.target.value)} className={selCls}>
                <option value="Todos">Todos</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="RENOVADA">Renovadas</option>
              </select>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">Adeudo</span>
              <select value={filtroAdeudo} onChange={(e) => setFiltroAdeudo(e.target.value)} className={selCls}>
                <option value="Todos">Todos</option>
                <option value="CON_ADEUDO">Con adeudo</option>
                <option value="SIN_ADEUDO">Sin adeudo</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">Mes</span>
              <select value={selMes} onChange={(e) => setSelMes(Number(e.target.value))} className={selCls}>
                {MESES.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">Año</span>
              <select value={selAnio} onChange={(e) => setSelAnio(Number(e.target.value))} className={selCls}>
                {anios.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button
              onClick={() => { setSelMes(hoy.getMonth() + 1); setSelAnio(hoy.getFullYear()); }}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-all"
            >
              Mes actual
            </button>

            {filtradas.length > 0 && (
              <>
                <button
                  onClick={exportarExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-green-600 text-green-700 text-xs font-medium hover:bg-green-50 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Excel
                </button>
                <button
                  onClick={exportarPDF}
                  disabled={exportando}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-600 text-red-700 text-xs font-medium hover:bg-red-50 transition-all disabled:opacity-50"
                >
                  {exportando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                  PDF
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabla */}
        <div className="flex-1 min-h-0 overflow-auto">
          {cargando ? (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
              <Loader2 className="animate-spin w-5 h-5" />
              <span className="text-sm">Cargando renovaciones…</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["No. Póliza", "Cliente", "Oficina", "Vendedor", "Vence", "Estado", "Renovación", "Adeudo"].map((h) => (
                    <th key={h} className="sticky top-0 z-10 bg-gray-50 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-3 py-2 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtradas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-sm text-gray-400">
                      No hay renovaciones pendientes en este periodo.
                    </td>
                  </tr>
                ) : (
                  paginadas.map((p) => {
                    const info = diasInfo(p.fecha_fin);
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-3 py-1.5 font-mono text-xs font-bold text-[#13193a] whitespace-nowrap">
                          {p.constancia || p.numero_poliza}
                        </td>
                        <td className="px-3 py-1.5 text-xs max-w-[12rem]">
                          <div className="font-semibold text-gray-700 truncate">
                            {p.clientes?.nombre} {p.clientes?.apellido}
                          </div>
                          <div className="text-gray-400 text-[11px] font-mono truncate">{p.clientes?.telefono || "—"}</div>
                          <div className="text-gray-400 text-[11px] truncate">{p.clientes?.email || "—"}</div>
                        </td>
                        <td className="px-3 py-1.5 text-xs text-gray-500 max-w-[8rem] truncate">
                          {p.oficinas?.nombre || "—"}
                        </td>
                        <td className="px-3 py-1.5 text-xs max-w-[10rem]">
                          <div className="text-gray-700 truncate">{p.vendedores?.nombre} {p.vendedores?.apellido}</div>
                          <div className="text-gray-400 text-[11px] font-mono truncate">{p.vendedores?.telefono || "—"}</div>
                          <div className="text-gray-400 text-[11px] truncate">{p.vendedores?.email || "—"}</div>
                        </td>
                        <td className="px-3 py-1.5 text-xs whitespace-nowrap">
                          <div className="text-gray-600">{fmtFecha(p.fecha_fin)}</div>
                          <div className={info.cls}>{info.txt}</div>
                        </td>
                        <td className="px-3 py-1.5">
                          <StatusBadge estatus={p.estatus} />
                        </td>
                        <td className="px-3 py-1.5">
                          <RenovacionBadge estado={p.renovacionEstado} />
                        </td>
                        <td className="px-3 py-1.5">
                          <AdeudoBadge tieneAdeudo={p.tieneAdeudo} />
                        </td>
                      </tr>
                    );
                  })
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
