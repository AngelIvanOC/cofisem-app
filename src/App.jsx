import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import Login from "./pages/Login";
import AppLayout from "./layouts/AppLayout";

import Dashboard      from "./pages/Dashboard";
import Clientes       from "./pages/Clientes";
import Polizas        from "./pages/Polizas";
import Cotizaciones   from "./pages/Cotizaciones";
import Vendedores     from "./pages/Vendedores";
import Pagos          from "./pages/Pagos";
import Reportes       from "./pages/Reportes";
import Endosos        from "./pages/Endosos";
import Usuarios       from "./pages/Usuarios";
import Siniestros     from "./pages/Siniestros";
import SiniestroNuevo from "./pages/SiniestroNuevo";
import Documentacion  from "./pages/Documentacion";
import Resolucion     from "./pages/Resolucion";
import Reasignacion   from "./pages/Reasignacion";
import Metas          from "./pages/Metas";

const RUTAS_POR_ROL = {
  OPERADOR:             ["/dashboard","/clientes","/polizas","/cotizaciones","/vendedores"],
  ANALISTA:             ["/dashboard","/polizas","/pagos","/reportes"],
  ADMINISTRACION:       ["/dashboard","/polizas","/endosos","/pagos","/usuarios","/reportes","/clientes","/vendedores"],
  CABINERO_SINIESTROS:  ["/dashboard","/siniestros","/siniestros/nuevo","/reportes"],
  AJUSTADOR:            ["/dashboard","/siniestros","/documentacion","/resolucion"],
  SUPERVISOR_SINIESTROS:["/dashboard","/siniestros","/reasignacion","/reportes"],
  VENTAS:               ["/dashboard","/metas","/reportes"],
};

function RutaProtegida({ rolNombre, path, children }) {
  const permitidas = RUTAS_POR_ROL[rolNombre] || [];
  return permitidas.includes(path) ? children : <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  // "idle" | "loading" | "ready" | "no-auth" | "no-profile" | "error"
  const [estado, setEstado]     = useState("idle");
  const [usuario, setUsuario]   = useState(null);
  const [rolNombre, setRolNombre] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelado = false;
    setEstado("loading");

    async function cargar() {
      try {
        // 1. ¿Hay sesión?
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log("session:", session, "error:", sessionError);

        if (sessionError) throw new Error("Error de sesión: " + sessionError.message);
        if (!session) { if (!cancelado) setEstado("no-auth"); return; }

        const uid = session.user.id;

        // 2. Buscar perfil (sin join)
        const { data: perfil, error: perfilError } = await supabase
          .from("usuarios")
          .select("id, nombre, apellido, rol_id, oficina, activo")
          .eq("id", uid)
          .maybeSingle();

        console.log("perfil:", perfil, "error:", perfilError);

        if (perfilError) throw new Error("Error perfil: " + perfilError.message);
        if (!perfil) { if (!cancelado) setEstado("no-profile"); return; }

        // 3. Buscar rol (consulta separada, sin join)
        const { data: rol, error: rolError } = await supabase
          .from("roles")
          .select("nombre")
          .eq("id", perfil.rol_id)
          .maybeSingle();

        console.log("rol:", rol, "error:", rolError);

        if (rolError) throw new Error("Error rol: " + rolError.message);

        if (!cancelado) {
          setUsuario(perfil);
          setRolNombre(rol?.nombre ?? null);
          setEstado("ready");
        }
      } catch (e) {
        console.error("❌ cargar():", e.message);
        if (!cancelado) { setErrorMsg(e.message); setEstado("error"); }
      }
    }

    cargar();
    return () => { cancelado = true; };
  }, []); // ← solo al montar

  // Logout — recarga la página completa para limpiar todo
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // ── Pantallas de estado ──────────────────────────────────
  if (estado === "idle" || estado === "loading") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <svg className="animate-spin h-8 w-8 text-[#13193a]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      </div>
    );
  }

  if (estado === "error") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#13193a]">
        <div className="bg-white rounded-2xl shadow-xl px-10 py-8 text-center max-w-sm w-full">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Error de conexión</h2>
          <p className="text-xs font-mono bg-red-50 rounded px-3 py-2 mb-5 text-red-400 break-all">{errorMsg}</p>
          <button onClick={handleLogout} className="w-full py-2.5 rounded-xl bg-[#13193a] text-white text-sm font-medium">
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  if (estado === "no-profile") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#13193a]">
        <div className="bg-white rounded-2xl shadow-xl px-10 py-8 text-center max-w-sm w-full">
          <h2 className="text-lg font-semibold text-[#13193a] mb-2">Sin perfil asignado</h2>
          <p className="text-gray-500 text-sm mb-5">Tu cuenta no tiene perfil en el sistema. Contacta al administrador.</p>
          <button onClick={handleLogout} className="w-full py-2.5 rounded-xl bg-[#13193a] text-white text-sm font-medium">
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  // ── Rutas ────────────────────────────────────────────────
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />

      {estado === "ready" && rolNombre ? (
        <Route element={<AppLayout usuario={usuario} rolNombre={rolNombre} onLogout={handleLogout} />}>
          <Route path="/dashboard"        element={<Dashboard rolNombre={rolNombre} usuario={usuario} />} />
          <Route path="/clientes"         element={<RutaProtegida rolNombre={rolNombre} path="/clientes"><Clientes /></RutaProtegida>} />
          <Route path="/polizas"          element={<RutaProtegida rolNombre={rolNombre} path="/polizas"><Polizas rolNombre={rolNombre} /></RutaProtegida>} />
          <Route path="/cotizaciones"     element={<RutaProtegida rolNombre={rolNombre} path="/cotizaciones"><Cotizaciones /></RutaProtegida>} />
          <Route path="/vendedores"       element={<RutaProtegida rolNombre={rolNombre} path="/vendedores"><Vendedores /></RutaProtegida>} />
          <Route path="/pagos"            element={<RutaProtegida rolNombre={rolNombre} path="/pagos"><Pagos rolNombre={rolNombre} /></RutaProtegida>} />
          <Route path="/reportes"         element={<RutaProtegida rolNombre={rolNombre} path="/reportes"><Reportes rolNombre={rolNombre} /></RutaProtegida>} />
          <Route path="/endosos"          element={<RutaProtegida rolNombre={rolNombre} path="/endosos"><Endosos /></RutaProtegida>} />
          <Route path="/usuarios"         element={<RutaProtegida rolNombre={rolNombre} path="/usuarios"><Usuarios /></RutaProtegida>} />
          <Route path="/siniestros"       element={<RutaProtegida rolNombre={rolNombre} path="/siniestros"><Siniestros rolNombre={rolNombre} /></RutaProtegida>} />
          <Route path="/siniestros/nuevo" element={<RutaProtegida rolNombre={rolNombre} path="/siniestros/nuevo"><SiniestroNuevo /></RutaProtegida>} />
          <Route path="/documentacion"    element={<RutaProtegida rolNombre={rolNombre} path="/documentacion"><Documentacion /></RutaProtegida>} />
          <Route path="/resolucion"       element={<RutaProtegida rolNombre={rolNombre} path="/resolucion"><Resolucion /></RutaProtegida>} />
          <Route path="/reasignacion"     element={<RutaProtegida rolNombre={rolNombre} path="/reasignacion"><Reasignacion /></RutaProtegida>} />
          <Route path="/metas"            element={<RutaProtegida rolNombre={rolNombre} path="/metas"><Metas /></RutaProtegida>} />
          <Route path="*"                 element={<Navigate to="/dashboard" replace />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}