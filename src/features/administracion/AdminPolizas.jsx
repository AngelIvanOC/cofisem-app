import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../supabaseClient";
import { fetchPolizaById, buildPolizaPDF, cancelarPoliza, contarPolizasCliente, contarPolizasConcesionario, calcularEstatus } from "../../services/polizas";
import { fetchConfigCostos } from "../../services/configuracion";
import { actualizarNombreCliente } from "../../services/clientes";
import { actualizarNombreConcesionario } from "../../services/concesionarios";
import { pdf } from "@react-pdf/renderer";
import EndosoCancelacionPDF from "../../components/pdf/EndosoCancelacionPDF";
import Swal from "sweetalert2";
import StatusBadge from "../operador/components/StatusBadge";
import { usePagination } from "../../hooks/usePagination";
import Paginator from "../../components/Paginator";
import {
  AlertTriangle, Loader2, Pencil, Search, X,
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
  const [tipoEndoso,   setTipoEndoso]   = useState("C");
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
          tipoEndoso={tipoEndoso}
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

          {/* Tipo cancelación */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Tipo de cancelación</label>
            <select value={tipoEndoso} onChange={e => setTipoEndoso(e.target.value)} className={inpCls}>
              <option value="C">TIPO C</option>
              <option value="B">TIPO B</option>
            </select>
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
        clientes(nombre, apellido),
        vendedores(nombre, apellido),
        oficinas(id, nombre),
        coberturas(nombre, prima_neta, prima_total)
      `)
      .neq("estatus", "COTIZACION")
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

      {modal === "endoso"  && polSel && <ModalEndoso  poliza={polSel} onClose={cerrarModal} onDone={() => { cerrarModal(); cargar(); }}/>}
      {modal === "cancelar" && polSel && <ModalCancelar poliza={polSel} onClose={cerrarModal} onDone={() => { cerrarModal(); cargar(); }}/>}
    </div>
  );
}
