// ============================================================
// src/features/ajustador/tercero/TerceroModulo4Lesionados.jsx
// Tercero · Módulo 4: Lesionados adjuntos a este tercero — antes vivía
// incrustado dentro de "Datos personales", ahora es su propio módulo
// (entre Daños y Servicios), cada lesionado con su propia sección.
// ============================================================
import { PanelHeader } from "../shared";
import LesionadosPanel from "../LesionadosPanel";

export default function TerceroModulo4Lesionados({ siniestro, datos, onVolver }) {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <PanelHeader titulo="Lesionados" subtitulo="Tercero · Módulo 4 de 5" onVolver={onVolver} />
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4">
        {datos._dbId ? (
          <LesionadosPanel
            siniestro={siniestro}
            terceroId={String(datos._dbId)}
            copiaDisponible={{ nombre: datos.nombre, domicilio: datos.direccion, telefono: datos.telefono, edad: datos.edad }}
            responsableNombre={datos.nombre}
          />
        ) : (
          <p className="text-xs text-gray-400 text-center py-8">Guarda los datos del tercero (Módulo 1) primero para poder agregar lesionados.</p>
        )}
      </div>
    </div>
  );
}
