export default function Seccion({ titulo, subtitulo, children, accion }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-[#13193a] px-5 py-3.5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide">{titulo}</h3>
          {subtitulo && <p className="text-white/40 text-xs mt-0.5">{subtitulo}</p>}
        </div>
        {accion}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
