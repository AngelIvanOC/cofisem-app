// ============================================================
// src/features/operador/vendedores/FormVendedor.jsx
// Formulario de alta/edición de vendedor
// ============================================================
import { CampoTexto, BotonesModal } from "../../../shared/forms/Campos";

export default function FormVendedor({ form, setF, onGuardar, onCancelar, esEdicion, loading }) {
  const valido = form.nombre && form.folio;

  return (
    <div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <CampoTexto label="Folio" value={form.folio} onChange={(v) => setF("folio", v)} placeholder="T0000" req />
          <CampoTexto label="Nombre completo" value={form.nombre} onChange={(v) => setF("nombre", v)} placeholder="Nombre completo" req />
        </div>
        <CampoTexto label="Teléfono" type="tel" value={form.telefono} onChange={(v) => setF("telefono", v)} placeholder="55 0000 0000" />
        <CampoTexto label="Correo electrónico" type="email" value={form.email} onChange={(v) => setF("email", v)} placeholder="correo@cofisem.com" />
        {!esEdicion && (
          <CampoTexto label="Contraseña" type="password" value={form.password} onChange={(v) => setF("password", v)} placeholder="Contraseña de acceso" req />
        )}
      </div>
      <BotonesModal
        onCancelar={onCancelar}
        onConfirmar={onGuardar}
        textoConfirmar={esEdicion ? "Guardar cambios" : "Registrar vendedor"}
        disabled={!valido}
        loading={loading}
      />
    </div>
  );
}
