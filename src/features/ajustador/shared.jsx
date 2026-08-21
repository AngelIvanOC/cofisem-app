// ============================================================
// src/features/ajustador/shared.jsx
// ============================================================
import { useState } from "react";

// Junta lo que captura DireccionCascada (estado/municipio/colonia/cp) +
// calle/número libres en un solo texto — domicilio del conductor y de
// terceros son columnas de texto simple, no vale la pena partirlas.
export function combinarDireccion({ calle, numero, colonia, municipio, estado, cp }) {
  const calleNum = [calle, numero].filter(Boolean).join(" ");
  return [calleNum, colonia, municipio, estado, cp && `C.P. ${cp}`]
    .filter(Boolean)
    .join(", ") || null;
}

export const SINIESTROS_MOCK = [
  {
    id: "SN-10234",
    folio: "SRC-2026010234",
    asegurado: "Juan Morales Pérez",
    aseguradoInfo: {
      nombre: "Juan Morales Pérez",
      rfc: "MOPJ850312HM0",
      curp: "MOPJ850312HMORLD05",
      telefono: "777 123 4567",
      email: "juan.morales@gmail.com",
      direccion: "Av. Emiliano Zapata 145, Col. Centro, Jiutepec, Morelos 62550",
    },
    vehiculo: "Toyota Camry 2021",
    vehiculoInfo: {
      marca: "Toyota",
      modelo: "Camry",
      anio: "2021",
      color: "Blanco",
      serie: "4T1BF1FK5EU123456",
      placas: "MOR-123-A",
    },
    polizaInfo: {
      numero: "01250100001024-01",
      vigencia: "06/06/2026",
      cobertura: "Amplia",
      aplicaDeducible: true,
      porcentajeDeducible: 5,
    },
    ubicacion: "Av. Emiliano Zapata 145, Jiutepec, Mor.",
    coords: { lat: 18.8841, lng: -99.1948 },
    telefono: null,
    tiempo: "Hace 12 min",
    estatus: "Asignado",
    poliza: "01250100001024-01",
    vigencia: "06/06/2026",
  },
  {
    id: "SN-10212",
    folio: "SRC-2026010212",
    asegurado: "Diana López Ramírez",
    aseguradoInfo: {
      nombre: "Diana López Ramírez",
      rfc: "LORD920515MMS",
      curp: "LORD920515MMSCMS01",
      telefono: "777 100 3344",
      email: "diana.lopez@hotmail.com",
      direccion: "Calle Girasoles 23, Col. Flores, Cuernavaca, Morelos 62350",
    },
    vehiculo: "Nissan March 2019",
    vehiculoInfo: {
      marca: "Nissan",
      modelo: "March",
      anio: "2019",
      color: "Rojo",
      serie: "3N1BC1AS9KL123456",
      placas: "MOR-456-B",
    },
    polizaInfo: {
      numero: "01250100001890-02",
      vigencia: "12/01/2027",
      cobertura: "Amplia Plus",
      aplicaDeducible: true,
      porcentajeDeducible: 5,
    },
    ubicacion: null,
    coords: null,
    telefono: "777 100 3344",
    tiempo: "Hace 40 min",
    estatus: "Pendiente de arribo",
    poliza: "01250100001890-02",
    vigencia: "12/01/2027",
  },
  {
    id: "SN-10208",
    folio: "SRC-2026010208",
    asegurado: "Luis Torres Mondragón",
    aseguradoInfo: {
      nombre: "Luis Torres Mondragón",
      rfc: "TOML780901HM0",
      curp: "TOML780901HMCRRN08",
      telefono: "777 321 0987",
      email: "luistorres78@yahoo.com",
      direccion: "Blvd. Cuauhnáhuac 890, Col. Industrial, Temixco, Morelos 62765",
    },
    vehiculo: "Volkswagen Vento 2020",
    vehiculoInfo: {
      marca: "Volkswagen",
      modelo: "Vento",
      anio: "2020",
      color: "Gris",
      serie: "3VW2K7AJ8LM123456",
      placas: "MOR-789-C",
    },
    polizaInfo: {
      numero: "01250100002100-01",
      vigencia: "03/08/2026",
      cobertura: "Amplia",
      aplicaDeducible: false,
      porcentajeDeducible: 0,
    },
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
    folio: "SRC-2026010254",
    asegurado: "Marco Ortega Salinas",
    aseguradoInfo: {
      nombre: "Marco Ortega Salinas",
      rfc: "OASM910624HM0",
      curp: "OASM910624HMCRLN04",
      telefono: "777 456 7890",
      email: "marco.ortega@gmail.com",
      direccion: "Calle Reforma 12, Col. Palmira, Cuernavaca, Morelos 62490",
    },
    vehiculo: "Chevrolet Aveo 2018",
    vehiculoInfo: {
      marca: "Chevrolet",
      modelo: "Aveo",
      anio: "2018",
      color: "Negro",
      serie: "3G1T52EC5JL123456",
      placas: "MOR-321-D",
    },
    polizaInfo: {
      numero: "01250100000445-03",
      vigencia: "15/11/2026",
      cobertura: "Básica",
      aplicaDeducible: true,
      porcentajeDeducible: 10,
    },
    ubicacion: null,
    coords: null,
    telefono: "777 456 7890",
    tiempo: "Hace 3 horas",
    estatus: "Atendido",
    poliza: "01250100000445-03",
    vigencia: "15/11/2026",
  },
];

