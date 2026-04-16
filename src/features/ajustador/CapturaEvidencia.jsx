// ============================================================
// src/features/ajustador/CapturaDatosEvidencia.jsx
// Bloque normal — fluye dentro del flex-1 overflow-y-auto del padre
// Selector de participante en la parte superior (parte del flujo, no sticky)
// Botón al final del contenido
// ============================================================
import { useState, useRef, useCallback } from "react";
import { Campo, AfectadoTag } from "./shared";
import ModeloDanos3D from "./ModeloDanos";

function Sep({ label }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px bg-gray-100" />
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0">
        {label}
      </p>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

function BtnEvidencia({ label, evidencias, onAdd, onRemove, icon }) {
  const ref = useRef();
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
          Array.from(e.target.files || [])
            .map((f) => URL.createObjectURL(f))
            .forEach((u) => onAdd(u));
          e.target.value = "";
        }}
      />
      <button
        onClick={() => ref.current?.click()}
        className="w-full py-10 border-2 border-dashed border-gray-200 rounded-2xl p-3 flex flex-col items-center gap-1.5 hover:border-[#13193a]/25 hover:bg-gray-50 transition-all active:scale-[0.98]"
      >
        <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
          {icon ? (
            <span className="text-lg">{icon}</span>
          ) : (
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 9l7.89 5.26a2 2 0 002.22 0L21 9M5 10a2 2 0 11-4 0 2 2 0 014 0zm7-1a2 2 0 11-4 0 2 2 0 014 0zm7-1a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          )}
        </div>
        <p className="text-xs font-semibold text-gray-500 text-center leading-snug">
          {label}
        </p>
        {evidencias.length > 0 && (
          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 font-bold">
            {evidencias.length} archivo{evidencias.length > 1 ? "s" : ""}
          </span>
        )}
      </button>
      {evidencias.length > 0 && (
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

function PanelVehiculo({ esNA, datos, onDatos, modeloKey }) {
  const [ev, setEv] = useState({
    fotos: [],
    licencia: [],
    vehiculo: [],
    poliza: [],
  });
  const addEv = (t, u) => setEv((e) => ({ ...e, [t]: [...e[t], u] }));
  const remEv = (t, i) =>
    setEv((e) => ({ ...e, [t]: e[t].filter((_, j) => j !== i) }));

  return (
    <div className="border-2 border-gray-100 rounded-2xl overflow-hidden">
      <div className="bg-[#13193a] px-4 py-3">
        <p className="text-sm font-bold text-white">
          {esNA ? "NA" : "Afectado"}
        </p>
        <p className="text-white/50 text-xs mt-0.5">
          {esNA ? "Vehículo asegurado" : "Tercero involucrado"}
        </p>
      </div>

      <div className="p-4 space-y-4">
        <Sep label="Datos personales" />
        <div className="space-y-3">
          <Campo
            label="Nombre completo"
            placeholder="Nombre del conductor"
            value={datos.nombre}
            onChange={(v) => onDatos("nombre", v)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Campo
              label="RFC"
              placeholder="RFC con homoclave"
              value={datos.rfc}
              onChange={(v) => onDatos("rfc", v)}
            />
            <Campo
              label="Teléfono"
              type="tel"
              placeholder="55 0000 0000"
              value={datos.telefono}
              onChange={(v) => onDatos("telefono", v)}
            />
          </div>
          <Campo
            label="Dirección"
            placeholder="Dirección completa"
            value={datos.direccion}
            onChange={(v) => onDatos("direccion", v)}
          />
          <Campo
            label="CURP"
            placeholder="CURP"
            value={datos.curp}
            onChange={(v) => onDatos("curp", v)}
          />
        </div>

        <Sep label="Datos del vehículo" />
        {esNA ? (
          <div className="grid grid-cols-2 gap-3">
            <Campo label="No. Póliza" value={datos.poliza} readonly />
            <Campo label="Vigencia" value={datos.vigencia} readonly />
            <Campo label="Vehículo" value={datos.vehiculo} readonly />
            <Campo label="Placas" value={datos.placas} readonly />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Campo
                label="Marca / Modelo"
                placeholder="Ej. Nissan Tsuru"
                value={datos.vehiculo}
                onChange={(v) => onDatos("vehiculo", v)}
              />
              <Campo
                label="Placas"
                placeholder="ABC-123X"
                value={datos.placas}
                onChange={(v) => onDatos("placas", v)}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Campo
                label="Color"
                placeholder="Color"
                value={datos.color}
                onChange={(v) => onDatos("color", v)}
              />
              <Campo
                label="Año"
                placeholder="2020"
                value={datos.modelo}
                onChange={(v) => onDatos("modelo", v)}
              />
              <Campo
                label="Serie"
                placeholder="17 dígitos"
                value={datos.serie}
                onChange={(v) => onDatos("serie", v)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Campo
                label="Aseguradora"
                placeholder="Si aplica"
                value={datos.aseguradora}
                onChange={(v) => onDatos("aseguradora", v)}
              />
              <Campo
                label="Póliza tercero"
                placeholder="Si aplica"
                value={datos.polizaTercero}
                onChange={(v) => onDatos("polizaTercero", v)}
              />
            </div>
          </div>
        )}

        <Sep label="Declaración" />
        <Campo
          label={
            esNA
              ? "Versión de los hechos (asegurado)"
              : "Versión de los hechos (afectado)"
          }
          placeholder="Describir lo ocurrido según esta parte..."
          rows={3}
          value={datos.declaracion}
          onChange={(v) => onDatos("declaracion", v)}
        />
        {!esNA && (
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
              Lesiones reportadas
            </label>
            <div className="flex gap-2">
              {["Sí", "No"].map((op) => (
                <button
                  key={op}
                  onClick={() => onDatos("lesiones", op === "Sí")}
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

        <Sep label="Evidencia y documentos" />
        <div className="grid grid-cols-2 gap-3">
          <BtnEvidencia
            label="Fotos del siniestro"
            icon="📸"
            evidencias={ev.fotos}
            onAdd={(u) => addEv("fotos", u)}
            onRemove={(i) => remEv("fotos", i)}
          />
          <BtnEvidencia
            label="Licencia de conducir"
            icon="🪪"
            evidencias={ev.licencia}
            onAdd={(u) => addEv("licencia", u)}
            onRemove={(i) => remEv("licencia", i)}
          />
          <BtnEvidencia
            label="Fotos del vehículo"
            evidencias={ev.vehiculo}
            onAdd={(u) => addEv("vehiculo", u)}
            icon="🚗"
            onRemove={(i) => remEv("vehiculo", i)}
          />
          {esNA && (
            <BtnEvidencia
              label="Póliza física"
              icon="📄"
              evidencias={ev.poliza}
              onAdd={(u) => addEv("poliza", u)}
              onRemove={(i) => remEv("poliza", i)}
            />
          )}
        </div>

        <Sep label="Mapa de daños 3D" />
        <p className="text-[11px] text-gray-400 -mt-2">
          Arrastra para girar el vehículo · Toca la carrocería para marcar zonas
          dañadas
        </p>
        <ModeloDanos3D instanceKey={modeloKey} />
      </div>
    </div>
  );
}

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

export default function CapturaDatosEvidencia({ siniestro, onSiguiente }) {
  const [activo, setActivo] = useState("NA");
  const [afectadosIds, setAfectadosIds] = useState(["AF1"]);
  const [participantes, setParticipantes] = useState({
    NA: datosVacios({
      poliza: siniestro.poliza,
      vigencia: siniestro.vigencia,
      vehiculo: siniestro.vehiculo ?? "",
    }),
    AF1: datosVacios(),
  });

  const agregarAfectado = () => {
    const n = afectadosIds.length + 1;
    const id = `AF${n}`;
    setAfectadosIds((ids) => [...ids, id]);
    setParticipantes((p) => ({ ...p, [id]: datosVacios() }));
    setActivo(id);
  };

  const eliminarAfectado = (id) => {
    if (afectadosIds.length <= 1) return;
    setAfectadosIds((ids) => ids.filter((x) => x !== id));
    setParticipantes((p) => {
      const np = { ...p };
      delete np[id];
      return np;
    });
    if (activo === id) setActivo("NA");
  };

  const actualizarDato = useCallback((id, campo, valor) => {
    setParticipantes((p) => ({ ...p, [id]: { ...p[id], [campo]: valor } }));
  }, []);

  const todos = ["NA", ...afectadosIds];

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Selector de participante */}
      <div className="bg-gray-50 rounded-2xl p-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
          Partes involucradas
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {todos.map((id) => {
            const label =
              id === "NA" ? "NA" : `Afectado ${id.replace("AF", "")}`;
            return (
              <div key={id} className="flex items-center gap-1">
                <AfectadoTag
                  label={label}
                  active={activo === id}
                  onClick={() => setActivo(id)}
                />
                {id !== "NA" && afectadosIds.length > 1 && (
                  <button
                    onClick={() => eliminarAfectado(id)}
                    className="w-4 h-4 rounded-full bg-gray-200 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-gray-400 transition-all"
                  >
                    <svg
                      className="w-2.5 h-2.5"
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
            className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 text-gray-400 hover:border-[#13193a]/40 hover:text-[#13193a] flex items-center justify-center font-bold text-base transition-all"
          >
            +
          </button>
        </div>
      </div>

      {/* Panel del participante activo */}
      {todos.map((id) => (
        <div key={id} className={id === activo ? "block" : "hidden"}>
          <PanelVehiculo
            esNA={id === "NA"}
            datos={participantes[id] ?? datosVacios()}
            onDatos={(campo, valor) => actualizarDato(id, campo, valor)}
            modeloKey={id}
          />
        </div>
      ))}

      {/* Botón al fondo del contenido */}
      <div className="pt-2 pb-6">
        <button
          onClick={onSiguiente}
          className="w-full py-3.5 rounded-2xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-[#13193a]/15"
        >
          Continuar a Documentos
        </button>
      </div>
    </div>
  );
}
