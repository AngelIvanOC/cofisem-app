import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

const ESTATUS_CONFIG = {
  VIGENTE:     { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: "check" },
  "POR VENCER":{ color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   icon: "warning" },
  VENCIDA:     { color: "text-red-700",      bg: "bg-red-50",     border: "border-red-200",     icon: "x" },
  CANCELADA:   { color: "text-gray-600",     bg: "bg-gray-100",   border: "border-gray-200",    icon: "x" },
};

function StatusIcon({ type }) {
  if (type === "check") return (
    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
  if (type === "warning") return (
    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374l7.048-12.14c.866-1.5 3.032-1.5 3.898 0l7.048 12.14zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
  return (
    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function fmtFecha(str) {
  if (!str) return "—";
  const d = new Date(str + "T12:00:00");
  return d.toLocaleDateString("es-MX", { day:"2-digit", month:"long", year:"numeric" });
}

export default function VerificarPoliza() {
  const { constancia } = useParams();
  const [poliza,  setPoliza]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [noFound, setNoFound] = useState(false);

  useEffect(() => {
    if (!constancia) return;
    supabase
      .from("polizas")
      .select("constancia, numero_poliza, estatus, fecha_inicio, fecha_fin, marca, modelo, placas, clientes(nombre, apellido)")
      .eq("constancia", constancia)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setNoFound(true); }
        else { setPoliza(data); }
        setLoading(false);
      });
  }, [constancia]);

  const cfg = poliza ? (ESTATUS_CONFIG[poliza.estatus] ?? ESTATUS_CONFIG.CANCELADA) : null;
  const cliente = poliza?.clientes ?? {};
  const nombre  = [cliente.nombre, cliente.apellido].filter(Boolean).join(" ");

  return (
    <div className="min-h-screen bg-[#13193a] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="bg-[#13193a] px-6 py-5 text-center">
          <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Verificación de póliza</p>
          <p className="text-white font-mono font-bold text-sm break-all">{constancia}</p>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex flex-col items-center py-8">
              <svg className="animate-spin h-8 w-8 text-[#13193a] mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <p className="text-sm text-gray-400">Verificando...</p>
            </div>
          )}

          {!loading && noFound && (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 border-4 border-red-100 flex items-center justify-center mb-4 text-red-500">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-bold text-[#13193a] mb-1">Póliza no encontrada</p>
              <p className="text-sm text-gray-400">El número de constancia no corresponde a ninguna póliza registrada.</p>
            </div>
          )}

          {!loading && poliza && cfg && (
            <div className="space-y-5">
              {/* Status */}
              <div className={`flex flex-col items-center py-5 rounded-2xl border-2 ${cfg.bg} ${cfg.border}`}>
                <div className={cfg.color}>
                  <StatusIcon type={cfg.icon} />
                </div>
                <p className={`mt-2 text-2xl font-black tracking-widest ${cfg.color}`}>{poliza.estatus}</p>
              </div>

              {/* Details */}
              <div className="space-y-3">
                {nombre && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Asegurado</span>
                    <span className="font-semibold text-[#13193a] text-right ml-4">{nombre}</span>
                  </div>
                )}
                {poliza.marca && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Vehículo</span>
                    <span className="font-semibold text-[#13193a]">{poliza.marca} {poliza.modelo}</span>
                  </div>
                )}
                {poliza.placas && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Placas</span>
                    <span className="font-mono font-bold text-[#13193a]">{poliza.placas}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Vigencia inicio</span>
                  <span className="font-semibold text-[#13193a]">{fmtFecha(poliza.fecha_inicio)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Vigencia fin</span>
                  <span className="font-semibold text-[#13193a]">{fmtFecha(poliza.fecha_fin)}</span>
                </div>
              </div>

              <p className="text-center text-[10px] text-gray-300 pt-2">
                COFISEM · Verificación automática
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
