// ============================================================
// src/App.jsx
// Ruta raíz: página de inicio (selector de aseguradora)
// Todas las rutas de GAMAN bajo /gaman/
// ============================================================
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getState, subscribe } from "./auth.js";

// ── Páginas públicas ──────────────────────────────────────────
import PaginaLanding    from "./pages/PaginaLanding";
import PaginaInicio     from "./pages/PaginaInicio";
import Login            from "./pages/Login";
import AppLayout        from "./layouts/AppLayout";
import CofisemLayout    from "./layouts/CofisemLayout";
import PaginaEnConstruccion from "./pages/PaginaEnConstruccion";

// ── DEV — eliminar antes de producción ────────────────────────
import PDFPreview    from "./pages/PDFPreview";
import ReciboPreview from "./pages/ReciboPreview";

// ── Verificación pública de pólizas ──────────────────────────
import VerificarPoliza from "./pages/VerificarPoliza";

// ── OPERADOR ──────────────────────────────────────────────────
import OperadorDashboard  from "./pages/operador/OperadorDashboard";
import OperadorClientes   from "./pages/operador/Clientes";
import OperadorPolizas    from "./pages/operador/Polizas";
import { Vendedores as OperadorVendedores } from "./pages/operador/Vendedores";
import CorteOperador      from "./features/corte/CorteOperador";
import CorteAnalista      from "./features/corte/CorteAnalista";
import PoliciasDia        from "./features/cofisem/PoliciasDia";

// ── ANALISTA ──────────────────────────────────────────────────
import AnalistaDashboard from "./pages/analista/AnalistaDashboard";
import AnalistaPolizas   from "./pages/analista/AnalistaPolizas";
import AnalistaPagos     from "./pages/analista/AnalistaPagos";
import AnalistaReportes  from "./pages/analista/AnalistaReportes";
import OperadorPagos     from "./pages/operador/Pagos";

// ── ADMINISTRACIÓN ────────────────────────────────────────────
import AdminDashboard       from "./pages/administracion/AdminDashboard";
import AdminPolizas         from "./pages/administracion/AdminPolizas";
import AdminPagos           from "./pages/administracion/AdminPagos";
import AdminUsuarios        from "./pages/administracion/AdminUsuarios";
import AdminConfiguracion   from "./pages/administracion/AdminConfiguracion";
import AdminEstadoCuenta    from "./pages/administracion/EstadoDeCuenta";

// ── CABINERO SINIESTROS ───────────────────────────────────────
import CabineroDashboard from "./pages/cabinero/CabineroDashboard";
import Siniestros        from "./pages/cabinero/Siniestros.jsx";
import SiniestroNuevo    from "./pages/cabinero/SiniestroNuevo.jsx";

// ── AJUSTADOR ─────────────────────────────────────────────────
import AjustadorSiniestros from "./pages/ajustador/AjustadorSiniestros";

// ── SUPERVISOR SINIESTROS ─────────────────────────────────────
import SupervisorDashboard  from "./pages/supervisor/SupervisorDashboard";
import SupervisorSiniestros from "./pages/supervisor/SupervisorSiniestros";
import SupervisorAjustadores from "./pages/supervisor/SupervisorAjustadores";
import SupervisorReportes   from "./pages/supervisor/SupervisorReportes";

// ── VENTAS ────────────────────────────────────────────────────
import VentasDashboard    from "./pages/ventas/VentasDashboard";
import VentasMetas        from "./pages/ventas/VentasMetas";
import VentasReportes     from "./pages/ventas/VentasReportes";
import VentasVendedores   from "./pages/ventas/VentasVendedores";
import VentasCotizaciones from "./pages/ventas/VentasCotizaciones";

// ── Rutas permitidas por rol (todas bajo /gaman/) ─────────────
const RUTAS_POR_ROL = {
  OPERADOR: [
    "/gaman/dashboard",
    "/gaman/clientes",
    "/gaman/polizas",
    "/gaman/cotizaciones",
    "/gaman/cotizaciones/nueva",
    "/gaman/vendedores",
    "/gaman/pagos",
  ],
  ANALISTA: [
    "/gaman/dashboard",
    "/gaman/polizas",
    "/gaman/pagos",
    "/gaman/reportes",
  ],
  ADMINISTRACION: [
    "/gaman/dashboard",
    "/gaman/polizas",
    "/gaman/pagos",
    "/gaman/usuarios",
    "/gaman/configuracion",
    "/gaman/reportes",
    "/gaman/clientes",
    "/gaman/vendedores",
    "/gaman/estado-cuenta",
  ],
  CABINERO_SINIESTROS: [
    "/gaman/dashboard",
    "/gaman/siniestros",
    "/gaman/siniestros/nuevo",
  ],
  AJUSTADOR: ["/gaman/dashboard", "/gaman/siniestros"],
  SUPERVISOR_SINIESTROS: [
    "/gaman/dashboard",
    "/gaman/siniestros",
    "/gaman/ajustadores",
    "/gaman/reportes-siniestros",
  ],
  VENTAS: [
    "/gaman/dashboard",
    "/gaman/ventas-metas",
    "/gaman/ventas-reportes",
    "/gaman/ventas-vendedores",
    "/gaman/ventas-cotizaciones",
  ],
};

