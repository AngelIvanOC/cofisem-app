// ============================================================
// src/layouts/AppLayout.jsx — RESPONSIVE CORREGIDO
//
// El problema era: el sidebar se ocultaba con CSS pero seguía
// ocupando espacio en el flex, empujando el contenido.
//
// Solución: en mobile, el layout es una sola columna (flex-col).
//           El sidebar solo existe en el flex row en desktop.
// ============================================================
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function AppLayout({ usuario, rolNombre }) {
  const esAjustador = rolNombre === "AJUSTADOR";

  return (
    <>
      {/*
        ── DESKTOP (md+): flex row → sidebar izquierda + main derecha
        ── MOBILE: flex col → topbar arriba + main abajo
        El truco: en mobile el sidebar NO está en el mismo flex row que el main.
      */}

      {/* Contenedor desktop: solo visible en md+ */}
      <div className="hidden md:flex h-screen w-screen overflow-hidden bg-gray-50">
        <Sidebar usuario={usuario} rolNombre={rolNombre} desktopOnly />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Contenedor mobile: solo visible en <md */}
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-50 md:hidden">
        {/* Top bar del sidebar mobile (hamburguesa o minimal) */}
        <Sidebar usuario={usuario} rolNombre={rolNombre} mobileOnly />

        {/* Contenido — ocupa todo el ancho */}
        <main
          className={`flex-1 overflow-y-auto w-full ${esAjustador ? "pb-[60px]" : ""}`}
        >
          <Outlet />
        </main>
      </div>
    </>
  );
}
