// ============================================================
// src/features/ajustador/shared.jsx
// ============================================================

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

export const STEP_LABELS_DEFAULT = ["Arribo", "Siniestro", "Partes", "Documentos"];

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

export const TALLERES_LISTA = [
  { nombre: "Taller Morelos",         telefono: "777 100 2233", direccion: "Blvd. Juárez 450, Centro, Cuernavaca, Morelos" },
  { nombre: "AutoServicios del Sur",  telefono: "777 200 3344", direccion: "Av. Plan de Ayala 890, Temixco, Morelos" },
  { nombre: "Taller Zapata",          telefono: "777 300 4455", direccion: "Emiliano Zapata 25, Col. Centro, Jiutepec, Morelos" },
  { nombre: "Multimarcas Cuernavaca", telefono: "777 400 5566", direccion: "Av. Domingo Diez 1205, Cuernavaca, Morelos" },
  { nombre: "Renova Cars",            telefono: "552 661 5281", direccion: "Carretera Los Reyes Texcoco Km 33, Texcoco, Edo. Méx." },
];

export const CLINICAS_LISTA = [
  { nombre: "Clínica Reforma",        telefono: "777 302 2505", direccion: "C. Ocotepec 517, Cuernavaca, Morelos 62260" },
  { nombre: "Clínica IMSS Zona Norte",telefono: "777 500 6677", direccion: "Av. Plan de Ayala 1203, Cuernavaca, Morelos" },
  { nombre: "Hospital San Miguel",    telefono: "777 600 7788", direccion: "Calle Morelos 34, Col. Centro, Cuernavaca, Morelos" },
  { nombre: "Cruz Roja Cuernavaca",   telefono: "777 700 8899", direccion: "Av. Domingo Diez 1120, Cuernavaca, Morelos" },
  { nombre: "MédicaVial Jiutepec",   telefono: "777 800 9900", direccion: "Av. Zapata 67, Jiutepec, Morelos" },
];

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
export function CampoSistema({ label, value }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</label>
        <span className="text-[9px] font-bold text-blue-500 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full uppercase tracking-wide leading-none">
          Sistema
        </span>
      </div>
      <div className="w-full px-3 py-2.5 rounded-xl border border-blue-100 bg-blue-50/40 text-sm font-semibold text-[#13193a]">
        {value || <span className="text-gray-300 font-normal italic text-xs">No registrado</span>}
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
