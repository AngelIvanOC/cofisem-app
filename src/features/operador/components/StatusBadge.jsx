const CLS = {
  Vigente:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Por vencer": "bg-amber-50   text-amber-700   border-amber-200",
  Vencida:      "bg-red-50     text-red-600     border-red-200",
  Cancelada:    "bg-gray-100   text-gray-500    border-gray-200",
};

export default function StatusBadge({ estatus }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border ${CLS[estatus] ?? CLS["Cancelada"]}`}>
      {estatus}
    </span>
  );
}
