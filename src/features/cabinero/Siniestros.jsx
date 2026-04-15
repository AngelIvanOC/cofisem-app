// ============================================================
// src/features/cabinero/Siniestros.jsx
// Cabinero: Lista de siniestros + ModalDetalle + PanelAsignar
// Diseño 100% original — solo organizado en un archivo de feature.
// ============================================================
import { useState } from "react";

// ── Constantes ────────────────────────────────────────────────
const STATUS_CLS = {
  Completado: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Pendiente: "bg-amber-50   text-amber-700   border border-amber-200",
  Cancelado: "bg-red-50     text-red-600     border border-red-200",
  Activo: "bg-blue-50    text-blue-700    border border-blue-200",
  Asignado: "bg-purple-50  text-purple-700  border border-purple-200",
};

const AJUSTADORES = [
  { id: "AJ-01", nombre: "Félix Hernández", activos: 2 },
  { id: "AJ-02", nombre: "Luis Martínez", activos: 3 },
  { id: "AJ-03", nombre: "Ana García", activos: 1 },
  { id: "AJ-04", nombre: "Roberto Vega", activos: 0 },
];
const MAX = 4;

const SINIESTROS_INIT = [
  {
    folio: "SN-10234",
    asegurado: "Carlos Gómez",
    vehiculo: "Toyota Corolla",
    fecha: "17/03/26",
    ubicacion: "Jiutepec, Mor",
    ajustador: "Félix Hernández",
    estatus: "Activo",
  },
  {
    folio: "SN-10231",
    asegurado: "Ana Martínez",
    vehiculo: "Honda Civic",
    fecha: "17/03/26",
    ubicacion: "Cuernavaca, Mor",
    ajustador: null,
    estatus: "Pendiente",
  },
  {
    folio: "SN-10227",
    asegurado: "Roberto Díaz",
    vehiculo: "Nissan Tsuru",
    fecha: "17/03/26",
    ubicacion: "Jiutepec, Mor",
    ajustador: "Félix Hernández",
    estatus: "Completado",
  },
  {
    folio: "SN-10220",
    asegurado: "Laura González",
    vehiculo: "KIA Sportage",
    fecha: "17/03/26",
    ubicacion: "Temixco, Mor",
    ajustador: null,
    estatus: "Pendiente",
  },
  {
    folio: "SN-10215",
    asegurado: "Miguel Ortega",
    vehiculo: "VW Jetta",
    fecha: "16/03/26",
    ubicacion: "Jiutepec, Mor",
    ajustador: "Luis Martínez",
    estatus: "Completado",
  },
  {
    folio: "SN-10212",
    asegurado: "Pedro Ruiz",
    vehiculo: "Chevrolet Aveo",
    fecha: "16/03/26",
    ubicacion: "Jiutepec, Mor",
    ajustador: "Ana García",
    estatus: "Activo",
  },
  {
    folio: "SN-10208",
    asegurado: "Sofía Torres",
    vehiculo: "Nissan Versa",
    fecha: "15/03/26",
    ubicacion: "Jiutepec, Mor",
    ajustador: "Luis Martínez",
    estatus: "Activo",
  },
];

