import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../supabaseClient";
import { fetchPolizaById, buildPolizaPDF, cancelarPoliza, contarPolizasCliente, contarPolizasConcesionario, calcularEstatus, crearPolizaSubsecuente } from "../../services/polizas";
import { fetchOperadores } from "../../services/usuarios";
import { fetchConfigCostos } from "../../services/configuracion";
import { actualizarNombreCliente } from "../../services/clientes";
import { actualizarNombreConcesionario } from "../../services/concesionarios";
import { pdf, PDFViewer } from "@react-pdf/renderer";
import EndosoCancelacionPDF from "../../components/pdf/EndosoCancelacionPDF";
import CancelacionProrrataPDF from "../../components/pdf/CancelacionProrrataPDF";
import Swal from "sweetalert2";
import StatusBadge from "../operador/components/StatusBadge";
import { usePagination } from "../../hooks/usePagination";
import Paginator from "../../components/Paginator";
import {
  AlertTriangle, CheckCircle2, Eye, Loader2, Pencil, Search, TrendingDown, X,
} from "lucide-react";

const MOTIVOS_CANCEL = {
  "Solicitud del cliente": "SE CANCELA PÓLIZA A SOLICITUD DEL CLIENTE",
  "Falta de pago":         "SE CANCELA PÓLIZA POR FALTA DE PAGO",
  "Duplicado":             "SE CANCELA PÓLIZA POR DUPLICADO",
  "Error en emisión":      "SE CANCELA PÓLIZA POR ERROR EN EMISIÓN",
  "Otro":                  null,
};

// ── Helpers ───────────────────────────────────────────────────
function buildDescripcionEndoso(tipo, oldValue, newValue) {
  const nv = (newValue || "").toUpperCase().trim();
  const ov = (oldValue || "—").toUpperCase().trim();
  switch (tipo) {
    case "Cambio de placas":        return `SE HACE CAMBIO DE PLACAS DE ${ov} A QUEDAR COMO ${nv}`;
    case "Cambio de No. Serie":     return `SE HACE CAMBIO DE NÚMERO DE SERIE DE ${ov} A QUEDAR COMO ${nv}`;
    case "Cambio de No. Motor":     return `SE HACE CAMBIO DE NÚMERO DE MOTOR DE ${ov} A QUEDAR COMO ${nv}`;
    case "Cambio de asegurado":     return `SE HACE CAMBIO DE ASEGURADO DE ${ov} A QUEDAR COMO ${nv}`;
    case "Cambio de concesionario": return `SE HACE CAMBIO DE CONCESIONARIO DE ${ov} A QUEDAR COMO ${nv}`;
    default: return nv;
  }
}

function descargarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

