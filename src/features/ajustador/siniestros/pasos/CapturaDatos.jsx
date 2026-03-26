// ============================================================
// src/features/ajustador/siniestros/pasos/CapturaDatos.jsx
// Paso 2: Verificar y capturar datos de asegurado y tercero
// ============================================================
import { useState } from "react";
import { CampoTexto } from "../../../../shared/forms/Campos";

export default function CapturaDatos({ siniestro, onSiguiente, onAnterior }) {
  const [licencia,   setLicencia]   = useState("");
  const [tarjCirc,   setTarjCirc]   = useState("");
  const [noSerie,    setNoSerie]     = useState("");
  const [polizaFis,  setPolizaFis]  = useState("");
  const [notasAse,   setNotasAse]   = useState("");

  // Tercero
  const [t_nombre,   setTNombre]    = useState(siniestro.tercero?.nombre   ?? "");
  const [t_placas,   setTPlacas]    = useState(siniestro.tercero?.placas   ?? "");
  const [t_vehiculo, setTVehiculo]  = useState(siniestro.tercero?.vehiculo ?? "");
  const [t_licencia, setTLicencia]  = useState("");
  const [t_tel,      setTTel]       = useState(siniestro.tercero?.tel      ?? "");

  const valido = licencia && tarjCirc && noSerie;

  return (
    <div className="space-y-5">
      {/* Datos asegurado */}
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100 pb-2 mb-3">
          Documentos del asegurado
        </p>
        <div className="grid grid-cols-2 gap-3">
          <CampoTexto label="No. licencia"       value={licencia}  onChange={setLicencia}  placeholder="Número de licencia"     req />
          <CampoTexto label="Tarjeta circulación" value={tarjCirc}  onChange={setTarjCirc}  placeholder="No. tarjeta circulación" req />
          <CampoTexto label="No. de serie"       value={noSerie}   onChange={setNoSerie}   placeholder="17 caracteres"           req />
          <CampoTexto label="Póliza (física)"    value={polizaFis} onChange={setPolizaFis} placeholder="No. póliza impresa"          />
        </div>
        <div className="mt-3">
          <CampoTexto label="Notas del asegurado" value={notasAse} onChange={setNotasAse} placeholder="Declaración, versión de los hechos..." rows={2} />
        </div>
      </div>

      {/* Datos tercero (si aplica) */}
      {siniestro.tercero && (
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100 pb-2 mb-3">
            Documentos del tercero
          </p>
          <div className="grid grid-cols-2 gap-3">
            <CampoTexto label="Nombre"    value={t_nombre}   onChange={setTNombre}   placeholder="Nombre completo"    />
            <CampoTexto label="Teléfono"  value={t_tel}      onChange={setTTel}      placeholder="777-000-0000"       />
            <CampoTexto label="Placas"    value={t_placas}   onChange={setTPlacas}   placeholder="ABC-123"            />
            <CampoTexto label="Vehículo"  value={t_vehiculo} onChange={setTVehiculo} placeholder="Marca, modelo, año" />
            <CampoTexto label="Licencia"  value={t_licencia} onChange={setTLicencia} placeholder="No. licencia"       />
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={onAnterior} className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          ← Atrás
        </button>
        <button
          onClick={() => onSiguiente({ licencia, tarjCirc, noSerie, polizaFis, notasAse, tercero: siniestro.tercero ? { ...siniestro.tercero, nombre: t_nombre, placas: t_placas, vehiculo: t_vehiculo, tel: t_tel, licencia: t_licencia } : null })}
          disabled={!valido}
          className="flex-1 py-3 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white font-bold text-sm transition-all disabled:opacity-40"
        >
          Continuar →
        </button>
      </div>
    </div>
  );
}
