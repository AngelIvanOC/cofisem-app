// ============================================================
// src/features/ajustador/CamaraGuiada.jsx
// Cámara EN VIVO dentro de la app (getUserMedia + <video> + canvas) —
// a diferencia de <input type="file" capture="environment">, que le
// entrega el control a la app de cámara nativa del celular (la página
// deja de estar en pantalla mientras esa app nativa está abierta, así
// que no se puede dibujar nada encima), aquí el feed de video se queda
// dentro del DOM y sí se puede pintar una guía de encuadre arriba.
//
// Se usa para el número de serie (VIN) del vehículo: guía tipo placa
// horizontal, pensada para encuadrar los 17 caracteres en una sola
// línea, con reintento si el ajustador no le atinó al primer toque.
// ============================================================
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export default function CamaraGuiada({ titulo, instructivo, onCapturar, onCerrar }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;

    async function iniciar() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Este dispositivo/navegador no permite cámara en vivo. Usa la opción de galería.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (cancelado) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => videoRef.current?.play();
        }
        setListo(true);
      } catch {
        if (!cancelado) setError("No se pudo acceder a la cámara. Revisa los permisos o usa la opción de galería.");
      }
    }
    iniciar();

    return () => {
      cancelado = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capturar = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      // File (no Blob simple) — subirEvidencia() usa file.name para
      // registrar "nombre_original" en la tabla de evidencias.
      onCapturar(new File([blob], `numero_serie_${Date.now()}.jpg`, { type: "image/jpeg" }));
    }, "image/jpeg", 0.92);
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black flex flex-col">
      {/* Barra superior */}
      <div className="shrink-0 flex items-center justify-between gap-2 px-3 py-2.5 bg-black/85">
        <button type="button" onClick={onCerrar} className="p-2 rounded-lg text-white/80 hover:text-white">
          <X size={20} />
        </button>
        <span className="text-sm font-bold text-white truncate px-2">{titulo}</span>
        <div className="w-9" />
      </div>

      {/* Video en vivo + guía de encuadre */}
      <div className="relative flex-1 min-h-0 bg-black overflow-hidden">
        <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />

        {listo && !error && (
          <>
            {/* Texto instructivo — en SU PROPIA capa, arriba, para no
                empujar el recuadro guía hacia abajo (si comparten el
                mismo flex-col, el bloque texto+recuadro se centra como
                UNO SOLO y el recuadro queda descentrado). */}
            <div className="absolute top-6 left-0 right-0 flex justify-center px-6 pointer-events-none">
              <p className="text-white text-xs font-semibold text-center bg-black/55 px-3 py-1.5 rounded-full max-w-xs">
                {instructivo}
              </p>
            </div>
            {/* Recuadro largo tipo placa, centrado en AMBOS ejes del área
                de video — para una sola línea de caracteres (el VIN
                completo mide 17), con esquinas reforzadas para que se
                note claro dónde encuadrar. Tiene que quedar en el centro
                exacto: la foto se captura completa (canvas.drawImage del
                frame crudo, sin recortar al recuadro) y luego el PDF la
                recorta centrada (ImgBoxCover en DeclaracionAccidentePDF.jsx)
                — si el recuadro guía no coincide con ese centro, el VIN
                que el ajustador encuadró aquí puede quedar fuera del
                recorte final. */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-6">
              <div className="w-full max-w-md h-[13vh] min-h-[64px] max-h-[110px] border-[3px] border-red-500 rounded-lg relative">
                <span className="absolute -top-1 -left-1 w-5 h-5 border-t-[3px] border-l-[3px] border-red-400 rounded-tl-lg" />
                <span className="absolute -top-1 -right-1 w-5 h-5 border-t-[3px] border-r-[3px] border-red-400 rounded-tr-lg" />
                <span className="absolute -bottom-1 -left-1 w-5 h-5 border-b-[3px] border-l-[3px] border-red-400 rounded-bl-lg" />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 border-b-[3px] border-r-[3px] border-red-400 rounded-br-lg" />
              </div>
            </div>
          </>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center px-8">
            <p className="text-white text-sm text-center">{error}</p>
          </div>
        )}

        {!listo && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Disparador */}
      <div className="shrink-0 flex items-center justify-center py-6 bg-black/85">
        <button
          type="button"
          onClick={capturar}
          disabled={!listo || !!error}
          className="w-16 h-16 rounded-full bg-white flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all"
        >
          <span className="w-14 h-14 rounded-full border-4 border-[#13193a]" />
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
