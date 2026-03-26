// ============================================================
// src/features/operador/clientes/FormCliente.jsx
// Formulario de alta/edición de cliente (asegurado)
// ============================================================
import { CampoTexto, CampoSelect, BotonesModal } from "../../../shared/forms/Campos";
import { ESTADOS_MX } from "../../../shared/constants/oficinas";

export default function FormCliente({ form, setF, onGuardar, onCancelar, esEdicion, loading }) {
  const valido = form.nombre && form.rfc && form.telefono;

  return (
    <div>
      <div className="p-6 space-y-6">
        {/* Datos personales */}
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Datos personales</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <CampoTexto label="Nombre completo" value={form.nombre} onChange={(v) => setF("nombre", v)} placeholder="Nombre completo del asegurado" req />
            </div>
            <CampoTexto label="RFC"  value={form.rfc}  onChange={(v) => setF("rfc", v)}  placeholder="RFC con homoclave" req />
            <CampoTexto label="CURP" value={form.curp} onChange={(v) => setF("curp", v)} placeholder="CURP" />
            <CampoTexto label="Teléfono" type="tel" value={form.telefono} onChange={(v) => setF("telefono", v)} placeholder="55 0000 0000" req />
            <CampoTexto label="Correo electrónico" type="email" value={form.email} onChange={(v) => setF("email", v)} placeholder="correo@ejemplo.com" />
          </div>
        </div>

        {/* Domicilio */}
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Domicilio</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <CampoTexto label="Calle y número" value={form.calle} onChange={(v) => setF("calle", v)} placeholder="Av. Emiliano Zapata 145" />
            </div>
            <CampoTexto label="Colonia"   value={form.colonia}    onChange={(v) => setF("colonia", v)}    placeholder="Colonia" />
            <CampoTexto label="Municipio" value={form.municipio}  onChange={(v) => setF("municipio", v)}  placeholder="Municipio" />
            <CampoTexto label="C.P."      value={form.cp}         onChange={(v) => setF("cp", v)}         placeholder="62000" />
            <CampoSelect
              label="Estado"
              value={form.estado}
              onChange={(v) => setF("estado", v)}
              opciones={ESTADOS_MX}
            />
          </div>
        </div>
      </div>

      <BotonesModal
        onCancelar={onCancelar}
        onConfirmar={onGuardar}
        textoConfirmar={esEdicion ? "Guardar cambios" : "Registrar cliente"}
        disabled={!valido}
        loading={loading}
      />
    </div>
  );
}
