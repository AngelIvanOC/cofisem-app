// ============================================================
// src/features/pagos/RegistrarCobroModal.jsx
// Registrar el cobro de una cuota subsecuente (2ª en adelante) de una
// póliza COFISEM ya completa. A diferencia de CompletarPolizaModal, aquí
// la póliza ya está armada — solo se captura CÓMO se pagó esta cuota en
// particular (mismo desglose que la cuota 1: efectivo/cheque/tdc/pól.
// pend. pago + comprobantes + autorización), para que el efectivo
// cobrado cuente en el corte de caja del día igual que una venta nueva.
// El vale (comisión del vendedor) NO va aquí — es un concepto único por
// póliza vendida, no por cada cuota que se cobra después; se captura una
// sola vez desde la sección Comisiones.
//
// Se usa desde dos lugares: Pagos (cualquier cuota PENDIENTE, la traiga
// o no su fecha) y Corte (cuotas que ya vencieron hoy o se adelantaron a
// hoy, mostradas como fila estática en "Pólizas del día"). Ambos pasan
// la misma forma de `row`: un renglón de pagos_cofisem con
// `row.polizas_cofisem` como la póliza padre (de solo lectura aquí).
// ============================================================
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Lock, FileSignature } from "lucide-react";
import { supabase } from "../../supabaseClient";
import {
  subirComprobantePago,
  verComprobantePago,
  MAX_PAGO_COMPROBANTE_BYTES,
} from "../../services/comprobantesPagoCofisem";
import { ComprobanteField } from "../corte/CompletarPolizaModal";
import { obtenerImportesCuotaGaman } from "../../services/primaGaman";
import { hoyISO } from "../../utils/fecha";

const n = (v) => parseFloat(v) || 0;

const inp =
  "w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1447e6]/15 focus:border-[#1447e6] transition-all";
const lbl =
  "block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5";

const VACIO = {
  prima_total: "",
  prima_neta: "",
  fecha_recibido: "",
  efectivo: "",
  cheque: "",
  tdc: "",
  pol_pend_pago: "",
  autorizacion: "",
  comprobante_cheque_path: null,
  comprobante_tdc_path: null,
  endoso_path: null,
  endoso_nota: "",
};

// Igual criterio que faltantesCompletado() en CompletarPolizaModal.jsx,
// aplicado a una sola cuota (sin vigencia/documentación, eso ya se
// verificó cuando se registró la póliza).
function faltantes(f) {
  const detalle = {
    pago: !(
      n(f.efectivo) > 0 ||
      n(f.cheque) > 0 ||
      n(f.tdc) > 0 ||
      n(f.pol_pend_pago) > 0
    ),
    autorizacion: n(f.tdc) > 0 && !(f.autorizacion && f.autorizacion.trim()),
    comprobanteTdc: n(f.tdc) > 0 && !f.comprobante_tdc_path,
    comprobanteCheque: n(f.cheque) > 0 && !f.comprobante_cheque_path,
  };
  const labels = {
    pago: "Marca al menos una forma de pago (Efectivo, Cheque/Dep., T. Crédito/Déb. o Pól. Pend. Pago)",
    autorizacion:
      "Autorización (obligatoria porque se pagó con T. Crédito/Déb.)",
    comprobanteTdc: "Comprobante de la terminal (TDC)",
    comprobanteCheque: "Comprobante de cheque / depósito",
  };
  const mensajes = Object.keys(detalle)
    .filter((k) => detalle[k])
    .map((k) => labels[k]);
  return { detalle, mensajes, completo: mensajes.length === 0 };
}

