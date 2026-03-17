// ============================================================
// src/components/Sidebar.jsx
// ── Fixes aplicados:
//   • Label del usuario ya no se desborda en collapsed
//   • Tooltip nativo en TODOS los items cuando está colapsado
//   • Rol se muestra con formato legible (underscores → espacios)
//   • "Reportar Sin." ya no se trunca raro → label completo
//   • Hover states más suaves
//   • Separador visual entre grupos de nav (si hubiera)
//   • Scroll de nav más limpio
// ============================================================
import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { logout } from "../auth.js";
import { NAV_POR_ROL } from "../config/navConfig";

// ── Iconos SVG inline (sin dependencias externas) ───────────
const ICONS = {
  "home": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  "users": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/>
      <path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  "file-text": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  "dollar-sign": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
    </svg>
  ),
  "hard-hat": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 18a1 1 0 001 1h18a1 1 0 001-1v-2a1 1 0 00-1-1H3a1 1 0 00-1 1v2z"/>
      <path d="M10 10V5a1 1 0 011-1h2a1 1 0 011 1v5"/>
      <path d="M4 15v-3a8 8 0 0116 0v3"/>
    </svg>
  ),
  "credit-card": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  "bar-chart": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
      <line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  "edit": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  "shield": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  "clipboard": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  ),
  "upload": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/>
      <line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
    </svg>
  ),
  "check-circle": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  "refresh-cw": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
    </svg>
  ),
  "target": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  "calendar": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  // Ícono mejorado para "lista de siniestros"
  "edit-square": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
      <line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
  ),
  "log-out": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  "chevron-left": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  "chevron-right": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
};

// Convierte "CABINERO_SINIESTROS" → "Cabinero Siniestros"
function formatRol(rol = "") {
  return rol
    .split("_")
    .map(w => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export default function Sidebar({ usuario, rolNombre }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const navItems = NAV_POR_ROL[rolNombre] ?? [];
  const iniciales = [usuario?.nombre?.[0], usuario?.apellido?.[0]]
    .filter(Boolean).join("").toUpperCase() || "?";
  const nombreCompleto = [usuario?.nombre, usuario?.apellido].filter(Boolean).join(" ");

  return (
    <aside
      style={{ width: collapsed ? 68 : 224, minWidth: collapsed ? 68 : 224 }}
      className="relative flex flex-col h-screen bg-[#13193a] transition-all duration-300 ease-in-out select-none overflow-hidden"
    >
      {/* ── Botón colapsar ── */}
      <button
        onClick={() => setCollapsed(c => !c)}
        aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
        className="absolute -right-3 top-6 z-20 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-[#13193a] hover:bg-gray-50 transition-colors"
      >
        <span className="w-3.5 h-3.5">
          {collapsed ? ICONS["chevron-right"] : ICONS["chevron-left"]}
        </span>
      </button>

      {/* ── Logo / Marca ── */}
      <div className={`flex items-center border-b border-white/10 shrink-0 ${collapsed ? "justify-center px-0 py-5" : "gap-3 px-4 py-5"}`}>
        {/* Logo SVG */}
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
            <path d="M12 24C12 17.373 17.373 12 24 12C30.627 12 36 17.373 36 24C36 30.627 30.627 36 24 36"
              stroke="white" strokeWidth="3" strokeLinecap="round"/>
            <path d="M24 36C20 36 16 32 16 28C16 24 20 20 24 20"
              stroke="#7c8fff" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="24" cy="24" r="3" fill="white"/>
          </svg>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-none">Cofisem</p>
            <p className="text-white/40 text-[10px] mt-0.5 leading-none">Gestión de Seguros</p>
          </div>
        )}
      </div>

      {/* ── Navegación ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-none">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const icon = ICONS[item.icon] ?? ICONS["file-text"];

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end
              title={item.label} // tooltip siempre disponible (útil en collapsed)
              className={[
                "flex items-center mx-2 my-0.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                collapsed ? "justify-center px-0 py-2.5 h-10" : "gap-3 px-3 py-2.5",
                isActive
                  ? "bg-white text-[#13193a]"
                  : "text-white/65 hover:bg-white/8 hover:text-white",
              ].join(" ")}
            >
              <span className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-[#13193a]" : "text-white/55 group-hover:text-white"}`}>
                {icon}
              </span>
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Footer: usuario + logout ── */}
      <div className="border-t border-white/10 p-2.5 space-y-0.5 shrink-0">
        {/* Info del usuario */}
        <div className={`flex items-center rounded-xl px-2 py-2 ${collapsed ? "justify-center" : "gap-2.5"}`}>
          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0 text-white text-[11px] font-bold">
            {iniciales}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate leading-none">{nombreCompleto}</p>
              <p className="text-white/35 text-[10px] truncate mt-0.5 leading-none">{formatRol(rolNombre)}</p>
            </div>
          )}
        </div>

        {/* Cerrar sesión */}
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