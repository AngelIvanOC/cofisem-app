import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Paperclip, FileSpreadsheet, Printer, History } from "lucide-react";
import { supabase } from "../../supabaseClient";
import { subirComprobante, verComprobante as abrirComprobante, COMPROBANTE_BUCKET, MAX_COMPROBANTE_BYTES } from "../../services/comprobantesPago";
import { verDocumento } from "../../services/documentacionPoliza";
import { exportarCorteExcel } from "../../services/corteExport";
import { hoyISO } from "../../utils/fecha";
import CompletarPolizaModal, { CompletarBadge } from "./CompletarPolizaModal";
import RegistrarCobroModal from "../pagos/RegistrarCobroModal";

const DENOMINACIONES = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.5];
const HOY_ISO = hoyISO();

const n = (v) => parseFloat(v) || 0;
const $ = (v) => `$${n(v).toFixed(2)}`;
const fmt = (d) =>
  d
    ? new Date(d + "T00:00:00").toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

// Convierte una cuota subsecuente (pagos_cofisem, con su póliza padre ya
// unida) en una fila con la misma forma que un registro de polizas_cofisem,
// para poder reutilizar exactamente las mismas columnas de la tabla —
// datos de la póliza de solo lectura (spread del padre) + los campos de
// cobro sobreescritos con los de ESTA cuota en particular.
function cuotaARow(c) {
  const p = c.polizas_cofisem ?? {};
  return {
    ...p,
    id: `cuota-${c.id}`,
    _esCuotaSubsecuente: true,
    _cuotaEstatus: c.estatus,
    _cuotaRaw: c,
    num_cuota_pago: c.num_cuota,
    prima_primer_pago: c.prima_total,
    prima_primer_pago_neta: c.prima_neta,
    vale: c.vale,
    efectivo: c.efectivo,
    cheque: c.cheque,
    tdc: c.tdc,
    pol_pend_pago: c.pol_pend_pago,
    autorizacion: c.autorizacion,
    comprobante_vale_url: c.comprobante_vale_url,
    comprobante_cheque_url: c.comprobante_cheque_url,
    comprobante_tdc_url: c.comprobante_tdc_url,
  };
}

