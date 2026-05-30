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
import { useState, useEffect, useRef } from "react";
import { logout } from "../auth.js";
import { NAV_POR_ROL } from "../config/navConfig";
import iconoGaman from "../assets/icono_gaman.svg";
import {
  Home,
  Users,
  FileText,
  HardHat,
  CreditCard,
  BarChart2,
  Shield,
  ClipboardList,
  Calendar,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  PlusCircle,
  TrendingUp,
  Sliders,
} from "lucide-react";

// ── Iconos (Lucide React) ────────────────────────────────────
const ICONS = {
  home: Home,
  users: Users,
  "file-text": FileText,
  "hard-hat": HardHat,
  "credit-card": CreditCard,
  "bar-chart": BarChart2,
  shield: Shield,
  clipboard: ClipboardList,
  calendar: Calendar,
  "log-out": LogOut,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  menu: Menu,
  x: X,
  "plus-circle": PlusCircle,
  "trending-up": TrendingUp,
  sliders: Sliders,
  "edit-square": ClipboardList,
};

// Renderiza el ícono Lucide correspondiente
function getIcon(name, cls = "w-full h-full") {
  const Comp = ICONS[name] ?? ICONS["file-text"];
  return <Comp className={cls} />;
}

function formatRol(rol = "") {
  return rol
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

const LogoSVG = ({ size = 18 }) => (
  <img
    src={iconoGaman}
    alt="GAMAN"
    width={size}
    height={size}
    className="object-contain"
  />
);

// ============================================================
// DESKTOP SIDEBAR — sidebar lateral colapsable
// Sólo se renderiza cuando desktopOnly=true (dentro del flex row desktop)
// ============================================================
function DesktopSidebar({ usuario, rolNombre, navItems }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(true);
  const asideRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        !collapsed &&
        asideRef.current &&
        !asideRef.current.contains(e.target)
      ) {
        setCollapsed(true);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [collapsed]);

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
      ref={asideRef}
      style={{ width: collapsed ? 68 : 224, minWidth: collapsed ? 68 : 224 }}
      className="relative flex flex-col h-full bg-[#13193a] transition-all duration-300 ease-in-out select-none shrink-0"
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expandir" : "Colapsar"}
        className="cursor-pointer absolute -right-3 top-6 z-20 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-[#13193a] hover:bg-gray-50 transition-colors"
      >
        <span className="w-3.5 h-3.5">
          {collapsed ? getIcon("chevron-right") : getIcon("chevron-left")}
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
              onClick={() => setCollapsed(true)}
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
          <span className="w-[18px] h-[18px] shrink-0">
            {getIcon("log-out")}
          </span>
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
            <span className="w-4 h-4">{getIcon("menu")}</span>
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
            <span className="w-4 h-4">{getIcon("x")}</span>
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
              {getIcon("log-out")}
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
            <span className="w-5 h-5">{getIcon("log-out")}</span>
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
