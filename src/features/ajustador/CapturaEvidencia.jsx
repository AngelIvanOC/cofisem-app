// ============================================================
// src/features/ajustador/CapturaDatosEvidencia.jsx
// Paso 2 unificado: datos personales + evidencia + mapa de daños
// por cada vehículo involucrado (NA + afectados)
// ============================================================
import { useState, useRef, useCallback } from "react";
import { Campo, AfectadoTag } from "./shared";
import ModeloDanos from "./ModeloDanos";

// ── Sub-sección con título ────────────────────────────────────
function SubSeccion({ titulo, icon, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <p className="text-xs font-bold text-[#13193a] uppercase tracking-wide">
          {titulo}
        </p>
      </div>
      {children}
    </div>
  );
}

// ── Botón de subida de archivo ────────────────────────────────
function BotonEvidencia({ tipo, label, icon, evidencias, onAdd, onRemove }) {
  const ref = useRef();
  const total = evidencias.length;
  return (
    <div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const urls = Array.from(e.target.files || []).map((f) =>
            URL.createObjectURL(f),
          );
          urls.forEach((url) => onAdd(url));
        }}
      />
      <button
        onClick={() => ref.current?.click()}
        className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-3 flex flex-col items-center gap-1.5 hover:border-[#13193a]/25 hover:bg-gray-50 transition-all active:scale-[0.98]"
      >
        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl">
          {icon}
        </div>
        <p className="text-xs font-semibold text-gray-600">{label}</p>
        {total > 0 && (
          <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 font-bold">
            {total} archivo{total > 1 ? "s" : ""}
          </span>
        )}
      </button>
      {total > 0 && (
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {evidencias.map((url, i) => (
            <div
              key={i}
              className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-100"
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => onRemove(i)}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
              >
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Panel de un vehículo (datos + evidencia + mapa) ───────────
function PanelVehiculo({ titulo, esNA, datos, onDatos, modeloKey }) {
  const [evidencias, setEvidencias] = useState({
    fotos: [],
    licencia: [],
    poliza: [],
    vehiculo: [],
  });

  const addEv = (tipo, url) =>
    setEvidencias((ev) => ({ ...ev, [tipo]: [...ev[tipo], url] }));
  const remEv = (tipo, i) =>
    setEvidencias((ev) => ({
      ...ev,
      [tipo]: ev[tipo].filter((_, j) => j !== i),
    }));

  const setF = (k, v) => onDatos(k, v);

  return (
    <div className="border-2 border-gray-100 rounded-2xl overflow-hidden">
      {/* Header del panel */}
      <div className="bg-[#13193a] px-4 py-3">
        <p className="text-sm font-bold text-white">{titulo}</p>
        <p className="text-white/50 text-xs mt-0.5">
          {esNA ? "Nuestro asegurado" : "Tercero / Afectado"}
        </p>
      </div>

      <div className="p-4 space-y-5">
        {/* ── 1. Datos personales ── */}
        <SubSeccion titulo="Datos Personales" icon="🧑">
          <div className="space-y-3">
            <Campo
              label="Nombre completo"
              placeholder="Nombre del conductor"
              value={datos.nombre}
              onChange={(v) => setF("nombre", v)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Campo
                label="RFC"
                placeholder="RFC"
                value={datos.rfc}
                onChange={(v) => setF("rfc", v)}
              />
              <Campo
                label="Teléfono"
                type="tel"
                placeholder="55 0000 0000"
                value={datos.telefono}
                onChange={(v) => setF("telefono", v)}
              />
            </div>
            <Campo
              label="Dirección"
              placeholder="Dirección completa"
              value={datos.direccion}
              onChange={(v) => setF("direccion", v)}
            />
            <Campo
              label="CURP"
              placeholder="CURP"
              value={datos.curp}
              onChange={(v) => setF("curp", v)}
            />
          </div>
        </SubSeccion>

        <div className="border-t border-gray-100" />

        {/* ── 2. Datos del vehículo ── */}
        <SubSeccion titulo="Datos del Vehículo" icon="🚗">
          <div className="space-y-3">
            {esNA ? (
              // Para NA los datos de póliza vienen precargados (readonly)
              <div className="grid grid-cols-2 gap-3">
                <Campo label="No. Póliza" value={datos.poliza} readonly />
                <Campo label="Vigencia" value={datos.vigencia} readonly />
                <Campo label="Vehículo" value={datos.vehiculo} readonly />
                <Campo label="Placas" value={datos.placas} readonly />
              </div>
            ) : (
              // Para terceros se captura todo
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Campo
                    label="Marca / Modelo"
                    placeholder="Ej. Nissan Tsuru"
                    value={datos.vehiculo}
                    onChange={(v) => setF("vehiculo", v)}
                  />
                  <Campo
                    label="Placas"
                    placeholder="ABC-123X"
                    value={datos.placas}
                    onChange={(v) => setF("placas", v)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Campo
                    label="Color"
                    placeholder="Color"
                    value={datos.color}
                    onChange={(v) => setF("color", v)}
                  />
                  <Campo
                    label="Modelo (año)"
                    placeholder="2020"
                    value={datos.modelo}
                    onChange={(v) => setF("modelo", v)}
                  />
                  <Campo
                    label="No. Serie"
                    placeholder="17 caracteres"
                    value={datos.serie}
                    onChange={(v) => setF("serie", v)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Campo
                    label="Aseguradora"
                    placeholder="Aseguradora (si tiene)"
                    value={datos.aseguradora}
                    onChange={(v) => setF("aseguradora", v)}
                  />
                  <Campo
                    label="No. Póliza tercero"
                    placeholder="Póliza (si tiene)"
                    value={datos.polizaTercero}
                    onChange={(v) => setF("polizaTercero", v)}
                  />
                </div>
              </div>
            )}
          </div>
        </SubSeccion>

        <div className="border-t border-gray-100" />

        {/* ── 3. Declaración / versión de hechos ── */}
        <SubSeccion titulo="Declaración" icon="📋">
          <Campo
            label={
              esNA
                ? "Versión de los hechos (nuestro asegurado)"
                : "Versión de los hechos (afectado)"
            }
            placeholder="Describir lo sucedido según esta parte..."
            rows={3}
            value={datos.declaracion}
            onChange={(v) => setF("declaracion", v)}
          />
          {!esNA && (
            <div className="mt-3 flex items-center gap-3">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                ¿Lesiones reportadas?
              </label>
              <div className="flex gap-2">
                {["Sí", "No"].map((op) => (
                  <button
                    key={op}
                    onClick={() => setF("lesiones", op === "Sí")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border-2 transition-all ${
                      (datos.lesiones === true && op === "Sí") ||
                      (datos.lesiones === false && op === "No")
                        ? "bg-[#13193a] text-white border-[#13193a]"
                        : "bg-white text-gray-500 border-gray-200"
                    }`}
                  >
                    {op}
                  </button>
                ))}
              </div>
            </div>
          )}
        </SubSeccion>

        <div className="border-t border-gray-100" />

        {/* ── 4. Evidencia fotográfica ── */}
        <SubSeccion titulo="Evidencia y Documentos" icon="📸">
          <div className="grid grid-cols-2 gap-3">
            <BotonEvidencia
              tipo="fotos"
              label="Evidencias del siniestro"
              icon="📸"
              evidencias={evidencias.fotos}
              onAdd={(u) => addEv("fotos", u)}
              onRemove={(i) => remEv("fotos", i)}
            />
            <BotonEvidencia
              tipo="licencia"
              label="Licencia de conducir"
              icon="🪪"
              evidencias={evidencias.licencia}
              onAdd={(u) => addEv("licencia", u)}
              onRemove={(i) => remEv("licencia", i)}
            />
            <BotonEvidencia
              tipo="vehiculo"
              label="Fotos del vehículo"
              icon="🚗"
              evidencias={evidencias.vehiculo}
              onAdd={(u) => addEv("vehiculo", u)}
              onRemove={(i) => remEv("vehiculo", i)}
            />
            {esNA && (
              <BotonEvidencia
                tipo="poliza"
                label="Póliza física"
                icon="📄"
                evidencias={evidencias.poliza}
                onAdd={(u) => addEv("poliza", u)}
                onRemove={(i) => remEv("poliza", i)}
              />
            )}
          </div>
        </SubSeccion>

        <div className="border-t border-gray-100" />

        {/* ── 5. Mapa de daños ── */}
        <SubSeccion titulo="Mapa de Daños — Vehículo 360°" icon="🗺️">
          <p className="text-[11px] text-gray-400 mb-2">
            Toca sobre la silueta del vehículo para marcar zonas dañadas
          </p>
          <ModeloDanos instanceKey={modeloKey} />
        </SubSeccion>
      </div>
    </div>
  );
}

// ── Datos vacíos por participante ─────────────────────────────
const datosVacios = (extra = {}) => ({
  nombre: "",
  rfc: "",
  curp: "",
  direccion: "",
  telefono: "",
  vehiculo: "",
  placas: "",
  color: "",
  modelo: "",
  serie: "",
  aseguradora: "",
  polizaTercero: "",
  declaracion: "",
  lesiones: null,
  ...extra,
});

// ── Paso principal ────────────────────────────────────────────
export default function CapturaDatosEvidencia({ siniestro, onSiguiente }) {
  const [afectadoActivo, setAfectadoActivo] = useState("NA");

  // Datos por participante: "NA" + "AF1", "AF2", etc.
  const [participantes, setParticipantes] = useState({
    NA: datosVacios({
      poliza: siniestro.poliza,
      vigencia: siniestro.vigencia,
      vehiculo: siniestro.vehiculo ?? "",
    }),
  });

  const [afectadosIds, setAfectadosIds] = useState([]); // ["AF1", "AF2", ...]

  const agregarAfectado = () => {
    const n = afectadosIds.length + 1;
    const id = `AF${n}`;
    setAfectadosIds((ids) => [...ids, id]);
    setParticipantes((p) => ({ ...p, [id]: datosVacios() }));
    setAfectadoActivo(id);
  };

  const eliminarAfectado = (id) => {
    setAfectadosIds((ids) => ids.filter((x) => x !== id));
    setParticipantes((p) => {
      const np = { ...p };
      delete np[id];
      return np;
    });
    if (afectadoActivo === id) setAfectadoActivo("NA");
  };

  const actualizarDato = useCallback((id, campo, valor) => {
    setParticipantes((p) => ({ ...p, [id]: { ...p[id], [campo]: valor } }));
  }, []);

  const todos = ["NA", ...afectadosIds];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Selector de participante + botón agregar ── */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          {todos.map((id) => {
            const label =
              id === "NA"
                ? "NA (Asegurado)"
                : `Afectado ${id.replace("AF", "")}`;
            return (
              <div key={id} className="flex items-center gap-1">
                <AfectadoTag
                  label={label}
                  active={afectadoActivo === id}
                  onClick={() => setAfectadoActivo(id)}
                />
                {id !== "NA" && (
                  <button
                    onClick={() => eliminarAfectado(id)}
                    className="w-5 h-5 rounded-full bg-gray-200 hover:bg-red-100 hover:text-red-600 flex items-center justify-center text-gray-400 transition-all"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
          <button
            onClick={agregarAfectado}
            className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 text-gray-400 hover:border-[#13193a]/40 hover:text-[#13193a] flex items-center justify-center font-bold text-lg transition-all"
            title="Agregar afectado"
          >
            +
          </button>
        </div>
      </div>

      {/* ── Contenido con scroll ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 space-y-4 pb-32">
          {/* Renderiza el panel del participante activo */}
          {todos.map((id) => (
            <div
              key={id}
              className={id === afectadoActivo ? "block" : "hidden"}
            >
              <PanelVehiculo
                titulo={
                  id === "NA"
                    ? "Nuestro Asegurado (NA)"
                    : `Afectado #${id.replace("AF", "")}`
                }
                esNA={id === "NA"}
                datos={participantes[id] ?? datosVacios()}
                onDatos={(campo, valor) => actualizarDato(id, campo, valor)}
                modeloKey={id}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Botón continuar — fijo al fondo ── */}
      <div className="px-4 py-4 border-t border-gray-100 bg-white shrink-0">
        <button
          onClick={onSiguiente}
          className="w-full py-3.5 rounded-2xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-[#13193a]/15"
        >
          Continuar a Documentos →
        </button>
      </div>
    </div>
  );
}
