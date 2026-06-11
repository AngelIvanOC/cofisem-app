import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getState, subscribe, logout } from "../auth.js";
import iconoGaman from "../assets/icono_gaman.svg";

// ── Nav items por rol ──────────────────────────────────────────
const NAV = {
  OPERADOR: [
    {
      label: "Accesos",
      path: "/accesos",
      icon: (
        <svg
          className="w-[18px] h-[18px]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
          />
        </svg>
      ),
    },
    {
      label: "Pólizas",
      path: "/polizas",
      icon: (
        <svg
          className="w-[18px] h-[18px]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      label: "Corte",
      path: "/corte/operador",
      icon: (
        <svg
          className="w-[18px] h-[18px]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z"
          />
        </svg>
      ),
    },
  ],
  ANALISTA: [
    {
      label: "Accesos",
      path: "/accesos",
      icon: (
        <svg
          className="w-[18px] h-[18px]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
          />
        </svg>
      ),
    },
    {
      label: "Corte (lectura)",
      path: null,
      pronto: true,
      icon: (
        <svg
          className="w-[18px] h-[18px]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.641 0-8.573-3.007-9.963-7.178z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
  ],
};

NAV.ADMINISTRACION = NAV.ANALISTA;
NAV.CABINERO_SINIESTROS = [NAV.ANALISTA[0]];
NAV.AJUSTADOR = [NAV.ANALISTA[0]];
NAV.SUPERVISOR_SINIESTROS = [NAV.ANALISTA[0]];
NAV.VENTAS = [NAV.ANALISTA[0]];
NAV._default = [NAV.ANALISTA[0]];

const ROL_LABEL = {
  OPERADOR: "Operador",
  ANALISTA: "Analista",
  ADMINISTRACION: "Administración",
  CABINERO_SINIESTROS: "Cabinero",
  AJUSTADOR: "Ajustador",
  SUPERVISOR_SINIESTROS: "Supervisor",
  VENTAS: "Ventas",
};

export default function CofisemLayout() {
  const [auth, setAuth] = useState(getState());
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = subscribe(() => setAuth({ ...getState() }));
    return unsub;
  }, []);

  const { usuario, rolNombre } = auth;
  const navItems = NAV[rolNombre] ?? NAV._default;
  const iniciales =
    [usuario?.nombre?.[0], usuario?.apellido?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "?";

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-52 bg-[#13193a] flex flex-col shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <img
              src={iconoGaman}
              alt="Cofisem"
              className="w-5 h-5 object-contain"
            />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none tracking-tight">
              COFISEM
            </p>
            <p className="text-white/35 text-[10px] mt-0.5 leading-none">
              Sistema de gestión
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) =>
            item.pronto ? (
              <div
                key={item.label}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/25 cursor-not-allowed select-none text-sm"
              >
                <span className="shrink-0 opacity-50">{item.icon}</span>
                <span className="flex-1 truncate">{item.label}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider bg-white/10 text-white/40 px-1.5 py-0.5 rounded-full">
                  Pronto
                </span>
              </div>
            ) : (
              <NavLink
                key={item.label}
                to={item.path}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                    isActive
                      ? "bg-white/15 text-white font-semibold"
                      : "text-white/50 hover:bg-white/8 hover:text-white",
                  ].join(" ")
                }
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </NavLink>
            ),
          )}
        </nav>

        {/* Usuario + acciones */}
        <div className="border-t border-white/10 p-3 space-y-1">
          {/* Info usuario */}
          {usuario && (
            <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                {iniciales}
              </div>
              <div className="min-w-0">
                <p className="text-white/70 text-xs font-semibold truncate leading-none">
                  {[usuario.nombre, usuario.apellido].filter(Boolean).join(" ")}
                </p>
                <p className="text-white/30 text-[10px] mt-0.5 leading-none">
                  {ROL_LABEL[rolNombre] ?? rolNombre ?? "—"}
                </p>
              </div>
            </div>
          )}

          {/* Ir a GAMAN */}
          <button
            onClick={() => navigate("/gaman/dashboard")}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-white/50 hover:bg-white/8 hover:text-white transition-all text-sm"
          >
            <svg
              className="w-[18px] h-[18px] shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3"
              />
            </svg>
            <span>Ir a GAMAN</span>
          </button>

          {/* Cerrar sesión */}
          <button
            onClick={async () => {
              await logout();
              navigate("/");
            }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-white/50 hover:bg-white/8 hover:text-white transition-all text-sm"
          >
            <svg
              className="w-[18px] h-[18px] shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
              />
            </svg>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* ── Contenido ── */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
