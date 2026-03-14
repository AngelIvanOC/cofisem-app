import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function AppLayout({ usuario, rolNombre }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50">
      <Sidebar usuario={usuario} rolNombre={rolNombre} />
      <main className="flex-1 h-full overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}