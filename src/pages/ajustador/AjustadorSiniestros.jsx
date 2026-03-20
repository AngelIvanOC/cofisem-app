// ============================================================
// src/pages/AjustadorSiniestros.jsx
// Mobile-first / Tablet / Desktop — flujo de 5 pasos:
//   0. Lista de siniestros asignados
//   1. Confirmar arribo
//   2. Datos del siniestro (afectados + póliza)
//   3. Evidencia + modelo 360° de daños
//   4. Generar documentos + firmas
// ============================================================
import { useState, useRef, useCallback, useEffect } from "react";

// ── Mock de siniestros ────────────────────────────────────────
// ubicacion: string = tiene dirección → mostrar mapa
// telefono:  string = NO tiene dirección → mostrar teléfono
const SINIESTROS_MOCK = [
  {
    id: "SN-10234",
    asegurado: "Juan Morales",
    vehiculo: "Toyota Camry",
    ubicacion: "Av. Emiliano Zapata 145, Jiutepec, Mor.",
    coords: { lat: 18.8841, lng: -99.1948 },
    telefono: null,             // ← tiene ubicación, no necesita teléfono
    tiempo: "Hace 12 min",
    estatus: "Asignado",
    poliza: "01250100001024-01",
    vigencia: "06/06/2026",
  },
  {
    id: "SN-10212",
    asegurado: "Diana López",
    vehiculo: "Nissan March",
    ubicacion: null,            // ← NO sabe dónde está → se muestra teléfono
    coords: null,
    telefono: "777 100 3344",
    tiempo: "Hace 40 min",
    estatus: "Pendiente de arribo",
    poliza: "01250100001890-02",
    vigencia: "12/01/2027",
  },
  {
    id: "SN-10208",
    asegurado: "Luis Torres",
    vehiculo: "Volkswagen Vento",
    ubicacion: "Blvd. Cuauhnáhuac 890, Temixco, Mor.",
    coords: { lat: 18.8533, lng: -99.2244 },
    telefono: null,
    tiempo: "Hace 1 hora",
    estatus: "En proceso",
    poliza: "01250100002100-01",
    vigencia: "03/08/2026",
  },
  {
    id: "SN-10254",
    asegurado: "Marco Ortega",
    vehiculo: "Chevrolet Aveo",
    ubicacion: null,            // ← sin ubicación
    coords: null,
    telefono: "777 456 7890",
    tiempo: "Hace 3 horas",
    estatus: "Atendido",
    poliza: "01250100000445-03",
    vigencia: "15/11/2026",
  },
];

const METRICAS = [
  { label: "Asignados", value: 3, color: "text-[#13193a]", bg: "bg-[#13193a]/8" },
  { label: "Pend. arribo", value: 2, color: "text-amber-600", bg: "bg-amber-50" },
  { label: "En proceso", value: 5, color: "text-blue-600", bg: "bg-blue-50" },
];

const ESTATUS_CLS = {
  "Asignado":            "bg-[#13193a]/8  text-[#13193a]   border border-[#13193a]/15",
  "Pendiente de arribo": "bg-amber-50     text-amber-700   border border-amber-200",
  "En proceso":          "bg-blue-50      text-blue-700    border border-blue-200",
  "Atendido":            "bg-emerald-50   text-emerald-700 border border-emerald-200",
};

const STEP_LABELS = ["Arribo", "Datos", "Evidencia", "Documentos"];