export default function RegistrarCobroModal({
  row,
  usuario,
  onClose,
  onSaved,
  onPerdida,
}) {
  const [form, setForm] = useState({ ...VACIO });
  const [subiendo, setSubiendo] = useState(null); // 'cheque' | 'tdc' | null
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [intento, setIntento] = useState(false);
  const [perdidaAbierto, setPerdidaAbierto] = useState(false);
  const [perdidaNota, setPerdidaNota] = useState("");
  const [dandoBaja, setDandoBaja] = useState(false);
  const [endosoAbierto, setEndosoAbierto] = useState(false);

  useEffect(() => {
    if (!row) return;
    setForm({
      prima_total: row.prima_total || "",
      prima_neta: row.prima_neta || "",
      fecha_recibido: row.fecha_recibido || hoyISO(),
      efectivo: row.efectivo || "",
      cheque: row.cheque || "",
      tdc: row.tdc || "",
      pol_pend_pago: row.pol_pend_pago || "",
      autorizacion: row.autorizacion ?? "",
      comprobante_cheque_path: row.comprobante_cheque_url ?? null,
      comprobante_tdc_path: row.comprobante_tdc_url ?? null,
      endoso_path: row.endoso_url ?? null,
      endoso_nota: row.endoso_nota ?? "",
    });
    setError(null);
    setIntento(false);
    setPerdidaAbierto(false);
    setPerdidaNota("");
    setEndosoAbierto(!!row.endoso_url || !!row.endoso_nota);
  }, [row]);

  // Cuota ligada a un pago real de GAMAN: la prima total/neta no se
  // captura a mano — se calcula con la misma fórmula del recibo oficial
  // (ver utils/recibo.js), igual que ya se hace para la cuota 1 en
  // CompletarPolizaModal, para que nunca se desincronice del recibo real.
  useEffect(() => {
    const polizaId = row?.polizas_cofisem?.poliza_id;
    if (!row?.pago_gaman_id || !polizaId) return;
    let vivo = true;
    obtenerImportesCuotaGaman(polizaId, row.num_cuota)
      .then((importes) => {
        if (!vivo || !importes) return;
        setForm((f) => ({
          ...f,
          prima_total: importes.primaTotal,
          prima_neta: importes.primaNeta,
        }));
      })
      .catch((e) => {
        if (vivo) setError("No se pudo leer la prima de GAMAN: " + e.message);
      });
    return () => {
      vivo = false;
    };
  }, [row]);

  if (!row) return null;
  const p = row.polizas_cofisem ?? {};
  const esGaman = !!row.pago_gaman_id;
  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const chk = faltantes(form);
  const falta = (k) => intento && chk.detalle[k];
  const campoCls = (k) =>
    `${inp}${falta(k) ? " border-red-300 ring-2 ring-red-100" : ""}`;

  async function handleArchivo(tipo, file) {
    if (file.size > MAX_PAGO_COMPROBANTE_BYTES) {
      setError("El archivo es muy grande (máx. 8 MB).");
      return;
    }
    setError(null);
    setSubiendo(tipo);
    try {
      const basePath = `${usuario?.oficina_id ?? "sin-oficina"}/${row.poliza_cofisem_id}/cuota-${row.num_cuota}-${tipo}`;
      const path = await subirComprobantePago(basePath, file);
      setF(`comprobante_${tipo}_path`, path);
    } catch (e) {
      setError("No se pudo subir el comprobante: " + e.message);
    } finally {
      setSubiendo(null);
    }
  }

  async function handleArchivoEndoso(file) {
    if (file.size > MAX_PAGO_COMPROBANTE_BYTES) {
      setError("El archivo es muy grande (máx. 8 MB).");
      return;
    }
    setError(null);
    setSubiendo("endoso");
    try {
      const basePath = `${usuario?.oficina_id ?? "sin-oficina"}/${row.poliza_cofisem_id}/cuota-${row.num_cuota}-endoso`;
      const path = await subirComprobantePago(basePath, file);
      setF("endoso_path", path);
    } catch (e) {
      setError("No se pudo subir el endoso: " + e.message);
    } finally {
      setSubiendo(null);
    }
  }

  async function guardar(e) {
    e.preventDefault();
    if (guardando) return;
    setError(null);
    if (!chk.completo) {
      setIntento(true);
      await Swal.fire({
        icon: "warning",
        title: "Todavía no se puede registrar",
        html: `<p style="text-align:left; margin:0 0 8px;">Falta lo siguiente:</p><ul style="text-align:left; margin:0; padding-left:1.2em;">${chk.mensajes.map((m) => `<li>${m}</li>`).join("")}</ul>`,
        confirmButtonText: "Entendido",
        confirmButtonColor: "#1447e6",
      });
      return;
    }
    setGuardando(true);
    try {
      const { data, error: err } = await supabase
        .from("pagos_cofisem")
        .update({
          prima_total: n(form.prima_total),
          prima_neta: n(form.prima_neta),
          fecha_recibido: form.fecha_recibido || hoyISO(),
          efectivo: n(form.efectivo),
          cheque: n(form.cheque),
          tdc: n(form.tdc),
          pol_pend_pago: n(form.pol_pend_pago),
          autorizacion: form.autorizacion || null,
          comprobante_cheque_url: form.comprobante_cheque_path,
          comprobante_tdc_url: form.comprobante_tdc_path,
          endoso_url: form.endoso_path,
          endoso_nota: form.endoso_nota || null,
          estatus: "RECIBIDO",
          recibido_por: usuario?.id ?? null,
        })
        .eq("id", row.id)
        .select()
        .single();
      if (err) throw err;
      onSaved(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarPerdida() {
    setDandoBaja(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("polizas_cofisem")
        .update({
          perdida: true,
          perdida_nota: perdidaNota.trim() || null,
          perdida_por: usuario?.id ?? null,
          perdida_at: new Date().toISOString(),
        })
        .eq("id", row.poliza_cofisem_id)
        .select()
        .single();
      if (err) throw err;
      onPerdida?.(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setDandoBaja(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <p className="text-sm font-bold text-[#1447e6]">
            Registrar cobro de cuota
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Póliza{" "}
            <strong className="font-mono">{p.numero_poliza || "—"}</strong> ·{" "}
            {p.asegurado_nombre || "—"} · Cuota <strong>{row.num_cuota}</strong>
          </p>
        </div>

        <form onSubmit={guardar} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-red-700 flex items-center justify-between">
              {error}
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 ml-3"
              >
                ✕
              </button>
            </div>
          )}

          <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 flex items-center gap-2 text-[11px] text-gray-500">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            Los datos de la póliza ({p.aseguradora || "—"},{" "}
            {p.forma_pago || "—"}) ya están registrados — aquí solo se captura
            cómo se pagó esta cuota.
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Prima Total de la cuota</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.prima_total}
                disabled={esGaman}
                onChange={(e) => setF("prima_total", e.target.value)}
                className={
                  inp + (esGaman ? " bg-gray-100 text-gray-400" : "")
                }
              />
            </div>
            <div>
              <label className={lbl}>Prima Neta de la cuota</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.prima_neta}
                disabled={esGaman}
                onChange={(e) => setF("prima_neta", e.target.value)}
                className={
                  inp + (esGaman ? " bg-gray-100 text-gray-400" : "")
                }
              />
            </div>
          </div>

          <div>
            <label className={lbl}>Fecha en que se recibió el pago</label>
            <input
              type="date"
              value={form.fecha_recibido}
              onChange={(e) => setF("fecha_recibido", e.target.value)}
              className={inp + " sm:max-w-xs"}
            />
          </div>

          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Forma de pago{" "}
              {falta("pago") && (
                <span className="text-red-500 normal-case tracking-normal ml-1">
                  — marca al menos una
                </span>
              )}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className={lbl}>Efectivo</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.efectivo}
                  onChange={(e) => setF("efectivo", e.target.value)}
                  placeholder="0.00"
                  className={campoCls("pago")}
                />
              </div>
              <div>
                <label className={lbl}>Transf / Dep.</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.cheque}
                  onChange={(e) => setF("cheque", e.target.value)}
                  placeholder="0.00"
                  className={campoCls("pago")}
                />
              </div>
              <div>
                <label className={lbl}>T. Crédito/Déb.</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.tdc}
                  onChange={(e) => setF("tdc", e.target.value)}
                  placeholder="0.00"
                  className={campoCls("pago")}
                />
              </div>
              <div>
                <label className={lbl}>Pól. Pend. Pago</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.pol_pend_pago}
                  onChange={(e) => setF("pol_pend_pago", e.target.value)}
                  placeholder="0.00"
                  className={campoCls("pago")}
                />
              </div>
            </div>
            {n(form.tdc) > 0 && (
              <div className="mt-4">
                <label className={lbl}>
                  Autorización{" "}
                  <span
                    className={
                      falta("autorizacion") ? "text-red-500" : "text-gray-300"
                    }
                  >
                    *
                  </span>
                </label>
                <input
                  value={form.autorizacion}
                  onChange={(e) =>
                    setF("autorizacion", e.target.value.toUpperCase())
                  }
                  placeholder="Código de autorización"
                  className={campoCls("autorizacion") + " sm:max-w-xs"}
                />
              </div>
            )}
            {(n(form.cheque) > 0 || n(form.tdc) > 0) && (
              <div className="mt-3 space-y-2">
                {n(form.cheque) > 0 && (
                  <ComprobanteField
                    label="Comprobante de cheque / depósito / transferencia"
                    path={form.comprobante_cheque_path}
                    subiendo={subiendo === "cheque"}
                    onFile={(f) => handleArchivo("cheque", f)}
                    onVer={() =>
                      verComprobantePago(form.comprobante_cheque_path)
                    }
                  />
                )}
                {n(form.tdc) > 0 && (
                  <ComprobanteField
                    label="Comprobante de la terminal (ticket TDC)"
                    path={form.comprobante_tdc_path}
                    subiendo={subiendo === "tdc"}
                    onFile={(f) => handleArchivo("tdc", f)}
                    onVer={() => verComprobantePago(form.comprobante_tdc_path)}
                  />
                )}
              </div>
            )}
          </div>

          <div>
            {!endosoAbierto ? (
              <button
                type="button"
                onClick={() => setEndosoAbierto(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#1447e6] hover:text-[#0f36b3]"
              >
                <FileSignature className="w-3.5 h-3.5" />
                Adjuntar endoso
              </button>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    <FileSignature className="w-3.5 h-3.5" />
                    Endoso
                  </p>
                  {!form.endoso_path && !form.endoso_nota && (
                    <button
                      type="button"
                      onClick={() => setEndosoAbierto(false)}
                      className="text-[11px] font-semibold text-gray-400 hover:text-gray-600"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
                <ComprobanteField
                  label="Archivo del endoso"
                  path={form.endoso_path}
                  subiendo={subiendo === "endoso"}
                  onFile={handleArchivoEndoso}
                  onVer={() => verComprobantePago(form.endoso_path)}
                  obligatorio={false}
                />
                <div>
                  <label className={lbl}>Nota (opcional)</label>
                  <textarea
                    value={form.endoso_nota}
                    onChange={(e) => setF("endoso_nota", e.target.value)}
                    placeholder="Detalle del endoso…"
                    className="w-full h-16 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1447e6]/15 focus:border-[#1447e6] resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1447e6] hover:bg-[#0f36b3] text-white text-sm font-bold disabled:opacity-50"
            >
              {guardando ? "Guardando…" : "Registrar cobro"}
            </button>
          </div>

          <div className="pt-1">
            {!perdidaAbierto ? (
              <button
                type="button"
                onClick={() => setPerdidaAbierto(true)}
                className="text-[11px] font-semibold text-gray-400 hover:text-red-500 underline underline-offset-2"
              >
                El cliente no acudió a pagar — dar de baja esta póliza
              </button>
            ) : (
              <div className="rounded-xl border border-red-200 bg-red-50/60 p-4 space-y-3">
                <p className="text-xs font-bold text-red-700">
                  Esto da por perdida TODA la póliza ({p.numero_poliza || "—"}),
                  no solo esta cuota — ya no se podrá registrar ningún cobro de
                  sus demás cuotas, y dejará de aparecer en Pólizas del día. Se
                  sigue mostrando en Pagos como registro.
                </p>
                <textarea
                  value={perdidaNota}
                  onChange={(e) => setPerdidaNota(e.target.value)}
                  placeholder="Nota (opcional): por qué se da de baja…"
                  className="w-full h-16 px-3 py-2 rounded-xl border border-red-200 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200 resize-none bg-white"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPerdidaAbierto(false)}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={confirmarPerdida}
                    disabled={dandoBaja}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50"
                  >
                    {dandoBaja ? "Dando de baja…" : "Confirmar: dar de baja"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
