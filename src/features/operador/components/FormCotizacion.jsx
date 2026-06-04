import { useState, useEffect, useRef } from "react";
import {
  COBERTURA_BASICA,
  PRECIO_MATRIZ,
  DERECHOS,
  calcularPrecioData,
} from "../constants/cobertura";
import { fetchCoberturasActivas } from "../../../services/coberturas";
import {
  fetchPermitirFechasPasadas,
  fetchPermitirNumeroManual,
} from "../../../services/configuracion";
import { verificarConstanciaExistente } from "../../../services/polizas";
import { fetchClientes } from "../../../services/clientes";
import { fetchVendedores } from "../../../services/vendedores";
import {
  emitirPoliza,
  guardarCotizacion,
  actualizarCotizacion,
  numeroALetras,
} from "../../../services/polizas";
import { fetchConcesionariosByCliente } from "../../../services/concesionarios";
import { supabase } from "../../../supabaseClient";
import Swal from "sweetalert2";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Download,
  Loader2,
  Plus,
} from "lucide-react";
import {
  getAnios,
  getMarcas,
  getModelos,
  getVersiones,
  getVehiculoAmisRecord,
  getVehiculoPorAmis,
} from "../../../services/vehiculos";
import { fmt$ } from "../utils/fmt";
import StepBar from "./StepBar";
import ModalNuevoAsegurado from "./ModalNuevoAsegurado";
import ModalNuevoConcesionario from "./ModalNuevoConcesionario";
import ModalNuevoVendedor from "./ModalNuevoVendedor";

const inpCls =
  "w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all";
const disCls = " opacity-50 cursor-not-allowed bg-gray-50";
const roCls =
  "w-full px-3 py-2 rounded-xl border border-gray-100 bg-gray-50 text-sm font-semibold text-[#13193a] cursor-default";
const lblCls =
  "block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5";
const req = <span className="text-red-400 ml-0.5">*</span>;

const ANIOS = getAnios();

