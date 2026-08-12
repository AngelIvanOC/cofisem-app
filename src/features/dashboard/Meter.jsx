// Anillo de progreso — un solo color (misma rampa clara/oscura), sin leyenda: el título ya dice qué mide.
export default function Meter({ pct, size = 104, stroke = 11 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, pct));
  const offset = c * (1 - p / 100);
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#d1fae5" strokeWidth={stroke} />
      {p > 0 && (
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="#059669" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      )}
    </svg>
  );
}
