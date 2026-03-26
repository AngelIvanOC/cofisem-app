// ============================================================
// src/features/supervisor/siniestros/ModalDesglose.jsx
// Detalle completo + línea de tiempo del siniestro
// ============================================================
import Modal from "../../../shared/ui/Modal";
import Badge from "../../../shared/ui/Badge";

const Row = ({ l, v }) => (
  <div>
    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{l}</p>
    <p className="text-sm text-[#13193a] font-semibold mt-0.5">{v || "—"}</p>
  </div>
);

export default function ModalDesglose({ siniestro: s, onClose, onReasignar, onCanalizar }) {
  const timeline = [
    { hora: s.horaReporte ?? "08:30", label: "Siniestro reportado",   done: true  },
    { hora: s.horaAsig    ?? "09:15", label: "Ajustador asignado",     done: !!s.ajustador },
    { hora: s.horaArribo  ?? "—",     label: "Arribo al lugar",        done: s.estatus !== "Asignado" },
    { hora: s.horaEvidencia?? "—",    label: "Evidencia capturada",    done: ["Cerrado","Resolución"].includes(s.estatus) },
    { hora: s.horaResol   ?? "—",     label: "Resolución generada",    done: s.estatus === "Cerrado" },
  ];

  return (
    <Modal onClose={onClose} title={s.folio} subtitle={`${s.tipo} · ${s.fecha} ${s.hora}`} maxWidth="max-w-2xl">
      <div className="p-6 space-y-6">
        {/* Estatus + acciones */}
        <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl flex-wrap">
          <Badge estatus={s.estatus} showDot />
          <span className="text-xs text-gray-500">Ajustador: <span className="font-semibold text-[#13193a]">{s.ajustador ?? "Sin asignar"}</span></span>
          <div className="flex-1" />
          <button onClick={() => onReasignar(s)} className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-colors">
            Reasignar
          </button>
          <button onClick={() => onCanalizar(s)} className="px-3.5 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold hover:bg-purple-100 transition-colors">
            Canalizar
          </button>
        </div>

        {/* Datos asegurado + siniestro */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100 pb-2">Asegurado</p>
            <Row l="Nombre"    v={s.asegurado}  />
            <Row l="Póliza"    v={s.poliza}     />
            <Row l="Placas"    v={s.placas}     />
            <Row l="Cobertura" v={s.cobertura}  />
          </div>
          <div className="space-y-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100 pb-2">Siniestro</p>
            <Row l="Tipo"   v={s.tipo}   />
            <Row l="Fecha"  v={s.fecha}  />
            <Row l="Hora"   v={s.hora}   />
            <Row l="Lugar"  v={s.lugar}  />
          </div>
        </div>

        {s.tercero?.lesionados && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-semibold flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
            Hay personas lesionadas reportadas en este siniestro
          </div>
        )}

        {/* Línea de tiempo */}
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100 pb-2 mb-4">Línea de tiempo</p>
          <div className="space-y-0">
            {timeline.map((t, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${t.done ? "bg-emerald-500" : "bg-gray-200"}`}>
                    {t.done
                      ? <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      : <div className="w-2 h-2 rounded-full bg-gray-400" />
                    }
                  </div>
                  {i < timeline.length - 1 && <div className={`w-0.5 h-6 ${t.done ? "bg-emerald-200" : "bg-gray-100"}`} />}
                </div>
                <div className="pb-3">
                  <p className={`text-sm font-semibold ${t.done ? "text-[#13193a]" : "text-gray-400"}`}>{t.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 font-mono">{t.hora}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {s.notas && (
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Notas</p>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{s.notas}</p>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
        <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          Cerrar
        </button>
      </div>
    </Modal>
  );
}
