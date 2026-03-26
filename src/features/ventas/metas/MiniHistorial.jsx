// ============================================================
// src/features/ventas/metas/MiniHistorial.jsx
// Historial de los últimos 6 meses con sparkline SVG
// ============================================================
const MESES_CORTOS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function Sparkline({ data, color = "#13193a", height = 40 }) {
  const max = Math.max(...data, 1);
  const w   = 200;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - (v / max) * height;
    return `${x},${y}`;
  }).join(" ");
  const area = `0,${height} ${pts} ${w},${height}`;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#spark-grad)"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function MiniHistorial({ datos }) {
  // datos: [{ mes: 0, polizas: 12, prima: 26400 }, ...]
  const polizasData = datos.map((d) => d.polizas);
  const meta        = datos[0]?.meta ?? 15;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <p className="text-sm font-bold text-[#13193a]">Historial — últimos 6 meses</p>

      {/* Sparkline */}
      <div className="h-12">
        <Sparkline data={polizasData} color="#13193a" height={48} />
      </div>

      {/* Tabla */}
      <div className="overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              {["Mes","Pólizas","Meta","Prima","%"].map((h) => (
                <th key={h} className="pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide pr-4 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {datos.map((d, i) => {
              const pct = Math.round((d.polizas / meta) * 100);
              return (
                <tr key={i}>
                  <td className="py-2 text-xs font-semibold text-[#13193a] pr-4">{MESES_CORTOS[d.mes]}</td>
                  <td className="py-2 text-xs text-gray-700 font-bold tabular-nums pr-4">{d.polizas}</td>
                  <td className="py-2 text-xs text-gray-400 pr-4">{meta}</td>
                  <td className="py-2 text-xs text-emerald-600 font-semibold tabular-nums pr-4">${d.prima.toLocaleString()}</td>
                  <td className="py-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${pct >= 100 ? "bg-emerald-50 text-emerald-700" : pct >= 70 ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
                      {pct}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
