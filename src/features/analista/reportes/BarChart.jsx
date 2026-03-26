// ============================================================
// src/features/analista/reportes/BarChart.jsx
// Mini gráfica de barras SVG — reutilizable en reportes
// ============================================================

export default function BarChart({ data, valueKey, labelKey, color = "#13193a" }) {
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((d, i) => {
        const pct = (d[valueKey] / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="relative w-full flex items-end" style={{ height: 96 }}>
              <div
                className="w-full rounded-t-lg transition-all duration-500"
                style={{ height: `${Math.max(pct, 2)}%`, background: color, opacity: 0.85 }}
              />
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#13193a] text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                ${typeof d[valueKey] === "number" ? d[valueKey].toLocaleString() : d[valueKey]}
              </div>
            </div>
            <p className="text-[9px] text-gray-400 text-center leading-tight truncate w-full">{d[labelKey]}</p>
          </div>
        );
      })}
    </div>
  );
}
