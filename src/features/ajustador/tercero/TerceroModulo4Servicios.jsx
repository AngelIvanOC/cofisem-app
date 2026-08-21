// ============================================================
// src/features/ajustador/tercero/TerceroModulo4Servicios.jsx
// Tercero · Módulo 4: Servicios — Pase Taller (documento único por
// SINIESTRO, no por tercero — el schema actual no distingue un pase
// por vehículo remolcado; se edita aquí porque el pase siempre es del
// vehículo del tercero, nunca del asegurado) + "¿Solicitó grúa?" (esa
// sí es por tercero, columna nueva).
// ============================================================
import { useState, useEffect } from "react";
import { Campo, CampoSistema, PanelHeader, Seccion, Sep, soloCambios } from "../shared";
import { guardarPaseTaller, fetchPaseTaller } from "../../../services/siniestros";
import { fetchTalleres } from "../../../services/servicios";

function hoyISO() { return new Date().toISOString().slice(0, 10); }

function ToggleSiNo({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">{label}</label>
      <div className="flex gap-2">
        {[{ v: true, l: "Sí" }, { v: false, l: "No" }].map((op) => (
          <button key={op.l} type="button" onClick={() => onChange(op.v)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${value === op.v ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-500 border-gray-200"}`}>
            {op.l}
          </button>
        ))}
      </div>
    </div>
  );
}

const PASE_TALLER_DEFAULT = {
  definicion: "Tercero", destino: "Taller",
  tallerIdx: "", tallerNombre: "", tallerTel: "", tallerCalle: "", tallerColonia: "",
  tipoResolucion: "Reparación",
  clave: "", vehiculoTipo: "", vehiculoPuertas: "",
  fechaExpedicion: hoyISO(), ordenCondicionada: "",
};

export default function TerceroModulo4Servicios({ siniestro, datos, onDatos, onGuardar, guardando, errorGuardar, guardadoOk, onVolver }) {
  const p = siniestro.polizaInfo ?? {};
  const [activarTaller, setActivarTaller] = useState(false);
  const [paseTaller, setPaseTaller] = useState(PASE_TALLER_DEFAULT);
  const [originalPaseTaller, setOriginalPaseTaller] = useState(PASE_TALLER_DEFAULT);
  const [talleres, setTalleres] = useState([]);
  const [guardandoTaller, setGuardandoTaller] = useState(false);
  const [errorTaller, setErrorTaller] = useState(null);
  const [okTaller, setOkTaller] = useState(false);

  useEffect(() => { fetchTalleres().then(setTalleres).catch(() => setTalleres([])); }, []);

  useEffect(() => {
    fetchPaseTaller(siniestro.id).then((row) => {
      if (!row) return;
      const huboAlgo = Object.values(row).some((v) => v != null && v !== "");
      if (!huboAlgo) return;
      const tallerNombre = row.pase_taller_taller_nombre || "";
      const hydrated = {
        ...PASE_TALLER_DEFAULT,
        clave:             row.pase_taller_clave             || "",
        definicion:        row.pase_taller_definicion         || PASE_TALLER_DEFAULT.definicion,
        destino:           row.pase_taller_destino            || PASE_TALLER_DEFAULT.destino,
        tallerIdx:         tallerNombre ? "manual" : "",
        tallerNombre,
        tallerTel:         row.pase_taller_taller_telefono     || "",
        tallerCalle:       row.pase_taller_taller_calle        || "",
        tallerColonia:     row.pase_taller_taller_colonia      || "",
        vehiculoTipo:      row.pase_taller_vehiculo_tipo       || "",
        vehiculoPuertas:   row.pase_taller_vehiculo_puertas    || "",
        fechaExpedicion:   row.pase_taller_fecha_expedicion    || PASE_TALLER_DEFAULT.fechaExpedicion,
        ordenCondicionada: row.pase_taller_orden_condicionada  || "",
        numeroPase:        row.pase_taller_numero              || "",
      };
      setPaseTaller(hydrated);
      setOriginalPaseTaller(hydrated);
      setActivarTaller(true);
    }).catch(() => {});
  }, [siniestro.id]);

  const set = (patch) => setPaseTaller((v) => ({ ...v, ...patch }));
  const manual = paseTaller.tallerIdx === "manual";
  const taller = !manual && paseTaller.tallerIdx !== "" ? talleres.find((t) => String(t.id) === paseTaller.tallerIdx) : null;

  const handleTallerSelect = (val) => {
    if (val !== "manual" && val !== "") {
      const t = talleres.find((x) => String(x.id) === val);
      if (t) set({ tallerIdx: val, tallerNombre: t.nombre, tallerTel: t.telefono, tallerCalle: t.calle, tallerColonia: t.colonia });
    } else if (val === "manual") {
      set({ tallerIdx: val, tallerNombre: "", tallerTel: "", tallerCalle: "", tallerColonia: "" });
    } else {
      set({ tallerIdx: val });
    }
  };

  const handleGuardarTaller = async () => {
    setGuardandoTaller(true);
    setErrorTaller(null);
    setOkTaller(false);
    try {
      const cambios = soloCambios(originalPaseTaller, paseTaller);
      if (Object.keys(cambios).length) {
        await guardarPaseTaller(siniestro.id, cambios, paseTaller);
        setOriginalPaseTaller(paseTaller);
      }
      setOkTaller(true);
    } catch (err) {
      setErrorTaller(err.message ?? "Error al guardar el Pase Taller");
    } finally {
      setGuardandoTaller(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <PanelHeader titulo="Servicios" subtitulo="Tercero · Módulo 5 de 5" onVolver={onVolver} />
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-4">

        <Seccion titulo="Grúa">
          <ToggleSiNo label="¿Solicitó grúa para este vehículo?" value={datos.solicitoGrua} onChange={(v) => onDatos("solicitoGrua", v)} />
          <div className="pt-3 space-y-2">
            {errorGuardar && <p className="text-xs text-red-500 text-center font-medium">{errorGuardar}</p>}
            {guardadoOk && !errorGuardar && <p className="text-xs text-emerald-600 text-center font-medium">Guardado.</p>}
            <button onClick={onGuardar} disabled={guardando}
              className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#13193a] text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-wait">
              {guardando ? "Guardando..." : "Guardar grúa"}
            </button>
          </div>
        </Seccion>

        <Seccion titulo="Pase Taller">
          <p className="text-[11px] text-gray-400 mb-3">Este documento es único para todo el siniestro (no uno por tercero).</p>
          <button
            type="button"
            onClick={() => setActivarTaller((v) => !v)}
            className="w-full flex items-center justify-between gap-3 py-1 mb-3"
          >
            <span className="text-xs font-bold text-gray-600">Generar Pase Taller</span>
            <span className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${activarTaller ? "bg-[#13193a]" : "bg-gray-300"}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${activarTaller ? "translate-x-5" : "translate-x-0"}`} />
            </span>
          </button>

          {activarTaller && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Destino del vehículo</label>
                <div className="flex gap-2">
                  {["Taller", "Domicilio"].map((op) => (
                    <button key={op} onClick={() => set({ destino: op })}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${paseTaller.destino === op ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-500 border-gray-200"}`}>
                      {op}
                    </button>
                  ))}
                </div>
              </div>

              {paseTaller.destino === "Taller" && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Taller asignado</label>
                    <select value={paseTaller.tallerIdx} onChange={(e) => handleTallerSelect(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all">
                      <option value="">Selecciona un taller...</option>
                      {talleres.map((t) => <option key={t.id} value={String(t.id)}>{t.nombre}</option>)}
                      <option value="manual">Otro taller (capturar manualmente)</option>
                    </select>
                  </div>
                  {(manual || taller) && (
                    <div className={manual ? "space-y-3 bg-gray-50 rounded-xl p-3" : "bg-gray-50 rounded-xl p-3 space-y-1.5"}>
                      {manual ? (
                        <>
                          <Campo label="Nombre del taller" placeholder="Nombre" value={paseTaller.tallerNombre} onChange={(v) => set({ tallerNombre: v })} />
                          <Campo label="Teléfono" type="tel" placeholder="55 0000 0000" value={paseTaller.tallerTel} onChange={(v) => set({ tallerTel: v })} />
                          <Campo label="Calle, No. Exterior e interior" placeholder="Calle y número" value={paseTaller.tallerCalle} onChange={(v) => set({ tallerCalle: v })} />
                          <Campo label="Colonia" placeholder="Colonia" value={paseTaller.tallerColonia} onChange={(v) => set({ tallerColonia: v })} />
                        </>
                      ) : (
                        <>
                          <p className="text-xs font-bold text-[#13193a]">{taller.nombre}</p>
                          <p className="text-xs text-gray-500">{taller.telefono}</p>
                          <p className="text-xs text-gray-400">{taller.calle}, {taller.colonia}</p>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Tipo de resolución</label>
                <div className="flex gap-2">
                  {["Reparación", "Pérdida total"].map((op) => (
                    <button key={op} onClick={() => set({ tipoResolucion: op })}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${paseTaller.tipoResolucion === op ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-500 border-gray-200"}`}>
                      {op}
                    </button>
                  ))}
                </div>
              </div>

              <Sep label="Deducible (póliza)" />
              <div className="grid grid-cols-2 gap-3">
                <CampoSistema label="Aplica deducible" value={p.aplicaDeducible ? "Sí" : "No"} />
                <CampoSistema label="Porcentaje"       value={p.aplicaDeducible ? `${p.porcentajeDeducible}%` : "—"} />
              </div>

              <Sep label="Datos del pase" />
              <div className="grid grid-cols-2 gap-3">
                <CampoSistema label="Número de pase" value={paseTaller.numeroPase} placeholder="Se asigna al finalizar" />
                <Campo label="Clave" placeholder="000" value={paseTaller.clave} onChange={(v) => set({ clave: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Tipo (carrocería)" placeholder="Sedán, Pickup..." value={paseTaller.vehiculoTipo} onChange={(v) => set({ vehiculoTipo: v })} />
                <Campo label="Puertas" placeholder="4" value={paseTaller.vehiculoPuertas} onChange={(v) => set({ vehiculoPuertas: v })} />
              </div>
              <Campo label="Fecha de expedición" type="date" value={paseTaller.fechaExpedicion} onChange={(v) => set({ fechaExpedicion: v })} />
              <Campo label="Orden condicionada a" placeholder="Ej. Pago en efectivo de $... en..." rows={3}
                value={paseTaller.ordenCondicionada} onChange={(v) => set({ ordenCondicionada: v })} />

              <div className="pt-2 space-y-2">
                {errorTaller && <p className="text-xs text-red-500 text-center font-medium">{errorTaller}</p>}
                {okTaller && !errorTaller && <p className="text-xs text-emerald-600 text-center font-medium">Guardado.</p>}
                <button onClick={handleGuardarTaller} disabled={guardandoTaller}
                  className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#13193a] text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-wait">
                  {guardandoTaller ? "Guardando..." : "Guardar Pase Taller"}
                </button>
              </div>
            </div>
          )}
        </Seccion>
      </div>
    </div>
  );
}
