import { useState, useEffect, useMemo } from "react";
import { PDFViewer } from "@react-pdf/renderer";
import {
  fetchPolizas,
  fetchPolizaById,
  buildPolizaPDF,
  editarPoliza,
  contarPolizasCliente,
  contarPolizasConcesionario,
  fetchCotizacionesGuardadas,
  eliminarCotizacion,
} from "../../services/polizas";
import { fetchConfigCostos } from "../../services/configuracion";
import { actualizarNombreCliente } from "../../services/clientes";
import { actualizarNombreConcesionario } from "../../services/concesionarios";
import Swal from "sweetalert2";
import { pdf } from "@react-pdf/renderer";
import EndosoCancelacionPDF from "../../components/pdf/EndosoCancelacionPDF";
import { generateQR } from "../../utils/generateQR";
import { fmt$ } from "./utils/fmt";
import Tab from "./components/Tab";
import StatusBadge from "./components/StatusBadge";
import TramiteExitoso from "./components/TramiteExitoso";
import FormCotizacion from "./components/FormCotizacion";
import ResumenPoliza from "./components/ResumenPoliza";
import PolizaPDF from "../../components/pdf/PolizaPDF";
import { usePagination } from "../../hooks/usePagination";
import Paginator from "../../components/Paginator";
import {
  CheckCircle2,
  Eye,
  Loader2,
  Pencil,
  Plus,
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
  const [tramiteOk, setTramiteOk] = useState(null);
  const [cotActiva, setCotActiva] = useState(null);
  const [polizaViewer, setPolizaViewer] = useState(null);
  const [loadingViewerId, setLoadingViewerId] = useState(null);
  const [resumenData, setResumenData] = useState(null);
  const EDIT_FORM_VACIO = {
    numSerie: "",
    numMotor: "",
    placas: "",
    clienteNombre: "",
    clienteApellido1: "",
    clienteApellido2: "",
    concNombre: "",
    concApellido1: "",
    concApellido2: "",
  };
  const [modalEditar, setModalEditar] = useState(null);
  const [editFull, setEditFull] = useState(null);
  const [editForm, setEditForm] = useState(EDIT_FORM_VACIO);
  const [editPerms, setEditPerms] = useState({ cliente: false, conc: false });
  const [motivoEdicion, setMotivoEdicion] = useState("");
  const [editando, setEditando] = useState(false);
  const [cargandoEditar, setCargandoEditar] = useState(false);

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

  const cerrarEdicion = () => {
    setModalEditar(null);
    setEditFull(null);
    setEditForm(EDIT_FORM_VACIO);
    setEditPerms({ cliente: false, conc: false });
    setMotivoEdicion("");
  };

  const abrirEdicion = async (p) => {
    setModalEditar(p);
    setCargandoEditar(true);
    try {
      const full = await fetchPolizaById(p.id);
      const [cntCliente, cntConc] = await Promise.all([
        contarPolizasCliente(full.cliente_id),
        full.concesionario_id
          ? contarPolizasConcesionario(full.concesionario_id)
          : Promise.resolve(999),
      ]);
      const cliente = full.clientes ?? {};
      const conc = full.concesionarios ?? null;
      setEditFull(full);
      setEditForm({
        numSerie: full.num_serie || "",
        numMotor: full.num_motor || "",
        placas: full.placas || "",
        clienteNombre: cliente.nombre || "",
        clienteApellido1: (cliente.apellido || "").split(" ")[0] || "",
        clienteApellido2:
          (cliente.apellido || "").split(" ").slice(1).join(" ") || "",
        concNombre: conc?.nombre || "",
        concApellido1: conc?.apellido1 || "",
        concApellido2: conc?.apellido2 || "",
      });
      setEditPerms({
        cliente: cntCliente <= 1,
        conc: conc != null && cntConc <= 1,
      });
    } catch (e) {
      console.error(e);
      cerrarEdicion();
    } finally {
      setCargandoEditar(false);
    }
  };

  const confirmarEdicion = async () => {
    setEditando(true);
    const constanciaLabel = modalEditar.constancia || modalEditar.numero_poliza;
    try {
      // 1. Generar PDF ENDOSO TIPO "A"
      const config = await fetchConfigCostos(editFull?.fecha_inicio);
      const polizaPDF = buildPolizaPDF(editFull, usuario?.oficinas, config);
      const fechaEndoso = new Date().toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const blob = await pdf(
        <EndosoCancelacionPDF
          poliza={polizaPDF}
          motivo={motivoEdicion}
          fechaEndoso={fechaEndoso}
          tipoEndoso="A"
          numeroControl={editFull.id}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ENDOSO_EDICION-${constanciaLabel}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      // 2. Actualizar póliza
      await editarPoliza(
        editFull.id,
        {
          numSerie: editForm.numSerie,
          numMotor: editForm.numMotor,
          placas: editForm.placas,
        },
        usuario?.id,
        motivoEdicion,
      );

      // 3. Actualizar cliente si tiene permiso
      if (editPerms.cliente) {
        const apellidoCliente = [
          editForm.clienteApellido1,
          editForm.clienteApellido2,
        ]
          .filter(Boolean)
          .join(" ");
        await actualizarNombreCliente(
          editFull.cliente_id,
          editForm.clienteNombre,
          apellidoCliente,
        );
      }

      // 4. Actualizar concesionario si tiene permiso
      if (editPerms.conc && editFull.concesionario_id) {
        await actualizarNombreConcesionario(
          editFull.concesionario_id,
          editForm.concNombre,
          editForm.concApellido1,
          editForm.concApellido2,
        );
      }

      cerrarEdicion();
      await cargar();
      Swal.fire({
        icon: "success",
        title: "Póliza actualizada",
        text: `La póliza ${constanciaLabel} fue actualizada y se descargó el endoso.`,
        confirmButtonColor: "#13193a",
        confirmButtonText: "Aceptar",
        timer: 5000,
        timerProgressBar: true,
      });
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar la póliza: " + e.message,
        confirmButtonColor: "#13193a",
      });
    } finally {
      setEditando(false);
    }
  };

  useEffect(() => {
    cargar();
    cargarCotizaciones();
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
      const constancia = (p.constancia || p.numero_poliza || "").toLowerCase();
      const matchBusq = asegurado.includes(b) || constancia.includes(b);
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
    await Promise.all([cargar(), cargarCotizaciones()]);
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

  // Cuenta posiciones que difieren entre dos cadenas del mismo tamaño
  const difsCampo = (original, nuevo) => {
    if (!original) return 0;
    if (original.length !== nuevo.length) return Infinity;
    let n = 0;
    for (let i = 0; i < original.length; i++) if (original[i] !== nuevo[i]) n++;
    return n;
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

      {(tab === "polizas" || tab === "cotizaciones") && (
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
                                onClick={() => abrirEdicion(p)}
                                className="flex items-center gap-1 text-xs font-semibold text-gray-600 border border-gray-200 px-2.5 py-1.5 rounded-xl hover:bg-gray-50 transition-all whitespace-nowrap"
                              >
                                <Pencil className="w-3.5 h-3.5 text-gray-400" />
                                Editar
                              </button>
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
        </div>
      )}

      {/* ── Modal Editar ─────────────────────────────────────────────────── */}
      {modalEditar && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={cerrarEdicion}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <p className="text-base font-bold text-[#13193a]">
                  Editar póliza
                </p>
                <p className="text-xs text-gray-400 mt-0.5 font-mono">
                  {modalEditar.constancia || modalEditar.numero_poliza}
                </p>
              </div>
              <button
                onClick={cerrarEdicion}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Loading */}
            {cargandoEditar && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-7 h-7 animate-spin text-[#13193a]/30" />
              </div>
            )}

            {/* Body */}
            {!cargandoEditar && editFull && (
              <div className="px-6 py-5 space-y-5 max-h-[68vh] overflow-y-auto">
                {/* Vehículo */}
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-3">
                    Datos del vehículo
                  </p>

                  {/* No. Serie */}
                  {(() => {
                    const original = editFull.num_serie || "";
                    const diffs = difsCampo(original, editForm.numSerie);
                    const excede = diffs > 2;
                    return (
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                            No. Serie{" "}
                            <span className="text-gray-300 normal-case font-normal tracking-normal">
                              (máx. 2 cambios)
                            </span>
                          </label>
                          {diffs > 0 && (
                            <span
                              className={`text-[10px] font-semibold ${excede ? "text-red-500" : "text-amber-500"}`}
                            >
                              {excede
                                ? `${diffs} cambios — máx. 2`
                                : `${diffs}/2 cambios`}
                            </span>
                          )}
                        </div>
                        <input
                          value={editForm.numSerie}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              numSerie: e.target.value.toUpperCase(),
                            }))
                          }
                          maxLength={original.length || undefined}
                          className={`w-full px-3 py-2.5 rounded-xl border text-sm font-mono font-bold text-[#13193a] focus:outline-none transition-all ${excede ? "border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200" : "border-gray-200 bg-white focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]"}`}
                        />
                      </div>
                    );
                  })()}

                  {/* No. Motor */}
                  {(() => {
                    const original = editFull.num_motor || "";
                    const diffs = difsCampo(original, editForm.numMotor);
                    const excede = diffs > 2;
                    return (
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                            No. Motor{" "}
                            <span className="text-gray-300 normal-case font-normal tracking-normal">
                              (máx. 2 cambios)
                            </span>
                          </label>
                          {diffs > 0 && (
                            <span
                              className={`text-[10px] font-semibold ${excede ? "text-red-500" : "text-amber-500"}`}
                            >
                              {excede
                                ? `${diffs} cambios — máx. 2`
                                : `${diffs}/2 cambios`}
                            </span>
                          )}
                        </div>
                        <input
                          value={editForm.numMotor}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              numMotor: e.target.value.toUpperCase(),
                            }))
                          }
                          maxLength={original.length || undefined}
                          className={`w-full px-3 py-2.5 rounded-xl border text-sm font-mono font-bold text-[#13193a] focus:outline-none transition-all ${excede ? "border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200" : "border-gray-200 bg-white focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]"}`}
                        />
                      </div>
                    );
                  })()}

                  {/* Placas */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                      Placas
                    </label>
                    <input
                      value={editForm.placas}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          placas: e.target.value.toUpperCase(),
                        }))
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-mono font-bold text-[#13193a] focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all"
                      placeholder="ABC-123"
                    />
                  </div>
                </div>

                {/* Asegurado */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                      Asegurado
                    </p>
                    {!editPerms.cliente && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                        Tiene más de 1 póliza — no editable
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {[
                      { key: "clienteNombre", label: "Nombre" },
                      { key: "clienteApellido1", label: "Apellido paterno" },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                          {label}
                        </label>
                        <input
                          value={editForm[key]}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              [key]: e.target.value.toUpperCase(),
                            }))
                          }
                          disabled={!editPerms.cliente}
                          className={`w-full px-3 py-2.5 rounded-xl border text-sm text-[#13193a] focus:outline-none transition-all ${editPerms.cliente ? "border-gray-200 bg-white focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]" : "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"}`}
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                      Apellido materno
                    </label>
                    <input
                      value={editForm.clienteApellido2}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          clienteApellido2: e.target.value.toUpperCase(),
                        }))
                      }
                      disabled={!editPerms.cliente}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm text-[#13193a] focus:outline-none transition-all ${editPerms.cliente ? "border-gray-200 bg-white focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]" : "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"}`}
                    />
                  </div>
                </div>

                {/* Concesionario (solo si existe) */}
                {editFull.concesionario_id && (
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                        Concesionario
                      </p>
                      {!editPerms.conc && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                          Tiene más de 1 póliza — no editable
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {[
                        { key: "concNombre", label: "Nombre" },
                        { key: "concApellido1", label: "Apellido paterno" },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                            {label}
                          </label>
                          <input
                            value={editForm[key]}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                [key]: e.target.value.toUpperCase(),
                              }))
                            }
                            disabled={!editPerms.conc}
                            className={`w-full px-3 py-2.5 rounded-xl border text-sm text-[#13193a] focus:outline-none transition-all ${editPerms.conc ? "border-gray-200 bg-white focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]" : "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"}`}
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                        Apellido materno
                      </label>
                      <input
                        value={editForm.concApellido2}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            concApellido2: e.target.value.toUpperCase(),
                          }))
                        }
                        disabled={!editPerms.conc}
                        className={`w-full px-3 py-2.5 rounded-xl border text-sm text-[#13193a] focus:outline-none transition-all ${editPerms.conc ? "border-gray-200 bg-white focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]" : "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"}`}
                      />
                    </div>
                  </div>
                )}

                {/* Motivo */}
                <div className="border-t border-gray-100 pt-4">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                    Motivo de edición <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={motivoEdicion}
                    onChange={(e) => setMotivoEdicion(e.target.value)}
                    placeholder="Describe el motivo de la edición..."
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all resize-none"
                  />
                </div>
              </div>
            )}

            {/* Footer */}
            {!cargandoEditar && (
              <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
                <button
                  onClick={cerrarEdicion}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cerrar
                </button>
                <button
                  disabled={
                    editando ||
                    !motivoEdicion.trim() ||
                    difsCampo(editFull?.num_serie || "", editForm.numSerie) >
                      2 ||
                    difsCampo(editFull?.num_motor || "", editForm.numMotor) > 2
                  }
                  onClick={confirmarEdicion}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all shadow-sm shadow-[#13193a]/20 disabled:opacity-50"
                >
                  {editando ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            )}
          </div>
        </div>
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
