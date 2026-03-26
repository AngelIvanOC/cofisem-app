// ============================================================
// src/features/ajustador/siniestros/pasos/ModeloDanos.jsx
// Paso 4: Modelo interactivo de daños del vehículo (SVG clickeable)
// ============================================================
import { useState } from "react";

// Zonas del vehículo con sus coordenadas en el SVG
const ZONAS = [
  { id:"capot",       label:"Capó / Cofre",        cx:200, cy:105, r:28 },
  { id:"defensa_f",   label:"Defensa delantera",    cx:200, cy:60,  r:22 },
  { id:"techo",       label:"Techo",                cx:200, cy:175, r:28 },
  { id:"cajuela",     label:"Cajuela",              cx:200, cy:245, r:28 },
  { id:"defensa_t",   label:"Defensa trasera",      cx:200, cy:290, r:22 },
  { id:"puerta_di",   label:"Puerta del. izq.",     cx:130, cy:150, r:22 },
  { id:"puerta_dd",   label:"Puerta del. der.",     cx:270, cy:150, r:22 },
  { id:"puerta_ti",   label:"Puerta tras. izq.",    cx:130, cy:200, r:22 },
  { id:"puerta_td",   label:"Puerta tras. der.",    cx:270, cy:200, r:22 },
  { id:"cofre_i",     label:"Guardafango izq.",     cx:140, cy:100, r:20 },
  { id:"cofre_d",     label:"Guardafango der.",     cx:260, cy:100, r:20 },
  { id:"toldo_i",     label:"Estribo izquierdo",    cx:120, cy:175, r:18 },
  { id:"toldo_d",     label:"Estribo derecho",      cx:280, cy:175, r:18 },
  { id:"cajuela_i",   label:"Cuarto trasero izq.",  cx:140, cy:248, r:20 },
  { id:"cajuela_d",   label:"Cuarto trasero der.",  cx:260, cy:248, r:20 },
  { id:"cristal_f",   label:"Parabrisas delantero", cx:200, cy:130, r:20 },
  { id:"cristal_t",   label:"Luneta trasera",       cx:200, cy:220, r:20 },
];

const SEVERIDAD = ["Rayón","Abolladura","Golpe","Destruido"];
const SEV_COLOR = { "Rayón":"#FCD34D","Abolladura":"#FB923C","Golpe":"#EF4444","Destruido":"#7F1D1D" };

export default function ModeloDanos({ onSiguiente, onAnterior }) {
  const [danos,     setDanos]     = useState({});    // { zonaId: { severidad, nota } }
  const [zonaActiva,setZonaActiva]= useState(null);
  const [sevTemp,   setSevTemp]   = useState("Abolladura");
  const [notaTemp,  setNotaTemp]  = useState("");

  const aplicar = () => {
    if (!zonaActiva) return;
    setDanos((prev) => ({ ...prev, [zonaActiva]: { severidad: sevTemp, nota: notaTemp } }));
    setZonaActiva(null); setNotaTemp("");
  };

  const quitar = (id) => setDanos((prev) => { const n = { ...prev }; delete n[id]; return n; });

  const lista = Object.entries(danos);

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">Toca las zonas del vehículo para marcar los daños encontrados.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SVG vehículo */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center justify-center">
          <svg viewBox="60 30 280 290" width="100%" height="auto" className="max-h-72">
            {/* Silueta del vehículo (simplificada) */}
            <ellipse cx="200" cy="175" rx="85" ry="145" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1.5" />
            <ellipse cx="200" cy="175" rx="72" ry="120" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1" />
            {/* Línea central */}
            <line x1="200" y1="40" x2="200" y2="315" stroke="#D1D5DB" strokeWidth="0.5" strokeDasharray="4,4" />
            {/* Zonas clickeables */}
            {ZONAS.map((z) => {
              const dano = danos[z.id];
              const activa = zonaActiva === z.id;
              return (
                <g key={z.id} onClick={() => { setZonaActiva(activa ? null : z.id); setNotaTemp(dano?.nota ?? ""); setSevTemp(dano?.severidad ?? "Abolladura"); }} style={{ cursor: "pointer" }}>
                  <circle
                    cx={z.cx} cy={z.cy} r={z.r}
                    fill={dano ? SEV_COLOR[dano.severidad] + "CC" : activa ? "#13193A22" : "transparent"}
                    stroke={activa ? "#13193A" : dano ? SEV_COLOR[dano.severidad] : "#9CA3AF"}
                    strokeWidth={activa ? 2.5 : 1.5}
                    strokeDasharray={activa && !dano ? "4,3" : "none"}
                  />
                  {dano && (
                    <text x={z.cx} y={z.cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="white" fontWeight="bold">
                      {dano.severidad[0]}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Panel lateral */}
        <div className="space-y-3">
          {/* Selector de zona activa */}
          {zonaActiva ? (
            <div className="bg-white border-2 border-[#13193a]/20 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-bold text-[#13193a]">
                {ZONAS.find((z) => z.id === zonaActiva)?.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {SEVERIDAD.map((s) => (
                  <button key={s} onClick={() => setSevTemp(s)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${sevTemp === s ? "text-white border-transparent" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                    style={sevTemp === s ? { backgroundColor: SEV_COLOR[s], borderColor: SEV_COLOR[s] } : {}}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <textarea rows={2} value={notaTemp} onChange={(e) => setNotaTemp(e.target.value)} placeholder="Descripción del daño (opcional)..."
                className="w-full px-3 py-2 rounded-xl border-2 border-gray-100 bg-gray-50 text-xs resize-none focus:outline-none focus:border-[#13193a] transition-colors" />
              <div className="flex gap-2">
                <button onClick={() => { setZonaActiva(null); setNotaTemp(""); }} className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors">Cancelar</button>
                <button onClick={aplicar} className="flex-1 py-2 rounded-xl bg-[#13193a] text-white text-xs font-bold hover:bg-[#1e2a50] transition-colors">Aplicar</button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center text-xs text-gray-400">
              Toca una zona del vehículo para registrar un daño
            </div>
          )}

          {/* Lista de daños registrados */}
          {lista.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Daños registrados ({lista.length})</p>
              {lista.map(([id, d]) => (
                <div key={id} className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-xl px-3 py-2.5">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: SEV_COLOR[d.severidad] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#13193a] truncate">{ZONAS.find((z) => z.id === id)?.label}</p>
                    {d.nota && <p className="text-[10px] text-gray-400 truncate">{d.nota}</p>}
                  </div>
                  <span className="text-[10px] font-bold" style={{ color: SEV_COLOR[d.severidad] }}>{d.severidad}</span>
                  <button onClick={() => quitar(id)} className="text-gray-300 hover:text-red-400 transition-colors ml-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onAnterior} className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">← Atrás</button>
        <button onClick={() => onSiguiente({ danos })} disabled={lista.length === 0} className="flex-1 py-3 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white font-bold text-sm transition-all disabled:opacity-40">
          {lista.length === 0 ? "Registra al menos un daño" : "Continuar →"}
        </button>
      </div>
    </div>
  );
}
