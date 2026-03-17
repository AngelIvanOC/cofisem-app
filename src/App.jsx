import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getState, subscribe } from "./auth.js";

import Login          from "./pages/Login";
import AppLayout      from "./layouts/AppLayout";
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
import AjustadorSiniestros from "./pages/AjustadorSiniestros";


const RUTAS_POR_ROL = {
  OPERADOR:             ["/dashboard","/clientes","/polizas","/cotizaciones","/vendedores"],
  ANALISTA:             ["/dashboard","/polizas","/pagos","/reportes"],
  ADMINISTRACION:       ["/dashboard","/polizas","/endosos","/pagos","/usuarios","/reportes","/clientes","/vendedores"],
  CABINERO_SINIESTROS:  ["/dashboard","/siniestros","/siniestros/nuevo"],
  AJUSTADOR:            ["/dashboard","/siniestros","/documentacion","/resolucion", "/mis-siniestros"],
  SUPERVISOR_SINIESTROS:["/dashboard","/siniestros","/reasignacion","/reportes"],
  VENTAS:               ["/dashboard","/metas","/reportes"],
};

function RutaProtegida({ rolNombre, path, children }) {
  const permitidas = RUTAS_POR_ROL[rolNombre] || [];
  return permitidas.includes(path) ? children : <Navigate to="/dashboard" replace />;
}

// Hook: se suscribe al singleton de auth
function useAuthState() {
  const [state, setState] = useState(getState);

  useEffect(() => {
    // Suscribirse a cambios del singleton
    const unsub = subscribe(() => setState({ ...getState() }));
    return unsub;
  }, []); // ← vacío, nunca cambia

  return state;
}

// ── Spinner ─────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-white">
      <svg className="animate-spin h-8 w-8 text-[#13193a]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
    </div>
  );
}

// ── Sin perfil ──────────────────────────────────────────────
function SinPerfil({ email, error }) {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#13193a]">
      <div className="bg-white rounded-2xl shadow-xl px-10 py-8 text-center max-w-sm w-full">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374l7.048-12.14c.866-1.5 3.032-1.5 3.898 0l7.048 12.14zM12 15.75h.007v.008H12v-.008z"/>
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-[#13193a] mb-1">
          {error === "error-bd" ? "Error de conexión" : "Sin perfil asignado"}
        </h2>
        <p className="text-gray-500 text-sm mb-4">
          {error === "error-bd"
            ? "No se pudo conectar con la base de datos."
            : "Tu cuenta no tiene un perfil configurado. Contacta al administrador."}
        </p>
        <button
          onClick={() => { import("./auth.js").then(m => m.logout()); }}
          className="w-full py-2.5 rounded-xl bg-[#13193a] text-white text-sm font-medium hover:bg-[#1e2a50] transition-all"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

// ── App ──────────────────────────────────────────────────────
export default function App() {
  const { session, usuario, rolNombre, error } = useAuthState();

  // Aún verificando sesión inicial
  if (session === undefined) return <Spinner />;

  // Sesión activa pero con error de perfil
  if (session && error) return <SinPerfil error={error} />;

  return (
    <BrowserRouter>
      <Routes>
        {/* Pública */}
        <Route
          path="/login"
          element={session && rolNombre ? <Navigate to="/dashboard" replace /> : <Login />}
        />

        {/* Protegidas */}
        {session && rolNombre ? (
          <Route element={<AppLayout usuario={usuario} rolNombre={rolNombre} />}>
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

        <Route path="/mis-siniestros" element={
  <RutaProtegida rolNombre={rolNombre} path="/mis-siniestros">
    <AjustadorSiniestros />
  </RutaProtegida>
} />
      </Routes>
    </BrowserRouter>
  );
}