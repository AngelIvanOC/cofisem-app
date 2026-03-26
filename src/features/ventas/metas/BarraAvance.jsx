// ============================================================
// src/features/ventas/metas/BarraAvance.jsx
// Barra horizontal de avance con proyección al fin de mes
// ============================================================
export default function BarraAvance({ vendedor, actual, meta, primaActual, primaMeta, diasTranscurridos = 20, diasTotales = 31 }) {
  const pct         = Math.min((actual / meta) * 100, 100);
  const ritmoActual = (actual / diasTranscurridos) * diasTotales;
  const proyeccion  = Math.min(Math.round(ritmoActual), meta + 5);
  const superaMeta  = proyeccion >= meta;

  const color = pct >= 100 ? "bg-emerald-500" : pct >= 70 ? "bg-blue-500" : pct >= 40 ? "bg-amber-400" : "bg-red-400";
  const proyColor = superaMeta ? "text-emerald-600" : "text-amber-600";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-[#13193a]">{vendedor}</p>
          <p className="text-xs text-gray-400 mt-0.5">Prima: <span className="font-semibold text-emerald-600">${primaActual.toLocaleString()}</span> / ${primaMeta.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className={`text-xl font-bold tabular-nums ${pct >= 100 ? "text-emerald-600" : pct >= 70 ? "text-blue-600" : "text-amber-600"}`}>
            {Math.round(pct)}%
          </p>
          <p className="text-[11px] text-gray-400">{actual} / {meta} pólizas</p>
        </div>
      </div>

      {/* Barra principal */}
      <div className="relative">
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
        </div>
        {/* Línea de proyección */}
        {proyeccion < meta && (
          <div
            className="absolute top-0 h-3 w-0.5 bg-gray-400/60 rounded-full"
            style={{ left: `${Math.min((proyeccion / meta) * 100, 100)}%` }}
            title={`Proyección: ${proyeccion}`}
          />
        )}
      </div>

      {/* Proyección */}
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-gray-400">Al ritmo actual terminarás el mes con:</span>
        <span className={`font-bold ${proyColor}`}>
          {proyeccion >= meta ? "✓ Meta alcanzada" : `~${proyeccion} pólizas`}
        </span>
      </div>
    </div>
  );
}