export const METRICAS = [
  { label: "Asignados",    value: 3, color: "text-[#13193a]",  bg: "bg-[#13193a]/8" },
  { label: "Pend. arribo", value: 2, color: "text-amber-600",  bg: "bg-amber-50"    },
  { label: "En proceso",   value: 5, color: "text-blue-600",   bg: "bg-blue-50"     },
];

export const ESTATUS_CLS = {
  Asignado:             "bg-[#13193a]/8  text-[#13193a]   border border-[#13193a]/15",
  "Pendiente de arribo":"bg-amber-50     text-amber-700   border border-amber-200",
  "En proceso":         "bg-blue-50      text-blue-700    border border-blue-200",
  Atendido:             "bg-emerald-50   text-emerald-700 border border-emerald-200",
  Cerrado:              "bg-emerald-50   text-emerald-700 border border-emerald-200",
};

export const STEP_LABELS_DEFAULT = ["Arribo", "Siniestro", "Partes", "Lesionados", "Cierre", "Documentos"];

export const TIPOS_SINIESTRO = [
  "Choque con tercero",
  "Choque sin contraparte",
  "Daños materiales",
  "Robo total",
  "Robo parcial",
  "Lesiones a terceros",
  "Pérdida total",
  "Cristales",
  "Fenómeno natural",
  "Otro",
];

// TALLERES_LISTA y CLINICAS_LISTA se dieron de baja — el paso
// "Documentos"/"Lesionados" ahora trae talleres y hospitales reales de
// la tabla `servicios` (tipo='taller'/'hospital') vía
// fetchTalleres()/fetchHospitales() en services/servicios.js.

export const VISTAS_AUTO = [
  { id: "frente",    label: "Frente"    },
  { id: "lateral_i", label: "Lat. Izq." },
  { id: "trasera",   label: "Trasera"   },
  { id: "lateral_d", label: "Lat. Der." },
  { id: "techo",     label: "Techo"     },
];

