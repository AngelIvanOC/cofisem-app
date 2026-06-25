// ============================================================
// src/features/ajustador/ConfirmarArribo.jsx
// Paso 1: confirmar arribo
//   · GPS del dispositivo  → navigator.geolocation (fuente principal)
//   · GPS de la foto       → EXIF con exifr (verificación secundaria)
//   · Ambos se guardan en siniestros.arribo_* al confirmar
// ============================================================
import { useState, useRef, useEffect } from "react";
import { parse as parseExif } from "exifr";
import { subirEvidencia, registrarArribo } from "../../services/evidencias";

// ── Haversine: distancia en metros entre dos puntos GPS ───────
function distanciaMetros(lat1, lng1, lat2, lng2) {
  const R    = 6371000;
  const toR  = (d) => (d * Math.PI) / 180;
  const dLat = toR(lat2 - lat1);
  const dLng = toR(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function fmtCoords(lat, lng) {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function mapsUrl(lat, lng) {
  return `https://maps.google.com/?q=${lat},${lng}`;
}

// ── Hook: GPS del dispositivo ─────────────────────────────────
function useGPS() {
  const [estado, setEstado] = useState("pidiendo"); // pidiendo | ok | denegado
  const [coords, setCoords] = useState(null);       // { lat, lng, precision }

  useEffect(() => {
    if (!navigator.geolocation) { setEstado("denegado"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat:       pos.coords.latitude,
          lng:       pos.coords.longitude,
          precision: Math.round(pos.coords.accuracy),
        });
        setEstado("ok");
      },
      () => setEstado("denegado"),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }, []);

  return { estado, coords };
}

// ── Tarjeta GPS del dispositivo ───────────────────────────────
function TarjetaGPSDispositivo({ estado, coords }) {
  if (estado === "pidiendo") {
    return (
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50 border border-blue-100">
        <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
          <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
        <div>
          <p className="text-xs font-bold text-blue-800">Obteniendo ubicación del dispositivo...</p>
          <p className="text-[11px] text-blue-500 mt-0.5">Acepta el permiso de ubicación si el navegador lo solicita</p>
        </div>
      </div>
    );
  }

  if (estado === "denegado") {
    return (
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50 border border-amber-200">
        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-600">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-bold text-amber-800">GPS del dispositivo no disponible</p>
          <p className="text-[11px] text-amber-600 mt-0.5">El arribo se registrará sin coordenadas del dispositivo</p>
        </div>
      </div>
    );
  }

  // estado === "ok"
  return (
    <a
      href={mapsUrl(coords.lat, coords.lng)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
    >
      <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600 mt-0.5">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-bold text-emerald-800">Ubicación del dispositivo capturada</p>
          <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-[11px] text-emerald-700 font-mono mt-0.5">{fmtCoords(coords.lat, coords.lng)}</p>
        <p className="text-[10px] text-emerald-500 mt-0.5">Precisión: ±{coords.precision} m · Ver en Google Maps →</p>
      </div>
    </a>
  );
}

// ── Tarjeta GPS de la foto (EXIF) ─────────────────────────────
function TarjetaGPSFoto({ fotoGPS, gpsDispositivo }) {
  if (!fotoGPS) return null;

  const distancia = gpsDispositivo
    ? distanciaMetros(gpsDispositivo.lat, gpsDispositivo.lng, fotoGPS.lat, fotoGPS.lng)
    : null;

  const consistencia =
    distancia === null ? null :
    distancia < 300    ? { color: "emerald", texto: "Consistente", icono: "✓" } :
    distancia < 1000   ? { color: "amber",   texto: "Diferencia moderada", icono: "⚠" } :
                         { color: "red",     texto: "Diferencia significativa", icono: "!" };

  const clrMap = {
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
    amber:   { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   badge: "bg-amber-100 text-amber-700"   },
    red:     { bg: "bg-red-50",     border: "border-red-200",     text: "text-red-700",     badge: "bg-red-100 text-red-700"       },
  };
  const clr = consistencia ? clrMap[consistencia.color] : { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700", badge: "bg-gray-100 text-gray-600" };

  return (
    <a
      href={mapsUrl(fotoGPS.lat, fotoGPS.lng)}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-start gap-3 p-3 rounded-2xl ${clr.bg} border ${clr.border} hover:opacity-90 transition-opacity`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${clr.badge}`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-bold ${clr.text}`}>GPS de la fotografía (EXIF)</p>
        <p className={`text-[11px] font-mono mt-0.5 ${clr.text}`}>{fmtCoords(fotoGPS.lat, fotoGPS.lng)}</p>
        {distancia !== null && (
          <p className={`text-[10px] mt-0.5 font-semibold ${clr.text}`}>
            {consistencia.icono} Diferencia con dispositivo: {distancia < 1000 ? `${distancia} m` : `${(distancia / 1000).toFixed(1)} km`} — {consistencia.texto}
          </p>
        )}
        {distancia === null && (
          <p className={`text-[10px] mt-0.5 ${clr.text}`}>Ver en Google Maps →</p>
        )}
      </div>
    </a>
  );
}

// ── Componente principal ──────────────────────────────────────
export default function ConfirmarArribo({ siniestro, onConfirmar }) {
  const { estado: gpsEstado, coords: gpsCoords } = useGPS();

  const [confirmado,  setConfirmado]  = useState(false);
  const [fotoLocal,   setFotoLocal]   = useState(null);
  const [fotoGPS,     setFotoGPS]     = useState(null);  // { lat, lng } del EXIF
  const [uploading,   setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [guardando,   setGuardando]   = useState(false);
  const fileRef = useRef(null);

  const fecha = new Date().toLocaleDateString("es-MX", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

  const handleFoto = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setFotoLocal(URL.createObjectURL(f));
    setUploadError(null);
    setFotoGPS(null);

    // 1. Extraer GPS EXIF ANTES de comprimir (compresión elimina metadatos)
    try {
      const exif = await parseExif(f, { gps: true, tiff: false });
      if (exif?.latitude && exif?.longitude) {
        setFotoGPS({ lat: exif.latitude, lng: exif.longitude });
      }
    } catch {
      // sin EXIF GPS — es normal en muchos dispositivos
    }

    // 2. Subir (comprimida) a Storage
    setUploading(true);
    subirEvidencia({
      siniestroId:     siniestro.id,
      numeroSiniestro: siniestro.numero_siniestro ?? siniestro.folio,
      participante:    "NA",
      tipo:            "llegada",
      file:            f,
    })
      .catch((err) => setUploadError(err.message ?? "Error al subir foto"))
      .finally(() => setUploading(false));
  };

  const handleConfirmar = async () => {
    if (uploading || guardando) return;
    setGuardando(true);
    try {
      await registrarArribo(siniestro.id, {
        lat:       gpsCoords?.lat    ?? null,
        lng:       gpsCoords?.lng    ?? null,
        precision: gpsCoords?.precision ?? null,
        fotoLat:   fotoGPS?.lat      ?? null,
        fotoLng:   fotoGPS?.lng      ?? null,
      });
    } catch {
      // no bloquear el flujo si falla guardar el GPS
    }
    setConfirmado(true);
    setTimeout(onConfirmar, 500);
  };

  return (
    <div className="px-4 py-4 space-y-4">

      {/* Badge de estado del arribo */}
      <div className={[
        "rounded-2xl p-4 border-2 transition-all duration-500",
        confirmado ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200",
      ].join(" ")}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${confirmado ? "bg-emerald-500" : "bg-gray-200"}`}>
            {confirmado ? (
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            )}
          </div>
          <div>
            <p className={`text-sm font-bold ${confirmado ? "text-emerald-700" : "text-gray-600"}`}>
              {confirmado ? "Arribo confirmado" : "Arribo por confirmar"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{fecha}</p>
          </div>
        </div>
      </div>

      {/* Info del caso */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#13193a]/8 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-[#13193a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-[#13193a] text-sm">{siniestro.asegurado}</p>
            <p className="text-xs text-gray-400">{siniestro.vehiculo}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">No. Siniestro</p>
            <p className="text-sm font-bold font-mono text-[#13193a] mt-0.5">
              {siniestro.numero_siniestro ?? siniestro.folio}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Póliza</p>
            <p className="text-xs font-semibold text-[#13193a] mt-0.5 truncate">{siniestro.poliza}</p>
          </div>
        </div>
        {siniestro.ubicacion && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <p className="text-xs text-gray-500 leading-snug">{siniestro.ubicacion}</p>
          </div>
        )}
      </div>

      {/* ── Verificación de ubicación ──────────────────────── */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Verificación de ubicación</p>
        <TarjetaGPSDispositivo estado={gpsEstado} coords={gpsCoords} />
        <TarjetaGPSFoto fotoGPS={fotoGPS} gpsDispositivo={gpsCoords} />
      </div>

      {/* ── Foto de llegada ─────────────────────────────────── */}
      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">
          Foto de llegada al lugar
        </label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFoto}
        />

        {fotoLocal ? (
          <div className="relative rounded-2xl overflow-hidden" style={{ height: 160 }}>
            <img src={fotoLocal} alt="Foto arribo" className="w-full h-full object-cover" />

            {uploading && (
              <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center gap-2">
                <div className="w-7 h-7 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <p className="text-white text-xs font-semibold">Subiendo foto...</p>
              </div>
            )}
            {uploadError && (
              <div className="absolute inset-0 bg-red-900/65 flex flex-col items-center justify-center gap-1 px-4">
                <p className="text-white text-xs font-bold text-center">Error al subir</p>
                <p className="text-red-200 text-[10px] text-center">{uploadError}</p>
              </div>
            )}
            {!uploading && !uploadError && (
              <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1 shadow">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {fotoGPS && !uploading && (
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
                <p className="text-white text-[10px] font-mono">
                  📍 {fotoGPS.lat.toFixed(4)}, {fotoGPS.lng.toFixed(4)}
                </p>
              </div>
            )}

            <button
              onClick={() => { setFotoLocal(null); setFotoGPS(null); setUploadError(null); }}
              className="absolute top-2 left-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full h-24 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#13193a]/30 hover:bg-gray-50 transition-all"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
            <span className="text-xs font-semibold">Tomar foto de llegada</span>
          </button>
        )}
      </div>

      {/* Hint cuando no hay foto */}
      {!fotoLocal && !confirmado && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
          <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
          </svg>
          <p className="text-xs text-amber-700 font-semibold">Toma una foto de llegada para continuar</p>
        </div>
      )}

      {/* Botón */}
      <div className="pb-6">
        <button
          onClick={handleConfirmar}
          disabled={!fotoLocal || confirmado || uploading || guardando}
          className={[
            "w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-300",
            !fotoLocal
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : uploading || guardando
                ? "bg-gray-200 text-gray-400 cursor-wait"
                : confirmado
                  ? "bg-emerald-500 text-white"
                  : "bg-[#13193a] hover:bg-[#1e2a50] text-white active:scale-[0.98] shadow-lg shadow-[#13193a]/15",
          ].join(" ")}
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
              Subiendo foto...
            </span>
          ) : guardando ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
              Registrando arribo...
            </span>
          ) : confirmado ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Arribo Confirmado
            </span>
          ) : "Confirmar Arribo"}
        </button>
      </div>
    </div>
  );
}
