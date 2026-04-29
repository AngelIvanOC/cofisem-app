// ============================================================
// src/features/operador/Polizas.jsx
// Módulo principal de pólizas:
//   - Lista de pólizas + búsqueda + filtros
//   - Cotizar (nueva cotización con tabla de coberturas)
//   - Comparar coberturas
//   - Tramitar desde cotización guardada
//   - Renovar
//   - Consultar
// ============================================================
import { useState, useRef } from "react";

// ── Catálogos ─────────────────────────────────────────────────
const OFICINA = { nombre: "COFISEM AV. E.ZAPATA", id: "civac", codigo: "0126" };

const COBERTURAS_CATALOGO = {
  "TAXI BÁSICA 2500": {
    uso: "SERVICIO PÚBLICO",
    coberturas: [
      {
        desc: "Resp. Civil a Terceros Bienes y Personas",
        monto: "$1,700,000.00",
        ded: "0.00",
        prima: 572.85,
      },
      {
        desc: "Resp. Civil Complementaria Personas",
        monto: "$3,000,000.00",
        ded: "0.00",
        prima: 105.18,
      },
      {
        desc: "Gastos Médicos Conductor y Familiares",
        monto: "$50,000.00",
        ded: "0.00",
        prima: 154.83,
      },
      {
        desc: "Muerte de Conductor x/AA",
        monto: "$50,000.00",
        ded: "0.00",
        prima: 69.84,
      },
      {
        desc: "Gastos Legales",
        monto: "AMPARADOS",
        ded: "0.00",
        prima: 300.75,
      },
      {
        desc: "Resp. Civil Viajero",
        monto: "5,000 UMAS/Pasajero",
        ded: "0.00",
        prima: 293.09,
      },
    ],
    primaNeta: 1496.55,
    derechos: 400.0,
    iva: 303.45,
    total: 2200.0,
    formasPago: ["CONTADO", "2 PARCIALES", "4 PARCIALES"],
  },
  "TAXI BÁSICA PAGOS 2700": {
    uso: "SERVICIO PÚBLICO",
    coberturas: [
      {
        desc: "Resp. Civil a Terceros Bienes y Personas",
        monto: "$1,700,000.00",
        ded: "0.00",
        prima: 620.0,
      },
      {
        desc: "Resp. Civil Complementaria Personas",
        monto: "$3,000,000.00",
        ded: "0.00",
        prima: 115.0,
      },
      {
        desc: "Gastos Médicos Conductor y Familiares",
        monto: "$50,000.00",
        ded: "0.00",
        prima: 170.0,
      },
      {
        desc: "Muerte de Conductor x/AA",
        monto: "$50,000.00",
        ded: "0.00",
        prima: 75.0,
      },
      { desc: "Gastos Legales", monto: "AMPARADOS", ded: "0.00", prima: 310.0 },
      {
        desc: "Resp. Civil Viajero",
        monto: "5,000 UMAS/Pasajero",
        ded: "0.00",
        prima: 310.0,
      },
    ],
    primaNeta: 1600.0,
    derechos: 400.0,
    iva: 320.0,
    total: 2320.0,
    formasPago: ["CONTADO", "2 PARCIALES", "4 PARCIALES", "6 PARCIALES"],
  },
  "SERV. PÚB. 50/50 GAMAN 2": {
    uso: "SERVICIO PÚBLICO",
    coberturas: [
      {
        desc: "Resp. Civil a Terceros Bienes y Personas",
        monto: "$2,000,000.00",
        ded: "0.00",
        prima: 680.0,
      },
      {
        desc: "Resp. Civil Complementaria Personas",
        monto: "$3,500,000.00",
        ded: "0.00",
        prima: 130.0,
      },
      {
        desc: "Gastos Médicos Conductor y Familiares",
        monto: "$80,000.00",
        ded: "0.00",
        prima: 190.0,
      },
      {
        desc: "Muerte de Conductor x/AA",
        monto: "$80,000.00",
        ded: "0.00",
        prima: 90.0,
      },
      { desc: "Gastos Legales", monto: "AMPARADOS", ded: "0.00", prima: 350.0 },
      {
        desc: "Resp. Civil Viajero",
        monto: "5,000 UMAS/Pasajero",
        ded: "0.00",
        prima: 350.0,
      },
    ],
    primaNeta: 1790.0,
    derechos: 400.0,
    iva: 358.0,
    total: 2548.0,
    formasPago: ["CONTADO", "4 PARCIALES"],
  },
  "COBERTURA APP (UBER, DIDI)": {
    uso: "APP",
    coberturas: [
      {
        desc: "Resp. Civil a Terceros Bienes y Personas",
        monto: "$3,000,000.00",
        ded: "0.00",
        prima: 850.0,
      },
      {
        desc: "Resp. Civil Complementaria Personas",
        monto: "$4,000,000.00",
        ded: "0.00",
        prima: 220.0,
      },
      {
        desc: "Gastos Médicos Conductor y Familiares",
        monto: "$100,000.00",
        ded: "0.00",
        prima: 250.0,
      },
      {
        desc: "Muerte de Conductor x/AA",
        monto: "$100,000.00",
        ded: "0.00",
        prima: 120.0,
      },
      { desc: "Gastos Legales", monto: "AMPARADOS", ded: "0.00", prima: 400.0 },
      {
        desc: "Resp. Civil Viajero",
        monto: "5,000 UMAS/Pasajero",
        ded: "0.00",
        prima: 420.0,
      },
    ],
    primaNeta: 2260.0,
    derechos: 450.0,
    iva: 432.8,
    total: 3142.8,
    formasPago: ["CONTADO", "4 PARCIALES", "TRIMESTRAL"],
  },
};

