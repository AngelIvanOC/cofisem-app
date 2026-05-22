// ============================================================
// src/features/administracion/AdminUsuarios.jsx
// Administración: Crear y gestionar usuarios del sistema
// ============================================================
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  supabase,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} from "../../supabaseClient";

const ROLES_PERMITIDOS = [
  "OPERADOR",
  "ANALISTA",
  "CABINERO_SINIESTROS",
  "AJUSTADOR",
  "SUPERVISOR_SINIESTROS",
  "VENTAS",
  "ADMINISTRACION",
];

const ROL_CLS = {
  OPERADOR: "bg-blue-50    text-blue-700    border-blue-200",
  ANALISTA: "bg-indigo-50  text-indigo-700  border-indigo-200",
  ADMINISTRACION: "bg-purple-50  text-purple-700  border-purple-200",
  CABINERO_SINIESTROS: "bg-emerald-50 text-emerald-700 border-emerald-200",
  AJUSTADOR: "bg-teal-50    text-teal-700    border-teal-200",
  SUPERVISOR_SINIESTROS: "bg-amber-50   text-amber-700   border-amber-200",
  VENTAS: "bg-orange-50  text-orange-700  border-orange-200",
};

const ROL_DESC = {
  ADMINISTRACION: "Acceso total al sistema.",
  ANALISTA: "Ve todas las oficinas. Aplica pólizas y pagos.",
  OPERADOR: "Gestiona su oficina. Cotiza y tramita pólizas.",
  CABINERO_SINIESTROS: "Reporta y consulta siniestros.",
  AJUSTADOR: "Atiende siniestros asignados en campo.",
  SUPERVISOR_SINIESTROS: "Supervisa y reasigna siniestros.",
  VENTAS: "Consulta metas y reportes de ventas.",
};

const formatRol = (r) =>
  r
    ?.split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ") ?? "";

