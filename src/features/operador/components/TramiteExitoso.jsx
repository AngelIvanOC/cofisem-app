export default function TramiteExitoso({ cotizacion, onNueva, onVolver }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center mb-5">
        <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-[#13193a] mb-2">¡Póliza tramitada!</h2>
      <p className="text-gray-400 text-sm mb-1">
        La cotización <span className="font-mono font-bold text-[#13193a]">{cotizacion.id}</span> fue tramitada exitosamente.
      </p>
      <p className="text-gray-400 text-sm mb-8">
        Cliente: <strong className="text-gray-600">{cotizacion.cliente}</strong>
      </p>
      <div className="flex gap-3">
        <button onClick={onVolver}
          className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
          Ver pólizas
        </button>
        <button onClick={onNueva}
          className="px-6 py-2.5 rounded-xl bg-[#13193a] text-white text-sm font-bold hover:bg-[#1e2a50]">
          Nueva cotización
        </button>
      </div>
    </div>
  );
}
