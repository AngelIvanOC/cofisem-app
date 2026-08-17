import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const callerToken = authHeader.replace(/^Bearer\s+/i, "");
    if (!callerToken) {
      return new Response(
        JSON.stringify({ error: "No autorizado: falta token." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { user_id, password, email } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "Se requiere user_id." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!password && !email) {
      return new Response(
        JSON.stringify({ error: "Se requiere al menos password o email." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password && password.length < 6) {
      return new Response(
        JSON.stringify({ error: "La contraseña debe tener al menos 6 caracteres." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ── Autorización ──────────────────────────────────────────────
    // Antes esta función no verificaba quién la llamaba: cualquier usuario
    // autenticado (con cualquier rol) podía cambiar la contraseña de
    // CUALQUIER OTRO usuario, incluido un administrador. Se agrega:
    // 1) validar el JWT del que llama (no el service role) para saber su id.
    // 2) permitir sin restricción si está cambiando SU PROPIA contraseña.
    // 3) si es la de otro usuario, exigir que su rol sea ADMINISTRACION.
    const { data: callerAuth, error: callerErr } = await adminClient.auth.getUser(callerToken);
    if (callerErr || !callerAuth?.user) {
      return new Response(
        JSON.stringify({ error: "No autorizado: sesión inválida." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callerId = callerAuth.user.id;
    if (callerId !== user_id) {
      const { data: callerPerfil } = await adminClient
        .from("usuarios")
        .select("roles(nombre)")
        .eq("id", callerId)
        .maybeSingle();
      const callerRol = callerPerfil?.roles?.nombre;
      if (callerRol !== "ADMINISTRACION") {
        return new Response(
          JSON.stringify({ error: "No autorizado: solo un administrador puede cambiar la contraseña de otro usuario." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const updates: Record<string, string> = {};
    if (password) updates.password = password;
    if (email)    updates.email    = email;

    const { error } = await adminClient.auth.admin.updateUserById(user_id, updates);

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Error interno: " + e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
