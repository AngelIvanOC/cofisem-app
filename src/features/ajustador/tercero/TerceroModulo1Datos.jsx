// ============================================================
// src/features/ajustador/tercero/TerceroModulo1Datos.jsx
// Tercero · Módulo 1: Datos personales + licencia del conductor +
// fotos (licencia/INE/tarjeta de circulación). Los lesionados
// adjuntos a este tercero viven en su propio módulo (ver
// TerceroModulo4Lesionados.jsx).
// ============================================================
import { IdCard, CreditCard, FileText } from "lucide-react";
import { Campo, PanelHeader, Seccion, combinarDireccion } from "../shared";
import { BtnEvidencia, useEvidencias } from "../EvidenciaUI";
import DireccionCascada from "../../../shared/components/DireccionCascada";

export default function TerceroModulo1Datos({ siniestro, datos, onDatos, onGuardar, guardando, errorGuardar, guardadoOk, onVolver }) {
  const sid = siniestro.id;
  const num = siniestro.numero_siniestro ?? siniestro.folio;
  const afId = datos._dbId ? `AF${datos._dbId}` : "AF_nuevo";

  const licencia = useEvidencias(sid, num, afId, "licencias");
  const ine = useEvidencias(sid, num, afId, "ine");
  const tarjetaFrente = useEvidencias(sid, num, afId, "tarjeta_circulacion_frente");
  const tarjetaReverso = useEvidencias(sid, num, afId, "tarjeta_circulacion_reverso");

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <PanelHeader titulo="Datos personales" subtitulo="Tercero · Módulo 1 de 5" onVolver={onVolver} />
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-4">

        <Seccion titulo="Datos personales">
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
        </Seccion>

        <Seccion titulo="Licencia del conductor">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Tipo de licencia"   placeholder="Ej. Tipo A" value={datos.licenciaTipo}   onChange={(v) => onDatos("licenciaTipo", v)}   />
              <Campo label="Número de licencia" value={datos.licenciaNumero} onChange={(v) => onDatos("licenciaNumero", v)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Fecha de expedición" type="date" value={datos.licenciaFechaExp} onChange={(v) => onDatos("licenciaFechaExp", v)} />
              <Campo label="Lugar de expedición" value={datos.licenciaLugarExp} onChange={(v) => onDatos("licenciaLugarExp", v)} />
            </div>
            <button
              type="button"
              onClick={() => onDatos("licenciaPermanente", !datos.licenciaPermanente)}
              className="w-full flex items-center justify-between gap-3 py-1"
            >
              <span className="text-xs font-bold text-gray-600">Licencia permanente</span>
              <span className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${datos.licenciaPermanente ? "bg-[#13193a]" : "bg-gray-300"}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${datos.licenciaPermanente ? "translate-x-5" : "translate-x-0"}`} />
              </span>
            </button>
            {!datos.licenciaPermanente && (
              <Campo label="Fecha de vigencia" type="date" value={datos.licenciaFechaVigencia} onChange={(v) => onDatos("licenciaFechaVigencia", v)} />
            )}
          </div>
        </Seccion>

        <Seccion titulo="Fotos">
          <div className="grid grid-cols-2 gap-3">
            <BtnEvidencia label="Licencia" icon={<IdCard className="w-4 h-4 text-gray-400" />} items={licencia.items} onAdd={licencia.agregar} onRemove={licencia.eliminar} />
            <BtnEvidencia label="INE" icon={<CreditCard className="w-4 h-4 text-gray-400" />} items={ine.items} onAdd={ine.agregar} onRemove={ine.eliminar} />
            <BtnEvidencia label="Tarjeta circulación — frente" icon={<FileText className="w-4 h-4 text-gray-400" />} items={tarjetaFrente.items} onAdd={tarjetaFrente.agregar} onRemove={tarjetaFrente.eliminar} />
            <BtnEvidencia label="Tarjeta circulación — reverso" icon={<FileText className="w-4 h-4 text-gray-400" />} items={tarjetaReverso.items} onAdd={tarjetaReverso.agregar} onRemove={tarjetaReverso.eliminar} />
          </div>
        </Seccion>

        <div className="pt-2 pb-6 space-y-2">
          {errorGuardar && <p className="text-xs text-red-500 text-center font-medium">{errorGuardar}</p>}
          {guardadoOk && !errorGuardar && <p className="text-xs text-emerald-600 text-center font-medium">Guardado.</p>}
          <button onClick={onGuardar} disabled={guardando}
            className="w-full py-3.5 rounded-2xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-[#13193a]/15 disabled:opacity-60 disabled:cursor-wait">
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
