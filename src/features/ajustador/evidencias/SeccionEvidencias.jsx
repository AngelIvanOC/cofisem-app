// ============================================================
// src/features/ajustador/evidencias/SeccionEvidencias.jsx
// Sección "Evidencias" — solo fotos generales. Las fotos específicas
// (licencia, INE, tarjeta de circulación, vértices, número de serie)
// ya se piden dentro de su módulo correspondiente (NA/Tercero); aquí
// queda una sola caja de documentación/fotos generales por
// participante.
// ============================================================
import { useState, useEffect } from "react";
import { Camera, FileText } from "lucide-react";
import { PanelHeader, AfectadoTag } from "../shared";
import { BtnEvidencia, useEvidencias } from "../EvidenciaUI";
import { fetchPartesInvolucradas } from "../../../services/siniestros";

function PanelParticipante({ siniestro, participante }) {
  const sid = siniestro.id;
  const num = siniestro.numero_siniestro ?? siniestro.folio;
  const general = useEvidencias(sid, num, participante, "documentacion_general");
  const siniestroFotos = useEvidencias(sid, num, participante, "siniestro");

  return (
    <div className="grid grid-cols-2 gap-3">
      <BtnEvidencia label="Fotos del siniestro" icon={<Camera className="w-4 h-4 text-gray-400" />} items={siniestroFotos.items} onAdd={siniestroFotos.agregar} onRemove={siniestroFotos.eliminar} />
      <BtnEvidencia label="Documentación general" icon={<FileText className="w-4 h-4 text-gray-400" />} items={general.items} onAdd={general.agregar} onRemove={general.eliminar} />
    </div>
  );
}

export default function SeccionEvidencias({ siniestro, onVolver }) {
  const [participantes, setParticipantes] = useState([{ id: "NA", label: "N.A." }]);
  const [activo, setActivo] = useState("NA");

  useEffect(() => {
    fetchPartesInvolucradas(siniestro.id).then(({ terceros }) => {
      const ts = terceros.filter((t) => t._dbId).map((t, i) => ({ id: `AF${t._dbId}`, label: t.nombre || `Tercero ${i + 1}` }));
      setParticipantes([{ id: "NA", label: "N.A." }, ...ts]);
    }).catch(() => {});
  }, [siniestro.id]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <PanelHeader titulo="Evidencias" subtitulo={`${siniestro.id} · ${siniestro.asegurado}`} onVolver={onVolver} />
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-4">
        <div className="bg-gray-50 rounded-2xl p-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Participante</p>
          <div className="flex items-center gap-2 flex-wrap">
            {participantes.map((p) => (
              <AfectadoTag key={p.id} label={p.label} active={activo === p.id} onClick={() => setActivo(p.id)} />
            ))}
          </div>
        </div>
        <PanelParticipante siniestro={siniestro} participante={activo} />
      </div>
    </div>
  );
}
