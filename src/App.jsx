import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getState, subscribe } from "./auth.js";

import Login from "./pages/Login";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import Pagos from "./pages/Pagos";
import Reportes from "./pages/Reportes";
import Endosos from "./pages/Endosos";
import Usuarios from "./pages/Usuarios";
import Siniestros from "./pages/Siniestros";
import SiniestroNuevo from "./pages/SiniestroNuevo";
import Documentacion from "./pages/Documentacion";
import Resolucion from "./pages/Resolucion";
import Reasignacion from "./pages/Reasignacion";
import Metas from "./pages/Metas";
import AjustadorSiniestros from "./pages/AjustadorSiniestros";

// Placeholders globales (roles no-operador)
import ClientesGlobal from "./pages/Clientes";
import PolizasGlobal from "./pages/Polizas";
import CotizacionesGlobal from "./pages/Cotizaciones";
import VendedoresGlobal from "./pages/Vendedores";

// Módulo Operador
import OperadorDashboard from "./pages/operador/OperadorDashboard";
import OperadorClientes from "./pages/operador/Clientes";
import OperadorPolizas from "./pages/operador/Polizas";
import { Vendedores as OperadorVendedores } from "./pages/operador/Vendedores";
import CorteDiario from "./pages/operador/CorteDiario";

// -- Analista --
import AnalistaDashboard from "./pages/analista/AnalistaDashboard";
import AnalistaPolizas from "./pages/analista/AnalistaPolizas";
import AnalistaPagos from "./pages/analista/AnalistaPagos";
import AnalistaReportes from "./pages/analista/AnalistaReportes";
import AnalistaCorte from "./pages/analista/AnalistaCorte";

// -- Administración --
import AdminDashboard from "./pages/administracion/AdminDashboard";
import AdminPolizas from "./pages/administracion/AdminPolizas";
import AdminPagos from "./pages/administracion/AdminPagos";
import AdminUsuarios from "./pages/administracion/AdminUsuarios";

import SupervisorDashboard from "./pages/supervisor/SupervisorDashboard";
import SupervisorSiniestros from "./pages/supervisor/SupervisorSiniestros";
import SupervisorAjustadores from "./pages/supervisor/SupervisorAjustadores";
import SupervisorReportes from "./pages/supervisor/SupervisorReportes";

import VentasDashboard from "./pages/ventas/VentasDashboard";
import VentasMetas from "./pages/ventas/VentasMetas";
import VentasReportes from "./pages/ventas/VentasReportes";
import VentasVendedores from "./pages/ventas/VentasVendedores";
import VentasCotizaciones from "./pages/ventas/VentasCotizaciones";

