// ============================================================
// src/features/ajustador/croquis/CroquisSection.jsx
// Disparador (miniatura / estado vacío) + editor de croquis en
// modal de pantalla completa, sin header ni navegación de la app.
// El editor exige orientación horizontal: en vertical se bloquea
// con una pantalla que pide girar el dispositivo.
// ============================================================
import { useState, useRef, useEffect, useCallback } from "react";
import { X, PenLine, Smartphone } from "lucide-react";
import CroquisEditor from "./CroquisEditor";

function useEsVertical() {
  const calc = () => typeof window !== "undefined" && window.innerWidth < window.innerHeight;
  const [vertical, setVertical] = useState(calc);
  useEffect(() => {
    const onResize = () => setVertical(calc());
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);
  return vertical;
}

function BloqueoGirarDispositivo() {
  return (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
      <style>{`
        @keyframes croquis-girar { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-90deg); } }
      `}</style>
      <Smartphone size={56} className="text-[#13193a]" style={{ animation: "croquis-girar 1.6s ease-in-out infinite" }} />
      <p className="text-base font-bold text-[#13193a]">Gira tu dispositivo</p>
      <p className="text-sm text-gray-500 max-w-xs">
        El croquis se diseña en horizontal para tener más espacio. Acuesta tu teléfono para continuar.
      </p>
    </div>
  );
}

export default function CroquisSection({ croquisDataUrl, onDataUrlChange }) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [plantilla, setPlantilla] = useState("cruce");
  const [norte, setNorte] = useState(0);
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const editorRef = useRef(null);
  const esVertical = useEsVertical();

  useEffect(() => {
    if (!modalAbierto) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previo; };
  }, [modalAbierto]);

  const abrir = () => setModalAbierto(true);
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
              disabled={esVertical}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-[#13193a] disabled:opacity-40"
            >
              Guardar cambios
            </button>
          </div>

          {esVertical ? (
            <BloqueoGirarDispositivo />
          ) : (
            <div className="flex-1 min-h-0">
              <CroquisEditor
                ref={editorRef}
                plantilla={plantilla} setPlantilla={setPlantilla}
                norte={norte} setNorte={setNorte}
                elements={elements} setElements={setElements}
                selectedId={selectedId} setSelectedId={setSelectedId}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
