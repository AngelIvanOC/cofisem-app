// ============================================================
// src/features/ventas/metas/Termometro.jsx
// Termómetro SVG de avance mensual con animación
// ============================================================
export default function Termometro({ actual, meta, label, height = 200 }) {
  const pct    = Math.min((actual / meta) * 100, 100);
  const color  = pct >= 100 ? "#10B981" : pct >= 70 ? "#3B82F6" : pct >= 40 ? "#F59E0B" : "#EF4444";
  const bH     = Math.round((pct / 100) * (height - 40));
  const gradId = `grad-${label.replace(/\s/g,"_")}`;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="60" height={height} viewBox={`0 0 60 ${height}`}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="1"/>
            <stop offset="100%" stopColor={color} stopOpacity="0.6"/>
          </linearGradient>
          <clipPath id={`clip-${label}`}>
            <rect x="18" y="10" width="24" height={height - 40} rx="12"/>
          </clipPath>
        </defs>
        {/* Tubo fondo */}
        <rect x="18" y="10" width="24" height={height - 40} rx="12" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1.5"/>
        {/* Marcas */}
        {[25,50,75,100].map((m) => {
          const y = (height - 40) - Math.round((m / 100) * (height - 40)) + 10;
          return <line key={m} x1="44" y1={y} x2="50" y2={y} stroke="#D1D5DB" strokeWidth="1.5"/>;
        })}
        {/* Relleno animado */}
        <rect
          x="18" y={height - 40 - bH + 10} width="24" height={bH} rx="0"
          fill={`url(#${gradId})`}
          clipPath={`url(#clip-${label})`}
          style={{ transition: "all 0.8s ease-out" }}
        />
        {/* Bola base */}
        <circle cx="30" cy={height - 18} r="14" fill={color} opacity="0.9"/>
        <circle cx="30" cy={height - 18} r="9"  fill={color}/>
        {/* Valor en bola */}
        <text x="30" y={height - 14} textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">
          {actual}
        </text>
      </svg>
      <div className="text-center">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold tabular-nums mt-0.5" style={{ color }}>{Math.round(pct)}%</p>
        <p className="text-[11px] text-gray-400">{actual} / {meta}</p>
      </div>
    </div>
  );
}
