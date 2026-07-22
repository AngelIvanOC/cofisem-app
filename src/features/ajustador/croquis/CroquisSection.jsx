// ============================================================
// src/features/ajustador/croquis/CroquisSection.jsx
// Disparador (miniatura / estado vacío) + editor de croquis en
// modal de pantalla completa, sin header ni navegación de la app.
//
// El modal SIEMPRE se ve acostado (horizontal), sin importar cómo
// esté el teléfono: cuando el dispositivo está físicamente en
// vertical, todo el contenido (encabezado, botones, paleta y
// lienzo) se rota 90° como un solo bloque vía CSS. Esto rompería
// el arrastre de los elementos dentro de Konva (que calcula la
// posición del puntero asumiendo que su contenedor nunca está
// rotado) — por eso CroquisEditor recibe `rotadoPorCSS` y aplica
// el parche de forzarRotacionKonva.js para corregir esa cuenta.
// ============================================================
import { useState, useRef, useEffect, useCallback } from "react";
import { X, PenLine, Eraser } from "lucide-react";
import CroquisEditor from "./CroquisEditor";
import { useTamanoFisico } from "../useTamanoFisico";

const MARGEN = 14; // aire de seguridad alrededor del contenido, en px

export default function CroquisSection({ croquisDataUrl, onDataUrlChange, croquisEscena, onEscenaChange }) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [elements, setElements] = useState(() => croquisEscena?.elementos ?? []);
  const [selectedId, setSelectedId] = useState(null);

  const editorRef = useRef(null);
  const fisico = useTamanoFisico();
  const rotarTodo = fisico.w < fisico.h;

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
    onEscenaChange?.({ elementos: elements, version: 1 });
    setModalAbierto(false);
  }, [onDataUrlChange, onEscenaChange, elements]);

  const limpiarTodo = () => {
    setElements([]);
    setSelectedId(null);
  };

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
        ) : elements.length > 0 ? (
          <div className="rounded-2xl border-2 border-gray-200 flex flex-col items-center justify-center gap-2 h-44 bg-gray-50">
            <PenLine size={22} className="text-[#13193a]" />
            <p className="text-xs font-bold text-[#13193a]">Ya tienes un croquis guardado — toca para editarlo</p>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 h-44 bg-gray-50">
            <PenLine size={22} className="text-gray-400" />
            <p className="text-xs font-semibold text-gray-400">Toca para diseñar el croquis del accidente</p>
          </div>
        )}
      </button>

      {modalAbierto && (
        <div className="fixed inset-0 z-[70] bg-[#0b0f24] overflow-hidden">
          <div
            className="flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"
            style={
              rotarTodo
                ? {
                    position: "fixed",
                    top: "50%",
                    left: "50%",
                    width: Math.max(fisico.h - MARGEN * 2, 0),
                    height: Math.max(fisico.w - MARGEN * 2, 0),
                    transform: "translate(-50%, -50%) rotate(90deg)",
                  }
                : {
                    position: "fixed",
                    top: MARGEN, left: MARGEN, right: MARGEN, bottom: MARGEN,
                  }
            }
          >
            <div className="shrink-0 flex items-center justify-between gap-2 px-3 py-2.5 bg-[#13193a]">
              <button type="button" onClick={cerrar} className="p-2 rounded-lg text-white/80 hover:text-white">
                <X size={20} />
              </button>
              <span className="text-sm font-bold text-white">Croquis del accidente</span>
              <div className="flex items-center gap-2">
                {elements.length > 0 && (
                  <button type="button" onClick={limpiarTodo}
                    className="p-2 rounded-lg text-white/70 hover:text-white">
                    <Eraser size={18} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={guardarCambios}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-[#13193a]"
                >
                  Guardar cambios
                </button>
              </div>
            </div>

            <div className="relative flex-1 min-h-0">
              <CroquisEditor
                ref={editorRef}
                rotadoPorCSS={rotarTodo}
                elements={elements} setElements={setElements}
                selectedId={selectedId} setSelectedId={setSelectedId}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