// ── StepBar ───────────────────────────────────────────────────
function StepBar({ paso }) {
  return (
    <div className="flex items-center px-1">
      {STEP_LABELS.map((label, i) => {
        const done   = i < paso;
        const active = i === paso;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className={[
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                done   ? "bg-emerald-500 text-white" :
                active ? "bg-[#13193a] text-white"   :
                         "bg-gray-100 text-gray-400",
              ].join(" ")}>
                {done ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                ) : i + 1}
              </div>
              <span className={`text-[10px] font-semibold hidden sm:block whitespace-nowrap ${
                active ? "text-[#13193a]" : done ? "text-emerald-600" : "text-gray-400"
              }`}>{label}</span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1.5 rounded-full transition-all duration-500 ${done ? "bg-emerald-400" : "bg-gray-200"}`}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Campo de formulario ───────────────────────────────────────
function Campo({ label, placeholder, value, onChange, type = "text", readonly, rows }) {
  const cls = readonly
    ? "w-full px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm font-semibold text-[#13193a] cursor-default select-none"
    : "w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all";
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">{label}</label>
      {rows ? (
        <textarea rows={rows} placeholder={placeholder} value={value ?? ""} onChange={onChange ? e => onChange(e.target.value) : undefined} className={cls + " resize-none"}/>
      ) : (
        <input type={type} readOnly={readonly} value={value ?? ""} placeholder={placeholder} onChange={onChange ? e => onChange(e.target.value) : undefined} className={cls}/>
      )}
    </div>
  );
}

// ── Sección con header oscuro ─────────────────────────────────
function Seccion({ titulo, children, accion }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-[#13193a] px-4 py-3 flex items-center justify-between">
        <p className="text-sm font-bold text-white tracking-wide">{titulo}</p>
        {accion}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ── Tag de afectado ───────────────────────────────────────────
function AfectadoTag({ label, active, onClick }) {
  return (
    <button onClick={onClick} className={[
      "px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all",
      active ? "bg-[#13193a] text-white border-[#13193a]"
             : "bg-white text-gray-500 border-gray-200 hover:border-gray-300",
    ].join(" ")}>
      {label}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
// PASO 0: Lista de siniestros
// ═══════════════════════════════════════════════════════════
function ListaSiniestros({ onAtender }) {
  const [tab, setTab] = useState("activos");
  const filtrados = tab === "todos"
    ? SINIESTROS_MOCK
    : SINIESTROS_MOCK.filter(s => s.estatus !== "Atendido");

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-5 pb-4 border-b border-gray-100 shrink-0">
        <h1 className="text-xl font-bold text-[#13193a]">Siniestros Asignados</h1>

        {/* Métricas */}
        <div className="flex gap-2 mt-3">
          {METRICAS.map(m => (
            <div key={m.label} className={`flex-1 rounded-xl p-3 ${m.bg} border border-white`}>
              <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
              <p className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 bg-gray-100 rounded-xl p-1">
          {[{ k: "activos", l: "Activos" }, { k: "todos", l: "Todos" }].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} className={[
              "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all",
              tab === t.k ? "bg-white text-[#13193a] shadow-sm" : "text-gray-500",
            ].join(" ")}>
              {t.l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {filtrados.map(s => {
          const atendido   = s.estatus === "Atendido";
          const tieneUbic  = !!s.ubicacion && !!s.coords;
          const mapsUrl    = tieneUbic
            ? `https://maps.google.com/?q=${s.coords.lat},${s.coords.lng}`
            : null;

          return (
            <div key={s.id} className={[
              "bg-white rounded-2xl border p-4 transition-all",
              atendido ? "border-gray-100 opacity-60" : "border-gray-200 shadow-sm",
            ].join(" ")}>

              {/* Top */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-mono text-xs font-bold text-[#13193a]">{s.id}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ESTATUS_CLS[s.estatus] ?? "bg-gray-100 text-gray-600 border border-gray-200"}`}>
                      {s.estatus}
                    </span>
                  </div>
                  <p className="font-bold text-[#13193a] text-sm">{s.asegurado}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{s.vehiculo}</p>
                </div>
                {!atendido && (
                  <button onClick={() => onAtender(s)}
                    className="shrink-0 px-4 py-2 rounded-xl bg-[#13193a] text-white text-xs font-bold hover:bg-[#1e2a50] active:scale-95 transition-all shadow-sm">
                    Atender
                  </button>
                )}
              </div>

              {/* Ubicación o teléfono */}
              <div className="flex items-center gap-2 mb-2">
                {tieneUbic ? (
                  // ── Tiene dirección → botón "Ver ubicación"
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:text-blue-700 group"
                  >
                    <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors shrink-0">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
                      </svg>
                    </div>
                    <span className="truncate">{s.ubicacion}</span>
                  </a>
                ) : (
                  // ── Sin dirección → teléfono para coordinarse
                  <a
                    href={`tel:${s.telefono}`}
                    className="flex items-center gap-1.5 text-xs font-semibold group"
                  >
                    <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors shrink-0">
                      <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.338c0-.552.196-1.078.548-1.48l.818-.888a1.5 1.5 0 012.26.093l1.84 2.305a1.5 1.5 0 01-.043 1.925l-.655.755a.75.75 0 00-.119.845 11.228 11.228 0 005.26 5.26.75.75 0 00.845-.118l.755-.655a1.5 1.5 0 011.925-.043l2.305 1.84a1.5 1.5 0 01.093 2.26l-.888.818a2.25 2.25 0 01-1.48.548c-6.623 0-12-5.377-12-12z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-amber-600">{s.telefono}</p>
                      <p className="text-[10px] text-gray-400 font-normal">Coordinar ubicación</p>
                    </div>
                  </a>
                )}
              </div>

              {/* Tiempo */}
              <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-2 border-t border-gray-50">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {s.tiempo}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PASO 1: Confirmar arribo
// ═══════════════════════════════════════════════════════════
function ConfirmarArribo({ siniestro, onConfirmar }) {
  const [confirmado, setConfirmado] = useState(false);
  const [foto,       setFoto]       = useState(null);
  const fileRef = useRef(null);

  const fecha = new Date().toLocaleDateString("es-MX", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

  const tieneUbic = !!siniestro.ubicacion && !!siniestro.coords;
  const mapsUrl   = tieneUbic
    ? `https://maps.google.com/?q=${siniestro.coords.lat},${siniestro.coords.lng}`
    : null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Estado arribo */}
        <div className={[
          "rounded-2xl p-4 border-2 transition-all duration-500",
          confirmado ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200",
        ].join(" ")}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${confirmado ? "bg-emerald-500" : "bg-gray-200"}`}>
              {confirmado
                ? <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                : <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
              }
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
              <svg className="w-4.5 h-4.5 text-[#13193a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
              </svg>
            </div>
            <div>
              <p className="font-bold text-[#13193a] text-sm">{siniestro.asegurado}</p>
              <p className="text-xs text-gray-400">{siniestro.vehiculo}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Folio</p>
              <p className="text-sm font-bold font-mono text-[#13193a] mt-0.5">{siniestro.id}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Póliza</p>
              <p className="text-xs font-semibold text-[#13193a] mt-0.5 truncate">{siniestro.poliza}</p>
            </div>
          </div>

          {/* Ubicación o teléfono */}
          {tieneUbic ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100 group hover:bg-blue-100 transition-colors"
            >
              <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-blue-700">Ver ubicación en Maps</p>
                <p className="text-xs text-blue-500 truncate mt-0.5">{siniestro.ubicacion}</p>
              </div>
              <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/>
              </svg>
            </a>
          ) : (
            <a
              href={`tel:${siniestro.telefono}`}
              className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors"
            >
              <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.338c0-.552.196-1.078.548-1.48l.818-.888a1.5 1.5 0 012.26.093l1.84 2.305a1.5 1.5 0 01-.043 1.925l-.655.755a.75.75 0 00-.119.845 11.228 11.228 0 005.26 5.26.75.75 0 00.845-.118l.755-.655a1.5 1.5 0 011.925-.043l2.305 1.84a1.5 1.5 0 01.093 2.26l-.888.818a2.25 2.25 0 01-1.48.548c-6.623 0-12-5.377-12-12z"/>
              </svg>
              <div>
                <p className="text-xs font-bold text-amber-700">{siniestro.telefono}</p>
                <p className="text-[10px] text-amber-500">Asegurado sin ubicación — coordinar por teléfono</p>
              </div>
            </a>
          )}
        </div>

        {/* Mapa (solo si hay coords) */}
        {tieneUbic && (
          <div className="relative bg-blue-50 rounded-2xl overflow-hidden" style={{ height: 180 }}>
            <div className="absolute inset-0">
              {[...Array(7)].map((_, i) => (
                <div key={`h${i}`} className="absolute w-full h-px bg-blue-200/50" style={{ top: `${(i + 1) * 12.5}%` }}/>
              ))}
              {[...Array(9)].map((_, i) => (
                <div key={`v${i}`} className="absolute h-full w-px bg-blue-200/50" style={{ left: `${(i + 1) * 11}%` }}/>
              ))}
              {/* Carretera simulada */}
              <div className="absolute top-1/2 left-0 right-0 h-2 bg-blue-300/40 -translate-y-1/2"/>
              <div className="absolute left-1/2 top-0 bottom-0 w-2 bg-blue-300/40 -translate-x-1/2"/>
              {/* Pin */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-red-500 border-2 border-white shadow-lg flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-white"/>
                </div>
                <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[8px] border-l-transparent border-r-transparent border-t-red-500"/>
              </div>
            </div>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white rounded-xl px-3 py-2 shadow-md text-xs font-bold text-[#13193a] border border-gray-200"
            >
              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"/>
              </svg>
              Abrir en Maps
            </a>
          </div>
        )}

        {/* Foto de llegada */}
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Foto de llegada al lugar</label>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setFoto(URL.createObjectURL(f)); }}/>
          {foto ? (
            <div className="relative rounded-2xl overflow-hidden" style={{ height: 160 }}>
              <img src={foto} alt="Foto arribo" className="w-full h-full object-cover"/>
              <button onClick={() => setFoto(null)} className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()}
              className="w-full h-24 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#13193a]/30 hover:bg-gray-50 transition-all">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/>
              </svg>
              <span className="text-xs font-semibold">Tomar foto o subir imagen</span>
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-4 border-t border-gray-100 bg-white shrink-0">
        <button
          onClick={() => { setConfirmado(true); setTimeout(onConfirmar, 500); }}
          disabled={confirmado}
          className={[
            "w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-300",
            confirmado ? "bg-emerald-500 text-white" : "bg-[#13193a] hover:bg-[#1e2a50] text-white active:scale-[0.98] shadow-lg shadow-[#13193a]/15",
          ].join(" ")}
        >
          {confirmado
            ? <span className="flex items-center justify-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>Arribo Confirmado</span>
            : "Confirmar Arribo"
          }
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PASO 2: Datos del siniestro
// ═══════════════════════════════════════════════════════════
function CapturaDatos({ siniestro, onSiguiente }) {
  const [afectadoActivo, setAfectadoActivo] = useState("NA");
  const [afectados, setAfectados] = useState([
    { id: "NA",  label: "NA",   nombre: "", rfc: "", curp: "", direccion: "", telefono: "" },
    { id: "AF1", label: "AF 1", nombre: "", rfc: "", curp: "", direccion: "", telefono: "" },
  ]);

  const idx    = afectados.findIndex(a => a.id === afectadoActivo);
  const actual = afectados[idx];
  const setF   = (campo, val) => setAfectados(arr => arr.map((a, i) => i === idx ? { ...a, [campo]: val } : a));

  const agregarAfectado = () => {
    const n = afectados.filter(a => a.id !== "NA").length + 1;
    const nuevo = { id: `AF${n}`, label: `AF ${n}`, nombre: "", rfc: "", curp: "", direccion: "", telefono: "" };
    setAfectados(arr => [...arr, nuevo]);
    setAfectadoActivo(nuevo.id);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

        {/* Selector de afectados */}
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Afectado</label>
          <div className="flex items-center gap-2 flex-wrap">
            {afectados.map(a => (
              <AfectadoTag key={a.id} label={a.label} active={afectadoActivo === a.id} onClick={() => setAfectadoActivo(a.id)}/>
            ))}
            <button
              onClick={agregarAfectado}
              className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 text-gray-400 hover:border-[#13193a]/40 hover:text-[#13193a] flex items-center justify-center font-bold text-lg transition-all"
              title="Agregar afectado"
            >+</button>
          </div>
        </div>

        {/* Datos personales */}
        <Seccion titulo={`1. Datos Personales — ${actual?.label}`}>
          <div className="space-y-3">
            <Campo label="Nombre completo" placeholder="Nombre del afectado"  value={actual?.nombre}   onChange={v => setF("nombre", v)}/>
            <Campo label="RFC"             placeholder="RFC"                  value={actual?.rfc}      onChange={v => setF("rfc", v)}/>
            <Campo label="CURP"            placeholder="CURP"                 value={actual?.curp}     onChange={v => setF("curp", v)}/>
            <Campo label="Dirección"       placeholder="Dirección"            value={actual?.direccion} onChange={v => setF("direccion", v)}/>
            <Campo label="Teléfono"        placeholder="55 0000 0000" type="tel" value={actual?.telefono} onChange={v => setF("telefono", v)}/>
          </div>
        </Seccion>

        {/* Datos de póliza */}
        <Seccion titulo="2. Datos de Póliza">
          <div className="space-y-3">
            <Campo label="No. Póliza" value={siniestro.poliza}   readonly/>
            <Campo label="Vigencia"   value={siniestro.vigencia}  readonly/>
          </div>
        </Seccion>

        {/* Declaraciones (no para NA) */}
        {afectadoActivo !== "NA" && (
          <Seccion titulo="3. Declaraciones Iniciales">
            <Campo label="Versión de los hechos según el afectado" placeholder="Describir lo sucedido..." rows={3}/>
          </Seccion>
        )}
      </div>

      <div className="px-4 py-4 border-t border-gray-100 bg-white shrink-0">
        <button onClick={onSiguiente}
          className="w-full py-3.5 rounded-2xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-[#13193a]/15">
          Continuar a Evidencia →
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PASO 3: Evidencia + Modelo 360° de daños
// ═══════════════════════════════════════════════════════════

// Puntos predefinidos en las vistas del auto (en % sobre la imagen)
// Vista: "frente" | "lateral_i" | "trasera" | "lateral_d" | "techo"
const VISTAS_AUTO = [
  { id: "frente",    label: "Frente"    },
  { id: "lateral_i", label: "Lat. Izq." },
  { id: "trasera",   label: "Trasera"   },
  { id: "lateral_d", label: "Lat. Der." },
  { id: "techo",     label: "Techo"     },
];

// SVG simple del auto por vista
function SvgAuto({ vista }) {
  // Siluetas SVG simplificadas del vehículo según vista
  if (vista === "frente") return (
    <svg viewBox="0 0 200 140" className="w-full h-full" fill="none">
      {/* Carrocería */}
      <rect x="20" y="60" width="160" height="65" rx="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2"/>
      {/* Techo */}
      <path d="M55 60 Q60 25 90 22 H110 Q140 25 145 60Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2"/>
      {/* Parabrisas */}
      <path d="M60 59 Q65 30 88 28 H112 Q135 30 140 59Z" fill="#bfdbfe" stroke="#94a3b8" strokeWidth="1.5"/>
      {/* Parrilla */}
      <rect x="50" y="105" width="100" height="18" rx="4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5"/>
      {/* Faros */}
      <rect x="22" y="93" width="30" height="18" rx="3" fill="#fef08a" stroke="#94a3b8" strokeWidth="1.5"/>
      <rect x="148" y="93" width="30" height="18" rx="3" fill="#fef08a" stroke="#94a3b8" strokeWidth="1.5"/>
      {/* Ruedas */}
      <circle cx="52" cy="128" r="10" fill="#475569" stroke="#334155" strokeWidth="2"/>
      <circle cx="148" cy="128" r="10" fill="#475569" stroke="#334155" strokeWidth="2"/>
    </svg>
  );
  if (vista === "trasera") return (
    <svg viewBox="0 0 200 140" className="w-full h-full" fill="none">
      <rect x="20" y="60" width="160" height="65" rx="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2"/>
      <path d="M55 60 Q60 25 90 22 H110 Q140 25 145 60Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2"/>
      <path d="M60 59 Q65 30 88 28 H112 Q135 30 140 59Z" fill="#bfdbfe" stroke="#94a3b8" strokeWidth="1.5"/>
      {/* Cajuela */}
      <rect x="40" y="103" width="120" height="14" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5"/>
      {/* Calaveras */}
      <rect x="22" y="88" width="28" height="16" rx="3" fill="#fca5a5" stroke="#94a3b8" strokeWidth="1.5"/>
      <rect x="150" y="88" width="28" height="16" rx="3" fill="#fca5a5" stroke="#94a3b8" strokeWidth="1.5"/>
      <circle cx="52" cy="128" r="10" fill="#475569" stroke="#334155" strokeWidth="2"/>
      <circle cx="148" cy="128" r="10" fill="#475569" stroke="#334155" strokeWidth="2"/>
    </svg>
  );
  if (vista === "lateral_i" || vista === "lateral_d") return (
    <svg viewBox="0 0 260 140" className="w-full h-full" fill="none">
      <rect x="10" y="72" width="240" height="55" rx="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2"/>
      <path d="M40 72 Q55 30 90 26 H170 Q200 30 220 72Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2"/>
      <path d="M48 71 Q62 34 91 30 H168 Q197 34 212 71Z" fill="#bfdbfe" stroke="#94a3b8" strokeWidth="1.5"/>
      {/* Ruedas */}
      <circle cx="60"  cy="128" r="14" fill="#475569" stroke="#334155" strokeWidth="2.5"/>
      <circle cx="200" cy="128" r="14" fill="#475569" stroke="#334155" strokeWidth="2.5"/>
      {/* Llanta interior */}
      <circle cx="60"  cy="128" r="7" fill="#64748b"/>
      <circle cx="200" cy="128" r="7" fill="#64748b"/>
      {/* Puertas */}
      <line x1="120" y1="72" x2="120" y2="127" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3"/>
      {/* Manijas */}
      <rect x="90"  y="96" width="18" height="6" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1"/>
      <rect x="148" y="96" width="18" height="6" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1"/>
    </svg>
  );
  if (vista === "techo") return (
    <svg viewBox="0 0 180 260" className="w-full h-full" fill="none">
      <rect x="20" y="20" width="140" height="220" rx="30" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2"/>
      {/* Techo/ventanas */}
      <rect x="35" y="45" width="110" height="70" rx="8" fill="#bfdbfe" stroke="#94a3b8" strokeWidth="1.5"/>
      <rect x="35" y="145" width="110" height="70" rx="8" fill="#bfdbfe" stroke="#94a3b8" strokeWidth="1.5"/>
      {/* Línea central */}
      <line x1="90" y1="20" x2="90" y2="240" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,4"/>
      {/* Ruedas */}
      <ellipse cx="20" cy="65"  rx="12" ry="16" fill="#475569" stroke="#334155" strokeWidth="2"/>
      <ellipse cx="160" cy="65"  rx="12" ry="16" fill="#475569" stroke="#334155" strokeWidth="2"/>
      <ellipse cx="20" cy="195" rx="12" ry="16" fill="#475569" stroke="#334155" strokeWidth="2"/>
      <ellipse cx="160" cy="195" rx="12" ry="16" fill="#475569" stroke="#334155" strokeWidth="2"/>
    </svg>
  );
  return null;
}

function ModeloDaños() {
  const [vistaActual,  setVistaActual]  = useState("frente");
  const [puntosMap,    setPuntosMap]    = useState({});   // { vistaId: [{ id, x, y, nota }] }
  const [puntoActivo,  setPuntoActivo]  = useState(null); // id del punto para editar nota
  const [notaTemp,     setNotaTemp]     = useState("");
  const svgRef = useRef(null);

  const puntosVista = puntosMap[vistaActual] ?? [];
  const totalPuntos = Object.values(puntosMap).flat().length;

  const handleClickSvg = (e) => {
    // Si el click fue en un pin existente no agregar nuevo
    if (e.target.closest("[data-pin]")) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width)  * 100;
    const y = ((e.clientY - rect.top)  / rect.height) * 100;
    const id = Date.now();
    const nuevoPunto = { id, x, y, nota: "" };
    setPuntosMap(prev => ({
      ...prev,
      [vistaActual]: [...(prev[vistaActual] ?? []), nuevoPunto],
    }));
    setPuntoActivo(id);
    setNotaTemp("");
  };

  const guardarNota = () => {
    if (puntoActivo === null) return;
    setPuntosMap(prev => ({
      ...prev,
      [vistaActual]: (prev[vistaActual] ?? []).map(p =>
        p.id === puntoActivo ? { ...p, nota: notaTemp } : p
      ),
    }));
    setPuntoActivo(null);
    setNotaTemp("");
  };

  const eliminarPunto = (id) => {
    setPuntosMap(prev => ({
      ...prev,
      [vistaActual]: (prev[vistaActual] ?? []).filter(p => p.id !== id),
    }));
    if (puntoActivo === id) { setPuntoActivo(null); setNotaTemp(""); }
  };

  return (
    <div className="space-y-3">
      {/* Selector de vista */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {VISTAS_AUTO.map(v => (
          <button
            key={v.id}
            onClick={() => setVistaActual(v.id)}
            className={[
              "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border-2 transition-all shrink-0",
              vistaActual === v.id
                ? "bg-[#13193a] text-white border-[#13193a]"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300",
            ].join(" ")}
          >
            {v.label}
            {(puntosMap[v.id]?.length ?? 0) > 0 && (
              <span className="ml-1.5 bg-red-500 text-white rounded-full px-1.5 py-0.5 text-[10px]">
                {puntosMap[v.id].length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Canvas del auto */}
      <div
        ref={svgRef}
        onClick={handleClickSvg}
        className="relative bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 cursor-crosshair select-none overflow-hidden"
        style={{ paddingBottom: vistaActual === "techo" ? "55%" : "45%" }}
      >
        <div className="absolute inset-3">
          <SvgAuto vista={vistaActual}/>
        </div>

        {/* Hint */}
        {puntosVista.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-[11px] text-gray-400 font-semibold mt-1 bg-white/80 px-3 py-1.5 rounded-xl border border-gray-200">
              Toca para marcar una zona dañada
            </p>
          </div>
        )}

        {/* Pins de daño */}
        {puntosVista.map((p, idx) => (
          <div
            key={p.id}
            data-pin="1"
            style={{ left: `${p.x}%`, top: `${p.y}%`, position: "absolute", transform: "translate(-50%,-50%)" }}
            className="z-10"
          >
            {/* Círculo animado */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-40 w-6 h-6"/>
              <button
                onClick={e => { e.stopPropagation(); setPuntoActivo(p.id === puntoActivo ? null : p.id); setNotaTemp(p.nota); }}
                className={[
                  "relative w-7 h-7 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] font-bold transition-all",
                  puntoActivo === p.id ? "bg-[#13193a] scale-125" : "bg-red-500 hover:bg-red-600",
                ].join(" ")}
              >
                {idx + 1}
              </button>
            </div>
            {/* Nota debajo del pin */}
            {p.nota && puntoActivo !== p.id && (
              <div className="absolute left-1/2 top-8 -translate-x-1/2 bg-[#13193a] text-white text-[10px] rounded-lg px-2 py-1 whitespace-nowrap max-w-28 truncate shadow-lg pointer-events-none z-20">
                {p.nota}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Panel de nota del punto activo */}
      {puntoActivo !== null && (
        <div className="bg-white rounded-2xl border-2 border-[#13193a]/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#13193a] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                {puntosVista.findIndex(p => p.id === puntoActivo) + 1}
              </span>
              Zona de daño
            </p>
            <button
              onClick={() => eliminarPunto(puntoActivo)}
              className="text-xs text-red-400 hover:text-red-600 font-semibold"
            >
              Eliminar punto
            </button>
          </div>
          <textarea
            autoFocus
            rows={2}
            value={notaTemp}
            onChange={e => setNotaTemp(e.target.value)}
            placeholder="Describe el daño (ej: rayón profundo, abolladuras, cristal roto...)"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] resize-none"
          />
          <div className="flex gap-2">
            <button onClick={() => { setPuntoActivo(null); setNotaTemp(""); }}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={guardarNota}
              className="flex-1 py-2.5 rounded-xl bg-[#13193a] text-white text-xs font-bold hover:bg-[#1e2a50]">
              Guardar nota
            </button>
          </div>
        </div>
      )}

      {/* Resumen de puntos marcados */}
      {totalPuntos > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3">
          <p className="text-[11px] font-bold text-red-600 uppercase tracking-widest mb-2">
            {totalPuntos} zona{totalPuntos > 1 ? "s" : ""} marcada{totalPuntos > 1 ? "s" : ""}
          </p>
          <div className="space-y-1.5">
            {VISTAS_AUTO.filter(v => (puntosMap[v.id]?.length ?? 0) > 0).map(v => (
              <div key={v.id}>
                <p className="text-[10px] font-bold text-gray-500 uppercase">{v.label}</p>
                {puntosMap[v.id].map((p, i) => (
                  <div key={p.id} className="flex items-start gap-2 mt-1">
                    <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-xs text-gray-600 leading-snug">{p.nota || <span className="italic text-gray-400">Sin nota</span>}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CapturaEvidencia({ siniestro, onSiguiente }) {
  const [evidencias, setEvidencias] = useState({ fotos: [], licencias: [], poliza: [] });
  const fileRefs = { fotos: useRef(), licencias: useRef(), poliza: useRef() };

  const addEvidencia = (tipo, e) => {
    const urls = Array.from(e.target.files || []).map(f => URL.createObjectURL(f));
    setEvidencias(ev => ({ ...ev, [tipo]: [...ev[tipo], ...urls] }));
  };

  const BotonEvidencia = ({ tipo, label, icon }) => (
    <div>
      <input ref={fileRefs[tipo]} type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={e => addEvidencia(tipo, e)}/>
      <button onClick={() => fileRefs[tipo].current?.click()}
        className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-[#13193a]/25 hover:bg-gray-50 transition-all active:scale-[0.98]">
        <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl">{icon}</div>
        <p className="text-xs font-semibold text-gray-600">{label}</p>
        {evidencias[tipo].length > 0 && (
          <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 font-bold">
            {evidencias[tipo].length} archivo{evidencias[tipo].length > 1 ? "s" : ""}
          </span>
        )}
      </button>
      {evidencias[tipo].length > 0 && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {evidencias[tipo].map((url, i) => (
            <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-100">
              <img src={url} alt="" className="w-full h-full object-cover"/>
              <button
                onClick={() => setEvidencias(ev => ({ ...ev, [tipo]: ev[tipo].filter((_, j) => j !== i) }))}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
              >
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

        {/* Evidencia fotográfica */}
        <Seccion titulo="Evidencia y Documentos">
          <div className="grid grid-cols-2 gap-3">
            <BotonEvidencia tipo="fotos"    label="Evidencias"   icon="📸"/>
            <BotonEvidencia tipo="licencias" label="Licencia(s)" icon="🪪"/>
            <BotonEvidencia tipo="poliza"   label="Póliza física" icon="📄"/>
            {/* Foto de daños al vehículo */}
            <div>
              <input
                type="file" accept="image/*" multiple capture="environment" className="hidden"
                id="fotos-vehiculo"
                onChange={e => {
                  const urls = Array.from(e.target.files || []).map(f => URL.createObjectURL(f));
                  setEvidencias(ev => ({ ...ev, vehiculo: [...(ev.vehiculo ?? []), ...urls] }));
                }}
              />
              <button onClick={() => document.getElementById("fotos-vehiculo").click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-[#13193a]/25 hover:bg-gray-50 transition-all active:scale-[0.98]">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl">🚗</div>
                <p className="text-xs font-semibold text-gray-600">Daños al vehículo</p>
              </button>
            </div>
          </div>
        </Seccion>

        {/* Modelo 360° */}
        <Seccion titulo="Mapa de Daños — Vehículo 360°" accion={
          <span className="text-[10px] text-white/50 font-medium">Toca para marcar</span>
        }>
          <ModeloDaños/>
        </Seccion>
      </div>

      <div className="px-4 py-4 border-t border-gray-100 bg-white shrink-0">
        <button onClick={onSiguiente}
          className="w-full py-3.5 rounded-2xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-[#13193a]/15">
          Continuar a Documentos →
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PASO 4: Generar documentos + firmas
// ═══════════════════════════════════════════════════════════
function GenerarDocumentos({ siniestro, onFinalizar }) {
  const [docs, setDocs] = useState({ orden: false, pase: false });
  const [taller,   setTaller]  = useState("");
  const [clinica,  setClinica] = useState("");
  const [lesion,   setLesion]  = useState("");
  const [firmas,   setFirmas]  = useState({ asegurado: null, afectado: null, ajustador: null });
  const [firmando, setFirmando] = useState(null);
  const canvasRef  = useRef(null);
  const dibujando  = useRef(false);
  const ultimoPto  = useRef(null);

  const onTouchStart = e => {
    dibujando.current = true;
    const r = canvasRef.current.getBoundingClientRect();
    ultimoPto.current = { x: (e.touches[0].clientX - r.left) * (canvasRef.current.width / r.width), y: (e.touches[0].clientY - r.top) * (canvasRef.current.height / r.height) };
  };
  const onTouchMove = e => {
    if (!dibujando.current) return;
    e.preventDefault();
    const r = canvasRef.current.getBoundingClientRect();
    const x = (e.touches[0].clientX - r.left) * (canvasRef.current.width / r.width);
    const y = (e.touches[0].clientY - r.top)  * (canvasRef.current.height / r.height);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath(); ctx.moveTo(ultimoPto.current.x, ultimoPto.current.y);
    ctx.lineTo(x, y); ctx.strokeStyle = "#13193a"; ctx.lineWidth = 2.5;
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
    ultimoPto.current = { x, y };
  };
  const onMouseDown = e => {
    dibujando.current = true;
    const r = canvasRef.current.getBoundingClientRect();
    ultimoPto.current = { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onMouseMove = e => {
    if (!dibujando.current) return;
    const r = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath(); ctx.moveTo(ultimoPto.current.x, ultimoPto.current.y);
    ctx.lineTo(x, y); ctx.strokeStyle = "#13193a"; ctx.lineWidth = 2.5;
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
    ultimoPto.current = { x, y };
  };
  const stopDraw = () => { dibujando.current = false; };

  const confirmarFirma = () => {
    setFirmas(f => ({ ...f, [firmando]: canvasRef.current.toDataURL() }));
    setFirmando(null);
  };
  const limpiarCanvas = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const TALLERES = ["Taller Morelos", "AutoServicios del Sur", "Taller Zapata", "Multimarcas Cuernavaca"];
  const CLINICAS = ["Clínica IMSS Zona Norte", "Hospital San Miguel", "Cruz Roja Cuernavaca", "Clínica Santa María"];
  const LESIONES = ["Traumatismo leve", "Contusión", "Lesión de columna", "Fractura", "Otro"];

  const DocToggle = ({ k, titulo, desc, children }) => (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all ${docs[k] ? "border-[#13193a]" : "border-gray-200"}`}>
      <button onClick={() => setDocs(d => ({ ...d, [k]: !d[k] }))} className="w-full flex items-center gap-3 p-4">
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${docs[k] ? "border-[#13193a] bg-[#13193a]" : "border-gray-300"}`}>
          {docs[k] && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
        </div>
        <div className="text-left">
          <p className="text-sm font-bold text-[#13193a]">{titulo}</p>
          <p className="text-xs text-gray-400">{desc}</p>
        </div>
      </button>
      {docs[k] && <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">{children}</div>}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3 p-4 bg-[#13193a] rounded-2xl">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-sm">Generar Documentos</p>
            <p className="text-white/50 text-xs mt-0.5">{siniestro.id} · {siniestro.asegurado}</p>
          </div>
        </div>

        {/* Documentos */}
        <div className="space-y-3">
          <DocToggle k="orden" titulo="Orden de Reparación" desc="Autorización para reparación en taller">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Taller asignado</label>
            <select value={taller} onChange={e => setTaller(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]">
              <option value="">Selecciona un taller</option>
              {TALLERES.map(t => <option key={t}>{t}</option>)}
            </select>
          </DocToggle>

          <DocToggle k="pase" titulo="Pase Médico" desc="Autorización de atención médica">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Clínica</label>
            <select value={clinica} onChange={e => setClinica(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] mb-3">
              <option value="">Selecciona una clínica</option>
              {CLINICAS.map(c => <option key={c}>{c}</option>)}
            </select>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Tipo de lesión</label>
            <select value={lesion} onChange={e => setLesion(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]">
              <option value="">Tipo de lesión</option>
              {LESIONES.map(l => <option key={l}>{l}</option>)}
            </select>
          </DocToggle>
        </div>

        {/* Firmas */}
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Firmas requeridas</p>
          {[
            { id: "asegurado", label: "Firma de Nuestro Asegurado", icon: "🧑‍💼" },
            { id: "afectado",  label: "Firma del Afectado",         icon: "🙋"    },
            { id: "ajustador", label: "Firma del Ajustador",        icon: "📋"    },
          ].map(f => (
            <div key={f.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-[#13193a] flex items-center gap-2">
                  <span>{f.icon}</span>{f.label}
                </p>
                {firmas[f.id] && (
                  <button onClick={() => setFirmas(p => ({ ...p, [f.id]: null }))}
                    className="text-xs text-red-400 hover:text-red-600 font-medium">Borrar</button>
                )}
              </div>
              {firmas[f.id] ? (
                <div className="p-3 bg-gray-50 flex items-center justify-center h-16">
                  <img src={firmas[f.id]} alt="Firma" className="h-full" style={{ filter: "invert(1) brightness(0.15)" }}/>
                </div>
              ) : (
                <button onClick={() => setFirmando(f.id)}
                  className="w-full px-4 py-5 flex flex-col items-center gap-2 text-gray-400 hover:bg-gray-50 transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/>
                  </svg>
                  <span className="text-xs font-semibold">Toca para firmar</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 border-t border-gray-100 bg-white shrink-0">
        <button onClick={onFinalizar}
          className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Finalizar y Enviar Documentos
        </button>
      </div>

      {/* Modal de firma */}
      {firmando && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(10,15,40,0.6)" }}
          onClick={() => setFirmando(null)}>
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="font-bold text-[#13193a] text-sm">Capturar firma</p>
              <button onClick={() => setFirmando(null)} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-4">
              <p className="text-xs text-gray-400 mb-3 text-center">Firma dentro del recuadro con el dedo o el lápiz</p>
              <canvas
                ref={canvasRef} width={460} height={200}
                className="w-full border-2 border-dashed border-gray-300 rounded-2xl touch-none bg-gray-50"
                style={{ height: 180 }}
                onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={stopDraw}
              />
              <div className="flex gap-3 mt-4">
                <button onClick={limpiarCanvas} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                  Limpiar
                </button>
                <button onClick={confirmarFirma} className="flex-1 py-3 rounded-xl bg-[#13193a] text-white text-sm font-bold hover:bg-[#1e2a50] shadow-lg shadow-[#13193a]/15">
                  Confirmar Firma
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pantalla de éxito ─────────────────────────────────────────
function Exito({ siniestro, onVolver }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center mb-5">
        <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <h2 className="text-xl font-bold text-[#13193a] mb-2">¡Siniestro atendido!</h2>
      <p className="text-gray-400 text-sm mb-1">
        Folio <span className="font-mono font-bold text-[#13193a]">{siniestro.id}</span> cerrado correctamente.
      </p>
      <p className="text-gray-400 text-sm mb-8">Los documentos fueron enviados al cabinero.</p>
      <button onClick={onVolver}
        className="w-full max-w-xs py-3.5 rounded-2xl bg-[#13193a] text-white font-bold text-sm hover:bg-[#1e2a50] transition-all">
        Volver a Siniestros
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Página raíz del módulo Ajustador
// ═══════════════════════════════════════════════════════════
export default function AjustadorSiniestros() {
  const [vista,     setVista]     = useState("lista");
  const [siniestro, setSiniestro] = useState(null);
  const [paso,      setPaso]      = useState(0); // 0=arribo 1=datos 2=evidencia 3=docs

  const abrirSiniestro = useCallback(s => { setSiniestro(s); setPaso(0); setVista("detalle"); }, []);
  const volver = () => { if (paso > 0) { setPaso(p => p - 1); return; } setVista("lista"); setSiniestro(null); };
  const finalizar = () => setVista("exito");

  const NOMBRE_PASO = ["Confirmar Arribo", "Datos del Siniestro", "Evidencia y Daños", "Generar Documentos"];

  return (
    <div className="flex h-full min-h-screen bg-gray-50">

      {/* Lista — siempre visible en md+, pantalla completa en mobile cuando no hay detalle */}
      <div className={[
        "flex flex-col bg-white border-r border-gray-100",
        vista === "lista"
          ? "flex w-full md:w-80 lg:w-96 md:shrink-0"
          : "hidden md:flex md:w-80 lg:w-96 md:shrink-0",
      ].join(" ")}>
        <ListaSiniestros onAtender={abrirSiniestro}/>
      </div>

      {/* Panel de detalle / flujo */}
      {vista === "detalle" && siniestro && (
        <div className="flex-1 flex flex-col bg-white min-h-0">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 shrink-0">
            <button onClick={volver}
              className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#13193a] hover:border-gray-300 transition-all shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#13193a] truncate">{NOMBRE_PASO[paso]}</p>
              <p className="text-xs text-gray-400 truncate">{siniestro.id} · {siniestro.asegurado}</p>
            </div>
          </div>

          {/* StepBar */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80 shrink-0">
            <StepBar paso={paso}/>
          </div>

          {/* Contenido del paso */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {paso === 0 && <ConfirmarArribo   siniestro={siniestro} onConfirmar={() => setPaso(1)}/>}
            {paso === 1 && <CapturaDatos      siniestro={siniestro} onSiguiente={() => setPaso(2)}/>}
            {paso === 2 && <CapturaEvidencia  siniestro={siniestro} onSiguiente={() => setPaso(3)}/>}
            {paso === 3 && <GenerarDocumentos siniestro={siniestro} onFinalizar={finalizar}/>}
          </div>
        </div>
      )}

      {/* Éxito */}
      {vista === "exito" && siniestro && (
        <div className="flex-1 flex flex-col bg-white">
          <Exito siniestro={siniestro} onVolver={() => { setVista("lista"); setSiniestro(null); }}/>
        </div>
      )}

      {/* Placeholder desktop (nada seleccionado) */}
      {vista === "lista" && (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gray-50 text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/>
            </svg>
          </div>
          <p className="text-[#13193a] font-semibold text-sm">Selecciona un siniestro</p>
          <p className="text-gray-400 text-xs mt-1 max-w-xs">Elige un caso de la lista para comenzar el proceso de atención.</p>
        </div>
      )}
    </div>
  );
}


