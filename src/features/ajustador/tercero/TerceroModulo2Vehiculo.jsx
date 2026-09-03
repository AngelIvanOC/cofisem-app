// ============================================================
// src/features/ajustador/tercero/TerceroModulo2Vehiculo.jsx
// Tercero · Módulo 2: Vehículo — datos del vehículo del tercero
// (catálogo AMIS opcional) + fotos (vehículo, número de serie).
// ============================================================
import { useState, useEffect } from "react";
import { CarFront, Hash } from "lucide-react";
import { Campo, PanelHeader, Seccion } from "../shared";
import { BtnEvidencia, useEvidencias } from "../EvidenciaUI";
import { getTodasMarcas, getTiposPorMarca } from "../../../services/vehiculos";

// Selects Marca → Submarca del catálogo AMIS (modo manual, sin año — el
// vehículo de un tercero no está ligado a ninguna póliza GAMAN).
function SelectVehiculoAmis({ marca, submarca, onMarca, onSubmarca }) {
  const [marcas,    setMarcas]    = useState([]);
  const [submarcas, setSubmarcas] = useState([]);
  const [submarcasDe, setSubmarcasDe] = useState(null);

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
        <select value={marca ?? ""} onChange={(e) => onMarca(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all">
          <option value="">Selecciona</option>
          {marcas.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Submarca</label>
        <select value={submarca ?? ""} onChange={(e) => onSubmarca(e.target.value)} disabled={!marca}
          className={`w-full border rounded-xl px-3 py-2.5 text-sm transition-all ${marca ? "border-gray-200 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]" : "border-gray-100 text-gray-400 bg-gray-50 cursor-not-allowed"}`}>
          <option value="">{marca ? "Selecciona" : "Primero marca"}</option>
          {opcionesSubmarca.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
    </div>
  );
}

export default function TerceroModulo2Vehiculo({ siniestro, datos, onDatos, onGuardar, guardando, errorGuardar, onVolver }) {
  const sid = siniestro.id;
  const num = siniestro.numero_siniestro ?? siniestro.folio;
  const afId = datos._dbId ? `AF${datos._dbId}` : "AF_nuevo";

  const veh = useEvidencias(sid, num, afId, "vehiculo");
  const serie = useEvidencias(sid, num, afId, "numero_serie");

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <PanelHeader titulo="Vehículo" subtitulo="Tercero · Módulo 2 de 5" onVolver={onVolver} />
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-4">

        <Seccion titulo="Datos del vehículo afectado">
          <div className="space-y-3">
            <Campo label="Descripción del vehículo (marca / submarca)" placeholder="Ej. Nissan Versa" value={datos.vehiculo} onChange={(v) => onDatos("vehiculo", v)} />
            <SelectVehiculoAmis
              marca={datos.vehiculoMarca}
              submarca={datos.vehiculoSubmarca}
              onMarca={(v) => { onDatos("vehiculoMarca", v); onDatos("vehiculoSubmarca", ""); onDatos("vehiculo", v); }}
              onSubmarca={(v) => { onDatos("vehiculoSubmarca", v); onDatos("vehiculo", [datos.vehiculoMarca, v].filter(Boolean).join(" ")); }}
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
        </Seccion>

        <Seccion titulo="Fotos">
          <div className="grid grid-cols-2 gap-3">
            <BtnEvidencia label="Vehículo" icon={<CarFront className="w-4 h-4 text-gray-400" />} items={veh.items} onAdd={veh.agregar} onRemove={veh.eliminar} />
            <BtnEvidencia label="Núm. de serie" icon={<Hash className="w-4 h-4 text-gray-400" />} items={serie.items} onAdd={serie.agregar} onRemove={serie.eliminar}
              guiaCamara={{ titulo: "Número de serie (VIN)", instructivo: "Encuadra los 17 caracteres del número de serie dentro del recuadro" }} />
          </div>
        </Seccion>

        <div className="pt-2 pb-6 space-y-2">
          {errorGuardar && <p className="text-xs text-red-500 text-center font-medium">{errorGuardar}</p>}
          <button onClick={onGuardar} disabled={guardando}
            className="w-full py-3.5 rounded-2xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-[#13193a]/15 disabled:opacity-60 disabled:cursor-wait">
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
