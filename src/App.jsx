// ============================================================
// src/App.jsx — VERSIÓN FINAL
// Enrutamiento completo. Sin placeholders. Sin rutas huérfanas.
// ============================================================
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getState, subscribe } from "./auth.js";

// ── Core ──────────────────────────────────────────────────────
import Login from "./pages/Login";
import AppLayout from "./layouts/AppLayout";
import PaginaEnConstruccion from "./pages/PaginaEnConstruccion";

// ── OPERADOR ──────────────────────────────────────────────────
import OperadorDashboard from "./pages/operador/OperadorDashboard";
import OperadorClientes from "./pages/operador/Clientes";
import OperadorPolizas from "./pages/operador/Polizas";
import { Vendedores as OperadorVendedores } from "./pages/operador/Vendedores";
import CorteDiario from "./pages/operador/CorteDiario";

// ── ANALISTA ──────────────────────────────────────────────────
import AnalistaDashboard from "./pages/analista/AnalistaDashboard";
import AnalistaPolizas from "./pages/analista/AnalistaPolizas";
import AnalistaPagos from "./pages/analista/AnalistaPagos";
import AnalistaReportes from "./pages/analista/AnalistaReportes";
import AnalistaCorte from "./pages/analista/AnalistaCorte";

// ── ADMINISTRACIÓN ────────────────────────────────────────────
import AdminDashboard from "./pages/administracion/AdminDashboard";
import AdminPolizas from "./pages/administracion/AdminPolizas";
import AdminPagos from "./pages/administracion/AdminPagos";
import AdminUsuarios from "./pages/administracion/AdminUsuarios";

// ── CABINERO SINIESTROS ───────────────────────────────────────
import CabineroDashboard from "./pages/cabinero/CabineroDashboard";
import Siniestros from "./pages/cabinero/CabiSiniestros.jsx";
import SiniestroNuevo from "./pages/cabinero/CabiReportar.jsx";

// ── AJUSTADOR ─────────────────────────────────────────────────
import AjustadorSiniestros from "./pages/ajustador/AjustadorSiniestros";

// ── SUPERVISOR SINIESTROS ─────────────────────────────────────
import SupervisorDashboard from "./pages/supervisor/SupervisorDashboard";
import SupervisorSiniestros from "./pages/supervisor/SupervisorSiniestros";
import SupervisorAjustadores from "./pages/supervisor/SupervisorAjustadores";
import SupervisorReportes from "./pages/supervisor/SupervisorReportes";

// ── VENTAS ────────────────────────────────────────────────────
import VentasDashboard from "./pages/ventas/VentasDashboard";
import VentasMetas from "./pages/ventas/VentasMetas";
import VentasReportes from "./pages/ventas/VentasReportes";
import VentasVendedores from "./pages/ventas/VentasVendedores";
import VentasCotizaciones from "./pages/ventas/VentasCotizaciones";

// ── Rutas permitidas por rol ──────────────────────────────────
// NOTA: /cotizaciones y /cotizaciones/nueva son alias de /polizas
// para el operador — redirigen al mismo componente OperadorPolizas
// que internamente maneja el tab de cotizaciones.
const RUTAS_POR_ROL = {
  OPERADOR: [
    "/dashboard",
    "/clientes",
    "/polizas",
    "/cotizaciones",
    "/cotizaciones/nueva", // alias → OperadorPolizas
    "/vendedores",
    "/corte-diario",
  ],
  ANALISTA: ["/dashboard", "/polizas", "/pagos", "/reportes", "/corte-diario"],
  ADMINISTRACION: [
    "/dashboard",
    "/polizas",
    "/pagos",
    "/usuarios",
    "/reportes",
    "/clientes",
    "/vendedores",
    "/corte-diario",
  ],
  CABINERO_SINIESTROS: ["/dashboard", "/siniestros", "/siniestros/nuevo"],
  AJUSTADOR: ["/dashboard", "/siniestros"],
  SUPERVISOR_SINIESTROS: [
    "/dashboard",
    "/siniestros",
    "/ajustadores",
    "/reportes-siniestros",
  ],
  VENTAS: [
    "/dashboard",
    "/ventas-metas",
    "/ventas-reportes",
    "/ventas-vendedores",
    "/ventas-cotizaciones",
  ],
};