const TIPOS_COBERTURA = Object.keys(COBERTURAS_CATALOGO);

const CLIENTES_MOCK = [
  "Angel Ivan Ortega Chaverría",
  "María García López",
  "Roberto Díaz Ramos",
  "Sofía Torres Ruiz",
  "Juan Pérez Salinas",
  "Carmen López Vargas",
];

const VENDEDORES_MOCK = [
  "ADMINISTRADOR",
  "Laura Rosher",
  "Marco A. Cruz",
  "Carlos Soto",
];

const POLIZAS_MOCK = [
  {
    id: "3413241",
    asegurado: "Angel Ivan Ortega",
    cobertura: "COBERTURA APP (UBER, DIDI)",
    vendedor: "Laura Rosher",
    prima: 3142.8,
    vence: "13/03/2027",
    estatus: "Vigente",
    forma: "Trimestral",
    uso: "DIDI",
  },
  {
    id: "3413198",
    asegurado: "María García López",
    cobertura: "TAXI BÁSICA 2500",
    vendedor: "Marco A. Cruz",
    prima: 2200.0,
    vence: "12/03/2027",
    estatus: "Vigente",
    forma: "Contado",
    uso: "TAXI",
  },
  {
    id: "3413167",
    asegurado: "Roberto Díaz Ramos",
    cobertura: "SERV. PÚB. 50/50 GAMAN 2",
    vendedor: "Laura Rosher",
    prima: 2548.0,
    vence: "11/03/2027",
    estatus: "Vigente",
    forma: "4 Parciales",
    uso: "TAXI",
  },
  {
    id: "3411002",
    asegurado: "Carmen López",
    cobertura: "TAXI BÁSICA 2500",
    vendedor: "Carlos Soto",
    prima: 2200.0,
    vence: "20/03/2026",
    estatus: "Por vencer",
    forma: "Contado",
    uso: "TAXI",
  },
];

const COTIZACIONES_MOCK = [
  {
    id: "COT-012601000014",
    cliente: "Juan Pérez",
    cobertura: "TAXI BÁSICA 2500",
    total: 2200.0,
    fecha: "17/03/2026 10:15",
    vendedor: "Marco A. Cruz",
    guardada: true,
  },
  {
    id: "COT-012601000012",
    cliente: "Rosa Mendoza",
    cobertura: "SERV. PÚB. 50/50 GAMAN 2",
    total: 2548.0,
    fecha: "16/03/2026 16:30",
    vendedor: "Laura Rosher",
    guardada: true,
  },
  {
    id: "COT-012601000009",
    cliente: "Pedro Ramos",
    cobertura: "COBERTURA APP (UBER, DIDI)",
    total: 3142.8,
    fecha: "15/03/2026 09:00",
    vendedor: "Carlos Soto",
    guardada: true,
  },
];

