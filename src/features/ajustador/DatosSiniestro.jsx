// ============================================================
// src/features/ajustador/DatosSiniestro.jsx
// Paso 2: Datos generales + info del asegurado (readonly, sistema)
// ============================================================
import { useState } from "react";
import { Campo, CampoSistema, CampoSelect, Seccion, TIPOS_SINIESTRO } from "./shared";

export default function DatosSiniestro({ siniestro, onSiguiente }) {
  const hoy      = new Date();
  const fechaHoy = hoy.toISOString().slice(0, 10);
  const horaHoy  = hoy.toTimeString().slice(0, 5);

  const [tipo,             setTipo]             = useState("");
  const [fechaAccidente,   setFechaAccidente]   = useState(fechaHoy);
  const [horaAccidente,    setHoraAccidente]    = useState(horaHoy);
  const [lugar,            setLugar]            = useState(siniestro.ubicacion ?? "");
  const [descripcion,      setDescripcion]      = useState("");
  const [versionAsegurado, setVersionAsegurado] = useState("");

  const p = siniestro.polizaInfo   ?? { numero: siniestro.poliza, vigencia: siniestro.vigencia, cobertura: "—", aplicaDeducible: false, porcentajeDeducible: 0 };
  const a = siniestro.aseguradoInfo ?? { nombre: siniestro.asegurado };
  const v = siniestro.vehiculoInfo  ?? { marca: siniestro.vehiculo };

  return (
    <div className="px-4 py-4 space-y-4">

      {/* ── Datos generales del siniestro ─────────────────────── */}
      <Seccion titulo="Datos del Siniestro">
        <div className="space-y-3">
          <CampoSelect
            label="Tipo de siniestro"
            value={tipo}
            onChange={setTipo}
            options={TIPOS_SINIESTRO}
            placeholder="Selecciona el tipo..."
          />
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Fecha del accidente" type="date" value={fechaAccidente} onChange={setFechaAccidente} />
            <Campo label="Hora del accidente"  type="time" value={horaAccidente}  onChange={setHoraAccidente}  />
          </div>
          <Campo
            label="Lugar del accidente"
            placeholder="Calle, número, colonia, ciudad..."
            value={lugar}
            onChange={setLugar}
          />
          <Campo
            label="Descripción general de los hechos"
            placeholder="Describe brevemente lo ocurrido..."
            rows={3}
            value={descripcion}
            onChange={setDescripcion}
          />
        </div>
      </Seccion>

      {/* ── Datos del asegurado (sistema) ─────────────────────── */}
      <Seccion titulo="Nuestro Asegurado">
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

      {/* ── Datos de la póliza (sistema) ──────────────────────── */}
      <Seccion titulo="Datos de la Póliza">
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

      {/* ── Vehículo asegurado (sistema) ──────────────────────── */}
      <Seccion titulo="Vehículo Asegurado">
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

      <div className="pt-2 pb-6">
        <button
          onClick={onSiguiente}
          className="w-full py-3.5 rounded-2xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-[#13193a]/15"
        >
          Continuar a Partes Involucradas →
        </button>
      </div>
    </div>
  );
}
