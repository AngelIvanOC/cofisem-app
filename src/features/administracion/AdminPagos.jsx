import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../supabaseClient";
import {
  fetchTodasVersionesConfig,
  configParaFecha,
} from "../../services/configuracion";
import { usePagination } from "../../hooks/usePagination";
import Paginator from "../../components/Paginator";
import { mapCuota, construirPolizaRecibo, abrirRecibo } from "../../utils/recibo";
import StatusBadge from "../operador/components/StatusBadge";

const ESTATUS_BLOQUEADOS = ["CANCELADA", "VENCIDA", "ANULADA"];
import {
  Banknote,
  Check,
  Clock,
  Eye,
  Loader2,
  Lock,
  Receipt,
  Search,
  X,
} from "lucide-react";

function fmt$(n) {
  return `$${Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
}

// Estatus efectivo de una cuota para display
function estatusEfectivo(cuota) {
  if (cuota.estatus === "PAGADO") return "PAGADO";
  if (cuota.estatus === "ADEUDO") return "ADEUDO";
  const vto = new Date(cuota.vto.split("/").reverse().join("-") + "T12:00:00");
  if (vto < new Date()) return "VENCIDO";
  return "PENDIENTE";
}

function CuotaBadge({ cuota }) {
  const est = estatusEfectivo(cuota);
  const map = {
    PAGADO: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ADEUDO: "bg-blue-50 text-blue-700 border-blue-200",
    VENCIDO: "bg-red-50 text-red-600 border-red-200",
    PENDIENTE: "bg-amber-50 text-amber-700 border-amber-200",
  };
  const labels = {
    PAGADO: "Pagado",
    ADEUDO: "Adeudo",
    VENCIDO: "Vencida",
    PENDIENTE: "Pendiente",
  };
  return (
    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${map[est]}`}>
      {labels[est]}
    </span>
  );
}

