import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://dwozudsdprnlgimluzup.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3b3p1ZHNkcHJubGdpbWx1enVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNzQxOTEsImV4cCI6MjA4ODk1MDE5MX0.XzRtgJdA5fjyoXh-SV3KMmfmwens-vCXMG8NR1hZzoE";

// ── Guardia de sesión ──────────────────────────────────────
// Si supabase-js no logra refrescar el token (p. ej. la compu despertó y
// la red aún no regresa), NO avisa: manda la consulta con la anon key.
// La RLS entonces regresa 0 filas y salen errores confusos como
// "Cannot coerce the result to a single JSON object". Este fetch detecta
// ese caso mientras hay alguien logueado: reintenta conseguir el token y,
// si la sesión de verdad ya no existe, la cierra y manda al login.
// auth.js registra aquí sus funciones (evita el import circular).
let guard = null; // { activa(): bool, recuperarToken(): Promise<string|null>, perdida(): void }
export function registrarGuardSesion(g) {
  guard = g;
}

async function fetchConGuard(input, init = {}) {
  const url = input instanceof Request ? input.url : String(input);
  // Las llamadas de auth (/auth/v1) pasan directo: las usa el propio refresh.
  const esDatos = url.startsWith(SUPABASE_URL) && !url.includes("/auth/v1/");

  if (esDatos && guard?.activa()) {
    const headers = new Headers(init.headers);
    if (headers.get("Authorization") === `Bearer ${SUPABASE_ANON_KEY}`) {
      const token = await guard.recuperarToken();
      if (!token) {
        // Sigue activa = solo falló la red; si no, ya se mandó al login.
        throw new Error(
          guard.activa()
            ? "Sin conexión con el servidor. Revisa tu internet e intenta de nuevo."
            : "Tu sesión expiró. Inicia sesión de nuevo.",
        );
      }
      headers.set("Authorization", `Bearer ${token}`);
      init = { ...init, headers };
    }
  }

  const res = await fetch(input, init);
  // PostgREST responde 401 solo por problemas del JWT (expirado/revocado).
  if (res.status === 401 && url.includes("/rest/v1/") && guard?.activa()) {
    guard.perdida();
  }
  return res;
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // La sesión vive en localStorage y se refresca sola: dura hasta que el
    // usuario cierre sesión (salvo límites configurados en el dashboard).
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  global: { fetch: fetchConGuard },
});
