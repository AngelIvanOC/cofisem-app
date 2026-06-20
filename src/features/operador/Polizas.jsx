import { useState, useEffect, useMemo } from "react";
import { PDFViewer } from "@react-pdf/renderer";
import {
  fetchPolizas,
  fetchPolizaById,
  buildPolizaPDF,
  fetchCotizacionesGuardadas,
  eliminarCotizacion,
  fetchPolizasSubsecuentes,
  renovarPoliza,
} from "../../services/polizas";
import { fetchConfigCostos } from "../../services/configuracion";
import Swal from "sweetalert2";
import { generateQR } from "../../utils/generateQR";
import { fmt$ } from "./utils/fmt";
import Tab from "./components/Tab";
import StatusBadge from "./components/StatusBadge";
import TramiteExitoso from "./components/TramiteExitoso";
import FormCotizacion from "./components/FormCotizacion";
import ResumenPoliza from "./components/ResumenPoliza";
import PolizaPDF from "../../components/pdf/PolizaPDF";
import ModalEndoso from "./components/ModalEndoso";
import { usePagination } from "../../hooks/usePagination";
import Paginator from "../../components/Paginator";
import {
  CheckCircle2,
  Eye,
  Loader2,
  Pencil,
  ClipboardList,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

export default function Polizas({ usuario }) {
  const [tab, setTab] = useState("polizas");
  const [polizas, setPolizas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaFiltro, setBusquedaFiltro] = useState("");
  const [filtroEst, setFiltroEst] = useState("Todos");
  const [filtroFormaPago, setFiltroFormaPago] = useState("Todas");
  const [filtroCobertura, setFiltroCobertura] = useState("Todas");
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loadingCot, setLoadingCot] = useState(false);
  const [subsecuentes, setSubsecuentes] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [tramiteOk, setTramiteOk] = useState(null);
  const [cotActiva, setCotActiva] = useState(null);
  const [polizaViewer, setPolizaViewer] = useState(null);
  const [loadingViewerId, setLoadingViewerId] = useState(null);
  const [resumenData, setResumenData] = useState(null);
  const [endosoPoliza, setEndosoPoliza] = useState(null);
  const [renovandoId, setRenovandoId] = useState(null);

  const cargar = async () => {
    try {
      setLoading(true);
      setPolizas(await fetchPolizas());
      setError(null);
    } catch (e) {
      setError("Error cargando pólizas: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarSubsecuentes = async () => {
    if (!usuario?.id) return;
    setLoadingSubs(true);
    try {
      setSubsecuentes(await fetchPolizasSubsecuentes(usuario.id));
    } catch (e) {
      console.error("Error cargando subsecuentes:", e.message);
    } finally {
      setLoadingSubs(false);
    }
  };

  const cargarCotizaciones = async () => {
    if (!usuario?.id) return;
    setLoadingCot(true);
    try {
      setCotizaciones(await fetchCotizacionesGuardadas(usuario.id));
    } catch (e) {
      console.error("Error cargando cotizaciones:", e.message);
    } finally {
      setLoadingCot(false);
    }
  };

  const renovar = async (p) => {
    const constanciaLabel = p.constancia || p.numero_poliza;
    const match = constanciaLabel.match(/^(.+)-(\d+)$/);
    const siguienteSufijo = match
      ? String(parseInt(match[2], 10) + 1).padStart(2, '0')
      : '??';
    const nuevaConstancia = match ? `${match[1]}-${siguienteSufijo}` : '?';

    const result = await Swal.fire({
      title: "Renovar póliza",
      html: `¿Deseas iniciar la renovación de <b>${constanciaLabel}</b>?<br/><br/>
             Se creará <b>${nuevaConstancia}</b>. Podrás revisar y ajustar<br/>
             los datos antes de confirmar. La póliza anterior se cancelará<br/>
             al momento de emitir la renovación.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#13193a",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Continuar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;

    setRenovandoId(p.id);
    try {
      const { id: nuevaId, constancia } = await renovarPoliza(p.id, usuario?.id);
      const full = await fetchPolizaById(nuevaId);
      let esGestor = false;
      try { esGestor = JSON.parse(full.notas ?? '{}').esGestor ?? false; } catch {}
      setCotActiva({
        polizaId:      full.id,
        id:            constancia,
        pasoInicial:   5,
        esRenovacion:  true,
        esSubsecuente: true,
        coberturaId:   full.cobertura_id,
        coberturaData: full.coberturas ?? null,
        clienteId:     full.cliente_id,
        vendedorId:    full.vendedor_id ?? 1,
        concesionario: full.concesionario_id ?? null,
        vehiculoAmisId: full.vehiculo_amis_id,
        codAMIS:        String(full.vehiculos_amis?.cve ?? ''),
        marca:          full.vehiculos_amis?.marca ?? '',
        tipoVehiculo:   full.vehiculos_amis?.tipo  ?? '',
        version:        full.vehiculos_amis?.dc    ?? '',
        descripcion:    full.vehiculos_amis?.dl    ?? '',
        modelo:         String(full.anio ?? new Date().getFullYear()),
        serie:          full.num_serie    ?? '',
        motor:          full.num_motor    ?? '',
        placas:         full.placas       ?? '',
        conductorHabitual: full.conductor_habitual ?? '',
        conductorSexo:     full.conductor_sexo     ?? '',
        conductorEdad:     full.conductor_edad     ?? '',
        fechaInicio:    full.fecha_inicio ?? '',
        formaPago:      full.forma_pago   ?? 'CONTADO',
        esGestor,
      });
      setTab("nueva");
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Error al iniciar renovación",
        text: e.message,
        confirmButtonColor: "#13193a",
      });
    } finally {
      setRenovandoId(null);
    }
  };

  useEffect(() => {
    cargar();
    cargarCotizaciones();
    cargarSubsecuentes();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setBusquedaFiltro(busqueda), 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  const ESTATUS_OPTS = [
    "Todos",
    "VIGENTE",
    "POR VENCER",
    "VENCIDA",
    "CANCELADA",
    "ANULADA",
  ];

  const listaCoberturas = useMemo(
    () =>
      [
        "Todas",
        ...new Set(polizas.map((p) => p.coberturas?.nombre).filter(Boolean)),
      ].sort((a, b) => (a === "Todas" ? -1 : a.localeCompare(b))),
    [polizas],
  );

  const polizasFiltradas = useMemo(() => {
    const b = busquedaFiltro.toLowerCase();
    return polizas.filter((p) => {
      const asegurado =
        `${p.clientes?.nombre || ""} ${p.clientes?.apellido || ""}`.toLowerCase();
      const constancia = (p.constancia || "").toLowerCase();
      const numPoliza = (p.numero_poliza || "").toLowerCase();
      const matchBusq = asegurado.includes(b) || constancia.includes(b) || numPoliza.includes(b);
      const matchEst = filtroEst === "Todos" || p.estatus === filtroEst;
      const matchFp =
        filtroFormaPago === "Todas" || p.forma_pago === filtroFormaPago;
      const matchCob =
        filtroCobertura === "Todas" || p.coberturas?.nombre === filtroCobertura;
      return matchBusq && matchEst && matchFp && matchCob;
    });
  }, [polizas, busquedaFiltro, filtroEst, filtroFormaPago, filtroCobertura]);

  const {
    paginated: polizasPag,
    page: pageP,
    setPage: setPageP,
    totalPages: totalPagesP,
    total: totalP,
  } = usePagination(polizasFiltradas);
  const {
    paginated: cotPag,
    page: pageC,
    setPage: setPageC,
    totalPages: totalPagesC,
    total: totalC,
  } = usePagination(cotizaciones);

  const guardarCotizacion = async () => {
    await cargarCotizaciones();
    setTab("cotizaciones");
  };

  const tramitarPoliza = async (poliza) => {
    setCotActiva(null);
    setTramiteOk(poliza);
    setTab("exito");
    await Promise.all([cargar(), cargarCotizaciones(), cargarSubsecuentes()]);
  };

  const abrirCotizacionGuardada = (row) => {
    let esGestor = false;
    try {
      esGestor = JSON.parse(row.notas ?? "{}")?.esGestor ?? false;
    } catch {}
    setCotActiva({
      polizaId: row.id,
      id: `COT-${row.id}`,
      vehiculoAmisId: row.vehiculo_amis_id,
      codAMIS: String(row.vehiculos_amis?.cve ?? ""),
      marca: row.vehiculos_amis?.marca ?? "",
      tipoVehiculo: row.vehiculos_amis?.tipo ?? "",
      version: row.vehiculos_amis?.dc ?? "",
      descripcion: row.vehiculos_amis?.dl ?? rows.notas ?? "",
      modelo: String(row.anio ?? ""),
      serie: row.num_serie ?? "",
      motor: row.num_motor ?? "",
      placas: row.placas ?? "",
      conductorHabitual: row.conductor_habitual ?? "",
      conductorSexo: row.conductor_sexo ?? "",
      conductorEdad: row.conductor_edad ?? "",
      clienteId: row.cliente_id,
      vendedorId: row.vendedor_id ?? 1,
      concesionario: row.concesionario_id ?? null,
      fechaInicio: row.fecha_inicio ?? "",
      formaPago: row.forma_pago ?? "CONTADO",
      esGestor,
    });
    setTab("nueva");
  };

  const borrarCotizacion = async (id) => {
    try {
      await eliminarCotizacion(id);
      setCotizaciones((cs) => cs.filter((c) => c.id !== id));
    } catch (e) {
      console.error("Error eliminando cotización:", e.message);
    }
  };

  const abrirSubsecuente = (row) => {
    setCotActiva({
      polizaId:      row.id,
      id:            row.constancia,
      pasoInicial:   1,
      esSubsecuente: true,
      coberturaId:   row.coberturas?.id ?? null,
      coberturaData: row.coberturas ?? null,
      clienteId:    row.cliente_id,
      vendedorId:   1,
      concesionario: null,
      vehiculoAmisId: null, codAMIS: "", marca: "", tipoVehiculo: "",
      version: "", descripcion: "", modelo: String(new Date().getFullYear()),
      serie: "", motor: "", placas: "",
      conductorHabitual: "", conductorSexo: "", conductorEdad: "",
      fechaInicio: "", formaPago: "CONTADO", esGestor: false,
    });
    setTab("nueva");
  };

  const abrirResumen = async (p) => {
    setTab("resumen");
    setResumenData(null);
    try {
      const full = await fetchPolizaById(p.id);
      setResumenData(full);
    } catch (e) {
      console.error(e);
      setTab("polizas");
    }
  };

  const verPDF = async (p) => {
    setLoadingViewerId(p.id);
    try {
      const [full, config] = await Promise.all([
        fetchPolizaById(p.id),
        fetchConfigCostos(p.fecha_inicio),
      ]);
      const base = buildPolizaPDF(full, usuario?.oficinas, config);
      const qrDataUrl = await generateQR(base.codigoQR);
      setPolizaViewer({ ...base, qrDataUrl });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingViewerId(null);
    }
  };

  if (tab === "exito" && tramiteOk) {
    return (
      <div className="p-6 min-h-full bg-gray-50">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <TramiteExitoso
            poliza={tramiteOk}
            oficina={usuario?.oficinas}
            onNueva={() => {
              setTramiteOk(null);
              setCotActiva(null);
              setTab("nueva");
            }}
            onVolver={() => {
              setTramiteOk(null);
              setTab("polizas");
            }}
          />
        </div>
      </div>
    );
  }

  if (tab === "resumen") {
    return (
      <div className="p-6 min-h-full bg-gray-50">
        {resumenData ? (
          <ResumenPoliza
            poliza={resumenData}
            onVolver={() => {
              setResumenData(null);
              setTab("polizas");
            }}
          />
        ) : (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#13193a]/30" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 min-h-full bg-gray-50">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Pólizas</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {usuario?.oficinas?.nombre ?? "—"}
          </p>
        </div>
        <button
          onClick={() => {
            setCotActiva(null);
            setTab("nueva");
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#13193a] text-white text-sm font-semibold hover:bg-[#1e2a50] transition-all shadow-sm shadow-[#13193a]/15"
        >
          <Plus className="w-4 h-4" />
          Nueva cotización
        </button>
      </div>

      {tab === "nueva" && (
        <FormCotizacion
          cotizacionInicial={cotActiva}
          onGuardar={guardarCotizacion}
          onTramitar={tramitarPoliza}
          onCancelar={() => {
            setCotActiva(null);
            setTab("polizas");
          }}
          usuario={usuario}
        />
      )}

      {(tab === "polizas" || tab === "cotizaciones" || tab === "subsecuentes") && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center border-b border-gray-100 px-2 overflow-x-auto">
            <Tab active={tab === "polizas"} onClick={() => setTab("polizas")}>
              Pólizas emitidas
            </Tab>
            <Tab
              active={tab === "cotizaciones"}
              onClick={() => {
                setTab("cotizaciones");
                cargarCotizaciones();
              }}
            >
              Cotizaciones guardadas
              {cotizaciones.length > 0 && (
                <span className="ml-1.5 bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {cotizaciones.length}
                </span>
              )}
            </Tab>
            <Tab active={tab === "subsecuentes"} onClick={() => { setTab("subsecuentes"); cargarSubsecuentes(); }}>
              Pólizas subsecuentes
              {subsecuentes.length > 0 && (
                <span className="ml-1.5 bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {subsecuentes.length}
                </span>
              )}
            </Tab>
          </div>

          {tab === "polizas" && (
            <>
              {error && (
                <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {error}
                </div>
              )}
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
                      placeholder="Póliza o asegurado..."
                      className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] w-48 bg-white"
                    />
                  </div>
                </div>
                {/* Estatus */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">
                    Estatus
                  </span>
                  <select
                    value={filtroEst}
                    onChange={(e) => setFiltroEst(e.target.value)}
                    className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#13193a]/15"
                  >
                    {ESTATUS_OPTS.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>
                {/* Forma de pago */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">
                    Forma de pago
                  </span>
                  <select
                    value={filtroFormaPago}
                    onChange={(e) => setFiltroFormaPago(e.target.value)}
                    className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#13193a]/15"
                  >
                    <option value="Todas">Todas</option>
                    <option value="CONTADO">Contado</option>
                    <option value="PARCIALES">Parciales</option>
                  </select>
                </div>
                {/* Cobertura */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">
                    Cobertura
                  </span>
                  <select
                    value={filtroCobertura}
                    onChange={(e) => setFiltroCobertura(e.target.value)}
                    className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 max-w-[200px]"
                  >
                    {listaCoberturas.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      {[
                        "Constancia",
                        "Asegurado",
                        "Cobertura",
                        "Vendedor",
                        "Prima",
                        "Forma pago",
                        "Vence",
                        "Estatus",
                        "Acciones",
                      ].map((h, i) => (
                        <th
                          key={i}
                          className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-1 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="text-center py-12 text-sm text-gray-400"
                        >
                          Cargando pólizas...
                        </td>
                      </tr>
                    ) : polizasFiltradas.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="text-center py-12 text-sm text-gray-400"
                        >
                          No se encontraron pólizas.
                        </td>
                      </tr>
                    ) : (
                      polizasPag.map((p) => (
                        <tr
                          key={p.id}
                          onClick={() => abrirResumen(p)}
                          className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-1 font-mono text-xs font-bold text-[#13193a]">
                            {p.constancia || p.numero_poliza}
                          </td>
                          <td
                            className="px-4 py-1 text-xs font-semibold text-gray-700 max-w-[12rem] truncate"
                            title={`${p.clientes?.nombre ?? ""} ${p.clientes?.apellido ?? ""}`.trim()}
                          >
                            {p.clientes?.nombre} {p.clientes?.apellido || ""}
                          </td>
                          <td
                            className="px-4 py-1 text-xs text-gray-500 max-w-[10rem] truncate"
                            title={p.coberturas?.nombre}
                          >
                            {p.coberturas?.nombre}
                          </td>
                          <td className="px-4 py-1 text-xs text-gray-500">
                            {p.vendedores?.nombre}{" "}
                            {p.vendedores?.apellido || ""}
                          </td>
                          <td className="px-4 py-1 text-xs font-bold text-emerald-700">
                            {fmt$(p.coberturas?.prima_total)}
                          </td>
                          <td className="px-4 py-1 text-xs text-gray-500">
                            {p.forma_pago}
                          </td>
                          <td className="px-4 py-1 text-xs text-gray-500 whitespace-nowrap">
                            {p.fecha_fin}
                          </td>
                          <td className="px-4 py-1">
                            <StatusBadge estatus={p.estatus} />
                          </td>
                          <td
                            className="px-4 py-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => verPDF(p)}
                                disabled={loadingViewerId === p.id}
                                className="flex items-center gap-1 text-xs font-semibold text-[#13193a] border border-[#13193a]/20 px-2.5 py-1.5 rounded-xl hover:bg-[#13193a]/5 transition-all disabled:opacity-40 whitespace-nowrap"
                              >
                                {loadingViewerId === p.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                                Ver PDF
                              </button>
                              <button
                                onClick={() => setEndosoPoliza(p)}
                                className="flex items-center gap-1 text-xs font-semibold text-amber-700 border border-amber-200 px-2.5 py-1.5 rounded-xl hover:bg-amber-50 transition-all whitespace-nowrap"
                              >
                                <Pencil className="w-3.5 h-3.5 text-amber-500" />
                                Endoso
                              </button>
                              {!['CANCELADA','ANULADA'].includes(p.estatus) && (
                                <button
                                  onClick={() => renovar(p)}
                                  disabled={renovandoId === p.id}
                                  className="flex items-center gap-1 text-xs font-semibold text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-xl hover:bg-emerald-50 transition-all disabled:opacity-40 whitespace-nowrap"
                                >
                                  {renovandoId === p.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  )}
                                  Renovar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Paginator
                page={pageP}
                totalPages={totalPagesP}
                total={totalP}
                pageSize={10}
                onPage={setPageP}
              />
            </>
          )}

          {tab === "cotizaciones" &&
            (loadingCot ? (
              <div className="flex items-center justify-center gap-2 py-12 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
              </div>
            ) : cotizaciones.length === 0 ? (
              <div className="text-center py-12 text-sm text-gray-400">
                No hay cotizaciones guardadas.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      {[
                        "No.",
                        "Asegurado",
                        "Cobertura",
                        "Forma pago",
                        "Total",
                        "Guardada",
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-1 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {cotPag.map((c) => (
                      <tr
                        key={c.id}
                        className="hover:bg-gray-50/60 transition-colors"
                      >
                        <td className="px-5 py-1 font-mono text-xs font-bold text-[#13193a]">
                          COT-{c.id}
                        </td>
                        <td className="px-5 py-1 text-xs font-semibold text-gray-700">
                          {c.clientes?.nombre} {c.clientes?.apellido || ""}
                        </td>
                        <td className="px-5 py-1 text-xs text-gray-500 max-w-[10rem] truncate">
                          {c.coberturas?.nombre ?? "—"}
                        </td>
                        <td className="px-5 py-1 text-xs text-gray-500">
                          {c.forma_pago}
                        </td>
                        <td className="px-5 py-1 text-xs font-bold text-emerald-700">
                          {fmt$(c.coberturas?.prima_total)}
                        </td>
                        <td className="px-5 py-1 text-xs text-gray-400 whitespace-nowrap">
                          {new Date(c.created_at).toLocaleDateString("es-MX")}
                        </td>
                        <td className="px-5 py-1">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => abrirCotizacionGuardada(c)}
                              className="flex items-center gap-1.5 text-xs font-bold text-[#13193a] border border-[#13193a]/20 px-3 py-1.5 rounded-xl hover:bg-[#13193a]/5 transition-all whitespace-nowrap"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Tramitar
                            </button>
                            <button
                              onClick={() => borrarCotizacion(c.id)}
                              className="flex items-center gap-1 text-xs font-semibold text-red-500 border border-red-200 px-2.5 py-1.5 rounded-xl hover:bg-red-50 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Paginator
                  page={pageC}
                  totalPages={totalPagesC}
                  total={totalC}
                  pageSize={10}
                  onPage={setPageC}
                />
              </div>
            ))}

          {/* ── Tab: Subsecuentes ── */}
          {tab === "subsecuentes" && (
            loadingSubs ? (
              <div className="flex items-center justify-center gap-2 py-12 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
              </div>
            ) : subsecuentes.length === 0 ? (
              <div className="text-center py-12 text-sm text-gray-400">No hay pólizas subsecuentes pendientes.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      {["Constancia","Asegurado","Cobertura","Fecha inicio","Fecha fin","Creada",""].map(h => (
                        <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-1 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {subsecuentes.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-2 font-mono text-xs font-bold text-[#13193a]">{s.constancia}</td>
                        <td className="px-5 py-2 text-xs font-semibold text-gray-700">
                          {s.clientes?.nombre} {s.clientes?.apellido || ""}
                        </td>
                        <td className="px-5 py-2 text-xs text-gray-500 max-w-[10rem] truncate">{s.coberturas?.nombre ?? "—"}</td>
                        <td className="px-5 py-2 text-xs text-gray-500 whitespace-nowrap">{s.fecha_inicio}</td>
                        <td className="px-5 py-2 text-xs text-gray-500 whitespace-nowrap">{s.fecha_fin}</td>
                        <td className="px-5 py-2 text-xs text-gray-400 whitespace-nowrap">
                          {new Date(s.created_at).toLocaleDateString("es-MX")}
                        </td>
                        <td className="px-5 py-2">
                          <button onClick={() => abrirSubsecuente(s)}
                            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 border border-blue-200 px-3 py-1.5 rounded-xl hover:bg-blue-50 transition-all whitespace-nowrap">
                            <ClipboardList className="w-3.5 h-3.5" />
                            Completar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}

      {endosoPoliza && (
        <ModalEndoso
          poliza={endosoPoliza}
          usuario={usuario}
          onClose={() => setEndosoPoliza(null)}
          onDone={() => { setEndosoPoliza(null); cargar(); }}
        />
      )}

      {polizaViewer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-5xl h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
              <span className="text-sm font-bold text-[#13193a]">
                Vista previa de póliza
              </span>
              <button
                onClick={() => setPolizaViewer(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
                <PolizaPDF poliza={polizaViewer} />
              </PDFViewer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
