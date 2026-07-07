// ============================================================
// src/features/supervisor/SupervisorSiniestros.jsx
// ============================================================
import { useState } from "react";

const AJUSTADORES = [
  { id:"AJ-01", nombre:"Félix Hernández",  activos:2, max:4 },
  { id:"AJ-02", nombre:"Luis Martínez",    activos:3, max:4 },
  { id:"AJ-03", nombre:"Ana García",       activos:1, max:4 },
  { id:"AJ-04", nombre:"Roberto Vega",     activos:0, max:4 },
  { id:"AJ-05", nombre:"Sofía Torres",     activos:4, max:4 },
];

const TIPOS_CANALIZ   = ["Asistencia jurídica","Abogado externo","Mediación","Demanda formal"];
const TIPOS_SINIESTRO = ["Colisión","Robo total","Robo parcial","Cristales","Daño a terceros","Volcadura","Incendio","Fenómeno natural"];

const STATUS_CLS = {
  "Sin asignar":         "bg-red-50    text-red-600    border-red-200",
  "Asignado":            "bg-blue-50   text-blue-700   border-blue-200",
  "Pendiente de arribo": "bg-amber-50  text-amber-700  border-amber-200",
  "En proceso":          "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Jurídico":            "bg-purple-50 text-purple-700 border-purple-200",
  "Completado":          "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Cancelado":           "bg-gray-100  text-gray-500   border-gray-200",
};

// ── Categorías de costos ──────────────────────────────────────
// dot: único elemento con color de categoría (8 px, solo para distinguir visualmente)
export const CATEGORIAS_CONFIG = [
  { id:"taller",    nombre:"Taller / Reparación",  dot:"bg-blue-500",
    chips:["Carrocería","Mecánica","Pintura","Cristales","Llantas","Refacciones","Hojalatería"] },
  { id:"grua",      nombre:"Grúa / Traslado",       dot:"bg-amber-500",
    chips:["Servicio de grúa","Traslado a taller","Almacenaje corralón","Pensión"] },
  { id:"medico",    nombre:"Médico / Hospital",      dot:"bg-rose-500",
    chips:["Urgencias","Hospitalización","Cirugía","Medicamentos","Ambulancia","Rehabilitación","Estudios"] },
  { id:"finiquito", nombre:"Finiquito directo",      dot:"bg-emerald-500",
    chips:["Pago al asegurado","Pago al afectado","Indemnización pérdida total","Depreciación"] },
  { id:"legal",     nombre:"Legal / Jurídico",       dot:"bg-purple-500",
    chips:["Honorarios abogado","Fianza vehicular","Fianza penal","Pago a oficial de tránsito","Multa","Notaría","Peritaje legal","Gastos MP"] },
  { id:"admin",     nombre:"Administrativo",         dot:"bg-slate-400",
    chips:["Peritaje","Valuación","Gastos de trámite","Investigación","Comisión"] },
];