export default function FormCotizacion({
  cotizacionInicial,
  onGuardar,
  onTramitar,
  onCancelar,
  usuario,
}) {
  const esEdicion = !!cotizacionInicial;
  const nroCot =
    cotizacionInicial?.id ??
    `COT-${usuario?.oficinas?.id ?? "0"}${Date.now().toString().slice(-6)}`;
  // pasoInicial: 1=fresco, 2=subsecuente (cobertura ya elegida), 5=guardado (resumen)
  const [paso, setPaso] = useState(
    cotizacionInicial?.pasoInicial ?? (esEdicion ? 5 : 1),
  );

  const [form, setForm] = useState({
    coberturaId: cotizacionInicial?.coberturaId ?? null,
    coberturaData: cotizacionInicial?.coberturaData ?? null,
    vehiculoAmisId: cotizacionInicial?.vehiculoAmisId ?? null,
    codAMIS: cotizacionInicial?.codAMIS ?? "",
    marca: cotizacionInicial?.marca ?? "",
    tipoVehiculo: cotizacionInicial?.tipoVehiculo ?? "",
    version: cotizacionInicial?.version ?? "",
    descripcion: cotizacionInicial?.descripcion ?? "",
    modelo: cotizacionInicial?.modelo ?? String(new Date().getFullYear()),
    serie: cotizacionInicial?.serie ?? "",
    motor: cotizacionInicial?.motor ?? "",
    placas: cotizacionInicial?.placas ?? "",
    conductorHabitual: cotizacionInicial?.conductorHabitual ?? "",
    conductorSexo: cotizacionInicial?.conductorSexo ?? "",
    conductorEdad: cotizacionInicial?.conductorEdad ?? "",
    clienteId: cotizacionInicial?.clienteId ?? null,
    vendedorId: cotizacionInicial?.vendedorId ?? 1,
    concesionario: cotizacionInicial?.concesionario ?? null,
    fechaInicio: cotizacionInicial?.fechaInicio ?? "",
    formaPago: cotizacionInicial?.formaPago ?? "CONTADO",
    esGestor: cotizacionInicial?.esGestor ?? false,
  });
  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // ── Datos DB ──
  const [coberturas, setCoberturas] = useState([]);
  const [loadingCoberturas, setLoadingCoberturas] = useState(true);
  const [permitirFechasPas, setPermitirFechasPas] = useState(false);
  const [permitirNumManual, setPermitirNumManual] = useState(false);
  const [numeroManual, setNumeroManual] = useState("");
  const [numManualError, setNumManualError] = useState(null);
  const [numManualChecking, setNumManualChecking] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [concesionariosLocal, setConcesionariosLocal] = useState({});
  const [conVendedor, setConVendedor] = useState(
    !!(cotizacionInicial?.vendedorId && cotizacionInicial.vendedorId !== 1),
  );
  const [loadingDB, setLoadingDB] = useState(true);
  const [isEmitting, setIsEmitting] = useState(false);
  const [isGuardando, setIsGuardando] = useState(false);
  const [modalAseg, setModalAseg] = useState(false);
  const [modalConc, setModalConc] = useState(false);
  const [modalVend, setModalVend] = useState(false);
  const [amisError, setAmisError] = useState(false);
  const [serieError, setSerieError] = useState(null);
  const [serieChecking, setSerieChecking] = useState(false);

  // "auto"    → el código lo genera el sistema al completar los campos
  // "busqueda" → el usuario escribió el código primero
  const amisFuente = useRef("auto");

  useEffect(() => {
    fetchCoberturasActivas()
      .then(setCoberturas)
      .catch(console.error)
      .finally(() => setLoadingCoberturas(false));
    fetchPermitirFechasPasadas()
      .then(setPermitirFechasPas)
      .catch(console.error);
    fetchPermitirNumeroManual().then(setPermitirNumManual).catch(console.error);
  }, []);

  useEffect(() => {
    Promise.all([fetchClientes(), fetchVendedores()])
      .then(([cls, vds]) => {
        setClientes(cls);
        setVendedores(vds);
      })
      .catch(console.error)
      .finally(() => setLoadingDB(false));
  }, []);

  useEffect(() => {
    if (!form.clienteId) return;
    fetchConcesionariosByCliente(form.clienteId)
      .then((data) =>
        setConcesionariosLocal((prev) => ({ ...prev, [form.clienteId]: data })),
      )
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.clienteId]);

  // ── Catálogo vehículos — async desde BD, con caché ───────────────────────
  const [marcasDisp, setMarcasDisp] = useState([]);
  const [modelosDisp, setModelosDisp] = useState([]);
  const [versionesDisp, setVersionesDisp] = useState([]);

  useEffect(() => {
    if (!form.modelo) {
      setMarcasDisp([]);
      return;
    }
    getMarcas(form.modelo).then(setMarcasDisp).catch(console.error);
  }, [form.modelo]);

  useEffect(() => {
    if (!form.marca || !form.modelo) {
      setModelosDisp([]);
      return;
    }
    getModelos(form.marca, form.modelo)
      .then(setModelosDisp)
      .catch(console.error);
  }, [form.marca, form.modelo]);

  useEffect(() => {
    if (!form.marca || !form.tipoVehiculo || !form.modelo) {
      setVersionesDisp([]);
      return;
    }
    getVersiones(form.marca, form.tipoVehiculo, form.modelo)
      .then(setVersionesDisp)
      .catch(console.error);
  }, [form.marca, form.tipoVehiculo, form.modelo]);

  // Auto-rellena codAMIS, descripcion y vehiculoAmisId cuando se selecciona versión
  useEffect(() => {
    if (amisFuente.current === "busqueda") return;
    if (!form.modelo || !form.marca || !form.tipoVehiculo || !form.version)
      return;
    getVehiculoAmisRecord(
      form.modelo,
      form.marca,
      form.tipoVehiculo,
      form.version,
    )
      .then((rec) => {
        if (rec) {
          setForm((f) => ({
            ...f,
            vehiculoAmisId: rec.id,
            codAMIS: String(rec.cve),
            descripcion: rec.dl || "",
          }));
          setAmisError(false);
        } else {
          setAmisError(true);
        }
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.modelo, form.marca, form.tipoVehiculo, form.version]);

  const handleAnio = (e) => {
    amisFuente.current = "auto";
    setForm((f) => ({
      ...f,
      modelo: e.target.value,
      marca: "",
      tipoVehiculo: "",
      version: "",
      descripcion: "",
    }));
  };

  const handleMarca = (e) => {
    amisFuente.current = "auto";
    setForm((f) => ({
      ...f,
      marca: e.target.value,
      tipoVehiculo: "",
      version: "",
      descripcion: "",
    }));
  };

  const handleModeloVeh = (e) => {
    amisFuente.current = "auto";
    setForm((f) => ({
      ...f,
      tipoVehiculo: e.target.value,
      version: "",
      descripcion: "",
    }));
  };

  const handleVersion = (e) => {
    amisFuente.current = "auto";
    setF("version", e.target.value);
  };

  // AMIS como buscador: si se escriben 4 dígitos válidos, rellena los demás campos
  const handleAmis = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    setAmisError(false);

    if (val.length < 4) {
      // Mientras escribe, modo búsqueda: no sobreescribir con auto
      amisFuente.current = val.length > 0 ? "busqueda" : "auto";
      setF("codAMIS", val);
      return;
    }

    // 4 dígitos completos → intentar lookup async
    amisFuente.current = "busqueda";
    setF("codAMIS", val);
    getVehiculoPorAmis(val)
      .then((v) => {
        if (v) {
          setForm((f) => ({
            ...f,
            vehiculoAmisId: v.id,
            codAMIS: val,
            modelo: v.anio,
            marca: v.marca,
            tipoVehiculo: v.modelo,
            version: v.version,
          }));
        } else {
          setAmisError(true);
        }
      })
      .catch(console.error);
  };

  // ── Helpers ──
  const clienteSel = clientes.find((c) => c.id === form.clienteId) ?? null;
  const vendedorSel = vendedores.find((v) => v.id === form.vendedorId) ?? null;
  const clienteLabel = clienteSel
    ? `${clienteSel.nombre} ${clienteSel.apellido || ""}`.trim()
    : "—";
  // Para el PDF el conducto de COFISEM se muestra como "1"
  const vendedorLabel =
    vendedorSel && vendedorSel.id !== 1
      ? `${vendedorSel.nombre} ${vendedorSel.apellido || ""}`.trim()
      : "1";
  // Para el formulario se muestra el nombre real
  const vendedorNombre =
    vendedorSel && vendedorSel.id !== 1
      ? `${vendedorSel.nombre} ${vendedorSel.apellido || ""}`.trim()
      : (vendedorSel?.nombre ?? "COFISEM");

  const concesionariosDisponibles = form.clienteId
    ? (concesionariosLocal[form.clienteId] ?? [])
    : [];
  const concLabel =
    concesionariosDisponibles.find((c) => c.id === form.concesionario)?.label ??
    "—";

  const todayStr = new Date().toISOString().split("T")[0];
  const maxDateStr = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const maxDateNormal = new Date(Date.now() + 29 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const fechaInicioValida = permitirFechasPas
    ? !!(form.fechaInicio && form.fechaInicio <= maxDateStr)
    : !!(
        form.fechaInicio &&
        form.fechaInicio >= todayStr &&
        form.fechaInicio <= maxDateNormal
      );

  // Pricing: desde la cobertura seleccionada en BD (o fallback a PRECIO_MATRIZ)
  const precioData = form.coberturaData
    ? calcularPrecioData(form.coberturaData, form.formaPago, form.esGestor)
    : (PRECIO_MATRIZ[form.esGestor ? "gestor" : "normal"][form.formaPago] ??
      PRECIO_MATRIZ[form.esGestor ? "gestor" : "normal"]["CONTADO"]);
  const total = precioData.total;
  const primerPago = precioData.primerPago;
  const pagoSubs = precioData.pagoSubs;
  const nSubs = precioData.nSubs;
  const derechosCob = form.coberturaData
    ? +(
        parseFloat(form.coberturaData.prima_total) -
        parseFloat(form.coberturaData.prima_neta) -
        +(parseFloat(form.coberturaData.prima_neta) * 0.16).toFixed(2)
      ).toFixed(2)
    : DERECHOS;
  const subtotal = +(total / 1.16).toFixed(2);
  const iva = +(total - subtotal).toFixed(2);
  const primaNeta = form.coberturaData
    ? parseFloat(form.coberturaData.prima_neta)
    : +(subtotal - DERECHOS).toFixed(2);

  const fechaHoy = new Date().toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const horaHoy = new Date().toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const fechaFinVigencia = form.fechaInicio
    ? (() => {
        const d = new Date(form.fechaInicio + "T12:00:00");
        d.setFullYear(d.getFullYear() + 1);
        return d.toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      })()
    : "—";

  const fechaInicioFmt = form.fechaInicio
    ? new Date(form.fechaInicio + "T12:00:00").toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

  const checkNumeroManual = async (val) => {
    const v = val.trim().toUpperCase();
    if (!v) {
      setNumManualError(null);
      return;
    }
    setNumManualChecking(true);
    setNumManualError(null);
    const existe = await verificarConstanciaExistente(v);
    if (existe) {
      const cliente = existe.clientes
        ? `${existe.clientes.nombre} ${existe.clientes.apellido || ""}`.trim()
        : "—";
      const fecha = existe.fecha_inicio
        ? new Date(existe.fecha_inicio + "T12:00:00").toLocaleDateString(
            "es-MX",
            { day: "2-digit", month: "2-digit", year: "numeric" },
          )
        : "—";
      setNumManualError(
        `Este número ya existe — emitida el ${fecha} a ${cliente}`,
      );
    }
    setNumManualChecking(false);
  };

  const esSubsecuente = cotizacionInicial?.esSubsecuente === true;

  const canNext = {
    1: !!form.coberturaId,
    2: !!(
      form.vehiculoAmisId &&
      form.marca &&
      form.tipoVehiculo &&
      form.version.trim() &&
      form.modelo &&
      form.serie.trim() &&
      form.motor.trim() &&
      form.placas.trim() &&
      !serieChecking
    ),
    3: !!(
      form.clienteId &&
      fechaInicioValida &&
      !numManualChecking &&
      !numManualError
    ),
    4: true,
  };

  const onGuardarAsegurado = (clienteObj) => {
    setClientes((cs) => [...cs, clienteObj]);
    setF("clienteId", clienteObj.id);
    setF("concesionario", null);
    setModalAseg(false);
  };

  const onGuardarVendedor = (vendedorObj) => {
    setVendedores((vs) => [...vs, vendedorObj]);
    setF("vendedorId", vendedorObj.id);
    setModalVend(false);
  };

  const onGuardarConcesionario = (concObj) => {
    setConcesionariosLocal((prev) => ({
      ...prev,
      [form.clienteId]: [...(prev[form.clienteId] ?? []), concObj],
    }));
    setF("concesionario", concObj.id);
    setModalConc(false);
  };

  const checkSerie = async (serie) => {
    const val = serie?.trim().toUpperCase();
    if (!val || val.length < 5) return;
    setSerieChecking(true);
    setSerieError(null);
    const { data } = await supabase
      .from("polizas")
      .select("constancia, estatus")
      .eq("num_serie", val)
      .in("estatus", ["VIGENTE", "POR VENCER"])
      .maybeSingle();
    if (data) {
      setSerieError(
        `Este No. Serie ya tiene una póliza vigente: ${data.constancia}`,
      );
    }
    setSerieChecking(false);
  };

  const handleEmitir = async () => {
    if (
      !form.clienteId ||
      !form.vehiculoAmisId ||
      !fechaInicioValida ||
      isEmitting
    )
      return;
    setIsEmitting(true);
    try {
      const enLetras = numeroALetras(total);
      const poliza = await emitirPoliza({
        polizaId: cotizacionInicial?.polizaId ?? null,
        coberturaId: form.coberturaId ?? null,
        pagos: nSubs > 0 ? { primerPago, pagoSubs, nSubs } : null,
        numeroManual:
          permitirNumManual && !esSubsecuente && numeroManual.trim()
            ? numeroManual.trim().toUpperCase()
            : null,
        clienteId: form.clienteId,
        vendedorId: form.vendedorId || null,
        vehiculoAmisId: form.vehiculoAmisId,
        anio: form.modelo,
        serie: form.serie,
        numMotor: form.motor,
        placas: form.placas,
        capacidad: "4 OCUPANTES",
        uso: "SERVICIO PUBLICO",
        tipoServicio: "TAXI",
        primaNeta,
        primaTotal: total,
        formaPago: form.formaPago,
        fechaInicio: form.fechaInicio,
        iva,
        enLetras,
        cpAsegurado: clienteSel?.cp || null,
        conductorHabitual: form.conductorHabitual || null,
        conductorSexo: form.conductorSexo || null,
        conductorEdad: form.conductorEdad || null,
        concesionarioId: form.concesionario || null,
        creadoPor: usuario?.id,
        oficinaId: usuario?.oficinas?.id ?? null,
        esGestor: form.esGestor ?? false,
      });
      onTramitar(poliza);
    } catch (e) {
      alert("Error al emitir póliza: " + e.message);
    } finally {
      setIsEmitting(false);
    }
  };

  const handleGuardar = async () => {
    setIsGuardando(true);
    try {
      const enLetras = numeroALetras(total);
      if (cotizacionInicial?.polizaId) {
        await actualizarCotizacion({
          polizaId: cotizacionInicial.polizaId,
          form,
          total,
          enLetras,
          usuario,
        });
      } else {
        await guardarCotizacion({ form, total, enLetras, usuario });
      }
      onGuardar();
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Error al guardar",
        text: e.message,
        confirmButtonColor: "#13193a",
      });
    } finally {
      setIsGuardando(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="bg-[#13193a] rounded-2xl px-5 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-white/40 mb-0.5">No. Cotización</p>
            <p className="text-white font-mono font-bold">{nroCot}</p>
          </div>
          <div>
            <p className="text-white/40 mb-0.5">Fecha emisión</p>
            <p className="text-white font-semibold">{fechaHoy}</p>
          </div>
          <div>
            <p className="text-white/40 mb-0.5">Hora</p>
            <p className="text-white font-semibold">{horaHoy} hrs.</p>
          </div>
          <div>
            <p className="text-white/40 mb-0.5">Punto de venta</p>
            <p className="text-white font-semibold truncate">
              {usuario?.oficinas?.nombre ?? "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <StepBar paso={paso} />

        {/* ── PASO 1: Selección de cobertura ── */}
        {paso === 1 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#13193a]">
                1. Selecciona la cobertura
              </h3>
              <p className="text-sm text-gray-400 mt-0.5">
                Elige el paquete de cobertura para esta póliza
              </p>
            </div>
            {loadingCoberturas ? (
              <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Cargando coberturas…</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {coberturas.map((cob) => {
                  const sel = form.coberturaId === cob.id;
                  return (
                    <button
                      key={cob.id}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          coberturaId: cob.id,
                          coberturaData: cob,
                        }))
                      }
                      className={`w-full text-left rounded-2xl border-2 px-5 py-4 transition-all ${
                        sel
                          ? "border-[#13193a] bg-[#13193a]/5"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p
                            className={`text-sm font-bold ${sel ? "text-[#13193a]" : "text-gray-700"}`}
                          >
                            {cob.nombre}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {cob.grupos_coberturas?.nombre ?? ""}
                            {" · "}Duración: {cob.duracion_meses} meses
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p
                            className={`text-xl font-black tabular-nums ${sel ? "text-[#13193a]" : "text-gray-700"}`}
                          >
                            $
                            {parseFloat(cob.prima_total).toLocaleString(
                              "es-MX",
                              { minimumFractionDigits: 2 },
                            )}
                          </p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                            Prima total
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── PASO 2: Vehículo ── */}
        {paso === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#13193a]">
                2. Datos del vehículo
              </h3>
              <p className="text-sm text-gray-400 mt-0.5">
                Información del vehículo a asegurar
              </p>
            </div>

            {/* Fila 1: Cód. AMIS | Año | Marca
                Fila 2: Modelo   | Versión | No. Serie
                Fila 3: No. Motor | Placas | Color
                Fila 4: Capacidad | Uso */}
            <div className="grid grid-cols-3 gap-4">
              {/* Cód. AMIS */}
              <div>
                <label className={lblCls}>
                  Cód. AMIS {req}
                  {amisError && (
                    <span className="ml-1 normal-case font-normal text-red-400 text-[10px]">
                      Código no encontrado
                    </span>
                  )}
                </label>
                <input
                  value={form.codAMIS}
                  onChange={handleAmis}
                  placeholder="Auto o busca por código"
                  maxLength={4}
                  inputMode="numeric"
                  className={
                    inpCls +
                    (amisError
                      ? " border-red-300 focus:border-red-400 focus:ring-red-200"
                      : "")
                  }
                />
              </div>

              {/* Año */}
              <div>
                <label className={lblCls}>Año {req}</label>
                <select
                  value={form.modelo}
                  onChange={handleAnio}
                  className={inpCls}
                >
                  <option value="">Selecciona año</option>
                  {ANIOS.map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Marca */}
              <div>
                <label className={lblCls}>Marca {req}</label>
                <select
                  value={form.marca}
                  onChange={handleMarca}
                  disabled={!form.modelo}
                  className={inpCls + (!form.modelo ? disCls : "")}
                >
                  <option value="">
                    {!form.modelo ? "Elige año primero" : "Selecciona marca"}
                  </option>
                  {marcasDisp.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Modelo */}
              <div>
                <label className={lblCls}>Modelo {req}</label>
                <select
                  value={form.tipoVehiculo}
                  onChange={handleModeloVeh}
                  disabled={!form.marca}
                  className={inpCls + (!form.marca ? disCls : "")}
                >
                  <option value="">
                    {!form.marca ? "Elige marca primero" : "Selecciona modelo"}
                  </option>
                  {modelosDisp.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Versión */}
              <div>
                <label className={lblCls}>Versión {req}</label>
                {versionesDisp.length > 0 ? (
                  <select
                    value={form.version}
                    onChange={handleVersion}
                    disabled={!form.tipoVehiculo}
                    className={inpCls + (!form.tipoVehiculo ? disCls : "")}
                  >
                    <option value="">
                      {!form.tipoVehiculo
                        ? "Elige modelo primero"
                        : "Selecciona versión"}
                    </option>
                    {versionesDisp.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={form.version}
                    onChange={(e) => {
                      amisFuente.current = "auto";
                      setF("version", e.target.value);
                    }}
                    disabled={!form.tipoVehiculo}
                    placeholder={
                      form.tipoVehiculo
                        ? "Escribe la versión"
                        : "Elige modelo primero"
                    }
                    className={inpCls + (!form.tipoVehiculo ? disCls : "")}
                  />
                )}
              </div>

              {/* No. de Serie */}
              <div>
                <label className={lblCls}>No. de Serie (VIN) {req}</label>
                <input
                  value={form.serie}
                  onChange={(e) => {
                    setF("serie", e.target.value.toUpperCase());
                    setSerieError(null);
                  }}
                  onBlur={(e) => checkSerie(e.target.value)}
                  placeholder="17 caracteres"
                  maxLength={17}
                  className={inpCls}
                />
              </div>

              {/* No. Motor */}
              <div>
                <label className={lblCls}>No. Motor {req}</label>
                <input
                  value={form.motor}
                  onChange={(e) => setF("motor", e.target.value.toUpperCase())}
                  placeholder="No. de motor"
                  className={inpCls}
                />
              </div>

              {/* Placas */}
              <div>
                <label className={lblCls}>Placas {req}</label>
                <input
                  value={form.placas}
                  onChange={(e) => setF("placas", e.target.value.toUpperCase())}
                  placeholder="ABC-123"
                  className={inpCls}
                />
              </div>

              {/* Color */}
              <div>
                <label className={lblCls}>Color</label>
                <input readOnly value="Blanco" className={roCls} />
              </div>

              {/* Capacidad */}
              <div>
                <label className={lblCls}>Capacidad (pasajeros)</label>
                <input readOnly value="4 OCUPANTES" className={roCls} />
              </div>

              {/* Uso */}
              <div>
                <label className={lblCls}>Uso del vehículo</label>
                <input readOnly value="SERVICIO PÚBLICO" className={roCls} />
              </div>

              <div className=""></div>

              <p className="text-xs text-gray-400">
                <span className="text-red-400 font-bold">*</span> Campos
                obligatorios
              </p>
            </div>
          </div>
        )}

        {/* ── PASO 3: Cotización ── */}
        {paso === 3 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#13193a]">
                3. Datos de cotización
              </h3>
              <p className="text-sm text-gray-400 mt-0.5">
                Información del asegurado y condiciones de la póliza
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={lblCls} style={{ marginBottom: 0 }}>
                  Vendedor
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-xs text-gray-500 font-medium">
                    Vendedor
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !conVendedor;
                      setConVendedor(next);
                      if (!next) setF("vendedorId", 1);
                    }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${conVendedor ? "bg-[#13193a]" : "bg-gray-300"}`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${conVendedor ? "translate-x-[18px]" : "translate-x-[3px]"}`}
                    />
                  </button>
                </label>
              </div>
              {!conVendedor ? (
                <input
                  type="text"
                  value={vendedorNombre}
                  disabled
                  className={
                    inpCls + " bg-gray-100 text-gray-400 cursor-not-allowed"
                  }
                />
              ) : (
                <div className="flex gap-2">
                  <select
                    value={form.vendedorId ?? ""}
                    onChange={(e) =>
                      setF(
                        "vendedorId",
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    disabled={loadingDB}
                    className={inpCls + " flex-1"}
                  >
                    <option value="">
                      {loadingDB ? "Cargando..." : "Selecciona un vendedor"}
                    </option>
                    {vendedores
                      .filter((v) => v.activo && v.id !== 1)
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.nombre} {v.apellido || ""}
                          {v.codigo ? ` (${v.codigo})` : ""}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setModalVend(true)}
                    className="shrink-0 w-10 h-10 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white flex items-center justify-center transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lblCls}>Asegurado {req}</label>
                <div className="flex gap-2">
                  <select
                    value={form.clienteId ?? ""}
                    onChange={(e) => {
                      setF(
                        "clienteId",
                        e.target.value ? Number(e.target.value) : null,
                      );
                      setF("concesionario", null);
                    }}
                    disabled={loadingDB}
                    className={inpCls + " flex-1"}
                  >
                    <option value="">
                      {loadingDB ? "Cargando..." : "Selecciona un asegurado"}
                    </option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.apellido || ""} — {c.rfc}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setModalAseg(true)}
                    className="shrink-0 w-10 h-10 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white flex items-center justify-center transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className={lblCls}>Concesionario</label>
                <div className="flex gap-2">
                  <select
                    value={form.concesionario ?? ""}
                    onChange={(e) =>
                      setF(
                        "concesionario",
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    disabled={
                      !form.clienteId || concesionariosDisponibles.length === 0
                    }
                    className={
                      inpCls +
                      " flex-1" +
                      (!form.clienteId || concesionariosDisponibles.length === 0
                        ? " opacity-50 cursor-not-allowed"
                        : "")
                    }
                  >
                    <option value="">
                      {!form.clienteId
                        ? "Elige asegurado primero"
                        : concesionariosDisponibles.length === 0
                          ? "Sin concesionarios"
                          : "Selecciona concesionario"}
                    </option>
                    {concesionariosDisponibles.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setModalConc(true)}
                    disabled={!form.clienteId}
                    className="shrink-0 w-10 h-10 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white flex items-center justify-center transition-all disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lblCls}>Inicio de vigencia {req}</label>
                <input
                  type="date"
                  value={form.fechaInicio}
                  onChange={(e) => setF("fechaInicio", e.target.value)}
                  min={permitirFechasPas ? undefined : todayStr}
                  max={permitirFechasPas ? maxDateStr : maxDateNormal}
                  className={inpCls}
                />
                {form.fechaInicio && !fechaInicioValida && (
                  <p className="text-xs text-red-500 mt-1">
                    {permitirFechasPas
                      ? "La fecha no puede ser mayor a un año desde hoy."
                      : "La fecha debe estar entre hoy y los próximos 30 días."}
                  </p>
                )}
              </div>
              <div>
                <label className={lblCls}>Fin de vigencia (anual)</label>
                <input readOnly value={fechaFinVigencia} className={roCls} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lblCls}>Modalidad de pago</label>
                <select
                  value={form.formaPago}
                  onChange={(e) => setF("formaPago", e.target.value)}
                  className={inpCls}
                >
                  {["CONTADO", "4 PARCIALES"].map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col justify-end">
                <label className={lblCls}>Tipo de cliente</label>
                <div className="flex items-center gap-3 h-[38px]">
                  <button
                    type="button"
                    onClick={() => setF("esGestor", !form.esGestor)}
                    className={[
                      "relative w-11 h-6 rounded-full transition-colors focus:outline-none",
                      form.esGestor ? "bg-[#13193a]" : "bg-gray-200",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                        form.esGestor ? "translate-x-5" : "translate-x-0",
                      ].join(" ")}
                    />
                  </button>
                  <span className="text-sm font-semibold text-gray-700">
                    {form.esGestor ? "Gestor" : "Normal"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {form.esGestor ? "(volumen alto)" : "(póliza individual)"}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-400">
                <span className="text-red-400 font-bold">*</span> Campos
                obligatorios
              </p>
            </div>

            {/* Número de póliza manual — solo si el admin habilitó la opción y no es subsecuente */}
            {permitirNumManual && !esSubsecuente && (
              <div>
                <label className={lblCls}>
                  Número de póliza / constancia manual
                  <span className="ml-1 normal-case font-normal text-gray-300 tracking-normal">
                    (opcional — si se deja vacío el sistema lo asigna)
                  </span>
                </label>
                <input
                  value={numeroManual}
                  onChange={(e) => {
                    const v = e.target.value.toUpperCase();
                    setNumeroManual(v);
                    setNumManualError(null);
                  }}
                  onBlur={(e) => checkNumeroManual(e.target.value)}
                  placeholder="Ej. 01260100000001-01"
                  className={`${inpCls} font-mono ${numManualError ? "border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400" : ""}`}
                />
                {numManualChecking && (
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Verificando…
                  </p>
                )}
                {numManualError && (
                  <p className="text-xs text-red-600 mt-1 font-medium">
                    {numManualError}
                  </p>
                )}
                {numeroManual && !numManualError && !numManualChecking && (
                  <p className="text-xs text-emerald-600 mt-1 font-medium">
                    ✓ Número disponible
                  </p>
                )}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Prima estimada: </span>
                <span className="font-black text-base">{fmt$(total)}</span>
                {form.formaPago === "4 PARCIALES" && (
                  <span className="text-xs text-blue-600 ml-2">
                    (1er pago {fmt$(primerPago)}, después {nSubs}×
                    {fmt$(pagoSubs)})
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* ── PASO 4: Coberturas ── */}
        {paso === 4 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#13193a]">
                4. Coberturas
              </h3>
              <p className="text-sm text-gray-400 mt-0.5">
                Detalle del paquete seleccionado
              </p>
            </div>

            <div className="border-2 border-[#13193a] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 bg-[#13193a]">
                <div>
                  <p className="font-bold text-sm text-white">
                    {form.coberturaData?.nombre ?? COBERTURA_BASICA.nombre}
                  </p>
                  <p className="text-xs mt-0.5 text-white/60">
                    Uso: SERVICIO PÚBLICO
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wide text-white/60">
                    Prima total
                  </p>
                  <p className="font-black text-xl tabular-nums text-white">
                    {fmt$(total)}
                  </p>
                  {form.formaPago === "4 PARCIALES" && (
                    <p className="text-[10px] text-white/60">
                      1er pago {fmt$(primerPago)} · {nSubs}×{fmt$(pagoSubs)}
                    </p>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">
                        Cobertura
                      </th>
                      <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">
                        Suma asegurada
                      </th>
                      <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">
                        Ded.
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(form.coberturaData?.cobertura_rubros
                      ? [...form.coberturaData.cobertura_rubros]
                          .sort((a, b) => a.orden - b.orden)
                          .filter((r) => !r.es_sublimite)
                      : COBERTURA_BASICA.coberturas.map((c) => ({
                          rubro: c.desc,
                          monto_maximo: c.monto,
                        }))
                    ).map((c, i) => (
                      <tr key={i} className="hover:bg-gray-50/60">
                        <td className="px-4 py-2.5 text-gray-700 font-medium">
                          {c.rubro ?? c.desc}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-600 font-semibold">
                          {c.monto_maximo ?? c.monto ?? "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-400">
                          {"0.00"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── PASO 5: Resumen ── */}
        {paso === 5 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#13193a]">5. Resumen</h3>
              <p className="text-sm text-gray-400 mt-0.5">
                Revisa todos los datos antes de guardar o tramitar
              </p>
            </div>

            {/* Características */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Características de la póliza
                </p>
                <button
                  onClick={() => setPaso(3)}
                  className="text-xs text-blue-500 hover:underline font-semibold"
                >
                  Editar
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                {[
                  { l: "No. cotización", v: nroCot },
                  { l: "Vendedor", v: vendedorLabel },
                  { l: "Asegurado", v: clienteLabel },
                  { l: "Concesionario", v: concLabel },
                  {
                    l: "Tipo de cliente",
                    v: form.esGestor ? "Gestor" : "Normal",
                  },
                  {
                    l: "Cobertura",
                    v: form.coberturaData?.nombre ?? COBERTURA_BASICA.nombre,
                  },
                  { l: "Modalidad de pago", v: form.formaPago },
                  { l: "Inicio de vigencia", v: fechaInicioFmt },
                  { l: "Fin de vigencia", v: fechaFinVigencia },
                ].map(({ l, v }) => (
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
                  {fmt$(total)}
                </p>
              </div>
            </div>

            {/* Vehículo */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Datos del vehículo
                </p>
                <button
                  onClick={() => setPaso(2)}
                  className="text-xs text-blue-500 hover:underline font-semibold"
                >
                  Editar
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
                {[
                  { l: "Marca", v: form.marca || "—" },
                  { l: "Modelo", v: form.tipoVehiculo || "—" },
                  { l: "Versión", v: form.version || "—" },
                  { l: "Año", v: form.modelo || "—" },
                  { l: "No. Serie", v: form.serie || "—" },
                  { l: "No. Motor", v: form.motor || "—" },
                  { l: "Placas", v: form.placas || "—" },
                  { l: "Capacidad", v: "4 OCUPANTES" },
                  { l: "Cód. AMIS", v: form.codAMIS || "—" },
                ].map(({ l, v }) => (
                  <div key={l}>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">
                      {l}
                    </p>
                    <p className="font-semibold text-[#13193a] text-xs">{v}</p>
                  </div>
                ))}
              </div>
              {(form.conductorHabitual ||
                form.conductorSexo ||
                form.conductorEdad) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-2">
                    Conductor habitual
                  </p>
                  <div className="grid grid-cols-3 gap-x-6 gap-y-2">
                    {[
                      { l: "Nombre", v: form.conductorHabitual || "—" },
                      { l: "Sexo", v: form.conductorSexo || "—" },
                      {
                        l: "Edad",
                        v: form.conductorEdad
                          ? `${form.conductorEdad} años`
                          : "—",
                      },
                    ].map(({ l, v }) => (
                      <div key={l}>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">
                          {l}
                        </p>
                        <p className="font-semibold text-[#13193a] text-xs">
                          {v}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Coberturas */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Coberturas
                </p>
                <button
                  onClick={() => setPaso(4)}
                  className="text-xs text-blue-500 hover:underline font-semibold"
                >
                  Ver
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">
                        Cobertura
                      </th>
                      <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">
                        Suma asegurada
                      </th>
                      <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">
                        Deducible
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(form.coberturaData?.cobertura_rubros
                      ? [...form.coberturaData.cobertura_rubros]
                          .sort((a, b) => a.orden - b.orden)
                          .filter((r) => !r.es_sublimite)
                      : COBERTURA_BASICA.coberturas.map((c) => ({
                          rubro: c.desc,
                          monto_maximo: c.monto,
                        }))
                    ).map((c, i) => (
                      <tr key={i} className="hover:bg-gray-50/60">
                        <td className="px-4 py-2.5 text-gray-700 font-medium">
                          {c.rubro ?? c.desc}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-600 font-semibold">
                          {c.monto_maximo ?? c.monto ?? "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-400">
                          {"0.00"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Desglose de prima */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Desglose de prima total
                </p>
              </div>
              <div className="p-5 space-y-5">
                {form.formaPago === "4 PARCIALES" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
                        Primer pago
                      </p>
                      <p className="text-sm font-bold text-[#13193a]">
                        {fmt$(primerPago)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
                        Pagos subsecuentes (×{nSubs})
                      </p>
                      <p className="text-sm font-bold text-[#13193a]">
                        {fmt$(pagoSubs)}
                      </p>
                    </div>
                  </div>
                )}
                <div className="divide-y divide-gray-100 text-sm border border-gray-100 rounded-xl overflow-hidden">
                  {[
                    { l: "Prima neta", v: primaNeta, bold: false },
                    { l: "Derechos / Expedición", v: DERECHOS, bold: false },
                    { l: "Subtotal", v: subtotal, bold: true },
                    { l: "I.V.A. (16%)", v: iva, bold: false },
                  ].map(({ l, v, bold }) => (
                    <div
                      key={l}
                      className={`flex justify-between items-center px-4 py-3 ${bold ? "bg-gray-50 font-bold" : "bg-white"}`}
                    >
                      <span
                        className={bold ? "text-[#13193a]" : "text-gray-500"}
                      >
                        {l}
                      </span>
                      <span
                        className={`tabular-nums ${bold ? "text-[#13193a]" : "text-gray-700"}`}
                      >
                        {fmt$(v)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between bg-[#13193a] rounded-xl px-5 py-4">
                  <p className="text-white font-bold">Prima total</p>
                  <p className="text-white font-black text-2xl tabular-nums">
                    {fmt$(total)}
                  </p>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleGuardar}
                disabled={isGuardando}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-[#13193a] text-sm font-bold text-[#13193a] hover:bg-[#13193a]/5 transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4 shrink-0" />
                {isGuardando ? "Guardando..." : "Guardar cotización"}
              </button>

              <button
                onClick={handleEmitir}
                disabled={
                  !form.clienteId ||
                  !form.vehiculoAmisId ||
                  !fechaInicioValida ||
                  isEmitting
                }
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#13193a]/15"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {isEmitting ? "Emitiendo..." : "Emitir póliza"}
              </button>
            </div>
          </div>
        )}

        {/* Navegación */}
        {paso !== 5 && (
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
            <div className="flex flex-col items-start gap-2">
              {paso > 1 ? (
                <button
                  onClick={() => setPaso((p) => p - 1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
              ) : (
                <button
                  onClick={onCancelar}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
              )}
            </div>
            <button
              onClick={async () => {
                if (paso === 2 && serieError) {
                  await Swal.fire({
                    icon: "error",
                    title: "No. Serie duplicado",
                    text: serieError,
                    confirmButtonColor: "#13193a",
                    confirmButtonText: "Entendido",
                  });
                  return;
                }
                setPaso((p) => p + 1);
              }}
              disabled={!canNext[paso]}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 transition-all shadow-sm shadow-[#13193a]/15"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {modalAseg && (
        <ModalNuevoAsegurado
          onClose={() => setModalAseg(false)}
          onGuardar={onGuardarAsegurado}
          usuarioId={usuario?.id}
        />
      )}
      {modalConc && (
        <ModalNuevoConcesionario
          onClose={() => setModalConc(false)}
          onGuardar={onGuardarConcesionario}
          clienteId={form.clienteId}
          usuarioId={usuario?.id}
        />
      )}
      {modalVend && (
        <ModalNuevoVendedor
          onClose={() => setModalVend(false)}
          onGuardar={onGuardarVendedor}
          usuarioId={usuario?.id}
        />
      )}
    </div>
  );
}
