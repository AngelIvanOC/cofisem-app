// ============================================================
// src/features/corte/CompletarPolizaModal.jsx
// Modal reutilizable para completar TODOS los datos de una póliza del
// corte — usado desde /corte y /polizas, ya que ambas páginas leen y
// editan la misma tabla (polizas_cofisem). No importa si la póliza vino
// de GAMAN o se capturó a mano: el criterio de "completado" es el mismo
// para todas — ver evaluarCompletado().
// ============================================================
import { useState, useEffect } from "react";
import { Paperclip } from "lucide-react";
import { supabase } from "../../supabaseClient";
import { subirComprobante, verComprobante, MAX_COMPROBANTE_BYTES } from "../../services/comprobantesPago";
import { subirDocumento, verDocumento, MAX_DOCUMENTO_BYTES } from "../../services/documentacionPoliza";

const n = (v) => parseFloat(v) || 0;

const COBERTURA_OPT = ["AMPLIA", "LIMITADA", "BÁSICA", "OBLIGATORIO", "OTRA"];

// Coberturas "amplia"/"limitada" exigen foto del vehículo además de la
// identificación.
const esAmpliaOLimitada = (cobertura) => /AMPLIA|LIMITADA/i.test(cobertura || "");

const VACIO = {
  folio: "", cobertura: "", vigencia_fin: "", placas: "",
  vendedor_nombre: "", telefono: "",
  prima_anual: "", prima_neta: "", prima_primer_pago: "", prima_primer_pago_neta: "",
  vale: "", pol_pend_pago: "",
  efectivo: "", cheque: "", tdc: "", autorizacion: "",
  fotos_path: null, factura_path: null, t_circ_path: null,
  identif_path: null, pol_ant_path: null, otro_path: null,
  observaciones: "",
  comprobante_tdc_path: null, comprobante_cheque_path: null, comprobante_vale_path: null,
};

const inpModal =
  "w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1447e6]/15 focus:border-[#1447e6] transition-all";
const lblModal = "block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5";

// Reglas de "completado" — compartidas entre este modal y el formulario
// "Nueva póliza" de /polizas, para que ambas vías (GAMAN o captura manual)
// apliquen exactamente el mismo criterio. Una póliza se considera completa
// cuando tiene TODOS los datos que se muestran en la tabla "Pólizas del
// día", salvo los que legítimamente pueden quedar vacíos:
//   - Folio, Cobertura, Vigencia fin, Placas: siempre requeridos.
//   - Prima T. Anual, Prima Neta Anual, Prima T. 1er Pago, Prima N. 1er
//     Pago: siempre > 0.
//   - Al menos una forma de pago (efectivo/cheque/tdc) con monto > 0.
//   - Identificación: siempre obligatoria. Además, mínimo uno de
//     {Fotos, Factura, T. Circulación, Póliza anterior} — "Otro" no
//     cuenta para este mínimo, es un extra sin peso. Si la cobertura es
//     Amplia o Limitada, Fotos deja de ser opcional dentro de ese grupo:
//     se vuelve obligatoria aparte, y el mínimo se exige sobre
//     {Factura, T. Circulación, Póliza anterior}.
//   - Autorización solo si se pagó con T. Crédito/Déb.
//   - Comprobante adjunto para cada forma de pago que sí se usó.
//   - Vendedor, Teléfono, Vale, Pól. Pend. Pago y Observaciones quedan
//     opcionales a propósito: no toda venta tiene vendedor, no siempre
//     se consigue el teléfono, y no toda póliza trae vale o saldo
//     pendiente — un $0 o vacío ahí es una respuesta válida, no un dato
//     faltante.
export function evaluarCompletado(f) {
  const tieneFolio      = !!(f.folio && f.folio.trim());
  const tieneCobertura  = !!(f.cobertura && f.cobertura.trim());
  const tieneVigenciaFin = !!f.vigencia_fin;
  const tienePlacas     = !!(f.placas && f.placas.trim());
  const tienePrimas     = n(f.prima_anual) > 0 && n(f.prima_neta) > 0 && n(f.prima_primer_pago) > 0 && n(f.prima_primer_pago_neta) > 0;
  const tienePago       = n(f.efectivo) > 0 || n(f.cheque) > 0 || n(f.tdc) > 0;
  const autorizacionOk  = n(f.tdc) <= 0 || !!(f.autorizacion && f.autorizacion.trim());
  const comprobantesOk =
    (n(f.tdc) <= 0 || !!f.comprobante_tdc_path) &&
    (n(f.cheque) <= 0 || !!f.comprobante_cheque_path) &&
    (n(f.vale) <= 0 || !!f.comprobante_vale_path);

  const identifOk = !!f.identif_path;
  const amplLim   = esAmpliaOLimitada(f.cobertura);
  const fotosOk   = !amplLim || !!f.fotos_path;
  const grupoMinimo = amplLim
    ? [f.factura_path, f.t_circ_path, f.pol_ant_path]
    : [f.fotos_path, f.factura_path, f.t_circ_path, f.pol_ant_path];
  const minimoUnoOk = grupoMinimo.some(Boolean);
  const documentacionOk = identifOk && fotosOk && minimoUnoOk;

  return (
    tieneFolio && tieneCobertura && tieneVigenciaFin && tienePlacas && tienePrimas &&
    tienePago && documentacionOk && autorizacionOk && comprobantesOk
  );
}

