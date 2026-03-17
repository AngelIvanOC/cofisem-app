import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ── Mock de datos (reemplazar por query Supabase real) ────────
const POLIZAS_MOCK = [
  {
    numero:     "01250100001024-01",
    titular:    "SERGIO DOMINGUEZ GOMEZ Y/O LUCRECIA BENITEZ MENDOZA",
    prima:      "$2,674.00",
    estatus:    "Vigente",
    agencia:    "COFISEM AV. E.ZAPATA",
    emision:    "06/06/2025  11:42:25 hrs.",
    vigenciaDesde: "06/06/2025 12:00",
    vigenciaHasta: "06/06/2026 12:00",
    formaPago:  "Cont.4 Parcial.",
    vencimiento:"06/07/2025",
    saldo:      "$0.00",
    cobertura:  "TAXI BÁSICA PAGOS 2500",
    cuotas: [
      { num: 1, vto: "06/06/2025", monto: "$799.00",  estatus: "Pagado" },
      { num: 2, vto: "16/06/2025", monto: "$625.00",  estatus: "Pagado" },
      { num: 3, vto: "16/06/2025", monto: "$625.00",  estatus: "Pagado" },
      { num: 4, vto: "24/06/2025", monto: "$625.00",  estatus: "Pagado" },
    ],
    vehiculo: {
      descripcion: "NISSAN TSURU GSI SERV PUB STD",
      modelo:  "2009",
      placas:  "A757LTS",
      serie:   "3N1EB31S09K323748",
      motor:   "GA16847873W",
      capacidad: "4 PASAJEROS",
    },
    coberturas: [
      { desc: "RESP. CIVIL A TERCEROS BIENES Y PERSONAS",           monto: "$1,700,000.00",         deducible: "0.00", importe: "0 UMAS",  sub: false },
      { desc: "RESPONSABILIDAD CIVIL COMPLEMENT. PERSONAS",         monto: "$3,000,000.00",         deducible: "0.00", importe: "0 UMAS",  sub: false },
      { desc: "GASTOS MÉDICOS CONDUCTOR y FAMILIARES",              monto: "$50,000.00",             deducible: "0.00", importe: "0",       sub: false },
      { desc: "MUERTE DE CONDUCTOR P/AA",                           monto: "$50,000.00",             deducible: "0.00", importe: "0",       sub: false },
      { desc: "GASTOS LEGALES",                                     monto: "AMPARADOS",              deducible: "0.00", importe: "0",       sub: false },
      { desc: "RESPONSABILIDAD CIVIL VIAJERO",                      monto: "5,000 UMAS P/PASAJERO",  deducible: "0.00", importe: "0",       sub: false },
      { desc: "1. Muerte o 2. Incapacidad Total Y Permanente",      monto: "Sublímite 5,000 UMA",    deducible: "0.00", importe: "0",       sub: true  },
      { desc: "3. Gastos Médicos",                                  monto: "Sublímite 5,000 UMA",    deducible: "0.00", importe: "0",       sub: true  },
      { desc: "4. Gastos Funerarios",                               monto: "Sublímite 300 UMA",      deducible: "0.00", importe: "0",       sub: true  },
      { desc: "5. Equipaje",                                        monto: "Sublímite 80 UMA",       deducible: "0.00", importe: "0",       sub: true  },
    ],
    siniestros: [
      { reporte: "250423", folio: "250423", fecha: "28/06/2025", ajustador: "ALICIA HERNANDEZ VARGAS", estatus: "Asignado" },
    ],
  },
];

// Detectar qué tipo de búsqueda es
function detectarTipo(val) {
  const v = val.trim();
  if (!v) return null;
  if (/^\d{2,3}N\d|^[A-Z0-9]{17}$/i.test(v)) return "serie";
  if (/^[A-Z]{2,3}\d{3,4}[A-Z]?$/i.test(v) && v.length <= 8) return "placas";
  if (/^\d{6,9}$/.test(v)) return "reporte";
  if (v.includes("-") || /^\d{8,}/.test(v)) return "poliza";
  return "poliza";
}

