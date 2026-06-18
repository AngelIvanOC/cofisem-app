import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import {
  fetchPolizaById,
  buildPolizaPDF,
  contarPolizasCliente,
  contarPolizasConcesionario,
} from "../../../services/polizas";
import { fetchConfigCostos } from "../../../services/configuracion";
import { actualizarNombreCliente } from "../../../services/clientes";
import { actualizarNombreConcesionario } from "../../../services/concesionarios";
import { pdf } from "@react-pdf/renderer";
import EndosoCancelacionPDF from "../../../components/pdf/EndosoCancelacionPDF";
import Swal from "sweetalert2";
import { Loader2, Pencil, X } from "lucide-react";

const inpCls =
  "w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all";

function buildDescripcionEndoso(tipo, oldValue, newValue) {
  const nv = (newValue || "").toUpperCase().trim();
  const ov = (oldValue || "—").toUpperCase().trim();
  switch (tipo) {
    case "Cambio de placas":
      return `SE HACE CAMBIO DE PLACAS DE ${ov} A QUEDAR COMO ${nv}`;
    case "Cambio de No. Serie":
      return `SE HACE CAMBIO DE NÚMERO DE SERIE DE ${ov} A QUEDAR COMO ${nv}`;
    case "Cambio de No. Motor":
      return `SE HACE CAMBIO DE NÚMERO DE MOTOR DE ${ov} A QUEDAR COMO ${nv}`;
    case "Cambio de asegurado":
      return `SE HACE CAMBIO DE ASEGURADO DE ${ov} A QUEDAR COMO ${nv}`;
    case "Cambio de concesionario":
      return `SE HACE CAMBIO DE CONCESIONARIO DE ${ov} A QUEDAR COMO ${nv}`;
    default:
      return nv;
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

const difsCampo = (original, nuevo) => {
  if (!original) return 0;
  if (original.length !== nuevo.length) return Infinity;
  let n = 0;
  for (let i = 0; i < original.length; i++) if (original[i] !== nuevo[i]) n++;
  return n;
};

const FORM_VACIO = {
  placas: "",
  numSerie: "",
  numMotor: "",
  asegNombre: "",
  asegApellido1: "",
  asegApellido2: "",
  concNombre: "",
  concApellido1: "",
  concApellido2: "",
};

export default function ModalEndoso({ poliza, usuario, onClose, onDone }) {
  const [cargando, setCargando]     = useState(true);
  const [full, setFull]             = useState(null);
  const [perms, setPerms]           = useState({ asegurado: false, concesionario: false });
  const [tipo, setTipo]             = useState("");
  const [form, setForm]             = useState(FORM_VACIO);
  const [procesando, setProcesando] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

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
        setPerms({
          asegurado:    cntCliente <= 1,
          concesionario: conc != null && cntConc <= 1,
        });
        setForm({
          placas:        fullData.placas || "",
          numSerie:      fullData.num_serie || "",
          numMotor:      fullData.num_motor || "",
          asegNombre:    cliente.nombre || "",
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
    ...(perms.asegurado      ? ["Cambio de asegurado"]      : []),
    ...(perms.concesionario  ? ["Cambio de concesionario"]  : []),
  ];

  const difsSerie = full ? difsCampo(full.num_serie || "", form.numSerie) : 0;
  const difsMotor = full ? difsCampo(full.num_motor || "", form.numMotor) : 0;

  const valido = tipo && (() => {
    switch (tipo) {
      case "Cambio de placas":        return form.placas.trim();
      case "Cambio de No. Serie":     return form.numSerie.trim().length > 0 && difsSerie <= 2 && difsSerie > 0;
      case "Cambio de No. Motor":     return form.numMotor.trim().length > 0 && difsMotor <= 2 && difsMotor > 0;
      case "Cambio de asegurado":     return form.asegNombre.trim() && form.asegApellido1.trim();
      case "Cambio de concesionario": return form.concNombre.trim() && form.concApellido1.trim();
      default: return false;
    }
  })();

  const buildPreview = () => {
    if (!tipo || !full) return "";
    const cliente = full.clientes ?? {};
    const conc    = full.concesionarios ?? null;
    switch (tipo) {
      case "Cambio de placas":
        return buildDescripcionEndoso(tipo, full.placas || "—", form.placas);
      case "Cambio de No. Serie":
        return buildDescripcionEndoso(tipo, full.num_serie || "—", form.numSerie.toUpperCase());
      case "Cambio de No. Motor":
        return buildDescripcionEndoso(tipo, full.num_motor || "—", form.numMotor.toUpperCase());
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

      // 1. Generar y descargar PDF endoso tipo "A"
      const config    = await fetchConfigCostos(full.fecha_inicio);
      const polizaPDF = buildPolizaPDF(full, full.oficinas, config);
      const fechaEndoso = new Date().toLocaleDateString("es-MX", {
        day: "2-digit", month: "2-digit", year: "numeric",
      });
      const blob = await pdf(
        <EndosoCancelacionPDF
          poliza={polizaPDF}
          motivo={descripcion}
          fechaEndoso={fechaEndoso}
          tipoEndoso="A"
          numeroControl={full.id}
        />,
      ).toBlob();
      descargarBlob(blob, `ENDOSO_A-${constanciaLabel}.pdf`);

      // 2. Actualizar solo el campo del tipo seleccionado
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
        default:
          break;
      }

      // 3. Historial de auditoría
      await supabase.from("polizas_historial").insert({
        poliza_id:     poliza.id,
        estatus_nuevo: "EDITADA",
        notas:         descripcion,
        cambiado_por:  usuario?.id ?? null,
      });

      onDone();
      Swal.fire({
        icon: "success",
        title: "Endoso generado",
        text: `El endoso de la póliza ${constanciaLabel} fue generado y descargado.`,
        confirmButtonColor: "#13193a",
        confirmButtonText: "Aceptar",
        timer: 5000,
        timerProgressBar: true,
      });
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo generar el endoso: " + e.message,
        confirmButtonColor: "#13193a",
      });
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(10,15,40,0.55)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
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
                {tiposDisponibles.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTipo(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                      tipo === t
                        ? "bg-[#13193a] text-white border-[#13193a]"
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {t}
                  </button>
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

            {/* Cambio de placas */}
            {tipo === "Cambio de placas" && (
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                  Placas <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.placas}
                  onChange={(e) => set("placas", e.target.value.toUpperCase())}
                  className={inpCls}
                  placeholder="Ej. ABC-123X"
                />
              </div>
            )}

            {/* Cambio de No. Serie — máx. 2 posiciones distintas */}
            {tipo === "Cambio de No. Serie" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                    No. Serie <span className="text-red-400">*</span>
                  </label>
                  {difsSerie > 0 && (
                    <span className={`text-[10px] font-semibold ${difsSerie > 2 ? "text-red-500" : "text-amber-500"}`}>
                      {difsSerie > 2 ? `${difsSerie} cambios — máx. 2` : `${difsSerie}/2 cambios`}
                    </span>
                  )}
                </div>
                <input
                  value={form.numSerie}
                  onChange={(e) => set("numSerie", e.target.value.toUpperCase())}
                  maxLength={(full?.num_serie || "").length || undefined}
                  className={`${inpCls} font-mono font-bold text-[#13193a] ${difsSerie > 2 ? "border-red-300 bg-red-50 focus:ring-red-200" : ""}`}
                />
                <p className="text-[10px] text-amber-600 mt-1.5">
                  Máximo 2 caracteres distintos en cualquier posición. La longitud no puede cambiar.
                </p>
              </div>
            )}

            {/* Cambio de No. Motor — máx. 2 posiciones distintas */}
            {tipo === "Cambio de No. Motor" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                    No. Motor <span className="text-red-400">*</span>
                  </label>
                  {difsMotor > 0 && (
                    <span className={`text-[10px] font-semibold ${difsMotor > 2 ? "text-red-500" : "text-amber-500"}`}>
                      {difsMotor > 2 ? `${difsMotor} cambios — máx. 2` : `${difsMotor}/2 cambios`}
                    </span>
                  )}
                </div>
                <input
                  value={form.numMotor}
                  onChange={(e) => set("numMotor", e.target.value.toUpperCase())}
                  maxLength={(full?.num_motor || "").length || undefined}
                  className={`${inpCls} font-mono font-bold text-[#13193a] ${difsMotor > 2 ? "border-red-300 bg-red-50 focus:ring-red-200" : ""}`}
                />
                <p className="text-[10px] text-amber-600 mt-1.5">
                  Máximo 2 caracteres distintos en cualquier posición. La longitud no puede cambiar.
                </p>
              </div>
            )}

            {/* Cambio de asegurado */}
            {tipo === "Cambio de asegurado" && (
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                  Datos del nuevo asegurado
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                      Nombre <span className="text-red-400">*</span>
                    </label>
                    <input value={form.asegNombre} onChange={(e) => set("asegNombre", e.target.value.toUpperCase())} className={inpCls} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                      Ap. Paterno <span className="text-red-400">*</span>
                    </label>
                    <input value={form.asegApellido1} onChange={(e) => set("asegApellido1", e.target.value.toUpperCase())} className={inpCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                    Ap. Materno
                  </label>
                  <input value={form.asegApellido2} onChange={(e) => set("asegApellido2", e.target.value.toUpperCase())} className={inpCls} />
                </div>
              </div>
            )}

            {/* Cambio de concesionario */}
            {tipo === "Cambio de concesionario" && (
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                  Datos del nuevo concesionario
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                      Nombre <span className="text-red-400">*</span>
                    </label>
                    <input value={form.concNombre} onChange={(e) => set("concNombre", e.target.value.toUpperCase())} className={inpCls} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                      Ap. Paterno <span className="text-red-400">*</span>
                    </label>
                    <input value={form.concApellido1} onChange={(e) => set("concApellido1", e.target.value.toUpperCase())} className={inpCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                    Ap. Materno
                  </label>
                  <input value={form.concApellido2} onChange={(e) => set("concApellido2", e.target.value.toUpperCase())} className={inpCls} />
                </div>
              </div>
            )}

            {/* Preview texto PDF */}
            {tipo && buildPreview() && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide mb-1">
                  Vista previa — texto en el PDF
                </p>
                <p className="text-xs text-amber-900 font-mono leading-relaxed">
                  {buildPreview()}
                </p>
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
              className="flex-1 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 transition-all shadow-lg shadow-[#13193a]/15 flex items-center justify-center gap-2"
            >
              {procesando ? (
                <><Loader2 className="animate-spin w-4 h-4" /> Generando…</>
              ) : (
                "Generar endoso"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
