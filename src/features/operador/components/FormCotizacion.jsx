import { useState, useEffect, useRef } from "react";
import {
  OFICINA,
  COBERTURA_BASICA,
  PRECIO_MATRIZ,
  DERECHOS,
} from "../constants/cobertura";
import { fetchClientes } from "../../../services/clientes";
import { fetchVendedores } from "../../../services/vendedores";
import { emitirPoliza, numeroALetras } from "../../../services/polizas";
import {
  getAnios,
  getMarcas,
  getModelos,
  getVersiones,
  getCodigoAmis,
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
    `COT-${OFICINA.codigo}${Date.now().toString().slice(-6)}`;
  const [paso, setPaso] = useState(esEdicion ? 4 : 1);

  const [form, setForm] = useState({
    codAMIS: cotizacionInicial?.codAMIS ?? "",
    marca: cotizacionInicial?.marca ?? "",
    tipoVehiculo: cotizacionInicial?.tipoVehiculo ?? "",
    version: cotizacionInicial?.version ?? "",
    modelo: cotizacionInicial?.modelo ?? String(new Date().getFullYear()),
    serie: cotizacionInicial?.serie ?? "",
    motor: cotizacionInicial?.motor ?? "",
    placas: cotizacionInicial?.placas ?? "",
    conductorHabitual: cotizacionInicial?.conductorHabitual ?? "",
    conductorSexo: cotizacionInicial?.conductorSexo ?? "",
    conductorEdad: cotizacionInicial?.conductorEdad ?? "",
    clienteId: cotizacionInicial?.clienteId ?? null,
    vendedorId: cotizacionInicial?.vendedorId ?? null,
    concesionario: cotizacionInicial?.concesionario ?? "",
    fechaInicio: cotizacionInicial?.fechaInicio ?? "",
    formaPago: cotizacionInicial?.formaPago ?? "CONTADO",
    esGestor: cotizacionInicial?.esGestor ?? false,
    cobertura: "BÁSICA",
  });
  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // ── Datos DB ──
  const [clientes, setClientes] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [concesionariosLocal, setConcesionariosLocal] = useState({});
  const [loadingDB, setLoadingDB] = useState(true);
  const [isEmitting, setIsEmitting] = useState(false);
  const [modalAseg, setModalAseg] = useState(false);
  const [modalConc, setModalConc] = useState(false);
  const [modalVend, setModalVend] = useState(false);
  const [amisError, setAmisError] = useState(false);

  // "auto"    → el código lo genera el sistema al completar los campos
  // "busqueda" → el usuario escribió el código primero
  const amisFuente = useRef("auto");

  useEffect(() => {
    Promise.all([fetchClientes(), fetchVendedores()])
      .then(([cls, vds]) => {
        setClientes(cls);
        setVendedores(vds);
      })
      .catch(console.error)
      .finally(() => setLoadingDB(false));
  }, []);

  // ── Auto-relleno AMIS cuando los 4 campos del vehículo están completos ────
  useEffect(() => {
    if (amisFuente.current === "busqueda") return;
    const codigo = getCodigoAmis(
      form.modelo,
      form.marca,
      form.tipoVehiculo,
      form.version,
    );
    setF("codAMIS", codigo);
    setAmisError(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.modelo, form.marca, form.tipoVehiculo, form.version]);

  // ── Catálogo vehículos — sincrónico, sin API ──────────────────────────────
  const marcasDisp = getMarcas(form.modelo); // filtradas por año
  const modelosDisp = getModelos(form.marca, form.modelo); // filtrados por año+marca
  const versionesDisp = getVersiones(form.marca, form.tipoVehiculo); // por marca+modelo

  const handleAnio = (e) => {
    amisFuente.current = "auto";
    const anio = e.target.value;
    const marcasValidas = getMarcas(anio);
    if (!marcasValidas.includes(form.marca)) {
      setForm((f) => ({
        ...f,
        modelo: anio,
        marca: "",
        tipoVehiculo: "",
        version: "",
      }));
    } else {
      const modelosValidos = getModelos(form.marca, anio);
      if (!modelosValidos.includes(form.tipoVehiculo)) {
        setForm((f) => ({ ...f, modelo: anio, tipoVehiculo: "", version: "" }));
      } else {
        setF("modelo", anio);
      }
    }
  };

  const handleMarca = (e) => {
    amisFuente.current = "auto";
    setForm((f) => ({
      ...f,
      marca: e.target.value,
      tipoVehiculo: "",
      version: "",
    }));
  };

  const handleModeloVeh = (e) => {
    amisFuente.current = "auto";
    setForm((f) => ({ ...f, tipoVehiculo: e.target.value, version: "" }));
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

    // 4 dígitos completos → intentar lookup
    const v = getVehiculoPorAmis(val);
    if (v) {
      amisFuente.current = "busqueda";
      setForm((f) => ({
        ...f,
        codAMIS: val,
        modelo: v.anio,
        marca: v.marca,
        tipoVehiculo: v.modelo,
        version: v.version,
      }));
    } else {
      amisFuente.current = "busqueda";
      setAmisError(true);
      setF("codAMIS", val);
    }
  };

  // ── Helpers ──
  const clienteSel = clientes.find((c) => c.id === form.clienteId) ?? null;
  const vendedorSel = vendedores.find((v) => v.id === form.vendedorId) ?? null;
  const clienteLabel = clienteSel
    ? `${clienteSel.nombre} ${clienteSel.apellido || ""}`.trim()
    : "—";
  const vendedorLabel = vendedorSel
    ? `${vendedorSel.nombre} ${vendedorSel.apellido || ""}`.trim()
    : "—";

  const concesionariosDisponibles = form.clienteId
    ? (concesionariosLocal[form.clienteId] ?? [])
    : [];
  const concLabel =
    concesionariosDisponibles.find((c) => c.id === form.concesionario)?.label ??
    (form.concesionario || "—");

  const todayStr = new Date().toISOString().split("T")[0];
  const maxDateStr = new Date(Date.now() + 29 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const fechaInicioValida = !!(
    form.fechaInicio &&
    form.fechaInicio >= todayStr &&
    form.fechaInicio <= maxDateStr
  );

  const tierKey = form.esGestor ? "gestor" : "normal";
  const precioData =
    PRECIO_MATRIZ[tierKey][form.formaPago] ?? PRECIO_MATRIZ[tierKey]["CONTADO"];
  const total = precioData.total;
  const primerPago = precioData.primerPago;
  const pagoSubs = precioData.pagoSubs;
  const nSubs = precioData.nSubs;
  const subtotal = +(total / 1.16).toFixed(2);
  const iva = +(total - subtotal).toFixed(2);
  const primaNeta = +(subtotal - DERECHOS).toFixed(2);

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

  const canNext = {
    1: !!(
      form.codAMIS.trim() &&
      form.marca &&
      form.tipoVehiculo &&
      form.version.trim() &&
      form.modelo &&
      form.serie.trim() &&
      form.motor.trim() &&
      form.placas.trim()
    ),
    2: !!(form.clienteId && form.vendedorId && fechaInicioValida),
    3: true,
  };

  const onGuardarAsegurado = (clienteObj) => {
    setClientes((cs) => [...cs, clienteObj]);
    setF("clienteId", clienteObj.id);
    setF("concesionario", "");
    setModalAseg(false);
  };

  const onGuardarVendedor = (vendedorObj) => {
    setVendedores((vs) => [...vs, vendedorObj]);
    setF("vendedorId", vendedorObj.id);
    setModalVend(false);
  };

  const onGuardarConcesionario = (labelVal) => {
    const id = `C${Date.now()}`;
    setConcesionariosLocal((prev) => ({
      ...prev,
      [form.clienteId]: [
        ...(prev[form.clienteId] ?? []),
        { id, label: labelVal },
      ],
    }));
    setF("concesionario", id);
    setModalConc(false);
  };

  const handleEmitir = async () => {
    if (!form.clienteId || !form.marca || !fechaInicioValida || isEmitting)
      return;
    setIsEmitting(true);
    try {
      const enLetras = numeroALetras(total);
      const poliza = await emitirPoliza({
        clienteId: form.clienteId,
        vendedorId: form.vendedorId || null,
        marca: form.marca,
        modelo: form.tipoVehiculo,
        anio: form.modelo,
        serie: form.serie,
        numMotor: form.motor,
        placas: form.placas,
        codAmis: form.codAMIS,
        capacidad: "4 OCUPANTES",
        version: form.version,
        uso: "SERVICIO PUBLICO",
        tipoServicio: "TAXI",
        primaNeta,
        primaTotal: total,
        formaPago: form.formaPago,
        fechaInicio: form.fechaInicio,
        derechos: DERECHOS,
        iva,
        enLetras,
        cpAsegurado: clienteSel?.cp || null,
        conductorHabitual: form.conductorHabitual || null,
        conductorSexo: form.conductorSexo || null,
        conductorEdad: form.conductorEdad || null,
        creadoPor: usuario?.id,
      });
      onTramitar(poliza);
    } catch (e) {
      alert("Error al emitir póliza: " + e.message);
    } finally {
      setIsEmitting(false);
    }
  };

  const handleGuardar = () => {
    onGuardar({
      id: nroCot,
      ...form,
      total,
      fecha: `${fechaHoy} ${horaHoy}`,
      cliente: clienteLabel,
      vendedor: vendedorLabel,
      cobertura: COBERTURA_BASICA.nombre,
    });
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
              {OFICINA.nombre}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <StepBar paso={paso} />

        {/* ── PASO 1: Vehículo ── */}
        {paso === 1 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#13193a]">
                1. Datos del vehículo
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
                  onChange={(e) => setF("serie", e.target.value.toUpperCase())}
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

            {/* Conductor habitual — sección opcional */}
            <div className="border-t border-gray-100 pt-5">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                Conductor habitual{" "}
                <span className="normal-case font-normal text-gray-300">
                  (opcional)
                </span>
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={lblCls}>Nombre del conductor</label>
                  <input
                    value={form.conductorHabitual}
                    onChange={(e) => setF("conductorHabitual", e.target.value)}
                    placeholder="Nombre completo"
                    className={inpCls}
                  />
                </div>
                <div>
                  <label className={lblCls}>Sexo</label>
                  <select
                    value={form.conductorSexo}
                    onChange={(e) => setF("conductorSexo", e.target.value)}
                    className={inpCls}
                  >
                    <option value="">Sin especificar</option>
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMENINO">Femenino</option>
                  </select>
                </div>
                <div>
                  <label className={lblCls}>Edad</label>
                  <input
                    type="number"
                    min="18"
                    max="99"
                    value={form.conductorEdad}
                    onChange={(e) => setF("conductorEdad", e.target.value)}
                    placeholder="Años"
                    className={inpCls}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PASO 2: Cotización ── */}
        {paso === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#13193a]">
                2. Datos de cotización
              </h3>
              <p className="text-sm text-gray-400 mt-0.5">
                Información del asegurado y condiciones de la póliza
              </p>
            </div>

            <div>
              <label className={lblCls}>Vendedor {req}</label>
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
                    .filter((v) => v.activo)
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
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                </button>
              </div>
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
                      setF("concesionario", "");
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
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <label className={lblCls}>Concesionario</label>
                <div className="flex gap-2">
                  <select
                    value={form.concesionario}
                    onChange={(e) => setF("concesionario", e.target.value)}
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
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
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
                  min={todayStr}
                  max={maxDateStr}
                  className={inpCls}
                />
                {form.fechaInicio && !fechaInicioValida && (
                  <p className="text-xs text-red-500 mt-1">
                    La fecha debe estar entre hoy y los próximos 30 días.
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

        {/* ── PASO 3: Coberturas ── */}
        {paso === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#13193a]">
                3. Coberturas
              </h3>
              <p className="text-sm text-gray-400 mt-0.5">
                Paquete de cobertura para servicio público de taxi
              </p>
            </div>

            <div className="border-2 border-[#13193a] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 bg-[#13193a]">
                <div>
                  <p className="font-bold text-sm text-white">
                    {COBERTURA_BASICA.nombre}
                  </p>
                  <p className="text-xs mt-0.5 text-white/60">
                    Uso: {COBERTURA_BASICA.uso}
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
                    {COBERTURA_BASICA.coberturas.map((c, i) => (
                      <tr key={i} className="hover:bg-gray-50/60">
                        <td className="px-4 py-2.5 text-gray-700 font-medium">
                          {c.desc}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-600 font-semibold">
                          {c.monto}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-400">
                          {c.ded}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── PASO 4: Resumen ── */}
        {paso === 4 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#13193a]">4. Resumen</h3>
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
                  onClick={() => setPaso(2)}
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
                  { l: "Cobertura", v: COBERTURA_BASICA.nombre },
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
                  onClick={() => setPaso(1)}
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
                  onClick={() => setPaso(3)}
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
                    {COBERTURA_BASICA.coberturas.map((c, i) => (
                      <tr key={i} className="hover:bg-gray-50/60">
                        <td className="px-4 py-2.5 text-gray-700 font-medium">
                          {c.desc}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-600 font-semibold">
                          {c.monto}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-400">
                          {c.ded}
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
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-[#13193a] text-sm font-bold text-[#13193a] hover:bg-[#13193a]/5 transition-all"
              >
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 16v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2M14 12l-4 4m0 0L6 12m4 4V4"
                  />
                </svg>
                Guardar cotización
              </button>

              <button
                onClick={handleEmitir}
                disabled={
                  !form.clienteId ||
                  !form.marca ||
                  !fechaInicioValida ||
                  isEmitting
                }
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#13193a]/15"
              >
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {isEmitting ? "Emitiendo..." : "Emitir póliza"}
              </button>
            </div>
          </div>
        )}

        {/* Navegación */}
        {paso !== 4 && (
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
            <div className="flex flex-col items-start gap-2">
              {paso > 1 ? (
                <button
                  onClick={() => setPaso((p) => p - 1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 19.5L8.25 12l7.5-7.5"
                    />
                  </svg>
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
              onClick={() => setPaso((p) => p + 1)}
              disabled={!canNext[paso]}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 transition-all shadow-sm shadow-[#13193a]/15"
            >
              Siguiente
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
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
