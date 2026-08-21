// ============================================================
// src/features/ajustador/na/NAModulo1Asegurado.jsx
// Sección NA · Módulo 1: Datos del Asegurado — datos personales
// (readonly, sistema) + fecha de nacimiento + sexo + licencia
// (checkbox "presenta documento" → licencia/identificación oficial +
// switch permanente/vigencia) + tarjeta de circulación ambos lados.
// El bloque "Conductor" de DatosSiniestro.jsx vive aquí completo —
// es siempre del conductor del vehículo ASEGURADO (sea el titular de
// la póliza o no), nunca de un Tercero.
// ============================================================
import { useState, useEffect } from "react";
import { IdCard, CreditCard, FileText } from "lucide-react";
import { Campo, CampoSistema, Seccion, Sep, PanelHeader, soloCambios, combinarDireccion } from "../shared";
import { BtnEvidencia, useEvidencias } from "../EvidenciaUI";
import { actualizarDatosSiniestro, fetchDatosSiniestro } from "../../../services/siniestros";
import DireccionCascada from "../../../shared/components/DireccionCascada";

export default function NAModulo1Asegurado({ siniestro, onVolver }) {
  const sid = siniestro.id;
  const num = siniestro.numero_siniestro ?? siniestro.folio;
  const a = siniestro.aseguradoInfo ?? { nombre: siniestro.asegurado };

  const [conductorEsAsegurado, setConductorEsAsegurado] = useState(true);
  const [conductorNombreReportado,   setConductorNombreReportado]   = useState(null);
  const [conductorTelefonoReportado, setConductorTelefonoReportado] = useState(null);
  const [conductorDireccion, setConductorDireccion] = useState({ estado: "", municipio: "", colonia: "", cp: "", calle: "", numero: "" });
  const [conductorDomicilio, setConductorDomicilio] = useState("");

  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [sexo,            setSexo]            = useState("");

  const [presentaLicencia,      setPresentaLicencia]      = useState(true);
  const [licenciaTipo,          setLicenciaTipo]          = useState("");
  const [licenciaNumero,        setLicenciaNumero]        = useState("");
  const [licenciaFechaExp,      setLicenciaFechaExp]      = useState("");
  const [licenciaLugarExp,      setLicenciaLugarExp]      = useState("");
  const [licenciaPermanente,    setLicenciaPermanente]    = useState(true);
  const [licenciaFechaVigencia, setLicenciaFechaVigencia] = useState("");

  const [guardando,    setGuardando]    = useState(false);
  const [errorGuardar, setErrorGuardar] = useState(null);
  const [guardadoOk,   setGuardadoOk]   = useState(false);

  const construirOriginal = (row) => ({
    conductorDomicilio: row.conductorEsTercero === false ? (a.direccion || "") : (row.conductorDomicilio ?? ""),
    licenciaTipo: row.licenciaTipo ?? "", licenciaNumero: row.licenciaNumero ?? "",
    licenciaFechaExp: row.licenciaFechaExp ?? "", licenciaLugarExp: row.licenciaLugarExp ?? "",
    fechaNacimiento: row.fechaNacimiento ?? "", sexo: row.sexo ?? "",
    presentaLicencia: row.presentaLicencia ?? true,
    licenciaPermanente: row.licenciaPermanente ?? true,
    licenciaFechaVigencia: row.licenciaFechaVigencia ?? "",
  });
  const [original, setOriginal] = useState(construirOriginal({}));

  useEffect(() => {
    fetchDatosSiniestro(sid).then((row) => {
      if (!row) return;
      setConductorEsAsegurado(row.conductorEsTercero !== true);
      setConductorNombreReportado(row.conductorNombreReportado);
      setConductorTelefonoReportado(row.conductorTelefonoReportado);
      setConductorDomicilio(row.conductorDomicilio || "");
      setFechaNacimiento(row.fechaNacimiento || "");
      setSexo(row.sexo || "");
      setLicenciaTipo(row.licenciaTipo || "");
      setLicenciaNumero(row.licenciaNumero || "");
      setLicenciaFechaExp(row.licenciaFechaExp || "");
      setLicenciaLugarExp(row.licenciaLugarExp || "");
      setPresentaLicencia(row.presentaLicencia ?? true);
      setLicenciaPermanente(row.licenciaPermanente ?? true);
      setLicenciaFechaVigencia(row.licenciaFechaVigencia || "");
      setOriginal(construirOriginal(row));
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sid]);

  const actualizarConductorDireccion = (patch) => {
    const next = { ...conductorDireccion, ...patch };
    setConductorDireccion(next);
    setConductorDomicilio(combinarDireccion(next) ?? "");
  };

  const licencia = useEvidencias(sid, num, "NA", "licencias");
  const idOficial = useEvidencias(sid, num, "NA", "identificacion_oficial");
  const tarjetaFrente = useEvidencias(sid, num, "NA", "tarjeta_circulacion_frente");
  const tarjetaReverso = useEvidencias(sid, num, "NA", "tarjeta_circulacion_reverso");

  const handleGuardar = async () => {
    setGuardando(true);
    setErrorGuardar(null);
    setGuardadoOk(false);
    try {
      const actual = {
        conductorDomicilio: conductorEsAsegurado ? (a.direccion || "") : conductorDomicilio,
        licenciaTipo, licenciaNumero, licenciaFechaExp, licenciaLugarExp,
        fechaNacimiento, sexo, presentaLicencia, licenciaPermanente, licenciaFechaVigencia,
      };
      const cambios = soloCambios(original, actual);
      if (Object.keys(cambios).length) {
        await actualizarDatosSiniestro(sid, cambios);
        setOriginal(actual);
      }
      setGuardadoOk(true);
    } catch (err) {
      setErrorGuardar(err.message ?? "Error al guardar los datos del asegurado");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <PanelHeader titulo="Datos del Asegurado" subtitulo="NA · Módulo 1 de 4" onVolver={onVolver} />
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-4">

        <Seccion titulo="NA — Nuestro Asegurado">
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
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Fecha de nacimiento" type="date" value={fechaNacimiento} onChange={setFechaNacimiento} />
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Sexo</label>
                <div className="flex gap-2 h-[42px]">
                  {["Masculino", "Femenino"].map((op) => (
                    <button key={op} onClick={() => setSexo(op)}
                      className={`flex-1 rounded-xl text-xs font-bold border-2 transition-all ${sexo === op ? "bg-[#13193a] text-white border-[#13193a]" : "bg-white text-gray-500 border-gray-200"}`}>
                      {op}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Seccion>

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
                  <CampoSistema label="Nombre del conductor" value={conductorNombreReportado} />
                  <CampoSistema label="Teléfono" value={conductorTelefonoReportado} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Domicilio</label>
                  <DireccionCascada values={conductorDireccion} onChange={actualizarConductorDireccion} />
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <Campo label="Calle" placeholder="Av. Emiliano Zapata" value={conductorDireccion.calle} onChange={(v) => actualizarConductorDireccion({ calle: v })} />
                    <Campo label="Número" placeholder="145" value={conductorDireccion.numero} onChange={(v) => actualizarConductorDireccion({ numero: v })} />
                  </div>
                </div>
              </>
            )}
          </div>
        </Seccion>

        <Seccion titulo="Licencia de conducir">
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setPresentaLicencia((v) => !v)}
              className="w-full flex items-center justify-between gap-3 py-1"
            >
              <span className="text-xs font-bold text-gray-600">Presenta documento (licencia)</span>
              <span className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${presentaLicencia ? "bg-[#13193a]" : "bg-gray-300"}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${presentaLicencia ? "translate-x-5" : "translate-x-0"}`} />
              </span>
            </button>

            {presentaLicencia ? (
              <>
                <BtnEvidencia label="Foto de licencia" icon={<IdCard className="w-4 h-4 text-gray-400" />} items={licencia.items} onAdd={licencia.agregar} onRemove={licencia.eliminar} />
                <div className="grid grid-cols-2 gap-3">
                  <Campo label="Tipo de licencia" placeholder="Ej. Tipo A" value={licenciaTipo} onChange={setLicenciaTipo} />
                  <Campo label="Número de licencia (opcional)" value={licenciaNumero} onChange={setLicenciaNumero} />
                </div>
                <Campo label="Fecha de emisión" type="date" value={licenciaFechaExp} onChange={setLicenciaFechaExp} />

                <button
                  type="button"
                  onClick={() => setLicenciaPermanente((v) => !v)}
                  className="w-full flex items-center justify-between gap-3 py-1"
                >
                  <span className="text-xs font-bold text-gray-600">Licencia permanente</span>
                  <span className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${licenciaPermanente ? "bg-[#13193a]" : "bg-gray-300"}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${licenciaPermanente ? "translate-x-5" : "translate-x-0"}`} />
                  </span>
                </button>
                {!licenciaPermanente && (
                  <Campo label="Fecha de vigencia" type="date" value={licenciaFechaVigencia} onChange={setLicenciaFechaVigencia} />
                )}
                <Campo label="Lugar de expedición" value={licenciaLugarExp} onChange={setLicenciaLugarExp} />
              </>
            ) : (
              <>
                <Sep label="No presenta licencia — identificación oficial" />
                <BtnEvidencia label="Foto de identificación oficial" icon={<CreditCard className="w-4 h-4 text-gray-400" />} items={idOficial.items} onAdd={idOficial.agregar} onRemove={idOficial.eliminar} />
              </>
            )}
          </div>
        </Seccion>

        <Seccion titulo="Tarjeta de circulación">
          <div className="grid grid-cols-2 gap-3">
            <BtnEvidencia label="Frente" icon={<FileText className="w-4 h-4 text-gray-400" />} items={tarjetaFrente.items} onAdd={tarjetaFrente.agregar} onRemove={tarjetaFrente.eliminar} />
            <BtnEvidencia label="Reverso" icon={<FileText className="w-4 h-4 text-gray-400" />} items={tarjetaReverso.items} onAdd={tarjetaReverso.agregar} onRemove={tarjetaReverso.eliminar} />
          </div>
        </Seccion>

        <div className="pt-2 pb-6 space-y-2">
          {errorGuardar && <p className="text-xs text-red-500 text-center font-medium">{errorGuardar}</p>}
          {guardadoOk && !errorGuardar && <p className="text-xs text-emerald-600 text-center font-medium">Guardado.</p>}
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