// Botón de estado — reutilizado en las tablas de /corte y /polizas.
export function CompletarBadge({ completado, onClick }) {
  return completado ? (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold hover:bg-emerald-100 transition-colors"
    >
      ✓ Completo
    </button>
  ) : (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[11px] font-bold hover:bg-amber-600 transition-colors animate-pulse"
    >
      Completar
    </button>
  );
}

// Campo reutilizable: adjunta/reemplaza/ve un comprobante (foto o PDF).
// Exportado — también se usa en el formulario "Nueva póliza" de /polizas.
export function ComprobanteField({ label, path, subiendo, onFile, onVer, obligatorio = true }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/70 px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <Paperclip className="w-4 h-4 shrink-0 text-gray-400" />
        <div className="min-w-0">
          <p className="text-xs font-bold text-gray-600">{label}</p>
          <p className={`text-[11px] ${path ? "text-emerald-600 font-semibold" : obligatorio ? "text-amber-600" : "text-gray-400"}`}>
            {subiendo ? "Subiendo…" : path ? "✓ Comprobante adjunto" : obligatorio ? "Obligatorio — sube foto o PDF" : "Opcional — sube foto o PDF"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {path && !subiendo && (
          <button type="button" onClick={onVer} className="text-xs font-bold text-[#1447e6] underline underline-offset-2">
            Ver
          </button>
        )}
        <label
          className={`text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors whitespace-nowrap ${
            subiendo
              ? "bg-gray-200 text-gray-400 cursor-wait"
              : path
                ? "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                : "bg-[#1447e6] text-white hover:bg-[#0f36b3]"
          }`}
        >
          {subiendo ? "..." : path ? "Cambiar" : "Subir"}
          <input
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            className="hidden"
            disabled={subiendo}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) onFile(f);
            }}
          />
        </label>
      </div>
    </div>
  );
}