function fmtFecha(str) {
  if (!str) return "—";
  return new Date(str + "T12:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── Modal Endoso ──────────────────────────────────────────────
const FORM_VACIO = {
  placas: "", numSerie: "", numMotor: "",
  asegNombre: "", asegApellido1: "", asegApellido2: "",
  concNombre: "", concApellido1: "", concApellido2: "",
};

function ModalEndoso({ poliza, onClose, onDone }) {
  const [cargando,   setCargando]   = useState(true);
  const [full,       setFull]       = useState(null);
  const [perms,      setPerms]      = useState({ asegurado: false, concesionario: false });
  const [tipo,       setTipo]       = useState("");
  const [form,       setForm]       = useState(FORM_VACIO);
  const [procesando, setProcesando] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Carga datos al abrir
  useEffect(() => {
    (async () => {
      try {
        const fullData = await fetchPolizaById(poliza.id);
        const [cntCliente, cntConc] = await Promise.all([
          contarPolizasCliente(fullData.cliente_id),
          fullData.concesionario_id
            ? contarPolizasConcesionario(fullData.concesionario_id)
            : Promise.resolve(999),
        ]);
        const cliente = fullData.clientes ?? {};
        const conc    = fullData.concesionarios ?? null;
        setFull(fullData);
        setPerms({ asegurado: cntCliente <= 1, concesionario: conc != null && cntConc <= 1 });
        setForm({
          placas:       fullData.placas    || "",
          numSerie:     fullData.num_serie || "",
          numMotor:     fullData.num_motor || "",
          asegNombre:    cliente.nombre    || "",
          asegApellido1: (cliente.apellido || "").split(" ")[0] || "",
          asegApellido2: (cliente.apellido || "").split(" ").slice(1).join(" ") || "",
          concNombre:    conc?.nombre    || "",
          concApellido1: conc?.apellido1 || "",
          concApellido2: conc?.apellido2 || "",
        });
      } catch (e) {
        console.error(e);
        onClose();
      } finally {
        setCargando(false);
      }
    })();
  }, [poliza.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const tiposDisponibles = [
    "Cambio de placas",
    "Cambio de No. Serie",
    "Cambio de No. Motor",
    ...(perms.asegurado     ? ["Cambio de asegurado"]     : []),
    ...(perms.concesionario ? ["Cambio de concesionario"] : []),
  ];

  const esPersona = tipo === "Cambio de asegurado" || tipo === "Cambio de concesionario";

  const valido = tipo && (() => {
    switch (tipo) {
      case "Cambio de placas":        return form.placas.trim();
      case "Cambio de No. Serie":     return form.numSerie.trim();
      case "Cambio de No. Motor":     return form.numMotor.trim();
      case "Cambio de asegurado":     return form.asegNombre.trim() && form.asegApellido1.trim();
      case "Cambio de concesionario": return form.concNombre.trim() && form.concApellido1.trim();
      default: return false;
    }
  })();

  // Descripción preview (usa valores del form como nuevo y datos de `full` como viejo)
  const buildPreview = () => {
    if (!tipo || !full) return "";
    const cliente = full.clientes ?? {};
    const conc    = full.concesionarios ?? null;
    switch (tipo) {
      case "Cambio de placas":
        return buildDescripcionEndoso(tipo, full.placas || "—", form.placas);
      case "Cambio de No. Serie":
        return buildDescripcionEndoso(tipo, full.num_serie || "—", form.numSerie);
      case "Cambio de No. Motor":
        return buildDescripcionEndoso(tipo, full.num_motor || "—", form.numMotor);
      case "Cambio de asegurado": {
        const oldNombre = `${cliente.nombre || ""} ${cliente.apellido || ""}`.trim();
        const newNombre = [form.asegNombre, form.asegApellido1, form.asegApellido2].filter(Boolean).join(" ");
        return buildDescripcionEndoso(tipo, oldNombre, newNombre);
      }
      case "Cambio de concesionario": {
        const oldConc = [conc?.nombre, conc?.apellido1, conc?.apellido2].filter(Boolean).join(" ") || "—";
        const newConc = [form.concNombre, form.concApellido1, form.concApellido2].filter(Boolean).join(" ");
        return buildDescripcionEndoso(tipo, oldConc, newConc);
      }
      default: return "";
    }
  };

  const handleConfirmar = async () => {
    setProcesando(true);
    const constanciaLabel = poliza.constancia || poliza.numero_poliza;
    try {
      const descripcion = buildPreview();

      // Generar PDF
      const config    = await fetchConfigCostos(full.fecha_inicio);
      const polizaPDF   = buildPolizaPDF(full, full.oficinas, config);
      const fechaEndoso = new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
      const blob = await pdf(
        <EndosoCancelacionPDF
          poliza={polizaPDF}
          motivo={descripcion}
          fechaEndoso={fechaEndoso}
          tipoEndoso="A"
          numeroControl={full.id}
        />
      ).toBlob();
      descargarBlob(blob, `ENDOSO_A-${constanciaLabel}.pdf`);

      // Actualizar BD
      switch (tipo) {
        case "Cambio de placas":
          await supabase.from("polizas").update({ placas: form.placas.toUpperCase().trim() }).eq("id", poliza.id);
          break;
        case "Cambio de No. Serie":
          await supabase.from("polizas").update({ num_serie: form.numSerie.toUpperCase().trim() }).eq("id", poliza.id);
          break;
        case "Cambio de No. Motor":
          await supabase.from("polizas").update({ num_motor: form.numMotor.toUpperCase().trim() }).eq("id", poliza.id);
          break;
        case "Cambio de asegurado": {
          const apellido = [form.asegApellido1, form.asegApellido2].filter(Boolean).join(" ");
          await actualizarNombreCliente(full.cliente_id, form.asegNombre.toUpperCase(), apellido.toUpperCase());
          break;
        }
        case "Cambio de concesionario":
          await actualizarNombreConcesionario(
            full.concesionario_id,
            form.concNombre.toUpperCase(),
            form.concApellido1.toUpperCase(),
            form.concApellido2.toUpperCase(),
          );
          break;
        default: break;
      }

      // Historial
      await supabase.from("polizas_historial").insert({
        poliza_id: poliza.id, estatus_nuevo: "EDITADA", notas: descripcion, cambiado_por: null,
      });

      onDone();
      Swal.fire({
        icon: "success", title: "Endoso generado",
        text: `El endoso de la póliza ${constanciaLabel} fue generado y descargado.`,
        confirmButtonColor: "#13193a", confirmButtonText: "Aceptar", timer: 5000, timerProgressBar: true,
      });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo generar el endoso: " + e.message, confirmButtonColor: "#13193a" });
    } finally {
      setProcesando(false);
    }
  };

  const inpCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(10,15,40,0.55)" }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
            <Pencil className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-[#13193a]">Nuevo endoso</h2>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">
              {poliza.constancia || poliza.numero_poliza} · {poliza.clientes?.nombre} {poliza.clientes?.apellido}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Loading */}
        {cargando && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-[#13193a]/30" />
          </div>
        )}

        {/* Body */}
        {!cargando && full && (
          <div className="p-6 space-y-4">
            {/* Tipo de endoso */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                Tipo de endoso <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {tiposDisponibles.map(t => (
                  <button key={t} onClick={() => setTipo(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                      tipo === t ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                    }`}>{t}</button>
                ))}
              </div>
              {!perms.asegurado && (
                <p className="text-[10px] text-amber-600 mt-2">
                  Cambio de asegurado no disponible — el cliente tiene más de 1 póliza.
                </p>
              )}
              {full.concesionarios && !perms.concesionario && (
                <p className="text-[10px] text-amber-600 mt-1">
                  Cambio de concesionario no disponible — tiene más de 1 póliza.
                </p>
              )}
            </div>

            {/* Inputs según tipo */}
            {tipo === "Cambio de placas" && (
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Placas <span className="text-red-400">*</span></label>
                <input value={form.placas} onChange={e => set("placas", e.target.value.toUpperCase())} className={inpCls} placeholder="Ej. ABC-123X"/>
              </div>
            )}

            {tipo === "Cambio de No. Serie" && (
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">No. Serie <span className="text-red-400">*</span></label>
                <input value={form.numSerie} onChange={e => set("numSerie", e.target.value.toUpperCase())} className={inpCls} placeholder="Número de serie"/>
              </div>
            )}

            {tipo === "Cambio de No. Motor" && (
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">No. Motor <span className="text-red-400">*</span></label>
                <input value={form.numMotor} onChange={e => set("numMotor", e.target.value.toUpperCase())} className={inpCls} placeholder="Número de motor"/>
              </div>
            )}

            {tipo === "Cambio de asegurado" && (
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Datos del nuevo asegurado</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Nombre <span className="text-red-400">*</span></label>
                    <input value={form.asegNombre} onChange={e => set("asegNombre", e.target.value.toUpperCase())} className={inpCls}/>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Ap. Paterno <span className="text-red-400">*</span></label>
                    <input value={form.asegApellido1} onChange={e => set("asegApellido1", e.target.value.toUpperCase())} className={inpCls}/>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Ap. Materno</label>
                  <input value={form.asegApellido2} onChange={e => set("asegApellido2", e.target.value.toUpperCase())} className={inpCls}/>
                </div>
              </div>
            )}

            {tipo === "Cambio de concesionario" && (
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Datos del nuevo concesionario</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Nombre <span className="text-red-400">*</span></label>
                    <input value={form.concNombre} onChange={e => set("concNombre", e.target.value.toUpperCase())} className={inpCls}/>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Ap. Paterno <span className="text-red-400">*</span></label>
                    <input value={form.concApellido1} onChange={e => set("concApellido1", e.target.value.toUpperCase())} className={inpCls}/>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Ap. Materno</label>
                  <input value={form.concApellido2} onChange={e => set("concApellido2", e.target.value.toUpperCase())} className={inpCls}/>
                </div>
              </div>
            )}

            {/* Preview descripción PDF */}
            {tipo && buildPreview() && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide mb-1">Vista previa — texto en el PDF</p>
                <p className="text-xs text-amber-900 font-mono leading-relaxed">{buildPreview()}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {!cargando && (
          <div className="flex gap-3 px-6 pb-6">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={!valido || procesando}
              className="flex-1 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 transition-all shadow-lg shadow-[#13193a]/15 flex items-center justify-center gap-2">
              {procesando ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4" />
                  Generando…
                </>
              ) : "Generar endoso"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Modal Cancelar ────────────────────────────────────────────
function ModalCancelar({ poliza, onClose, onDone }) {
  const [motivo,       setMotivo]       = useState("");
  const [motivoCustom, setMotivoCustom] = useState("");
  const [procesando,   setProcesando]   = useState(false);

  const valido = motivo && (motivo !== "Otro" || motivoCustom.trim());

  const inpCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all";

  const handleConfirmar = async () => {
    setProcesando(true);
    const constanciaLabel = poliza.constancia || poliza.numero_poliza;
    try {
      const descripcion = motivo === "Otro"
        ? motivoCustom.toUpperCase().trim()
        : MOTIVOS_CANCEL[motivo];

      const [full, config] = await Promise.all([fetchPolizaById(poliza.id), fetchConfigCostos(poliza.fecha_inicio)]);
      const polizaPDF = buildPolizaPDF(full, full.oficinas, config);
      const fechaEndoso = new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });

      const blob = await pdf(
        <EndosoCancelacionPDF
          poliza={polizaPDF}
          motivo={descripcion}
          fechaEndoso={fechaEndoso}
          tipoEndoso="C"
          numeroControl={full.id}
        />
      ).toBlob();
      descargarBlob(blob, `ENDOSO_CANCELACION-${constanciaLabel}.pdf`);

      await cancelarPoliza(poliza.id, descripcion, null);

      onDone();
      Swal.fire({
        icon: "success",
        title: "Póliza cancelada",
        text: `La póliza ${constanciaLabel} fue cancelada y se descargó el endoso.`,
        confirmButtonColor: "#13193a",
        confirmButtonText: "Aceptar",
        timer: 5000,
        timerProgressBar: true,
      });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo cancelar la póliza: " + e.message, confirmButtonColor: "#13193a" });
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(10,15,40,0.55)" }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-[#13193a]">Cancelar póliza</h2>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">
              {poliza.constancia || poliza.numero_poliza} · {poliza.clientes?.nombre} {poliza.clientes?.apellido}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-medium">
            Esta acción cancelará la póliza. El asegurado perderá cobertura de inmediato.
          </div>

          {/* Motivo pills */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">
              Motivo <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(MOTIVOS_CANCEL).map(m => (
                <button key={m} onClick={() => { setMotivo(m); setMotivoCustom(""); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                    motivo === m ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                  }`}>{m}</button>
              ))}
            </div>
          </div>

          {/* Textarea solo si "Otro" */}
          {motivo === "Otro" && (
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                Motivo <span className="text-red-400">*</span>
              </label>
              <textarea
                value={motivoCustom}
                onChange={e => setMotivoCustom(e.target.value)}
                placeholder="Describe el motivo de la cancelación..."
                rows={3}
                className={`${inpCls} resize-none`}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={!valido || procesando}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-2">
            {procesando ? (
              <>
                <Loader2 className="animate-spin w-4 h-4" />
                Procesando…
              </>
            ) : "Confirmar cancelación"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Cálculo de prorrata ───────────────────────────────────────
function calcularProrrata(poliza, config) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const inicio = new Date(poliza.fecha_inicio + "T00:00:00");
  const fin    = new Date(poliza.fecha_fin    + "T00:00:00");

  const diasTotales      = Math.round((fin   - inicio) / 86400000);
  const diasTranscurridos= Math.max(0, Math.round((hoy   - inicio) / 86400000));
  const diasRestantes    = Math.max(0, diasTotales - diasTranscurridos);

  const primaTotal   = poliza.coberturas?.prima_total ?? 0;
  const ivaPct       = config?.iva_pct          ?? 16;
  const derechos     = config?.derechos_emision ?? 400;

  const ivaOriginal     = +(primaTotal * ivaPct / (100 + ivaPct)).toFixed(2);
  const primaNeta       = +(primaTotal - ivaOriginal - derechos).toFixed(2);
  const primaNetaDia    = diasTotales > 0 ? +(primaNeta / diasTotales).toFixed(4) : 0;
  const primaNoDevengada= +(primaNetaDia * diasRestantes).toFixed(2);
  const ivaNoDevengada  = +(primaNoDevengada * ivaPct / 100).toFixed(2);
  const totalDevolver   = +(primaNoDevengada + ivaNoDevengada).toFixed(2);

  return {
    primaTotal, ivaOriginal, derechos, primaNeta, primaNetaDia,
    diasTotales, diasTranscurridos, diasRestantes,
    primaNoDevengada, ivaNoDevengada, totalDevolver,
    fechaCancelacion: hoy.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }),
  };
}

// ── Modal Cancelar y Devengar (Tipo B) ────────────────────────
function ModalCancelarProrrata({ poliza, onClose, onDone }) {
  const [cargando,       setCargando]       = useState(true);
  const [prorrata,       setProrrata]       = useState(null);
  const [polizaPDF,      setPolizaPDF]      = useState(null);
  const [abreNueva,      setAbreNueva]      = useState(false);
  const [proxConstancia, setProxConstancia] = useState(null);
  const [cargandoProx,   setCargandoProx]   = useState(false);
  const [operadores,     setOperadores]     = useState([]);
  const [operadorId,     setOperadorId]     = useState("");
  const [procesando,     setProcesando]     = useState(false);
  const [preview,        setPreview]        = useState(false);

  const fmt$ = (n) => `$${Number(n ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fechaHoy = new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });

  // Carga datos completos al abrir
  useEffect(() => {
    (async () => {
      try {
        const [full, config] = await Promise.all([
          fetchPolizaById(poliza.id),
          fetchConfigCostos(poliza.fecha_inicio),
        ]);
        setProrrata(calcularProrrata(poliza, config));
        setPolizaPDF(buildPolizaPDF(full, full.oficinas, config));
      } catch (e) {
        console.error(e);
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  // Carga operadores y predice constancia cuando se activa el switch
  useEffect(() => {
    if (!abreNueva) { setProxConstancia(null); setOperadorId(""); return; }
    setCargandoProx(true);
    (async () => {
      try {
        const [ops, countResult] = await Promise.all([
          fetchOperadores(),
          supabase
            .from("polizas")
            .select("id", { count: "exact", head: true })
            .in("estatus", ["VIGENTE","POR VENCER","VENCIDA","CANCELADA"]),
        ]);
        setOperadores(ops);
        const fecha = new Date();
        const yy   = String(fecha.getFullYear()).slice(-2);
        const ofic = String(poliza.oficinas?.id || 1).padStart(2, "0");
        setProxConstancia(`01${yy}${ofic}${String((countResult.count ?? 0) + 1).padStart(8, "0")}-01`);
      } catch { setProxConstancia(null); }
      finally  { setCargandoProx(false); }
    })();
  }, [abreNueva]);

  const pdfProps = prorrata && polizaPDF ? {
    poliza:           polizaPDF,
    prorrata:         { ...prorrata, fechaCancelacion: fechaHoy },
    constanciaFutura: abreNueva ? proxConstancia : null,
    fechaEndoso:      fechaHoy,
    numeroControl:    poliza.id,
  } : null;

  const handleConfirmar = async () => {
    if (!pdfProps) return;
    setProcesando(true);
    const constanciaLabel = poliza.constancia || poliza.numero_poliza;
    try {
      // Si hay póliza sustituta: primero reservar la constancia real en BD
      let constanciaReal = null;
      if (abreNueva) {
        const subs = await crearPolizaSubsecuente({
          polizaOriginalId: poliza.id,
          clienteId:   poliza.cliente_id ?? null,
          coberturaId: poliza.cobertura_id ?? null,
          oficina_id:  poliza.oficinas?.id ?? poliza.oficina_id ?? null,
          creadoPor:   operadorId || null,
        });
        constanciaReal = subs.constancia;
      }

      // Generar PDF con la constancia real (o null si no hay sustituta)
      const propsConConstancia = {
        ...pdfProps,
        constanciaFutura: abreNueva ? constanciaReal : null,
      };
      const blob = await pdf(<CancelacionProrrataPDF {...propsConConstancia} />).toBlob();
      descargarBlob(blob, `CANCELACION_PRORRATA-${constanciaLabel}.pdf`);
      await cancelarPoliza(poliza.id, "CANCELACION POR BAJA DE UNIDAD", null);
      onDone();
      Swal.fire({
        icon: "success",
        title: "Póliza cancelada",
        text: `La póliza ${constanciaLabel} fue cancelada. Se descargó el endoso tipo B y el recibo de prorrata.`,
        confirmButtonColor: "#13193a",
        timer: 5000,
        timerProgressBar: true,
      });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo procesar: " + e.message, confirmButtonColor: "#13193a" });
    } finally {
      setProcesando(false);
    }
  };

  // ── Visor de preview ────────────────────────────────────────
  if (preview && pdfProps) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 shrink-0">
          <span className="text-sm font-bold text-[#13193a]">
            Vista previa — Cancelación a prorrata
            <span className="ml-2 text-xs font-normal text-gray-400 font-mono">{poliza.constancia}</span>
          </span>
          <button
            onClick={() => setPreview(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            <X className="w-4 h-4" /> Volver al modal
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
            <CancelacionProrrataPDF {...pdfProps} />
          </PDFViewer>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(10,15,40,0.55)" }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-[#13193a]">Cancelar y Devengar — Tipo B</h2>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">
              {poliza.constancia || poliza.numero_poliza} · {poliza.clientes?.nombre} {poliza.clientes?.apellido}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {cargando ? (
            <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Calculando prorrata…</span>
            </div>
          ) : prorrata ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-800 font-medium">
                Cancelación por baja de unidad. El asegurado recibirá de vuelta su prima no devengada.
              </div>

              {/* TODO: desglose oculto temporalmente — descomentar para pruebas
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Cálculo de prorrata</p>
                </div>
                <div className="px-4 py-3 space-y-1.5 text-xs">
                  {[
                    ["Días totales de vigencia",  String(prorrata.diasTotales)],
                    ["Días transcurridos",        String(prorrata.diasTranscurridos)],
                    ["Días por transcurrir",      String(prorrata.diasRestantes)],
                    null,
                    ["Prima total",               fmt$(prorrata.primaTotal)],
                    ["IVA (incluido en prima)",   fmt$(prorrata.ivaOriginal)],
                    ["Gastos de expedición",      fmt$(prorrata.derechos)],
                    ["Prima neta",                fmt$(prorrata.primaNeta)],
                    ["Prima neta / día",          fmt$(prorrata.primaNetaDia)],
                    null,
                    ["Prima no devengada",        fmt$(prorrata.primaNoDevengada)],
                    ["IVA s/ prima no devengada", fmt$(prorrata.ivaNoDevengada)],
                  ].map((row, i) =>
                    row === null ? (
                      <div key={i} className="border-t border-gray-100 my-1" />
                    ) : (
                      <div key={i} className="flex justify-between">
                        <span className="text-gray-500">{row[0]}</span>
                        <span className="font-semibold text-gray-700 tabular-nums">{row[1]}</span>
                      </div>
                    )
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-bold text-[#13193a]">TOTAL A DEVOLVER</span>
                    <span className="font-black text-emerald-700 tabular-nums text-sm">{fmt$(prorrata.totalDevolver)}</span>
                  </div>
                </div>
              </div>
              */}

              {/* Switch nueva póliza */}
              <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-700">¿Se abrirá una nueva póliza sustituta?</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {abreNueva
                        ? (cargandoProx ? "Calculando constancia…" : `Próx. constancia aprox.: ${proxConstancia ?? "—"}`)
                        : "El recibo dirá: «PARA SUSTITUIR POR PÓLIZA A FUTURO»"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAbreNueva(v => !v)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${abreNueva ? "bg-[#13193a]" : "bg-gray-300"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${abreNueva ? "translate-x-[22px]" : "translate-x-[3px]"}`} />
                  </button>
                </div>

                {/* Select de operador — solo visible cuando abreNueva está ON */}
                {abreNueva && (
                  <div className="px-4 pb-3 border-t border-gray-100 pt-3">
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                      Asignar seguimiento a <span className="text-red-400">*</span>
                    </label>
                    {cargandoProx ? (
                      <div className="flex items-center gap-2 text-gray-400 text-xs py-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando operadores…
                      </div>
                    ) : (
                      <select
                        value={operadorId}
                        onChange={e => setOperadorId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all"
                      >
                        <option value="">— Sin asignar —</option>
                        {operadores.map(op => (
                          <option key={op.id} value={op.id}>
                            {op.nombre} {op.apellido || ""}
                            {op.oficinas?.nombre ? ` · ${op.oficinas.nombre}` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-sm text-red-500 py-6">No se pudo calcular la prorrata.</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2 px-6 pb-6">
          {/* TODO: preview oculto temporalmente — descomentar para pruebas
          {pdfProps && (
            <button
              onClick={() => setPreview(true)}
              className="w-full py-2.5 rounded-xl border border-[#13193a]/20 text-sm font-semibold text-[#13193a] hover:bg-[#13193a]/5 transition-all flex items-center justify-center gap-2">
              <Eye className="w-4 h-4" />
              Vista previa del PDF (sin cancelar)
            </button>
          )}
          */}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              Cerrar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={!pdfProps || procesando}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-2">
              {procesando ? (
                <><Loader2 className="animate-spin w-4 h-4" />Procesando…</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" />Cancelar y descargar PDF</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function AdminPolizas() {
  const [polizas,        setPolizas]        = useState([]);
  const [cargando,       setCargando]       = useState(true);
  const [busqueda,       setBusqueda]       = useState("");
  const [busquedaFiltro, setBusquedaFiltro] = useState("");
  const [filtroOficina,   setFiltroOficina]   = useState("Todas");
  const [filtroVendedor,  setFiltroVendedor]  = useState("Todos");
  const [filtroEstatus,   setFiltroEstatus]   = useState("Todos");
  const [filtroFormaPago, setFiltroFormaPago] = useState("Todas");
  const [filtroCobertura, setFiltroCobertura] = useState("Todas");
  const [tab,            setTab]            = useState("polizas");
  const [modal,          setModal]          = useState(null);
  const [polSel,         setPolSel]         = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from("polizas")
      .select(`
        id, numero_poliza, constancia, estatus, forma_pago,
        fecha_inicio, fecha_fin, placas, aseguradora, created_at,
        cliente_id, cobertura_id, oficina_id,
        clientes(nombre, apellido),
        vendedores(nombre, apellido),
        oficinas(id, nombre),
        coberturas(nombre, prima_neta, prima_total)
      `)
      .in("estatus", ["VIGENTE","POR VENCER","VENCIDA","CANCELADA","ANULADA"])
      .order("fecha_inicio", { ascending: false });
    if (error) console.error("Error cargando pólizas admin:", error.message);
    setPolizas((data ?? []).map(p => ({ ...p, estatus: calcularEstatus(p.estatus, p.fecha_fin) })));
    setCargando(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    const t = setTimeout(() => setBusquedaFiltro(busqueda), 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  // Listas únicas para los filtros
  const listaOficinas   = useMemo(() => [...new Set(polizas.map(p => p.oficinas?.nombre).filter(Boolean))].sort(), [polizas]);
  const listaVendedores = useMemo(() => [...new Set(polizas.map(p => `${p.vendedores?.nombre || ""} ${p.vendedores?.apellido || ""}`.trim()).filter(Boolean))].sort(), [polizas]);
  const listaCoberturas = useMemo(() => [...new Set(polizas.map(p => p.coberturas?.nombre).filter(Boolean))].sort(), [polizas]);
  const listaEstatus    = ["Todos", "VIGENTE", "POR VENCER", "VENCIDA", "CANCELADA", "ANULADA"];

  const filtradas = useMemo(() => {
    const b = busquedaFiltro.toLowerCase();
    return polizas.filter(p => {
      const txt = `${p.constancia || p.numero_poliza} ${p.clientes?.nombre || ""} ${p.clientes?.apellido || ""} ${p.placas || ""}`.toLowerCase();
      const mb  = txt.includes(b);
      const mo  = filtroOficina   === "Todas" || p.oficinas?.nombre  === filtroOficina;
      const mv  = filtroVendedor  === "Todos" || `${p.vendedores?.nombre || ""} ${p.vendedores?.apellido || ""}`.trim() === filtroVendedor;
      const me  = filtroEstatus   === "Todos" || p.estatus     === filtroEstatus;
      const mfp = filtroFormaPago === "Todas" || p.forma_pago  === filtroFormaPago;
      const mc  = filtroCobertura === "Todas" || p.coberturas?.nombre === filtroCobertura;
      return mb && mo && mv && me && mfp && mc;
    });
  }, [polizas, busquedaFiltro, filtroOficina, filtroVendedor, filtroEstatus, filtroFormaPago, filtroCobertura]);

  const { paginated: paginadas, page, setPage, totalPages, total } = usePagination(filtradas);

  const cerrarModal = () => { setModal(null); setPolSel(null); };

  const selCls = "px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15";

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#13193a]">Pólizas</h1>
        <p className="text-gray-400 text-sm mt-0.5">Cancelaciones y endosos — todas las oficinas</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center border-b border-gray-100 px-2">
          <button onClick={() => setTab("polizas")}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${tab === "polizas" ? "border-[#13193a] text-[#13193a]" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
            Pólizas
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-end gap-2 px-5 py-3 border-b border-gray-100">
          {/* Búsqueda */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">Buscar</span>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Póliza, asegurado, placas..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] w-52 bg-white"/>
            </div>
          </div>
          {[
            { label: "Oficina",      value: filtroOficina,   set: setFiltroOficina,   opts: [["Todas","Todas las oficinas"], ...listaOficinas.map(o=>[o,o])] },
            { label: "Vendedor",     value: filtroVendedor,  set: setFiltroVendedor,  opts: [["Todos","Todos los vendedores"], ...listaVendedores.map(v=>[v,v])] },
            { label: "Estatus",      value: filtroEstatus,   set: setFiltroEstatus,   opts: listaEstatus.map(o=>[o,o]) },
            { label: "Forma de pago",value: filtroFormaPago, set: setFiltroFormaPago, opts: [["Todas","Todas"],["CONTADO","Contado"],["PARCIALES","Parciales"]] },
            { label: "Cobertura",    value: filtroCobertura, set: setFiltroCobertura, opts: [["Todas","Todas"], ...listaCoberturas.map(c=>[c,c])] },
          ].map(({ label, value, set, opts }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-1">{label}</span>
              <select value={value} onChange={e => set(e.target.value)}
                className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 max-w-[160px]">
                {opts.map(([v, lbl]) => <option key={v} value={v}>{lbl}</option>)}
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
                  {["Constancia","Asegurado","Oficina","Vendedor","Cobertura","Placas","Prima","Vence","Estatus","Acciones"].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-1 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtradas.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-12 text-sm text-gray-400">No se encontraron pólizas.</td></tr>
                ) : paginadas.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-1 font-mono text-xs font-bold text-[#13193a]">{p.constancia || p.numero_poliza}</td>
                    <td className="px-4 py-1 text-xs font-semibold text-gray-700 whitespace-nowrap">
                      {p.clientes?.nombre} {p.clientes?.apellido}
                    </td>
                    <td className="px-4 py-1 text-xs text-gray-500 max-w-28 truncate">{p.oficinas?.nombre || "—"}</td>
                    <td className="px-4 py-1 text-xs text-gray-500 whitespace-nowrap">
                      {p.vendedores?.nombre} {p.vendedores?.apellido}
                    </td>
                    <td className="px-4 py-1 text-xs text-gray-500 max-w-36 truncate">{p.coberturas?.nombre}</td>
                    <td className="px-4 py-1 font-mono text-xs text-gray-600">{p.placas || "—"}</td>
                    <td className="px-4 py-1 text-xs font-bold text-emerald-700">
                      ${(p.coberturas?.prima_total ?? 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-1 text-xs text-gray-500 whitespace-nowrap">{fmtFecha(p.fecha_fin)}</td>
                    <td className="px-4 py-1">
                      <StatusBadge estatus={p.estatus} />
                    </td>
                    <td className="px-4 py-1">
                      {p.estatus !== "CANCELADA" && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => { setPolSel(p); setModal("endoso"); }}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold hover:bg-amber-100 transition-colors whitespace-nowrap">
                            Endoso
                          </button>
                          <button
                            onClick={() => { setPolSel(p); setModal("cancelar"); }}
                            className="px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold hover:bg-red-100 transition-colors whitespace-nowrap">
                            Cancelar
                          </button>
                          <button
                            onClick={() => { setPolSel(p); setModal("devengar"); }}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 text-[11px] font-bold hover:bg-blue-100 transition-colors whitespace-nowrap flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" />
                            Devengar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <Paginator page={page} totalPages={totalPages} total={total} pageSize={10} onPage={setPage} />
      </div>

      {modal === "endoso"   && polSel && <ModalEndoso           poliza={polSel} onClose={cerrarModal} onDone={() => { cerrarModal(); cargar(); }}/>}
      {modal === "cancelar" && polSel && <ModalCancelar         poliza={polSel} onClose={cerrarModal} onDone={() => { cerrarModal(); cargar(); }}/>}
      {modal === "devengar" && polSel && <ModalCancelarProrrata poliza={polSel} onClose={cerrarModal} onDone={() => { cerrarModal(); cargar(); }}/>}
    </div>
  );
}
