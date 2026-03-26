// ============================================================
// src/features/administracion/usuarios/FormUsuario.jsx
// Formulario de alta/edición de usuario del sistema
// ============================================================
import { CampoTexto, CampoSelect, BotonesModal } from "../../../shared/forms/Campos";
import { OFICINAS } from "../../../shared/constants/oficinas";

const ROLES = ["OPERADOR","ANALISTA","CABINERO_SINIESTROS","AJUSTADOR","SUPERVISOR_SINIESTROS","VENTAS","ADMINISTRACION"];
const OFICINAS_USUARIO = [...OFICINAS, "TODAS (Admin)"];

const ROL_DESC = {
  ADMINISTRACION:        "Acceso total al sistema.",
  ANALISTA:              "Ve todas las oficinas. Aplica pólizas y pagos.",
  OPERADOR:              "Gestiona su oficina. Cotiza y tramita pólizas.",
  CABINERO_SINIESTROS:   "Reporta y consulta siniestros.",
  AJUSTADOR:             "Atiende siniestros asignados en campo.",
  SUPERVISOR_SINIESTROS: "Supervisa y reasigna siniestros.",
  VENTAS:                "Consulta metas y reportes de ventas.",
};

const formatRol = (r) => r.split("_").map((w) => w[0] + w.slice(1).toLowerCase()).join(" ");

export default function FormUsuario({ form, setF, onGuardar, onCancelar, esNuevo, loading }) {
  const valido = form.nombre && form.apellido && form.email && form.rol && form.oficina && (esNuevo ? form.password : true);

  return (
    <div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <CampoTexto label="Nombre"   value={form.nombre}   onChange={(v) => setF("nombre", v)}   placeholder="Nombre"   req />
          <CampoTexto label="Apellido" value={form.apellido} onChange={(v) => setF("apellido", v)} placeholder="Apellido" req />
        </div>
        <CampoTexto label="Correo electrónico" type="email" value={form.email} onChange={(v) => setF("email", v)} placeholder="usuario@cofisem.mx" req />
        {esNuevo && (
          <>
            <CampoTexto label="Contraseña temporal" type="password" value={form.password} onChange={(v) => setF("password", v)} placeholder="Mínimo 8 caracteres" req />
            <p className="text-[11px] text-gray-400 -mt-2">El usuario deberá cambiarla en su primer inicio de sesión.</p>
          </>
        )}
        <div>
          <CampoSelect label="Rol" value={form.rol} onChange={(v) => setF("rol", v)} opciones={["", ...ROLES.map((r) => ({ value: r, label: formatRol(r) }))]} req />
          {form.rol && <p className="text-[11px] text-gray-400 mt-1.5">{ROL_DESC[form.rol]}</p>}
        </div>
        <CampoSelect label="Oficina" value={form.oficina} onChange={(v) => setF("oficina", v)} opciones={["", ...OFICINAS_USUARIO]} req />
      </div>
      <BotonesModal
        onCancelar={onCancelar}
        onConfirmar={onGuardar}
        textoConfirmar={esNuevo ? "Crear usuario" : "Guardar cambios"}
        disabled={!valido}
        loading={loading}
      />
    </div>
  );
}
