// ============================================================
// src/components/Sidebar.jsx — RESPONSIVE FINAL
//
// Props:
//   desktopOnly → solo renderiza el sidebar lateral (para el flex row desktop)
//   mobileOnly  → solo renderiza la navegación mobile (topbar + drawer/bottomnav)
//
// Roles:
//   AJUSTADOR mobile → top bar mínimo + bottom nav fija
//   TODOS LOS DEMÁS mobile → top bar + drawer hamburguesa
// ============================================================
import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { logout } from "../auth.js";
import { NAV_POR_ROL } from "../config/navConfig";

// ── Iconos ───────────────────────────────────────────────────
const ICONS = {
  home: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  users: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  "file-text": (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  "hard-hat": (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 18a1 1 0 001 1h18a1 1 0 001-1v-2a1 1 0 00-1-1H3a1 1 0 00-1 1v2z" />
      <path d="M10 10V5a1 1 0 011-1h2a1 1 0 011 1v5" />
      <path d="M4 15v-3a8 8 0 0116 0v3" />
    </svg>
  ),
  "credit-card": (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  "bar-chart": (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  ),
  shield: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  clipboard: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  ),
  calendar: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  "log-out": (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  "chevron-left": (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  "chevron-right": (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  menu: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  x: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  "trending-up": (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  "plus-circle": (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  "edit-square": (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  ),
};

function getIcon(name) {
  return ICONS[name] ?? ICONS["file-text"];
}

function formatRol(rol = "") {
  return rol
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

const LogoSVG = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path
      d="M12 24C12 17.373 17.373 12 24 12C30.627 12 36 17.373 36 24C36 30.627 30.627 36 24 36"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <path
      d="M24 36C20 36 16 32 16 28C16 24 20 20 24 20"
      stroke="#fff"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <circle cx="24" cy="24" r="3" fill="white" />
  </svg>
);

// ============================================================
// DESKTOP SIDEBAR — sidebar lateral colapsable
// Sólo se renderiza cuando desktopOnly=true (dentro del flex row desktop)
// ============================================================
function DesktopSidebar({ usuario, rolNombre, navItems }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const iniciales =
    [usuario?.nombre?.[0], usuario?.apellido?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "?";
  const nombreCompleto = [usuario?.nombre, usuario?.apellido]
    .filter(Boolean)
    .join(" ");

  return (
    <aside
      style={{ width: collapsed ? 68 : 224, minWidth: collapsed ? 68 : 224 }}
      className="relative flex flex-col h-full bg-[#13193a] transition-all duration-300 ease-in-out select-none shrink-0"
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expandir" : "Colapsar"}
        className="cursor-pointer absolute -right-3 top-6 z-20 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-[#13193a] hover:bg-gray-50 transition-colors"
      >
        <span className="w-3.5 h-3.5">
          {collapsed ? ICONS["chevron-right"] : ICONS["chevron-left"]}
        </span>
      </button>

      {/* Logo */}
      <div
        className={`flex items-center border-b border-white/10 shrink-0 ${collapsed ? "justify-center px-0 py-5" : "gap-3 px-4 py-5"}`}
      >
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
          <LogoSVG size={18} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-none">Cofisem</p>
            <p className="text-white/40 text-[10px] mt-0.5 leading-none">
              Gestión de Seguros
            </p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-none">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end
              title={item.label}
              className={[
                "flex items-center mx-2 my-0.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                collapsed
                  ? "justify-center px-0 py-2.5 h-10"
                  : "gap-3 px-3 py-2.5",
                isActive
                  ? "bg-white text-[#13193a]"
                  : "text-white/65 hover:bg-white/8 hover:text-white",
              ].join(" ")}
            >
              <span
                className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-[#13193a]" : "text-white/55 group-hover:text-white"}`}
              >
                {getIcon(item.icon)}
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-2.5 space-y-0.5 shrink-0">
        <div
          className={`flex items-center rounded-xl px-2 py-2 ${collapsed ? "justify-center" : "gap-2.5"}`}
        >
          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0 text-white text-[11px] font-bold">
            {iniciales}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate leading-none">
                {nombreCompleto}
              </p>
              <p className="text-white/35 text-[10px] truncate mt-0.5 leading-none">
                {formatRol(rolNombre)}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={() => logout()}
          title="Cerrar sesión"
          className={[
            "flex items-center w-full rounded-xl text-white/50 hover:bg-white/8 hover:text-white transition-all text-sm cursor-pointer py-2.5",
            collapsed ? "justify-center px-0" : "gap-3 px-3",
          ].join(" ")}
        >
          <span className="w-[18px] h-[18px] shrink-0">{ICONS["log-out"]}</span>
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}

// ============================================================
// MOBILE DRAWER — top bar + panel deslizable
// Para todos los roles EXCEPTO AJUSTADOR
// ============================================================
function MobileDrawer({ usuario, rolNombre, navItems }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const iniciales =
    [usuario?.nombre?.[0], usuario?.apellido?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "?";
  const nombreCompleto = [usuario?.nombre, usuario?.apellido]
    .filter(Boolean)
    .join(" ");
  const paginaActiva = navItems.find((i) => i.path === location.pathname);

  return (
    <>
      {/* Top bar — ocupa todo el ancho */}
      <header className="flex items-center justify-between px-4 h-14 bg-[#13193a] shrink-0 w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <LogoSVG size={14} />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">Cofisem</p>
            {paginaActiva && (
              <p className="text-white/45 text-[10px] leading-none mt-0.5">
                {paginaActiva.label}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-white text-[11px] font-bold">
            {iniciales}
          </div>
          <button
            onClick={() => setOpen(true)}
            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white active:bg-white/20"
          >
            <span className="w-4 h-4">{ICONS["menu"]}</span>
          </button>
        </div>
      </header>

      {/* Overlay oscuro */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Panel deslizable */}
      <div
        className={[
          "fixed top-0 right-0 bottom-0 w-[280px] bg-[#13193a] z-50 flex flex-col",
          "transition-transform duration-300 ease-in-out shadow-2xl",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        {/* Cabecera del drawer */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {iniciales}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold leading-none truncate">
                {nombreCompleto}
              </p>
              <p className="text-white/40 text-[11px] mt-0.5">
                {formatRol(rolNombre)}
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0 ml-2"
          >
            <span className="w-4 h-4">{ICONS["x"]}</span>
          </button>
        </div>

        {/* Links de navegación */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end
                onClick={() => setOpen(false)}
                className={[
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all my-0.5",
                  isActive
                    ? "bg-white text-[#13193a]"
                    : "text-white/65 hover:bg-white/8 hover:text-white",
                ].join(" ")}
              >
                <span
                  className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-[#13193a]" : "text-white/55"}`}
                >
                  {getIcon(item.icon)}
                </span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Cerrar sesión */}
        <div className="border-t border-white/10 p-4 shrink-0">
          <button
            onClick={() => {
              logout();
              setOpen(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-white/50 hover:bg-white/8 hover:text-white transition-all text-sm"
          >
            <span className="w-[18px] h-[18px] shrink-0">
              {ICONS["log-out"]}
            </span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </>
  );
}

// ============================================================
// MOBILE BOTTOM NAV — EXCLUSIVO para AJUSTADOR
// ============================================================
function AjustadorBottomNav({ navItems }) {
  const location = useLocation();

  return (
    <>
      {/* Top bar mínimo */}
      <header className="flex items-center px-4 h-14 bg-[#13193a] shrink-0 w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <LogoSVG size={14} />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">Cofisem</p>
            <p className="text-white/40 text-[10px] leading-none mt-0.5">
              Ajustador
            </p>
          </div>
        </div>
      </header>

      {/* Bottom nav fija */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200">
        <div className="flex items-stretch h-[60px]">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className={[
                  "flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors",
                  isActive ? "text-[#13193a]" : "text-gray-400",
                ].join(" ")}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-[#13193a] rounded-full" />
                )}
                <span className="w-5 h-5">{getIcon(item.icon)}</span>
                <span className="text-[10px] font-semibold leading-none">
                  {item.label.length > 9
                    ? item.label.slice(0, 8) + "…"
                    : item.label}
                </span>
              </NavLink>
            );
          })}
          <button
            onClick={() => logout()}
            className="flex flex-col items-center justify-center gap-1 px-4 text-gray-400 active:text-gray-600 border-l border-gray-100"
          >
            <span className="w-5 h-5">{ICONS["log-out"]}</span>
            <span className="text-[10px] font-semibold leading-none">
              Salir
            </span>
          </button>
        </div>
        <div
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          className="bg-white"
        />
      </nav>
    </>
  );
}

// ============================================================
// EXPORT PRINCIPAL
// Recibe desktopOnly o mobileOnly para renderizar solo lo que
// corresponde a cada contenedor del AppLayout
// ============================================================
export default function Sidebar({
  usuario,
  rolNombre,
  desktopOnly = false,
  mobileOnly = false,
}) {
  const navItems = NAV_POR_ROL[rolNombre] ?? [];
  const esAjustador = rolNombre === "AJUSTADOR";

  // Modo desktop: solo el sidebar lateral
  if (desktopOnly) {
    return (
      <DesktopSidebar
        usuario={usuario}
        rolNombre={rolNombre}
        navItems={navItems}
      />
    );
  }

  // Modo mobile: topbar + drawer O topbar + bottom nav
  if (mobileOnly) {
    return esAjustador ? (
      <AjustadorBottomNav navItems={navItems} />
    ) : (
      <MobileDrawer
        usuario={usuario}
        rolNombre={rolNombre}
        navItems={navItems}
      />
    );
  }

  // Fallback (no debería usarse directamente)
  return null;
}