// ── StepBar ───────────────────────────────────────────────────
export function StepBar({ paso, labels }) {
  const LABELS = labels ?? STEP_LABELS_DEFAULT;
  return (
    <div className="flex items-center px-1">
      {LABELS.map((label, i) => {
        const done   = i < paso;
        const active = i === paso;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className={[
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                done   ? "bg-emerald-500 text-white"
                : active ? "bg-[#13193a] text-white"
                :          "bg-gray-100 text-gray-400",
              ].join(" ")}>
                {done ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : i + 1}
              </div>
              <span className={`text-[10px] font-semibold hidden sm:block whitespace-nowrap ${active ? "text-[#13193a]" : done ? "text-emerald-600" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {i < LABELS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1.5 rounded-full transition-all duration-500 ${done ? "bg-emerald-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Campo editable ────────────────────────────────────────────
export function Campo({ label, placeholder, value, onChange, type = "text", readonly, rows }) {
  const cls = readonly
    ? "w-full px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm font-semibold text-[#13193a] cursor-default select-none"
    : "w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all";
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">{label}</label>
      {rows ? (
        <textarea
          rows={rows}
          placeholder={placeholder}
          value={value ?? ""}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          className={cls + " resize-none"}
        />
      ) : (
        <input
          type={type}
          readOnly={readonly}
          value={value ?? ""}
          placeholder={placeholder}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          className={cls}
        />
      )}
    </div>
  );
}

// ── Campo del sistema — read-only con badge azul ──────────────
export function CampoSistema({ label, value, placeholder = "No registrado" }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</label>
        <span className="text-[9px] font-bold text-blue-500 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full uppercase tracking-wide leading-none">
          Sistema
        </span>
      </div>
      <div className="w-full px-3 py-2.5 rounded-xl border border-blue-100 bg-blue-50/40 text-sm font-semibold text-[#13193a]">
        {value || <span className="text-gray-300 font-normal italic text-xs">{placeholder}</span>}
      </div>
    </div>
  );
}

// ── Select editable ───────────────────────────────────────────
export function CampoSelect({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">{label}</label>
      <select
        value={value ?? ""}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

// ── Separador con label ───────────────────────────────────────
export function Sep({ label }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px bg-gray-100" />
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0">{label}</p>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

// ── Sección con header oscuro ─────────────────────────────────
// `colapsable`: el header se vuelve clickeable y muestra/oculta el
// contenido (mismo lenguaje visual que DocToggle) — útil para bloques
// de solo lectura que no necesitan estar siempre expandidos en móvil.
export function Seccion({ titulo, children, accion, colapsable, defaultAbierto = true }) {
  const [abierto, setAbierto] = useState(defaultAbierto);
  const mostrar = colapsable ? abierto : true;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {colapsable ? (
        <button
          type="button"
          onClick={() => setAbierto((a) => !a)}
          className="w-full bg-[#13193a] px-4 py-3 flex items-center justify-between"
        >
          <p className="text-sm font-bold text-white tracking-wide">{titulo}</p>
          <div className="flex items-center gap-2">
            {accion}
            <svg className={`w-4 h-4 text-white/60 transition-transform ${abierto ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
      ) : (
        <div className="bg-[#13193a] px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-bold text-white tracking-wide">{titulo}</p>
          {accion}
        </div>
      )}
      {mostrar && <div className="p-4">{children}</div>}
    </div>
  );
}

// ── Tag de participante ───────────────────────────────────────
export function AfectadoTag({ label, active, onClick }) {
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

// Suma el monto de todos los marcadores de "Daños del Siniestro" (todos
// los lados, value = { [ladoId]: [{monto,...}] } de DanosMarcadores) —
// usada para llenar en automático "Monto estimado del daño". Los
// marcadores de "Daños Preexistentes" no tienen monto (solo nota), así
// que esto solo debe llamarse con datosNA/datosAfectado.danosSiniestro,
// nunca con .danosPreexistente.
// Fila de botones tipo "chip" para elegir una opción de una lista corta
// (Sí/No, Atropello/Colisión, etc.) — usada en el paso de Lesionados y
// en Documentos (Pase Taller/Médico).
// Compara el snapshot con el que arrancó un formulario (`original`)
// contra su estado actual (`actual`) y devuelve solo las llaves que de
// verdad cambiaron — para que cada paso mande a guardar nada más lo
// que el ajustador tocó, en vez de reescribir todos sus campos cada
// vez que se avanza. Arrays/objetos se comparan por contenido (no por
// referencia); ambos lados deben venir en la MISMA forma (los mismos
// valores "vacío" — típicamente "" — para que un campo nunca tocado
// no aparezca como "cambiado" solo por comparar "" contra null).
export function soloCambios(original, actual) {
  const cambios = {};
  for (const k of Object.keys(actual)) {
    const av = original?.[k];
    const bv = actual[k];
    const distintos = (Array.isArray(av) || Array.isArray(bv))
      ? JSON.stringify(av ?? []) !== JSON.stringify(bv ?? [])
      : av !== bv;
    if (distintos) cambios[k] = bv;
  }
  return cambios;
}

export function ToggleRow({ label, options, current, onPick }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">{label}</label>
      <div className="flex gap-2 flex-wrap">
        {options.map((op) => (
          <button
            key={op}
            type="button"
            onClick={() => onPick(op)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${current === op ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-500 border-gray-200"}`}
          >
            {op}
          </button>
        ))}
      </div>
    </div>
  );
}

// Mismo catálogo de regiones del cuerpo que usa el Pase Médico — se
// reutiliza en el paso de Lesionados, así ambos hablan de las mismas
// zonas sin que se desincronicen si se agrega/quita una.
export const REGIONES_CUERPO = ["Cabeza", "Cuello", "Tórax", "Abdomen", "Miembros Superiores", "Miembros Inferiores"];

export function sumaMontosDanos(value) {
  return Object.values(value ?? {})
    .flat()
    .reduce((acc, m) => acc + (Number(m?.monto) || 0), 0);
}

export function formatMonto(n) {
  if (!n) return "";
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

// ── Tile — tarjeta clickeable del hub de secciones (NA/Tercero/
// Evidencias/Cierre) y de los módulos dentro de cada sección.
// `completo`: marca visual (check verde) cuando ya hay datos guardados
// — no bloquea nada, es solo referencia para el ajustador.
export function Tile({ titulo, subtitulo, icon, completo, onClick, accion }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border-2 border-gray-100 hover:border-[#13193a]/25 hover:shadow-md p-4 flex items-center gap-3 transition-all active:scale-[0.98]"
    >
      <div className="w-11 h-11 rounded-xl bg-[#13193a]/8 flex items-center justify-center shrink-0 text-lg">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#13193a] truncate">{titulo}</p>
        {subtitulo && <p className="text-xs text-gray-400 truncate mt-0.5">{subtitulo}</p>}
      </div>
      {accion}
      {completo ? (
        <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      ) : (
        <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
}

// ── PanelHeader — header fijo con botón "atrás" + título/subtítulo,
// reutilizado por el Hub y por cada sección/módulo interno (mismo
// lenguaje visual que el header de PanelDetalle en index.jsx, pero
// para navegación dentro del hub, que ya no depende del `paso`
// numérico de index.jsx).
export function PanelHeader({ titulo, subtitulo, onVolver, accion }) {
  return (
    <div className="shrink-0 flex items-center gap-3 px-4 py-4 border-b border-gray-100 bg-white">
      <button
        onClick={onVolver}
        className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#13193a] transition-all shrink-0"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#13193a] truncate">{titulo}</p>
        {subtitulo && <p className="text-xs text-gray-400 truncate">{subtitulo}</p>}
      </div>
      {accion}
    </div>
  );
}
