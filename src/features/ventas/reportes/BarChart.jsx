// ============================================================
// src/features/ventas/reportes/BarChart.jsx
// Mini gráfica de barras SVG reutilizable con tooltip hover
// ============================================================
import { useState } from "react";

export default function BarChart({ data, height = 140, color = "#13193a" }) {
  const [hover, setHover] = useState(null);
  const max  = Math.max(...data.map((d) => d.value), 1);
  const W    = 32;
  const GAP  = 10;
  const svgW = data.length * (W + GAP) - GAP;

  return (
    <svg viewBox={`-4 0 ${svgW + 8} ${height + 40}`} width="100%" height="auto">
      {data.map((d, i) => {
        const bH    = Math.max((d.value / max) * height, 2);
        const x     = i * (W + GAP);
        const y     = height - bH;
        const isH   = hover === i;
        const fill  = d.color ?? (isH ? "#1e2a50" : color);
        return (
          <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor:"default" }}>
            <rect x={x} y={y} width={W} height={bH} rx="6" fill={fill} opacity={isH ? 1 : 0.82} />
            {isH && (
              <g>
                <rect x={x - 4} y={y - 28} width={W + 8} height={22} rx="6" fill="#13193a"/>
                <text x={x + W/2} y={y - 13} textAnchor="middle" fontSize="10" fill="white" fontWeight="700">
                  {d.prefix ?? ""}{d.value}{d.suffix ?? ""}
                </text>
              </g>
            )}
            <text x={x + W/2} y={height + 16} textAnchor="middle" fontSize="9" fill="#9CA3AF">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