function RutaProtegida({ rolNombre, path, children }) {
  const permitidas = RUTAS_POR_ROL[rolNombre] || [];
  const ok = permitidas.some((r) => path === r || path.startsWith(r + "/"));
  return ok ? children : <Navigate to="/dashboard" replace />;
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
      <svg
        className="animate-spin h-8 w-8 text-[#13193a]"
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
    </div>
  );
}

function SinPerfil({ error }) {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#13193a]">
      <div className="bg-white rounded-2xl shadow-xl px-10 py-8 text-center max-w-sm w-full">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374l7.048-12.14c.866-1.5 3.032-1.5 3.898 0l7.048 12.14zM12 15.75h.007v.008H12v-.008z"
            />
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
          onClick={() => {
            import("./auth.js").then((m) => m.logout());
          }}
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
    case "OPERADOR":
      return <OperadorDashboard usuario={usuario} />;
    case "ANALISTA":
      return <AnalistaDashboard usuario={usuario} />;
    case "ADMINISTRACION":
      return <AdminDashboard usuario={usuario} />;
    case "CABINERO_SINIESTROS":
      return <CabineroDashboard usuario={usuario} />;
    case "AJUSTADOR":
      return <AjustadorSiniestros />;
    case "SUPERVISOR_SINIESTROS":
      return <SupervisorDashboard usuario={usuario} />;
    case "VENTAS":
      return <VentasDashboard usuario={usuario} />;
    default:
      return <PaginaEnConstruccion titulo="Dashboard" />;
  }
}

// /polizas, /cotizaciones, /cotizaciones/nueva → todos sirven OperadorPolizas para operador
function PolizasRoute({ rolNombre, usuario }) {
  switch (rolNombre) {
    case "OPERADOR":
      return <OperadorPolizas usuario={usuario} />;
    case "ANALISTA":
      return <AnalistaPolizas />;
    case "ADMINISTRACION":
      return <AdminPolizas />;
    default:
      return <PaginaEnConstruccion titulo="Pólizas" />;
  }
}

function ClientesRoute({ rolNombre, usuario }) {
  if (rolNombre === "OPERADOR" || rolNombre === "ADMINISTRACION") {
    return <OperadorClientes usuario={usuario} />;
  }
  return <PaginaEnConstruccion titulo="Clientes" />;
}

function VendedoresRoute({ rolNombre, usuario }) {
  if (rolNombre === "OPERADOR" || rolNombre === "ADMINISTRACION") {
    return <OperadorVendedores usuario={usuario} />;
  }
  return <PaginaEnConstruccion titulo="Vendedores" />;
}

function PagosRoute({ rolNombre }) {
  switch (rolNombre) {
    case "ANALISTA":
      return <AnalistaPagos />;
    case "ADMINISTRACION":
      return <AdminPagos />;
    default:
      return <PaginaEnConstruccion titulo="Pagos" />;
  }
}

function ReportesRoute({ rolNombre }) {
  if (rolNombre === "ANALISTA" || rolNombre === "ADMINISTRACION") {
    return <AnalistaReportes />;
  }
  return <PaginaEnConstruccion titulo="Reportes" />;
}

function CorteRoute({ rolNombre, usuario }) {
  switch (rolNombre) {
    case "OPERADOR":
      return <CorteDiario usuario={usuario} />; // editable
    case "ANALISTA":
      return <AnalistaCorte />; // solo lectura
    case "ADMINISTRACION":
      return <AnalistaCorte />; // solo lectura
    default:
      return <PaginaEnConstruccion titulo="Corte Diario" />;
  }
}

