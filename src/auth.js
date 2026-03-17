// ============================================================
// auth.js — Módulo singleton de autenticación
// Toda la lógica de sesión vive AQUÍ, fuera de React.
// Los componentes solo leen, nunca modifican.
// ============================================================
import { supabase } from "./supabaseClient";

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
      .select("id, nombre, apellido, rol_id, oficina, activo")
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

  // 2. Escuchar SOLO eventos de login y logout, nunca TOKEN_REFRESHED ni otros
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
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