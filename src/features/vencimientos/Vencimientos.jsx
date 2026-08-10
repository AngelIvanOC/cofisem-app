import { useState, useEffect, useCallback, useMemo } from "react";
import ExcelJS from "exceljs";
import { supabase } from "../../supabaseClient";
import { calcularEstatus } from "../../services/polizas";
import StatusBadge from "../operador/components/StatusBadge";
import { usePagination } from "../../hooks/usePagination";
import Paginator from "../../components/Paginator";
import { Calendar, Loader2, Search, Download, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

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

export default function Vencimientos({ usuario, soloOficina = false }) {
  const hoy = new Date();
  const oficinaId = usuario?.oficinas?.id ?? null;
  const oficinaNombre = usuario?.oficinas?.nombre ?? null;

  const [selMes, setSelMes] = useState(hoy.getMonth() + 1);
  const [selAnio, setSelAnio] = useState(hoy.getFullYear());
  const [cargando, setCargando] = useState(true);
  const [polizas, setPolizas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaFiltro, setBusquedaFiltro] = useState("");
  const [filtroOficina, setFiltroOficina] = useState("Todas");
  const [filtroEstatus, setFiltroEstatus] = useState("Todos");

  const anios = Array.from({ length: 5 }, (_, i) => hoy.getFullYear() - 2 + i);

  const cargar = useCallback(async () => {
    setCargando(true);
    const ultimo = ultimoDiaMes(selAnio, selMes);
    const inicio = `${selAnio}-${String(selMes).padStart(2, "0")}-01`;
    const fin = `${selAnio}-${String(selMes).padStart(2, "0")}-${String(ultimo).padStart(2, "0")}`;

    let q = supabase
      .from("polizas")
      .select(`
        id, numero_poliza, constancia, estatus, fecha_fin, oficina_id,
        oficinas(nombre),
        vendedores(nombre, apellido),
        clientes(nombre, apellido, telefono)
      `)
      .gte("fecha_fin", inicio)
      .lte("fecha_fin", fin)
      .in("estatus", ["VIGENTE", "POR VENCER", "VENCIDA"])
      .order("fecha_fin", { ascending: true });

    if (soloOficina && oficinaId) q = q.eq("oficina_id", oficinaId);

    const { data, error } = await q;
    if (error) console.error("Error cargando vencimientos:", error.message);
    setPolizas(
      (data ?? []).map((p) => ({ ...p, estatus: calcularEstatus(p.estatus, p.fecha_fin) })),
    );
    setCargando(false);
  }, [selMes, selAnio, soloOficina, oficinaId]);

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
      const txt = `${p.constancia || p.numero_poliza} ${p.clientes?.nombre || ""} ${p.clientes?.apellido || ""} ${p.clientes?.telefono || ""}`.toLowerCase();
      const mb = txt.includes(b);
      const mo = filtroOficina === "Todas" || p.oficinas?.nombre === filtroOficina;
      const me = filtroEstatus === "Todos" || p.estatus === filtroEstatus;
      return mb && mo && me;
    });
  }, [polizas, busquedaFiltro, filtroOficina, filtroEstatus]);

  const { paginated: paginadas, page, setPage, totalPages, total } = usePagination(filtradas);

  const nEstaSemana = polizas.filter((p) => { const d = diasInfo(p.fecha_fin).dias; return d >= 0 && d <= 7; }).length;
  const nVencidas = polizas.filter((p) => diasInfo(p.fecha_fin).dias < 0).length;
  const nProximas = polizas.filter((p) => diasInfo(p.fecha_fin).dias > 7).length;

  const exportarExcel = async () => {
    if (filtradas.length === 0) return;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Vencimientos");
    ws.columns = [
      { header: "No. Póliza", key: "poliza", width: 16 },
      { header: "Cliente", key: "cliente", width: 30 },
      { header: "Teléfono", key: "telefono", width: 16 },
      { header: "Oficina", key: "oficina", width: 22 },
      { header: "Vendedor", key: "vendedor", width: 24 },
      { header: "Vence", key: "vence", width: 14 },
      { header: "Estado", key: "estado", width: 14 },
    ];
    ws.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF13193A" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    filtradas.forEach((p) => {
      ws.addRow({
        poliza: p.constancia || p.numero_poliza || "—",
        cliente: [p.clientes?.nombre, p.clientes?.apellido].filter(Boolean).join(" ") || "—",
        telefono: p.clientes?.telefono || "—",
        oficina: p.oficinas?.nombre || "—",
        vendedor: [p.vendedores?.nombre, p.vendedores?.apellido].filter(Boolean).join(" ") || "—",
        vence: fmtFecha(p.fecha_fin),
        estado: p.estatus,
      });
    });

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vencimientos-${selAnio}-${String(selMes).padStart(2, "0")}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selCls =
    "text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 max-w-[160px]";

  return (
    <div className="h-full flex flex-col p-6 bg-gray-50 gap-5">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#13193a] flex items-center justify-center shrink-0">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Vencimientos</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Pólizas que vencen en {MESES[selMes - 1]} {selAnio}
            {soloOficina && oficinaNombre ? ` — ${oficinaNombre}` : ""}
          </p>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total del mes", value: polizas.length, Icon: Calendar, num: "text-[#13193a]", ico: "text-[#13193a]/60", est: "Todos" },
          { label: "Vencen esta semana", value: nEstaSemana, Icon: Clock, num: "text-amber-500", ico: "text-amber-400", est: "Todos" },
          { label: "Próximas", value: nProximas, Icon: CheckCircle2, num: "text-emerald-600", ico: "text-emerald-500", est: "Todos" },
          { label: "Ya vencidas", value: nVencidas, Icon: AlertTriangle, num: "text-red-500", ico: "text-red-400", est: "VENCIDA" },
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

      <div className="flex-1 min-h-0 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Periodo (izquierda) + Filtros de búsqueda (derecha) */}
        <div className="flex flex-wrap items-end justify-between gap-3 px-5 py-3 border-b border-gray-100">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">Buscar</span>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Póliza, cliente, teléfono..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] w-56 bg-white"
                />
              </div>
            </div>

            {!soloOficina && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">Oficina</span>
                <select value={filtroOficina} onChange={(e) => setFiltroOficina(e.target.value)} className={selCls}>
                  <option value="Todas">Todas las oficinas</option>
                  {listaOficinas.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">Estado</span>
              <select value={filtroEstatus} onChange={(e) => setFiltroEstatus(e.target.value)} className={selCls}>
                {["Todos", "VIGENTE", "POR VENCER", "VENCIDA"].map((o) => <option key={o} value={o}>{o}</option>)}
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

            {!soloOficina && filtradas.length > 0 && (
              <button
                onClick={exportarExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-green-600 text-green-700 text-xs font-medium hover:bg-green-50 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Excel
              </button>
            )}
          </div>
        </div>

        {/* Tabla */}
        <div className="flex-1 min-h-0 overflow-auto">
          {cargando ? (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
              <Loader2 className="animate-spin w-5 h-5" />
              <span className="text-sm">Cargando vencimientos…</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["No. Póliza", "Cliente", "Teléfono", "Oficina", "Vendedor", "Vence", "Estado"].map((h) => (
                    <th key={h} className="sticky top-0 z-10 bg-gray-50 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-3 py-2 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-sm text-gray-400">
                      No hay pólizas que venzan en este periodo.
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
                        <td className="px-3 py-1.5 text-xs font-semibold text-gray-700 max-w-[10rem] truncate">
                          {p.clientes?.nombre} {p.clientes?.apellido}
                        </td>
                        <td className="px-3 py-1.5 font-mono text-xs text-gray-600 whitespace-nowrap">
                          {p.clientes?.telefono || "—"}
                        </td>
                        <td className="px-3 py-1.5 text-xs text-gray-500 max-w-[8rem] truncate">
                          {p.oficinas?.nombre || "—"}
                        </td>
                        <td className="px-3 py-1.5 text-xs text-gray-500 max-w-[8rem] truncate">
                          {p.vendedores?.nombre} {p.vendedores?.apellido}
                        </td>
                        <td className="px-3 py-1.5 text-xs whitespace-nowrap">
                          <div className="text-gray-600">{fmtFecha(p.fecha_fin)}</div>
                          <div className={info.cls}>{info.txt}</div>
                        </td>
                        <td className="px-3 py-1.5">
                          <StatusBadge estatus={p.estatus} />
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
