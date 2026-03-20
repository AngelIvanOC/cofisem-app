// ============================================================
// src/pages/supervisor/SupervisorSiniestros.jsx
// Supervisor: Lista completa de siniestros con:
//   • Reasignación de ajustador
//   • Canalización: asistencia jurídica / abogado
//   • Desglose completo del caso (modal)
//   • Tabs: Activos | Sin asignar | Jurídicos | Todos
// ============================================================
import { useState } from "react";

// ── Catálogos ─────────────────────────────────────────────────
const AJUSTADORES = [
  { id: "AJ-01", nombre: "Félix Hernández",  activos: 2, max: 4 },
  { id: "AJ-02", nombre: "Luis Martínez",    activos: 3, max: 4 },
  { id: "AJ-03", nombre: "Ana García",       activos: 1, max: 4 },
  { id: "AJ-04", nombre: "Roberto Vega",     activos: 0, max: 4 },
  { id: "AJ-05", nombre: "Sofía Torres",     activos: 4, max: 4 },
];

const TIPOS_CANALIZ = ["Asistencia jurídica", "Abogado externo", "Mediación", "Demanda formal"];

const TIPOS_SINIESTRO = ["Colisión", "Robo total", "Robo parcial", "Cristales", "Daño a terceros", "Volcadura", "Incendio", "Fenómeno natural"];

// ── Estatus visual ────────────────────────────────────────────
const STATUS_CLS = {
  "Sin asignar":         "bg-red-50    text-red-600    border-red-200",
  "Asignado":            "bg-blue-50   text-blue-700   border-blue-200",
  "Pendiente de arribo": "bg-amber-50  text-amber-700  border-amber-200",
  "En proceso":          "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Jurídico":            "bg-purple-50 text-purple-700 border-purple-200",
  "Completado":          "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Cancelado":           "bg-gray-100  text-gray-500   border-gray-200",
};