export default function CorteOperador({ usuario }) {
  const [searchParams] = useSearchParams();
  const fechaCorte = searchParams.get("fecha") || HOY_ISO;
  const esHoy = fechaCorte === HOY_ISO;
  const fechaLabel = useMemo(
    () =>
      new Date(fechaCorte + "T00:00:00").toLocaleDateString("es-MX", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    [fechaCorte],
  );

  const [registros, setRegistros] = useState([]);
  const [cuotasDia, setCuotasDia] = useState([]); // pagos_cofisem: cuotas subsecuentes que vencieron hoy, se adelantaron a hoy, o ya se cobraron hoy
  const [loading, setLoading]     = useState(true);
  const [errorMsg, setErrorMsg]   = useState(null);
  const [gastos, setGastos]       = useState(0);
  const [vista, setVista]         = useState("poliza"); // "poliza" | "pago"
  const [billetes, setBilletes]   = useState(
    Object.fromEntries(DENOMINACIONES.map((d) => [d, ""])),
  );
  const [modalRow, setModalRow] = useState(null);
  const [modalCuota, setModalCuota] = useState(null);

  const [entregaEfectivo, setEntregaEfectivo] = useState(null);
  const [subiendoEfectivo, setSubiendoEfectivo] = useState(false);
  const [tabEntrega, setTabEntrega]     = useState("PERSONAL"); // "PERSONAL" | "DEPOSITO"
  const [previewEfectivo, setPreviewEfectivo] = useState(null); // { url, isPdf } | null
  const [cerrando, setCerrando] = useState(false);
  const [confirmandoCierre, setConfirmandoCierre] = useState(false);
  const [alertaIncompletas, setAlertaIncompletas] = useState(null); // array de registros incompletos | null
  const [notaIncompleto, setNotaIncompleto] = useState("");

  const oficina = usuario?.oficinas?.nombre ?? "OFICINA";

  // Cuotas subsecuentes que vencieron hoy (o se adelantaron a hoy) se
  // muestran como filas estáticas más en la misma tabla — mismos
  // campos de cobro, pero la póliza (vigencia, vehículo, etc.) es de
  // solo lectura porque ya se registró antes. Cuentan para el efectivo
  // y demás totales de cobro del día (es dinero que sí se cobró hoy),
  // pero NO para "Prima T./Neta Anual" (eso es "venta nueva del día",
  // no se debe sumar otra vez cada vez que a una póliza vieja le toca
  // pagar) ni para el bloqueo de cierre por "pendientes de completar"
  // (esas filas no tienen concepto de completado — si el cliente no
  // vino, simplemente se sigue mostrando al día siguiente).
  const filasCuotas = cuotasDia.map(cuotaARow);
  const filasTabla  = [...registros, ...filasCuotas];

  const totalEfectivo   = filasTabla.reduce((s, r) => s + n(r.efectivo), 0);
  const totalVales      = filasTabla.reduce((s, r) => s + n(r.vale), 0);
  const totalTDC        = filasTabla.reduce((s, r) => s + n(r.tdc), 0);
  const totalCheque     = filasTabla.reduce((s, r) => s + n(r.cheque), 0);
  const polPendPago     = filasTabla.reduce((s, r) => s + n(r.pol_pend_pago), 0);
  const sumaPrimerPago  = filasTabla.reduce((s, r) => s + n(r.prima_primer_pago), 0);
  const sumaPrimaAnual  = registros.reduce((s, r) => s + n(r.prima_anual), 0);
  const sumaPrimaNeta   = registros.reduce((s, r) => s + n(r.prima_neta), 0);
  const pendientes      = registros.filter((r) => !r.completado).length;

  const subEfectivo   = totalEfectivo - n(gastos);
  const totalCobro    = subEfectivo + totalTDC + totalCheque;
  const totalBilletes = DENOMINACIONES.reduce((s, d) => s + n(billetes[d]) * d, 0);
  const diferencia    = +(totalBilletes - totalCobro).toFixed(2);
  const efectivoBloqueado = totalEfectivo === 0;
  const tabEntregaMostrada = efectivoBloqueado ? "PERSONAL" : tabEntrega;
  const corteCerrado = !!entregaEfectivo?.cerrado;

  useEffect(() => {
    setLoading(true);
    cargar();
    cargarEntregaEfectivo();
    cargarCuotasDia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaCorte]);

  // Sincroniza el switch/preview con lo ya guardado para el día (si lo hay).
  // No exige que ya haya comprobante — un depósito puede quedar marcado
  // como decisión sin archivo todavía (se sube después).
  useEffect(() => {
    let activo = true;
    if (entregaEfectivo?.entrega === "DEPOSITO") {
      setTabEntrega("DEPOSITO");
      if (entregaEfectivo.comprobante_url) {
        supabase.storage.from(COMPROBANTE_BUCKET).createSignedUrl(entregaEfectivo.comprobante_url, 3600)
          .then(({ data }) => {
            if (activo && data?.signedUrl) {
              setPreviewEfectivo({ url: data.signedUrl, isPdf: entregaEfectivo.comprobante_url.endsWith(".pdf") });
            }
          });
      } else {
        setPreviewEfectivo(null);
      }
    } else if (entregaEfectivo?.entrega === "PERSONAL") {
      setTabEntrega("PERSONAL");
    }
    return () => { activo = false; };
  }, [entregaEfectivo?.entrega, entregaEfectivo?.comprobante_url]);

  async function cargar() {
    try {
      let query = supabase
        .from("polizas_cofisem")
        .select("*")
        .eq("fecha_corte", fechaCorte)
        .order("created_at", { ascending: true });
      if (usuario?.id) query = query.eq("creado_por", usuario.id);
      const { data, error } = await query;
      if (error) throw error;
      setRegistros(data ?? []);
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Cuotas subsecuentes que pertenecen al corte de este día:
  //  - Ya cobradas ESE día (fecha_recibido = fechaCorte) — hecho histórico,
  //    aplica aunque se esté consultando un día pasado.
  //  - Todavía PENDIENTE, con vencimiento hoy o antes (no se pierden de
  //    vista mientras no se cobren) o adelantadas a hoy — solo tiene
  //    sentido mostrarlas como "pendientes de cobrar" en el día de hoy,
  //    no al consultar un corte pasado ya cerrado.
  // Se excluyen las cuotas de pólizas dadas de baja (perdida) y las de
  // una póliza registrada este mismo día (esa ya aparece como registro
  // nuevo — mostrarla también aquí duplicaría la misma cuota dos veces).
  async function cargarCuotasDia() {
    try {
      let query = supabase
        .from("pagos_cofisem")
        .select("*, polizas_cofisem(*)")
        .is("pago_gaman_id", null);
      if (usuario?.id) query = query.eq("operador_id", usuario.id);
      query = esHoy
        ? query.or(`fecha_recibido.eq.${fechaCorte},and(estatus.eq.PENDIENTE,or(fecha_vencimiento.lte.${fechaCorte},fecha_adelantado.eq.${fechaCorte}))`)
        : query.eq("fecha_recibido", fechaCorte);
      const { data, error } = await query;
      if (error) throw error;
      const filtradas = (data ?? []).filter(
        (c) => c.polizas_cofisem && !c.polizas_cofisem.perdida && c.polizas_cofisem.fecha_corte !== fechaCorte,
      );
      setCuotasDia(filtradas);
    } catch (e) {
      setErrorMsg(e.message);
    }
  }

  async function cargarEntregaEfectivo() {
    try {
      let query = supabase.from("corte_efectivo_entrega").select("*").eq("fecha_corte", fechaCorte);
      query = usuario?.oficina_id ? query.eq("oficina_id", usuario.oficina_id) : query.is("oficina_id", null);
      query = usuario?.id ? query.eq("operador_id", usuario.id) : query.is("operador_id", null);
      const { data } = await query.maybeSingle();
      setEntregaEfectivo(data ?? null);
    } catch {
      // No bloquea el corte si esto falla — se puede definir después.
    }
  }

  async function verComprobante(path) {
    try {
      await abrirComprobante(path);
    } catch (e) {
      setErrorMsg("No se pudo abrir el comprobante: " + e.message);
    }
  }

  async function verDoc(path) {
    try {
      await verDocumento(path);
    } catch (e) {
      setErrorMsg("No se pudo abrir el documento: " + e.message);
    }
  }

  function handlePolizaGuardada(data) {
    setRegistros((prev) => prev.map((r) => (r.id === data.id ? data : r)));
    setModalRow(null);
    setErrorMsg(null);
  }

  function handleCuotaGuardada(data) {
    setCuotasDia((prev) => prev.map((c) => (c.id === data.id ? { ...c, ...data } : c)));
    setModalCuota(null);
    setErrorMsg(null);
  }

  // La póliza completa se dio por perdida — ninguna de sus cuotas debe
  // seguir apareciendo como pendiente de cobrar en Pólizas del día.
  function handleCuotaPerdida(polizaActualizada) {
    setCuotasDia((prev) => prev.filter((c) => c.poliza_cofisem_id !== polizaActualizada.id));
    setModalCuota(null);
    setErrorMsg(null);
  }

  async function guardarEntrega({ entrega, comprobante_url }) {
    try {
      const payload = {
        fecha_corte:     fechaCorte,
        oficina_id:      usuario?.oficina_id ?? null,
        operador_id:     usuario?.id ?? null,
        entrega,
        comprobante_url,
        decidido_por:    usuario?.id ?? null,
        updated_at:      new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from("corte_efectivo_entrega")
        .upsert(payload, { onConflict: "fecha_corte,oficina_id,operador_id" })
        .select()
        .single();
      if (error) throw error;
      setEntregaEfectivo(data);
    } catch (e) {
      setErrorMsg("No se pudo guardar la entrega de efectivo: " + e.message);
    }
  }

  function handleCerrarCorte() {
    const incompletas = registros.filter((r) => !r.completado);
    if (incompletas.length > 0) {
      setNotaIncompleto("");
      setAlertaIncompletas(incompletas);
      return;
    }
    setErrorMsg(null);
    setConfirmandoCierre(true);
  }

  async function confirmarCierre(extra = {}) {
    setConfirmandoCierre(false);
    setCerrando(true);
    try {
      const payload = {
        fecha_corte:     fechaCorte,
        oficina_id:      usuario?.oficina_id ?? null,
        operador_id:     usuario?.id ?? null,
        entrega:         entregaEfectivo?.entrega ?? null,
        comprobante_url: entregaEfectivo?.comprobante_url ?? null,
        decidido_por:    entregaEfectivo?.decidido_por ?? usuario?.id ?? null,
        cerrado:         true,
        cerrado_por:     usuario?.id ?? null,
        cierre_incompleto:    extra?.cierreIncompleto ?? false,
        nota_operador_cierre: extra?.notaOperador ?? null,
        // Cada (re)cierre entra fresco a revisión — si admin ya lo había
        // regresado o aprobado antes, no debe quedar pegado a ese estatus
        // viejo ahora que se vuelve a cerrar.
        estatus_revision: "PENDIENTE",
        updated_at:      new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from("corte_efectivo_entrega")
        .upsert(payload, { onConflict: "fecha_corte,oficina_id,operador_id" })
        .select()
        .single();
      if (error) throw error;
      setEntregaEfectivo(data);
      setAlertaIncompletas(null);
    } catch (e) {
      setErrorMsg("No se pudo cerrar el corte: " + e.message);
    } finally {
      setCerrando(false);
    }
  }

  function handleSolicitarCierreIncompleto() {
    if (!notaIncompleto.trim()) return;
    confirmarCierre({ cierreIncompleto: true, notaOperador: notaIncompleto.trim() });
  }

  function datosCorteExport() {
    return {
      registros: filasTabla,
      oficina,
      fechaLabel,
      fechaIso: fechaCorte,
      totales: {
        efectivo: totalEfectivo, vale: totalVales, tdc: totalTDC, cheque: totalCheque,
        gastos, subEfectivo, totalCobro, polPendPago,
        primaAnual: sumaPrimaAnual, primaNeta: sumaPrimaNeta, primerPago: sumaPrimerPago,
        totalBilletes, diferencia,
      },
    };
  }

  function handleImprimir() {
    const { totales, ...resto } = datosCorteExport();
    const payload = {
      ...resto,
      generadoPor: usuario?.nombre ?? "—",
      cerrado: corteCerrado,
      cerradoAt: entregaEfectivo?.cerrado_at
        ? new Date(entregaEfectivo.cerrado_at).toLocaleString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : null,
      entregaTipo: entregaEfectivo?.entrega ?? null,
      impresoEn: new Date().toLocaleString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      totales,
    };
    try {
      localStorage.setItem("corte_pdf_data", JSON.stringify(payload));
      window.open("/gaman/corte-preview", "_blank");
    } catch (e) {
      setErrorMsg("No se pudo generar el PDF: " + e.message);
    }
  }

  function handleExportarExcel() {
    try {
      exportarCorteExcel(datosCorteExport());
    } catch (e) {
      setErrorMsg("No se pudo generar el Excel: " + e.message);
    }
  }

  function handleTabEntrega(tipo) {
    setTabEntrega(tipo);
    if (tipo === "PERSONAL") {
      setPreviewEfectivo(null);
      if (entregaEfectivo?.entrega !== "PERSONAL") {
        guardarEntrega({ entrega: "PERSONAL", comprobante_url: null });
      }
    } else if (tipo === "DEPOSITO") {
      // Se guarda la decisión de inmediato, aunque todavía no haya
      // comprobante — así se puede cerrar el corte y subirlo después.
      if (entregaEfectivo?.entrega !== "DEPOSITO") {
        guardarEntrega({ entrega: "DEPOSITO", comprobante_url: entregaEfectivo?.comprobante_url ?? null });
      }
    }
  }

  async function handleComprobanteEfectivo(file) {
    if (!file) return;
    if (file.size > MAX_COMPROBANTE_BYTES) {
      setErrorMsg("El archivo es muy grande (máx. 8 MB).");
      return;
    }
    setPreviewEfectivo({ url: URL.createObjectURL(file), isPdf: file.type === "application/pdf" });
    setSubiendoEfectivo(true);
    try {
      const basePath = `${usuario?.oficina_id ?? "sin-oficina"}/${fechaCorte}/efectivo-deposito`;
      const path = await subirComprobante(basePath, file);
      if (corteCerrado) {
        // El corte ya está cerrado — solo se permite completar el
        // comprobante de depósito que quedó pendiente, vía RPC.
        if (!entregaEfectivo?.id) throw new Error("No se encontró el registro del corte.");
        const { data, error } = await supabase.rpc("subir_comprobante_efectivo_corte", {
          p_entrega_id: entregaEfectivo.id,
          p_comprobante_url: path,
        });
        if (error) throw error;
        setEntregaEfectivo(Array.isArray(data) ? data[0] : data);
      } else {
        await guardarEntrega({ entrega: "DEPOSITO", comprobante_url: path });
      }
    } catch (e) {
      setErrorMsg("No se pudo subir el comprobante: " + e.message);
      setPreviewEfectivo(null);
    } finally {
      setSubiendoEfectivo(false);
    }
  }

  const iResumen =
    "w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1447e6]/15 focus:border-[#1447e6] tabular-nums";

  const FilaBillete = ({ d }) => {
    const cant   = parseFloat(billetes[d]) || 0;
    const subtot = cant * d;
    return (
      <div className="grid grid-cols-3 gap-2 items-center">
        <div className="flex items-center gap-2">
          <div className="w-12 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 border border-gray-200">
            ${d < 1 ? d.toFixed(2) : d}
          </div>
          <span className="text-xs text-gray-400">×</span>
        </div>
        <input
          type="number" min="0" step="1" placeholder="0"
          value={billetes[d]}
          disabled={corteCerrado}
          onChange={(e) => setBilletes((b) => ({ ...b, [d]: e.target.value }))}
          className={iResumen + " text-center py-1 disabled:opacity-50 disabled:cursor-not-allowed"}
        />
        <p className="text-xs font-bold text-[#1447e6] text-right tabular-nums">
          {subtot > 0 ? `$${subtot.toFixed(2)}` : "—"}
        </p>
      </div>
    );
  };

  const TH = ({ children, rowSpan, colSpan, blue }) => (
    <th
      rowSpan={rowSpan}
      colSpan={colSpan}
      className={[
        "text-center text-[10px] font-bold uppercase tracking-wide px-3 border-r border-gray-100 last:border-r-0 whitespace-nowrap",
        blue
          ? "text-blue-500 bg-blue-50/40 py-1.5"
          : "text-gray-500 py-2 align-middle",
        colSpan ? "text-center border-b border-gray-200" : "",
      ].join(" ")}
    >
      {children}
    </th>
  );

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm gap-2">
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Cargando corte del día…
      </div>
    );

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-3">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1447e6]">
            Corte Diario{!esHoy && <span className="text-base font-semibold text-gray-400"> · consulta</span>}
          </h1>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {oficina}
            </span>
            <span className="text-xs text-gray-400 capitalize">{fechaLabel}</span>
            <span className="text-xs text-gray-400">
              Generado por:{" "}
              <strong className="text-gray-600">{usuario?.nombre ?? "—"}</strong>
            </span>
            {corteCerrado && (
              <span className="text-[11px] font-bold text-gray-600 bg-gray-200 px-2.5 py-1 rounded-full">
                🔒 Corte cerrado
                {entregaEfectivo?.cerrado_at && (
                  <>
                    {" "}el{" "}
                    {new Date(entregaEfectivo.cerrado_at).toLocaleString("es-MX", {
                      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </>
                )}
              </span>
            )}
            {corteCerrado && entregaEfectivo?.cierre_incompleto && (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                ⚠ Cerrado incompleto — pendiente de liberación
              </span>
            )}
            {!corteCerrado && entregaEfectivo?.estatus_revision === "REGRESADO" && (
              <span className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                ↩ El admin regresó este corte — corrígelo y vuelve a cerrarlo
              </span>
            )}
          </div>
          {entregaEfectivo?.notas_admin && (
            <p className="text-xs text-gray-500 mt-2 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 inline-block">
              <strong className="text-gray-600">Nota de administración:</strong> {entregaEfectivo.notas_admin}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/corte/historial"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <History className="w-4 h-4" />
            Historial
          </Link>
          {!corteCerrado && (
            <button
              type="button"
              onClick={handleCerrarCorte}
              disabled={cerrando || filasTabla.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              🔒 Cerrar corte
            </button>
          )}
          <button
            onClick={handleExportarExcel}
            disabled={filasTabla.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={handleImprimir}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          {errorMsg}
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600 ml-3">✕</button>
        </div>
      )}

      {/* ── Tabla (solo lectura) ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-100 bg-[#1447e6] flex-wrap">
          <div className="flex items-center gap-3">
            <p className="text-sm font-bold text-white">Pólizas del día</p>
            <span className="text-white/50 text-xs">{filasTabla.length} registros</span>
            {pendientes > 0 && (
              <span className="text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full">
                {pendientes} por completar
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setVista("poliza")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                vista === "poliza" ? "bg-white text-[#1447e6]" : "text-white/70 hover:text-white"
              }`}
            >
              Datos de póliza
            </button>
            <button
              type="button"
              onClick={() => setVista("pago")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                vista === "pago" ? "bg-white text-[#1447e6]" : "text-white/70 hover:text-white"
              }`}
            >
              Pago y respaldo
            </button>
          </div>
        </div>

        {vista === "poliza" ? (
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <TH rowSpan={2}>No.</TH>
                  <TH rowSpan={2}>Aseguradora</TH>
                  <TH rowSpan={2}>Póliza</TH>
                  <TH rowSpan={2}>F. Emisión</TH>
                  <TH colSpan={2}>Vigencia</TH>
                  <TH rowSpan={2}>Folio</TH>
                  <TH rowSpan={2}>Vendedor</TH>
                  <TH rowSpan={2}>Asegurado</TH>
                  <TH rowSpan={2}>Vale $</TH>
                  <TH rowSpan={2}>Prima T. Anual</TH>
                  <TH rowSpan={2}>Prima Neta Anual</TH>
                  <TH rowSpan={2}>Cuota</TH>
                  <TH rowSpan={2}>Pago</TH>
                  <TH rowSpan={2}>Cobertura</TH>
                  <TH colSpan={2}>Uso / Vehículo</TH>
                </tr>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <TH blue>Inicio</TH>
                  <TH blue>Fin</TH>
                  <TH blue>Placas</TH>
                  <TH blue>Tipo</TH>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {filasTabla.length === 0 && (
                  <tr>
                    <td colSpan={16} className="px-5 py-12 text-center text-sm text-gray-400">
                      {esHoy ? (
                        <>Sin pólizas registradas hoy. Registra pólizas en la sección <strong>Pólizas</strong>.</>
                      ) : (
                        <>No registraste ninguna venta este día.</>
                      )}
                    </td>
                  </tr>
                )}

                {filasTabla.map((r, i) => (
                  <tr key={r.id} className={`hover:bg-gray-50/60 transition-colors ${r._esCuotaSubsecuente ? "bg-amber-50/20" : ""}`}>
                    <td className="px-3 py-2.5 text-center font-bold text-[#1447e6]">{i + 1}</td>
                    <td className="px-3 py-2.5 text-center font-semibold text-gray-700">{r.aseguradora || "—"}</td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap font-mono font-bold text-[#1447e6]">
                      {r.numero_poliza || "—"}
                      {r._esCuotaSubsecuente && (
                        <span className="ml-1.5 inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 align-middle whitespace-nowrap">
                          pago subsecuente
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center text-gray-600 whitespace-nowrap">{fmt(r.fecha_emision)}</td>
                    <td className="px-3 py-2.5 text-center text-gray-600 whitespace-nowrap bg-blue-50/20">{fmt(r.vigencia_inicio)}</td>
                    <td className="px-3 py-2.5 text-center text-gray-600 whitespace-nowrap bg-blue-50/20">{fmt(r.vigencia_fin)}</td>
                    <td className="px-3 py-2.5 text-center font-mono text-gray-600">{r.folio || "—"}</td>
                    <td className="px-3 py-2.5 text-center text-gray-700 whitespace-nowrap">{r.vendedor_nombre || "—"}</td>
                    <td className="px-3 py-2.5 text-center text-gray-700 whitespace-nowrap">{r.asegurado_nombre || "—"}</td>
                    <td className="px-3 py-2.5 text-center font-semibold text-gray-700">
                      {n(r.vale) > 0 ? $(r.vale) : "—"}
                      {r.comprobante_vale_url && (
                        <button type="button" onClick={() => verComprobante(r.comprobante_vale_url)} title="Ver comprobante" className="ml-1 align-middle text-[#1447e6] hover:text-[#0f36b3] inline-flex"><Paperclip className="w-3.5 h-3.5" /></button>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center font-semibold text-[#1447e6]">{$(r.prima_anual)}</td>
                    <td className="px-3 py-2.5 text-center text-gray-700">{$(r.prima_neta)}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-gray-500">{r.num_cuota_pago ?? 1}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-emerald-700">{$(r.prima_primer_pago)}</td>
                    <td className="px-3 py-2.5 text-center text-gray-600 max-w-[110px] truncate">{r.cobertura || "—"}</td>
                    <td className="px-3 py-2.5 text-center font-mono text-gray-600 bg-blue-50/20">{r.placas || "—"}</td>
                    <td className="px-3 py-2.5 text-center text-gray-600 bg-blue-50/20">{r.tipo || "—"}</td>
                  </tr>
                ))}

                {filasTabla.length > 0 && (
                  <tr className="bg-[#1447e6]/5 font-bold border-t-2 border-[#1447e6]/20">
                    <td colSpan={9} className="px-3 py-3 text-right text-xs font-bold text-[#1447e6]">TOTAL</td>
                    <td className="px-3 py-3 text-right text-xs text-[#1447e6]">{$(totalVales)}</td>
                    <td className="px-3 py-3 text-right text-xs text-[#1447e6]">{$(sumaPrimaAnual)}</td>
                    <td className="px-3 py-3 text-right text-xs text-[#1447e6]">{$(sumaPrimaNeta)}</td>
                    <td />
                    <td className="px-3 py-3 text-right text-xs font-bold text-emerald-700">{$(sumaPrimerPago)}</td>
                    <td colSpan={3} />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <TH rowSpan={2}>No.</TH>
                  <TH rowSpan={2}>Forma Pago</TH>
                  <TH colSpan={4}>Tipo de Pago</TH>
                  <TH rowSpan={2}>Pol.Pend.Pago</TH>
                  <TH rowSpan={2}>Teléfono</TH>
                  <TH rowSpan={2}>Observaciones</TH>
                  <TH colSpan={6}>Respaldo</TH>
                  <TH rowSpan={2}>Acción</TH>
                </tr>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <TH blue>Efectivo</TH>
                  <TH blue>Cheq/Dep</TH>
                  <TH blue>TDC</TH>
                  <TH blue>Autorización</TH>
                  <TH blue>Fotos</TH>
                  <TH blue>Fact.</TH>
                  <TH blue>T. Circ.</TH>
                  <TH blue>Identif.</TH>
                  <TH blue>Pol. Ant.</TH>
                  <TH blue>Otro</TH>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {filasTabla.length === 0 && (
                  <tr>
                    <td colSpan={16} className="px-5 py-12 text-center text-sm text-gray-400">
                      {esHoy ? (
                        <>Sin pólizas registradas hoy. Registra pólizas en la sección <strong>Pólizas</strong>.</>
                      ) : (
                        <>No registraste ninguna venta este día.</>
                      )}
                    </td>
                  </tr>
                )}

                {filasTabla.map((r, i) => (
                  <tr key={r.id} className={`hover:bg-gray-50/60 transition-colors ${r._esCuotaSubsecuente ? "bg-amber-50/20" : ""}`}>
                    <td className="px-3 py-2.5 text-center font-bold text-[#1447e6]">{i + 1}</td>
                    <td className="px-3 py-2.5 text-center text-gray-600 whitespace-nowrap">{r.forma_pago || "—"}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-emerald-700 bg-emerald-50/20">{$(r.efectivo)}</td>
                    <td className="px-3 py-2.5 text-center text-gray-500 bg-emerald-50/20">
                      {n(r.cheque) > 0 ? $(r.cheque) : "—"}
                      {r.comprobante_cheque_url && (
                        <button type="button" onClick={() => verComprobante(r.comprobante_cheque_url)} title="Ver comprobante" className="ml-1 align-middle text-[#1447e6] hover:text-[#0f36b3] inline-flex"><Paperclip className="w-3.5 h-3.5" /></button>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center text-gray-500 bg-emerald-50/20">
                      {n(r.tdc) > 0 ? $(r.tdc) : "—"}
                      {r.comprobante_tdc_url && (
                        <button type="button" onClick={() => verComprobante(r.comprobante_tdc_url)} title="Ver comprobante" className="ml-1 align-middle text-[#1447e6] hover:text-[#0f36b3] inline-flex"><Paperclip className="w-3.5 h-3.5" /></button>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center text-gray-500 bg-emerald-50/20">{r.autorizacion || "—"}</td>
                    <td className="px-3 py-2.5 text-center text-gray-400">{n(r.pol_pend_pago) > 0 ? $(r.pol_pend_pago) : "—"}</td>
                    <td className="px-3 py-2.5 text-center text-gray-600 whitespace-nowrap">{r.telefono || "—"}</td>
                    <td className="px-3 py-2.5 text-center text-gray-400 max-w-[120px] truncate">{r.observaciones || "—"}</td>
                    {[r.fotos_url, r.factura_url, r.t_circ_url, r.identif_url, r.pol_ant_url, r.otro_url].map((path, j) => (
                      <td key={j} className="px-3 py-2.5 text-center bg-amber-50/20">
                        {path ? (
                          <button type="button" onClick={() => verDoc(path)} title="Ver documento" className="text-amber-600 hover:text-amber-700 font-bold inline-flex">
                            <Paperclip className="w-3.5 h-3.5" />
                          </button>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-center">
                      {r._esCuotaSubsecuente ? (
                        r._cuotaEstatus === "PENDIENTE" ? (
                          <button
                            type="button"
                            onClick={() => !corteCerrado && setModalCuota(r._cuotaRaw)}
                            disabled={corteCerrado}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[11px] font-bold hover:bg-amber-600 disabled:opacity-50 transition-colors"
                          >
                            Registrar cobro
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                            ✓ Cobrado
                          </span>
                        )
                      ) : (
                        <CompletarBadge completado={r.completado} onClick={() => !corteCerrado && setModalRow(r)} />
                      )}
                    </td>
                  </tr>
                ))}

                {filasTabla.length > 0 && (
                  <tr className="bg-[#1447e6]/5 font-bold border-t-2 border-[#1447e6]/20">
                    <td colSpan={2} className="px-3 py-3 text-right text-xs font-bold text-[#1447e6]">TOTAL</td>
                    <td className="px-3 py-3 text-right text-xs font-bold text-emerald-700">{$(totalEfectivo)}</td>
                    <td colSpan={13} />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Resumen + Billetes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-5 items-stretch">
        {/* Columna izquierda */}
        <div className="flex flex-col gap-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-[#1447e6] px-5 py-3.5">
              <p className="text-sm font-bold text-white">Resumen de cobro</p>
              <p className="text-white/40 text-xs mt-0.5">Calculado automáticamente del registro del día</p>
            </div>
            <div className="p-5 space-y-1">
              {[
                { label: "Efectivo",              value: totalEfectivo },
                { label: "Vales",                 value: totalVales    },
                { label: "T. Crédito / Débito",   value: totalTDC      },
                { label: "Fichas Cheques/Trans",  value: totalCheque   },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <label className="text-xs font-bold text-gray-500 w-44 shrink-0">{f.label}</label>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input readOnly value={f.value.toFixed(2)} className={iResumen + " pl-7 bg-gray-50 cursor-default select-all"} />
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-gray-500 w-44 shrink-0">Gastos</label>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number" min="0" step="0.01"
                    value={gastos || ""}
                    disabled={corteCerrado}
                    onChange={(e) => setGastos(parseFloat(e.target.value) || 0)}
                    className={iResumen + " pl-7 disabled:opacity-50 disabled:cursor-not-allowed"}
                  />
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-2">
                {[
                  { label: "Subtotal efectivo",   value: subEfectivo,  bold: false             },
                  { label: "Total",               value: totalCobro,   bold: true              },
                  { label: "Pólizas pend. pago",  value: polPendPago,  bold: false, warn: true },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <p className={`text-xs ${row.warn ? "text-amber-600" : "text-gray-600"} ${row.bold ? "font-bold" : "font-medium"}`}>
                      {row.label}
                    </p>
                    <p className={`text-sm tabular-nums ${row.warn ? "text-amber-700" : row.bold ? "font-bold text-[#1447e6]" : "text-gray-700"}`}>
                      ${row.value.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col flex-1">
            <label className="block text-[11px] font-bold text-[#1447e6] uppercase tracking-wide mb-2">
              Observaciones del corte
            </label>
            <textarea
              placeholder="Observaciones generales del día, irregularidades, comentarios…"
              disabled={corteCerrado}
              className="flex-1 w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1447e6]/15 focus:border-[#1447e6] resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Corte de billetes / entrega de efectivo */}
        <div className="flex flex-col gap-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1447e6]">Entrega de efectivo</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {efectivoBloqueado
                  ? "Sin efectivo que declarar todavía"
                  : <>Total: <strong className="text-gray-600">{$(totalEfectivo)}</strong></>}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 shrink-0">
              <button
                type="button"
                disabled={efectivoBloqueado || corteCerrado}
                onClick={() => handleTabEntrega("PERSONAL")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  efectivoBloqueado || corteCerrado ? "cursor-not-allowed" : ""
                } ${
                  tabEntregaMostrada === "PERSONAL" ? "bg-[#1447e6] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Efectivo
              </button>
              <button
                type="button"
                disabled={efectivoBloqueado || corteCerrado}
                onClick={() => handleTabEntrega("DEPOSITO")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  efectivoBloqueado || corteCerrado ? "text-gray-300 cursor-not-allowed" : tabEntregaMostrada === "DEPOSITO" ? "bg-[#1447e6] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Depósito
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-[#1447e6] px-5 py-3.5">
              <p className="text-sm font-bold text-white">Corte de efectivo</p>
              <p className="text-white/50 text-xs mt-0.5">
                {tabEntregaMostrada === "DEPOSITO" ? "Comprobante del depósito" : "Ingresa la cantidad de cada denominación"}
              </p>
            </div>
            <div className="p-5">
              {tabEntregaMostrada === "DEPOSITO" ? (
                <div className="h-48 mb-3">
                  {previewEfectivo ? (
                    <div className="relative h-full rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                      {previewEfectivo.isPdf ? (
                        <iframe src={previewEfectivo.url} title="Comprobante del depósito" className="w-full h-full" />
                      ) : (
                        <img src={previewEfectivo.url} alt="Comprobante del depósito" className="w-full h-full object-contain" />
                      )}
                      {subiendoEfectivo && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-xs font-semibold text-gray-500">
                          Subiendo…
                        </div>
                      )}
                      {!corteCerrado && (
                        <label className="absolute bottom-2 right-2 text-xs font-bold px-3 py-1.5 rounded-lg bg-white/95 border border-gray-200 text-gray-600 hover:bg-white cursor-pointer shadow-sm">
                          Cambiar
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            capture="environment"
                            className="hidden"
                            disabled={subiendoEfectivo}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              e.target.value = "";
                              if (f) handleComprobanteEfectivo(f);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  ) : (
                    <label className={`h-full flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed transition-colors ${
                      subiendoEfectivo ? "border-gray-200 bg-gray-50 cursor-wait" : corteCerrado ? "border-amber-300 hover:border-amber-400 bg-amber-50/60 cursor-pointer" : "border-gray-300 hover:border-gray-400 bg-gray-50/60 cursor-pointer"
                    }`}>
                      {corteCerrado && !subiendoEfectivo && (
                        <p className="text-[11px] font-bold text-amber-600 mb-1">Corte cerrado — falta el comprobante</p>
                      )}
                      <p className="text-xs font-bold text-gray-500">
                        {subiendoEfectivo ? "Subiendo…" : "Subir comprobante"}
                      </p>
                      <p className="text-[11px] text-gray-400">Foto o PDF</p>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        capture="environment"
                        className="hidden"
                        disabled={subiendoEfectivo}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          e.target.value = "";
                          if (f) handleComprobanteEfectivo(f);
                        }}
                      />
                    </label>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
                  <div className="space-y-1.5">
                    {DENOMINACIONES.slice(0, 5).map((d) => <FilaBillete key={d} d={d} />)}
                  </div>
                  <div className="space-y-1.5">
                    {DENOMINACIONES.slice(5).map((d) => <FilaBillete key={d} d={d} />)}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4 space-y-2">
                {tabEntregaMostrada === "PERSONAL" && (
                  <div className="flex justify-between">
                    <p className="text-xs font-semibold text-gray-500">Total billetes</p>
                    <p className="text-sm font-bold text-[#1447e6] tabular-nums">${totalBilletes.toFixed(2)}</p>
                  </div>
                )}
                <div className="flex justify-between">
                  <p className="text-xs font-semibold text-gray-500">Total cobrado</p>
                  <p className="text-sm font-bold text-[#1447e6] tabular-nums">${totalCobro.toFixed(2)}</p>
                </div>
                {tabEntregaMostrada === "PERSONAL" && (
                  <div className={`flex justify-between items-center p-3 rounded-xl border-2 ${
                    diferencia === 0
                      ? "bg-emerald-50 border-emerald-200"
                      : diferencia > 0
                        ? "bg-blue-50 border-blue-200"
                        : "bg-red-50 border-red-200"
                  }`}>
                    <p className="text-xs font-bold">
                      {diferencia === 0 ? "✓ Sin diferencia" : diferencia > 0 ? "Sobrante" : "Faltante"}
                    </p>
                    <p className={`text-lg font-bold tabular-nums ${
                      diferencia === 0 ? "text-emerald-700" : diferencia > 0 ? "text-blue-700" : "text-red-700"
                    }`}>
                      {diferencia >= 0 ? "+" : ""}${diferencia.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CompletarPolizaModal
        row={modalRow}
        usuario={usuario}
        onClose={() => setModalRow(null)}
        onSaved={handlePolizaGuardada}
      />

      <RegistrarCobroModal
        row={modalCuota}
        usuario={usuario}
        onClose={() => setModalCuota(null)}
        onSaved={handleCuotaGuardada}
        onPerdida={handleCuotaPerdida}
      />

      {/* ── Confirmar cierre del corte ── */}
      {confirmandoCierre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <p className="text-sm font-bold text-[#1447e6] mb-2">¿Cerrar el corte del día?</p>
            <p className="text-sm text-gray-500">
              Ya no podrás agregar, editar ni eliminar pólizas de hoy — solo consultarlas. Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setConfirmandoCierre(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => confirmarCierre()}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-all"
              >
                Sí, cerrar corte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Alerta: pólizas incompletas al intentar cerrar ── */}
      {alertaIncompletas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 pb-4">
              <p className="text-sm font-bold text-[#1447e6] mb-1">No puedes cerrar el corte todavía</p>
              <p className="text-sm text-gray-500">
                {alertaIncompletas.length === 1
                  ? "Esta póliza sigue sin completarse:"
                  : `Estas ${alertaIncompletas.length} pólizas siguen sin completarse:`}
              </p>
            </div>
            <div className="max-h-56 overflow-y-auto border-y border-gray-100 divide-y divide-gray-50">
              {alertaIncompletas.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setAlertaIncompletas(null);
                    setModalRow(r);
                  }}
                  className="w-full flex items-center justify-between gap-3 px-6 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-mono font-bold text-[#1447e6] truncate">{r.numero_poliza || "—"}</p>
                    <p className="text-xs text-gray-500 truncate">{r.asegurado_nombre || "—"}</p>
                  </div>
                  <span className="text-[11px] font-bold text-amber-600 shrink-0">Completar →</span>
                </button>
              ))}
            </div>
            <div className="px-6 pt-4">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Nota para solicitar cierre incompleto
              </label>
              <textarea
                value={notaIncompleto}
                onChange={(e) => setNotaIncompleto(e.target.value)}
                placeholder="Explica qué falta y por qué necesitas cerrar el corte así (ej. el cliente no entregó factura, no se presentó a pagar…)"
                className="w-full h-20 px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-3 p-6 pt-3">
              <button
                type="button"
                onClick={() => setAlertaIncompletas(null)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
              >
                Voy a completarlas
              </button>
              <button
                type="button"
                onClick={handleSolicitarCierreIncompleto}
                disabled={!notaIncompleto.trim() || cerrando}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Solicitar cerrar corte incompleto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
