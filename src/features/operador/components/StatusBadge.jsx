const CLS = {
  'VIGENTE':    "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold",
  'POR VENCER': "bg-amber-50   text-amber-700   border-amber-200 font-semibold",
  'VENCIDA':    "bg-red-50     text-red-600     border-red-200 font-semibold",
  'CANCELADA':  "bg-red-50     text-red-700     border-red-200 font-bold",
  'ANULADA':    "bg-gray-100   text-gray-500    border-gray-200 font-semibold",
};

const LABEL = {
  'VIGENTE':    'Vigente',
  'POR VENCER': 'Por vencer',
  'VENCIDA':    'Vencida',
  'CANCELADA':  'Cancelada',
  'ANULADA':    'Anulada',
};

export default function StatusBadge({ estatus }) {
  const key = (estatus ?? '').toUpperCase();
  return (
    <span className={`inline-flex items-center text-[11px] px-2.5 py-1 rounded-full border ${CLS[key] ?? CLS['CANCELADA']}`}>
      {LABEL[key] ?? estatus}
    </span>
  );
}
