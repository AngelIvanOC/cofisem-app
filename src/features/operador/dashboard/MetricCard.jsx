// ============================================================
// src/features/operador/dashboard/MetricCard.jsx
// Tarjeta de métrica clickeable — usada en el dashboard operador
// ============================================================

const ACCENT = {
  blue:    "bg-blue-50    border-blue-100    text-blue-700",
  amber:   "bg-amber-50   border-amber-100   text-amber-700",
  emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
  red:     "bg-red-50     border-red-100     text-red-600",
};

const ICON_WRAP = {
  blue:    "bg-blue-100    text-blue-600",
  amber:   "bg-amber-100   text-amber-600",
  emerald: "bg-emerald-100 text-emerald-600",
  red:     "bg-red-100     text-red-600",
};

export default function MetricCard({ label, value, sub, accent = "blue", icon, up, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`${ACCENT[accent]} border rounded-2xl p-4 text-left w-full hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-150`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-gray-600 leading-snug pr-2">{label}</p>
        {icon && (
          <div className={`w-9 h-9 rounded-xl ${ICON_WRAP[accent]} flex items-center justify-center shrink-0`}>
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      {sub && (
        <p className={`text-xs flex items-center gap-1 mt-1.5 font-medium ${
          up === true ? "text-emerald-600" : up === false ? "text-red-500" : "text-gray-400"
        }`}>
          {up === true ? "↑" : up === false ? "↓" : "·"} {sub}
        </p>
      )}
    </button>
  );
}