// ── Datos mock ────────────────────────────────────────────────
const SINIESTROS_MOCK = [
  {
    folio: "SN-10234", fecha: "17/03/2026", hora: "08:15",
    asegurado: "Carlos Gómez",   telefono: "777 100 2233",
    vehiculo: "Toyota Corolla 2022", placas: "VRM-123A", color: "Blanco",
    poliza: "3413241", cobertura: "TAXI BÁSICA 2500",
    tipo: "Colisión", ubicacion: "Av. Emiliano Zapata 145, Jiutepec, Mor.",
    coords: { lat: 18.8841, lng: -99.1948 },
    ajustador: { id:"AJ-01", nombre:"Félix Hernández" },
    estatus: "En proceso",
    juridico: false, tipoJuridico: null, abogado: null,
    descripcion: "Colisión frontal con taxi. Asegurado sin lesiones. Vehículo tercero: Nissan Tsuru.",
    danos: "Defensa delantera, cofre, faros delanteros, radiador.",
    terceros: [{ nombre:"Pedro Ramírez", vehiculo:"Nissan Tsuru 2008", placas:"CHM-456B", lesiones:false }],
    timeline: [
      { evento:"Reporte recibido",          fecha:"17/03/2026 08:15", actor:"Cabinero: María R." },
      { evento:"Ajustador asignado",         fecha:"17/03/2026 08:22", actor:"Sistema" },
      { evento:"Ajustador en camino",        fecha:"17/03/2026 08:30", actor:"Félix Hernández" },
      { evento:"Arribo confirmado",          fecha:"17/03/2026 09:01", actor:"Félix Hernández" },
      { evento:"Captura de datos iniciada",  fecha:"17/03/2026 09:10", actor:"Félix Hernández" },
    ],
    documentos: ["Póliza", "Fotos daños", "Licencias", "No. serie"],
  },
  {
    folio: "SN-10231", fecha: "17/03/2026", hora: "09:40",
    asegurado: "Ana Martínez",   telefono: "777 234 5566",
    vehiculo: "Honda Civic 2020", placas: "STU-321D", color: "Gris",
    poliza: "3410888", cobertura: "TAXI BÁSICA PAGOS 2700",
    tipo: "Daño a terceros", ubicacion: "Blvd. Cuauhnáhuac 890, Cuernavaca, Mor.",
    coords: { lat: 18.9242, lng: -99.2216 },
    ajustador: null,
    estatus: "Sin asignar",
    juridico: false, tipoJuridico: null, abogado: null,
    descripcion: "Impacto por alcance. Tercero exige pago inmediato de daños.",
    danos: "Parachoque trasero, cajuela abollada.",
    terceros: [{ nombre:"Rosa Jiménez", vehiculo:"VW Vento 2019", placas:"PQR-789C", lesiones:false }],
    timeline: [
      { evento:"Reporte recibido", fecha:"17/03/2026 09:40", actor:"Cabinero: Carlos P." },
    ],
    documentos: [],
  },
  {
    folio: "SN-10227", fecha: "17/03/2026", hora: "07:30",
    asegurado: "Roberto Díaz",   telefono: "777 345 6677",
    vehiculo: "Nissan Tsuru 2018", placas: "CHM-456B", color: "Rojo",
    poliza: "3413167", cobertura: "SERV. PÚB. 50/50 GAMAN 2",
    tipo: "Robo total", ubicacion: "Col. Las Palmas, Cuernavaca, Mor.",
    coords: null,
    ajustador: { id:"AJ-01", nombre:"Félix Hernández" },
    estatus: "Jurídico",
    juridico: true, tipoJuridico: "Abogado externo", abogado: "Lic. Jorge Méndez",
    descripcion: "Robo total del vehículo la noche anterior. Se levantó acta ante el MP. Asegurado exige pago de suma asegurada.",
    danos: "Robo total — vehículo no recuperado.",
    terceros: [],
    timeline: [
      { evento:"Reporte recibido",         fecha:"17/03/2026 07:30", actor:"Cabinero: María R." },
      { evento:"Ajustador asignado",        fecha:"17/03/2026 07:45", actor:"Sistema" },
      { evento:"Arribo confirmado",         fecha:"17/03/2026 08:30", actor:"Félix Hernández" },
      { evento:"Caso derivado a jurídico",  fecha:"17/03/2026 11:00", actor:"Supervisor: Héctor D." },
      { evento:"Abogado asignado",          fecha:"17/03/2026 11:30", actor:"Lic. Jorge Méndez" },
    ],
    documentos: ["Póliza", "Acta MP", "Fotos zona", "No. serie"],
  },
  {
    folio: "SN-10220", fecha: "17/03/2026", hora: "10:15",
    asegurado: "Laura González", telefono: "777 456 7788",
    vehiculo: "KIA Sportage 2021", placas: "YZA-987F", color: "Negro",
    poliza: "3411002", cobertura: "TAXI BÁSICA 2500",
    tipo: "Volcadura",
    ubicacion: "Carr. Cuernavaca-Cuautla km 12, Mor.",
    coords: { lat: 18.8910, lng: -99.1620 },
    ajustador: null,
    estatus: "Sin asignar",
    juridico: false, tipoJuridico: null, abogado: null,
    descripcion: "Volcadura al esquivar bache. Asegurado con lesiones leves. Vehículo inmovilizado en lugar del siniestro.",
    danos: "Costado izquierdo, techo, vidrio lateral izquierdo, llanta.",
    terceros: [],
    timeline: [
      { evento:"Reporte recibido", fecha:"17/03/2026 10:15", actor:"Cabinero: Carlos P." },
    ],
    documentos: [],
  },
  {
    folio: "SN-10215", fecha: "16/03/2026", hora: "14:20",
    asegurado: "Miguel Ortega",  telefono: "777 567 8899",
    vehiculo: "VW Jetta 2019", placas: "BCD-111G", color: "Azul",
    poliza: "3414001", cobertura: "SERV. PÚB. 50/50 GAMAN 2",
    tipo: "Colisión",
    ubicacion: "Av. Plan de Ayala 222, Cuernavaca, Mor.",
    coords: { lat: 18.9350, lng: -99.2100 },
    ajustador: { id:"AJ-02", nombre:"Luis Martínez" },
    estatus: "Completado",
    juridico: false, tipoJuridico: null, abogado: null,
    descripcion: "Colisión lateral derecha en crucero. Sin lesionados. Caso cerrado con acuerdo entre partes.",
    danos: "Puerta delantera derecha, espejo lateral, salpicadera.",
    terceros: [{ nombre:"Juan Cruz", vehiculo:"Chevrolet Aveo 2016", placas:"EFG-222H", lesiones:false }],
    timeline: [
      { evento:"Reporte recibido",    fecha:"16/03/2026 14:20", actor:"Cabinero: María R." },
      { evento:"Ajustador asignado",   fecha:"16/03/2026 14:30", actor:"Sistema" },
      { evento:"Arribo confirmado",    fecha:"16/03/2026 15:05", actor:"Luis Martínez" },
      { evento:"Captura completada",   fecha:"16/03/2026 15:50", actor:"Luis Martínez" },
      { evento:"Documentos enviados",  fecha:"16/03/2026 16:10", actor:"Luis Martínez" },
      { evento:"Caso cerrado",         fecha:"16/03/2026 16:30", actor:"Supervisor: Héctor D." },
    ],
    documentos: ["Póliza", "Fotos daños", "Licencias", "No. serie", "Orden de reparación"],
  },
  {
    folio: "SN-10208", fecha: "16/03/2026", hora: "11:00",
    asegurado: "Luis Torres",    telefono: "777 678 9900",
    vehiculo: "VW Vento 2020", placas: "EFG-222H", color: "Plata",
    poliza: "3413198", cobertura: "TAXI BÁSICA 2500",
    tipo: "Colisión",
    ubicacion: "Blvd. Cuauhnáhuac 890, Temixco, Mor.",
    coords: { lat: 18.8533, lng: -99.2244 },
    ajustador: { id:"AJ-03", nombre:"Ana García" },
    estatus: "Jurídico",
    juridico: true, tipoJuridico: "Asistencia jurídica", abogado: null,
    descripcion: "Tercero afectado amenaza con demanda. Colisión con dos vehículos. Hay posibles lesionados que se negaron a ir al hospital.",
    danos: "Defensa delantera, cofre, ambas aletas delanteras.",
    terceros: [
      { nombre:"Carlos Peña",   vehiculo:"Nissan Versa 2021", placas:"STU-321D", lesiones:true  },
      { nombre:"Rosa García",   vehiculo:"Toyota Yaris 2018", placas:"VWX-654E", lesiones:false },
    ],
    timeline: [
      { evento:"Reporte recibido",       fecha:"16/03/2026 11:00", actor:"Cabinero: María R." },
      { evento:"Ajustador asignado",      fecha:"16/03/2026 11:10", actor:"Sistema" },
      { evento:"Arribo confirmado",       fecha:"16/03/2026 11:45", actor:"Ana García" },
      { evento:"Asistencia jurídica act.", fecha:"16/03/2026 14:00", actor:"Supervisor: Héctor D." },
    ],
    documentos: ["Póliza", "Fotos daños", "Licencias", "Pase médico"],
  },
];

