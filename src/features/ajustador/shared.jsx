// ============================================================
// src/features/ajustador/shared.jsx
// ============================================================

export const SINIESTROS_MOCK = [
  {
    id: "SN-10234",
    asegurado: "Juan Morales",
    vehiculo: "Toyota Camry",
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
    asegurado: "Diana López",
    vehiculo: "Nissan March",
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
  {
    label: "Asignados",
    value: 3,
    color: "text-[#13193a]",
    bg: "bg-[#13193a]/8",
  },
  {
    label: "Pend. arribo",
    value: 2,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  { label: "En proceso", value: 5, color: "text-blue-600", bg: "bg-blue-50" },
];

export const ESTATUS_CLS = {
  Asignado: "bg-[#13193a]/8  text-[#13193a]   border border-[#13193a]/15",
  "Pendiente de arribo":
    "bg-amber-50     text-amber-700   border border-amber-200",
  "En proceso": "bg-blue-50      text-blue-700    border border-blue-200",
  Atendido: "bg-emerald-50   text-emerald-700 border border-emerald-200",
};

// 3 pasos ahora (sin paso separado de evidencia)
export const STEP_LABELS_DEFAULT = [
  "Arribo",
  "Datos y Evidencia",
  "Documentos",
];

export const VISTAS_AUTO = [
  { id: "frente", label: "Frente" },
  { id: "lateral_i", label: "Lat. Izq." },
  { id: "trasera", label: "Trasera" },
  { id: "lateral_d", label: "Lat. Der." },
  { id: "techo", label: "Techo" },
];

// ── StepBar — acepta labels custom ────────────────────────────
export function StepBar({ paso, labels }) {
  const LABELS = labels ?? STEP_LABELS_DEFAULT;
  return (
    <div className="flex items-center px-1">
      {LABELS.map((label, i) => {
        const done = i < paso;
        const active = i === paso;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div
                className={[
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                      ? "bg-[#13193a] text-white"
                      : "bg-gray-100 text-gray-400",
                ].join(" ")}
              >
                {done ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-[10px] font-semibold hidden sm:block whitespace-nowrap ${
                  active
                    ? "text-[#13193a]"
                    : done
                      ? "text-emerald-600"
                      : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < LABELS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1.5 rounded-full transition-all duration-500 ${done ? "bg-emerald-400" : "bg-gray-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Campo de formulario ───────────────────────────────────────
export function Campo({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  readonly,
  rows,
}) {
  const cls = readonly
    ? "w-full px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm font-semibold text-[#13193a] cursor-default select-none"
    : "w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all";
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
        {label}
      </label>
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

// ── Sección con header oscuro ─────────────────────────────────
export function Seccion({ titulo, children, accion }) {
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
