import { useState, useEffect } from "react";
import { STATUS_CLS } from "../constants/estilos";
import PanelAsignar from "./PanelAsignar";
import { supabase } from "../../../supabaseClient";
import { fetchEvidencias, getSignedUrl } from "../../../services/evidencias";

function fmtEtapa(iso) {
  if (!iso) return "Pendiente";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

// Tipos de evidencia → slots de documentos
const DOC_GRUPOS = [
  { key: "poliza",    tipos: ["documentos"],                          icon: "📄", label: "Póliza"     },
  { key: "evidencia", tipos: ["fotos_siniestro", "llegada", "danos"], icon: "📷", label: "Evidencia"  },
  { key: "serie",     tipos: ["vehiculo"],                            icon: "🪪", label: "No. Serie"  },
  { key: "licencias", tipos: ["licencias"],                           icon: "🪪", label: "Licencia(s)"},
];

// ── Carrusel de imágenes ──────────────────────────────────────
function Carrusel({ imgs, initialIdx, onClose }) {
  const [idx, setIdx] = useState(initialIdx ?? 0);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft")  setIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIdx((i) => Math.min(imgs.length - 1, i + 1));
      if (e.key === "Escape")     onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [imgs.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/92 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cerrar */}
        <button
          onClick={onClose}
          className="absolute -top-9 right-0 flex items-center gap-1.5 text-white/60 hover:text-white text-xs font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
          Cerrar
        </button>

        {/* Imagen principal */}
        <div className="relative w-full flex items-center justify-center" style={{ maxHeight: "72vh" }}>
          <img
            src={imgs[idx].signedUrl}
            alt=""
            className="max-w-full max-h-full object-contain rounded-xl"
            style={{ maxHeight: "72vh" }}
          />
          {idx > 0 && (
            <button
              onClick={() => setIdx((i) => i - 1)}
              className="absolute left-2 w-9 h-9 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
              </svg>
            </button>
          )}
          {idx < imgs.length - 1 && (
            <button
              onClick={() => setIdx((i) => i + 1)}
              className="absolute right-2 w-9 h-9 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
              </svg>
            </button>
          )}
        </div>

        {/* Contador + tipo */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-white/50 text-xs">{idx + 1} / {imgs.length}</span>
          <span className="text-white/20 text-xs">·</span>
          <span className="text-white/40 text-xs capitalize">{imgs[idx].tipo?.replace("_", " ")}</span>
        </div>

        {/* Tiras de miniaturas */}
        {imgs.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 max-w-full">
            {imgs.map((img, i) => (
              <button
                key={img.id ?? i}
                onClick={() => setIdx(i)}
                className={[
                  "flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all",
                  i === idx ? "border-white opacity-100" : "border-transparent opacity-40 hover:opacity-70",
                ].join(" ")}
              >
                <img src={img.signedUrl} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Modal principal ───────────────────────────────────────────
export default function ModalDetalle({ s, onClose, onAsignar }) {
  const [modoAsignar,   setModoAsignar]   = useState(!s.ajustador);
  const [live,          setLive]          = useState(s);       // datos en tiempo real
  const [evidencias,    setEvidencias]    = useState([]);
  const [loadingEvid,   setLoadingEvid]   = useState(true);
  const [carousel,      setCarousel]      = useState(null);    // { imgs, idx }

  // Sincronizar ajustador cuando el padre lo actualiza (tras asignar)
  useEffect(() => {
    setLive((prev) => ({ ...prev, ajustador: s.ajustador, estatus: s.estatus }));
  }, [s.ajustador, s.estatus]);

  // ── Carga inicial de evidencias ───────────────────────────
  useEffect(() => {
    let mounted = true;
    const cargar = async () => {
      try {
        const items = await fetchEvidencias(s.id);
        const withUrls = await Promise.all(
          items.map(async (item) => {
            try   { return { ...item, signedUrl: await getSignedUrl(item.storage_path) }; }
            catch { return null; }
          }),
        );
        if (mounted) setEvidencias(withUrls.filter(Boolean));
      } catch { /* silencioso */ }
      finally { if (mounted) setLoadingEvid(false); }
    };
    cargar();
    return () => { mounted = false; };
  }, [s.id]);

  // ── Realtime ──────────────────────────────────────────────
  useEffect(() => {
    const ch = supabase
      .channel(`detalle-${s.id}`)
      // Nueva foto subida por el ajustador
      .on("postgres_changes", {
        event: "INSERT", schema: "public",
        table: "siniestro_evidencias",
        filter: `siniestro_id=eq.${s.id}`,
      }, async (payload) => {
        try {
          const signedUrl = await getSignedUrl(payload.new.storage_path);
          setEvidencias((prev) => {
            if (prev.some((e) => e.id === payload.new.id)) return prev;
            return [...prev, { ...payload.new, signedUrl }];
          });
        } catch { /* sin URL, ignorar */ }
      })
      // Cambios en el siniestro (arribo, estatus, etc.)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public",
        table: "siniestros",
        filter: `id=eq.${s.id}`,
      }, (payload) => {
        setLive((prev) => ({ ...prev, ...payload.new }));
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [s.id]);

  // ── Datos derivados ───────────────────────────────────────
  const arriboDone  = !!live.arribo_fecha;
  const procesoDone = ["Cerrado", "Resuelto"].includes(live.estatus);
  const cerradoDone = live.estatus === "Cerrado";

  const etapas = [
    { label: "Reportado",  time: fmtEtapa(live.reportadoFecha), done: true        },
    { label: "Arribo",     time: fmtEtapa(live.arribo_fecha),   done: arriboDone  },
    { label: "En proceso", time: "Pendiente",                   done: procesoDone },
    { label: "Cerrado",    time: "Pendiente",                   done: cerradoDone },
  ];

  const gruposConFotos = DOC_GRUPOS.map((g) => ({
    ...g,
    imgs: evidencias.filter((e) => g.tipos.includes(e.tipo)),
  }));
  const subidos = gruposConFotos.filter((g) => g.imgs.length > 0).length;

  const infoFields = [
    ["Asegurado", live.asegurado],
    ["Vehículo",  live.vehiculo],
    ["Fecha",     live.fecha],
    ["Teléfono",  live.telefono ?? "—"],
    ["Póliza",    live.polizaConstancia ?? "—"],
    ["Cobertura", live.cobertura ?? "—"],
  ];

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(10,15,40,0.5)" }}
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full max-w-5xl"
          style={{ height: "88vh", maxHeight: "780px" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#13193a]/8 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#13193a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-sm font-bold text-[#13193a]">Detalle del siniestro</h2>
                  <span className={`inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_CLS[live.estatus] ?? "bg-gray-100 text-gray-600"}`}>
                    {live.estatus}
                  </span>
                  {!live.ajustador && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Sin ajustador
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Folio <span className="font-mono font-semibold">{live.folio}</span>
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-1 overflow-hidden">
            {/* Izquierda */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Información */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Información</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {infoFields.map(([l, v]) => (
                    <div key={l}>
                      <p className="text-[11px] text-gray-400 mb-0.5">{l}</p>
                      <p className="text-sm font-semibold text-gray-700">{v}</p>
                    </div>
                  ))}
                  <div className="col-span-2">
                    <p className="text-[11px] text-gray-400 mb-0.5">Ubicación</p>
                    <p className="text-sm text-gray-700">{live.ubicacion}</p>
                  </div>
                </div>
              </div>

              {/* Documentos */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Documentos</p>
                  <div className="flex items-center gap-2">
                    {loadingEvid && (
                      <div className="w-3 h-3 border border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                    )}
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {subidos} / {DOC_GRUPOS.length} subidos
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {gruposConFotos.map((g) => {
                    const tiene = g.imgs.length > 0;
                    return (
                      <button
                        key={g.key}
                        onClick={() => tiene && setCarousel({ imgs: g.imgs, idx: 0 })}
                        disabled={!tiene}
                        className={[
                          "rounded-xl p-3 flex flex-col items-center gap-1.5 transition-all",
                          tiene
                            ? "border-2 border-[#13193a]/12 hover:border-[#13193a]/25 hover:bg-gray-50 cursor-pointer"
                            : "border-2 border-dashed border-gray-200 cursor-default",
                        ].join(" ")}
                      >
                        {tiene ? (
                          <div className="relative w-full h-16 rounded-lg overflow-hidden">
                            <img src={g.imgs[0].signedUrl} className="w-full h-full object-cover" alt="" />
                            {g.imgs.length > 1 && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">+{g.imgs.length}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-lg">
                            {g.icon}
                          </div>
                        )}
                        <p className="text-[11px] text-gray-400 text-center leading-tight">{g.label}</p>
                        {tiene && (
                          <span className="text-[10px] text-emerald-600 font-semibold">
                            {g.imgs.length} foto{g.imgs.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Derecha */}
            <div className="w-64 shrink-0 overflow-y-auto p-5 space-y-5 bg-gray-50/50 border-l border-gray-100">

              {/* Seguimiento */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Seguimiento</p>
                {etapas.map((e, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        e.done ? "border-emerald-500 bg-emerald-500" : "border-gray-300 bg-white"
                      }`}>
                        {e.done && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                        )}
                      </div>
                      {i < etapas.length - 1 && (
                        <div className={`w-0.5 h-7 my-1 rounded-full transition-all ${e.done ? "bg-emerald-200" : "bg-gray-200"}`} />
                      )}
                    </div>
                    <div className="pb-1">
                      <p className={`text-xs font-semibold ${e.done ? "text-[#13193a]" : "text-gray-400"}`}>{e.label}</p>
                      <p className={`text-[11px] mt-0.5 ${e.done ? "text-emerald-600 font-medium" : "text-gray-400"}`}>{e.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Ajustador */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Ajustador</p>
                {live.ajustador && !modoAsignar ? (
                  <>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#13193a] flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {live.ajustador.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#13193a]">{live.ajustador}</p>
                        <p className="text-[11px] text-gray-400">Asignado</p>
                      </div>
                    </div>
                    {!arriboDone ? (
                      <span className="inline-flex text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-semibold">
                        Pendiente de arribo
                      </span>
                    ) : procesoDone ? (
                      <span className="inline-flex text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">
                        Completado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        En proceso
                      </span>
                    )}
                    <button
                      onClick={() => setModoAsignar(true)}
                      className="w-full text-xs text-gray-400 hover:text-[#13193a] font-medium mt-1"
                    >
                      Cambiar ajustador
                    </button>
                  </>
                ) : !live.ajustador && !modoAsignar ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2.5 bg-red-50 rounded-xl border border-red-200">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                      <p className="text-xs text-red-700 font-bold">Sin ajustador</p>
                    </div>
                    <button
                      onClick={() => setModoAsignar(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-xs font-bold transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                      </svg>
                      Asignar ajustador
                    </button>
                  </div>
                ) : null}
                {modoAsignar && (
                  <PanelAsignar
                    s={live}
                    onConfirmar={(aj) => { onAsignar(live.folio, aj); setModoAsignar(false); }}
                    onCancelar={() => setModoAsignar(false)}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex items-center justify-between bg-white">
            <p className="text-xs text-gray-400">
              Última actualización: {fmtEtapa(live.reportadoFecha).split(" ")[0] || "hoy"}
            </p>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-xs font-semibold transition-all">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
              </svg>
              Descargar reporte
            </button>
          </div>
        </div>
      </div>

      {/* Carrusel (z-60, encima del modal) */}
      {carousel && (
        <Carrusel
          imgs={carousel.imgs}
          initialIdx={carousel.idx}
          onClose={() => setCarousel(null)}
        />
      )}
    </>
  );
}
