import { useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, UserCheck, ArrowRight, Plus } from "lucide-react";

export default function ReporteExito({ folio, ajustador, horaInicio, horaFin, minutos }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10">
      <div className="w-full max-w-md">

        {/* Encabezado de éxito */}
        <div className="bg-[#13193a] rounded-2xl px-8 py-10 text-center mb-4 relative overflow-hidden">
          {/* Fondo decorativo */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "radial-gradient(circle at 70% 20%, white 0%, transparent 60%)" }} />

          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-emerald-400/10 border-2 border-emerald-400/25 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <p className="text-emerald-400 text-[11px] font-bold uppercase tracking-[0.2em] mb-3">
              Reporte generado exitosamente
            </p>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Número de reporte</p>
            <p className="text-white font-black font-mono text-6xl tracking-tight leading-none">
              {folio}
            </p>
          </div>
        </div>

        {/* Ajustador asignado */}
        {ajustador ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#13193a] flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                Ajustador asignado
              </p>
              <p className="text-[#13193a] font-bold text-sm truncate">{ajustador}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Asignado para folio{" "}
                <span className="font-mono font-semibold text-gray-600">{folio}</span>
              </p>
            </div>
            <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              Asignado
            </span>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <p className="text-xs text-amber-700 font-semibold">
              Sin ajustador asignado — se puede asignar desde la lista de siniestros
            </p>
          </div>
        )}

        {/* Tiempos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Tiempos del reporte
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                Hora Inicio
              </p>
              <p className="text-[#13193a] font-bold font-mono text-sm leading-none">
                {horaInicio}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                Hora Final
              </p>
              <p className="text-[#13193a] font-bold font-mono text-sm leading-none">
                {horaFin}
              </p>
            </div>
            <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider mb-1">
                Tiempo
              </p>
              <p className="text-emerald-700 font-black text-2xl leading-none">{minutos}</p>
              <p className="text-emerald-500 text-[10px] font-bold mt-0.5">min</p>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/gaman/siniestros/nuevo", { replace: true })}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nuevo reporte
          </button>
          <button
            onClick={() => navigate("/gaman/siniestros")}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#13193a] hover:bg-[#1e2a50] text-white text-sm font-bold transition-all"
          >
            Ver siniestros
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