// ── PanelAsignar ──────────────────────────────────────────────
function PanelAsignar({ s, onConfirmar, onCancelar }) {
  const [sel, setSel] = useState("");
  const [busy, setBusy] = useState(false);

  const confirmar = () => {
    if (!sel) return;
    setBusy(true);
    const aj = AJUSTADORES.find((a) => a.id === sel);
    setTimeout(() => onConfirmar(aj.nombre), 600);
  };

  return (
    <div className="space-y-2 pt-2 border-t border-gray-100">
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
        {s.ajustador ? "Cambiar a:" : "Seleccionar ajustador:"}
      </p>
      <div className="space-y-1.5">
        {AJUSTADORES.map((aj) => {
          const lleno = aj.activos >= MAX;
          return (
            <button
              key={aj.id}
              onClick={() => !lleno && setSel(aj.id)}
              disabled={lleno}
              className={[
                "w-full flex items-center gap-2.5 p-2.5 rounded-xl border-2 text-left transition-all",
                sel === aj.id
                  ? "border-[#13193a] bg-[#13193a]/5"
                  : lleno
                    ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                    : "border-gray-200 hover:border-gray-300 bg-white",
              ].join(" ")}
            >
              <div className="w-7 h-7 rounded-full bg-[#13193a] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                {aj.nombre
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-gray-800 truncate">
                  {aj.nombre}
                </p>
                <div className="flex gap-0.5 mt-0.5">
                  {Array.from({ length: MAX }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${i < aj.activos ? "bg-blue-400" : "bg-gray-200"}`}
                    />
                  ))}
                </div>
              </div>
              {sel === aj.id && (
                <svg
                  className="w-3.5 h-3.5 text-[#13193a] shrink-0"
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
              )}
              {lleno && (
                <span className="text-[9px] text-red-500 font-bold shrink-0">
                  Lleno
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancelar}
          className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={confirmar}
          disabled={!sel || busy}
          className="flex-1 py-2 rounded-xl bg-[#13193a] text-white text-xs font-bold disabled:opacity-40 transition-all"
        >
          {busy ? "..." : "Confirmar"}
        </button>
      </div>
    </div>
  );
}

// ── ModalDetalle ──────────────────────────────────────────────
function ModalDetalle({ s, onClose, onAsignar }) {
  const [modoAsignar, setModoAsignar] = useState(!s.ajustador);

  const etapas = [
    { label: "Reportado", time: "17/03/26 10:30", done: true },
    { label: "Arribo", time: "Pendiente", done: !!s.ajustador },
    { label: "En proceso", time: "Pendiente", done: false },
    { label: "Cerrado", time: "Pendiente", done: false },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backdropFilter: "blur(8px)",
        backgroundColor: "rgba(10,15,40,0.5)",
      }}
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
              <svg
                className="w-4 h-4 text-[#13193a]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-sm font-bold text-[#13193a]">
                  Detalle del siniestro
                </h2>
                <span
                  className={`inline-flex text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_CLS[s.estatus] ?? "bg-gray-100 text-gray-600"}`}
                >
                  {s.estatus}
                </span>
                {!s.ajustador && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />{" "}
                    Sin ajustador
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Folio <span className="font-mono font-semibold">{s.folio}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body 2 columnas */}
        <div className="flex flex-1 overflow-hidden">
          {/* Izquierda */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                Información
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  ["Asegurado", s.asegurado],
                  ["Vehículo", s.vehiculo],
                  ["Fecha", s.fecha],
                  ["Teléfono", "777 100 2233"],
                  ["Póliza", "3413241"],
                  ["Cobertura", "TAXI BÁSICA 2500"],
                ].map(([l, v]) => (
                  <div key={l}>
                    <p className="text-[11px] text-gray-400 mb-0.5">{l}</p>
                    <p className="text-sm font-semibold text-gray-700">{v}</p>
                  </div>
                ))}
                <div className="col-span-2">
                  <p className="text-[11px] text-gray-400 mb-0.5">Ubicación</p>
                  <p className="text-sm text-gray-700">{s.ubicacion}</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Documentos
                </p>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  0 / 4 subidos
                </span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  ["Póliza", "📄"],
                  ["Evidencia", "📷"],
                  ["No. Serie", "🪪"],
                  ["Licencia(s)", "🪪"],
                ].map(([l, ic]) => (
                  <div
                    key={l}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-3 flex flex-col items-center gap-2"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-lg">
                      {ic}
                    </div>
                    <p className="text-[11px] text-gray-400 text-center">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Derecha */}
          <div className="w-64 shrink-0 overflow-y-auto p-5 space-y-5 bg-gray-50/50 border-l border-gray-100">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                Seguimiento
              </p>
              {etapas.map((e, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${e.done ? "border-emerald-500 bg-emerald-500" : "border-gray-300 bg-white"}`}
                    >
                      {e.done && (
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="3.5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    {i < etapas.length - 1 && (
                      <div
                        className={`w-0.5 h-7 my-1 rounded-full ${e.done ? "bg-emerald-200" : "bg-gray-200"}`}
                      />
                    )}
                  </div>
                  <div className="pb-1">
                    <p
                      className={`text-xs font-semibold ${e.done ? "text-[#13193a]" : "text-gray-400"}`}
                    >
                      {e.label}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{e.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                Ajustador
              </p>
              {s.ajustador && !modoAsignar ? (
                <>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#13193a] flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {s.ajustador
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#13193a]">
                        {s.ajustador}
                      </p>
                      <p className="text-[11px] text-gray-400">Asignado</p>
                    </div>
                  </div>
                  <span className="inline-flex text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-semibold">
                    Pendiente de arribo
                  </span>
                  <button
                    onClick={() => setModoAsignar(true)}
                    className="w-full text-xs text-gray-400 hover:text-[#13193a] font-medium mt-1"
                  >
                    Cambiar ajustador
                  </button>
                </>
              ) : !s.ajustador && !modoAsignar ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2.5 bg-red-50 rounded-xl border border-red-200">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                    <p className="text-xs text-red-700 font-bold">
                      Sin ajustador
                    </p>
                  </div>
                  <button
                    onClick={() => setModoAsignar(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-xs font-bold transition-all"
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
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                    Asignar ajustador
                  </button>
                </div>
              ) : null}
              {modoAsignar && (
                <PanelAsignar
                  s={s}
                  onConfirmar={(nombre) => {
                    onAsignar(s.folio, nombre);
                    setModoAsignar(false);
                  }}
                  onCancelar={() => setModoAsignar(false)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex items-center justify-between bg-white">
          <p className="text-xs text-gray-400">Última actualización: hoy</p>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-xs font-semibold transition-all">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Descargar reporte
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export default function Siniestros() {
  const [siniestros, setSiniestros] = useState(SINIESTROS_INIT);
  const [filtroEstatus, setFiltroEstatus] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [modalSiniestro, setModalSiniestro] = useState(null);

  const sinAsignar = siniestros.filter((s) => !s.ajustador).length;

  const filtrados = siniestros.filter((s) => {
    const mb =
      busqueda === "" ||
      s.folio.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.asegurado.toLowerCase().includes(busqueda.toLowerCase());
    const me = filtroEstatus === "Todos" || s.estatus === filtroEstatus;
    return mb && me;
  });

  const asignar = (folio, nombreAjustador) => {
    setSiniestros((prev) =>
      prev.map((s) =>
        s.folio === folio
          ? { ...s, ajustador: nombreAjustador, estatus: "Asignado" }
          : s,
      ),
    );
    setModalSiniestro((prev) =>
      prev?.folio === folio
        ? { ...prev, ajustador: nombreAjustador, estatus: "Asignado" }
        : prev,
    );
  };

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Siniestros</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Consulta, seguimiento y asignación de ajustadores
          </p>
        </div>
        {sinAsignar > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <p className="text-xs font-bold text-red-700">
              {sinAsignar} {sinAsignar === 1 ? "siniestro" : "siniestros"} sin
              ajustador
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-5 py-4 border-b border-gray-100">
          <select
            value={filtroEstatus}
            onChange={(e) => setFiltroEstatus(e.target.value)}
            className="text-xs border border-gray-200 rounded-xl px-3 py-2 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#13193a]/15"
          >
            <option>Todos</option>
            <option>Completado</option>
            <option>Pendiente</option>
            <option>Cancelado</option>
            <option>Activo</option>
            <option>Asignado</option>
          </select>
          <div className="relative ml-auto">
            <svg
              className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
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
              placeholder="Buscar folio o asegurado..."
              className="text-xs border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-gray-600 w-52 bg-white focus:outline-none focus:ring-2 focus:ring-[#13193a]/15"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {[
                  "Folio",
                  "Asegurado",
                  "Vehículo",
                  "Fecha",
                  "Ubicación",
                  "Ajustador",
                  "Estatus",
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
              {filtrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-12 text-sm text-gray-400"
                  >
                    No se encontraron siniestros.
                  </td>
                </tr>
              ) : (
                filtrados.map((s, i) => (
                  <tr
                    key={i}
                    onClick={() => setModalSiniestro(s)}
                    className={`hover:bg-gray-50/60 transition-colors cursor-pointer ${!s.ajustador ? "bg-red-50/20" : ""}`}
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-[#13193a]">
                      {s.folio}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 text-xs font-medium whitespace-nowrap">
                      {s.asegurado}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {s.vehiculo}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                      {s.fecha}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {s.ubicacion}
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      {s.ajustador ? (
                        <span className="text-gray-700 font-medium">
                          {s.ajustador}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-red-600 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                          Sin asignar
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_CLS[s.estatus] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {s.estatus}
                      </span>
                    </td>
                    <td
                      className="px-5 py-3.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex gap-1">
                        <button
                          onClick={() => setModalSiniestro(s)}
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
                        {!s.ajustador && (
                          <button
                            onClick={() => setModalSiniestro(s)}
                            title="Asignar ajustador"
                            className="w-7 h-7 rounded-lg text-red-300 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
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
                                d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
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

        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Mostrando <strong>{filtrados.length}</strong> de{" "}
            <strong>{siniestros.length}</strong>
          </p>
          <div className="flex gap-1">
            <button className="w-7 h-7 rounded-lg text-xs text-gray-400 hover:bg-gray-100">
              ‹
            </button>
            <button className="w-7 h-7 rounded-lg text-xs bg-[#13193a] text-white font-semibold">
              1
            </button>
            <button className="w-7 h-7 rounded-lg text-xs text-gray-400 hover:bg-gray-100">
              ›
            </button>
          </div>
        </div>
      </div>

      {modalSiniestro && (
        <ModalDetalle
          s={modalSiniestro}
          onClose={() => setModalSiniestro(null)}
          onAsignar={asignar}
        />
      )}
    </div>
  );
}