// ── Datos mock ────────────────────────────────────────────────
const SINIESTROS_MOCK = [
  {
    folio:"SN-10234", fecha:"17/03/2026", hora:"08:15",
    asegurado:"Carlos Gómez", telefono:"777 100 2233",
    vehiculo:"Toyota Corolla 2022", placas:"VRM-123A", color:"Blanco",
    poliza:"3413241", cobertura:"TAXI BÁSICA 2500",
    tipo:"Colisión", ubicacion:"Av. Emiliano Zapata 145, Jiutepec, Mor.",
    coords:{ lat:18.8841, lng:-99.1948 },
    ajustador:{ id:"AJ-01", nombre:"Félix Hernández" },
    estatus:"En proceso", juridico:false, tipoJuridico:null, abogado:null,
    descripcion:"Colisión frontal con taxi. Asegurado sin lesiones. Vehículo tercero: Nissan Tsuru.",
    danos:"Defensa delantera, cofre, faros delanteros, radiador.",
    terceros:[{ nombre:"Pedro Ramírez", vehiculo:"Nissan Tsuru 2008", placas:"CHM-456B", lesiones:false }],
    timeline:[
      { evento:"Reporte recibido",         fecha:"17/03/2026 08:15", actor:"Cabinero: María R." },
      { evento:"Ajustador asignado",        fecha:"17/03/2026 08:22", actor:"Sistema" },
      { evento:"Ajustador en camino",       fecha:"17/03/2026 08:30", actor:"Félix Hernández" },
      { evento:"Arribo confirmado",         fecha:"17/03/2026 09:01", actor:"Félix Hernández" },
      { evento:"Captura de datos iniciada", fecha:"17/03/2026 09:10", actor:"Félix Hernández" },
    ],
    documentos:["Póliza","Fotos daños","Licencias","No. serie"],
    costos:[
      { categoriaId:"taller", items:[
        { id:1, descripcion:"Carrocería delantera",    fecha:"18/03/2026", monto:8500,  estatus:"pendiente", notas:"Taller El Norte" },
        { id:2, descripcion:"Pintura cofre y defensa", fecha:"18/03/2026", monto:3200,  estatus:"pendiente", notas:"" },
      ]},
      { categoriaId:"grua", items:[
        { id:3, descripcion:"Servicio de grúa",        fecha:"17/03/2026", monto:1500,  estatus:"pagado",    notas:"Grúas Morelos" },
      ]},
    ],
  },
  {
    folio:"SN-10231", fecha:"17/03/2026", hora:"09:40",
    asegurado:"Ana Martínez", telefono:"777 234 5566",
    vehiculo:"Honda Civic 2020", placas:"STU-321D", color:"Gris",
    poliza:"3410888", cobertura:"TAXI BÁSICA PAGOS 2700",
    tipo:"Daño a terceros", ubicacion:"Blvd. Cuauhnáhuac 890, Cuernavaca, Mor.",
    coords:{ lat:18.9242, lng:-99.2216 },
    ajustador:null, estatus:"Sin asignar", juridico:false, tipoJuridico:null, abogado:null,
    descripcion:"Impacto por alcance. Tercero exige pago inmediato de daños.",
    danos:"Parachoque trasero, cajuela abollada.",
    terceros:[{ nombre:"Rosa Jiménez", vehiculo:"VW Vento 2019", placas:"PQR-789C", lesiones:false }],
    timeline:[{ evento:"Reporte recibido", fecha:"17/03/2026 09:40", actor:"Cabinero: Carlos P." }],
    documentos:[], costos:[],
  },
  {
    folio:"SN-10227", fecha:"17/03/2026", hora:"07:30",
    asegurado:"Roberto Díaz", telefono:"777 345 6677",
    vehiculo:"Nissan Tsuru 2018", placas:"CHM-456B", color:"Rojo",
    poliza:"3413167", cobertura:"SERV. PÚB. 50/50 GAMAN 2",
    tipo:"Robo total", ubicacion:"Col. Las Palmas, Cuernavaca, Mor.",
    coords:null, ajustador:{ id:"AJ-01", nombre:"Félix Hernández" },
    estatus:"Jurídico", juridico:true, tipoJuridico:"Abogado externo", abogado:"Lic. Jorge Méndez",
    descripcion:"Robo total del vehículo la noche anterior. Se levantó acta ante el MP.",
    danos:"Robo total — vehículo no recuperado.", terceros:[],
    timeline:[
      { evento:"Reporte recibido",        fecha:"17/03/2026 07:30", actor:"Cabinero: María R." },
      { evento:"Ajustador asignado",       fecha:"17/03/2026 07:45", actor:"Sistema" },
      { evento:"Arribo confirmado",        fecha:"17/03/2026 08:30", actor:"Félix Hernández" },
      { evento:"Caso derivado a jurídico", fecha:"17/03/2026 11:00", actor:"Supervisor: Héctor D." },
      { evento:"Abogado asignado",         fecha:"17/03/2026 11:30", actor:"Lic. Jorge Méndez" },
    ],
    documentos:["Póliza","Acta MP","Fotos zona","No. serie"], costos:[],
  },
  {
    folio:"SN-10220", fecha:"17/03/2026", hora:"10:15",
    asegurado:"Laura González", telefono:"777 456 7788",
    vehiculo:"KIA Sportage 2021", placas:"YZA-987F", color:"Negro",
    poliza:"3411002", cobertura:"TAXI BÁSICA 2500",
    tipo:"Volcadura", ubicacion:"Carr. Cuernavaca-Cuautla km 12, Mor.",
    coords:{ lat:18.8910, lng:-99.1620 },
    ajustador:null, estatus:"Sin asignar", juridico:false, tipoJuridico:null, abogado:null,
    descripcion:"Volcadura al esquivar bache. Asegurado con lesiones leves.",
    danos:"Costado izquierdo, techo, vidrio lateral izquierdo, llanta.", terceros:[],
    timeline:[{ evento:"Reporte recibido", fecha:"17/03/2026 10:15", actor:"Cabinero: Carlos P." }],
    documentos:[], costos:[],
  },
  {
    folio:"SN-10215", fecha:"16/03/2026", hora:"14:20",
    asegurado:"Miguel Ortega", telefono:"777 567 8899",
    vehiculo:"VW Jetta 2019", placas:"BCD-111G", color:"Azul",
    poliza:"3414001", cobertura:"SERV. PÚB. 50/50 GAMAN 2",
    tipo:"Colisión", ubicacion:"Av. Plan de Ayala 222, Cuernavaca, Mor.",
    coords:{ lat:18.9350, lng:-99.2100 },
    ajustador:{ id:"AJ-02", nombre:"Luis Martínez" },
    estatus:"Completado", juridico:false, tipoJuridico:null, abogado:null,
    descripcion:"Colisión lateral derecha en crucero. Sin lesionados. Caso cerrado.",
    danos:"Puerta delantera derecha, espejo lateral, salpicadera.",
    terceros:[{ nombre:"Juan Cruz", vehiculo:"Chevrolet Aveo 2016", placas:"EFG-222H", lesiones:false }],
    timeline:[
      { evento:"Reporte recibido",   fecha:"16/03/2026 14:20", actor:"Cabinero: María R." },
      { evento:"Ajustador asignado",  fecha:"16/03/2026 14:30", actor:"Sistema" },
      { evento:"Arribo confirmado",   fecha:"16/03/2026 15:05", actor:"Luis Martínez" },
      { evento:"Captura completada",  fecha:"16/03/2026 15:50", actor:"Luis Martínez" },
      { evento:"Documentos enviados", fecha:"16/03/2026 16:10", actor:"Luis Martínez" },
      { evento:"Caso cerrado",        fecha:"16/03/2026 16:30", actor:"Supervisor: Héctor D." },
    ],
    documentos:["Póliza","Fotos daños","Licencias","No. serie","Orden de reparación"],
    costos:[
      { categoriaId:"taller", items:[
        { id:10, descripcion:"Puerta delantera derecha",     fecha:"17/03/2026", monto:4800, estatus:"pagado", notas:"Taller Central" },
        { id:11, descripcion:"Pintura y ajuste salpicadera", fecha:"17/03/2026", monto:2100, estatus:"pagado", notas:"" },
      ]},
      { categoriaId:"finiquito", items:[
        { id:12, descripcion:"Pago al afectado (Juan Cruz)", fecha:"16/03/2026", monto:8200, estatus:"pagado", notas:"Transferencia SPEI" },
      ]},
      { categoriaId:"admin", items:[
        { id:13, descripcion:"Peritaje vehicular", fecha:"16/03/2026", monto:1200, estatus:"pagado", notas:"Perito: Ing. Salazar" },
      ]},
    ],
  },
  {
    folio:"SN-10208", fecha:"16/03/2026", hora:"11:00",
    asegurado:"Luis Torres", telefono:"777 678 9900",
    vehiculo:"VW Vento 2020", placas:"EFG-222H", color:"Plata",
    poliza:"3413198", cobertura:"TAXI BÁSICA 2500",
    tipo:"Colisión", ubicacion:"Blvd. Cuauhnáhuac 890, Temixco, Mor.",
    coords:{ lat:18.8533, lng:-99.2244 },
    ajustador:{ id:"AJ-03", nombre:"Ana García" },
    estatus:"Jurídico", juridico:true, tipoJuridico:"Asistencia jurídica", abogado:null,
    descripcion:"Tercero afectado amenaza con demanda. Colisión con dos vehículos.",
    danos:"Defensa delantera, cofre, ambas aletas delanteras.",
    terceros:[
      { nombre:"Carlos Peña", vehiculo:"Nissan Versa 2021", placas:"STU-321D", lesiones:true  },
      { nombre:"Rosa García", vehiculo:"Toyota Yaris 2018", placas:"VWX-654E", lesiones:false },
    ],
    timeline:[
      { evento:"Reporte recibido",        fecha:"16/03/2026 11:00", actor:"Cabinero: María R." },
      { evento:"Ajustador asignado",       fecha:"16/03/2026 11:10", actor:"Sistema" },
      { evento:"Arribo confirmado",        fecha:"16/03/2026 11:45", actor:"Ana García" },
      { evento:"Asistencia jurídica act.", fecha:"16/03/2026 14:00", actor:"Supervisor: Héctor D." },
    ],
    documentos:["Póliza","Fotos daños","Licencias","Pase médico"],
    costos:[
      { categoriaId:"medico", items:[
        { id:20, descripcion:"Urgencias Carlos Peña",  fecha:"16/03/2026", monto:3500,  estatus:"pagado",    notas:"Hospital IMSS" },
        { id:21, descripcion:"Estudios radiológicos",  fecha:"17/03/2026", monto:1800,  estatus:"pendiente", notas:"" },
      ]},
      { categoriaId:"legal", items:[
        { id:22, descripcion:"Honorarios abogado",     fecha:"16/03/2026", monto:12000, estatus:"pendiente", notas:"Lic. Jorge Méndez" },
        { id:23, descripcion:"Fianza vehicular",       fecha:"16/03/2026", monto:5000,  estatus:"pagado",    notas:"Corralón municipal" },
      ]},
      { categoriaId:"grua", items:[
        { id:24, descripcion:"Remolque a corralón",    fecha:"16/03/2026", monto:1200,  estatus:"pagado",    notas:"" },
      ]},
    ],
  },
];