// ── Modal desglose de caso ────────────────────────────────────
function ModalDesglose({ s, ajustadores, onClose, onReasignar, onCanalizar }) {
  const [tabActivo, setTabActivo]   = useState("info");  // info | timeline | acciones
  const [modoCanaliz, setModoCanaliz] = useState(false);
  const [tipoCanaliz, setTipoCanaliz] = useState("");
  const [abogado, setAbogado]       = useState("");
  const [modoReasig, setModoReasig] = useState(false);
  const [ajSel, setAjSel]           = useState(s.ajustador?.id ?? "");
  const [procesando, setProcesando] = useState(false);

  const confirmarReasig = () => {
    setProcesando(true);
    const aj = ajustadores.find(a => a.id === ajSel);
    setTimeout(() => { onReasignar(s.folio, aj); }, 700);
  };
  const confirmarCanaliz = () => {
    setProcesando(true);
    setTimeout(() => { onCanalizar(s.folio, tipoCanaliz, abogado); }, 700);
  };

  const TABS = [
    { k:"info",      l:"Información" },
    { k:"timeline",  l:"Línea de tiempo" },
    { k:"acciones",  l:"Acciones" },
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
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z"/></svg>
                  {s.tipoJuridico}
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
        <div className="flex border-b border-gray-100 px-2 shrink-0">
          {TABS.map(t => (
            <button key={t.k} onClick={() => setTabActivo(t.k)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                tabActivo === t.k ? "border-[#13193a] text-[#13193a]" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}>{t.l}</button>
          ))}
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── TAB: INFORMACIÓN ─── */}
          {tabActivo === "info" && (
            <div className="space-y-5">
              {/* 2 columnas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Datos del siniestro */}
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Datos del siniestro</p>
                  {[
                    ["Tipo",        s.tipo],
                    ["Fecha/Hora",  `${s.fecha} · ${s.hora}`],
                    ["Ubicación",   s.ubicacion ?? "No especificada"],
                    ["Descripción", s.descripcion],
                    ["Daños",       s.danos],
                  ].map(([l, v]) => (
                    <div key={l} className="flex flex-col gap-0.5 py-2 border-b border-gray-50 last:border-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{l}</p>
                      <p className="text-xs text-gray-700 leading-relaxed">{v}</p>
                    </div>
                  ))}
                </div>

                {/* Asegurado + póliza */}
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Asegurado y póliza</p>
                  {[
                    ["Asegurado",  s.asegurado],
                    ["Teléfono",   s.telefono],
                    ["Vehículo",   `${s.vehiculo} · ${s.color}`],
                    ["Placas",     s.placas],
                    ["Póliza",     s.poliza],
                    ["Cobertura",  s.cobertura],
                  ].map(([l, v]) => (
                    <div key={l} className="flex flex-col gap-0.5 py-2 border-b border-gray-50 last:border-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{l}</p>
                      <p className="text-xs text-gray-700 font-semibold">{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Terceros */}
              {s.terceros.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Terceros / Afectados</p>
                  <div className="space-y-2">
                    {s.terceros.map((t, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${t.lesiones ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-800">{t.nombre}</p>
                          <p className="text-[11px] text-gray-500">{t.vehiculo} · {t.placas}</p>
                        </div>
                        {t.lesiones && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300">Lesionado</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ajustador y documentos */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Ajustador asignado</p>
                  {s.ajustador
                    ? <p className="text-sm font-semibold text-[#13193a]">{s.ajustador.nombre}</p>
                    : <p className="text-sm text-red-500 font-semibold">Sin asignar</p>
                  }
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Documentos ({s.documentos.length})</p>
                  {s.documentos.length === 0
                    ? <p className="text-xs text-gray-400">Sin documentos aún</p>
                    : <div className="flex flex-wrap gap-1.5">{s.documentos.map(d => (
                        <span key={d} className="text-[11px] px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 font-medium">{d}</span>
                      ))}</div>
                  }
                </div>
              </div>

              {/* Canalización jurídica */}
              {s.juridico && (
                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z"/></svg>
                    <p className="text-sm font-bold text-purple-800">Canalizado a {s.tipoJuridico}</p>
                  </div>
                  {s.abogado && <p className="text-xs text-purple-700">Responsable: <strong>{s.abogado}</strong></p>}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: TIMELINE ─── */}
          {tabActivo === "timeline" && (
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Historial del caso</p>
              {s.timeline.map((ev, i) => (
                <div key={i} className="flex gap-4">
                  {/* Línea */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-3 h-3 rounded-full border-2 mt-1 shrink-0 ${i === s.timeline.length-1 ? "border-[#13193a] bg-[#13193a]" : "border-gray-300 bg-white"}`}/>
                    {i < s.timeline.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1"/>}
                  </div>
                  <div className="pb-4 flex-1">
                    <p className="text-xs font-semibold text-gray-800">{ev.evento}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{ev.fecha} · {ev.actor}</p>
                  </div>
                </div>
              ))}

              {/* Estado actual */}
              {s.estatus !== "Completado" && s.estatus !== "Cancelado" && (
                <div className="flex gap-4 mt-2">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-3 h-3 rounded-full border-2 border-dashed border-gray-300 bg-white mt-1"/>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 italic">En espera de siguiente acción…</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: ACCIONES ─── */}
          {tabActivo === "acciones" && (
            <div className="space-y-5">

              {/* Reasignar ajustador */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold text-[#13193a]">Ajustador asignado</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {s.ajustador ? s.ajustador.nombre : <span className="text-red-500 font-semibold">Sin asignar</span>}
                    </p>
                  </div>
                  <button onClick={() => setModoReasig(!modoReasig)}
                    className="text-xs font-bold text-[#13193a] border border-[#13193a]/20 px-3 py-1.5 rounded-xl hover:bg-[#13193a]/5 transition-all">
                    {s.ajustador ? "Reasignar" : "Asignar"}
                  </button>
                </div>

                {modoReasig && (
                  <div className="space-y-3 pt-3 border-t border-gray-200">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Selecciona ajustador</p>
                    <div className="space-y-2">
                      {ajustadores.map(aj => {
                        const disponible = aj.activos < aj.max;
                        return (
                          <button key={aj.id} onClick={() => disponible && setAjSel(aj.id)}
                            disabled={!disponible}
                            className={[
                              "w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                              ajSel === aj.id ? "border-[#13193a] bg-[#13193a]/5" : disponible ? "border-gray-200 hover:border-gray-300 bg-white" : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed",
                            ].join(" ")}>
                            <div className="w-8 h-8 rounded-full bg-[#13193a] text-white flex items-center justify-center text-xs font-bold shrink-0">
                              {aj.nombre.split(" ").map(w=>w[0]).join("").slice(0,2)}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-[#13193a]">{aj.nombre}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <div className="flex gap-0.5">
                                  {Array.from({length: aj.max}).map((_,i) => (
                                    <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < aj.activos ? "bg-blue-500" : "bg-gray-200"}`}/>
                                  ))}
                                </div>
                                <p className="text-[10px] text-gray-500">{aj.activos}/{aj.max} activos</p>
                              </div>
                            </div>
                            {!disponible && <span className="text-[10px] text-red-500 font-bold">Lleno</span>}
                            {ajSel === aj.id && (
                              <svg className="w-4 h-4 text-[#13193a] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={confirmarReasig} disabled={!ajSel || procesando}
                      className="w-full py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 transition-all">
                      {procesando ? "Asignando..." : "Confirmar asignación"}
                    </button>
                  </div>
                )}
              </div>

              {/* Canalizar a jurídico */}
              {!s.juridico && (
                <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-purple-800">Canalizar a asistencia jurídica</p>
                      <p className="text-xs text-purple-600 mt-0.5">Derivar a abogado o asistencia legal</p>
                    </div>
                    <button onClick={() => setModoCanaliz(!modoCanaliz)}
                      className="text-xs font-bold text-purple-700 border border-purple-300 px-3 py-1.5 rounded-xl hover:bg-purple-100 transition-all">
                      Canalizar
                    </button>
                  </div>

                  {modoCanaliz && (
                    <div className="space-y-3 pt-3 border-t border-purple-200">
                      <div>
                        <label className="block text-[11px] font-bold text-purple-700 uppercase tracking-wide mb-2">Tipo de canalización</label>
                        <div className="flex flex-wrap gap-2">
                          {TIPOS_CANALIZ.map(t => (
                            <button key={t} onClick={() => setTipoCanaliz(t)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                                tipoCanaliz === t ? "bg-purple-700 text-white border-purple-700" : "bg-white text-purple-600 border-purple-200 hover:border-purple-400"
                              }`}>{t}</button>
                          ))}
                        </div>
                      </div>
                      {(tipoCanaliz === "Abogado externo" || tipoCanaliz === "Demanda formal") && (
                        <div>
                          <label className="block text-[11px] font-bold text-purple-700 uppercase tracking-wide mb-1.5">Nombre del abogado</label>
                          <input value={abogado} onChange={e => setAbogado(e.target.value)} placeholder="Lic. nombre apellido..."
                            className="w-full px-3 py-2.5 rounded-xl border border-purple-200 bg-white text-sm text-gray-700 placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400/20 focus:border-purple-400"/>
                        </div>
                      )}
                      <button onClick={confirmarCanaliz} disabled={!tipoCanaliz || procesando}
                        className="w-full py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-sm font-bold disabled:opacity-40 transition-all">
                        {procesando ? "Canalizando..." : "Confirmar canalización"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Cerrar caso */}
              {(s.estatus === "En proceso" || s.estatus === "Asignado") && (
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200">
                  <p className="text-sm font-bold text-emerald-800 mb-1">Cerrar caso</p>
                  <p className="text-xs text-emerald-600 mb-3">Marcar como completado y generar cierre de expediente.</p>
                  <button onClick={() => { setProcesando(true); setTimeout(() => onClose(), 800); }}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all">
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
  const [siniestros, setSiniestros]   = useState(SINIESTROS_MOCK);
  const [busqueda,   setBusqueda]     = useState("");
  const [filtroTipo, setFiltroTipo]   = useState("Todos");
  const [tab,        setTab]          = useState("activos");
  const [seleccionado, setSeleccionado] = useState(null);

  // Reasignar ajustador
  const onReasignar = (folio, ajustador) => {
    setSiniestros(ss => ss.map(s => s.folio === folio
      ? { ...s, ajustador, estatus: s.estatus === "Sin asignar" ? "Asignado" : s.estatus }
      : s
    ));
    setSeleccionado(prev => prev ? { ...prev, ajustador, estatus: prev.estatus === "Sin asignar" ? "Asignado" : prev.estatus } : null);
  };

  // Canalizar a jurídico
  const onCanalizar = (folio, tipoCanaliz, abogado) => {
    setSiniestros(ss => ss.map(s => s.folio === folio
      ? { ...s, juridico: true, tipoJuridico: tipoCanaliz, abogado: abogado || null, estatus: "Jurídico" }
      : s
    ));
    setSeleccionado(prev => prev ? { ...prev, juridico: true, tipoJuridico: tipoCanaliz, abogado: abogado || null, estatus: "Jurídico" } : null);
  };

  // Filtros por tab
  const filtradosPorTab = siniestros.filter(s => {
    if (tab === "activos")    return !["Completado","Cancelado"].includes(s.estatus);
    if (tab === "sin_asignar") return s.estatus === "Sin asignar";
    if (tab === "juridicos")  return s.juridico;
    return true; // todos
  });

  const filtrados = filtradosPorTab.filter(s => {
    const mb = s.folio.includes(busqueda) || s.asegurado.toLowerCase().includes(busqueda.toLowerCase()) || s.placas.toLowerCase().includes(busqueda.toLowerCase());
    const mt = filtroTipo === "Todos" || s.tipo === filtroTipo;
    return mb && mt;
  });

  const sinAsignarCount = siniestros.filter(s => s.estatus === "Sin asignar").length;
  const juridicosCount  = siniestros.filter(s => s.juridico).length;

  const selCls = "px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15";

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#13193a]">Siniestros</h1>
        <p className="text-gray-400 text-sm mt-0.5">Gestión, reasignación y supervisión de casos</p>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { l:"Total activos",      v:siniestros.filter(s=>!["Completado","Cancelado"].includes(s.estatus)).length, a:"blue"   },
          { l:"Sin asignar",        v:sinAsignarCount,                                                              a:"red"    },
          { l:"Jurídicos",          v:juridicosCount,                                                               a:"purple" },
          { l:"Cerrados hoy",       v:siniestros.filter(s=>s.estatus==="Completado").length,                        a:"emerald"},
        ].map(m => {
          const c = { blue:"bg-blue-50 border-blue-200 text-blue-700", red:"bg-red-50 border-red-200 text-red-600", purple:"bg-purple-50 border-purple-200 text-purple-700", emerald:"bg-emerald-50 border-emerald-200 text-emerald-700" };
          return (
            <div key={m.l} className={`${c[m.a]} border rounded-2xl p-4`}>
              <p className="text-2xl font-bold tabular-nums">{m.v}</p>
              <p className="text-xs font-semibold mt-0.5 opacity-80">{m.l}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center border-b border-gray-100 px-2 overflow-x-auto">
          {[
            { k:"activos",     l:"Activos"      },
            { k:"sin_asignar", l:"Sin asignar",  badge: sinAsignarCount },
            { k:"juridicos",   l:"Jurídicos",    badge: juridicosCount  },
            { k:"todos",       l:"Todos"         },
          ].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                tab === t.k ? "border-[#13193a] text-[#13193a]" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}>
              {t.l}
              {t.badge > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  t.k === "sin_asignar" ? "bg-red-100 text-red-700" : "bg-purple-100 text-purple-700"
                }`}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Folio, asegurado, placas..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] bg-white"/>
          </div>
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className={selCls}>
            {["Todos",...TIPOS_SINIESTRO].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {["Folio","Fecha/Hora","Asegurado","Vehículo","Tipo","Ubicación","Ajustador","Estatus",""].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-14">
                    <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                    <p className="text-sm text-gray-400">No hay siniestros con esos filtros.</p>
                  </td>
                </tr>
              ) : filtrados.map((s, i) => (
                <tr key={i} onClick={() => setSeleccionado(s)}
                  className={`hover:bg-gray-50/60 transition-colors cursor-pointer ${s.estatus === "Sin asignar" ? "bg-red-50/30" : ""}`}>
                  <td className="px-4 py-3.5 font-mono text-xs font-bold text-[#13193a]">{s.folio}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{s.fecha} {s.hora}</td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-gray-700 whitespace-nowrap">{s.asegurado}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{s.vehiculo}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">{s.tipo}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-500 max-w-36 truncate">{s.ubicacion ?? "Sin ubicación"}</td>
                  <td className="px-4 py-3.5 text-xs">
                    {s.ajustador
                      ? <span className="font-semibold text-gray-700">{s.ajustador.nombre}</span>
                      : <span className="flex items-center gap-1.5 text-red-500 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0"/>
                          Sin asignar
                        </span>
                    }
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_CLS[s.estatus] ?? STATUS_CLS["Sin asignar"]}`}>{s.estatus}</span>
                      {s.juridico && (
                        <svg className="w-3.5 h-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" title={s.tipoJuridico}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z"/>
                        </svg>
                      )}
                    </div>
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
              ))}
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

      {/* Modal desglose */}
      {seleccionado && (
        <ModalDesglose
          s={seleccionado}
          ajustadores={AJUSTADORES}
          onClose={() => setSeleccionado(null)}
          onReasignar={onReasignar}
          onCanalizar={onCanalizar}
        />
      )}
    </div>
  );
}