const RUTAS_POR_ROL = {
  OPERADOR: [
    "/dashboard",
    "/clientes",
    "/polizas",
    "/cotizaciones/nueva",
    "/vendedores",
    "/corte-diario",
  ],
  ANALISTA: ["/dashboard", "/polizas", "/pagos", "/reportes", "/corte-diario"],
  ADMINISTRACION: [
    "/dashboard",
    "/polizas",
    "/endosos",
    "/pagos",
    "/usuarios",
    "/reportes",
    "/clientes",
    "/vendedores",
    "/corte-diario",
  ],
  CABINERO_SINIESTROS: ["/dashboard", "/siniestros", "/siniestros/nuevo"],
  AJUSTADOR: ["/dashboard", "/mis-siniestros", "/documentacion", "/resolucion"],
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
  return permitidas.includes(path) ? (
    children
  ) : (
    <Navigate to="/dashboard" replace />
  );
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

// Wrapper: elige la versión del componente según el rol
function DashboardRoute({ rolNombre, usuario }) {
  if (rolNombre === "OPERADOR") return <OperadorDashboard usuario={usuario} />;
  if (rolNombre === "ANALISTA") return <AnalistaDashboard usuario={usuario} />;
  if (rolNombre === "ADMINISTRACION")
    return <AdminDashboard usuario={usuario} />;
  if (rolNombre === "SUPERVISOR_SINIESTROS")
    return <SupervisorDashboard usuario={usuario} />;
  if (rolNombre === "VENTAS") return <VentasDashboard usuario={usuario} />;

  return <Dashboard rolNombre={rolNombre} usuario={usuario} />;
}

function ClientesRoute({ rolNombre, usuario }) {
  if (rolNombre === "OPERADOR") return <OperadorClientes usuario={usuario} />;
  return <ClientesGlobal rolNombre={rolNombre} usuario={usuario} />;
}
function PolizasRoute({ rolNombre, usuario }) {
  if (rolNombre === "OPERADOR") return <OperadorPolizas usuario={usuario} />;
  if (rolNombre === "ANALISTA") return <AnalistaPolizas />;
  if (rolNombre === "ADMINISTRACION") return <AdminPolizas />;
  return <PolizasGlobal rolNombre={rolNombre} />;
}
function VendedoresRoute({ rolNombre, usuario }) {
  if (rolNombre === "OPERADOR") return <OperadorVendedores usuario={usuario} />;
  return <VendedoresGlobal rolNombre={rolNombre} usuario={usuario} />;
}
function PagosRoute({ rolNombre }) {
  if (rolNombre === "ANALISTA") return <AnalistaPagos />;
  if (rolNombre === "ADMINISTRACION") return <AdminPagos />;
  return <PagosGlobal rolNombre={rolNombre} />;
}
function ReportesRoute({ rolNombre }) {
  if (rolNombre === "ANALISTA" || rolNombre === "ADMINISTRACION")
    return <AnalistaReportes />;
  return <ReportesGlobal rolNombre={rolNombre} />;
}
function CorteDiarioRoute({ rolNombre, usuario }) {
  if (rolNombre === "OPERADOR") return <CorteDiario usuario={usuario} />; // editable
  // Analista y Admin: solo lectura
  return <AnalistaCorte />;
}

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
            <Route
              path="/dashboard"
              element={
                <DashboardRoute rolNombre={rolNombre} usuario={usuario} />
              }
            />
            <Route
              path="/clientes"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/clientes">
                  <ClientesRoute rolNombre={rolNombre} usuario={usuario} />
                </RutaProtegida>
              }
            />
            <Route
              path="/polizas"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/polizas">
                  <PolizasRoute rolNombre={rolNombre} usuario={usuario} />
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
            <Route
              path="/cotizaciones"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/cotizaciones/nueva">
                  <CotizacionesGlobal />
                </RutaProtegida>
              }
            />
            <Route
              path="/vendedores"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/vendedores">
                  <VendedoresRoute rolNombre={rolNombre} usuario={usuario} />
                </RutaProtegida>
              }
            />
            <Route
              path="/corte-diario"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/corte-diario">
                  {
                    rolNombre === "ANALISTA" ? (
                      <AnalistaCorte />
                    ) : (
                      <CorteDiario usuario={usuario} />
                    ) // operador
                  }
                </RutaProtegida>
              }
            />
            <Route
              path="/pagos"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/pagos">
                  <PagosRoute rolNombre={rolNombre} />
                </RutaProtegida>
              }
            />{" "}
            <Route
              path="/reportes"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/reportes">
                  <ReportesRoute rolNombre={rolNombre} />
                </RutaProtegida>
              }
            />
            <Route
              path="/endosos"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/endosos">
                  <Endosos />
                </RutaProtegida>
              }
            />
            <Route
              path="/usuarios"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/usuarios">
                  <AdminUsuarios />
                </RutaProtegida>
              }
            />
            <Route
              path="/siniestros"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/siniestros">
                  {
                    rolNombre === "SUPERVISOR_SINIESTROS" ? (
                      <SupervisorSiniestros />
                    ) : (
                      <Siniestros />
                    ) // cabinero: vista de cabinero
                  }
                </RutaProtegida>
              }
            />
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
            <Route
              path="/siniestros/nuevo"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/siniestros/nuevo">
                  <SiniestroNuevo />
                </RutaProtegida>
              }
            />
            <Route
              path="/documentacion"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/documentacion">
                  <Documentacion />
                </RutaProtegida>
              }
            />
            <Route
              path="/resolucion"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/resolucion">
                  <Resolucion />
                </RutaProtegida>
              }
            />
            <Route
              path="/reasignacion"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/reasignacion">
                  <Reasignacion />
                </RutaProtegida>
              }
            />
            <Route
              path="/metas"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/metas">
                  <Metas />
                </RutaProtegida>
              }
            />
            <Route
              path="/mis-siniestros"
              element={
                <RutaProtegida rolNombre={rolNombre} path="/mis-siniestros">
                  <AjustadorSiniestros />
                </RutaProtegida>
              }
            />
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
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}