// `row`: registro de polizas_cofisem a completar, o null para no mostrar el modal.
// `onClose()`: se llama al cancelar/cerrar.
// `onSaved(registroActualizado)`: se llama tras guardar con éxito.
export default function CompletarPolizaModal({ row, usuario, onClose, onSaved }) {
  const [form, setForm]                 = useState({ ...VACIO });
  const [modalError, setModalError]     = useState(null);
  const [guardando, setGuardando]       = useState(false);
  const [subiendoComprobante, setSubiendoComprobante] = useState(null); // 'tdc' | 'cheque' | 'vale' | null
  const [subiendoDocumento, setSubiendoDocumento] = useState(null); // 'fotos' | 'factura' | 't_circ' | 'identif' | 'pol_ant' | 'otro' | null

  useEffect(() => {
    if (!row) return;
    setForm({
      folio:             row.folio ?? "",
      cobertura:         row.cobertura ?? "",
      vigencia_fin:      row.vigencia_fin ?? "",
      placas:            row.placas ?? "",
      vendedor_nombre:   row.vendedor_nombre ?? "",
      telefono:          row.telefono ?? "",
      prima_anual:       row.prima_anual || "",
      prima_neta:        row.prima_neta || "",
      prima_primer_pago:      row.prima_primer_pago || "",
      prima_primer_pago_neta: row.prima_primer_pago_neta || "",
      vale:          row.vale || "",
      pol_pend_pago: row.pol_pend_pago || "",
      efectivo:      row.efectivo || "",
      cheque:        row.cheque || "",
      tdc:           row.tdc || "",
      autorizacion:  row.autorizacion ?? "",
      fotos_path:    row.fotos_url    ?? null,
      factura_path:  row.factura_url  ?? null,
      t_circ_path:   row.t_circ_url   ?? null,
      identif_path:  row.identif_url  ?? null,
      pol_ant_path:  row.pol_ant_url  ?? null,
      otro_path:     row.otro_url     ?? null,
      observaciones: row.observaciones ?? "",
      comprobante_tdc_path:    row.comprobante_tdc_url    ?? null,
      comprobante_cheque_path: row.comprobante_cheque_url ?? null,
      comprobante_vale_path:   row.comprobante_vale_url   ?? null,
    });
    setModalError(null);
  }, [row]);

  if (!row) return null;

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const hoyIso = new Date().toISOString().split("T")[0];

  async function handleComprobanteChange(tipo, file) {
    if (file.size > MAX_COMPROBANTE_BYTES) {
      setModalError("El archivo es muy grande (máx. 8 MB).");
      return;
    }
    setModalError(null);
    setSubiendoComprobante(tipo);
    try {
      const basePath = `${usuario?.oficina_id ?? "sin-oficina"}/${hoyIso}/${row.id}/${tipo}`;
      const path = await subirComprobante(basePath, file);
      setF(`comprobante_${tipo}_path`, path);
    } catch (e) {
      setModalError("No se pudo subir el comprobante: " + e.message);
    } finally {
      setSubiendoComprobante(null);
    }
  }

  async function handleDocumentoChange(tipo, file) {
    if (file.size > MAX_DOCUMENTO_BYTES) {
      setModalError("El archivo es muy grande (máx. 8 MB).");
      return;
    }
    setModalError(null);
    setSubiendoDocumento(tipo);
    try {
      const basePath = `${usuario?.oficina_id ?? "sin-oficina"}/${hoyIso}/${row.id}/${tipo}`;
      const path = await subirDocumento(basePath, file);
      setF(`${tipo}_path`, path);
    } catch (e) {
      setModalError("No se pudo subir el documento: " + e.message);
    } finally {
      setSubiendoDocumento(null);
    }
  }

  async function handleVerDocumento(path) {
    try {
      await verDocumento(path);
    } catch (e) {
      setModalError("No se pudo abrir el documento: " + e.message);
    }
  }

  async function handleVer(path) {
    try {
      await verComprobante(path);
    } catch (e) {
      setModalError("No se pudo abrir el comprobante: " + e.message);
    }
  }

  async function guardar(e) {
    e.preventDefault();
    if (guardando) return;
    setModalError(null);
    setGuardando(true);
    try {
      const payload = {
        folio:             form.folio || null,
        cobertura:         form.cobertura || null,
        vigencia_fin:      form.vigencia_fin || null,
        placas:            form.placas || null,
        vendedor_nombre:   form.vendedor_nombre || null,
        telefono:          form.telefono || null,
        prima_anual:       n(form.prima_anual),
        prima_neta:        n(form.prima_neta),
        prima_primer_pago:      n(form.prima_primer_pago),
        prima_primer_pago_neta: n(form.prima_primer_pago_neta),
        vale:          n(form.vale),
        pol_pend_pago: n(form.pol_pend_pago),
        efectivo:      n(form.efectivo),
        cheque:        n(form.cheque),
        tdc:           n(form.tdc),
        autorizacion:  form.autorizacion || null,
        fotos_url:     form.fotos_path,
        factura_url:   form.factura_path,
        t_circ_url:    form.t_circ_path,
        identif_url:   form.identif_path,
        pol_ant_url:   form.pol_ant_path,
        otro_url:      form.otro_path,
        observaciones: form.observaciones || null,
        comprobante_tdc_url:    form.comprobante_tdc_path,
        comprobante_cheque_url: form.comprobante_cheque_path,
        comprobante_vale_url:   form.comprobante_vale_path,
        completado:    evaluarCompletado(form),
      };
      const { data, error } = await supabase
        .from("polizas_cofisem")
        .update(payload)
        .eq("id", row.id)
        .select()
        .single();
      if (error) throw error;
      onSaved(data);
    } catch (e) {
      setModalError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <p className="text-sm font-bold text-[#1447e6]">Completar registro</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Póliza <strong className="font-mono">{row.numero_poliza || "—"}</strong> · {row.asegurado_nombre || "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={guardar} className="p-6 space-y-5">
          {modalError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-red-700 flex items-center justify-between">
              {modalError}
              <button type="button" onClick={() => setModalError(null)} className="text-red-400 hover:text-red-600 ml-3">✕</button>
            </div>
          )}

          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Datos de la póliza</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className={lblModal}>Folio <span className="text-red-400">*</span></label>
                <input value={form.folio} onChange={(e) => setF("folio", e.target.value.toUpperCase())} placeholder="Ej. T0455" className={inpModal} />
              </div>
              <div className="col-span-2 sm:col-span-2">
                <label className={lblModal}>Cobertura <span className="text-red-400">*</span></label>
                <select value={form.cobertura} onChange={(e) => setF("cobertura", e.target.value)} className={inpModal}>
                  <option value="">Selecciona...</option>
                  {COBERTURA_OPT.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={lblModal}>Vigencia fin <span className="text-red-400">*</span></label>
                <input type="date" value={form.vigencia_fin} onChange={(e) => setF("vigencia_fin", e.target.value)} className={inpModal} />
              </div>
              <div>
                <label className={lblModal}>Placas <span className="text-red-400">*</span></label>
                <input value={form.placas} onChange={(e) => setF("placas", e.target.value.toUpperCase())} placeholder="Ej. ABC-123 o TRÁMITE" className={inpModal} />
              </div>
              <div className="col-span-2 sm:col-span-3">
                <label className={lblModal}>Vendedor</label>
                <input value={form.vendedor_nombre} onChange={(e) => setF("vendedor_nombre", e.target.value.toUpperCase())} placeholder="Opcional — nombre del vendedor" className={inpModal} />
              </div>
              <div>
                <label className={lblModal}>Teléfono</label>
                <input type="tel" value={form.telefono} onChange={(e) => setF("telefono", e.target.value)} placeholder="Opcional" className={inpModal} />
              </div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Montos y cobro</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className={lblModal}>Prima T. Anual <span className="text-red-400">*</span></label>
                <input type="number" min="0" step="0.01" value={form.prima_anual} onChange={(e) => setF("prima_anual", e.target.value)} placeholder="0.00" className={inpModal} />
              </div>
              <div>
                <label className={lblModal}>Prima Neta Anual <span className="text-red-400">*</span></label>
                <input type="number" min="0" step="0.01" value={form.prima_neta} onChange={(e) => setF("prima_neta", e.target.value)} placeholder="0.00" className={inpModal} />
              </div>
              <div>
                <label className={lblModal}>Prima T. 1er Pago <span className="text-red-400">*</span></label>
                <input type="number" min="0" step="0.01" value={form.prima_primer_pago} onChange={(e) => setF("prima_primer_pago", e.target.value)} placeholder="0.00" className={inpModal} />
              </div>
              <div>
                <label className={lblModal}>Prima N. 1er Pago <span className="text-red-400">*</span></label>
                <input type="number" min="0" step="0.01" value={form.prima_primer_pago_neta} onChange={(e) => setF("prima_primer_pago_neta", e.target.value)} placeholder="0.00" className={inpModal} />
              </div>
              <div>
                <label className={lblModal}>Vale ($)</label>
                <input type="number" min="0" step="0.01" value={form.vale} onChange={(e) => setF("vale", e.target.value)} placeholder="0.00" className={inpModal} />
              </div>
            </div>
          </div>

          {n(form.vale) > 0 && (
            <ComprobanteField
              label="Comprobante del vale (foto del papel)"
              path={form.comprobante_vale_path}
              subiendo={subiendoComprobante === "vale"}
              onFile={(f) => handleComprobanteChange("vale", f)}
              onVer={() => handleVer(form.comprobante_vale_path)}
            />
          )}

          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Tipo de pago <span className="text-red-400 normal-case tracking-normal">— marca al menos uno</span></p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className={lblModal}>Efectivo</label>
                <input type="number" min="0" step="0.01" value={form.efectivo} onChange={(e) => setF("efectivo", e.target.value)} placeholder="0.00" className={inpModal} />
              </div>
              <div>
                <label className={lblModal}>Cheque / Dep.</label>
                <input type="number" min="0" step="0.01" value={form.cheque} onChange={(e) => setF("cheque", e.target.value)} placeholder="0.00" className={inpModal} />
              </div>
              <div>
                <label className={lblModal}>T. Crédito/Déb.</label>
                <input type="number" min="0" step="0.01" value={form.tdc} onChange={(e) => setF("tdc", e.target.value)} placeholder="0.00" className={inpModal} />
              </div>
              <div>
                <label className={lblModal}>Pól. Pend. Pago</label>
                <input type="number" min="0" step="0.01" value={form.pol_pend_pago} onChange={(e) => setF("pol_pend_pago", e.target.value)} placeholder="0.00" className={inpModal} />
              </div>
            </div>
            {n(form.tdc) > 0 && (
              <div className="mt-4">
                <label className={lblModal}>Autorización <span className="text-red-400">*</span></label>
                <input value={form.autorizacion} onChange={(e) => setF("autorizacion", e.target.value.toUpperCase())} placeholder="Código de autorización" className={inpModal + " sm:max-w-xs"} />
              </div>
            )}
            {(n(form.cheque) > 0 || n(form.tdc) > 0) && (
              <div className="mt-3 space-y-2">
                {n(form.cheque) > 0 && (
                  <ComprobanteField
                    label="Comprobante de cheque / depósito / transferencia"
                    path={form.comprobante_cheque_path}
                    subiendo={subiendoComprobante === "cheque"}
                    onFile={(f) => handleComprobanteChange("cheque", f)}
                    onVer={() => handleVer(form.comprobante_cheque_path)}
                  />
                )}
                {n(form.tdc) > 0 && (
                  <ComprobanteField
                    label="Comprobante de la terminal (ticket TDC)"
                    path={form.comprobante_tdc_path}
                    subiendo={subiendoComprobante === "tdc"}
                    onFile={(f) => handleComprobanteChange("tdc", f)}
                    onVer={() => handleVer(form.comprobante_tdc_path)}
                  />
                )}
              </div>
            )}
          </div>

          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Documentación recibida</p>
            <p className="text-[11px] text-gray-400 mb-3">
              Identificación siempre obligatoria.{" "}
              {esAmpliaOLimitada(form.cobertura)
                ? "Cobertura amplia/limitada: fotos también obligatorias, y mínimo una de Factura, T. Circulación o Póliza anterior."
                : "Mínimo una de Fotos, Factura, T. Circulación o Póliza anterior."}
            </p>
            <div className="space-y-2">
              <ComprobanteField
                label="Identificación"
                path={form.identif_path}
                subiendo={subiendoDocumento === "identif"}
                onFile={(f) => handleDocumentoChange("identif", f)}
                onVer={() => handleVerDocumento(form.identif_path)}
              />
              <ComprobanteField
                label="Fotos del vehículo"
                path={form.fotos_path}
                subiendo={subiendoDocumento === "fotos"}
                onFile={(f) => handleDocumentoChange("fotos", f)}
                onVer={() => handleVerDocumento(form.fotos_path)}
                obligatorio={esAmpliaOLimitada(form.cobertura)}
              />
              <ComprobanteField
                label="Factura"
                path={form.factura_path}
                subiendo={subiendoDocumento === "factura"}
                onFile={(f) => handleDocumentoChange("factura", f)}
                onVer={() => handleVerDocumento(form.factura_path)}
                obligatorio={false}
              />
              <ComprobanteField
                label="Tarjeta de circulación"
                path={form.t_circ_path}
                subiendo={subiendoDocumento === "t_circ"}
                onFile={(f) => handleDocumentoChange("t_circ", f)}
                onVer={() => handleVerDocumento(form.t_circ_path)}
                obligatorio={false}
              />
              <ComprobanteField
                label="Póliza anterior"
                path={form.pol_ant_path}
                subiendo={subiendoDocumento === "pol_ant"}
                onFile={(f) => handleDocumentoChange("pol_ant", f)}
                onVer={() => handleVerDocumento(form.pol_ant_path)}
                obligatorio={false}
              />
              <ComprobanteField
                label="Otro"
                path={form.otro_path}
                subiendo={subiendoDocumento === "otro"}
                onFile={(f) => handleDocumentoChange("otro", f)}
                onVer={() => handleVerDocumento(form.otro_path)}
                obligatorio={false}
              />
            </div>
          </div>

          <div>
            <label className={lblModal}>Observaciones</label>
            <textarea
              rows={3}
              value={form.observaciones}
              onChange={(e) => setF("observaciones", e.target.value)}
              placeholder="Notas adicionales, irregularidades, comentarios…"
              className={inpModal + " resize-none"}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1447e6] hover:bg-[#0f36b3] text-white text-sm font-bold disabled:opacity-50 transition-all">
              {guardando ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Guardando...</>
              ) : (
                <>Guardar</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
