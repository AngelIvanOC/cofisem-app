// `compacto`: para columnas angostas (lista del ajustador) — oculta los
// textos "Anterior"/"Siguiente" y la palabra "registros".
export default function Paginator({ page, totalPages, total, pageSize, onPage, compacto = false }) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  const btnCls =
    `flex items-center gap-1.5 ${compacto ? "px-2" : "px-3"} py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors select-none`;

  return (
    <div className={`flex items-center justify-between ${compacto ? "px-4" : "px-5"} py-3 border-t border-gray-100 bg-white`}>
      <span className="text-xs text-gray-400">
        {from}–{to} de {total}{compacto ? "" : " registros"}
      </span>
      <div className="flex items-center gap-2">
        <button className={btnCls} onClick={() => onPage(page - 1)} disabled={page === 1} aria-label="Página anterior">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
          </svg>
          {!compacto && "Anterior"}
        </button>
        <span className={`text-xs text-gray-500 ${compacto ? "min-w-[40px]" : "min-w-[60px]"} text-center`}>
          {page} / {totalPages}
        </span>
        <button className={btnCls} onClick={() => onPage(page + 1)} disabled={page === totalPages} aria-label="Página siguiente">
          {!compacto && "Siguiente"}
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
