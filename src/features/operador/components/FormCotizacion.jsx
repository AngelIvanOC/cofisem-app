import { useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import PolizaPDF, { mockPoliza } from "../../../components/pdf/PolizaPDF";
import { OFICINA, COBERTURA_BASICA, PRECIO_MATRIZ, DERECHOS } from "../constants/cobertura";
import { CATALOGO_VEHICULOS, MARCAS, CLIENTES_MOCK_NAMES, VENDEDORES_MOCK_NAMES, CONCESIONARIOS_MOCK } from "../constants/catalogos";
import { fmt$ } from "../utils/fmt";
import StepBar from "./StepBar";
import ModalNuevoAsegurado from "./ModalNuevoAsegurado";
import ModalNuevoConcesionario from "./ModalNuevoConcesionario";

const inpCls = "w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all";
const roCls  = "w-full px-3 py-2 rounded-xl border border-gray-100 bg-gray-50 text-sm font-semibold text-[#13193a] cursor-default";
const lblCls = "block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5";

export default function FormCotizacion({ cotizacionInicial, onGuardar, onTramitar, onCancelar }) {
  const esEdicion = !!cotizacionInicial;
  const nroCot = cotizacionInicial?.id ?? `COT-${OFICINA.codigo}01${Date.now().toString().slice(-6)}`;
  const [paso, setPaso] = useState(esEdicion ? 4 : 1);

  const [form, setForm] = useState({
    cpAsegurado:   cotizacionInicial?.cpAsegurado   ?? "",
    codAMIS:       cotizacionInicial?.codAMIS       ?? "",
    marca:         cotizacionInicial?.marca         ?? "",
    tipoVehiculo:  cotizacionInicial?.tipoVehiculo  ?? "",
    version:       cotizacionInicial?.version       ?? "",
    modelo:        cotizacionInicial?.modelo        ?? String(new Date().getFullYear()),
    serie:         cotizacionInicial?.serie         ?? "",
    motor:         cotizacionInicial?.motor         ?? "",
    placas:        cotizacionInicial?.placas        ?? "",
    color:         cotizacionInicial?.color         ?? "Blanco",
    capacidad:     "4",
    cliente:       cotizacionInicial?.cliente       ?? "",
    concesionario: cotizacionInicial?.concesionario ?? "",
    vendedor:      cotizacionInicial?.vendedor      ?? VENDEDORES_MOCK_NAMES[0],
    fechaInicio:   cotizacionInicial?.fechaInicio   ?? "",
    formaPago:     cotizacionInicial?.formaPago     ?? "CONTADO",
    esGestor:      cotizacionInicial?.esGestor      ?? false,
    cobertura:     "BÁSICA",
  });
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const [clientesLocal,       setClientesLocal]       = useState(CLIENTES_MOCK_NAMES);
  const [concesionariosLocal, setConcesionariosLocal] = useState(CONCESIONARIOS_MOCK);
  const [modalAseg, setModalAseg] = useState(false);
  const [modalConc, setModalConc] = useState(false);

  const tiposDisponibles     = form.marca ? Object.keys(CATALOGO_VEHICULOS[form.marca] ?? {}) : [];
  const versionesDisponibles = form.marca && form.tipoVehiculo
    ? (CATALOGO_VEHICULOS[form.marca]?.[form.tipoVehiculo] ?? []) : [];
  const concesionariosDisponibles = form.cliente ? (concesionariosLocal[form.cliente] ?? []) : [];

  const todayStr   = new Date().toISOString().split("T")[0];
  const maxDateStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const fechaInicioValida = !!(form.fechaInicio && form.fechaInicio >= todayStr && form.fechaInicio <= maxDateStr);

  const tierKey    = form.esGestor ? "gestor" : "normal";
  const precioData = PRECIO_MATRIZ[tierKey][form.formaPago] ?? PRECIO_MATRIZ[tierKey]["CONTADO"];
  const total      = precioData.total;
  const primerPago = precioData.primerPago;
  const pagoSubs   = precioData.pagoSubs;
  const nSubs      = precioData.nSubs;
  const subtotal   = +(total / 1.16).toFixed(2);
  const iva        = +(total - subtotal).toFixed(2);
  const primaNeta  = +(subtotal - DERECHOS).toFixed(2);

  const fechaHoy = new Date().toLocaleDateString("es-MX", { day:"2-digit", month:"2-digit", year:"numeric" });
  const horaHoy  = new Date().toLocaleTimeString("es-MX", { hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false });

  const fechaFinVigencia = form.fechaInicio
    ? (() => {
        const d = new Date(form.fechaInicio + "T12:00:00");
        d.setFullYear(d.getFullYear() + 1);
        return d.toLocaleDateString("es-MX", { day:"2-digit", month:"2-digit", year:"numeric" });
      })()
    : "—";

  const fechaInicioFmt = form.fechaInicio
    ? new Date(form.fechaInicio + "T12:00:00").toLocaleDateString("es-MX", { day:"2-digit", month:"2-digit", year:"numeric" })
    : "—";

  const concLabel = concesionariosDisponibles.find(c => c.id === form.concesionario)?.label
    ?? (form.concesionario || "—");

  const canNext = {
    1: !!(form.marca && form.tipoVehiculo && form.version && form.modelo),
    2: !!(form.cliente && form.vendedor && fechaInicioValida),
    3: true,
  };

  const onGuardarAsegurado = (nombre) => {
    setClientesLocal(cs => [...cs, nombre]);
    setF("cliente", nombre);
    setF("concesionario", "");
    setModalAseg(false);
  };

  const onGuardarConcesionario = (labelVal) => {
    const id = `C${Date.now()}`;
    setConcesionariosLocal(prev => ({
      ...prev,
      [form.cliente]: [...(prev[form.cliente] ?? []), { id, label: labelVal }],
    }));
    setF("concesionario", id);
    setModalConc(false);
  };

  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="bg-[#13193a] rounded-2xl px-5 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div><p className="text-white/40 mb-0.5">No. Cotización</p><p className="text-white font-mono font-bold">{nroCot}</p></div>
          <div><p className="text-white/40 mb-0.5">Fecha emisión</p><p className="text-white font-semibold">{fechaHoy}</p></div>
          <div><p className="text-white/40 mb-0.5">Hora</p><p className="text-white font-semibold">{horaHoy} hrs.</p></div>
          <div><p className="text-white/40 mb-0.5">Punto de venta</p><p className="text-white font-semibold truncate">{OFICINA.nombre}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <StepBar paso={paso} />

        {/* ── PASO 1: Vehículo ── */}
        {paso === 1 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#13193a]">1. Datos del vehículo</h3>
              <p className="text-sm text-gray-400 mt-0.5">Información del vehículo a asegurar</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lblCls}>C.P. del asegurado</label>
                <input value={form.cpAsegurado} onChange={e => setF("cpAsegurado", e.target.value)}
                  placeholder="62000" maxLength={5} className={inpCls} />
              </div>
              <div>
                <label className={lblCls}>Cód. AMIS</label>
                <input value={form.codAMIS} onChange={e => setF("codAMIS", e.target.value)}
                  placeholder="Código AMIS" className={inpCls} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={lblCls}>Marca <span className="text-red-400">*</span></label>
                <select value={form.marca}
                  onChange={e => setForm(f => ({ ...f, marca: e.target.value, tipoVehiculo:"", version:"" }))}
                  className={inpCls}>
                  <option value="">Selecciona marca</option>
                  {MARCAS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className={lblCls}>Tipo <span className="text-red-400">*</span></label>
                <select value={form.tipoVehiculo}
                  onChange={e => setForm(f => ({ ...f, tipoVehiculo: e.target.value, version:"" }))}
                  disabled={!form.marca}
                  className={inpCls + (!form.marca ? " opacity-50 cursor-not-allowed" : "")}>
                  <option value="">{form.marca ? "Selecciona tipo" : "Elige marca primero"}</option>
                  {tiposDisponibles.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={lblCls}>Versión <span className="text-red-400">*</span></label>
                <select value={form.version} onChange={e => setF("version", e.target.value)}
                  disabled={!form.tipoVehiculo}
                  className={inpCls + (!form.tipoVehiculo ? " opacity-50 cursor-not-allowed" : "")}>
                  <option value="">{form.tipoVehiculo ? "Selecciona versión" : "Elige tipo primero"}</option>
                  {versionesDisponibles.map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className={lblCls}>Modelo (año) <span className="text-red-400">*</span></label>
                <input value={form.modelo} onChange={e => setF("modelo", e.target.value)}
                  placeholder={String(new Date().getFullYear())} maxLength={4} className={inpCls} />
              </div>
              <div>
                <label className={lblCls}>No. de Serie (VIN)</label>
                <input value={form.serie} onChange={e => setF("serie", e.target.value.toUpperCase())}
                  placeholder="17 caracteres" maxLength={17} className={inpCls} />
              </div>
              <div>
                <label className={lblCls}>No. Motor</label>
                <input value={form.motor} onChange={e => setF("motor", e.target.value.toUpperCase())}
                  placeholder="No. de motor" className={inpCls} />
              </div>
              <div>
                <label className={lblCls}>Placas</label>
                <input value={form.placas} onChange={e => setF("placas", e.target.value.toUpperCase())}
                  placeholder="ABC-123" className={inpCls} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={lblCls}>Color</label>
                <input readOnly value="Blanco" className={roCls} />
              </div>
              <div>
                <label className={lblCls}>Capacidad (pasajeros)</label>
                <input readOnly value="4" className={roCls} />
              </div>
              <div>
                <label className={lblCls}>Uso del vehículo</label>
                <input readOnly value="SERVICIO PÚBLICO" className={roCls} />
              </div>
            </div>
          </div>
        )}

        {/* ── PASO 2: Cotización ── */}
        {paso === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#13193a]">2. Datos de cotización</h3>
              <p className="text-sm text-gray-400 mt-0.5">Información del asegurado y condiciones de la póliza</p>
            </div>

            <div>
              <label className={lblCls}>Vendedor <span className="text-red-400">*</span></label>
              <select value={form.vendedor} onChange={e => setF("vendedor", e.target.value)} className={inpCls}>
                {VENDEDORES_MOCK_NAMES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lblCls}>Asegurado <span className="text-red-400">*</span></label>
                <div className="flex gap-2">
                  <select value={form.cliente}
                    onChange={e => { setF("cliente", e.target.value); setF("concesionario", ""); }}
                    className={inpCls + " flex-1"}>
                    <option value="">Seleccione un asegurado</option>
                    {clientesLocal.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <button type="button" onClick={() => setModalAseg(true)}
                    className="shrink-0 w-10 h-10 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white flex items-center justify-center transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                </div>
              </div>
              <div>
                <label className={lblCls}>Concesionario</label>
                <div className="flex gap-2">
                  <select value={form.concesionario} onChange={e => setF("concesionario", e.target.value)}
                    disabled={!form.cliente}
                    className={inpCls + " flex-1" + (!form.cliente ? " opacity-50 cursor-not-allowed" : "")}>
                    <option value="">
                      {form.cliente
                        ? (concesionariosDisponibles.length ? "Selecciona concesionario" : "Sin concesionarios")
                        : "Elige asegurado primero"}
                    </option>
                    {concesionariosDisponibles.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                  <button type="button" onClick={() => setModalConc(true)} disabled={!form.cliente}
                    className="shrink-0 w-10 h-10 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white flex items-center justify-center transition-all disabled:opacity-40">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lblCls}>Inicio de vigencia <span className="text-red-400">*</span></label>
                <input type="date" value={form.fechaInicio}
                  onChange={e => setF("fechaInicio", e.target.value)}
                  min={todayStr} max={maxDateStr} className={inpCls} />
                {form.fechaInicio && !fechaInicioValida && (
                  <p className="text-xs text-red-500 mt-1">La fecha debe estar entre hoy y los próximos 30 días.</p>
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
                <select value={form.formaPago} onChange={e => setF("formaPago", e.target.value)} className={inpCls}>
                  {["CONTADO","4 PARCIALES"].map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div className="flex flex-col justify-end">
                <label className={lblCls}>Tipo de cliente</label>
                <div className="flex items-center gap-3 h-[38px]">
                  <button type="button" onClick={() => setF("esGestor", !form.esGestor)}
                    className={["relative w-11 h-6 rounded-full transition-colors focus:outline-none",
                      form.esGestor ? "bg-[#13193a]" : "bg-gray-200"].join(" ")}>
                    <span className={["absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                      form.esGestor ? "translate-x-5" : "translate-x-0"].join(" ")} />
                  </button>
                  <span className="text-sm font-semibold text-gray-700">{form.esGestor ? "Gestor" : "Normal"}</span>
                  <span className="text-xs text-gray-400">{form.esGestor ? "(volumen alto)" : "(póliza individual)"}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Prima estimada: </span>
                <span className="font-black text-base">{fmt$(total)}</span>
                {form.formaPago === "4 PARCIALES" && (
                  <span className="text-xs text-blue-600 ml-2">
                    (1er pago {fmt$(primerPago)}, después {nSubs}×{fmt$(pagoSubs)})
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
              <h3 className="text-base font-bold text-[#13193a]">3. Coberturas</h3>
              <p className="text-sm text-gray-400 mt-0.5">Paquete de cobertura para servicio público de taxi</p>
            </div>

            <div className="border-2 border-[#13193a] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 bg-[#13193a]">
                <div>
                  <p className="font-bold text-sm text-white">{COBERTURA_BASICA.nombre}</p>
                  <p className="text-xs mt-0.5 text-white/60">Uso: {COBERTURA_BASICA.uso}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wide text-white/60">Prima total</p>
                  <p className="font-black text-xl tabular-nums text-white">{fmt$(total)}</p>
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
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">Cobertura</th>
                      <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">Suma asegurada</th>
                      <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">Ded.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {COBERTURA_BASICA.coberturas.map((c, i) => (
                      <tr key={i} className="hover:bg-gray-50/60">
                        <td className="px-4 py-2.5 text-gray-700 font-medium">{c.desc}</td>
                        <td className="px-4 py-2.5 text-right text-gray-600 font-semibold">{c.monto}</td>
                        <td className="px-4 py-2.5 text-right text-gray-400">{c.ded}</td>
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
              <p className="text-sm text-gray-400 mt-0.5">Revisa todos los datos antes de guardar o tramitar</p>
            </div>

            {/* Características */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Características de la póliza</p>
                <button onClick={() => setPaso(2)} className="text-xs text-blue-500 hover:underline font-semibold">Editar</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                {[
                  { l:"No. cotización",    v: nroCot },
                  { l:"Vendedor",          v: form.vendedor },
                  { l:"Asegurado",         v: form.cliente || "—" },
                  { l:"Concesionario",     v: concLabel },
                  { l:"Tipo de cliente",   v: form.esGestor ? "Gestor" : "Normal" },
                  { l:"Cobertura",         v: COBERTURA_BASICA.nombre },
                  { l:"Modalidad de pago", v: form.formaPago },
                  { l:"Inicio de vigencia",v: fechaInicioFmt },
                  { l:"Fin de vigencia",   v: fechaFinVigencia },
                ].map(({ l, v }) => (
                  <div key={l}>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">{l}</p>
                    <p className="font-semibold text-[#13193a] text-xs leading-snug">{v}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-500">Prima total</p>
                <p className="text-3xl font-black text-[#13193a] tabular-nums">{fmt$(total)}</p>
              </div>
            </div>

            {/* Vehículo */}
            {(form.marca || form.serie || form.placas) && (
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Datos del vehículo</p>
                  <button onClick={() => setPaso(1)} className="text-xs text-blue-500 hover:underline font-semibold">Editar</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
                  {[
                    { l:"Marca",     v: form.marca         || "—" },
                    { l:"Tipo",      v: form.tipoVehiculo  || "—" },
                    { l:"Versión",   v: form.version       || "—" },
                    { l:"Modelo",    v: form.modelo        || "—" },
                    { l:"No. Serie", v: form.serie         || "—" },
                    { l:"No. Motor", v: form.motor         || "—" },
                    { l:"Placas",    v: form.placas        || "—" },
                    { l:"Color",     v: form.color         || "—" },
                    { l:"Capacidad", v: `${form.capacidad} pasajeros` },
                    { l:"C.P.",      v: form.cpAsegurado   || "—" },
                    { l:"Cód. AMIS", v: form.codAMIS       || "—" },
                  ].map(({ l, v }) => (
                    <div key={l}>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">{l}</p>
                      <p className="font-semibold text-[#13193a] text-xs">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Coberturas */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Coberturas</p>
                <button onClick={() => setPaso(3)} className="text-xs text-blue-500 hover:underline font-semibold">Ver</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">Cobertura</th>
                      <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">Suma asegurada</th>
                      <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">Deducible</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {COBERTURA_BASICA.coberturas.map((c, i) => (
                      <tr key={i} className="hover:bg-gray-50/60">
                        <td className="px-4 py-2.5 text-gray-700 font-medium">{c.desc}</td>
                        <td className="px-4 py-2.5 text-right text-gray-600 font-semibold">{c.monto}</td>
                        <td className="px-4 py-2.5 text-right text-gray-400">{c.ded}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Desglose */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Desglose de prima total</p>
              </div>
              <div className="p-5 space-y-5">
                {form.formaPago === "4 PARCIALES" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Primer pago</p>
                      <p className="text-sm font-bold text-[#13193a]">{fmt$(primerPago)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Pagos subsecuentes (×{nSubs})</p>
                      <p className="text-sm font-bold text-[#13193a]">{fmt$(pagoSubs)}</p>
                    </div>
                  </div>
                )}
                <div className="divide-y divide-gray-100 text-sm border border-gray-100 rounded-xl overflow-hidden">
                  {[
                    { l:"Prima neta",           v: primaNeta, bold: false },
                    { l:"Derechos / Expedición", v: DERECHOS,  bold: false },
                    { l:"Subtotal",              v: subtotal,  bold: true  },
                    { l:"I.V.A. (16%)",          v: iva,       bold: false },
                  ].map(({ l, v, bold }) => (
                    <div key={l} className={`flex justify-between items-center px-4 py-3 ${bold ? "bg-gray-50 font-bold" : "bg-white"}`}>
                      <span className={bold ? "text-[#13193a]" : "text-gray-500"}>{l}</span>
                      <span className={`tabular-nums ${bold ? "text-[#13193a]" : "text-gray-700"}`}>{fmt$(v)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between bg-[#13193a] rounded-xl px-5 py-4">
                  <p className="text-white font-bold">Prima total</p>
                  <p className="text-white font-black text-2xl tabular-nums">{fmt$(total)}</p>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <PDFDownloadLink
                document={<PolizaPDF poliza={mockPoliza} />}
                fileName={`cotizacion-${nroCot}.pdf`}
                style={{ flex: 1, textDecoration: "none" }}
              >
                {({ loading }) => (
                  <span className="flex w-full items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-[#13193a] text-sm font-bold text-[#13193a] hover:bg-[#13193a]/5 transition-all cursor-pointer select-none">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    {loading ? "Generando…" : "Descargar PDF"}
                  </span>
                )}
              </PDFDownloadLink>

              <button
                disabled={!form.cliente}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-[#13193a] text-sm font-bold text-[#13193a] hover:bg-[#13193a]/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
                Enviar
              </button>

              <button
                onClick={() => onTramitar({ id:nroCot, ...form, total, fecha:`${fechaHoy} ${horaHoy}` })}
                disabled={!form.cliente || !form.marca || !fechaInicioValida}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#13193a]/15"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Emitir
              </button>
            </div>
          </div>
        )}

        {/* Navegación */}
        {paso !== 4 && (
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
            <div>
              {paso > 1 ? (
                <button onClick={() => setPaso(p => p - 1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                  Anterior
                </button>
              ) : (
                <button onClick={onCancelar}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                  Cancelar
                </button>
              )}
            </div>
            <button onClick={() => setPaso(p => p + 1)} disabled={!canNext[paso]}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 transition-all shadow-sm shadow-[#13193a]/15">
              Siguiente
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {modalAseg && (
        <ModalNuevoAsegurado onClose={() => setModalAseg(false)} onGuardar={onGuardarAsegurado} />
      )}
      {modalConc && (
        <ModalNuevoConcesionario onClose={() => setModalConc(false)} onGuardar={onGuardarConcesionario} />
      )}
    </div>
  );
}