// ── Catálogo de vehículos en cascada ─────────────────────────
const CATALOGO_VEHICULOS = {
  "Nissan": {
    "Sedán":     ["Tsuru GSI", "Sentra Sense", "Versa Advance", "Altima Exclusive"],
    "SUV":       ["X-Trail Advance", "Kicks Sense", "Pathfinder"],
    "Hatchback": ["March Sense", "Note SR"],
    "Pickup":    ["NP300 Frontier", "Frontier Pro-4X"],
  },
  "Toyota": {
    "Sedán":     ["Yaris Core", "Corolla LE", "Camry SE"],
    "SUV":       ["RAV4 XLE", "Highlander LE", "Land Cruiser"],
    "Hatchback": ["Yaris Hatchback"],
    "Pickup":    ["Hilux SR", "Tacoma TRD"],
  },
  "Volkswagen": {
    "Sedán":     ["Vento Comfortline", "Jetta Trendline", "Passat Highline"],
    "SUV":       ["Tiguan Comfortline", "Teramont"],
    "Hatchback": ["Polo Comfortline", "Gol Trendline"],
  },
  "Chevrolet": {
    "Sedán":     ["Aveo LS", "Cavalier LT", "Malibu LT"],
    "SUV":       ["Tracker LT", "Equinox LT", "Captiva"],
    "Hatchback": ["Spark LT"],
    "Pickup":    ["S10 Max", "Silverado"],
  },
  "Honda": {
    "Sedán":     ["City LX", "Civic Turbo", "Accord Sport"],
    "SUV":       ["HR-V Prime", "CR-V Touring"],
  },
};

const MARCAS = Object.keys(CATALOGO_VEHICULOS);

// ── Modal "Nuevo asegurado" ──────────────────────────────────
const ESTADOS_MX = [
  "Aguascalientes","Baja California","Baja California Sur","Campeche",
  "Chiapas","Chihuahua","Ciudad de México","Coahuila","Colima","Durango",
  "Estado de México","Guanajuato","Guerrero","Hidalgo","Jalisco",
  "Michoacán","Morelos","Nayarit","Nuevo León","Oaxaca","Puebla",
  "Querétaro","Quintana Roo","San Luis Potosí","Sinaloa","Sonora",
  "Tabasco","Tamaulipas","Tlaxcala","Veracruz","Yucatán","Zacatecas",
];
const EMPTY_ASEG = { nombre: "", rfc: "", curp: "", telefono: "", email: "", calle: "", colonia: "", municipio: "", cp: "", estado: "Morelos" };

function CampoModal({ label, value, onChange, placeholder, type = "text", req }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
        {label}{req && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value ?? ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all"
      />
    </div>
  );
}

