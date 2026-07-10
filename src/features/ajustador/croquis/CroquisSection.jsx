// ============================================================
// src/features/ajustador/croquis/CroquisSection.jsx
// Disparador (miniatura / estado vacío) + editor de croquis en
// modal de pantalla completa, sin header ni navegación de la app.
// El lienzo del editor siempre dibuja su contenido en horizontal
// (rotación interna en Konva, ver CroquisEditor), así que es
// usable con el teléfono parado o acostado. Al abrir se muestra
// un aviso breve sugiriendo acostar el teléfono, solo informativo.
// ============================================================
import { useState, useRef, useEffect, useCallback } from "react";
import { X, PenLine, Smartphone } from "lucide-react";
import CroquisEditor from "./CroquisEditor";

function esFisicamenteVertical() {
  return typeof window !== "undefined" && window.innerWidth < window.innerHeight;
}

export default function CroquisSection({ croquisDataUrl, onDataUrlChange }) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [plantilla, setPlantilla] = useState("cruce");
  const [norte, setNorte] = useState(0);
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [mostrarAviso, setMostrarAviso] = useState(false);

  const editorRef = useRef(null);

  useEffect(() => {
    if (!modalAbierto) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previo; };
  }, [modalAbierto]);

  const abrir = () => {
    setModalAbierto(true);
    if (esFisicamenteVertical()) {
      setMostrarAviso(true);
      setTimeout(() => setMostrarAviso(false), 1500);
    }
  };
  const cerrar = () => setModalAbierto(false);

  const guardarCambios = useCallback(async () => {
    const uri = await editorRef.current.exportPNG();
    onDataUrlChange(uri);
    setModalAbierto(false);
  }, [onDataUrlChange]);

  return (
    <>
      <button type="button" onClick={abrir} className="w-full text-left">
        {croquisDataUrl ? (
          <div className="rounded-2xl border-2 border-gray-200 overflow-hidden">
            <img src={croquisDataUrl} alt="Croquis del accidente" className="w-full h-44 object-contain bg-gray-50" />
            <p className="text-center text-xs font-bold text-[#13193a] py-2 bg-gray-50 border-t border-gray-200">
              Toca para editar el croquis
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 h-44 bg-gray-50">
            <PenLine size={22} className="text-gray-400" />
            <p className="text-xs font-semibold text-gray-400">Toca para diseñar el croquis del accidente</p>
          </div>
        )}
      </button>

      {modalAbierto && (
        <div className="fixed inset-0 z-[70] bg-white flex flex-col overflow-hidden">
          <div className="shrink-0 flex items-center justify-between gap-2 px-3 py-2.5 bg-[#13193a]">
            <button type="button" onClick={cerrar} className="p-2 rounded-lg text-white/80 hover:text-white">
              <X size={20} />
            </button>
            <span className="text-sm font-bold text-white">Croquis del accidente</span>
            <button
              type="button"
              onClick={guardarCambios}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-[#13193a]"
            >
              Guardar cambios
            </button>
          </div>

          <div className="relative flex-1 min-h-0">
            <CroquisEditor
              ref={editorRef}
              plantilla={plantilla} setPlantilla={setPlantilla}
              norte={norte} setNorte={setNorte}
              elements={elements} setElements={setElements}
              selectedId={selectedId} setSelectedId={setSelectedId}
            />

            {mostrarAviso && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#13193a]/90 pointer-events-none">
                <style>{`
                  @keyframes croquis-girar { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-90deg); } }
                `}</style>
                <Smartphone size={40} className="text-white" style={{ animation: "croquis-girar 1.4s ease-in-out infinite" }} />
                <p className="text-sm font-bold text-white">Acuesta tu teléfono para más espacio</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