// ── Helper totales ────────────────────────────────────────────
function calcTotalesCostos(costos = []) {
  const items     = costos.flatMap(c => c.items);
  const pagado    = items.filter(i => i.estatus === "pagado").reduce((s, i) => s + i.monto, 0);
  const pendiente = items.filter(i => i.estatus === "pendiente").reduce((s, i) => s + i.monto, 0);
  return { pagado, pendiente, total: pagado + pendiente };
}

// ── Chip de estatus ───────────────────────────────────────────
function EstatusItem({ estatus }) {
  const cls = estatus === "pagado"
    ? "text-emerald-700 border-emerald-200"
    : estatus === "pendiente"
    ? "text-amber-700 border-amber-200"
    : "text-gray-400 border-gray-200";
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
      {estatus}
    </span>
  );
}

// ── Tab Costos ────────────────────────────────────────────────
function TabCostos({ costos, onCostosChange }) {
  const [expandidos, setExpandidos] = useState(() => {
    const init = {};
    costos.forEach(c => { init[c.categoriaId] = true; });
    return init;
  });
  const [formulario, setFormulario]         = useState(null);
  const [itemForm, setItemForm]             = useState({ descripcion:"", fecha:"", monto:"", estatus:"pendiente", notas:"" });
  const [pickerAbierto, setPickerAbierto]   = useState(false);
  const [catCustomPanel, setCatCustomPanel] = useState(false);
  const [nomCatCustom, setNomCatCustom]     = useState("");

  const toggle   = (catId) => setExpandidos(p => ({ ...p, [catId]: !p[catId] }));
  const getItems = (catId) => costos.find(c => c.categoriaId === catId)?.items ?? [];
  const subtotal = (catId) => getItems(catId).filter(i => i.estatus !== "cancelado").reduce((s, i) => s + i.monto, 0);
  const { pagado, pendiente, total } = calcTotalesCostos(costos);

  const abrirForm = (catId) => {
    setFormulario({ catId });
    setItemForm({ descripcion:"", fecha:"", monto:"", estatus:"pendiente", notas:"" });
  };

  // Categorías que el supervisor ya activó (tienen items o están siendo editadas ahora)
  const activeCatIds = costos.map(c => c.categoriaId);
  const visibleCatIds = formulario && !activeCatIds.includes(formulario.catId)
    ? [...activeCatIds, formulario.catId]
    : activeCatIds;

  const catsCustom = costos
    .filter(c => !CATEGORIAS_CONFIG.find(p => p.id === c.categoriaId))
    .map(c => ({ id: c.categoriaId, nombre: c._nombre ?? c.categoriaId.replace("custom_",""), dot:"bg-gray-400", chips:[] }));

  const catsActivas = [
    ...CATEGORIAS_CONFIG.filter(cat => visibleCatIds.includes(cat.id)),
    ...catsCustom,
  ];

  // Categorías aún disponibles para activar
  const catsDisponibles = CATEGORIAS_CONFIG.filter(cat => !activeCatIds.includes(cat.id));

  const activarCategoria = (catId) => {
    setPickerAbierto(false);
    setCatCustomPanel(false);
    abrirForm(catId);
    setExpandidos(p => ({ ...p, [catId]: true }));
  };

  const cancelarForm = () => {
    setFormulario(null);
    // Si la categoría no tenía items (solo se abrió desde el picker), desaparece sola
  };

  const guardar = () => {
    if (!formulario) return;
    const item  = { id:Date.now(), ...itemForm, monto: parseFloat(itemForm.monto) || 0 };
    const existe = costos.find(c => c.categoriaId === formulario.catId);
    const nuevo  = existe
      ? costos.map(c => c.categoriaId === formulario.catId ? { ...c, items:[...c.items, item] } : c)
      : [...costos, { categoriaId: formulario.catId, items:[item] }];
    onCostosChange(nuevo);
    setFormulario(null);
    setExpandidos(p => ({ ...p, [formulario.catId]: true }));
  };

  const eliminar = (catId, itemId) => {
    onCostosChange(
      costos.map(c => c.categoriaId === catId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c)
            .filter(c => c.items.length > 0)
    );
  };

  const ciclarEstatus = (catId, itemId) => {
    const ciclo = { pendiente:"pagado", pagado:"cancelado", cancelado:"pendiente" };
    onCostosChange(costos.map(c => c.categoriaId === catId
      ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, estatus: ciclo[i.estatus] } : i) }
      : c
    ));
  };

  const agregarCatCustom = () => {
    if (!nomCatCustom.trim()) return;
    const id = "custom_" + Date.now();
    setCatCustomPanel(false);
    setPickerAbierto(false);
    setNomCatCustom("");
    abrirForm(id);
    setExpandidos(p => ({ ...p, [id]: true }));
    onCostosChange([...costos, { categoriaId: id, _nombre: nomCatCustom.trim(), items:[] }]);
  };

  const puedeGuardar = itemForm.descripcion.trim() && itemForm.monto;

  return (
    <div className="space-y-4">

      {/* Barra de totales */}
      {total > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Pagado</p>
            <p className="text-base font-bold text-emerald-600 tabular-nums mt-0.5">${pagado.toLocaleString("es-MX")}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Pendiente</p>
            <p className="text-base font-bold text-amber-600 tabular-nums mt-0.5">${pendiente.toLocaleString("es-MX")}</p>
          </div>
          <div className="bg-white border border-[#13193a]/20 rounded-xl p-3 text-center">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Gran total</p>
            <p className="text-base font-bold text-[#13193a] tabular-nums mt-0.5">${total.toLocaleString("es-MX")}</p>
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {catsActivas.length === 0 && !pickerAbierto && !catCustomPanel && (
        <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl">
          <svg className="w-8 h-8 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p className="text-sm font-semibold text-gray-400">Sin costos registrados</p>
          <p className="text-xs text-gray-300 mt-1">Agrega una categoría para comenzar el registro</p>
        </div>
      )}

      {/* Cajitas de categorías activas únicamente */}
      {catsActivas.map(cat => {
        const items     = getItems(cat.id);
        const sub       = subtotal(cat.id);
        const abierto   = expandidos[cat.id] ?? true;
        const agregando = formulario?.catId === cat.id;

        return (
          <div key={cat.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">

            <button onClick={() => toggle(cat.id)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/60 transition-colors text-left">
              <span className={`w-2 h-2 rounded-full shrink-0 ${cat.dot}`}/>
              <span className="flex-1 text-sm font-semibold text-[#13193a]">{cat.nombre}</span>
              {items.length > 0 && (
                <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                  {items.length}
                </span>
              )}
              {sub > 0 && (
                <span className="text-sm font-bold text-[#13193a] tabular-nums">${sub.toLocaleString("es-MX")}</span>
              )}
              <svg className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${abierto?"rotate-180":""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            {abierto && (
              <div className="border-t border-gray-100">

                {items.length > 0 && (
                  <div className="divide-y divide-gray-50">
                    {items.map(item => (
                      <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-700">{item.descripcion}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {item.fecha}{item.notas ? ` · ${item.notas}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => ciclarEstatus(cat.id, item.id)} title="Click para cambiar estatus">
                            <EstatusItem estatus={item.estatus} />
                          </button>
                          <span className="text-sm font-bold text-gray-700 tabular-nums">
                            ${item.monto.toLocaleString("es-MX")}
                          </span>
                          <button onClick={() => eliminar(cat.id, item.id)}
                            className="text-gray-300 hover:text-red-400 transition-colors ml-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {agregando ? (
                  <div className="p-4 space-y-3 bg-gray-50/50 border-t border-gray-100">
                    {cat.chips.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Concepto rápido</p>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {cat.chips.map(chip => (
                            <button key={chip}
                              onClick={() => setItemForm(p => ({ ...p, descripcion: chip }))}
                              className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                                itemForm.descripcion === chip
                                  ? "bg-[#13193a] text-white border-[#13193a]"
                                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                              }`}>{chip}</button>
                          ))}
                          <button onClick={() => setItemForm(p => ({ ...p, descripcion: "" }))}
                            className="text-[11px] px-2.5 py-1 rounded-lg border bg-white text-gray-500 border-gray-200 hover:border-gray-400 font-medium">
                            Otro
                          </button>
                        </div>
                      </div>
                    )}

                    <input value={itemForm.descripcion}
                      onChange={e => setItemForm(p => ({ ...p, descripcion: e.target.value }))}
                      placeholder="Descripción del concepto..."
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/10 focus:border-[#13193a]/40"/>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Fecha</label>
                        <input type="date" value={itemForm.fecha}
                          onChange={e => setItemForm(p => ({ ...p, fecha: e.target.value }))}
                          className="w-full px-2.5 py-2 rounded-xl border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/10"/>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Monto</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-300">$</span>
                          <input type="number" min="0" value={itemForm.monto}
                            onChange={e => setItemForm(p => ({ ...p, monto: e.target.value }))}
                            placeholder="0"
                            className="w-full pl-6 pr-2 py-2 rounded-xl border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/10"/>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Estatus</label>
                        <select value={itemForm.estatus}
                          onChange={e => setItemForm(p => ({ ...p, estatus: e.target.value }))}
                          className="w-full px-2.5 py-2 rounded-xl border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/10">
                          <option value="pendiente">Pendiente</option>
                          <option value="pagado">Pagado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </div>
                    </div>

                    <input value={itemForm.notas}
                      onChange={e => setItemForm(p => ({ ...p, notas: e.target.value }))}
                      placeholder="Notas: proveedor, referencia, observaciones... (opcional)"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/10"/>

                    <div className="flex gap-2 pt-1">
                      <button onClick={cancelarForm}
                        className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-all">
                        Cancelar
                      </button>
                      <button onClick={guardar} disabled={!puedeGuardar}
                        className="flex-1 py-2 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-xs font-bold disabled:opacity-40 transition-all">
                        Agregar concepto
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-3 border-t border-gray-50">
                    <button onClick={() => abrirForm(cat.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#13193a]/60 hover:text-[#13193a] transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                      </svg>
                      Agregar concepto
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* ── Selector de categoría ── */}
      {pickerAbierto ? (
        <div className="rounded-xl border border-[#13193a]/20 bg-white overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-bold text-[#13193a] uppercase tracking-wide">Selecciona una categoría</p>
            <button onClick={() => setPickerAbierto(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {catsDisponibles.map(cat => (
              <button key={cat.id} onClick={() => activarCategoria(cat.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left">
                <span className={`w-2 h-2 rounded-full shrink-0 ${cat.dot}`}/>
                <span className="flex-1 text-sm text-gray-700 font-medium">{cat.nombre}</span>
                <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
                </svg>
              </button>
            ))}
            {/* Opción personalizada siempre disponible */}
            <button onClick={() => { setPickerAbierto(false); setCatCustomPanel(true); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left">
              <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0"/>
              <span className="flex-1 text-sm text-gray-500 font-medium">Categoría personalizada…</span>
              <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
              </svg>
            </button>
          </div>
        </div>
      ) : catCustomPanel ? (
        <div className="flex gap-2 p-4 rounded-xl border border-gray-200 bg-white">
          <input value={nomCatCustom} onChange={e => setNomCatCustom(e.target.value)}
            placeholder="Nombre de la categoría (ej: Salvamento, Peritos externos…)"
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/10"/>
          <button onClick={agregarCatCustom} disabled={!nomCatCustom.trim()}
            className="px-4 py-2 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-xs font-bold disabled:opacity-40 transition-all">
            Crear
          </button>
          <button onClick={() => setCatCustomPanel(false)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-all">
            Cancelar
          </button>
        </div>
      ) : (
        // Botón principal — solo si quedan categorías por activar
        (catsDisponibles.length > 0 || true) && (
          <button onClick={() => setPickerAbierto(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-gray-200 text-xs font-semibold text-gray-400 hover:border-[#13193a]/30 hover:text-[#13193a]/60 transition-all">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
            </svg>
            Agregar categoría de costo
          </button>
        )
      )}
    </div>
  );
}

// ── Modal desglose de caso ────────────────────────────────────
function ModalDesglose({ s, ajustadores, onClose, onReasignar, onCanalizar, onActualizarCostos }) {
  const [tabActivo, setTabActivo]     = useState("info");
  const [modoCanaliz, setModoCanaliz] = useState(false);
  const [tipoCanaliz, setTipoCanaliz] = useState("");
  const [abogado, setAbogado]         = useState("");
  const [modoReasig, setModoReasig]   = useState(false);
  const [ajSel, setAjSel]             = useState(s.ajustador?.id ?? "");
  const [procesando, setProcesando]   = useState(false);
  const [costos, setCostos]           = useState(s.costos ?? []);

  const { pagado, pendiente, total } = calcTotalesCostos(costos);

  const handleCostosChange = (c) => { setCostos(c); onActualizarCostos(s.folio, c); };
  const confirmarReasig = () => {
    setProcesando(true);
    setTimeout(() => { onReasignar(s.folio, ajustadores.find(a => a.id === ajSel)); }, 700);
  };
  const confirmarCanaliz = () => {
    setProcesando(true);
    setTimeout(() => { onCanalizar(s.folio, tipoCanaliz, abogado); }, 700);
  };

  const TABS = [
    { k:"info",     l:"Información" },
    { k:"timeline", l:"Línea de tiempo" },
    { k:"costos",   l:"Costos", badge: total > 0 },
    { k:"acciones", l:"Acciones" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter:"blur(8px)", backgroundColor:"rgba(10,15,40,0.55)" }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col"
        style={{ height:"90vh", maxHeight:"780px" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#13193a]/8 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-[#13193a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-sm font-bold text-[#13193a] font-mono">{s.folio}</h2>
              <span className={`inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_CLS[s.estatus] ?? STATUS_CLS["Sin asignar"]}`}>{s.estatus}</span>
              {s.juridico && (
                <span className="inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  {s.tipoJuridico}
                </span>
              )}
              {total > 0 && (
                <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  ${total.toLocaleString("es-MX")} total costos
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{s.asegurado} · {s.vehiculo} · {s.fecha} {s.hora}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-2 shrink-0 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.k} onClick={() => setTabActivo(t.k)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                tabActivo === t.k ? "border-[#13193a] text-[#13193a]" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}>
              {t.l}
              {t.badge && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"/>}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── TAB: INFORMACIÓN ── */}
          {tabActivo === "info" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Datos del siniestro</p>
                  {[["Tipo",s.tipo],["Fecha/Hora",`${s.fecha} · ${s.hora}`],["Ubicación",s.ubicacion??"No especificada"],["Descripción",s.descripcion],["Daños",s.danos]].map(([l,v]) => (
                    <div key={l} className="flex flex-col gap-0.5 py-2 border-b border-gray-50 last:border-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{l}</p>
                      <p className="text-xs text-gray-700 leading-relaxed">{v}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Asegurado y póliza</p>
                  {[["Asegurado",s.asegurado],["Teléfono",s.telefono],["Vehículo",`${s.vehiculo} · ${s.color}`],["Placas",s.placas],["Póliza",s.poliza],["Cobertura",s.cobertura]].map(([l,v]) => (
                    <div key={l} className="flex flex-col gap-0.5 py-2 border-b border-gray-50 last:border-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{l}</p>
                      <p className="text-xs text-gray-700 font-semibold">{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {s.terceros.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Terceros / Afectados</p>
                  <div className="space-y-2">
                    {s.terceros.map((t, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${t.lesiones ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-800">{t.nombre}</p>
                          <p className="text-[11px] text-gray-500">{t.vehiculo} · {t.placas}</p>
                        </div>
                        {t.lesiones && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">Lesionado</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Ajustador asignado</p>
                  {s.ajustador
                    ? <p className="text-sm font-semibold text-[#13193a]">{s.ajustador.nombre}</p>
                    : <p className="text-sm text-red-500 font-semibold">Sin asignar</p>}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Documentos ({s.documentos.length})</p>
                  {s.documentos.length === 0
                    ? <p className="text-xs text-gray-400">Sin documentos aún</p>
                    : <div className="flex flex-wrap gap-1.5">{s.documentos.map(d => (
                        <span key={d} className="text-[11px] px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 font-medium">{d}</span>
                      ))}</div>}
                </div>
              </div>

              {/* Acceso a costos */}
              <button onClick={() => setTabActivo("costos")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all text-left">
                <div className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-[#13193a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#13193a]">Costos del siniestro</p>
                  {total > 0 ? (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Pagado: <span className="text-emerald-600 font-semibold">${pagado.toLocaleString("es-MX")}</span>
                      {pendiente > 0 && <> · Pendiente: <span className="text-amber-600 font-semibold">${pendiente.toLocaleString("es-MX")}</span></>}
                      {" · "}Total: <span className="text-[#13193a] font-bold">${total.toLocaleString("es-MX")}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-0.5">Sin costos registrados · Toca para agregar</p>
                  )}
                </div>
                <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
                </svg>
              </button>

              {s.juridico && (
                <div className="border border-purple-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-[#13193a] mb-1">Canalizado a {s.tipoJuridico}</p>
                  {s.abogado && <p className="text-xs text-gray-500">Responsable: <strong className="text-gray-700">{s.abogado}</strong></p>}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: TIMELINE ── */}
          {tabActivo === "timeline" && (
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Historial del caso</p>
              {s.timeline.map((ev, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-3 h-3 rounded-full border-2 mt-1 shrink-0 ${i===s.timeline.length-1?"border-[#13193a] bg-[#13193a]":"border-gray-300 bg-white"}`}/>
                    {i < s.timeline.length-1 && <div className="w-px flex-1 bg-gray-200 my-1"/>}
                  </div>
                  <div className="pb-4 flex-1">
                    <p className="text-xs font-semibold text-gray-800">{ev.evento}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{ev.fecha} · {ev.actor}</p>
                  </div>
                </div>
              ))}
              {s.estatus !== "Completado" && s.estatus !== "Cancelado" && (
                <div className="flex gap-4 mt-2">
                  <div className="shrink-0"><div className="w-3 h-3 rounded-full border-2 border-dashed border-gray-300 bg-white mt-1"/></div>
                  <p className="text-xs text-gray-400 italic">En espera de siguiente acción…</p>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: COSTOS ── */}
          {tabActivo === "costos" && (
            <TabCostos costos={costos} onCostosChange={handleCostosChange} />
          )}

          {/* ── TAB: ACCIONES ── */}
          {tabActivo === "acciones" && (
            <div className="space-y-5">
              {/* Reasignar */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-[#13193a]">Ajustador asignado</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {s.ajustador ? s.ajustador.nombre : <span className="text-red-500">Sin asignar</span>}
                    </p>
                  </div>
                  <button onClick={() => setModoReasig(!modoReasig)}
                    className="text-xs font-semibold text-[#13193a] border border-[#13193a]/20 px-3 py-1.5 rounded-xl hover:bg-[#13193a]/5 transition-all">
                    {s.ajustador ? "Reasignar" : "Asignar"}
                  </button>
                </div>
                {modoReasig && (
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Selecciona ajustador</p>
                    <div className="space-y-2">
                      {ajustadores.map(aj => {
                        const disponible = aj.activos < aj.max;
                        return (
                          <button key={aj.id} onClick={() => disponible && setAjSel(aj.id)} disabled={!disponible}
                            className={["w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                              ajSel===aj.id ? "border-[#13193a] bg-[#13193a]/5" : disponible ? "border-gray-200 hover:border-gray-300 bg-white" : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed",
                            ].join(" ")}>
                            <div className="w-8 h-8 rounded-full bg-[#13193a] text-white flex items-center justify-center text-xs font-bold shrink-0">
                              {aj.nombre.split(" ").map(w=>w[0]).join("").slice(0,2)}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-[#13193a]">{aj.nombre}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <div className="flex gap-0.5">
                                  {Array.from({length:aj.max}).map((_,i)=>(
                                    <div key={i} className={`w-2.5 h-2.5 rounded-full ${i<aj.activos?"bg-[#13193a]":"bg-gray-200"}`}/>
                                  ))}
                                </div>
                                <p className="text-[10px] text-gray-400">{aj.activos}/{aj.max} activos</p>
                              </div>
                            </div>
                            {!disponible && <span className="text-[10px] text-red-500 font-semibold">Lleno</span>}
                            {ajSel===aj.id && (
                              <svg className="w-4 h-4 text-[#13193a] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={confirmarReasig} disabled={!ajSel||procesando}
                      className="w-full py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 transition-all">
                      {procesando ? "Asignando..." : "Confirmar asignación"}
                    </button>
                  </div>
                )}
              </div>

              {/* Canalizar jurídico */}
              {!s.juridico && (
                <div className="border border-purple-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-[#13193a]">Canalizar a asistencia jurídica</p>
                      <p className="text-xs text-gray-400 mt-0.5">Derivar a abogado o asistencia legal</p>
                    </div>
                    <button onClick={() => setModoCanaliz(!modoCanaliz)}
                      className="text-xs font-semibold text-purple-700 border border-purple-200 px-3 py-1.5 rounded-xl hover:bg-purple-50 transition-all">
                      Canalizar
                    </button>
                  </div>
                  {modoCanaliz && (
                    <div className="space-y-3 pt-3 border-t border-purple-100">
                      <div className="flex flex-wrap gap-2">
                        {TIPOS_CANALIZ.map(t => (
                          <button key={t} onClick={() => setTipoCanaliz(t)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                              tipoCanaliz===t ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                            }`}>{t}</button>
                        ))}
                      </div>
                      {(tipoCanaliz==="Abogado externo"||tipoCanaliz==="Demanda formal") && (
                        <input value={abogado} onChange={e => setAbogado(e.target.value)} placeholder="Nombre del abogado..."
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/10"/>
                      )}
                      <button onClick={confirmarCanaliz} disabled={!tipoCanaliz||procesando}
                        className="w-full py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 transition-all">
                        {procesando ? "Canalizando..." : "Confirmar canalización"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Cerrar caso */}
              {(s.estatus==="En proceso"||s.estatus==="Asignado") && (
                <div className="border border-emerald-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-[#13193a] mb-1">Cerrar caso</p>
                  <p className="text-xs text-gray-400 mb-3">Marcar como completado y generar cierre de expediente.</p>
                  <button onClick={() => { setProcesando(true); setTimeout(() => onClose(), 800); }}
                    className="w-full py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all">
                    Confirmar cierre del caso
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function SupervisorSiniestros() {
  const [siniestros, setSiniestros]     = useState(SINIESTROS_MOCK);
  const [busqueda,   setBusqueda]       = useState("");
  const [filtroTipo, setFiltroTipo]     = useState("Todos");
  const [tab,        setTab]            = useState("activos");
  const [seleccionado, setSeleccionado] = useState(null);

  const onReasignar = (folio, ajustador) => {
    setSiniestros(ss => ss.map(s => s.folio===folio ? { ...s, ajustador, estatus:s.estatus==="Sin asignar"?"Asignado":s.estatus } : s));
    setSeleccionado(p => p ? { ...p, ajustador, estatus:p.estatus==="Sin asignar"?"Asignado":p.estatus } : null);
  };
  const onCanalizar = (folio, tipoCanaliz, abogado) => {
    setSiniestros(ss => ss.map(s => s.folio===folio ? { ...s, juridico:true, tipoJuridico:tipoCanaliz, abogado:abogado||null, estatus:"Jurídico" } : s));
    setSeleccionado(p => p ? { ...p, juridico:true, tipoJuridico:tipoCanaliz, abogado:abogado||null, estatus:"Jurídico" } : null);
  };
  const onActualizarCostos = (folio, costos) => {
    setSiniestros(ss => ss.map(s => s.folio===folio ? { ...s, costos } : s));
    setSeleccionado(p => p ? { ...p, costos } : null);
  };

  const filtradosPorTab = siniestros.filter(s => {
    if (tab==="activos")     return !["Completado","Cancelado"].includes(s.estatus);
    if (tab==="sin_asignar") return s.estatus==="Sin asignar";
    if (tab==="juridicos")   return s.juridico;
    return true;
  });
  const filtrados = filtradosPorTab.filter(s => {
    const mb = s.folio.includes(busqueda) || s.asegurado.toLowerCase().includes(busqueda.toLowerCase()) || s.placas.toLowerCase().includes(busqueda.toLowerCase());
    return mb && (filtroTipo==="Todos" || s.tipo===filtroTipo);
  });

  const sinAsignarCount = siniestros.filter(s => s.estatus==="Sin asignar").length;
  const juridicosCount  = siniestros.filter(s => s.juridico).length;
  const totalErogado    = siniestros.reduce((sum, s) => sum + calcTotalesCostos(s.costos??[]).total, 0);

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#13193a]">Siniestros</h1>
        <p className="text-gray-400 text-sm mt-0.5">Gestión, reasignación y supervisión de casos</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-2xl font-bold text-[#13193a] tabular-nums">{siniestros.filter(s=>!["Completado","Cancelado"].includes(s.estatus)).length}</p>
          <p className="text-xs font-semibold text-gray-400 mt-0.5">Total activos</p>
        </div>
        <div className="bg-white border border-red-200 rounded-2xl p-4">
          <p className="text-2xl font-bold text-red-600 tabular-nums">{sinAsignarCount}</p>
          <p className="text-xs font-semibold text-gray-400 mt-0.5">Sin asignar</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-2xl font-bold text-[#13193a] tabular-nums">{juridicosCount}</p>
          <p className="text-xs font-semibold text-gray-400 mt-0.5">Jurídicos</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-2xl font-bold text-[#13193a] tabular-nums">${totalErogado.toLocaleString("es-MX")}</p>
          <p className="text-xs font-semibold text-gray-400 mt-0.5">Total erogado</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center border-b border-gray-100 px-2 overflow-x-auto">
          {[
            { k:"activos",     l:"Activos" },
            { k:"sin_asignar", l:"Sin asignar", badge:sinAsignarCount, badgeCls:"bg-red-100 text-red-700" },
            { k:"juridicos",   l:"Jurídicos",   badge:juridicosCount,  badgeCls:"bg-gray-100 text-gray-600" },
            { k:"todos",       l:"Todos" },
          ].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                tab===t.k ? "border-[#13193a] text-[#13193a]" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}>
              {t.l}
              {t.badge > 0 && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${t.badgeCls}`}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <svg className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Folio, asegurado, placas..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/10 focus:border-[#13193a]/40 bg-white"/>
          </div>
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/10">
            {["Todos",...TIPOS_SINIESTRO].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100">
                {["Folio","Fecha / Hora","Asegurado","Vehículo","Tipo","Ajustador","Estatus","Costos",""].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16">
                    <p className="text-sm text-gray-400">No hay siniestros con esos filtros.</p>
                  </td>
                </tr>
              ) : filtrados.map((s, i) => {
                const { pagado:cp, pendiente:cpend, total:ct } = calcTotalesCostos(s.costos??[]);
                return (
                  <tr key={i} onClick={() => setSeleccionado(s)}
                    className={`hover:bg-gray-50/60 transition-colors cursor-pointer ${s.estatus==="Sin asignar"?"bg-red-50/20":""}`}>
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-[#13193a]">{s.folio}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">{s.fecha} {s.hora}</td>
                    <td className="px-4 py-3.5 text-xs font-semibold text-gray-700 whitespace-nowrap">{s.asegurado}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{s.vehiculo}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">{s.tipo}</td>
                    <td className="px-4 py-3.5 text-xs">
                      {s.ajustador
                        ? <span className="font-semibold text-gray-700">{s.ajustador.nombre}</span>
                        : <span className="flex items-center gap-1.5 text-red-500 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0"/>Sin asignar
                          </span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_CLS[s.estatus]??STATUS_CLS["Sin asignar"]}`}>{s.estatus}</span>
                        {s.juridico && <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-full">Jur.</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {ct > 0 ? (
                        <div>
                          <p className="text-xs font-bold text-[#13193a] tabular-nums">${ct.toLocaleString("es-MX")}</p>
                          <div className="flex gap-1 mt-0.5">
                            {cp   > 0 && <span className="text-[10px] text-emerald-600 font-semibold">✓ ${cp.toLocaleString("es-MX")}</span>}
                            {cpend> 0 && <span className="text-[10px] text-amber-600 font-semibold">· ${cpend.toLocaleString("es-MX")}</span>}
                          </div>
                        </div>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <button onClick={e => { e.stopPropagation(); setSeleccionado(s); }}
                        className="w-7 h-7 rounded-lg text-gray-300 hover:text-[#13193a] hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex justify-between items-center">
          <p className="text-xs text-gray-400">{filtrados.length} siniestros</p>
          {sinAsignarCount > 0 && (
            <p className="text-xs text-red-500 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>
              {sinAsignarCount} sin ajustador
            </p>
          )}
        </div>
      </div>

      {seleccionado && (
        <ModalDesglose
          s={seleccionado}
          ajustadores={AJUSTADORES}
          onClose={() => setSeleccionado(null)}
          onReasignar={onReasignar}
          onCanalizar={onCanalizar}
          onActualizarCostos={onActualizarCostos}
        />
      )}
    </div>
  );
}
