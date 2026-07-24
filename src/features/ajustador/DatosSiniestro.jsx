// ============================================================
// src/features/ajustador/DatosSiniestro.jsx
// Paso 2: Datos generales + info del asegurado (readonly, sistema)
// ============================================================
import { useState } from "react";
import { Campo, CampoSistema, CampoSelect, Seccion, TIPOS_SINIESTRO, combinarDireccion } from "./shared";
import { CAUSAS, CIRCUNSTANCIAS } from "../cabinero/constants/catalogos";
import { actualizarDatosSiniestro } from "../../services/siniestros";
import DireccionCascada from "../../shared/components/DireccionCascada";

const ZONAS_ACCIDENTE = ["Casco urbano", "Carr. Red. Gral.", "Carr. Peaje"];
const SENTIDOS_CIRCULACION = ["Nte.", "Sur", "Ote.", "Pte."];

export default function DatosSiniestro({ siniestro, onSiguiente }) {
  const hoy      = new Date();
  const fechaHoy = hoy.toISOString().slice(0, 10);
  const horaHoy  = hoy.toTimeString().slice(0, 5);

  const [tipo,             setTipo]             = useState(siniestro.tipoAjustadorGuardado ?? "");
  const [fechaAccidente,   setFechaAccidente]   = useState(siniestro.fechaSiniestroReportada ?? fechaHoy);
  const [horaAccidente,    setHoraAccidente]    = useState(siniestro.horaSiniestroReportada?.slice(0, 5) ?? horaHoy);
  const [lugar,            setLugar]            = useState(siniestro.ubicacion ?? "");
  const [descripcion,      setDescripcion]      = useState(siniestro.descripcionReportada ?? "");
  // Se pre-carga con lo que el ajustador ya haya guardado antes en este
  // mismo campo — si no, al regresar al paso 1 se veía vacío aunque ya
  // estuviera guardado en BD (parecía que "no se guardaba").
  const [versionAsegurado, setVersionAsegurado] = useState(siniestro.versionAseguradoGuardado ?? "");
  const [zonaAccidente,    setZonaAccidente]    = useState(siniestro.zonaAccidenteGuardada ?? "");
  const [sentidoCirculacion, setSentidoCirculacion] = useState(siniestro.sentidoCirculacionGuardado ?? "");
  // Confirmación/corrección de lo que ya capturó el cabinero al reportar
  // (el PDF pinta colonia/municipio/C.P. aparte de "Lugar del accidente").
  const [ubicacion, setUbicacion] = useState(siniestro.ubicacionEstructurada ?? { estado: "", municipio: "", colonia: "", cp: "" });
  // Causa/Circunstancia — reportadas por el cabinero, el ajustador las
  // confirma o corrige aquí mismo (antes se mostraban de solo lectura en
  // este paso y se volvían a pedir, editables, en "Datos de Ajuste").
  const [causa,         setCausa]         = useState(siniestro.causaReportada ?? "");
  const [circunstancia, setCircunstancia] = useState(siniestro.circunstanciaReportada ?? "");

  // Conductor — quién manejaba (el asegurado o alguien más) ya lo
  // decidió el cabinero al levantar el reporte; aquí no se vuelve a
  // preguntar. Si es el asegurado, sus datos personales ya se conocen;
  // si no, el nombre/teléfono ya los capturó el cabinero (de solo
  // lectura) y solo falta el domicilio + los datos de licencia.
  const conductorEsAsegurado = siniestro.conductorEsTerceroReportado !== true;
  const [conductorDireccion, setConductorDireccion] = useState({ estado: "", municipio: "", colonia: "", cp: "", calle: "", numero: "" });
  const [licenciaTipo,       setLicenciaTipo]       = useState("");
  const [licenciaNumero,     setLicenciaNumero]     = useState("");
  const [licenciaFechaExp,   setLicenciaFechaExp]   = useState("");
  const [licenciaLugarExp,   setLicenciaLugarExp]   = useState("");
  const [fechaNacimiento,    setFechaNacimiento]    = useState("");

  const [guardando,        setGuardando]        = useState(false);
  const [errorGuardar,     setErrorGuardar]     = useState(null);

  const a = siniestro.aseguradoInfo ?? { nombre: siniestro.asegurado };

  const handleSiguiente = async () => {
    setGuardando(true);
    setErrorGuardar(null);
    try {
      // Quién maneja (asegurado o no) ya lo definió el cabinero — este
      // paso ya no lo decide ni lo vuelve a escribir. Domicilio del
      // conductor solo aplica cuando no es el asegurado (si lo es, ya
      // se conoce por a.direccion).
      await actualizarDatosSiniestro(siniestro.id, {
        tipo, fechaAccidente, horaAccidente, lugar, descripcion, versionAsegurado,
        zonaAccidente, sentidoCirculacion,
        causa, circunstancia,
        estado: ubicacion.estado, municipio: ubicacion.municipio, colonia: ubicacion.colonia, cp: ubicacion.cp,
        conductorDomicilio: conductorEsAsegurado ? a.direccion : combinarDireccion(conductorDireccion),
        licenciaTipo, licenciaNumero, licenciaFechaExp, licenciaLugarExp, fechaNacimiento,
      });
      onSiguiente();
    } catch (err) {
      setErrorGuardar(err.message ?? "Error al guardar los datos del siniestro");
    } finally {
      setGuardando(false);
    }
  };

  const p = siniestro.polizaInfo   ?? { numero: siniestro.poliza, vigencia: siniestro.vigencia, cobertura: "—", aplicaDeducible: false, porcentajeDeducible: 0 };
  const v = siniestro.vehiculoInfo  ?? { marca: siniestro.vehiculo };

  return (
    <div className="px-4 py-4 space-y-4">

      {/* ── Causa y Circunstancia — confirma o corrige lo reportado ── */}
      <Seccion titulo="Causa y Circunstancia">
        <div className="space-y-3">
          <CampoSelect label="Causa del siniestro" value={causa} onChange={setCausa}
            options={CAUSAS} placeholder="Selecciona la causa..." />
          <CampoSelect label="Circunstancias del accidente" value={circunstancia} onChange={setCircunstancia}
            options={CIRCUNSTANCIAS} placeholder="Selecciona la circunstancia..." />
        </div>
      </Seccion>

      {/* ── Datos generales del siniestro ─────────────────────── */}
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
              <Campo
                label="Calle y número"
                placeholder="Calle, número..."
                value={lugar}
                onChange={setLugar}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CampoSelect
              label="Zona del accidente"
              value={zonaAccidente}
              onChange={setZonaAccidente}
              options={ZONAS_ACCIDENTE}
              placeholder="Selecciona la zona..."
            />
            <CampoSelect
              label="Sentido de circulación"
              value={sentidoCirculacion}
              onChange={setSentidoCirculacion}
              options={SENTIDOS_CIRCULACION}
              placeholder="Selecciona el sentido..."
            />
          </div>
          <Campo
            label="Descripción general de los hechos"
            placeholder="Describe brevemente lo ocurrido..."
            rows={3}
            value={descripcion}
            onChange={setDescripcion}
          />
        </div>
      </Seccion>

      {/* ── Datos del asegurado (sistema, solo referencia) ────── */}
      <Seccion titulo="Nuestro Asegurado" colapsable defaultAbierto={false}>
        <div className="space-y-3">
          <CampoSistema label="Nombre completo" value={a.nombre} />
          <div className="grid grid-cols-2 gap-3">
            <CampoSistema label="RFC"  value={a.rfc}  />
            <CampoSistema label="CURP" value={a.curp} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CampoSistema label="Teléfono"           value={a.telefono} />
            <CampoSistema label="Correo electrónico" value={a.email}    />
          </div>
          <CampoSistema label="Dirección" value={a.direccion} />
        </div>
      </Seccion>

      {/* ── Datos de la póliza (sistema, solo referencia) ─────── */}
      <Seccion titulo="Datos de la Póliza" colapsable defaultAbierto={false}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <CampoSistema label="No. Póliza" value={p.numero}   />
            <CampoSistema label="Vigencia"   value={p.vigencia} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CampoSistema label="Cobertura"  value={p.cobertura} />
            <CampoSistema
              label="Deducible"
              value={p.aplicaDeducible ? `Aplica — ${p.porcentajeDeducible}%` : "No aplica"}
            />
          </div>
        </div>
      </Seccion>

      {/* ── Vehículo asegurado (sistema, solo referencia) ─────── */}
      <Seccion titulo="Vehículo Asegurado" colapsable defaultAbierto={false}>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <CampoSistema label="Marca"  value={v.marca}  />
            <CampoSistema label="Modelo" value={v.modelo} />
            <CampoSistema label="Año"    value={v.anio}   />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <CampoSistema label="Color"    value={v.color}  />
            <CampoSistema label="Placas"   value={v.placas} />
            <CampoSistema label="No. Serie" value={v.serie} />
          </div>
        </div>
      </Seccion>

      {/* ── Conductor — quién manejaba ya lo dijo el cabinero ─────── */}
      <Seccion titulo="Conductor">
        <div className="space-y-3">
          {conductorEsAsegurado ? (
            <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
              <p className="text-xs font-bold text-[#13193a]">{a.nombre}</p>
              <p className="text-xs text-gray-500">{a.telefono}</p>
              <p className="text-xs text-gray-400">{a.direccion}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <CampoSistema label="Nombre del conductor" value={siniestro.conductorNombreReportado} />
                <CampoSistema label="Teléfono" value={siniestro.conductorTelefonoReportado} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Domicilio</label>
                <DireccionCascada
                  values={conductorDireccion}
                  onChange={(patch) => setConductorDireccion((d) => ({ ...d, ...patch }))}
                />
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <Campo label="Calle" placeholder="Av. Emiliano Zapata" value={conductorDireccion.calle} onChange={(v) => setConductorDireccion((d) => ({ ...d, calle: v }))} />
                  <Campo label="Número" placeholder="145" value={conductorDireccion.numero} onChange={(v) => setConductorDireccion((d) => ({ ...d, numero: v }))} />
                </div>
              </div>
            </>
          )}

          <Campo label="Fecha de nacimiento" type="date" value={fechaNacimiento} onChange={setFechaNacimiento} />
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Tipo de licencia" placeholder="Ej. Tipo A" value={licenciaTipo} onChange={setLicenciaTipo} />
            <Campo label="Número de licencia" value={licenciaNumero} onChange={setLicenciaNumero} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Fecha de expedición" type="date" value={licenciaFechaExp} onChange={setLicenciaFechaExp} />
            <Campo label="Lugar de expedición" value={licenciaLugarExp} onChange={setLicenciaLugarExp} />
          </div>
        </div>
      </Seccion>

      {/* ── Versión de los hechos del asegurado ───────────────── */}
      <Seccion titulo="Versión del Asegurado">
        <Campo
          label="Declaración según el asegurado"
          placeholder="Captura lo que el asegurado describe sobre los hechos..."
          rows={4}
          value={versionAsegurado}
          onChange={setVersionAsegurado}
        />
      </Seccion>

      <div className="pt-2 pb-6 space-y-2">
        {errorGuardar && (
          <p className="text-xs text-red-500 text-center font-medium">{errorGuardar}</p>
        )}
        <button
          onClick={handleSiguiente}
          disabled={guardando}
          className="w-full py-3.5 rounded-2xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-[#13193a]/15 disabled:opacity-60 disabled:cursor-wait"
        >
          {guardando ? "Guardando..." : "Continuar a Partes Involucradas →"}
        </button>
      </div>
    </div>
  );
}
