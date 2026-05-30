const CLS = {
  'VIGENTE':    "bg-emerald-50 text-emerald-700 border-emerald-200",
  'POR VENCER': "bg-amber-50   text-amber-700   border-amber-200",
  'VENCIDA':    "bg-red-50     text-red-600     border-red-200",
  'CANCELADA':  "bg-gray-100   text-gray-500    border-gray-200",
  'ANULADA':    "bg-gray-100   text-gray-500    border-gray-200",
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
    <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border ${CLS[key] ?? CLS['CANCELADA']}`}>
      {LABEL[key] ?? estatus}
    </span>
  );
}