function SiniestrosRoute({ rolNombre }) {
  switch (rolNombre) {
    case "CABINERO_SINIESTROS":
      return <Siniestros />;
    case "AJUSTADOR":
      return <AjustadorSiniestros />;
    case "SUPERVISOR_SINIESTROS":
      return <SupervisorSiniestros />;
    default:
      return <Navigate to="/dashboard" replace />;
  }
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  const { session, usuario, rolNombre, error } = useAuthState();

  if (session === undefined) return <Spinner />;
  if (session && error) return <SinPerfil error={error} />;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            session && rolNombre ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login />
            )
          }
        />

        {session && rolNombre ? (
          <Route
            element={<AppLayout usuario={usuario} rolNombre={rolNombre} />}
          >
            {/* ── Dashboard único por rol ── */}
            <Route
              path="/dashboard"
              element={
                <DashboardRoute rolNombre={rolNombre} usuario={usuario} />
              }
            />

            {/* ── Pólizas: operador, analista, admin ── */}
            <Route
              path="/polizas"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/polizas">
                  <PolizasRoute rolNombre={rolNombre} usuario={usuario} />
                </RutaProtegida>
              }
            />
            {/* Cotizaciones del operador → mismo componente OperadorPolizas */}
            <Route
              path="/cotizaciones"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/cotizaciones">
                  <OperadorPolizas usuario={usuario} />
                </RutaProtegida>
              }
            />
            <Route
              path="/cotizaciones/nueva"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/cotizaciones/nueva">
                  <OperadorPolizas usuario={usuario} />
                </RutaProtegida>
              }
            />

            {/* ── Clientes ── */}
            <Route
              path="/clientes"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/clientes">
                  <ClientesRoute rolNombre={rolNombre} usuario={usuario} />
                </RutaProtegida>
              }
            />

            {/* ── Vendedores ── */}
            <Route
              path="/vendedores"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/vendedores">
                  <VendedoresRoute rolNombre={rolNombre} usuario={usuario} />
                </RutaProtegida>
              }
            />

            {/* ── Pagos ── */}
            <Route
              path="/pagos"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/pagos">
                  <PagosRoute rolNombre={rolNombre} />
                </RutaProtegida>
              }
            />

            {/* ── Reportes ── */}
            <Route
              path="/reportes"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/reportes">
                  <ReportesRoute rolNombre={rolNombre} />
                </RutaProtegida>
              }
            />

            {/* ── Corte diario ── */}
            <Route
              path="/corte-diario"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/corte-diario">
                  <CorteRoute rolNombre={rolNombre} usuario={usuario} />
                </RutaProtegida>
              }
            />

            {/* ── Admin: usuarios ── */}
            <Route
              path="/usuarios"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/usuarios">
                  <AdminUsuarios />
                </RutaProtegida>
              }
            />

            {/* ── Siniestros (Cabinero / Ajustador / Supervisor) ── */}
            <Route
              path="/siniestros"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/siniestros">
                  <SiniestrosRoute rolNombre={rolNombre} />
                </RutaProtegida>
              }
            />
            <Route
              path="/siniestros/nuevo"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/siniestros/nuevo">
                  <SiniestroNuevo />
                </RutaProtegida>
              }
            />

            {/* ── Supervisor ── */}
            <Route
              path="/ajustadores"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/ajustadores">
                  <SupervisorAjustadores />
                </RutaProtegida>
              }
            />
            <Route
              path="/reportes-siniestros"
              element={
                <RutaProtegida
                  rolNombre={rolNombre}
                  path="/reportes-siniestros"
                >
                  <SupervisorReportes />
                </RutaProtegida>
              }
            />

            {/* ── Ventas ── */}
            <Route
              path="/ventas-metas"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/ventas-metas">
                  <VentasMetas />
                </RutaProtegida>
              }
            />
            <Route
              path="/ventas-reportes"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/ventas-reportes">
                  <VentasReportes />
                </RutaProtegida>
              }
            />
            <Route
              path="/ventas-vendedores"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/ventas-vendedores">
                  <VentasVendedores />
                </RutaProtegida>
              }
            />
            <Route
              path="/ventas-cotizaciones"
              element={
                <RutaProtegida
                  rolNombre={rolNombre}
                  path="/ventas-cotizaciones"
                >
                  <VentasCotizaciones />
                </RutaProtegida>
              }
            />

            {/* Fallback → dashboard del rol */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}
