// ============================================================
// src/pages/AjustadorSiniestros.jsx
// ── Módulo completo del Ajustador de Siniestros
// ── Mobile-first / Tablet / Desktop responsive
// ── Flujo de 4 pasos:
//    1. Lista de siniestros asignados
//    2. Confirmar arribo + ubicación
//    3. Captura de datos: afectados, evidencia, documentos
//    4. Generar documentos: firmas + orden de reparación / pase médico
// ============================================================
import { useState, useRef, useCallback } from "react";

// ── Datos mock ────────────────────────────────────────────────
const SINIESTROS_MOCK = [
  {
    id: "SN-10234",
    asegurado: "Juan Morales",
    vehiculo: "Toyota Camry",
    ubicacion: "Av. Emiliano Zapata 145, Jiutepec, Mor.",
    coords: { lat: 18.8841, lng: -99.1948 },
    tiempo: "Hace 12 min",
    telefono: "777 792 1225",
    estatus: "Asignado",
    poliza: "01250100001024-01",
    vigencia: "06/06/2026",
  },
  {
    id: "SN-10212",
    asegurado: "Diana López",
    vehiculo: "Nissan March",
    ubicacion: "Calle Morelos 23, Cuernavaca, Mor.",
    coords: { lat: 18.9242, lng: -99.2350 },
    tiempo: "Hace 40 min",
    telefono: "777 100 3344",
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
    tiempo: "Hace 1 hora",
    telefono: "777 234 5678",
    estatus: "En proceso",
    poliza: "01250100002100-01",
    vigencia: "03/08/2026",
  },
  {
    id: "SN-10254",
    asegurado: "Marco Ortega",
    vehiculo: "Chevrolet Aveo",
    ubicacion: "Carr. Cuernavaca-Cuautla km 12, Mor.",
    coords: { lat: 18.8910, lng: -99.1620 },
    tiempo: "Hace 3 horas",
    telefono: "777 456 7890",
    estatus: "Atendido",
    poliza: "01250100000445-03",
    vigencia: "15/11/2026",
  },
];

const METRICAS = [
  { label: "Asignados Hoy", value: 3,  color: "text-[#13193a]", bg: "bg-[#13193a]/8" },
  { label: "Pend. de arribo", value: 2, color: "text-amber-600", bg: "bg-amber-50" },
  { label: "En proceso",    value: 5,  color: "text-blue-600",  bg: "bg-blue-50" },
];

const ESTATUS_CLS = {
  "Asignado":           "bg-[#13193a]/8  text-[#13193a]   border border-[#13193a]/15",
  "Pendiente de arribo":"bg-amber-50     text-amber-700   border border-amber-200",
  "En proceso":         "bg-blue-50      text-blue-700    border border-blue-200",
  "Atendido":           "bg-emerald-50   text-emerald-700 border border-emerald-200",
};

