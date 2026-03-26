// ============================================================
// src/shared/ui/Badge.jsx
// Badge de estatus reutilizable en todos los roles
// ============================================================

const ESTATUS_CLS = {
  // Pólizas
  "Vigente":        "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Por vencer":     "bg-amber-50   text-amber-700   border-amber-200",
  "Vencida":        "bg-red-50     text-red-600     border-red-200",
  "Cancelada":      "bg-gray-100   text-gray-500    border-gray-200",
  "Suspendida":     "bg-orange-50  text-orange-700  border-orange-200",
  "Pend. aplicar":  "bg-blue-50    text-blue-700    border-blue-200",
  // Pagos
  "Pendiente":      "bg-amber-50   text-amber-700   border-amber-200",
  "Autorizado":     "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Rechazado":      "bg-red-50     text-red-600     border-red-200",
  "Efectivo":       "bg-gray-100   text-gray-600    border-gray-200",
  // Siniestros
  "Sin asignar":    "bg-red-50     text-red-600     border-red-200",
  "Asignado":       "bg-blue-50    text-blue-700    border-blue-200",
  "En proceso":     "bg-indigo-50  text-indigo-700  border-indigo-200",
  "Completado":     "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Jurídico":       "bg-purple-50  text-purple-700  border-purple-200",
  // Usuarios
  "Activo":         "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Inactivo":       "bg-gray-100   text-gray-500    border-gray-200",
};

const DOT_CLS = {
  "Vigente":        "bg-emerald-500",
  "Por vencer":     "bg-amber-500",
  "Vencida":        "bg-red-500",
  "Cancelada":      "bg-gray-400",
  "Sin asignar":    "bg-red-500",
  "En proceso":     "bg-blue-500",
};

export default function Badge({ estatus, showDot = false, className = "" }) {
  const cls = ESTATUS_CLS[estatus] ?? "bg-gray-100 text-gray-500 border-gray-200";
  const dot = DOT_CLS[estatus];

  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cls} ${className}`}>
      {showDot && dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      )}
      {estatus}
    </span>
  );
}