// ── Modal de creación de usuario ───────────────────────────
function ModalUsuario({ onClose, onGuardar, roles, oficinas }) {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    rol_id: "",
    oficina_id: "",
  });
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const rolSel = roles.find((r) => r.id === Number(form.rol_id));
  const esOperador = rolSel?.nombre === "OPERADOR";

  const valido =
    form.nombre.trim() &&
    form.apellido.trim() &&
    form.email.trim() &&
    form.password.length >= 6 &&
    form.rol_id &&
    (!esOperador || form.oficina_id);

  const inpCls =
    "w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 " +
    "placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] transition-all";
  const selCls = `${inpCls} cursor-pointer`;

  const handleGuardar = async () => {
    setProcesando(true);
    setError(null);
    try {
      await onGuardar(form);
      onClose();
    } catch (e) {
      setError(e.message ?? "Error al crear el usuario.");
      setProcesando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backdropFilter: "blur(8px)",
        backgroundColor: "rgba(10,15,40,0.55)",
      }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="w-9 h-9 rounded-xl bg-[#13193a]/8 flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5 text-[#13193a]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-[#13193a]">Nuevo usuario</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Completa todos los campos requeridos
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Nombre / Apellido */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                Nombre <span className="text-red-400">*</span>
              </label>
              <input
                value={form.nombre}
                onChange={(e) => set("nombre", e.target.value)}
                placeholder="Nombre"
                className={inpCls}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                Apellido <span className="text-red-400">*</span>
              </label>
              <input
                value={form.apellido}
                onChange={(e) => set("apellido", e.target.value)}
                placeholder="Apellido"
                className={inpCls}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              Correo electrónico <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="usuario@cofisem.mx"
              className={inpCls}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              Contraseña temporal <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className={inpCls}
            />
            <p className="text-[11px] text-gray-400 mt-1.5">
              El usuario deberá cambiarla en su primer inicio de sesión.
            </p>
          </div>

          {/* Rol */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              Rol <span className="text-red-400">*</span>
            </label>
            <select
              value={form.rol_id}
              onChange={(e) => {
                set("rol_id", e.target.value);
                set("oficina_id", "");
              }}
              className={selCls}
            >
              <option value="">Seleccionar rol…</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {formatRol(r.nombre)}
                </option>
              ))}
            </select>
            {rolSel && (
              <p className="text-[11px] text-gray-400 mt-1.5">
                {ROL_DESC[rolSel.nombre] ?? ""}
              </p>
            )}
          </div>

          {/* Oficina — solo visible cuando el rol es OPERADOR */}
          {esOperador && (
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                Oficina <span className="text-red-400">*</span>
              </label>
              <select
                value={form.oficina_id}
                onChange={(e) => set("oficina_id", e.target.value)}
                className={selCls}
              >
                <option value="">Seleccionar oficina…</option>
                {oficinas.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={!valido || procesando}
            className="flex-1 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#13193a]/15"
          >
            {procesando ? (
              <>
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Creando…
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Crear usuario
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────
export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [oficinas, setOficinas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("Todos");
  const [filtroOficina, setFiltroOficina] = useState("Todas");
  const [filtroActivo, setFiltroActivo] = useState("Todos");
  const [modalNuevo, setModalNuevo] = useState(false);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    const [
      { data: usrs, error: e1 },
      { data: rols, error: e2 },
      { data: ofics, error: e3 },
    ] = await Promise.all([
      supabase
        .from("usuarios")
        .select("*, roles(nombre), oficinas(id, nombre)")
        .order("created_at", { ascending: false }),
      supabase.from("roles").select("*").order("nombre"),
      supabase.from("oficinas").select("id, nombre").order("nombre"),
    ]);
    if (e1) console.error("Error cargando usuarios:", e1.message);
    if (e2) console.error("Error cargando roles:", e2.message);
    if (e3) console.error("Error cargando oficinas:", e3.message);
    setUsuarios(usrs ?? []);
    setRoles((rols ?? []).filter((r) => ROLES_PERMITIDOS.includes(r.nombre)));
    setOficinas(ofics ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Crea el usuario en auth.users con un cliente temporal (no afecta la sesión del admin)
  // y luego inserta el perfil en public.usuarios
  const crearUsuario = async (form, oficinas) => {
    const tempClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authError } = await tempClient.auth.signUp({
      email: form.email.trim(),
      password: form.password,
    });

    if (authError) throw new Error(authError.message);

    const uid = authData.user?.id;
    if (!uid) throw new Error("No se pudo obtener el ID del usuario creado.");

    const oficina_id = form.oficina_id ? Number(form.oficina_id) : null;

    const { error: profileError } = await supabase.from("usuarios").insert({
      id: uid,
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      email: form.email.trim(),
      rol_id: Number(form.rol_id),
      oficina_id: oficina_id,
      activo: true,
    });

    if (profileError) throw new Error(profileError.message);

    await cargarDatos();
  };

  const handleCrearUsuario = async (form) => {
    await crearUsuario(form, oficinas);
  };

  const toggleActivo = async (u) => {
    const nuevoEstado = !u.activo;
    setUsuarios((us) =>
      us.map((x) => (x.id === u.id ? { ...x, activo: nuevoEstado } : x)),
    );
    await supabase
      .from("usuarios")
      .update({ activo: nuevoEstado })
      .eq("id", u.id);
  };

  const filtrados = usuarios.filter((u) => {
    const rolNombre = u.roles?.nombre ?? "";
    const oficinaNombre = u.oficinas?.nombre ?? "";
    const hayBusqueda =
      u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.apellido?.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email?.toLowerCase().includes(busqueda.toLowerCase());
    const hayRol = filtroRol === "Todos" || rolNombre === filtroRol;
    const hayOfic =
      filtroOficina === "Todas" || oficinaNombre === filtroOficina;
    const hayActivo =
      filtroActivo === "Todos" ||
      (filtroActivo === "Activos" ? u.activo : !u.activo);
    return hayBusqueda && hayRol && hayOfic && hayActivo;
  });

  const selCls =
    "px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none";

  // Para el filtro de oficinas usamos las oficinas reales de la BD
  const oficinasEnLista = oficinas;

  return (
    <div className="p-6 min-h-full bg-gray-50 space-y-5">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#13193a]">Usuarios</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Gestión de accesos al sistema
          </p>
        </div>
        <button
          onClick={() => setModalNuevo(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all shadow-lg shadow-[#13193a]/15"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Nuevo usuario
        </button>
      </div>

      {/* Resumen por rol */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {ROLES_PERMITIDOS.map((r) => {
          const cnt = usuarios.filter(
            (u) => u.roles?.nombre === r && u.activo,
          ).length;
          const cls = ROL_CLS[r] ?? "bg-gray-100 text-gray-600 border-gray-200";
          return (
            <button
              key={r}
              onClick={() => setFiltroRol(r === filtroRol ? "Todos" : r)}
              className={`${cls} border rounded-xl p-3 text-left hover:shadow-sm transition-all ${filtroRol === r ? "ring-2 ring-offset-1 ring-current/30" : ""}`}
            >
              <p className="text-xl font-bold">{cnt}</p>
              <p className="text-[10px] font-semibold mt-0.5 leading-tight">
                {formatRol(r)}
              </p>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Filtros */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 px-5 py-4 border-b border-gray-100">
          <div className="lg:col-span-2 relative">
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre, apellido o correo…"
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] bg-white"
            />
          </div>
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            className={selCls}
          >
            <option value="Todos">Todos los roles</option>
            {ROLES_PERMITIDOS.map((r) => (
              <option key={r} value={r}>
                {formatRol(r)}
              </option>
            ))}
          </select>
          <select
            value={filtroOficina}
            onChange={(e) => setFiltroOficina(e.target.value)}
            className={selCls}
          >
            <option value="Todas">Todas las oficinas</option>
            {oficinasEnLista.map((o) => (
              <option key={o.id} value={o.nombre}>
                {o.nombre}
              </option>
            ))}
          </select>
          <select
            value={filtroActivo}
            onChange={(e) => setFiltroActivo(e.target.value)}
            className={selCls}
          >
            {["Todos", "Activos", "Inactivos"].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          {cargando ? (
            <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
              <svg
                className="animate-spin w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              <span className="text-sm">Cargando usuarios…</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  {[
                    "",
                    "Usuario",
                    "Email",
                    "Rol",
                    "Oficina",
                    "Creado",
                    "Estado",
                    "Acciones",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-5 py-3 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-12 text-sm text-gray-400"
                    >
                      No se encontraron usuarios.
                    </td>
                  </tr>
                ) : (
                  filtrados.map((u) => {
                    const rolNombre = u.roles?.nombre ?? "";
                    const cls =
                      ROL_CLS[rolNombre] ??
                      "bg-gray-100 text-gray-500 border-gray-200";
                    const fecha = u.created_at
                      ? new Date(u.created_at).toLocaleDateString("es-MX")
                      : "—";
                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-gray-50/60 transition-colors ${!u.activo ? "opacity-60" : ""}`}
                      >
                        {/* Avatar */}
                        <td className="px-5 py-3.5">
                          <div className="w-8 h-8 rounded-full bg-[#13193a] text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {u.nombre?.[0]}
                            {u.apellido?.[0]}
                          </div>
                        </td>
                        {/* Nombre */}
                        <td className="px-5 py-3.5">
                          <p className="text-xs font-semibold text-[#13193a]">
                            {u.nombre} {u.apellido}
                          </p>
                          <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                            ID: {u.id_muestra}
                          </p>
                        </td>
                        {/* Email */}
                        <td className="px-5 py-3.5 text-xs text-gray-500">
                          {u.email ?? "—"}
                        </td>
                        {/* Rol */}
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cls}`}
                          >
                            {formatRol(rolNombre)}
                          </span>
                        </td>
                        {/* Oficina — viene del join con oficinas vía FK oficina_id */}
                        <td className="px-5 py-3.5 text-xs text-gray-500 max-w-32 truncate">
                          {u.oficinas?.nombre ?? (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        {/* Fecha */}
                        <td className="px-5 py-3.5 text-xs text-gray-400">
                          {fecha}
                        </td>
                        {/* Toggle activo */}
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => toggleActivo(u)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${u.activo ? "bg-emerald-500" : "bg-gray-200"}`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${u.activo ? "translate-x-4.5" : "translate-x-0.5"}`}
                            />
                          </button>
                        </td>
                        {/* Acciones */}
                        <td className="px-5 py-3.5">
                          <span className="text-[11px] text-gray-300 italic">
                            —
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {filtrados.length} usuarios —{" "}
            {usuarios.filter((u) => u.activo).length} activos
          </p>
        </div>
      </div>

      {/* Modal nuevo usuario */}
      {modalNuevo && (
        <ModalUsuario
          roles={roles}
          oficinas={oficinas}
          onClose={() => setModalNuevo(false)}
          onGuardar={handleCrearUsuario}
        />
      )}
    </div>
  );
}
