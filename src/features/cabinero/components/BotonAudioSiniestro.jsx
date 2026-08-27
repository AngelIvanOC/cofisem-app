import { useState } from "react";
import { Mic, Volume2, Loader2, X } from "lucide-react";
import {
  subirAudioSiniestro,
  getAudioSignedUrl,
} from "../../../services/evidencias";

// Botón + modal para adjuntar/reproducir el audio de un siniestro.
// Si audioUrl (storage_path) ya existe, el botón abre el reproductor;
// si no, abre el selector de archivo para subirlo. onUploaded avisa al
// padre para que refresque su copia local del siniestro.
export default function BotonAudioSiniestro({
  siniestroId,
  numeroSiniestro,
  audioUrl,
  onUploaded,
  variant = "default",
}) {
  const [open, setOpen] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [signedUrl, setSignedUrl] = useState(null);
  const [error, setError] = useState(null);

  const abrir = async (e) => {
    e?.stopPropagation();
    setOpen(true);
    setError(null);
    if (audioUrl) {
      setCargando(true);
      try {
        setSignedUrl(await getAudioSignedUrl(audioUrl));
      } catch (err) {
        setError("No se pudo cargar el audio: " + err.message);
      } finally {
        setCargando(false);
      }
    }
  };

  const cerrar = (e) => {
    e?.stopPropagation();
    setOpen(false);
    setSignedUrl(null);
    setError(null);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendo(true);
    setError(null);
    try {
      const path = await subirAudioSiniestro({
        siniestroId,
        numeroSiniestro,
        file,
      });
      onUploaded?.(path);
      setSignedUrl(await getAudioSignedUrl(path));
    } catch (err) {
      setError("No se pudo subir el audio: " + err.message);
    } finally {
      setSubiendo(false);
    }
  };

  const btnCls =
    variant === "resumen"
      ? "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-[#13193a]/20 text-[#13193a] text-xs font-semibold hover:bg-[#13193a]/5 transition-all whitespace-nowrap"
      : "w-7 h-7 rounded-lg text-gray-300 hover:text-[#13193a] hover:bg-gray-100 flex items-center justify-center transition-colors";

  return (
    <>
      <button
        onClick={abrir}
        title={audioUrl ? "Reproducir audio" : "Adjuntar audio"}
        className={btnCls}
      >
        {audioUrl ? (
          <Volume2 className="w-3.5 h-3.5" />
        ) : (
          <Mic className="w-3.5 h-3.5" />
        )}
        {variant === "resumen" &&
          (audioUrl ? "Reproducir audio" : "Adjuntar audio a siniestro")}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          style={{
            backdropFilter: "blur(8px)",
            backgroundColor: "rgba(10,15,40,0.5)",
          }}
          onClick={cerrar}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#13193a]">
                Audio del siniestro
              </h3>
              <button
                onClick={cerrar}
                className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                {error}
              </p>
            )}

            {cargando ? (
              <div className="flex items-center justify-center gap-2 py-8 text-gray-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando audio...
              </div>
            ) : signedUrl ? (
              <audio controls autoPlay src={signedUrl} className="w-full" />
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#13193a]/30 transition-all">
                {subiendo ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-[#13193a]" />
                    <span className="text-xs text-gray-500">Subiendo...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5 text-gray-400" />
                    <span className="text-xs text-gray-500 font-medium">
                      Seleccionar o grabar audio
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="*"
                  hidden
                  disabled={subiendo}
                  onChange={handleFile}
                />
              </label>
            )}
          </div>
        </div>
      )}
    </>
  );
}
