// ============================================================
// src/features/ajustador/CapturaEvidencia.jsx
// Paso 3: Partes involucradas + evidencia + modelo de daños
//   Cada foto se comprime y sube a Supabase Storage en tiempo real
// ============================================================
import { useState, useEffect, useRef, useCallback } from "react";
import { Campo, CampoSistema, Sep, AfectadoTag, combinarDireccion, sumaMontosDanos, formatMonto } from "./shared";
import { subirEvidencia, eliminarEvidencia } from "../../services/evidencias";
import { guardarPartesInvolucradas } from "../../services/siniestros";
import DireccionCascada from "../../shared/components/DireccionCascada";
import { getTodasMarcas, getTiposPorMarca } from "../../services/vehiculos";
import DanosMarcadores from "./danos/DanosMarcadores";

// ── Botón de evidencia con upload real ───────────────────────
// Cada item: { localUrl, storagePath, uploading, error }
function BtnEvidencia({ label, icon, items, onAdd, onRemove }) {
  const ref = useRef();

  const handleFiles = (e) => {
    Array.from(e.target.files || []).forEach((file) => {
      const localUrl = URL.createObjectURL(file);
      onAdd({ localUrl, storagePath: null, uploading: true, error: null, file });
    });
    e.target.value = "";
  };

  const uploadCount  = items.filter((i) => i.uploading).length;
  const doneCount    = items.filter((i) => !i.uploading && !i.error).length;
  const errorCount   = items.filter((i) => i.error).length;

  return (
    <div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
        onChange={handleFiles}
      />
      <button
        onClick={() => ref.current?.click()}
        className="w-full py-8 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center gap-1.5 hover:border-[#13193a]/25 hover:bg-gray-50 transition-all active:scale-[0.98]"
      >
        <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
          {icon ? <span className="text-lg">{icon}</span> : (
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </div>
        <p className="text-xs font-semibold text-gray-500 text-center leading-snug px-2">{label}</p>
        {doneCount > 0 && (
          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 font-bold">
            {doneCount} subida{doneCount > 1 ? "s" : ""}
          </span>
        )}
        {uploadCount > 0 && (
          <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-2 py-0.5 font-bold">
            {uploadCount} subiendo...
          </span>
        )}
        {errorCount > 0 && (
          <span className="text-[10px] bg-red-50 text-red-600 border border-red-200 rounded-full px-2 py-0.5 font-bold">
            {errorCount} error
          </span>
        )}
      </button>

      {items.length > 0 && (
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {items.map((item, i) => (
            <div key={i} className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-100">
              <img src={item.localUrl} alt="" className="w-full h-full object-cover" />

              {/* Spinner de subida */}
              {item.uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
              {/* Check de éxito */}
              {!item.uploading && !item.error && (
                <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {/* Error */}
              {item.error && (
                <div className="absolute inset-0 bg-red-600/70 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                  </svg>
                </div>
              )}

              {/* Botón eliminar */}
              {!item.uploading && (
                <button
                  onClick={() => onRemove(i, item.storagePath)}
                  className="absolute bottom-0.5 left-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center"
                >
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Hook: gestiona la colección de items + upload de cada uno ─
function useEvidencias(siniestroId, numeroSiniestro, participante, tipo) {
  const [items, setItems] = useState([]);

  const agregar = useCallback(({ localUrl, file }) => {
    const idx = Date.now() + Math.random();
    setItems((prev) => [...prev, { localUrl, storagePath: null, uploading: true, error: null, _idx: idx }]);

    subirEvidencia({ siniestroId, numeroSiniestro, participante, tipo, file })
      .then((path) => {
        setItems((prev) =>
          prev.map((it) => it._idx === idx ? { ...it, storagePath: path, uploading: false } : it)
        );
      })
      .catch((err) => {
        setItems((prev) =>
          prev.map((it) => it._idx === idx ? { ...it, uploading: false, error: err.message ?? "Error" } : it)
        );
      });
  }, [siniestroId, numeroSiniestro, participante, tipo]);

  const eliminar = useCallback((i, storagePath) => {
    setItems((prev) => prev.filter((_, j) => j !== i));
    if (storagePath) eliminarEvidencia(storagePath).catch(() => {});
  }, []);

  return { items, agregar, eliminar };
}

// ── Panel Nuestro Asegurado ───────────────────────────────────
function PanelNA({ siniestro, datos, onDatos }) {
  const sid  = siniestro.id;
  const num  = siniestro.numero_siniestro ?? siniestro.folio;
  const a    = siniestro.aseguradoInfo ?? { nombre: siniestro.asegurado };
  const v    = siniestro.vehiculoInfo  ?? {};

  const sin  = useEvidencias(sid, num, "NA", "siniestro");
  const veh  = useEvidencias(sid, num, "NA", "vehiculo");
  const doc  = useEvidencias(sid, num, "NA", "documentacion");
  const dan  = useEvidencias(sid, num, "NA", "danos");
  const serie = useEvidencias(sid, num, "NA", "numero_serie");

  // "Monto estimado del daño" se calcula solo, sumando el monto que se
  // le puso a cada punto marcado en "Daños del Siniestro" (los de
  // "Daños Preexistentes" no llevan monto, solo nota) — se muestra en
  // vivo con este valor derivado y se guarda en cuanto cambian los
  // marcadores (ver onChange de DanosMarcadores más abajo), no hace
  // falta un useEffect.
  const sumaDanos = sumaMontosDanos(datos.danosSiniestro);

  return (
    <div className="border-2 border-gray-100 rounded-2xl overflow-hidden">
      <div className="bg-[#13193a] px-4 py-3">
        <p className="text-sm font-bold text-white">Nuestro Asegurado (N.A.)</p>
        <p className="text-white/50 text-xs mt-0.5">{a.nombre}</p>
      </div>
      <div className="p-4 space-y-4">

        {/* Resumen del vehículo */}
        <div className="bg-blue-50/60 rounded-xl p-3 border border-blue-100 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-blue-800">{v.marca} {v.modelo} {v.anio}{v.color ? ` · ${v.color}` : ""}</p>
            {v.placas && <p className="text-[11px] text-blue-600 mt-0.5">Placas: {v.placas}</p>}
            {v.serie  && <p className="text-[11px] text-blue-500">Serie: {v.serie}</p>}
          </div>
          <span className="text-[9px] font-bold text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded-full uppercase tracking-wide shrink-0">Sistema</span>
        </div>

        <Sep label="Evidencia fotográfica" />
        <div className="grid grid-cols-2 gap-3">
          <BtnEvidencia label="Siniestro" icon="📸"
            items={sin.items} onAdd={sin.agregar} onRemove={sin.eliminar} />
          <BtnEvidencia label="Vehículo" icon="🚗"
            items={veh.items} onAdd={veh.agregar} onRemove={veh.eliminar} />
          <BtnEvidencia label="Documentación" icon="📄"
            items={doc.items} onAdd={doc.agregar} onRemove={doc.eliminar} />
          <BtnEvidencia label="Daños" icon="🔍"
            items={dan.items} onAdd={dan.agregar} onRemove={dan.eliminar} />
          <BtnEvidencia label="Núm. de serie" icon="🔢"
            items={serie.items} onAdd={serie.agregar} onRemove={serie.eliminar} />
        </div>

        <Sep label="Mapa de daños" />
        <div className="space-y-3">
          <DanosMarcadores
            titulo="Daños del Siniestro"
            value={datos.danosSiniestro}
            onChange={(v) => { onDatos("danosSiniestro", v); onDatos("montoEstimado", sumaMontosDanos(v)); }}
          />
          <DanosMarcadores titulo="Daños Preexistentes" value={datos.danosPreexistente} onChange={(v) => onDatos("danosPreexistente", v)} soloNota />
        </div>

        <Sep label="Daños del vehículo asegurado" />
        <div className="space-y-3">
          <Campo label="Descripción de daños" placeholder="Describe los daños del vehículo..." rows={2}
            value={datos.descripcionDano} onChange={(v) => onDatos("descripcionDano", v)} />
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">¿Abrir reserva?</label>
            <div className="flex gap-2">
              {["Sí", "No"].map((op) => (
                <button key={op} onClick={() => onDatos("abrirReserva", op === "Sí")}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                    (datos.abrirReserva === true  && op === "Sí") ? "bg-red-500 text-white border-red-500" :
                    (datos.abrirReserva === false && op === "No") ? "bg-[#13193a] text-white border-[#13193a]" :
                    "bg-white text-gray-500 border-gray-200"
                  }`}>
                  {op}
                </button>
              ))}
            </div>
          </div>
          <CampoSistema label="Monto estimado del daño" value={formatMonto(sumaDanos)} />
        </div>
      </div>
    </div>
  );
}

// ── Selects Marca → Submarca del catálogo AMIS (modo manual, sin año —
// el vehículo de un tercero no está ligado a ninguna póliza GAMAN) ──
function SelectVehiculoAmis({ marca, submarca, onMarca, onSubmarca }) {
  const [marcas,    setMarcas]    = useState([]);
  const [submarcas, setSubmarcas] = useState([]);
  const [submarcasDe, setSubmarcasDe] = useState(null); // marca a la que pertenece `submarcas`

  useEffect(() => {
    getTodasMarcas().then(setMarcas).catch(() => setMarcas([]));
  }, []);

  useEffect(() => {
    if (!marca) return;
    let cancelado = false;
    getTiposPorMarca(marca)
      .then((s) => { if (!cancelado) { setSubmarcas(s); setSubmarcasDe(marca); } })
      .catch(() => { if (!cancelado) { setSubmarcas([]); setSubmarcasDe(marca); } });
    return () => { cancelado = true; };
  }, [marca]);

  const opcionesSubmarca = submarcasDe === marca ? submarcas : [];

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Marca</label>
        <select
          value={marca ?? ""}
          onChange={(e) => onMarca(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all"
        >
          <option value="">Selecciona</option>
          {marcas.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Submarca</label>
        <select
          value={submarca ?? ""}
          onChange={(e) => onSubmarca(e.target.value)}
          disabled={!marca}
          className={`w-full border rounded-xl px-3 py-2.5 text-sm transition-all ${marca ? "border-gray-200 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]" : "border-gray-100 text-gray-400 bg-gray-50 cursor-not-allowed"}`}
        >
          <option value="">{marca ? "Selecciona" : "Primero marca"}</option>
          {opcionesSubmarca.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
    </div>
  );
}

// ── Panel Tercero Afectado ─────────────────────────────────────
function PanelAfectado({ idx, afId, siniestro, datos, onDatos }) {
  const sid  = siniestro.id;
  const num  = siniestro.numero_siniestro ?? siniestro.folio;

  const sin  = useEvidencias(sid, num, afId, "siniestro");
  const veh  = useEvidencias(sid, num, afId, "vehiculo");
  const doc  = useEvidencias(sid, num, afId, "documentacion");
  const dan  = useEvidencias(sid, num, afId, "danos");
  const serie = useEvidencias(sid, num, afId, "numero_serie");

  // "Monto estimado del daño" se calcula solo, sumando el monto de cada
  // punto marcado en "Daños del Siniestro" (ver onChange de
  // DanosMarcadores más abajo).
  const sumaDanos = sumaMontosDanos(datos.danosSiniestro);

  return (
    <div className="border-2 border-gray-100 rounded-2xl overflow-hidden">
      <div className="bg-[#13193a] px-4 py-3">
        <p className="text-sm font-bold text-white">Tercero Involucrado {idx}</p>
        <p className="text-white/50 text-xs mt-0.5">Captura los datos del afectado</p>
      </div>
      <div className="p-4 space-y-4">

        <Sep label="Datos personales" />
        <div className="space-y-3">
          <Campo label="Nombre completo" placeholder="Nombre del afectado" value={datos.nombre} onChange={(v) => onDatos("nombre", v)} />
          <div className="grid grid-cols-3 gap-3">
            <Campo label="Edad" type="number" placeholder="Años" value={datos.edad} onChange={(v) => onDatos("edad", v)} />
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Sexo</label>
              <div className="flex gap-2 h-[42px]">
                {["Masculino", "Femenino"].map((op) => (
                  <button key={op} onClick={() => onDatos("sexo", op)}
                    className={`flex-1 rounded-xl text-xs font-bold border-2 transition-all ${datos.sexo === op ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-500 border-gray-200"}`}>
                    {op}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Teléfono"  type="tel"   placeholder="55 0000 0000"      value={datos.telefono} onChange={(v) => onDatos("telefono", v)} />
            <Campo label="Correo"    type="email" placeholder="correo@ejemplo.com" value={datos.email}    onChange={(v) => onDatos("email", v)}    />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="RFC"  placeholder="RFC con homoclave" value={datos.rfc}  onChange={(v) => onDatos("rfc", v)}  />
            <Campo label="CURP" placeholder="CURP"              value={datos.curp} onChange={(v) => onDatos("curp", v)} />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Dirección</label>
            <DireccionCascada
              values={{ estado: datos.direccionEstado, municipio: datos.direccionMunicipio, colonia: datos.direccionColonia, cp: datos.direccionCp }}
              onChange={(patch) => {
                const next = { estado: datos.direccionEstado, municipio: datos.direccionMunicipio, colonia: datos.direccionColonia, cp: datos.direccionCp, calle: datos.direccionCalle, numero: datos.direccionNumero, ...patch };
                onDatos("direccionEstado", next.estado);
                onDatos("direccionMunicipio", next.municipio);
                onDatos("direccionColonia", next.colonia);
                onDatos("direccionCp", next.cp);
                onDatos("direccion", combinarDireccion(next));
              }}
            />
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Campo label="Calle" placeholder="Av. Emiliano Zapata" value={datos.direccionCalle} onChange={(v) => {
                onDatos("direccionCalle", v);
                onDatos("direccion", combinarDireccion({ estado: datos.direccionEstado, municipio: datos.direccionMunicipio, colonia: datos.direccionColonia, cp: datos.direccionCp, calle: v, numero: datos.direccionNumero }));
              }} />
              <Campo label="Número" placeholder="145" value={datos.direccionNumero} onChange={(v) => {
                onDatos("direccionNumero", v);
                onDatos("direccion", combinarDireccion({ estado: datos.direccionEstado, municipio: datos.direccionMunicipio, colonia: datos.direccionColonia, cp: datos.direccionCp, calle: datos.direccionCalle, numero: v }));
              }} />
            </div>
          </div>
        </div>

        <Sep label="Datos del vehículo afectado" />
        <div className="space-y-3">
          <SelectVehiculoAmis
            marca={datos.vehiculoMarca}
            submarca={datos.vehiculoSubmarca}
            onMarca={(v) => {
              onDatos("vehiculoMarca", v);
              onDatos("vehiculoSubmarca", "");
              onDatos("vehiculo", v);
            }}
            onSubmarca={(v) => {
              onDatos("vehiculoSubmarca", v);
              onDatos("vehiculo", [datos.vehiculoMarca, v].filter(Boolean).join(" "));
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Año" placeholder="2020" value={datos.anio} onChange={(v) => onDatos("anio", v)} />
            <Campo label="Color" placeholder="Color" value={datos.color} onChange={(v) => onDatos("color", v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Placas" placeholder="ABC-123X" value={datos.placas} onChange={(v) => onDatos("placas", v)} />
            <Campo label="Número de serie" placeholder="17 dígitos" value={datos.serie} onChange={(v) => onDatos("serie", v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Tipo"  placeholder="Sedán, Pickup..." value={datos.vehiculoTipo}  onChange={(v) => onDatos("vehiculoTipo", v)}  />
            <Campo label="Motor" placeholder="No. de motor"     value={datos.vehiculoMotor} onChange={(v) => onDatos("vehiculoMotor", v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Aseguradora"    placeholder="Si aplica" value={datos.aseguradora}   onChange={(v) => onDatos("aseguradora", v)}   />
            <Campo label="Póliza tercero" placeholder="Si aplica" value={datos.polizaTercero} onChange={(v) => onDatos("polizaTercero", v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="No. de reporte" value={datos.reporteTercero}   onChange={(v) => onDatos("reporteTercero", v)}   />
            <Campo label="Cobertura"      value={datos.coberturaTercero} onChange={(v) => onDatos("coberturaTercero", v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Vencimiento" type="date" value={datos.vencimientoTercero} onChange={(v) => onDatos("vencimientoTercero", v)} />
            <Campo label="Ajustador del tercero" value={datos.ajustadorTercero} onChange={(v) => onDatos("ajustadorTercero", v)} />
          </div>
        </div>

        <Sep label="Licencia del conductor" />
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Tipo de licencia"   placeholder="Ej. Tipo A" value={datos.licenciaTipo}   onChange={(v) => onDatos("licenciaTipo", v)}   />
            <Campo label="Número de licencia" value={datos.licenciaNumero} onChange={(v) => onDatos("licenciaNumero", v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Fecha de expedición" type="date" value={datos.licenciaFechaExp} onChange={(v) => onDatos("licenciaFechaExp", v)} />
            <Campo label="Lugar de expedición" value={datos.licenciaLugarExp} onChange={(v) => onDatos("licenciaLugarExp", v)} />
          </div>
        </div>

        <Sep label="Daños del vehículo del tercero" />
        <div className="space-y-3">
          <Campo label="Descripción de daños" placeholder="Describe los daños del vehículo..." rows={2}
            value={datos.descripcionDano} onChange={(v) => onDatos("descripcionDano", v)} />
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">¿Abrir reserva?</label>
            <div className="flex gap-2">
              {["Sí", "No"].map((op) => (
                <button key={op} onClick={() => onDatos("abrirReserva", op === "Sí")}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                    (datos.abrirReserva === true  && op === "Sí") ? "bg-red-500 text-white border-red-500" :
                    (datos.abrirReserva === false && op === "No") ? "bg-[#13193a] text-white border-[#13193a]" :
                    "bg-white text-gray-500 border-gray-200"
                  }`}>
                  {op}
                </button>
              ))}
            </div>
          </div>
          <CampoSistema label="Monto estimado del daño" value={formatMonto(sumaDanos)} />
        </div>

        <Sep label="Versión de los hechos" />
        <Campo label="Declaración del afectado"
          placeholder="Captura la versión de los hechos según indica el afectado..."
          rows={3} value={datos.declaracion} onChange={(v) => onDatos("declaracion", v)} />

        <Sep label="Evidencia y documentos" />
        <div className="grid grid-cols-2 gap-3">
          <BtnEvidencia label="Siniestro" icon="📸"
            items={sin.items} onAdd={sin.agregar} onRemove={sin.eliminar} />
          <BtnEvidencia label="Vehículo" icon="🚗"
            items={veh.items} onAdd={veh.agregar} onRemove={veh.eliminar} />
          <BtnEvidencia label="Documentación" icon="📄"
            items={doc.items} onAdd={doc.agregar} onRemove={doc.eliminar} />
          <BtnEvidencia label="Daños" icon="🔍"
            items={dan.items} onAdd={dan.agregar} onRemove={dan.eliminar} />
          <BtnEvidencia label="Núm. de serie" icon="🔢"
            items={serie.items} onAdd={serie.agregar} onRemove={serie.eliminar} />
        </div>

        <Sep label="Mapa de daños" />
        <div className="space-y-3">
          <DanosMarcadores
            titulo="Daños del Siniestro"
            value={datos.danosSiniestro}
            onChange={(v) => { onDatos("danosSiniestro", v); onDatos("montoEstimado", sumaMontosDanos(v)); }}
          />
          <DanosMarcadores titulo="Daños Preexistentes" value={datos.danosPreexistente} onChange={(v) => onDatos("danosPreexistente", v)} soloNota />
        </div>
      </div>
    </div>
  );
}

const datosAfectadoVacio = () => ({
  nombre: "", edad: "", sexo: "", telefono: "", email: "",
  rfc: "", curp: "", direccion: "",
  direccionEstado: "", direccionMunicipio: "", direccionColonia: "", direccionCp: "", direccionCalle: "", direccionNumero: "",
  vehiculo: "", vehiculoMarca: "", vehiculoSubmarca: "", anio: "", color: "", placas: "", serie: "",
  vehiculoTipo: "", vehiculoMotor: "",
  aseguradora: "", polizaTercero: "",
  reporteTercero: "", coberturaTercero: "", vencimientoTercero: "", ajustadorTercero: "",
  licenciaTipo: "", licenciaNumero: "", licenciaFechaExp: "", licenciaLugarExp: "",
  descripcionDano: "", abrirReserva: null, montoEstimado: "",
  danosSiniestro: {}, danosPreexistente: {},
  declaracion: "",
});

const datosNAVacio = () => ({
  descripcionDano: "", abrirReserva: null, montoEstimado: "",
  danosSiniestro: {}, danosPreexistente: {},
});

export default function CapturaDatosEvidencia({ siniestro, onSiguiente }) {
  const [activo,       setActivo]       = useState("NA");
  const [afectadosIds, setAfectadosIds] = useState(["AF1"]);
  const [afectados,    setAfectados]    = useState({ AF1: datosAfectadoVacio() });
  const [datosNA,      setDatosNA]      = useState(datosNAVacio());
  const [guardando,    setGuardando]    = useState(false);
  const [errorGuardar, setErrorGuardar] = useState(null);

  const handleSiguiente = async () => {
    setGuardando(true);
    setErrorGuardar(null);
    try {
      await guardarPartesInvolucradas(siniestro.id, afectadosIds, afectados, datosNA);
      onSiguiente();
    } catch (err) {
      setErrorGuardar(err.message ?? "Error al guardar las partes involucradas");
    } finally {
      setGuardando(false);
    }
  };

  const actualizarDatoNA = useCallback((campo, valor) => {
    setDatosNA((d) => ({ ...d, [campo]: valor }));
  }, []);

  const agregarAfectado = () => {
    const n  = afectadosIds.length + 1;
    const id = `AF${n}`;
    setAfectadosIds((ids) => [...ids, id]);
    setAfectados((a) => ({ ...a, [id]: datosAfectadoVacio() }));
    setActivo(id);
  };

  const eliminarAfectado = (id) => {
    if (afectadosIds.length <= 1) return;
    setAfectadosIds((ids) => ids.filter((x) => x !== id));
    setAfectados((a) => { const n = { ...a }; delete n[id]; return n; });
    if (activo === id) setActivo("NA");
  };

  const actualizarDato = useCallback((id, campo, valor) => {
    setAfectados((a) => ({ ...a, [id]: { ...a[id], [campo]: valor } }));
  }, []);

  const todos = ["NA", ...afectadosIds];

  return (
    <div className="px-4 py-4 space-y-4">

      {/* Selector de participantes */}
      <div className="bg-gray-50 rounded-2xl p-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Partes involucradas</p>
        <div className="flex items-center gap-2 flex-wrap">
          {todos.map((id) => {
            const label = id === "NA" ? "N.A." : `Tercero ${id.replace("AF", "")}`;
            return (
              <div key={id} className="flex items-center gap-1">
                <AfectadoTag label={label} active={activo === id} onClick={() => setActivo(id)} />
                {id !== "NA" && afectadosIds.length > 1 && (
                  <button onClick={() => eliminarAfectado(id)}
                    className="w-4 h-4 rounded-full bg-gray-200 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-gray-400 transition-all">
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
          <button onClick={agregarAfectado} title="Agregar tercero"
            className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 text-gray-400 hover:border-[#13193a]/40 hover:text-[#13193a] flex items-center justify-center font-bold text-base transition-all">
            +
          </button>
        </div>
      </div>

      {/* Paneles */}
      {todos.map((id) => (
        <div key={id} className={id === activo ? "block" : "hidden"}>
          {id === "NA" ? (
            <PanelNA siniestro={siniestro} datos={datosNA} onDatos={actualizarDatoNA} />
          ) : (
            <PanelAfectado
              idx={id.replace("AF", "")}
              afId={id}
              siniestro={siniestro}
              datos={afectados[id] ?? datosAfectadoVacio()}
              onDatos={(campo, valor) => actualizarDato(id, campo, valor)}
            />
          )}
        </div>
      ))}

      <div className="pt-2 pb-6 space-y-2">
        {errorGuardar && (
          <p className="text-xs text-red-500 text-center font-medium">{errorGuardar}</p>
        )}
        <button onClick={handleSiguiente} disabled={guardando}
          className="w-full py-3.5 rounded-2xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-[#13193a]/15 disabled:opacity-60 disabled:cursor-wait">
          {guardando ? "Guardando..." : "Continuar a Lesionados →"}
        </button>
      </div>
    </div>
  );
}