function RutaProtegida({ rolNombre, path, children }) {
  const permitidas = RUTAS_POR_ROL[rolNombre] || [];
  const ok = permitidas.some((r) => path === r || path.startsWith(r + "/"));
  return ok ? children : <Navigate to="/gaman/dashboard" replace />;
}

function useAuthState() {
  const [state, setState] = useState(getState);
  useEffect(() => {
    const unsub = subscribe(() => setState({ ...getState() }));
    return unsub;
  }, []);
  return state;
}

function Spinner() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-white">
      <svg className="animate-spin h-8 w-8 text-[#13193a]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
    </div>
  );
}

function SinPerfil({ error }) {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#13193a]">
      <div className="bg-white rounded-2xl shadow-xl px-10 py-8 text-center max-w-sm w-full">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374l7.048-12.14c.866-1.5 3.032-1.5 3.898 0l7.048 12.14zM12 15.75h.007v.008H12v-.008z" />
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
          onClick={() => { import("./auth.js").then((m) => m.logout()); }}
          className="w-full py-2.5 rounded-xl bg-[#13193a] text-white text-sm font-medium hover:bg-[#1e2a50] transition-all"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

// ── Route Wrappers por rol ────────────────────────────────────

function DashboardRoute({ rolNombre, usuario }) {
  switch (rolNombre) {
    case "OPERADOR":         return <OperadorDashboard usuario={usuario} />;
    case "ANALISTA":         return <AnalistaDashboard usuario={usuario} />;
    case "ADMINISTRACION":   return <AdminDashboard usuario={usuario} />;
    case "CABINERO_SINIESTROS": return <CabineroDashboard usuario={usuario} />;
    case "AJUSTADOR":        return <AjustadorSiniestros />;
    case "SUPERVISOR_SINIESTROS": return <SupervisorDashboard usuario={usuario} />;
    case "VENTAS":           return <VentasDashboard usuario={usuario} />;
    default:                 return <PaginaEnConstruccion titulo="Dashboard" />;
  }
}

function PolizasRoute({ rolNombre, usuario }) {
  switch (rolNombre) {
    case "OPERADOR":       return <OperadorPolizas usuario={usuario} />;
    case "ANALISTA":       return <AnalistaPolizas />;
    case "ADMINISTRACION": return <AdminPolizas />;
    default:               return <PaginaEnConstruccion titulo="Pólizas" />;
  }
}

function ClientesRoute({ rolNombre, usuario }) {
  if (rolNombre === "OPERADOR" || rolNombre === "ADMINISTRACION")
    return <OperadorClientes usuario={usuario} />;
  return <PaginaEnConstruccion titulo="Clientes" />;
}

function VendedoresRoute({ rolNombre, usuario }) {
  if (rolNombre === "OPERADOR" || rolNombre === "ADMINISTRACION")
    return <OperadorVendedores usuario={usuario} />;
  return <PaginaEnConstruccion titulo="Vendedores" />;
}

function PagosRoute({ rolNombre, usuario }) {
  switch (rolNombre) {
    case "OPERADOR":       return <OperadorPagos usuario={usuario} />;
    case "ANALISTA":       return <AnalistaPagos usuario={usuario} />;
    case "ADMINISTRACION": return <AdminPagos usuario={usuario} />;
    default:               return <PaginaEnConstruccion titulo="Pagos" />;
  }
}

function ReportesRoute() {
  return <PaginaEnConstruccion titulo="Reportes" icono="reportes" />;
}

function SiniestrosRoute({ rolNombre, usuario }) {
  switch (rolNombre) {
    case "CABINERO_SINIESTROS": return <Siniestros usuario={usuario} />;
    case "AJUSTADOR":           return <AjustadorSiniestros />;
    case "SUPERVISOR_SINIESTROS": return <SupervisorSiniestros />;
    default:                    return <Navigate to="/gaman/dashboard" replace />;
  }
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  const { session, usuario, rolNombre, error } = useAuthState();

  if (session === undefined) return <Spinner />;
  if (session && error)      return <SinPerfil error={error} />;

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Landing corporativa COFISEM ── */}
        <Route path="/" element={<PaginaLanding />} />


        {/* ── DEV ── */}
        <Route path="/gaman/pdf-preview"    element={<PDFPreview />} />
        <Route path="/gaman/recibo-preview" element={<ReciboPreview />} />

        {/* ── Verificación pública de pólizas ── */}
        <Route path="/gaman/verificar/:constancia" element={<VerificarPoliza />} />

        {/* ── Área COFISEM con sidebar (accesos + pólizas + cortes) ── */}
        <Route element={<CofisemLayout />}>
          <Route
            path="/accesos"
            element={
              rolNombre === "AJUSTADOR"
                ? <Navigate to="/gaman/dashboard" replace />
                : <PaginaInicio />
            }
          />
          <Route path="/polizas"         element={<PoliciasDia   usuario={usuario} />} />
          <Route path="/corte/operador"  element={<CorteOperador usuario={usuario} />} />
          <Route path="/corte/analista"  element={<CorteAnalista />} />
        </Route>

        {/* ── Login unificado ── */}
        <Route
          path="/login"
          element={
            session && rolNombre
              ? <Navigate to={["CABINERO_SINIESTROS", "AJUSTADOR"].includes(rolNombre) ? "/gaman/dashboard" : "/accesos"} replace />
              : <Login />
          }
        />
        {/* Compatibilidad con ruta antigua */}
        <Route path="/gaman/login" element={<Navigate to="/login" replace />} />

        {/* ── App autenticada (todas bajo /gaman/) ── */}
        {session && rolNombre ? (
          <Route element={<AppLayout usuario={usuario} rolNombre={rolNombre} />}>
            <Route
              path="/gaman/dashboard"
              element={<DashboardRoute rolNombre={rolNombre} usuario={usuario} />}
            />

            {/* Pólizas */}
            <Route
              path="/gaman/polizas"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/gaman/polizas">
                  <PolizasRoute rolNombre={rolNombre} usuario={usuario} />
                </RutaProtegida>
              }
            />
            <Route
              path="/gaman/cotizaciones"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/gaman/cotizaciones">
                  <OperadorPolizas usuario={usuario} />
                </RutaProtegida>
              }
            />
            <Route
              path="/gaman/cotizaciones/nueva"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/gaman/cotizaciones/nueva">
                  <OperadorPolizas usuario={usuario} />
                </RutaProtegida>
              }
            />

            {/* Clientes */}
            <Route
              path="/gaman/clientes"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/gaman/clientes">
                  <ClientesRoute rolNombre={rolNombre} usuario={usuario} />
                </RutaProtegida>
              }
            />

            {/* Vendedores */}
            <Route
              path="/gaman/vendedores"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/gaman/vendedores">
                  <VendedoresRoute rolNombre={rolNombre} usuario={usuario} />
                </RutaProtegida>
              }
            />

            {/* Pagos */}
            <Route
              path="/gaman/pagos"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/gaman/pagos">
                  <PagosRoute rolNombre={rolNombre} usuario={usuario} />
                </RutaProtegida>
              }
            />

            {/* Reportes */}
            <Route
              path="/gaman/reportes"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/gaman/reportes">
                  <ReportesRoute rolNombre={rolNombre} />
                </RutaProtegida>
              }
            />

            {/* Usuarios (admin) */}
            <Route
              path="/gaman/usuarios"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/gaman/usuarios">
                  <AdminUsuarios />
                </RutaProtegida>
              }
            />

            {/* Configuración de precios (admin) */}
            <Route
              path="/gaman/configuracion"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/gaman/configuracion">
                  <AdminConfiguracion usuario={usuario} />
                </RutaProtegida>
              }
            />

            {/* Estado de cuenta (admin) */}
            <Route
              path="/gaman/estado-cuenta"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/gaman/estado-cuenta">
                  <AdminEstadoCuenta />
                </RutaProtegida>
              }
            />

            {/* Siniestros */}
            <Route
              path="/gaman/siniestros"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/gaman/siniestros">
                  <SiniestrosRoute rolNombre={rolNombre} usuario={usuario} />
                </RutaProtegida>
              }
            />
            <Route
              path="/gaman/siniestros/nuevo"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/gaman/siniestros/nuevo">
                  <SiniestroNuevo usuario={usuario} />
                </RutaProtegida>
              }
            />

            {/* Supervisor */}
            <Route
              path="/gaman/ajustadores"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/gaman/ajustadores">
                  <SupervisorAjustadores />
                </RutaProtegida>
              }
            />
            <Route
              path="/gaman/reportes-siniestros"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/gaman/reportes-siniestros">
                  <SupervisorReportes />
                </RutaProtegida>
              }
            />

            {/* Ventas */}
            <Route
              path="/gaman/ventas-metas"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/gaman/ventas-metas">
                  <VentasMetas />
                </RutaProtegida>
              }
            />
            <Route
              path="/gaman/ventas-reportes"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/gaman/ventas-reportes">
                  <VentasReportes />
                </RutaProtegida>
              }
            />
            <Route
              path="/gaman/ventas-vendedores"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/gaman/ventas-vendedores">
                  <VentasVendedores />
                </RutaProtegida>
              }
            />
            <Route
              path="/gaman/ventas-cotizaciones"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/gaman/ventas-cotizaciones">
                  <VentasCotizaciones />
                </RutaProtegida>
              }
            />

            {/* Fallback dentro de /gaman/ → dashboard */}
            <Route path="/gaman/*" element={<Navigate to="/gaman/dashboard" replace />} />
          </Route>
        ) : (
          <>
            {/* Si no autenticado y va a /gaman/ → login */}
            <Route path="/gaman/*" element={<Navigate to="/login" replace />} />
          </>
        )}

        {/* Cualquier otra ruta → página de inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
