// ============================================================
// src/layouts/AppLayout.jsx — RESPONSIVE + FIX HEIGHT MOBILE
//
// PROBLEMA EN MOBILE:
//   Varias páginas tienen internamente `h-full overflow-y-auto`
//   (dashboards especialmente). Esto crea doble scroll en mobile
//   porque el <main> también tiene overflow-y-auto.
//
// SOLUCIÓN:
//   En mobile, el <main> sigue siendo el único scrolleable.
//   Se añade la clase `mobile-page-wrapper` al <main> y un CSS
//   que neutraliza el h-full/overflow-y-auto de los hijos directos
//   SOLO en mobile, sin tocar ningún archivo de página.
//
//   EXCEPCIÓN: el Ajustador (AjustadorSiniestros) necesita
//   su propia gestión de scroll interna — se deja intacto
//   porque ya fue corregido específicamente.
// ============================================================
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function AppLayout({ usuario, rolNombre }) {
  const esAjustador = rolNombre === "AJUSTADOR";

  return (
    <>
      {/* ── DESKTOP (md+): flex row → sidebar + main ── */}
      <div className="hidden md:flex h-screen w-screen overflow-hidden bg-gray-50">
        <Sidebar usuario={usuario} rolNombre={rolNombre} desktopOnly />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* ── MOBILE (<md): flex col → topbar + main ── */}
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-50 md:hidden">
        <Sidebar usuario={usuario} rolNombre={rolNombre} mobileOnly />

        {/*
          En mobile, el <main> es el ÚNICO scrolleable.
          La clase `mobile-scroll-host` + el CSS en index.css
          neutralizan el `h-full overflow-y-auto` interno de
          las páginas que lo tienen (dashboards, etc.).

          El Ajustador se excluye porque maneja su propio scroll.
        */}
        <main
          className={[
            "flex-1 w-full",
            esAjustador
              ? "overflow-hidden" // Ajustador: scroll interno propio
              : "overflow-y-auto mobile-scroll-host", // Todos los demás: main scrollea
            esAjustador ? "pb-[60px]" : "",
          ].join(" ")}
        >
          <Outlet />
        </main>
      </div>
    </>
  );
}