// ── Modal: recibir un pago pendiente (crea el ADEUDO) ───────────
function ModalRecibirPago({ poliza, cuota, onClose, onRecibir }) {
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [monto, setMonto] = useState(cuota.monto.toFixed(2));
  const [enviando, setEnviando] = useState(false);

  const handleRecibir = async () => {
    setEnviando(true);
    try {
      await onRecibir({
        cuotaId: cuota.id,
        polizaId: poliza.polizaId,
        fecha,
        monto: parseFloat(monto),
      });
    } catch (e) {
      alert("Error al confirmar pago: " + e.message);
      setEnviando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(10,15,40,0.55)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-bold text-[#13193a]">Recibir pago</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Cuota {cuota.num} · Póliza <span className="font-mono">{poliza.id}</span>
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Asegurado</span>
              <span className="font-semibold text-[#13193a]">{poliza.asegurado}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Cuota</span>
              <span className="font-semibold text-[#13193a]">
                {cuota.num} de {poliza.formaPago === "CONTADO" ? 1 : 4}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Fecha límite</span>
              <span className="font-semibold text-amber-700">{cuota.vto}</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              Monto recibido
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              Fecha de recepción
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]"
            />
          </div>

          <p className="text-[11px] text-gray-400 text-center">
            El pago quedará como <strong>ADEUDO</strong> hasta que se aplique.
          </p>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleRecibir}
            disabled={enviando || !monto || !fecha}
            className="flex-1 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#13193a]/15"
          >
            {enviando ? (
              <>
                <Loader2 className="animate-spin w-4 h-4" />
                Confirmando...
              </>
            ) : (
              <>
                <Banknote className="w-4 h-4" />
                Recibir
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal: cuotas de una póliza (recibir + aplicar + recibo) ────
function ModalCuotasPoliza({ poliza, onClose, onRecibir, onAplicar, onVerRecibo, aplicando }) {
  const [cuotaSel, setCuotaSel] = useState(null);

  const polizaBloq = ESTATUS_BLOQUEADOS.includes(poliza.estatusPoliza);

  const cuotasCargadas = poliza.cuotas !== null;
  const totalCuotas = poliza.formaPago === "CONTADO" ? 1 : 4;
  const pagadas    = cuotasCargadas ? poliza.cuotas.filter((c) => c.estatus === "PAGADO").length : 0;
  const enAdeudo   = cuotasCargadas ? poliza.cuotas.filter((c) => c.estatus === "ADEUDO").length : 0;
  const cobrado    = cuotasCargadas ? poliza.cuotas.filter((c) => c.estatus === "PAGADO").reduce((s, c) => s + c.monto, 0) : 0;
  const adeudoMonto = cuotasCargadas ? poliza.cuotas.filter((c) => c.estatus === "ADEUDO").reduce((s, c) => s + c.monto, 0) : 0;
  const porCobrar  = cuotasCargadas ? poliza.cuotas.filter((c) => c.estatus === "PENDIENTE").reduce((s, c) => s + c.monto, 0) : 0;

  const primerPendienteId = cuotasCargadas
    ? poliza.cuotas.find((c) => c.estatus === "PENDIENTE")?.id
    : null;

  const diasDesdeEmision = (() => {
    if (!cuotasCargadas) return 0;
    const primera = poliza.cuotas[0]?.vto;
    if (!primera) return 0;
    const [dd, mm, yyyy] = primera.split("/");
    const emision = new Date(`${yyyy}-${mm}-${dd}T12:00:00`);
    const hoy = new Date();
    hoy.setHours(12, 0, 0, 0);
    return Math.floor((hoy - emision) / 86_400_000);
  })();
  const bloqueada = diasDesdeEmision > 45;

  const handleRecibir = async (data) => {
    await onRecibir(data);
    setCuotaSel(null);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(10,15,40,0.55)" }}
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <div>
              <h2 className="text-sm font-bold text-[#13193a]">Pagos y cuotas</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Póliza <span className="font-mono font-bold">{poliza.id}</span> · {poliza.asegurado}
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {!cuotasCargadas ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Forma de pago", value: poliza.formaPago, mono: false },
                    { label: "Cobrado",       value: `$${cobrado.toFixed(2)}`,     mono: true },
                    { label: "En adeudo",     value: `$${adeudoMonto.toFixed(2)}`, mono: true },
                    { label: "Por cobrar",    value: `$${porCobrar.toFixed(2)}`,   mono: true },
                  ].map((f) => (
                    <div key={f.label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{f.label}</p>
                      <p className={`text-sm font-bold ${f.mono ? "font-mono text-[#13193a]" : "text-[#13193a]"}`}>{f.value}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>
                      {pagadas} de {totalCuotas} cuotas cobradas ·{" "}
                      {enAdeudo > 0 ? `${enAdeudo} en adeudo` : ""}
                    </span>
                    <span>{Math.round(((pagadas + enAdeudo) / totalCuotas) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(pagadas / totalCuotas) * 100}%` }} />
                    <div className="h-full bg-blue-400 transition-all" style={{ width: `${(enAdeudo / totalCuotas) * 100}%` }} />
                  </div>
                </div>

                {polizaBloq && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 text-xs font-semibold">
                    <Lock className="w-4 h-4 shrink-0" />
                    Póliza {poliza.estatusPoliza} — no se pueden registrar pagos nuevos
                  </div>
                )}
                {!polizaBloq && bloqueada && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 text-xs font-semibold">
                    <Lock className="w-4 h-4 shrink-0" />
                    Póliza con {diasDesdeEmision} días desde la primera emisión — cobro bloqueado (máx. 45 días)
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Cuotas</p>
                  {poliza.cuotas.map((c) => {
                    const est = estatusEfectivo(c);
                    const mostrarRecibo = c.estatus === "PAGADO" || c.estatus === "ADEUDO" || c.id === primerPendienteId;
                    const esPendiente = c.estatus === "PENDIENTE";
                    const anteriorRecibido =
                      c.num === 1 ||
                      poliza.cuotas.some((p) => p.num === c.num - 1 && p.estatus !== "PENDIENTE");
                    const filaBloqueada = (polizaBloq || bloqueada) && esPendiente;
                    return (
                      <div
                        key={c.id}
                        className={[
                          "flex items-center justify-between gap-3 p-4 rounded-2xl border transition-all",
                          filaBloqueada
                            ? "bg-gray-50 border-gray-200 opacity-60"
                            : c.estatus === "PAGADO"
                              ? "bg-emerald-50/50 border-emerald-100"
                              : c.estatus === "ADEUDO"
                                ? "bg-blue-50/50 border-blue-100"
                                : est === "VENCIDO"
                                  ? "bg-red-50/50 border-red-100"
                                  : "bg-white border-gray-200 hover:border-gray-300",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={[
                              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                              filaBloqueada
                                ? "bg-gray-200 text-gray-400"
                                : c.estatus === "PAGADO"
                                  ? "bg-emerald-500 text-white"
                                  : c.estatus === "ADEUDO"
                                    ? "bg-blue-500 text-white"
                                    : est === "VENCIDO"
                                      ? "bg-red-500 text-white"
                                      : "bg-gray-100 text-gray-600",
                            ].join(" ")}
                          >
                            {c.estatus === "PAGADO" ? (
                              <Check className="w-4 h-4" />
                            ) : c.estatus === "ADEUDO" ? (
                              <Clock className="w-4 h-4" />
                            ) : (
                              c.num
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm font-bold ${filaBloqueada ? "text-gray-400" : "text-[#13193a]"}`}>
                              ${c.monto.toFixed(2)}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <p className="text-xs text-gray-400">Vto. {c.vigencia ?? c.vto}</p>
                              {(c.estatus === "PAGADO" || c.estatus === "ADEUDO") && c.fechaPago && (
                                <>
                                  <span className="text-gray-300">·</span>
                                  <p className="text-xs text-blue-600">Recibido {c.fechaPago}</p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <CuotaBadge cuota={c} />
                          {esPendiente && (
                            <button
                              disabled={polizaBloq || bloqueada || !anteriorRecibido}
                              onClick={() => !polizaBloq && !bloqueada && anteriorRecibido && setCuotaSel(c)}
                              className={[
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                                polizaBloq || bloqueada || !anteriorRecibido
                                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                  : "bg-[#13193a] text-white hover:bg-[#1e2a50]",
                              ].join(" ")}
                            >
                              <Banknote className="w-3.5 h-3.5" />
                              Recibir
                            </button>
                          )}
                          {c.estatus === "ADEUDO" && (
                            <button
                              onClick={() => onAplicar(c.id)}
                              disabled={aplicando === c.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all"
                            >
                              {aplicando === c.id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Check className="w-3.5 h-3.5" />
                              }
                              Aplicar
                            </button>
                          )}
                          {mostrarRecibo && !polizaBloq && (
                            <button
                              onClick={() => onVerRecibo(poliza, c)}
                              className={[
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                                c.descargado
                                  ? "text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                                  : "text-gray-600 border border-gray-200 hover:bg-gray-50",
                              ].join(" ")}
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              Recibo
                              {c.descargado && <Check className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {cuotaSel && (
        <ModalRecibirPago
          poliza={poliza}
          cuota={cuotaSel}
          onClose={() => setCuotaSel(null)}
          onRecibir={handleRecibir}
        />
      )}
    </>
  );
}

export default function AdminPagos({ usuario }) {
  const [rows,      setRows]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [oficinas,  setOficinas]  = useState(["Todas"]);
  const [busqueda,  setBusqueda]  = useState("");
  const [filtroOf,  setFiltroOf]  = useState("Todas");
  const [filtroEst, setFiltroEst] = useState("Todas");
  const [polizaSel, setPolizaSel] = useState(null);
  const [aplicando, setAplicando] = useState(null);

  const operador = usuario?.id_muestra ?? "";

  // Carga todos los pagos en páginas de 1000 y va llenando "cuotas" por póliza
  const cargarPagosBackground = useCallback(async () => {
    const PAGE = 1000;
    let desde = 0;
    let acum = {};

    while (true) {
      const { data, error } = await supabase
        .from("pagos")
        .select("id, poliza_id, num_cuota, monto, fecha_pago, fecha_vencimiento, estatus, forma_pago, referencia, descargado")
        .range(desde, desde + PAGE - 1)
        .order("fecha_vencimiento", { ascending: true });

      if (error || !data || data.length === 0) break;

      for (const p of data) {
        if (!acum[p.poliza_id]) acum[p.poliza_id] = [];
        acum[p.poliza_id].push(p);
      }

      const snap = { ...acum };
      setRows((prev) =>
        prev.map((r) => {
          const pagos = snap[r.polizaId];
          if (!pagos) return r;
          return { ...r, cuotas: pagos.map(mapCuota) };
        }),
      );

      if (data.length < PAGE) break;
      desde += PAGE;
    }
  }, []);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const polizasQuery = supabase
        .from("polizas")
        .select(`
          id, constancia, numero_poliza, forma_pago,
          fecha_inicio, fecha_fin, hora_inicio, hora_fin, estatus,
          clientes(nombre, apellido, rfc, curp, direccion, calle, numero_ext, numero_int, colonia, ciudad, estado, cp),
          oficinas(id, nombre),
          vendedores(nombre, apellido, codigo),
          coberturas(id, nombre, prima_neta, prima_total, regla_pago, prima_base)
        `)
        .neq("estatus", "COTIZACION")
        .order("fecha_inicio", { ascending: false });

      const [versionesConfig, { data: polizasDB, error }] = await Promise.all([
        fetchTodasVersionesConfig(),
        polizasQuery,
      ]);
      if (error) throw error;

      const rowsBuilt = (polizasDB ?? []).map((pol) => {
        const cfg = configParaFecha(versionesConfig, pol.fecha_inicio);
        return construirPolizaRecibo(pol, cfg);
      });

      const oficinasSet = [
        ...new Set((polizasDB ?? []).map((p) => p.oficinas?.nombre).filter(Boolean)),
      ];
      setOficinas(["Todas", ...oficinasSet]);
      setRows(rowsBuilt);
      setPolizaSel(null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar().then(() => cargarPagosBackground());
  }, [cargar, cargarPagosBackground]);

  const abrirCuotas = useCallback(async (pol) => {
    if (pol.cuotas !== null) {
      setPolizaSel(pol);
      return;
    }
    setPolizaSel({ ...pol, cuotas: [] });
    const { data, error } = await supabase
      .from("pagos")
      .select("*")
      .eq("poliza_id", pol.polizaId)
      .order("fecha_vencimiento", { ascending: true });
    if (error) {
      console.error("Error cargando cuotas:", error);
      return;
    }
    const cuotas = (data ?? []).map(mapCuota);
    setRows((prev) => prev.map((r) => (r.polizaId === pol.polizaId ? { ...r, cuotas } : r)));
    setPolizaSel((prev) => (prev?.polizaId === pol.polizaId ? { ...prev, cuotas } : prev));
  }, []);

  const refrescarCuotas = useCallback(async (polizaId) => {
    const { data, error } = await supabase
      .from("pagos")
      .select("*")
      .eq("poliza_id", polizaId)
      .order("fecha_vencimiento", { ascending: true });
    if (error) throw error;
    const cuotas = (data ?? []).map(mapCuota);
    setRows((prev) => prev.map((r) => (r.polizaId === polizaId ? { ...r, cuotas } : r)));
    setPolizaSel((prev) => (prev?.polizaId === polizaId ? { ...prev, cuotas } : prev));
  }, []);

  // Recibir: pasa una cuota PENDIENTE a ADEUDO
  const recibirPago = async ({ cuotaId, polizaId, fecha, monto }) => {
    const { error } = await supabase
      .from("pagos")
      .update({
        estatus: "ADEUDO",
        fecha_pago: fecha,
        monto: parseFloat(monto),
        recibido_por: usuario?.id ?? null,
      })
      .eq("id", cuotaId);
    if (error) throw error;
    await refrescarCuotas(polizaId);
  };

  // Aplicar: confirma una cuota en ADEUDO como PAGADO
  const aplicarPago = async (cuotaId) => {
    setAplicando(cuotaId);
    try {
      const { error } = await supabase
        .from("pagos")
        .update({ estatus: "PAGADO", aplicado_por: usuario?.id ?? null })
        .eq("id", cuotaId);
      if (error) throw error;
      if (polizaSel) await refrescarCuotas(polizaSel.polizaId);
    } catch (e) {
      console.error(e);
      alert("Error al aplicar el pago: " + e.message);
    } finally {
      setAplicando(null);
    }
  };

  // El admin solo audita/consulta el recibo — no lo entrega al cliente,
  // así que no debe marcarse como "descargado" (eso lo hace el operador).
  const verRecibo = (poliza, cuota) => {
    abrirRecibo(poliza, cuota, operador, { marcarDescargado: false });
  };

  // Filtrado
  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return rows.filter((r) => {
      const mQ  = !q || r.id.toLowerCase().includes(q) || r.asegurado.toLowerCase().includes(q);
      const mOf = filtroOf === "Todas" || r.oficina === filtroOf;
      if (!mQ || !mOf) return false;
      if (filtroEst === "Todas") return true;
      if (ESTATUS_BLOQUEADOS.includes(r.estatusPoliza)) return false; // canceladas/vencidas/anuladas no son accionables
      if (r.cuotas === null) return true; // aún cargando: no ocultar mientras llega
      const nAdeudo = r.cuotas.filter((c) => c.estatus === "ADEUDO").length;
      const nPend   = r.cuotas.filter((c) => c.estatus === "PENDIENTE").length;
      if (filtroEst === "ADEUDO") return nAdeudo > 0;
      if (filtroEst === "PENDIENTE") return nAdeudo === 0 && nPend > 0;
      if (filtroEst === "PAGADO") return nAdeudo === 0 && nPend === 0;
      return true;
    });
  }, [rows, busqueda, filtroOf, filtroEst]);

  const { page, setPage, paginated, totalPages, total } = usePagination(filtrados, 10);

  // Stats globales (sobre cuotas ya cargadas). Las pólizas canceladas/vencidas/
  // anuladas no cuentan para "por recibir"/"por aplicar" — ya no son accionables.
  const cargadas = rows.filter((r) => r.cuotas !== null);
  const cargadasActivas = cargadas.filter((r) => !ESTATUS_BLOQUEADOS.includes(r.estatusPoliza));
  const todasCuotas = cargadas.flatMap((r) => r.cuotas);
  const todasCuotasActivas = cargadasActivas.flatMap((r) => r.cuotas);
  const nAdeudo   = todasCuotasActivas.filter((c) => c.estatus === "ADEUDO").length;
  const nPend     = todasCuotasActivas.filter((c) => c.estatus === "PENDIENTE").length;
  const nPagado   = todasCuotas.filter((c) => c.estatus === "PAGADO").length;
  const montoPend = todasCuotasActivas.filter((c) => c.estatus === "ADEUDO").reduce((s, c) => s + c.monto, 0);

  const selCls = "px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] bg-white";

  return (
    <div className="p-4 md:p-6 space-y-4 min-h-full bg-gray-50">
      {/* Encabezado + stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#13193a]">Pagos</h1>
          <p className="text-xs text-gray-400 mt-0.5">Recepción y aplicación de pagos</p>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide">Por recibir</p>
            <p className="text-lg font-bold text-gray-500 tabular-nums">{nPend}</p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-right">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide">Por aplicar</p>
            <p className="text-lg font-bold text-amber-500 tabular-nums">{nAdeudo}</p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-right">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide">Monto pendiente</p>
            <p className="text-lg font-bold text-[#13193a] tabular-nums">{fmt$(montoPend)}</p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-right">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide">Aplicados</p>
            <p className="text-lg font-bold text-emerald-600 tabular-nums">{nPagado}</p>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
              placeholder="Póliza o asegurado..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] bg-white"
            />
          </div>

          <select value={filtroOf} onChange={(e) => { setFiltroOf(e.target.value); setPage(1); }} className={selCls}>
            {oficinas.map((o) => <option key={o}>{o}</option>)}
          </select>

          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            {[
              { val: "Todas",     label: "Todas" },
              { val: "PENDIENTE", label: "Por recibir" },
              { val: "ADEUDO",    label: "Por aplicar" },
              { val: "PAGADO",    label: "Al corriente" },
            ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => { setFiltroEst(opt.val); setPage(1); }}
                className={`px-4 py-2 text-xs font-medium transition-all whitespace-nowrap ${
                  filtroEst === opt.val ? "bg-[#13193a] text-white" : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {["Póliza", "Asegurado", "Oficina", "Forma de pago", "Cuotas", "Estatus", ""].map((h) => (
                  <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto" />
                  </td>
                </tr>
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-gray-400">
                    No se encontraron pólizas.
                  </td>
                </tr>
              ) : (
                paginated.map((r) => {
                  const cuotasCargadas = r.cuotas !== null;
                  const totalCuotas = r.formaPago === "CONTADO" ? 1 : 4;
                  const nAdeudoR = cuotasCargadas ? r.cuotas.filter((c) => c.estatus === "ADEUDO").length : 0;
                  const nPagadoR = cuotasCargadas ? r.cuotas.filter((c) => c.estatus === "PAGADO").length : 0;
                  const nPendR   = cuotasCargadas ? r.cuotas.filter((c) => c.estatus === "PENDIENTE").length : 0;
                  const polizaBloqR = ESTATUS_BLOQUEADOS.includes(r.estatusPoliza);
                  return (
                    <tr key={r.polizaId} className={`hover:bg-gray-50/60 transition-colors ${nAdeudoR > 0 ? "bg-blue-50/30" : ""}`}>
                      <td className="px-5 py-2 font-mono text-xs font-bold text-[#13193a]">{r.id}</td>
                      <td className="px-5 py-2 text-xs font-semibold text-gray-700">{r.asegurado}</td>
                      <td className="px-5 py-2 text-xs text-gray-500">{r.oficina}</td>
                      <td className="px-5 py-2 text-xs text-gray-500">{r.formaPago}</td>
                      <td className="px-5 py-2">
                        {!cuotasCargadas ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-300" />
                        ) : (
                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalCuotas }, (_, i) => {
                              const n = i + 1;
                              const cuota = r.cuotas.find((c) => c.num === n);
                              const cls =
                                cuota?.estatus === "PAGADO" ? "bg-emerald-400"
                                : cuota?.estatus === "ADEUDO" ? "bg-blue-400"
                                : "bg-gray-200";
                              return <div key={n} className={`w-2 h-2 rounded-full ${cls}`} />;
                            })}
                            <span className="text-[10px] text-gray-400 ml-0.5 tabular-nums">{nPagadoR}/{totalCuotas}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-2">
                        {polizaBloqR ? (
                          <StatusBadge estatus={r.estatusPoliza} />
                        ) : !cuotasCargadas ? (
                          <span className="text-[11px] text-gray-300">—</span>
                        ) : (
                          <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                            nAdeudoR > 0
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : nPendR > 0
                                ? "bg-gray-100 text-gray-500 border-gray-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}>
                            {nAdeudoR > 0 ? "Por aplicar" : nPendR > 0 ? "Por recibir" : "Al corriente"}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-2">
                        <button
                          onClick={() => abrirCuotas(r)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#13193a] border border-gray-200 hover:bg-gray-50 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver cuotas
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Paginator page={page} totalPages={totalPages} total={total} pageSize={10} onPage={setPage} />
      </div>

      {polizaSel && (
        <ModalCuotasPoliza
          poliza={polizaSel}
          onClose={() => setPolizaSel(null)}
          onRecibir={recibirPago}
          onAplicar={aplicarPago}
          onVerRecibo={verRecibo}
          aplicando={aplicando}
        />
      )}
    </div>
  );
}
