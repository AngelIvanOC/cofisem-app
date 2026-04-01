// ============================================================
// src/layouts/AppLayout.jsx — RESPONSIVE
// Desktop: sidebar + main content
// Mobile:  top bar + main content + bottom nav
// ============================================================
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function AppLayout({ usuario, rolNombre }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar (hidden on mobile) */}
      <Sidebar usuario={usuario} rolNombre={rolNombre} />

      {/* Main content */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Mobile: Sidebar renders the top bar inside itself */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
