// ============================================================
// src/shared/ui/TablaBase.jsx — RESPONSIVE
// ============================================================

export function TablaBase({ children, footer }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {children}
      {footer && (
        <div className="px-4 sm:px-5 py-3 border-t border-gray-100">
          {footer}
        </div>
      )}
    </div>
  );
}

export function TablaHeader({ children }) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 sm:px-5 py-4 border-b border-gray-100">
      {children}
    </div>
  );
}

export function TablaTabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="flex items-center border-b border-gray-100 px-2 overflow-x-auto scrollbar-none">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onTabChange(t.key)}
          className={[
            "flex items-center gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap",
            activeTab === t.key
              ? "border-[#13193a] text-[#13193a]"
              : "border-transparent text-gray-400 hover:text-gray-600",
          ].join(" ")}
        >
          {t.label}
          {t.badge > 0 && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${t.badgeCls ?? "bg-blue-100 text-blue-700"}`}
            >
              {t.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function TablaScroll({ children }) {
  return (
    <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className = "" }) {
  return (
    <th
      className={`text-left text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-3 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, className = "" }) {
  return (
    <td className={`px-3 sm:px-4 py-3 sm:py-3.5 ${className}`}>{children}</td>
  );
}

export function FilaVacia({ cols, mensaje = "No se encontraron registros." }) {
  return (
    <tr>
      <td
        colSpan={cols}
        className="text-center py-10 sm:py-12 text-sm text-gray-400"
      >
        {mensaje}
      </td>
    </tr>
  );
}

// ── Cards view para mobile (alternativa a la tabla) ─────────
export function CardsMobile({ children }) {
  return <div className="sm:hidden divide-y divide-gray-50">{children}</div>;
}

export function CardMobile({ children, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`px-4 py-4 ${onClick ? "cursor-pointer active:bg-gray-50" : ""}`}
    >
      {children}
    </div>
  );
}
