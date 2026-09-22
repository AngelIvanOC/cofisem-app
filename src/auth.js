// ============================================================
// auth.js — Módulo singleton de autenticación
// Toda la lógica de sesión vive AQUÍ, fuera de React.
// Los componentes solo leen, nunca modifican.
// ============================================================
import { supabase, registrarGuardSesion } from "./supabaseClient";

// Estado global (no es React state)
let _session   = undefined; // undefined=checking, null=no-auth, obj=auth
let _usuario   = null;
let _rolNombre = null;
let _error     = null;      // null | "sin-perfil" | "error-bd"
let _listeners = [];

function notify() {
  _listeners.forEach(fn => fn());
}

export function subscribe(fn) {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter(l => l !== fn); };
}

export function getState() {
  return { session: _session, usuario: _usuario, rolNombre: _rolNombre, error: _error };
}

// ── Carga perfil UNA sola vez para un UID dado ─────────────
let _lastUID = null;
let _loading = false;

async function loadProfile(uid) {
  if (_loading || uid === _lastUID) return;
  _loading  = true;
  _lastUID  = uid;

  try {
    const { data: perfil, error: e1 } = await supabase
      .from("usuarios")
      .select("id, id_muestra, nombre, apellido, rol_id, activo, oficina_id, encargado_oficina, oficinas(id, nombre)")
      .eq("id", uid)
      .maybeSingle();

    if (e1)     { _error = "error-bd";   notify(); return; }
    if (!perfil) { _error = "sin-perfil"; notify(); return; }

    const { data: rol, error: e2 } = await supabase
      .from("roles")
      .select("nombre")
      .eq("id", perfil.rol_id)
      .maybeSingle();

    if (e2) { _error = "error-bd"; notify(); return; }

    _usuario   = perfil;
    _rolNombre = rol?.nombre ?? null;
    _error     = null;
  } finally {
    _loading = false;
    notify();
  }
}

// ── Logout ─────────────────────────────────────────────────
export async function logout() {
  _session   = null;
  _usuario   = null;
  _rolNombre = null;
  _error     = null;
  _lastUID   = null;
  notify();
  await supabase.auth.signOut();
}

// ── Sesión perdida ─────────────────────────────────────────
// La sesión ya no sirve (refresh token revocado/expirado): se limpia el
// estado para que App.jsx mande al login, y el Login avisa por qué.
export const MOTIVO_SESION_EXPIRADA = "cofisem_sesion_expirada";

function marcarExpirada() {
  try {
    sessionStorage.setItem(MOTIVO_SESION_EXPIRADA, "1");
  } catch {
    /* sin storage: el login simplemente no muestra el aviso */
  }
}

function sesionPerdida() {
  if (!_session) return;
  marcarExpirada();
  _session   = null;
  _usuario   = null;
  _rolNombre = null;
  _error     = null;
  _lastUID   = null;
  _loading   = false;
  notify();
  // scope local: solo borra la sesión de este navegador (el token ya no sirve)
  supabase.auth.signOut({ scope: "local" }).catch(() => {});
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const esErrorDeRed = (err) =>
  err?.name === "AuthRetryableFetchError" ||
  (typeof navigator !== "undefined" && navigator.onLine === false);

// Consigue un access token válido. Si falla por red (la compu despertó y el
// wifi aún no conecta) reintenta unos segundos SIN cerrar la sesión; solo la
// da por perdida si Supabase contesta que ya no existe. Las peticiones que
// llegan a la vez comparten el mismo intento.
let _recuperando = null;
function recuperarToken() {
  if (_recuperando) return _recuperando;
  _recuperando = (async () => {
    for (let intento = 0; intento < 4; intento++) {
      const { data, error } = await supabase.auth.getSession();
      if (data?.session?.access_token && !error) return data.session.access_token;
      if (!esErrorDeRed(error)) {
        const r = await supabase.auth.refreshSession();
        if (r.data?.session?.access_token) return r.data.session.access_token;
        if (!esErrorDeRed(r.error)) {
          sesionPerdida();
          return null;
        }
      }
      await esperar(1000 * (intento + 1));
    }
    return null; // sin red: la petición falla, pero la sesión se conserva
  })().finally(() => {
    _recuperando = null;
  });
  return _recuperando;
}

registrarGuardSesion({
  activa: () => !!_session,
  recuperarToken,
  perdida: sesionPerdida,
});

// Al regresar a la pestaña (o reconectar la red) se revisa que la sesión
// siga viva; si ya murió, se manda al login antes de que el usuario capture
// algo que luego no se va a poder guardar.
function revisarSesion() {
  if (_session && document.visibilityState === "visible") recuperarToken();
}

// ── Inicializar (llamar UNA vez al arrancar la app) ────────
let _initialized = false;

export async function initAuth() {
  if (_initialized) return;
  _initialized = true;

  // 1. Sesión inicial
  const { data: { session } } = await supabase.auth.getSession();
  _session = session ?? null;

  if (session?.user?.id) {
    await loadProfile(session.user.id);
  } else {
    notify();
  }

  document.addEventListener("visibilitychange", revisarSesion);
  window.addEventListener("online", revisarSesion);

  // 2. Escuchar login/logout. TOKEN_REFRESHED solo actualiza la sesión
  //    guardada (no recarga el perfil ni re-renderiza).
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "TOKEN_REFRESHED" && session && _session) {
      _session = session;
    }

    if (event === "SIGNED_OUT") {
      // Si todavía había sesión es que se cerró sola (logout() la limpia
      // antes): avisar en el login.
      if (_session) marcarExpirada();
      _session   = null;
      _usuario   = null;
      _rolNombre = null;
      _error     = null;
      _lastUID   = null;
      _loading   = false;
      notify();
    }

    if (event === "SIGNED_IN") {
      // Solo si es un uid diferente (login nuevo, no refresh de token)
      if (session?.user?.id && session.user.id !== _lastUID) {
        _session = session;
        loadProfile(session.user.id);
      }
    }
  });
}