// ── Utilidades de UI ──────────────────────────────────────────
function StepBar({ paso }) {
  const pasos = ["Arribo", "Datos", "Evidencia", "Documentos"];
  return (
    <div className="flex items-center gap-0 px-1">
      {pasos.map((p, i) => {
        const done   = i < paso;
        const active = i === paso;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={[
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                done   ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200"   :
                active ? "bg-[#13193a]   text-white shadow-sm shadow-[#13193a]/20" :
                         "bg-gray-100    text-gray-400",
              ].join(" ")}>
                {done ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                ) : i + 1}
              </div>
              <span className={`text-[10px] font-semibold whitespace-nowrap hidden sm:block ${active ? "text-[#13193a]" : done ? "text-emerald-600" : "text-gray-400"}`}>
                {p}
              </span>
            </div>
            {i < pasos.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1.5 rounded-full transition-all duration-500 ${done ? "bg-emerald-400" : "bg-gray-200"}`}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AfectadoTag({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all",
        active
          ? "bg-[#13193a] text-white border-[#13193a]"
          : "bg-white text-gray-500 border-gray-200 hover:border-gray-300",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function Campo({ label, placeholder, value, onChange, type = "text", readonly }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">{label}</label>
      <input
        type={type}
        readOnly={readonly}
        value={value}
        onChange={onChange ? e => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        className={[
          "w-full px-3 py-2.5 rounded-xl border text-sm transition-all",
          readonly
            ? "border-gray-100 bg-gray-50 text-[#13193a] font-semibold cursor-default"
            : "border-gray-200 bg-white text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]",
        ].join(" ")}
      />
    </div>
  );
}

// ── PASO 1: Lista de siniestros ───────────────────────────────
function ListaSiniestros({ onAtender }) {
  const [tab, setTab] = useState("todos");

  const filtrados = tab === "todos"
    ? SINIESTROS_MOCK
    : SINIESTROS_MOCK.filter(s => s.estatus !== "Atendido");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-4 border-b border-gray-100">
        <h1 className="text-xl font-bold text-[#13193a]">Siniestros Asignados</h1>
        <div className="flex gap-3 mt-3">
          {METRICAS.map(m => (
            <div key={m.label} className={`flex-1 rounded-2xl p-3 ${m.bg} border border-gray-100`}>
              <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
              <p className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 bg-gray-100 rounded-xl p-1">
          {[{ k: "activos", l: "Activos" }, { k: "todos", l: "Todos" }].map(t => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={[
                "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all",
                tab === t.k ? "bg-white text-[#13193a] shadow-sm" : "text-gray-500",
              ].join(" ")}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {filtrados.map(s => {
          const atendido = s.estatus === "Atendido";
          return (
            <div
              key={s.id}
              className={[
                "bg-white rounded-2xl border p-4 transition-all",
                atendido ? "border-gray-100 opacity-60" : "border-gray-200 shadow-sm active:scale-[0.99]",
              ].join(" ")}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-mono text-xs font-bold text-[#13193a]">{s.id}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ESTATUS_CLS[s.estatus] ?? "bg-gray-100 text-gray-600 border border-gray-200"}`}>
                      {s.estatus}
                    </span>
                  </div>
                  <p className="font-bold text-[#13193a] text-sm">{s.asegurado}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{s.vehiculo}</p>
                </div>
                {!atendido && (
                  <button
                    onClick={() => onAtender(s)}
                    className="shrink-0 px-4 py-2 rounded-xl bg-[#13193a] text-white text-xs font-bold hover:bg-[#1e2a50] active:scale-95 transition-all shadow-sm"
                  >
                    Atender
                  </button>
                )}
              </div>

              {/* Ubicación + tiempo */}
              <div className="flex items-start gap-2 mb-2">
                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
                </svg>
                <p className="text-xs text-gray-500 leading-snug">{s.ubicacion}</p>
              </div>

              {/* Footer row */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  {s.tiempo}
                </div>
                {s.telefono && (
                  <a href={`tel:${s.telefono}`} className="flex items-center gap-1.5 text-xs text-[#13193a] font-semibold">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.338c0-.552.196-1.078.548-1.48l.818-.888a1.5 1.5 0 012.26.093l1.84 2.305a1.5 1.5 0 01-.043 1.925l-.655.755a.75.75 0 00-.119.845 11.228 11.228 0 005.26 5.26.75.75 0 00.845-.118l.755-.655a1.5 1.5 0 011.925-.043l2.305 1.84a1.5 1.5 0 01.093 2.26l-.888.818a2.25 2.25 0 01-1.48.548c-6.623 0-12-5.377-12-12z"/>
                    </svg>
                    {s.telefono}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── PASO 2: Confirmar arribo ──────────────────────────────────
function ConfirmarArribo({ siniestro, onConfirmar }) {
  const [confirmado, setConfirmado] = useState(false);
  const [foto, setFoto] = useState(null);
  const fileRef = useRef(null);

  const handleFoto = (e) => {
    const f = e.target.files?.[0];
    if (f) setFoto(URL.createObjectURL(f));
  };

  const fecha = new Date().toLocaleDateString("es-MX", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Estado del arribo */}
        <div className={[
          "rounded-2xl p-4 border-2 transition-all",
          confirmado
            ? "bg-emerald-50 border-emerald-200"
            : "bg-gray-50 border-gray-200",
        ].join(" ")}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${confirmado ? "bg-emerald-500" : "bg-gray-200"}`}>
              {confirmado ? (
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
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

        {/* Info del siniestro */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#13193a]/8 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-[#13193a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
          <div className="flex items-start gap-2">
            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
            </svg>
            <p className="text-xs text-gray-500 leading-snug">{siniestro.ubicacion}</p>
          </div>
        </div>

        {/* Mapa placeholder */}
        <div className="relative bg-gray-100 rounded-2xl overflow-hidden" style={{ height: 200 }}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
            {/* Simulación de mapa con gradiente */}
            <div className="w-full h-full relative overflow-hidden">
              {/* Grid de calles simulado */}
              {[...Array(6)].map((_, i) => (
                <div key={`h${i}`} className="absolute w-full h-px bg-blue-200/60" style={{ top: `${(i + 1) * 14}%` }}/>
              ))}
              {[...Array(8)].map((_, i) => (
                <div key={`v${i}`} className="absolute h-full w-px bg-blue-200/60" style={{ left: `${(i + 1) * 12}%` }}/>
              ))}
              {/* Pin de ubicación */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-red-500 border-3 border-white shadow-lg flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-white"/>
                </div>
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-red-500 -mt-0.5"/>
              </div>
            </div>
          </div>
          <div className="absolute bottom-3 right-3">
            <a
              href={`https://maps.google.com/?q=${siniestro.coords.lat},${siniestro.coords.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-white rounded-xl px-3 py-2 shadow-md text-xs font-bold text-[#13193a] border border-gray-200"
            >
              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"/>
              </svg>
              Ver en Maps
            </a>
          </div>
        </div>

        {/* Upload foto de llegada */}
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">
            Foto de llegada al lugar
          </label>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFoto}/>
          {foto ? (
            <div className="relative rounded-2xl overflow-hidden" style={{ height: 180 }}>
              <img src={foto} alt="Foto de arribo" className="w-full h-full object-cover"/>
              <button
                onClick={() => setFoto(null)}
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full h-28 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#13193a]/30 hover:bg-gray-50 transition-all active:scale-[0.98]"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"/>
              </svg>
              <span className="text-xs font-semibold">Tomar foto o subir imagen</span>
            </button>
          )}
        </div>
      </div>

      {/* Botón confirmar */}
      <div className="px-4 py-4 border-t border-gray-100 bg-white shrink-0">
        <button
          onClick={() => { setConfirmado(true); setTimeout(() => onConfirmar(), 600); }}
          disabled={confirmado}
          className={[
            "w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-300",
            confirmado
              ? "bg-emerald-500 text-white"
              : "bg-[#13193a] hover:bg-[#1e2a50] text-white active:scale-[0.98] shadow-lg shadow-[#13193a]/15",
          ].join(" ")}
        >
          {confirmado ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
              Arribo Confirmado
            </span>
          ) : "Confirmar Arribo"}
        </button>
      </div>
    </div>
  );
}

// ── PASO 3: Datos + Evidencia ─────────────────────────────────
function CapturaDatos({ siniestro, onSiguiente, initialTab = "datos" }) {
  // Afectados
  const [afectadoActivo, setAfectadoActivo] = useState("NA");
  const [afectados, setAfectados] = useState([
    { id: "NA",  label: "NA",  nombre: "", rfc: "", curp: "", direccion: "", telefono: "" },
    { id: "AF1", label: "AF 1", nombre: "", rfc: "", curp: "", direccion: "", telefono: "" },
  ]);
  const [seccion, setSeccion] = useState(initialTab); // "datos" | "evidencia"

  // Evidencia
  const [evidencias, setEvidencias] = useState({
    evidencia: [],
    licencias: [],
    poliza: [],
    vehiculo: [],
  });

  const afectadoActualIdx = afectados.findIndex(a => a.id === afectadoActivo);
  const afectadoActual = afectados[afectadoActualIdx];

  const setField = (campo, valor) => {
    setAfectados(arr => arr.map((a, i) =>
      i === afectadoActualIdx ? { ...a, [campo]: valor } : a
    ));
  };

  const agregarAfectado = () => {
    const n = afectados.filter(a => a.id !== "NA").length + 1;
    const nuevo = { id: `AF${n}`, label: `AF ${n}`, nombre: "", rfc: "", curp: "", direccion: "", telefono: "" };
    setAfectados(arr => [...arr, nuevo]);
    setAfectadoActivo(nuevo.id);
  };

  const handleEvidencia = (tipo, e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const urls = files.map(f => URL.createObjectURL(f));
    setEvidencias(ev => ({ ...ev, [tipo]: [...ev[tipo], ...urls] }));
  };

  const fileRefs = { evidencia: useRef(), licencias: useRef(), poliza: useRef(), vehiculo: useRef() };

  const TipoEvidencia = ({ tipo, label, icon, multiple = true }) => (
    <div>
      <input
        ref={fileRefs[tipo]}
        type="file"
        accept="image/*"
        multiple={multiple}
        capture="environment"
        className="hidden"
        onChange={e => handleEvidencia(tipo, e)}
      />
      <button
        onClick={() => fileRefs[tipo].current?.click()}
        className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-[#13193a]/25 hover:bg-gray-50 transition-all active:scale-[0.98]"
      >
        <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl">
          {icon}
        </div>
        <p className="text-xs font-semibold text-gray-600">{label}</p>
        {evidencias[tipo].length > 0 && (
          <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 font-bold">
            {evidencias[tipo].length} archivo{evidencias[tipo].length > 1 ? "s" : ""}
          </span>
        )}
      </button>
      {/* Miniaturas */}
      {evidencias[tipo].length > 0 && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {evidencias[tipo].map((url, i) => (
            <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-100">
              <img src={url} alt="" className="w-full h-full object-cover"/>
              <button
                onClick={() => setEvidencias(ev => ({ ...ev, [tipo]: ev[tipo].filter((_, j) => j !== i) }))}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
              >
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Tabs de sección */}
      <div className="px-4 pt-3 pb-0 shrink-0">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[{ k: "datos", l: "📋 Datos" }, { k: "evidencia", l: "📷 Evidencia" }].map(t => (
            <button
              key={t.k}
              onClick={() => setSeccion(t.k)}
              className={[
                "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                seccion === t.k ? "bg-white text-[#13193a] shadow-sm" : "text-gray-500",
              ].join(" ")}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {seccion === "datos" ? (
          <div className="space-y-5">
            {/* Selector de afectados */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Afectado</label>
              <div className="flex items-center gap-2 flex-wrap">
                {afectados.map(a => (
                  <AfectadoTag
                    key={a.id}
                    label={a.label}
                    active={afectadoActivo === a.id}
                    onClick={() => setAfectadoActivo(a.id)}
                  />
                ))}
                <button
                  onClick={agregarAfectado}
                  className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 text-gray-400 hover:border-[#13193a]/40 hover:text-[#13193a] flex items-center justify-center transition-all font-bold text-lg"
                  title="Agregar afectado"
                >
                  +
                </button>
              </div>
            </div>

            {/* Datos personales */}
            <div className="space-y-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
                </svg>
                1. Datos Personales — {afectadoActual?.label}
              </p>
              <Campo label="Nombre completo" placeholder="Nombre del afectado" value={afectadoActual?.nombre || ""} onChange={v => setField("nombre", v)}/>
              <Campo label="RFC" placeholder="RFC" value={afectadoActual?.rfc || ""} onChange={v => setField("rfc", v)}/>
              <Campo label="CURP" placeholder="CURP" value={afectadoActual?.curp || ""} onChange={v => setField("curp", v)}/>
              <Campo label="Dirección" placeholder="Dirección del afectado" value={afectadoActual?.direccion || ""} onChange={v => setField("direccion", v)}/>
              <Campo label="Teléfono" placeholder="55 0000 0000" type="tel" value={afectadoActual?.telefono || ""} onChange={v => setField("telefono", v)}/>
            </div>

            {/* Datos de la póliza (readonly) */}
            <div className="space-y-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/>
                </svg>
                2. Datos de Póliza
              </p>
              <Campo label="No. Póliza" placeholder="" value={siniestro.poliza} readonly/>
              <Campo label="Vigencia" placeholder="" value={siniestro.vigencia} readonly/>
            </div>

            {/* Declaraciones (solo para afectados, no NA) */}
            {afectadoActivo !== "NA" && (
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">4. Declaraciones Iniciales</p>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Versión de los hechos</label>
                  <textarea
                    placeholder="Versión de los hechos según el afectado..."
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── Sección Evidencia ── */
          <div className="space-y-5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
              </svg>
              Evidencia Fotográfica y Documentos
            </p>

            {/* Grid 2x2 */}
            <div className="grid grid-cols-2 gap-3">
              <TipoEvidencia tipo="evidencia" label="Evidencia del siniestro" icon="📸"/>
              <TipoEvidencia tipo="licencias" label="Licencia(s)" icon="🪪"/>
              <TipoEvidencia tipo="vehiculo"  label="Daños al vehículo" icon="🚗"/>
              <TipoEvidencia tipo="poliza"    label="Póliza física" icon="📄"/>
            </div>
          </div>
        )}
      </div>

      {/* Botón siguiente */}
      <div className="px-4 py-4 border-t border-gray-100 bg-white shrink-0">
        <button
          onClick={onSiguiente}
          className="w-full py-3.5 rounded-2xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-[#13193a]/15"
        >
          Confirmar Datos →
        </button>
      </div>
    </div>
  );
}

// ── PASO 4: Generar documentos ────────────────────────────────
function GenerarDocumentos({ siniestro, onFinalizar }) {
  const [docs, setDocs] = useState({
    ordenReparacion: false,
    paseMedico: false,
  });
  const [detalleOrden, setDetalleOrden] = useState({ taller: "" });
  const [detallePase,  setDetallePase]  = useState({ clinica: "", tipo: "" });

  // Firma (canvas)
  const [firmando, setFirmando]         = useState(null); // "asegurado" | "afectado" | "ajustador"
  const [firmas, setFirmas]             = useState({ asegurado: null, afectado: null, ajustador: null });
  const canvasRef = useRef(null);
  const dibujando = useRef(false);
  const ultimoPunto = useRef(null);

  const iniciarFirma = (tipo) => { setFirmando(tipo); };

  const onMouseDown = (e) => {
    dibujando.current = true;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left;
    const y = (e.touches?.[0]?.clientY ?? e.clientY) - rect.top;
    ultimoPunto.current = { x, y };
  };

  const onMouseMove = (e) => {
    if (!dibujando.current) return;
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left;
    const y = (e.touches?.[0]?.clientY ?? e.clientY) - rect.top;
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(ultimoPunto.current.x, ultimoPunto.current.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#13193a";
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.stroke();
    ultimoPunto.current = { x, y };
  };

  const onMouseUp = () => { dibujando.current = false; };

  const limpiarFirma = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const confirmarFirma = () => {
    const url = canvasRef.current?.toDataURL();
    setFirmas(f => ({ ...f, [firmando]: url }));
    setFirmando(null);
  };

  const TALLERES = ["Taller Morelos", "AutoServicios del Sur", "Taller Zapata", "Multimarcas Cuernavaca"];
  const CLINICAS = ["Clínica IMSS Zona Norte", "Hospital San Miguel", "Cruz Roja Cuernavaca", "Clínica Santa María"];
  const LESIONES = ["Traumatismo leve", "Contusión", "Lesión de columna", "Fractura", "Otro"];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

        {/* Encabezado */}
        <div className="flex items-center gap-3 p-4 bg-[#13193a] rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-sm">Generar Documentos</p>
            <p className="text-white/50 text-xs mt-0.5">{siniestro.id} · {siniestro.asegurado}</p>
          </div>
        </div>

        {/* Selección de documentos */}
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Documentos a generar</p>

          {/* Orden de Reparación */}
          <div className={`rounded-2xl border-2 overflow-hidden transition-all ${docs.ordenReparacion ? "border-[#13193a]" : "border-gray-200"}`}>
            <button
              className="w-full flex items-center gap-3 p-4"
              onClick={() => setDocs(d => ({ ...d, ordenReparacion: !d.ordenReparacion }))}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${docs.ordenReparacion ? "border-[#13193a] bg-[#13193a]" : "border-gray-300"}`}>
                {docs.ordenReparacion && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-[#13193a]">Orden de Reparación</p>
                <p className="text-xs text-gray-400">Autorización de reparación en taller</p>
              </div>
            </button>
            {docs.ordenReparacion && (
              <div className="px-4 pb-4 space-y-2 border-t border-gray-100">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mt-3 mb-1.5">Taller asignado</label>
                <select
                  value={detalleOrden.taller}
                  onChange={e => setDetalleOrden({ taller: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]"
                >
                  <option value="">Selecciona un taller</option>
                  {TALLERES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Pase Médico */}
          <div className={`rounded-2xl border-2 overflow-hidden transition-all ${docs.paseMedico ? "border-[#13193a]" : "border-gray-200"}`}>
            <button
              className="w-full flex items-center gap-3 p-4"
              onClick={() => setDocs(d => ({ ...d, paseMedico: !d.paseMedico }))}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${docs.paseMedico ? "border-[#13193a] bg-[#13193a]" : "border-gray-300"}`}>
                {docs.paseMedico && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-[#13193a]">Pase Médico</p>
                <p className="text-xs text-gray-400">Autorización de atención médica</p>
              </div>
            </button>
            {docs.paseMedico && (
              <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Clínica</label>
                  <select
                    value={detallePase.clinica}
                    onChange={e => setDetallePase(d => ({ ...d, clinica: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]"
                  >
                    <option value="">Selecciona una clínica</option>
                    {CLINICAS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Tipo de lesión</label>
                  <select
                    value={detallePase.tipo}
                    onChange={e => setDetallePase(d => ({ ...d, tipo: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]"
                  >
                    <option value="">Tipo de lesión</option>
                    {LESIONES.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Firmas */}
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Firmas requeridas</p>
          {[
            { id: "asegurado", label: "Firma de Nuestro Asegurado", icon: "🧑‍💼" },
            { id: "afectado",  label: "Firma del Afectado",         icon: "🙋" },
            { id: "ajustador", label: "Firma del Ajustador",        icon: "📋" },
          ].map(f => (
            <div key={f.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-[#13193a] flex items-center gap-2">
                  <span>{f.icon}</span> {f.label}
                </p>
                {firmas[f.id] && (
                  <button
                    onClick={() => setFirmas(prev => ({ ...prev, [f.id]: null }))}
                    className="text-xs text-red-400 hover:text-red-600 font-medium"
                  >
                    Borrar
                  </button>
                )}
              </div>
              {firmas[f.id] ? (
                <div className="p-3 bg-gray-50">
                  <img src={firmas[f.id]} alt="Firma" className="h-16 mx-auto" style={{ filter: "invert(1) hue-rotate(180deg) brightness(0.2)" }}/>
                </div>
              ) : (
                <button
                  onClick={() => iniciarFirma(f.id)}
                  className="w-full px-4 py-5 flex flex-col items-center gap-2 text-gray-400 hover:bg-gray-50 transition-colors"
                >
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

      {/* Botón finalizar */}
      <div className="px-4 py-4 border-t border-gray-100 bg-white shrink-0">
        <button
          onClick={onFinalizar}
          className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Finalizar y Enviar Documentos
        </button>
      </div>

      {/* Modal de firma */}
      {firmando && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(10,15,40,0.6)" }}
          onClick={() => setFirmando(null)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="font-bold text-[#13193a] text-sm">Capturar firma</p>
              <button onClick={() => setFirmando(null)} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="p-4">
              <p className="text-xs text-gray-400 mb-3 text-center">Firma dentro del recuadro</p>
              <canvas
                ref={canvasRef}
                width={460}
                height={200}
                className="w-full border-2 border-dashed border-gray-300 rounded-2xl touch-none bg-gray-50"
                style={{ height: 180 }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onTouchStart={onMouseDown}
                onTouchMove={onMouseMove}
                onTouchEnd={onMouseUp}
              />
              <div className="flex gap-3 mt-4">
                <button onClick={limpiarFirma} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
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
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center mb-5">
        <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <h2 className="text-xl font-bold text-[#13193a] mb-2">¡Siniestro atendido!</h2>
      <p className="text-gray-400 text-sm mb-1">
        El folio <span className="font-mono font-bold text-[#13193a]">{siniestro.id}</span> ha sido cerrado.
      </p>
      <p className="text-gray-400 text-sm mb-8">Los documentos fueron enviados al cabinero.</p>
      <button
        onClick={onVolver}
        className="w-full max-w-xs py-3.5 rounded-2xl bg-[#13193a] text-white font-bold text-sm hover:bg-[#1e2a50] transition-all"
      >
        Volver a Siniestros
      </button>
    </div>
  );
}

// ── Página raíz del Ajustador ─────────────────────────────────
export default function AjustadorSiniestros() {
  const [vista,       setVista]       = useState("lista"); // "lista" | "detalle" | "exito"
  const [siniestro,   setSiniestro]   = useState(null);
  const [paso,        setPaso]        = useState(0); // 0-3

  const abrirSiniestro = useCallback((s) => {
    setSiniestro(s);
    setPaso(0);
    setVista("detalle");
  }, []);

  const volver = () => {
    if (paso > 0) { setPaso(p => p - 1); return; }
    setVista("lista");
    setSiniestro(null);
  };

  const finalizar = () => setVista("exito");

  // ── Layout ─────────────────────────────────────────────────
  return (
    <div className="flex h-full min-h-screen bg-gray-50">
      {/*
        En desktop/tablet landscape: layout de 2 columnas
        En mobile / tablet portrait: pantalla completa (una vista a la vez)
      */}

      {/* Panel izquierdo (lista) — siempre visible en md+ */}
      <div className={[
        "flex flex-col bg-white border-r border-gray-100",
        // Mobile: solo visible si no hay detalle
        vista === "lista"
          ? "flex w-full md:w-80 lg:w-96 md:flex-shrink-0"
          : "hidden md:flex md:w-80 lg:w-96 md:flex-shrink-0",
      ].join(" ")}>
        <ListaSiniestros onAtender={abrirSiniestro}/>
      </div>

      {/* Panel derecho (detalle / flujo) */}
      {vista === "detalle" && siniestro && (
        <div className="flex-1 flex flex-col bg-white min-h-0">
          {/* Header del detalle */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 bg-white shrink-0">
            <button
              onClick={volver}
              className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#13193a] hover:border-gray-300 transition-all shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#13193a] truncate">
                {["Confirmar Arribo", "Datos del Siniestro", "Evidencia y Docs", "Generar Documentos"][paso]}
              </p>
              <p className="text-xs text-gray-400 truncate">{siniestro.id} · {siniestro.asegurado}</p>
            </div>
          </div>

          {/* Step bar */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
            <StepBar paso={paso}/>
          </div>

          {/* Contenido del paso — scroll interno */}
          <div className="flex-1 min-h-0 flex flex-col">
            {paso === 0 && <ConfirmarArribo   siniestro={siniestro} onConfirmar={() => setPaso(1)}/>}
            {paso === 1 && <CapturaDatos      siniestro={siniestro} initialTab="datos"     onSiguiente={() => setPaso(2)}/>}
            {paso === 2 && <CapturaDatos      siniestro={siniestro} initialTab="evidencia"  onSiguiente={() => setPaso(3)}/>}
            {paso === 3 && <GenerarDocumentos siniestro={siniestro} onFinalizar={finalizar}/>}
          </div>
        </div>
      )}

      {/* Pantalla de éxito */}
      {vista === "exito" && siniestro && (
        <div className="flex-1 flex flex-col bg-white">
          <Exito siniestro={siniestro} onVolver={() => { setVista("lista"); setSiniestro(null); }}/>
        </div>
      )}

      {/* Placeholder cuando no hay siniestro seleccionado (desktop) */}
      {vista === "lista" && (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-gray-50 text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/>
            </svg>
          </div>
          <p className="text-[#13193a] font-semibold text-sm">Selecciona un siniestro</p>
          <p className="text-gray-400 text-xs mt-1">Elige un siniestro de la lista para comenzar la atención.</p>
        </div>
      )}
    </div>
  );
}