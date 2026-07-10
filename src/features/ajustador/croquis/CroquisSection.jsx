// ============================================================
// src/features/ajustador/croquis/CroquisSection.jsx
// Disparador (miniatura / estado vacío) + editor de croquis en
// modal de pantalla completa, sin header ni navegación de la app.
// ============================================================
import { useState, useRef, useEffect, useCallback } from "react";
import { X, PenLine, RotateCw as IconoGirar } from "lucide-react";
import CroquisEditor from "./CroquisEditor";

function useSugerirGirarDispositivo() {
  const calc = () => typeof window !== "undefined" && window.innerWidth < window.innerHeight && window.innerWidth < 768;
  const [portrait, setPortrait] = useState(calc);
  useEffect(() => {
    const onResize = () => setPortrait(calc());
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);
  return portrait;
}

export default function CroquisSection({ croquisDataUrl, onDataUrlChange }) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [plantilla, setPlantilla] = useState("cruce");
  const [norte, setNorte] = useState(0);
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [avisoGirarOculto, setAvisoGirarOculto] = useState(false);

  const editorRef = useRef(null);
  const sugerirGirar = useSugerirGirarDispositivo() && !avisoGirarOculto;

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
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-[#13193a]"
            >
              Guardar cambios
            </button>
          </div>

          {sugerirGirar && (
            <div className="shrink-0 flex items-center justify-between gap-2 px-3 py-1.5 bg-amber-50 border-b border-amber-200">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
                <IconoGirar size={13} /> Gira tu dispositivo para más espacio
              </span>
              <button type="button" onClick={() => setAvisoGirarOculto(true)} className="text-amber-500 text-xs font-bold">
                <X size={13} />
              </button>
            </div>
          )}

          <div className="flex-1 min-h-0">
            <CroquisEditor
              ref={editorRef}
              plantilla={plantilla} setPlantilla={setPlantilla}
              norte={norte} setNorte={setNorte}
              elements={elements} setElements={setElements}
              selectedId={selectedId} setSelectedId={setSelectedId}
            />
          </div>
        </div>
      )}
    </>
  );
}
