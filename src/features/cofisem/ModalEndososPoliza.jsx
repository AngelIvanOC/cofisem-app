// ============================================================
// src/features/cofisem/ModalEndososPoliza.jsx
// Modal para ver / crear / borrar los ENDOSOS MANUALES de una póliza
// Cofisem (sin pago de por medio). Se abre desde la columna "Acciones"
// de /polizas (PoliciasDia.jsx). Cada endoso tiene fecha (define en qué
// corte aparece como nota gris), descripción y archivo — mismo formato
// que el endoso que hoy se adjunta a un pago.
// ============================================================
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { FileSignature, X, Trash2 } from "lucide-react";
import { ComprobanteField } from "../corte/CompletarPolizaModal";
import {
  subirComprobantePago,
  verComprobantePago,
  MAX_PAGO_COMPROBANTE_BYTES,
} from "../../services/comprobantesPagoCofisem";
import {
  fetchEndososPoliza,
  crearEndosoCofisem,
  eliminarEndosoCofisem,
} from "../../services/endososCofisem";
import { hoyISO } from "../../utils/fecha";

const lbl = "block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5";
const fmtFecha = (d) => (d ? new Date(d + "T12:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—");

export default function ModalEndososPoliza({ poliza, usuario, corteCerrado, onClose }) {
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [version, setVersion] = useState(0);
  const recargar = () => setVersion((v) => v + 1);

  const [fecha, setFecha] = useState(hoyISO());
  const [descripcion, setDescripcion] = useState("");
  const [archivoPath, setArchivoPath] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const polizaId = poliza?.id ?? null;

  useEffect(() => {
    if (!polizaId) return;
    let cancel = false;
    fetchEndososPoliza(polizaId)
      .then((r) => { if (!cancel) { setLista(r); setCargando(false); } })
      .catch((e) => { if (!cancel) { setError(e.message); setCargando(false); } });
    return () => { cancel = true; };
  }, [polizaId, version]);

  if (!poliza) return null;

  async function handleArchivo(file) {
    if (file.size > MAX_PAGO_COMPROBANTE_BYTES) {
      setError("El archivo es muy grande (máx. 8 MB).");
      return;
    }
    setError(null);
    setSubiendo(true);
    try {
      const basePath = `${usuario?.oficina_id ?? "sin-oficina"}/endosos-manuales/${poliza.id}/${Date.now()}`;
      const path = await subirComprobantePago(basePath, file);
      setArchivoPath(path);
    } catch (e) {
      setError("No se pudo subir el archivo: " + e.message);
    } finally {
      setSubiendo(false);
    }
  }

  async function handleCrear() {
    if (guardando) return;
    if (!descripcion.trim() && !archivoPath) {
      setError("Agrega una descripción o un archivo.");
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      await crearEndosoCofisem({
        polizaCofisemId: poliza.id,
        fechaEndoso: fecha || hoyISO(),
        descripcion: descripcion.trim(),
        archivoUrl: archivoPath,
        oficinaId: usuario?.oficina_id ?? null,
        creadoPor: usuario?.id ?? null,
      });
      setDescripcion("");
      setArchivoPath(null);
      setFecha(hoyISO());
      recargar();
    } catch (e) {
      setError(e.message ?? "No se pudo guardar el endoso");
    } finally {
      setGuardando(false);
    }
  }

  async function handleBorrar(endoso) {
    const res = await Swal.fire({
      icon: "warning",
      title: "¿Borrar este endoso?",
      text: "Se quitará del corte de su fecha y se eliminará su archivo.",
      showCancelButton: true,
      confirmButtonText: "Sí, borrar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    });
    if (!res.isConfirmed) return;
    try {
      await eliminarEndosoCofisem(endoso.id, endoso.archivo_url);
      recargar();
    } catch (e) {
      setError(e.message ?? "No se pudo borrar el endoso");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 min-w-0">
            <FileSignature className="w-4 h-4 text-[#1447e6] shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-gray-800 text-sm">Endosos de la póliza</p>
              <p className="text-xs text-gray-400 font-mono truncate">{poliza.numero_poliza || poliza.folio || `#${poliza.id}`}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-4">
          {corteCerrado && (
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              El corte de esta fecha ya está cerrado — solo lectura.
            </p>
          )}
          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          <div>
            <p className={lbl}>Endosos registrados</p>
            {cargando ? (
              <p className="text-xs text-gray-400 py-3">Cargando…</p>
            ) : lista.length === 0 ? (
              <p className="text-xs text-gray-400 py-3">Sin endosos todavía.</p>
            ) : (
              <div className="space-y-2">
                {lista.map((e) => (
                  <div key={e.id} className="rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-600">{fmtFecha(e.fecha_endoso)}</p>
                      {e.descripcion && <p className="text-xs text-gray-500 mt-0.5 break-words">{e.descripcion}</p>}
                      {e.archivo_url && (
                        <button onClick={() => verComprobantePago(e.archivo_url)}
                          className="text-[11px] font-bold text-[#1447e6] underline underline-offset-2 mt-1">
                          Ver archivo
                        </button>
                      )}
                    </div>
                    {!corteCerrado && (
                      <button onClick={() => handleBorrar(e)} title="Borrar"
                        className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {!corteCerrado && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
              <p className={lbl}>Nuevo endoso</p>
              <div>
                <label className={lbl}>Fecha del endoso</label>
                <input type="date" value={fecha} onChange={(ev) => setFecha(ev.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1447e6]/15 focus:border-[#1447e6]" />
                <p className="text-[10px] text-gray-400 mt-1">Define en qué corte aparece la nota.</p>
              </div>
              <div>
                <label className={lbl}>Descripción</label>
                <textarea value={descripcion} onChange={(ev) => setDescripcion(ev.target.value)}
                  placeholder="Detalle del endoso…"
                  className="w-full h-16 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-[#1447e6]/15 focus:border-[#1447e6]" />
              </div>
              <ComprobanteField
                label="Archivo del endoso"
                path={archivoPath}
                subiendo={subiendo}
                onFile={handleArchivo}
                onVer={() => verComprobantePago(archivoPath)}
                obligatorio={false}
              />
              <button onClick={handleCrear} disabled={guardando || subiendo}
                className="w-full py-2.5 rounded-xl bg-[#1447e6] text-white text-sm font-bold hover:bg-[#0f36b3] transition-colors disabled:opacity-60 disabled:cursor-wait">
                {guardando ? "Guardando…" : "Agregar endoso"}
              </button>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-gray-200 transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