function ModalNuevoAsegurado({ onClose, onGuardar }) {
  const [form, setForm] = useState(EMPTY_ASEG);
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const guardar = () => {
    if (!form.nombre || !form.rfc) return;
    onGuardar(form.nombre);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(10,15,40,0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-bold text-[#13193a]">Nuevo asegurado</h2>
            <p className="text-xs text-gray-400 mt-0.5">Registra un nuevo asegurado</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Datos personales</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <CampoModal label="Nombre completo" value={form.nombre} onChange={v => setF("nombre", v)} placeholder="Nombre completo del asegurado" req />
              </div>
              <CampoModal label="RFC" value={form.rfc} onChange={v => setF("rfc", v)} placeholder="RFC con homoclave" req />
              <CampoModal label="CURP" value={form.curp} onChange={v => setF("curp", v)} placeholder="CURP" />
              <CampoModal label="Teléfono" type="tel" value={form.telefono} onChange={v => setF("telefono", v)} placeholder="55 0000 0000" req />
              <CampoModal label="Correo electrónico" type="email" value={form.email} onChange={v => setF("email", v)} placeholder="correo@ejemplo.com" />
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Domicilio</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <CampoModal label="Calle y número" value={form.calle} onChange={v => setF("calle", v)} placeholder="Av. Emiliano Zapata 145" />
              </div>
              <CampoModal label="Colonia" value={form.colonia} onChange={v => setF("colonia", v)} placeholder="Colonia" />
              <CampoModal label="Municipio" value={form.municipio} onChange={v => setF("municipio", v)} placeholder="Municipio" />
              <CampoModal label="C.P." value={form.cp} onChange={v => setF("cp", v)} placeholder="62000" />
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Estado</label>
                <select
                  value={form.estado}
                  onChange={e => setF("estado", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]"
                >
                  {ESTADOS_MX.map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button
            onClick={guardar}
            disabled={!form.nombre || !form.rfc}
            className="flex-1 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 transition-all"
          >
            Registrar asegurado
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Componentes pequeños ──────────────────────────────────────
function Tab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap",
        active
          ? "border-[#13193a] text-[#13193a]"
          : "border-transparent text-gray-400 hover:text-gray-600",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function StatusBadge({ estatus }) {
  const cls = {
    Vigente: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Por vencer": "bg-amber-50   text-amber-700   border-amber-200",
    Vencida: "bg-red-50     text-red-600     border-red-200",
    Cancelada: "bg-gray-100   text-gray-500    border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cls[estatus] ?? cls["Cancelada"]}`}
    >
      {estatus}
    </span>
  );
}

// ── Formulario de cotización ──────────────────────────────────
function FormCotizacion({
  cotizacionInicial,
  onGuardar,
  onTramitar,
  onCancelar,
}) {
  const esEdicion = !!cotizacionInicial;
  const nroCot =
    cotizacionInicial?.id ??
    `COT-${OFICINA.codigo}01${Date.now().toString().slice(-6)}`;

  const [form, setForm] = useState({
    cliente:    cotizacionInicial?.cliente   ?? "",
    vendedor:   cotizacionInicial?.vendedor  ?? VENDEDORES_MOCK[0],
    cobertura:  cotizacionInicial?.cobertura ?? "",
    formaPago:  "CONTADO",
    descPct:    0,
    // Vehículo en cascada
    marca:      "",
    tipo:       "",
    version:    "",
    modelo:     "",
    serie:      "",
    motor:      "",
    placas:     "",
    codAMIS:    "",
  });
  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const [clientesLocal, setClientesLocal] = useState(CLIENTES_MOCK);
  const [modalAseg, setModalAseg] = useState(false);

  const coberturaData = COBERTURAS_CATALOGO[form.cobertura] ?? null;
  const formasPago = coberturaData?.formasPago ?? ["CONTADO"];
  const primaNeta = coberturaData?.primaNeta ?? 0;
  const derechos = coberturaData?.derechos ?? 0;
  const descMonto = +((primaNeta * form.descPct) / 100).toFixed(2);
  const iva = +((primaNeta - descMonto + derechos) * 0.16).toFixed(2);
  const total = +(primaNeta - descMonto + derechos + iva).toFixed(2);

  const fechaHoy = new Date().toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const horaHoy = new Date().toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // Cascada de vehículo
  const tiposDisponibles = form.marca ? Object.keys(CATALOGO_VEHICULOS[form.marca]) : [];
  const versionesDisponibles = form.marca && form.tipo ? CATALOGO_VEHICULOS[form.marca][form.tipo] : [];

  const onCambiarMarca = (v) => {
    setForm((f) => ({ ...f, marca: v, tipo: "", version: "" }));
  };
  const onCambiarTipo = (v) => {
    setForm((f) => ({ ...f, tipo: v, version: "" }));
  };

  const onGuardarAsegurado = (nombre) => {
    setClientesLocal((cs) => [...cs, nombre]);
    setF("cliente", nombre);
    setModalAseg(false);
  };

  const inpCls =
    "w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all";
  const roCls =
    "w-full px-3 py-2 rounded-xl border border-gray-100 bg-gray-50 text-sm font-semibold text-[#13193a] cursor-default";
  const lblCls =
    "block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5";

  return (
    <div className="space-y-5">
      {/* Banner de identificación */}
      <div className="bg-[#13193a] rounded-2xl px-5 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-white/40 mb-0.5">No. Cotización</p>
            <p className="text-white font-mono font-bold">{nroCot}</p>
          </div>
          <div>
            <p className="text-white/40 mb-0.5">Fecha emisión</p>
            <p className="text-white font-semibold">{fechaHoy}</p>
          </div>
          <div>
            <p className="text-white/40 mb-0.5">Hora</p>
            <p className="text-white font-semibold">{horaHoy} hrs.</p>
          </div>
          <div>
            <p className="text-white/40 mb-0.5">Punto de venta</p>
            <p className="text-white font-semibold truncate">
              {OFICINA.nombre}
            </p>
          </div>
        </div>
      </div>

      {/* Datos de la cotización */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
          Datos de la cotización
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={lblCls}>Vendedor</label>
            <select
              value={form.vendedor}
              onChange={(e) => setF("vendedor", e.target.value)}
              className={inpCls}
            >
              {VENDEDORES_MOCK.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={lblCls}>Empresa</label>
            <input readOnly value="GAMAN, S.A. DE C.V." className={roCls} />
          </div>

          {/* Asegurado + botón nuevo */}
          <div className="sm:col-span-2">
            <label className={lblCls}>
              Asegurado <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={form.cliente}
                onChange={(e) => setF("cliente", e.target.value)}
                className={inpCls + " flex-1"}
              >
                <option value="">Seleccione un asegurado</option>
                {clientesLocal.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setModalAseg(true)}
                title="Registrar nuevo asegurado"
                className="shrink-0 w-10 h-10 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white flex items-center justify-center transition-all shadow-sm shadow-[#13193a]/15"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className={lblCls}>
              Cobertura <span className="text-red-400">*</span>
            </label>
            <select
              value={form.cobertura}
              onChange={(e) => setF("cobertura", e.target.value)}
              className={inpCls}
            >
              <option value="">Seleccione una cobertura</option>
              {TIPOS_COBERTURA.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Uso · Forma de pago · % Descuento (movidos aquí) */}
          {coberturaData && (
            <>
              <div>
                <label className={lblCls}>Uso</label>
                <input readOnly value={coberturaData.uso} className={roCls} />
              </div>
              <div>
                <label className={lblCls}>Forma de pago</label>
                <select
                  value={form.formaPago}
                  onChange={(e) => setF("formaPago", e.target.value)}
                  className={inpCls}
                >
                  {formasPago.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={lblCls}>% Descuento</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="0.5"
                  value={form.descPct}
                  onChange={(e) =>
                    setF("descPct", parseFloat(e.target.value) || 0)
                  }
                  className={inpCls}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabla de coberturas — aparece al seleccionar */}
      {coberturaData && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-[#13193a] px-5 py-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">{form.cobertura}</h3>
              <p className="text-white/40 text-xs mt-0.5">
                Uso: {coberturaData.uso}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">
                    Descripción
                  </th>
                  <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">
                    Monto Asegurado
                  </th>
                  <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">
                    % Ded.
                  </th>
                  <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-2.5">
                    Prima Neta
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {coberturaData.coberturas.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50/60">
                    <td className="px-4 py-2.5 text-gray-700 font-medium">
                      {c.desc}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600 font-semibold">
                      {c.monto}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-400">
                      {c.ded}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-[#13193a]">
                      ${c.prima.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vehículo y condiciones */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
          Vehículo y condiciones
        </p>

        {/* Cód. AMIS + Capacidad fija */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={lblCls}>Cód. AMIS</label>
            <input
              value={form.codAMIS}
              onChange={(e) => setF("codAMIS", e.target.value)}
              placeholder="Código AMIS"
              className={inpCls}
            />
          </div>
          <div>
            <label className={lblCls}>Capacidad</label>
            <input readOnly value="4 pasajeros" className={roCls} />
          </div>
        </div>

        {/* Cascada Marca → Tipo → Versión */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={lblCls}>
              Marca <span className="text-red-400">*</span>
            </label>
            <select
              value={form.marca}
              onChange={(e) => onCambiarMarca(e.target.value)}
              className={inpCls}
            >
              <option value="">Selecciona marca</option>
              {MARCAS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={lblCls}>Tipo</label>
            <select
              value={form.tipo}
              onChange={(e) => onCambiarTipo(e.target.value)}
              disabled={!form.marca}
              className={inpCls + (form.marca ? "" : " opacity-50 cursor-not-allowed")}
            >
              <option value="">
                {form.marca ? "Selecciona tipo" : "Selecciona marca primero"}
              </option>
              {tiposDisponibles.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={lblCls}>Versión</label>
            <select
              value={form.version}
              onChange={(e) => setF("version", e.target.value)}
              disabled={!form.tipo}
              className={inpCls + (form.tipo ? "" : " opacity-50 cursor-not-allowed")}
            >
              <option value="">
                {form.tipo ? "Selecciona versión" : "Selecciona tipo primero"}
              </option>
              {versionesDisponibles.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Datos del vehículo: Modelo + Serie + Motor + Placas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className={lblCls}>Modelo (año)</label>
            <input
              value={form.modelo}
              onChange={(e) => setF("modelo", e.target.value)}
              placeholder="2020"
              className={inpCls}
            />
          </div>
          <div>
            <label className={lblCls}>No. Serie</label>
            <input
              value={form.serie}
              onChange={(e) => setF("serie", e.target.value)}
              placeholder="17 dígitos"
              className={inpCls}
            />
          </div>
          <div>
            <label className={lblCls}>Motor</label>
            <input
              value={form.motor}
              onChange={(e) => setF("motor", e.target.value)}
              placeholder="No. de motor"
              className={inpCls}
            />
          </div>
          <div>
            <label className={lblCls}>Placas</label>
            <input
              value={form.placas}
              onChange={(e) => setF("placas", e.target.value)}
              placeholder="ABC-123"
              className={inpCls}
            />
          </div>
        </div>
      </div>

      {/* Resumen de prima */}
      {coberturaData && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
            Resumen de prima
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Prima neta", value: `$${primaNeta.toFixed(2)}` },
              { label: "Derechos", value: `$${derechos.toFixed(2)}` },
              { label: "Descuentos", value: `$${descMonto.toFixed(2)}` },
              { label: "I.V.A.", value: `$${iva.toFixed(2)}` },
            ].map((f) => (
              <div
                key={f.label}
                className="bg-gray-50 rounded-xl p-3 border border-gray-100"
              >
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">
                  {f.label}
                </p>
                <p className="text-sm font-bold text-[#13193a]">{f.value}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between bg-[#13193a] rounded-xl px-5 py-3.5">
            <p className="text-white font-bold text-sm">Total a pagar</p>
            <p className="text-white font-bold text-2xl tabular-nums">
              ${total.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          onClick={onCancelar}
          className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
        >
          Cancelar
        </button>
        <button
          onClick={() =>
            onGuardar({
              id: nroCot,
              ...form,
              total,
              fecha: `${fechaHoy} ${horaHoy}`,
              vendedor: form.vendedor,
              guardada: true,
            })
          }
          disabled={!form.cliente || !form.cobertura}
          className="px-5 py-2.5 rounded-xl border border-[#13193a] text-sm font-semibold text-[#13193a] hover:bg-[#13193a]/5 disabled:opacity-40 transition-all"
        >
          Guardar cotización
        </button>
        <button
          onClick={() =>
            onTramitar({
              id: nroCot,
              ...form,
              total,
              fecha: `${fechaHoy} ${horaHoy}`,
            })
          }
          disabled={!form.cliente || !form.cobertura || !form.marca || !form.tipo || !form.version}
          className="flex-1 sm:flex-none px-8 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 transition-all flex items-center gap-2 shadow-lg shadow-[#13193a]/15"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Tramitar póliza
        </button>
      </div>

      {/* Modal nuevo asegurado */}
      {modalAseg && (
        <ModalNuevoAsegurado
          onClose={() => setModalAseg(false)}
          onGuardar={onGuardarAsegurado}
        />
      )}
    </div>
  );
}

// ── Comparador de coberturas ──────────────────────────────────
function Comparador({ onCerrar, onSeleccionar }) {
  const [seleccion, setSeleccion] = useState([
    TIPOS_COBERTURA[0],
    TIPOS_COBERTURA[1],
  ]);

  const toggle = (tipo) => {
    if (seleccion.includes(tipo)) {
      if (seleccion.length > 1)
        setSeleccion((s) => s.filter((t) => t !== tipo));
    } else {
      if (seleccion.length < 3) setSeleccion((s) => [...s, tipo]);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#13193a]">
            Comparar coberturas
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Selecciona hasta 3 coberturas para comparar
          </p>
        </div>
        <button
          onClick={onCerrar}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ← Volver
        </button>
      </div>

      {/* Selector de coberturas */}
      <div className="flex flex-wrap gap-2 mb-5">
        {TIPOS_COBERTURA.map((t) => (
          <button
            key={t}
            onClick={() => toggle(t)}
            className={[
              "px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all",
              seleccion.includes(t)
                ? "bg-[#13193a] text-white border-[#13193a]"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300",
            ].join(" ")}
          >
            {t}
          </button>
        ))}
        <p className="text-xs text-gray-400 self-center ml-2">
          ({seleccion.length}/3 seleccionadas)
        </p>
      </div>

      {/* Tabla comparativa */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#13193a]">
                <th className="text-left px-4 py-3 font-semibold text-white">
                  Cobertura
                </th>
                {seleccion.map((s) => (
                  <th
                    key={s}
                    className="text-right px-4 py-3 font-semibold text-white whitespace-nowrap"
                  >
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {/* Totales destacados */}
              <tr className="bg-blue-50">
                <td className="px-4 py-3 font-bold text-[#13193a]">
                  Total a pagar
                </td>
                {seleccion.map((s) => (
                  <td
                    key={s}
                    className="px-4 py-3 text-right font-bold text-[#13193a] text-sm"
                  >
                    ${COBERTURAS_CATALOGO[s].total.toFixed(2)}
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50/60">
                <td className="px-4 py-3 font-semibold text-gray-600">
                  Prima neta
                </td>
                {seleccion.map((s) => (
                  <td
                    key={s}
                    className="px-4 py-3 text-right font-semibold text-gray-700"
                  >
                    ${COBERTURAS_CATALOGO[s].primaNeta.toFixed(2)}
                  </td>
                ))}
              </tr>
              {/* Coberturas individuales */}
              {[
                "Resp. Civil a Terceros Bienes y Personas",
                "Resp. Civil Complementaria Personas",
                "Gastos Médicos Conductor y Familiares",
                "Muerte de Conductor x/AA",
                "Gastos Legales",
                "Resp. Civil Viajero",
              ].map((desc) => (
                <tr key={desc} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 text-gray-600">{desc}</td>
                  {seleccion.map((s) => {
                    const cob = COBERTURAS_CATALOGO[s].coberturas.find(
                      (c) => c.desc === desc,
                    );
                    return (
                      <td
                        key={s}
                        className="px-4 py-3 text-right text-gray-700"
                      >
                        {cob ? (
                          cob.monto
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botones de selección */}
      <div className="flex gap-3 mt-5">
        {seleccion.map((s) => (
          <button
            key={s}
            onClick={() => onSeleccionar(s)}
            className="flex-1 py-2.5 rounded-xl border-2 border-[#13193a] text-sm font-bold text-[#13193a] hover:bg-[#13193a]/5 transition-all"
          >
            Cotizar con "{s}"
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Confirmación de tramite exitoso ──────────────────────────
function TramiteExitoso({ cotizacion, onNueva, onVolver }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center mb-5">
        <svg
          className="w-10 h-10 text-emerald-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-[#13193a] mb-2">
        ¡Póliza tramitada!
      </h2>
      <p className="text-gray-400 text-sm mb-1">
        La cotización{" "}
        <span className="font-mono font-bold text-[#13193a]">
          {cotizacion.id}
        </span>{" "}
        fue tramitada exitosamente.
      </p>
      <p className="text-gray-400 text-sm mb-8">
        Cliente: <strong className="text-gray-600">{cotizacion.cliente}</strong>
      </p>
      <div className="flex gap-3">
        <button
          onClick={onVolver}
          className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          Ver pólizas
        </button>
        <button
          onClick={onNueva}
          className="px-6 py-2.5 rounded-xl bg-[#13193a] text-white text-sm font-bold hover:bg-[#1e2a50]"
        >
          Nueva cotización
        </button>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function Polizas() {
  const [tab, setTab] = useState("polizas"); // polizas | cotizaciones | nueva | comparar
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("Todos");
  const [cotizaciones, setCotizaciones] = useState(COTIZACIONES_MOCK);
  const [tramiteOk, setTramiteOk] = useState(null);
  const [cotActiva, setCotActiva] = useState(null); // para editar cotización guardada

  const polizasFiltradas = POLIZAS_MOCK.filter((p) => {
    const matchBusq =
      p.asegurado.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.id.includes(busqueda);
    const matchEst = filtroEstatus === "Todos" || p.estatus === filtroEstatus;
    return matchBusq && matchEst;
  });

  const guardarCotizacion = (cot) => {
    setCotizaciones((cs) => [
      { ...cot, guardada: true },
      ...cs.filter((c) => c.id !== cot.id),
    ]);
    setTab("cotizaciones");
  };

  const tramitarPoliza = (cot) => {
    setTramiteOk(cot);
    setTab("exito");
  };

  const abrirCotizacionGuardada = (cot) => {
    setCotActiva(cot);
    setTab("nueva");
  };

  // Si tramite exitoso
  if (tab === "exito" && tramiteOk) {
    return (
      <div className="p-6 min-h-full bg-gray-50">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <TramiteExitoso
            cotizacion={tramiteOk}
            onNueva={() => {
              setTramiteOk(null);
              setCotActiva(null);
              setTab("nueva");
            }}
            onVolver={() => {
              setTramiteOk(null);
              setTab("polizas");
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Pólizas</h1>
          <p className="text-gray-400 text-sm mt-0.5">{OFICINA.nombre}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab("comparar")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z"
              />
            </svg>
            Comparar
          </button>
          <button
            onClick={() => {
              setCotActiva(null);
              setTab("nueva");
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#13193a] text-white text-sm font-semibold hover:bg-[#1e2a50] transition-all shadow-sm shadow-[#13193a]/15"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Nueva cotización
          </button>
        </div>
      </div>

      {/* Comparador */}
      {tab === "comparar" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <Comparador
            onCerrar={() => setTab("polizas")}
            onSeleccionar={(tipo) => {
              setCotActiva({ cobertura: tipo });
              setTab("nueva");
            }}
          />
        </div>
      )}

      {/* Nueva cotización / tramitar guardada */}
      {tab === "nueva" && (
        <FormCotizacion
          cotizacionInicial={cotActiva}
          onGuardar={guardarCotizacion}
          onTramitar={tramitarPoliza}
          onCancelar={() => {
            setCotActiva(null);
            setTab("polizas");
          }}
        />
      )}

      {/* Tabs lista */}
      {(tab === "polizas" || tab === "cotizaciones") && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center border-b border-gray-100 px-2 overflow-x-auto">
            <Tab active={tab === "polizas"} onClick={() => setTab("polizas")}>
              Pólizas emitidas
            </Tab>
            <Tab
              active={tab === "cotizaciones"}
              onClick={() => setTab("cotizaciones")}
            >
              Cotizaciones guardadas
              {cotizaciones.length > 0 && (
                <span className="ml-1.5 bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {cotizaciones.length}
                </span>
              )}
            </Tab>
          </div>

          {/* Pólizas */}
          {tab === "polizas" && (
            <>
              <div className="flex flex-wrap items-center gap-2 px-5 py-4 border-b border-gray-100">
                <div className="relative">
                  <svg
                    className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                  <input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar póliza o asegurado..."
                    className="pl-9 pr-4 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] w-56 bg-white"
                  />
                </div>
                <select
                  value={filtroEstatus}
                  onChange={(e) => setFiltroEstatus(e.target.value)}
                  className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 text-gray-600 bg-white focus:outline-none"
                >
                  <option>Todos</option>
                  <option>Vigente</option>
                  <option>Por vencer</option>
                  <option>Vencida</option>
                  <option>Cancelada</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      {[
                        "Póliza",
                        "Asegurado",
                        "Cobertura",
                        "Vendedor",
                        "Prima",
                        "Forma pago",
                        "Vence",
                        "Estatus",
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {polizasFiltradas.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="text-center py-12 text-sm text-gray-400"
                        >
                          No se encontraron pólizas.
                        </td>
                      </tr>
                    ) : (
                      polizasFiltradas.map((p, i) => (
                        <tr
                          key={i}
                          className="hover:bg-gray-50/60 transition-colors"
                        >
                          <td className="px-4 py-3 font-mono text-xs font-bold text-[#13193a]">
                            {p.id}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-gray-700">
                            {p.asegurado}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                            {p.cobertura}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {p.vendedor}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-emerald-700">
                            ${p.prima.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {p.forma}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                            {p.vence}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge estatus={p.estatus} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button
                                title="Ver detalle"
                                className="w-7 h-7 rounded-lg text-gray-300 hover:text-[#13193a] hover:bg-gray-100 flex items-center justify-center transition-colors"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.641 0-8.573-3.007-9.963-7.178z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                              </button>
                              {p.estatus === "Por vencer" && (
                                <button
                                  title="Renovar"
                                  className="w-7 h-7 rounded-lg text-amber-400 hover:text-amber-600 hover:bg-amber-50 flex items-center justify-center transition-colors"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                                    />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Cotizaciones guardadas */}
          {tab === "cotizaciones" && (
            <>
              {cotizaciones.length === 0 ? (
                <div className="text-center py-12 text-sm text-gray-400">
                  No hay cotizaciones guardadas.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-100">
                        {[
                          "No. Cotización",
                          "Cliente",
                          "Cobertura",
                          "Vendedor",
                          "Total",
                          "Fecha",
                          "",
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {cotizaciones.map((c, i) => (
                        <tr
                          key={i}
                          className="hover:bg-gray-50/60 transition-colors"
                        >
                          <td className="px-5 py-3.5 font-mono text-xs font-bold text-[#13193a]">
                            {c.id}
                          </td>
                          <td className="px-5 py-3.5 text-xs font-semibold text-gray-700">
                            {c.cliente}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-gray-500 max-w-xs truncate">
                            {c.cobertura}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-gray-500">
                            {c.vendedor}
                          </td>
                          <td className="px-5 py-3.5 text-xs font-bold text-emerald-700">
                            ${c.total.toFixed(2)}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-gray-400">
                            {c.fecha}
                          </td>
                          <td className="px-5 py-3.5">
                            <button
                              onClick={() => abrirCotizacionGuardada(c)}
                              className="flex items-center gap-1.5 text-xs font-bold text-[#13193a] border border-[#13193a]/20 px-3 py-1.5 rounded-xl hover:bg-[#13193a]/5 transition-all whitespace-nowrap"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2.5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Tramitar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
