// ============================================================
// src/features/ajustador/DatosGenerales.jsx
// Botón "Datos Generales" del hub — causa/circunstancia, datos del
// siniestro (clasificación/fecha/hora/ubicación/zona/sentido/
// descripción), versión del asegurado, y el estatus de la póliza
// (solo lectura). Extraído de DatosSiniestro.jsx: lo que era de NA
// (readonly + conductor/licencia) se movió a na/NAModulo1Asegurado.jsx
// y na/NAModulo2Vehiculo.jsx — aquí solo queda lo que es del CASO,
// no de una parte específica.
// ============================================================
import { useState, useEffect } from "react";
import { Campo, CampoSistema, CampoSelect, Seccion, PanelHeader, TIPOS_SINIESTRO, soloCambios } from "./shared";
import { CAUSAS, CIRCUNSTANCIAS } from "../cabinero/constants/catalogos";
import { actualizarDatosSiniestro, fetchDatosSiniestro } from "../../services/siniestros";
import DireccionCascada from "../../shared/components/DireccionCascada";

const ZONAS_ACCIDENTE = ["Casco urbano", "Carr. Red. Gral.", "Carr. Peaje"];
const SENTIDOS_CIRCULACION = ["Nte.", "Sur", "Ote.", "Pte."];

export default function DatosGenerales({ siniestro, onVolver }) {
  const hoy      = new Date();
  const fechaHoy = hoy.toISOString().slice(0, 10);
  const horaHoy  = hoy.toTimeString().slice(0, 5);

  const [tipo,               setTipo]               = useState(siniestro.tipoAjustadorGuardado ?? "");
  const [fechaAccidente,     setFechaAccidente]      = useState(siniestro.fechaSiniestroReportada ?? fechaHoy);
  const [horaAccidente,      setHoraAccidente]       = useState(siniestro.horaSiniestroReportada?.slice(0, 5) ?? horaHoy);
  const [lugar,              setLugar]               = useState(siniestro.ubicacion ?? "");
  const [descripcion,        setDescripcion]         = useState(siniestro.descripcionReportada ?? "");
  const [versionAsegurado,   setVersionAsegurado]    = useState(siniestro.versionAseguradoGuardado ?? "");
  const [zonaAccidente,      setZonaAccidente]       = useState(siniestro.zonaAccidenteGuardada ?? "");
  const [sentidoCirculacion, setSentidoCirculacion]  = useState(siniestro.sentidoCirculacionGuardado ?? "");
  const [ubicacion, setUbicacion] = useState(siniestro.ubicacionEstructurada ?? { estado: "", municipio: "", colonia: "", cp: "" });
  const [causa,         setCausa]         = useState(siniestro.causaReportada ?? "");
  const [circunstancia, setCircunstancia] = useState(siniestro.circunstanciaReportada ?? "");

  const [guardando,    setGuardando]    = useState(false);
  const [errorGuardar, setErrorGuardar] = useState(null);

  const construirOriginal = (fuente) => ({
    tipo: fuente.tipo ?? "",
    fechaAccidente: fuente.fechaAccidente ?? fechaHoy,
    horaAccidente: fuente.horaAccidente ?? horaHoy,
    lugar: fuente.lugar ?? "",
    descripcion: fuente.descripcion ?? "",
    versionAsegurado: fuente.versionAsegurado ?? "",
    zonaAccidente: fuente.zonaAccidente ?? "",
    sentidoCirculacion: fuente.sentidoCirculacion ?? "",
    causa: fuente.causa ?? "",
    circunstancia: fuente.circunstancia ?? "",
    estado: fuente.estado ?? "",
    municipio: fuente.municipio ?? "",
    colonia: fuente.colonia ?? "",
    cp: fuente.cp ?? "",
  });

  const [original, setOriginal] = useState(() => construirOriginal({
    tipo: siniestro.tipoAjustadorGuardado, fechaAccidente: siniestro.fechaSiniestroReportada,
    horaAccidente: siniestro.horaSiniestroReportada?.slice(0, 5), lugar: siniestro.ubicacion,
    descripcion: siniestro.descripcionReportada, versionAsegurado: siniestro.versionAseguradoGuardado,
    zonaAccidente: siniestro.zonaAccidenteGuardada, sentidoCirculacion: siniestro.sentidoCirculacionGuardado,
    causa: siniestro.causaReportada, circunstancia: siniestro.circunstanciaReportada,
    estado: siniestro.ubicacionEstructurada?.estado, municipio: siniestro.ubicacionEstructurada?.municipio,
    colonia: siniestro.ubicacionEstructurada?.colonia, cp: siniestro.ubicacionEstructurada?.cp,
  }));

  useEffect(() => {
    fetchDatosSiniestro(siniestro.id).then((row) => {
      if (!row) return;
      setTipo(row.tipo);
      setFechaAccidente(row.fechaAccidente || fechaHoy);
      setHoraAccidente(row.horaAccidente || horaHoy);
      setLugar(row.lugar);
      setDescripcion(row.descripcion);
      setVersionAsegurado(row.versionAsegurado);
      setZonaAccidente(row.zonaAccidente);
      setSentidoCirculacion(row.sentidoCirculacion);
      setCausa(row.causa);
      setCircunstancia(row.circunstancia);
      setUbicacion({ estado: row.estado, municipio: row.municipio, colonia: row.colonia, cp: row.cp });
      setOriginal(construirOriginal(row));
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siniestro.id]);

  const handleGuardar = async () => {
    setGuardando(true);
    setErrorGuardar(null);
    try {
      const actual = {
        tipo, fechaAccidente, horaAccidente, lugar, descripcion, versionAsegurado,
        zonaAccidente, sentidoCirculacion, causa, circunstancia,
        estado: ubicacion.estado, municipio: ubicacion.municipio, colonia: ubicacion.colonia, cp: ubicacion.cp,
      };
      const cambios = soloCambios(original, actual);
      if (Object.keys(cambios).length) {
        await actualizarDatosSiniestro(siniestro.id, cambios);
        setOriginal(actual);
      }
      // Guardado OK → volver al hub, igual que la flecha atrás.
      onVolver();
    } catch (err) {
      setErrorGuardar(err.message ?? "Error al guardar los datos generales");
    } finally {
      setGuardando(false);
    }
  };

  const p = siniestro.polizaInfo ?? { numero: siniestro.poliza, vigencia: siniestro.vigencia, cobertura: "—", aplicaDeducible: false, porcentajeDeducible: 0 };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <PanelHeader titulo="Datos Generales" subtitulo={`${siniestro.id} · ${siniestro.asegurado}`} onVolver={onVolver} />
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-4">

        <Seccion titulo="Causa y Circunstancia">
          <div className="space-y-3">
            <CampoSelect label="Causa del siniestro" value={causa} onChange={setCausa}
              options={CAUSAS} placeholder="Selecciona la causa..." />
            <CampoSelect label="Circunstancias del accidente" value={circunstancia} onChange={setCircunstancia}
              options={CIRCUNSTANCIAS} placeholder="Selecciona la circunstancia..." />
          </div>
        </Seccion>

        <Seccion titulo="Datos del Siniestro">
          <div className="space-y-3">
            <CampoSelect
              label="Clasificación del ajustador"
              value={tipo}
              onChange={setTipo}
              options={TIPOS_SINIESTRO}
              placeholder="Selecciona el tipo..."
            />
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Fecha del accidente" type="date" value={fechaAccidente} onChange={setFechaAccidente} />
              <Campo label="Hora del accidente"  type="time" value={horaAccidente}  onChange={setHoraAccidente}  />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Ubicación del accidente (confirma o corrige lo que reportó cabinero)</label>
              <DireccionCascada
                values={ubicacion}
                onChange={(patch) => setUbicacion((u) => ({ ...u, ...patch }))}
              />
              <div className="mt-3">
                <Campo label="Calle y número" placeholder="Calle, número..." value={lugar} onChange={setLugar} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <CampoSelect label="Zona del accidente" value={zonaAccidente} onChange={setZonaAccidente}
                options={ZONAS_ACCIDENTE} placeholder="Selecciona la zona..." />
              <CampoSelect label="Sentido de circulación" value={sentidoCirculacion} onChange={setSentidoCirculacion}
                options={SENTIDOS_CIRCULACION} placeholder="Selecciona el sentido..." />
            </div>
            <Campo label="Descripción general de los hechos" placeholder="Describe brevemente lo ocurrido..." rows={3}
              value={descripcion} onChange={setDescripcion} />
          </div>
        </Seccion>

        <Seccion titulo="Estatus de la Póliza" colapsable defaultAbierto={false}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <CampoSistema label="No. Póliza" value={p.numero}   />
              <CampoSistema label="Vigencia"   value={p.vigencia} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <CampoSistema label="Cobertura"  value={p.cobertura} />
              <CampoSistema label="Deducible"  value={p.aplicaDeducible ? `Aplica — ${p.porcentajeDeducible}%` : "No aplica"} />
            </div>
          </div>
        </Seccion>

        <Seccion titulo="Versión del Asegurado">
          <Campo label="Declaración según el asegurado" placeholder="Captura lo que el asegurado describe sobre los hechos..." rows={4}
            value={versionAsegurado} onChange={setVersionAsegurado} />
        </Seccion>

        <div className="pt-2 pb-6 space-y-2">
          {errorGuardar && <p className="text-xs text-red-500 text-center font-medium">{errorGuardar}</p>}
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="w-full py-3.5 rounded-2xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-[#13193a]/15 disabled:opacity-60 disabled:cursor-wait"
          >
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
