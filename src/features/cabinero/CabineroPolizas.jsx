import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../supabaseClient";
import { fetchPolizaById, calcularEstatus } from "../../services/polizas";
import { fetchConfigCostos } from "../../services/configuracion";
import StatusBadge from "../operador/components/StatusBadge";
import { usePagination } from "../../hooks/usePagination";
import Paginator from "../../components/Paginator";
import { ChevronLeft, Loader2, Search } from "lucide-react";

function fmtFecha(str) {
  if (!str) return "—";
  return new Date(str + "T12:00:00").toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ── Detalle de póliza ─────────────────────────────────────────
const fmtMXNAdmin = (n) =>
  `$${Number(n || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function CuotaEstatusAdmin({ estatus }) {
  const e = (estatus ?? "").toUpperCase();
  if (e === "PAGADO" || e === "PAGADA")
    return (
      <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
        Pagado
      </span>
    );
  if (e === "VENCIDO" || e === "VENCIDA")
    return (
      <span className="text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
        Vencido
      </span>
    );
  return (
    <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
      Pendiente
    </span>
  );
}

function DetallePolizaAdmin({ poliza, pagos, config, onVolver }) {
  const cliente = poliza.clientes ?? {};
  const vendedor = poliza.vendedores ?? {};
  const concesionario = poliza.concesionarios ?? null;
  const oficina = poliza.oficinas ?? {};

  const clienteLabel =
    [cliente.nombre, cliente.apellido].filter(Boolean).join(" ") || "—";
  const vendedorLabel =
    [vendedor.nombre, vendedor.apellido].filter(Boolean).join(" ") || "—";
  const concLabel = concesionario
    ? [concesionario.nombre, concesionario.apellido1, concesionario.apellido2]
        .filter(Boolean)
        .join(" ")
    : "—";

  const emision = poliza.created_at
    ? new Date(poliza.created_at).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

  const primaNeta = poliza.coberturas?.prima_neta ?? 0;
  const derechos = config?.derechos_emision ?? 400;
  const ivaPct = config?.iva_pct ?? 16;
  const subtotal = +(primaNeta + derechos).toFixed(2);
  const iva = +((primaNeta + derechos) * (ivaPct / 100)).toFixed(2);
  const total = +(primaNeta + derechos + iva).toFixed(2);

  const cuotas = [...(pagos ?? [])]
    .sort(
      (a, b) => new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento),
    )
    .map((q, i) => ({
      num: i + 1,
      vto: fmtFecha(q.fecha_vencimiento),
      monto: fmtMXNAdmin(q.monto),
      estatus: q.estatus ?? "PENDIENTE",
    }));

  const vAmis = poliza.vehiculos_amis ?? {};

  const caracteristicas = [
    { l: "No. póliza", v: poliza.constancia || poliza.numero_poliza || "—" },
    { l: "Vendedor", v: vendedorLabel },
    { l: "Asegurado", v: clienteLabel },
    { l: "Concesionario", v: concLabel },
    { l: "Cobertura", v: poliza.coberturas?.nombre || "—" },
    { l: "Modalidad de pago", v: poliza.forma_pago || "—" },
    { l: "Inicio de vigencia", v: fmtFecha(poliza.fecha_inicio) },
    { l: "Fin de vigencia", v: fmtFecha(poliza.fecha_fin) },
    { l: "Oficina", v: oficina.nombre || "—" },
  ];

  const datosVehiculo = [
    { l: "Marca", v: vAmis.marca || "—" },
    { l: "Modelo", v: vAmis.tipo || "—" },
    { l: "Versión", v: vAmis.dc || "—" },
    { l: "Año", v: poliza.anio?.toString() || "—" },
    { l: "No. Serie", v: poliza.num_serie || "—" },
    { l: "No. Motor", v: poliza.num_motor || "—" },
    { l: "Placas", v: poliza.placas || "—" },
    { l: "Capacidad", v: poliza.capacidad || "4 OCUPANTES" },
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
            <p className="text-white font-mono font-bold">
              {poliza.constancia || poliza.numero_poliza}
            </p>
          </div>
          <div>
            <p className="text-white/40 mb-0.5">Fecha emisión</p>
            <p className="text-white font-semibold">{emision}</p>
          </div>
          <div>
            <p className="text-white/40 mb-0.5">Hora</p>
            <p className="text-white font-semibold">
              {poliza.emision_hora || "—"}
            </p>
          </div>
          <div>
            <p className="text-white/40 mb-0.5">Punto de venta</p>
            <p className="text-white font-semibold truncate">
              {oficina.nombre || "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
        {/* Características */}
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Características de la póliza
            </p>
            <StatusBadge estatus={poliza.estatus} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
            {caracteristicas.map(({ l, v }) => (
              <div key={l}>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">
                  {l}
                </p>
                <p className="font-semibold text-[#13193a] text-xs leading-snug">
                  {v}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm font-bold text-gray-500">Prima total</p>
            <p className="text-3xl font-black text-[#13193a] tabular-nums">
              {fmtMXNAdmin(total)}
            </p>
          </div>
        </div>

        {/* Cuotas de pago */}
        {cuotas.length > 0 && (
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Cuotas de Pago
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {cuotas.map((c) => (
                <div
                  key={c.num}
                  className="bg-white rounded-xl border border-gray-100 p-2.5 text-center"
                >
                  <p className="text-[10px] text-gray-400 mb-1">
                    Cuota {c.num}
                  </p>
                  <p className="text-sm font-bold text-[#13193a]">{c.monto}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 mb-1.5">
                    {c.vto}
                  </p>
                  <CuotaEstatusAdmin estatus={c.estatus} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Datos del vehículo */}
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
            Datos del vehículo
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
            {datosVehiculo.map(({ l, v }) => (
              <div key={l}>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">
                  {l}
                </p>
                <p className="font-semibold text-[#13193a] text-xs">{v}</p>
              </div>
            ))}
          </div>
          {(poliza.conductor_habitual ||
            poliza.conductor_sexo ||
            poliza.conductor_edad) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-2">
                Conductor habitual
              </p>
              <div className="grid grid-cols-3 gap-x-6 gap-y-2">
                {[
                  { l: "Nombre", v: poliza.conductor_habitual || "—" },
                  { l: "Sexo", v: poliza.conductor_sexo || "—" },
                  {
                    l: "Edad",
                    v: poliza.conductor_edad
                      ? `${poliza.conductor_edad} años`
                      : "—",
                  },
                ].map(({ l, v }) => (
                  <div key={l}>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">
                      {l}
                    </p>
                    <p className="font-semibold text-[#13193a] text-xs">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Desglose de prima */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Desglose de prima total
            </p>
          </div>
          <div className="p-5 space-y-5">
            <div className="divide-y divide-gray-100 text-sm border border-gray-100 rounded-xl overflow-hidden">
              {[
                { l: "Prima neta", v: primaNeta, bold: false },
                { l: "Derechos / Expedición", v: derechos, bold: false },
                { l: "Subtotal", v: subtotal, bold: true },
                { l: "I.V.A. (16%)", v: iva, bold: false },
              ].map(({ l, v, bold }) => (
                <div
                  key={l}
                  className={`flex justify-between items-center px-4 py-3 ${
                    bold ? "bg-gray-50 font-bold" : "bg-white"
                  }`}
                >
                  <span className={bold ? "text-[#13193a]" : "text-gray-500"}>
                    {l}
                  </span>
                  <span
                    className={`tabular-nums ${
                      bold ? "text-[#13193a]" : "text-gray-700"
                    }`}
                  >
                    {fmtMXNAdmin(v)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between bg-[#13193a] rounded-xl px-5 py-4">
              <p className="text-white font-bold">Prima total</p>
              <p className="text-white font-black text-2xl tabular-nums">
                {fmtMXNAdmin(total)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function CabineroPolizas() {
  const [polizas, setPolizas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaFiltro, setBusquedaFiltro] = useState("");
  const [filtroOficina, setFiltroOficina] = useState("Todas");
  const [filtroVendedor, setFiltroVendedor] = useState("Todos");
  const [filtroEstatus, setFiltroEstatus] = useState("Todos");
  const [filtroFormaPago, setFiltroFormaPago] = useState("Todas");
  const [filtroCobertura, setFiltroCobertura] = useState("Todas");
  const [tab, setTab] = useState("polizas");
  const [detalleData, setDetalleData] = useState(null);
  const [loadingDetalleId, setLoadingDetalleId] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from("polizas")
      .select(
        `
        id, numero_poliza, constancia, estatus, forma_pago,
        fecha_inicio, fecha_fin, placas, aseguradora, created_at,
        cliente_id, cobertura_id, oficina_id, creado_por,
        num_serie, estado_serie, anio,
        clientes(nombre, apellido),
        vendedores(nombre, apellido),
        oficinas(id, nombre),
        coberturas(nombre, prima_neta, prima_total),
        vehiculos_amis (
          id,
          marca,
          tipo,
          dc,
          dl
        )
      `,
      )
      .in("estatus", [
        "VIGENTE",
        "POR VENCER",
        "VENCIDA",
        "CANCELADA",
        "ANULADA",
      ])
      .order("fecha_inicio", { ascending: false });
    if (error) console.error("Error cargando pólizas admin:", error.message);
    setPolizas(
      (data ?? []).map((p) => ({
        ...p,
        estatus: calcularEstatus(p.estatus, p.fecha_fin),
      })),
    );
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    const t = setTimeout(() => setBusquedaFiltro(busqueda), 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  // Listas únicas para los filtros
  const listaOficinas = useMemo(
    () =>
      [
        ...new Set(polizas.map((p) => p.oficinas?.nombre).filter(Boolean)),
      ].sort(),
    [polizas],
  );
  const listaVendedores = useMemo(
    () =>
      [
        ...new Set(
          polizas
            .map((p) =>
              `${p.vendedores?.nombre || ""} ${p.vendedores?.apellido || ""}`.trim(),
            )
            .filter(Boolean),
        ),
      ].sort(),
    [polizas],
  );
  const listaCoberturas = useMemo(
    () =>
      [
        ...new Set(polizas.map((p) => p.coberturas?.nombre).filter(Boolean)),
      ].sort(),
    [polizas],
  );
  const listaEstatus = [
    "Todos",
    "VIGENTE",
    "POR VENCER",
    "VENCIDA",
    "CANCELADA",
    "ANULADA",
  ];

  const filtradas = useMemo(() => {
    const b = busquedaFiltro.toLowerCase();
    return polizas.filter((p) => {
      const txt =
        `${p.constancia || p.numero_poliza} ${p.clientes?.nombre || ""} ${p.clientes?.apellido || ""} ${p.placas || ""} ${p.vehiculos_amis?.marca || ""} ${p.vehiculos_amis?.tipo || ""} ${p.anio || ""}`.toLowerCase();
      const mb = txt.includes(b);
      const mo =
        filtroOficina === "Todas" || p.oficinas?.nombre === filtroOficina;
      const mv =
        filtroVendedor === "Todos" ||
        `${p.vendedores?.nombre || ""} ${p.vendedores?.apellido || ""}`.trim() ===
          filtroVendedor;
      const me = filtroEstatus === "Todos" || p.estatus === filtroEstatus;
      const mfp =
        filtroFormaPago === "Todas" || p.forma_pago === filtroFormaPago;
      const mc =
        filtroCobertura === "Todas" || p.coberturas?.nombre === filtroCobertura;
      return mb && mo && mv && me && mfp && mc;
    });
  }, [
    polizas,
    busquedaFiltro,
    filtroOficina,
    filtroVendedor,
    filtroEstatus,
    filtroFormaPago,
    filtroCobertura,
  ]);

  const {
    paginated: paginadas,
    page,
    setPage,
    totalPages,
    total,
  } = usePagination(filtradas);

  const abrirDetalle = async (p) => {
    setLoadingDetalleId(p.id);
    try {
      const [full, config, pagosRes] = await Promise.all([
        fetchPolizaById(p.id),
        fetchConfigCostos(p.fecha_inicio),
        supabase
          .from("pagos")
          .select("id, monto, fecha_vencimiento, estatus")
          .eq("poliza_id", p.id)
          .order("fecha_vencimiento", { ascending: true }),
      ]);
      setDetalleData({ poliza: full, pagos: pagosRes.data ?? [], config });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetalleId(null);
    }
  };

  if (detalleData) {
    return (
      <div className="p-6 min-h-full bg-gray-50">
        <DetallePolizaAdmin
          poliza={detalleData.poliza}
          pagos={detalleData.pagos}
          config={detalleData.config}
          onVolver={() => setDetalleData(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#13193a]">Pólizas</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Consulta de pólizas — todas las oficinas (solo lectura)
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center border-b border-gray-100 px-2">
          <button
            onClick={() => setTab("polizas")}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${tab === "polizas" ? "border-[#13193a] text-[#13193a]" : "border-transparent text-gray-400 hover:text-gray-600"}`}
          >
            Pólizas
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-end gap-2 px-5 py-3 border-b border-gray-100">
          {/* Búsqueda */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">
              Buscar
            </span>
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
            {
              label: "Oficina",
              value: filtroOficina,
              set: setFiltroOficina,
              opts: [
                ["Todas", "Todas las oficinas"],
                ...listaOficinas.map((o) => [o, o]),
              ],
            },
            {
              label: "Vendedor",
              value: filtroVendedor,
              set: setFiltroVendedor,
              opts: [
                ["Todos", "Todos los vendedores"],
                ...listaVendedores.map((v) => [v, v]),
              ],
            },
            {
              label: "Estatus",
              value: filtroEstatus,
              set: setFiltroEstatus,
              opts: listaEstatus.map((o) => [o, o]),
            },
            {
              label: "Forma de pago",
              value: filtroFormaPago,
              set: setFiltroFormaPago,
              opts: [
                ["Todas", "Todas"],
                ["CONTADO", "Contado"],
                ["PARCIALES", "Parciales"],
              ],
            },
            {
              label: "Cobertura",
              value: filtroCobertura,
              set: setFiltroCobertura,
              opts: [["Todas", "Todas"], ...listaCoberturas.map((c) => [c, c])],
            },
          ].map(({ label, value, set, opts }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">
                {label}
              </span>
              <select
                value={value}
                onChange={(e) => set(e.target.value)}
                className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 max-w-[160px]"
              >
                {opts.map(([v, lbl]) => (
                  <option key={v} value={v}>
                    {lbl}
                  </option>
                ))}
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
                  {[
                    "Constancia",
                    "Asegurado",
                    "Marca",
                    "Modelo",
                    "Año",
                    "Placas",
                    "No. Serie",
                    "Cobertura",
                    "Vence",
                    "Estatus",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-2 py-1 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtradas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="text-center py-12 text-sm text-gray-400"
                    >
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
                      <td className="px-2 py-1 font-mono text-xs font-bold text-[#13193a] whitespace-nowrap">
                        {p.constancia || p.numero_poliza}
                      </td>
                      <td className="px-2 py-1 text-xs font-semibold text-gray-700 max-w-[9rem] truncate">
                        {p.clientes?.nombre} {p.clientes?.apellido}
                      </td>
                      <td className="px-2 py-1 text-xs text-gray-500 max-w-[8rem] truncate">
                        {p.vehiculos_amis?.marca || "—"}
                      </td>
                      <td className="px-2 py-1 text-xs text-gray-500 max-w-[9rem] truncate">
                        {p.vehiculos_amis?.tipo || "—"}
                      </td>
                      <td className="px-2 py-1 text-xs text-gray-500 whitespace-nowrap">
                        {p.anio || "—"}
                      </td>
                      <td className="px-2 py-1 font-mono text-xs text-gray-600 whitespace-nowrap">
                        {p.placas || "—"}
                      </td>
                      <td className="px-2 py-1 font-mono text-xs text-gray-600 max-w-[9rem] truncate">
                        {p.num_serie || "—"}
                      </td>
                      <td className="px-2 py-1 text-xs text-gray-500 max-w-[9rem] truncate">
                        {p.coberturas?.nombre}
                      </td>
                      <td className="px-2 py-1 text-xs text-gray-500 whitespace-nowrap">
                        {fmtFecha(p.fecha_fin)}
                      </td>
                      <td className="px-2 py-1">
                        <StatusBadge estatus={p.estatus} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        <Paginator
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={10}
          onPage={setPage}
        />
      </div>

    </div>
  );
}