const TIPO_LABEL = {
  poliza:  "Póliza",
  serie:   "No. Serie",
  placas:  "Placas",
  reporte: "Reporte #",
};

const TIPO_ICON = {
  poliza:  "🔑",
  serie:   "🔢",
  placas:  "🚗",
  reporte: "📋",
};

// Búsqueda en mock
function buscarPoliza(valor, tipo) {
  const v = valor.trim().toLowerCase();
  return POLIZAS_MOCK.find(p => {
    if (tipo === "serie")   return p.vehiculo.serie.toLowerCase().includes(v);
    if (tipo === "placas")  return p.vehiculo.placas.toLowerCase().includes(v);
    if (tipo === "reporte") return p.siniestros.some(s => s.reporte.includes(v));
    return p.numero.toLowerCase().includes(v);
  }) || null;
}

const tiposColision = ["Colisión", "Robo", "Cristales", "Daños a terceros", "Volcadura", "Incendio", "Otro"];
const ajustadores   = ["Félix Hernández", "Luis Martínez", "Ana García", "Roberto Díaz", "Alicia Hernández Vargas"];

const inp = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/20 focus:border-[#13193a] transition-all bg-white";
const lbl = "block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide";

// ── Badges ──────────────────────────────────────────────────
function Badge({ color, children }) {
  const colors = {
    green:  "bg-emerald-100 text-emerald-700 border-emerald-200",
    amber:  "bg-amber-100 text-amber-700 border-amber-200",
    blue:   "bg-blue-100 text-blue-700 border-blue-200",
    gray:   "bg-gray-100 text-gray-600 border-gray-200",
    red:    "bg-red-100 text-red-600 border-red-200",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
}

// ── Tarjeta de Póliza ────────────────────────────────────────
function PolizaCard({ poliza, onConfirmar, onLimpiar }) {

  return (
    <div className="bg-white rounded-2xl border-2 border-[#13193a]/20 shadow-lg overflow-hidden">
      {/* Header verde con los datos clave */}
      <div className="bg-[#13193a] px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Póliza encontrada</span>
              <Badge color="green">Vigente</Badge>
            </div>
            <p className="text-white text-lg font-bold font-mono">{poliza.numero}</p>
            <p className="text-white/70 text-sm mt-0.5">{poliza.titular}</p>
          </div>
          <div className="text-right">
            <p className="text-white/50 text-xs">Prima total</p>
            <p className="text-white text-xl font-bold">{poliza.prima}</p>
          </div>
        </div>
      </div>

      {/* Info principal en tarjetas */}
      <div className="p-5 space-y-4">
        {/* Estatus y vigencia */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Agencia",    value: poliza.agencia },
            { label: "Vigencia",   value: `${poliza.vigenciaDesde} → ${poliza.vigenciaHasta}` },
            { label: "Forma Pago", value: poliza.formaPago },
            { label: "Saldo",      value: poliza.saldo, highlight: true },
          ].map(f => (
            <div key={f.label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">{f.label}</p>
              <p className={`text-xs font-semibold ${f.highlight ? "text-emerald-600" : "text-gray-700"}`}>{f.value}</p>
            </div>
          ))}
        </div>

        {/* Cuotas */}
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Cuotas de Pago</p>
          <div className="grid grid-cols-4 gap-2">
            {poliza.cuotas.map(c => (
              <div key={c.num} className="bg-white rounded-xl border border-gray-100 p-2.5 text-center">
                <p className="text-[10px] text-gray-400 mb-1">Cuota {c.num}</p>
                <p className="text-sm font-bold text-[#13193a]">{c.monto}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Vto. {c.vto}</p>
                <Badge color="green">{c.estatus}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Vehículo */}
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Vehículo Asegurado</p>
          <p className="text-sm font-semibold text-[#13193a] mb-3">{poliza.vehiculo.descripcion}</p>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            {[
              { k: "Modelo",   v: poliza.vehiculo.modelo   },
              { k: "Placas",   v: poliza.vehiculo.placas   },
              { k: "Serie",    v: poliza.vehiculo.serie     },
              { k: "Motor",    v: poliza.vehiculo.motor     },
              { k: "Capac.",   v: poliza.vehiculo.capacidad },
            ].map(f => (
              <div key={f.k} className="bg-white rounded-xl border border-gray-100 p-2.5">
                <p className="text-gray-400 mb-0.5">{f.k}</p>
                <p className="font-semibold text-gray-700 truncate">{f.v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Coberturas — siempre visible */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Cobertura</p>
              <p className="text-sm font-bold text-[#13193a]">{poliza.cobertura}</p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#13193a]">
                  <th className="text-left px-4 py-2.5 font-semibold text-white rounded-tl-xl">Descripción</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-white">Monto Máx. Aseg.</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-white">% Deducible</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-white rounded-tr-xl">Importe Deducible</th>
                </tr>
              </thead>
              <tbody>
                {poliza.coberturas.map((c, i) => (
                  <tr key={i} className={`border-b border-gray-50 ${c.sub ? "bg-gray-50/60" : "hover:bg-gray-50"}`}>
                    <td className={`px-4 py-2.5 ${c.sub ? "pl-8 text-gray-500 italic" : "text-gray-700 font-medium"}`}>
                      {c.sub && <span className="text-gray-300 mr-2">└</span>}
                      {c.desc}
                    </td>
                    <td className={`px-4 py-2.5 text-right ${c.sub ? "text-gray-500" : "font-semibold text-[#13193a]"}`}>{c.monto}</td>
                    <td className="px-4 py-2.5 text-right text-gray-500">{c.deducible}</td>
                    <td className="px-4 py-2.5 text-right text-gray-500">{c.importe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Siniestros relacionados */}
        {poliza.siniestros.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-3">
              ⚠️ Siniestros relacionados a este certificado
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-amber-200">
                    {["#Reporte", "#Folio", "Fecha", "Ajustador", "Estatus"].map(h => (
                      <th key={h} className="text-left pb-2 text-amber-600 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {poliza.siniestros.map((s, i) => (
                    <tr key={i}>
                      <td className="py-1.5 font-mono text-amber-800">{s.reporte}</td>
                      <td className="py-1.5 font-mono text-amber-800">{s.folio}</td>
                      <td className="py-1.5 text-amber-700">{s.fecha}</td>
                      <td className="py-1.5 text-amber-700">{s.ajustador}</td>
                      <td className="py-1.5"><Badge color="amber">{s.estatus}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="px-5 pb-5 flex gap-3">
        <button onClick={onLimpiar}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all">
          Buscar otra póliza
        </button>
        <button onClick={onConfirmar}
          className="flex-2 px-8 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-semibold transition-all flex items-center gap-2">
          Continuar con esta póliza
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Estado inicial de un tercero/vehículo vacío ──────────────
const TERCERO_VACIO = () => ({
  id:           Date.now() + Math.random(),
  conductorNombre: "",
  conductorTelefono: "",
  vehiculoDesc:  "",
  vehiculoTipo:  "",
  vehiculoColor: "",
  vehiculoModelo:"",
  vehiculoPlacas:"",
  vehiculoSerie: "",
  vehiculoMotor: "",
});

// Tarjeta editable de un tercero/afectado
function TerceroCard({ tercero, index, onChange, onRemove, inpBase, lblBase }) {
  const set = (k, v) => onChange(tercero.id, k, v);

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header de la tarjeta */}
      <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#13193a] text-white flex items-center justify-center text-xs font-bold shrink-0">
            {index + 1}
          </div>
          <span className="text-sm font-semibold text-[#13193a]">
            Tercero / Afectado #{index + 1}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onRemove(tercero.id)}
          className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          Eliminar
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Datos del conductor */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
            </svg>
            Datos del Conductor
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={lblBase}>Nombre completo</label>
              <input
                value={tercero.conductorNombre}
                onChange={e => set("conductorNombre", e.target.value)}
                placeholder="Nombre del conductor"
                className={inpBase}
              />
            </div>
            <div>
              <label className={lblBase}>Teléfono</label>
              <input
                value={tercero.conductorTelefono}
                onChange={e => set("conductorTelefono", e.target.value)}
                placeholder="55 0000 0000"
                className={inpBase}
              />
            </div>
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-gray-100"/>

        {/* Datos del vehículo */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>
            </svg>
            Datos del Vehículo
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className={lblBase}>Descripción</label>
              <input
                value={tercero.vehiculoDesc}
                onChange={e => set("vehiculoDesc", e.target.value)}
                placeholder="Marca y modelo del vehículo"
                className={inpBase}
              />
            </div>
            <div>
              <label className={lblBase}>Tipo</label>
              <input
                value={tercero.vehiculoTipo}
                onChange={e => set("vehiculoTipo", e.target.value)}
                placeholder="Automóvil, camión, moto..."
                className={inpBase}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { k: "vehiculoColor",  placeholder: "Color"   },
              { k: "vehiculoModelo", placeholder: "Modelo"  },
              { k: "vehiculoPlacas", placeholder: "Placas"  },
              { k: "vehiculoSerie",  placeholder: "No. Serie" },
              { k: "vehiculoMotor",  placeholder: "Motor"   },
            ].map(f => (
              <div key={f.k}>
                <label className={lblBase}>{f.placeholder}</label>
                <input
                  value={tercero[f.k]}
                  onChange={e => set(f.k, e.target.value)}
                  placeholder={f.placeholder}
                  className={inpBase}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
const CAUSAS = [
  "Colisión con vehículo", "Colisión con objeto fijo", "Volcadura",
  "Robo total", "Robo parcial", "Incendio", "Daño por granizo",
  "Daño por inundación", "Atropellamiento", "Otro",
];
const CIRCUNSTANCIAS = [
  "En movimiento", "Estacionado", "Maniobra de reversa",
  "Cruce de intersección", "Cambio de carril", "Vía rápida",
  "Zona urbana", "Carretera", "Estacionamiento privado", "Otra",
];
const ENTIDADES = [
  "Aguascalientes","Baja California","Baja California Sur","Campeche",
  "Chiapas","Chihuahua","Ciudad de México","Coahuila","Colima","Durango",
  "Estado de México","Guanajuato","Guerrero","Hidalgo","Jalisco",
  "Michoacán","Morelos","Nayarit","Nuevo León","Oaxaca","Puebla",
  "Querétaro","Quintana Roo","San Luis Potosí","Sinaloa","Sonora",
  "Tabasco","Tamaulipas","Tlaxcala","Veracruz","Yucatán","Zacatecas",
];

// Número de reporte: 6 dígitos auto-generado
const generarReporte = () => String(Math.floor(200000 + Math.random() * 99999));

// Sección visual con línea de título
function Seccion({ titulo, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-[#13193a] px-5 py-3">
        <h3 className="text-sm font-bold text-white tracking-wide">{titulo}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// Fila de datos del vehículo (read-only)
function VehiculoInfo({ vehiculo }) {
  const campos = [
    { k: "Modelo",    v: vehiculo.modelo    },
    { k: "Placas",    v: vehiculo.placas    },
    { k: "Serie",     v: vehiculo.serie     },
    { k: "Motor",     v: vehiculo.motor     },
    { k: "Capacidad", v: vehiculo.capacidad },
  ];
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[#13193a]">{vehiculo.descripcion}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {campos.map(c => (
          <div key={c.k} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{c.k}</p>
            <p className="text-xs font-semibold text-[#13193a] truncate">{c.v || "—"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Paso 2: Formulario del siniestro ─────────────────────────
function FormSiniestro({ poliza, onBack, onSubmit, loading }) {
  const nroReporte = generarReporte();
  const fechaHoy   = new Date().toLocaleDateString("es-MX", { day:"2-digit", month:"2-digit", year:"numeric" });
  const horaActual = new Date().toLocaleTimeString("es-MX", { hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:true });

  const [form, setForm] = useState({
    causa:          "",
    circunstancia:  "",
    detalles:       "",
    entidad:        "",
    conductorNA:    "",
    telefono:       "",
    ajustador:      "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Lista dinámica de terceros/afectados
  const [terceros, setTerceros] = useState([TERCERO_VACIO()]);

  const agregarTercero = () => setTerceros(t => [...t, TERCERO_VACIO()]);

  const eliminarTercero = (id) => {
    if (terceros.length === 1) return; // siempre al menos 1
    setTerceros(t => t.filter(x => x.id !== id));
  };

  const actualizarTercero = (id, campo, valor) => {
    setTerceros(t => t.map(x => x.id === id ? { ...x, [campo]: valor } : x));
  };

  const inpBase = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#13193a]/20 focus:border-[#13193a] transition-all bg-white";
  const inpReadOnly = "w-full border border-gray-100 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#13193a] bg-gray-50 cursor-default select-none";
  const lblBase = "block text-sm font-semibold text-gray-600 mb-1.5";

  return (
    <div className="space-y-4 pb-8">

      {/* ── Banner: póliza confirmada ── */}
      <div className="bg-[#13193a] rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-400/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <div>
            <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wide">Póliza confirmada</p>
            <p className="text-white font-bold font-mono">{poliza.numero}</p>
            <p className="text-white/60 text-xs">{poliza.titular}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Nro. Reporte auto-generado */}
          <div className="text-right">
            <p className="text-white/40 text-xs">Nro. Reporte</p>
            <p className="text-white font-bold font-mono text-lg">{nroReporte}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-white/40 text-xs">Fecha y Hora</p>
            <p className="text-white/80 text-xs font-medium">{fechaHoy}</p>
            <p className="text-white/80 text-xs font-medium">{horaActual}</p>
          </div>
          <button onClick={onBack}
            className="text-white/40 hover:text-white text-xs underline underline-offset-2 transition-colors shrink-0">
            Cambiar póliza
          </button>
        </div>
      </div>

      {/* ── Titular y certificado ── */}
      <Seccion titulo="Titular — Certificado">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={lblBase}>Certificado</label>
            <input readOnly value={poliza.numero} className={inpReadOnly}/>
          </div>
          <div>
            <label className={lblBase}>Titular</label>
            <input readOnly value={poliza.titular} className={inpReadOnly}/>
          </div>
        </div>
      </Seccion>

      {/* ── Vehículo asegurado (read-only, viene de póliza) ── */}
      <Seccion titulo="Datos del Vehículo Asegurado">
        <VehiculoInfo vehiculo={poliza.vehiculo} />
      </Seccion>

      {/* ── Terceros / Afectados ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header de sección */}
        <div className="bg-[#13193a] px-5 py-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Vehículos y Conductores Afectados / Terceros
            </h3>
            <p className="text-white/50 text-xs mt-0.5">
              {terceros.length} {terceros.length === 1 ? "persona registrada" : "personas registradas"}
            </p>
          </div>
          <button
            type="button"
            onClick={agregarTercero}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all border border-white/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
            </svg>
            Agregar afectado
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Si solo hay 1 y está vacío, mostrar hint */}
          {terceros.length === 1 &&
            !terceros[0].conductorNombre &&
            !terceros[0].vehiculoPlacas && (
            <p className="text-xs text-gray-400 -mt-1 mb-2">
              Llena los datos del tercero o afectado. Si no hay ninguno, deja los campos en blanco.
            </p>
          )}

          {terceros.map((t, i) => (
            <TerceroCard
              key={t.id}
              tercero={t}
              index={i}
              onChange={actualizarTercero}
              onRemove={eliminarTercero}
              inpBase={inpBase}
              lblBase={lblBase}
            />
          ))}

          {/* Botón inferior de agregar (visible cuando hay 2+) */}
          {terceros.length >= 2 && (
            <button
              type="button"
              onClick={agregarTercero}
              className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-400 hover:border-[#13193a]/30 hover:text-[#13193a] hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
              </svg>
              Agregar otro afectado
            </button>
          )}
        </div>
      </div>

      {/* ── Información del siniestro ── */}
      <Seccion titulo="Información del Siniestro">
        <div className="space-y-4">
          {/* Causa y circunstancia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={lblBase}>Causa</label>
              <select value={form.causa} onChange={e => set("causa", e.target.value)} className={inpBase}>
                <option value="">Selecciona una Causa</option>
                {CAUSAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={lblBase}>Circunstancia</label>
              <select value={form.circunstancia} onChange={e => set("circunstancia", e.target.value)} className={inpBase}>
                <option value="">Selecciona una Circunstancia</option>
                {CIRCUNSTANCIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Detalles */}
          <div>
            <label className={lblBase}>Detalles del siniestro</label>
            <textarea value={form.detalles} onChange={e => set("detalles", e.target.value)}
              rows={3} placeholder="Describe lo que ocurrió con el mayor detalle posible..."
              className={inpBase + " resize-none"}/>
          </div>
        </div>
      </Seccion>

      {/* ── Localización ── */}
      <Seccion titulo="Localización del Siniestro">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={lblBase}>Entidad (Estado)</label>
            <select value={form.entidad} onChange={e => set("entidad", e.target.value)} className={inpBase}>
              <option value="">Selecciona una Entidad</option>
              {ENTIDADES.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className={lblBase}>Conductor del asegurado (NA)</label>
            <input value={form.conductorNA} onChange={e => set("conductorNA", e.target.value)}
              placeholder="Nombre del conductor asegurado" className={inpBase}/>
          </div>
          <div>
            <label className={lblBase}>Teléfono de contacto</label>
            <input value={form.telefono} onChange={e => set("telefono", e.target.value)}
              placeholder="55 0000 0000" className={inpBase}/>
          </div>
        </div>
      </Seccion>

      {/* ── Ajustador ── */}
      <Seccion titulo="Ajustador Asignado">
        <div className="max-w-sm">
          <label className={lblBase}>Selecciona el ajustador</label>
          <select value={form.ajustador} onChange={e => set("ajustador", e.target.value)} className={inpBase}>
            <option value="">Selecciona un Ajustador</option>
            {ajustadores.map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
      </Seccion>

      {/* ── Botones de acción ── */}
      <div className="flex flex-wrap justify-between gap-3 pt-2">
        <button type="button" onClick={onBack}
          className="px-6 py-3 rounded-xl border border-gray-300 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Regresar
        </button>

        <button type="button" onClick={() => onSubmit({ ...form, nroReporte, terceros })} disabled={loading}
          className="px-8 py-3 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all disabled:opacity-60 flex items-center gap-2 shadow-lg shadow-[#13193a]/20">
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Generando reporte...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Generar Reporte
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Página Principal ──────────────────────────────────────────
export default function SiniestroNuevo() {
  const navigate  = useNavigate();
  const inputRef  = useRef(null);

  // Pasos: "buscar" | "confirmar" | "formulario"
  const [paso,       setPaso]       = useState("buscar");
  const [query,      setQuery]      = useState("");
  const [tipoDetect, setTipoDetect] = useState(null);
  const [buscando,   setBuscando]   = useState(false);
  const [poliza,     setPoliza]     = useState(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [loading,    setLoading]    = useState(false);

  // Detectar tipo al escribir
  const handleQueryChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    setNoEncontrado(false);
    setTipoDetect(v.trim() ? detectarTipo(v) : null);
  };

  // Buscar póliza
  const handleBuscar = async () => {
    if (!query.trim()) return;
    setBuscando(true);
    setNoEncontrado(false);
    await new Promise(r => setTimeout(r, 600)); // simula latencia
    const tipo = detectarTipo(query);
    const result = buscarPoliza(query, tipo);
    setBuscando(false);
    if (result) {
      setPoliza(result);
      setPaso("confirmar");
    } else {
      setNoEncontrado(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleBuscar();
  };

  const handleSubmit = async (form) => {
    setLoading(true);
    // TODO: supabase.from("siniestros").insert({ poliza_id: poliza.id, ...form })
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    navigate("/siniestros");
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="p-6 min-h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-[#13193a] transition-all shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Reportar Siniestro</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {paso === "buscar"     && "Paso 1 de 2 — Busca la póliza del asegurado"}
            {paso === "confirmar"  && "Paso 1 de 2 — Confirma los datos de la póliza"}
            {paso === "formulario" && "Paso 2 de 2 — Completa los datos del siniestro"}
          </p>
        </div>

        {/* Steps visual */}
        <div className="ml-auto hidden sm:flex items-center gap-2">
          {[
            { n: 1, label: "Buscar póliza",  active: paso !== "formulario" },
            { n: 2, label: "Datos siniestro", active: paso === "formulario" },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              {i > 0 && <div className={`w-8 h-0.5 ${s.active ? "bg-[#13193a]" : "bg-gray-200"}`}/>}
              <div className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  s.active ? "bg-[#13193a] text-white" : "bg-gray-100 text-gray-400"}`}>
                  {s.n}
                </div>
                <span className={`text-xs font-medium ${s.active ? "text-[#13193a]" : "text-gray-400"}`}>{s.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PASO 1: Buscador ── */}
      {(paso === "buscar" || paso === "confirmar") && (
        <div className="space-y-5">
          {/* Barra de búsqueda */}
          {paso === "buscar" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <p className="text-sm font-bold text-[#13193a] mb-1">Buscar póliza</p>
              <p className="text-xs text-gray-400 mb-5">
                Ingresa cualquiera de estos datos: <span className="font-semibold text-gray-600">Número de póliza</span>, <span className="font-semibold text-gray-600">No. de serie</span>, <span className="font-semibold text-gray-600">Placas</span> o <span className="font-semibold text-gray-600">Reporte #</span> — el sistema detecta automáticamente qué tipo es.
              </p>

              <div className="relative flex gap-3">
                {/* Tipo detectado */}
                {tipoDetect && (
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                    <span className="text-base">{TIPO_ICON[tipoDetect]}</span>
                    <span className="text-xs font-semibold text-[#13193a] bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                      {TIPO_LABEL[tipoDetect]}
                    </span>
                  </div>
                )}

                <input
                  ref={inputRef}
                  value={query}
                  onChange={handleQueryChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ej: 01250100001024-01 · A757LTS · 3N1EB31S09K323748 · 250423"
                  className={`flex-1 border-2 rounded-xl text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-0 focus:border-[#13193a] transition-all bg-white h-12 ${
                    tipoDetect ? "pl-28 pr-4" : "px-4"
                  } ${noEncontrado ? "border-red-300" : "border-gray-200"}`}
                />

                <button
                  onClick={handleBuscar}
                  disabled={buscando || !query.trim()}
                  className="px-6 h-12 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2 shrink-0"
                >
                  {buscando ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Buscando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
                      </svg>
                      Buscar
                    </>
                  )}
                </button>
              </div>

              {/* No encontrado */}
              {noEncontrado && (
                <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374l7.048-12.14c.866-1.5 3.032-1.5 3.898 0l7.048 12.14zM12 15.75h.007v.008H12v-.008z"/>
                  </svg>
                  No se encontró ninguna póliza con ese dato. Verifica e intenta de nuevo.
                </div>
              )}

              {/* Hints de búsqueda */}
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { label: "🔑 Póliza",   ejemplo: "01250100001024-01" },
                  { label: "🚗 Placas",   ejemplo: "A757LTS" },
                  { label: "🔢 No. Serie",ejemplo: "3N1EB31S09K323748" },
                  { label: "📋 Reporte #",ejemplo: "250423" },
                ].map(h => (
                  <button key={h.label} onClick={() => { setQuery(h.ejemplo); setTipoDetect(detectarTipo(h.ejemplo)); }}
                    className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-[#13193a]/40 hover:text-[#13193a] transition-all">
                    {h.label} — <span className="font-mono">{h.ejemplo}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Resultado: tarjeta de póliza */}
          {paso === "confirmar" && poliza && (
            <PolizaCard
              poliza={poliza}
              onConfirmar={() => setPaso("formulario")}
              onLimpiar={() => { setPoliza(null); setQuery(""); setTipoDetect(null); setPaso("buscar"); }}
            />
          )}
        </div>
      )}

      {/* ── PASO 2: Formulario siniestro ── */}
      {paso === "formulario" && poliza && (
        <FormSiniestro
          poliza={poliza}
          onBack={() => setPaso("confirmar")}
          onSubmit={handleSubmit}
          loading={loading}
        />
      )}
    </div>
  );
}