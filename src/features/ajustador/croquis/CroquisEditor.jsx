// ============================================================
// src/features/ajustador/croquis/CroquisEditor.jsx
// Editor de croquis por arrastre de iconos (vehículos, señales,
// elementos de vía y efectos) sobre una plantilla esquemática.
// Llena por completo el contenedor donde se monta (pensado para
// usarse dentro de un modal de pantalla completa) y no gestiona
// su propia persistencia: expone exportPNG() por ref.
// ============================================================
import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { Stage, Layer, Transformer, Group } from "react-konva";
import { Trash2, Copy, Plus } from "lucide-react";
import { CATEGORIAS, CATALOGO_POR_TIPO } from "./iconCatalog";
import { ICON_COMPONENTS } from "./CroquisIcons";
import { Plantilla } from "./CroquisPlantillas";
import "./forzarRotacionKonva";

function nuevoId(tipo) {
  return `${tipo}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function ElementoCroquis({ el, isSelected, onSelect, onChange, shapeRef }) {
  const Icono = ICON_COMPONENTS[el.tipo];
  if (!Icono) return null;
  return (
    <Group
      ref={shapeRef}
      x={el.x}
      y={el.y}
      rotation={el.rotation}
      scaleX={el.scaleX}
      scaleY={el.scaleY}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => onChange({ ...el, x: e.target.x(), y: e.target.y() })}
      onTransformEnd={(e) => {
        const node = e.target;
        onChange({
          ...el,
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          scaleX: node.scaleX(),
          scaleY: node.scaleY(),
        });
      }}
    >
      <Icono color={el.color} texto={el.texto} />
      {isSelected && <Group listening={false} />}
    </Group>
  );
}

const CroquisEditor = forwardRef(function CroquisEditor(
  { elements, setElements, selectedId, setSelectedId, rotadoPorCSS },
  ref
) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [paletaAbierta, setPaletaAbierta] = useState(false);

  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const trRef = useRef(null);
  const shapeRefs = useRef({});

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Le avisa al parche de forzarRotacionKonva.js si este Stage vive
  // dentro del contenedor rotado 90° por CSS (ver CroquisSection), para
  // que corrija el cálculo de la posición del puntero.
  useEffect(() => {
    if (stageRef.current) stageRef.current.__rotado90ViaCSS = !!rotadoPorCSS;
  }, [rotadoPorCSS, size.w]);

  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const node = selectedId ? shapeRefs.current[selectedId] : null;
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [selectedId, elements]);

  useImperativeHandle(ref, () => ({
    exportPNG: () =>
      new Promise((resolve) => {
        setSelectedId(null);
        requestAnimationFrame(() => {
          resolve(stageRef.current.toDataURL({ pixelRatio: 2 }));
        });
      }),
  }));

  const seleccionado = elements.find((e) => e.id === selectedId) ?? null;
  const catalogoSeleccionado = seleccionado ? CATALOGO_POR_TIPO[seleccionado.tipo] : null;

  const agregarElemento = useCallback((item) => {
    const id = nuevoId(item.tipo);
    const cx = size.w / 2 || 300;
    const cy = size.h / 2 || 200;
    const cascade = (elements.length % 6) * 16;
    setElements((els) => [
      ...els,
      {
        id,
        tipo: item.tipo,
        x: cx - 60 + cascade,
        y: cy - 40 + cascade,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        color: item.colores?.[0] ?? null,
        texto: item.tipo === "texto" ? "Escribe aquí" : undefined,
      },
    ]);
    setSelectedId(id);
    setPaletaAbierta(false);
  }, [elements.length, size.w, size.h, setElements, setSelectedId]);

  const actualizarElemento = useCallback((actualizado) => {
    setElements((els) => els.map((e) => (e.id === actualizado.id ? actualizado : e)));
  }, [setElements]);

  const eliminarSeleccionado = useCallback(() => {
    if (!selectedId) return;
    setElements((els) => els.filter((e) => e.id !== selectedId));
    setSelectedId(null);
  }, [selectedId, setElements, setSelectedId]);

  const duplicarSeleccionado = useCallback(() => {
    if (!seleccionado) return;
    const id = nuevoId(seleccionado.tipo);
    setElements((els) => [...els, { ...seleccionado, id, x: seleccionado.x + 20, y: seleccionado.y + 20 }]);
    setSelectedId(id);
  }, [seleccionado, setElements, setSelectedId]);

  const cambiarColorSeleccionado = useCallback((color) => {
    if (!seleccionado) return;
    actualizarElemento({ ...seleccionado, color });
  }, [seleccionado, actualizarElemento]);

  const cambiarTextoSeleccionado = useCallback((texto) => {
    if (!seleccionado) return;
    actualizarElemento({ ...seleccionado, texto });
  }, [seleccionado, actualizarElemento]);

  const deseleccionarSiFondo = (e) => {
    const clickedOnBackground = e.target === e.target.getStage() || e.target.name?.() === "plantilla-fondo";
    if (clickedOnBackground) setSelectedId(null);
  };

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Lienzo — ocupa todo el espacio disponible, sin scroll */}
      <div ref={containerRef} className="relative w-full flex-1 min-h-0 bg-gray-100 overflow-hidden">
        {size.w > 0 && (
          <Stage
            ref={stageRef}
            width={size.w}
            height={size.h}
            onMouseDown={deseleccionarSiFondo}
            onTouchStart={deseleccionarSiFondo}
          >
            <Layer>
              <Plantilla w={size.w} h={size.h} />
            </Layer>
            <Layer>
              {elements.map((el) => (
                <ElementoCroquis
                  key={el.id}
                  el={el}
                  isSelected={el.id === selectedId}
                  onSelect={() => setSelectedId(el.id)}
                  onChange={actualizarElemento}
                  shapeRef={(node) => { shapeRefs.current[el.id] = node; }}
                />
              ))}
              <Transformer
                ref={trRef}
                keepRatio
                rotateEnabled
                enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
                boundBoxFunc={(oldBox, newBox) => (newBox.width < 10 || newBox.height < 10 ? oldBox : newBox)}
              />
            </Layer>
          </Stage>
        )}

        {/* Panel del elemento seleccionado — flota sobre el lienzo, nunca
            cambia el tamaño medido del contenedor (evita el "brinco" al
            seleccionar/deseleccionar). */}
        {seleccionado && (
          <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center gap-2 px-3 py-2.5 bg-white/95 backdrop-blur-sm border-t border-gray-200 flex-wrap shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
            <span className="text-xs font-bold text-gray-500 mr-1">{catalogoSeleccionado?.label}</span>

            {seleccionado.tipo === "texto" && (
              <input
                type="text"
                value={seleccionado.texto ?? ""}
                onChange={(e) => cambiarTextoSeleccionado(e.target.value)}
                className="flex-1 min-w-[120px] px-2 py-1 rounded-lg border border-gray-200 text-xs"
                placeholder="Texto del croquis..."
              />
            )}

            {catalogoSeleccionado?.colores && (
              <div className="flex gap-1">
                {catalogoSeleccionado.colores.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => cambiarColorSeleccionado(c)}
                    className={`w-6 h-6 rounded-full border-2 ${seleccionado.color === c ? "border-[#13193a]" : "border-white"}`}
                    style={{ backgroundColor: c, boxShadow: "0 0 0 1px #e5e7eb" }}
                  />
                ))}
              </div>
            )}

            <div className="flex gap-1 ml-auto">
              <button type="button" onClick={duplicarSeleccionado}
                className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-500">
                <Copy size={14} />
              </button>
              <button type="button" onClick={eliminarSeleccionado}
                className="p-1.5 rounded-lg bg-white border border-red-200 text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Botón "+" flotante — abre el panel de elementos. Oculto mientras
            hay algo seleccionado (ese panel ya ocupa esa esquina). */}
        {!seleccionado && !paletaAbierta && (
          <button
            type="button"
            onClick={() => setPaletaAbierta(true)}
            className="absolute left-4 bottom-4 z-20 w-14 h-14 rounded-full bg-[#13193a] text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          >
            <Plus size={26} />
          </button>
        )}

        {/* Telón de fondo del panel de elementos */}
        <div
          className={`absolute inset-0 z-20 bg-black/30 transition-opacity duration-300 ${
            paletaAbierta ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setPaletaAbierta(false)}
        />

        {/* Panel deslizable de categorías + paleta */}
        <div
          className={`absolute left-0 right-0 bottom-0 z-30 bg-white rounded-t-2xl shadow-2xl flex flex-col overflow-hidden transition-transform duration-300 ease-out ${
            paletaAbierta ? "translate-y-0" : "translate-y-full pointer-events-none"
          }`}
          style={{ maxHeight: "48%" }}
        >
          <div className="flex justify-center pt-2 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>
          <CategoriasYPaleta onAgregar={agregarElemento} />
        </div>
      </div>
    </div>
  );
});

export default CroquisEditor;

function CategoriasYPaleta({ onAgregar }) {
  const [categoriaActiva, setCategoriaActiva] = useState(CATEGORIAS[0].id);
  const categoria = CATEGORIAS.find((c) => c.id === categoriaActiva);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="flex gap-1 px-3 py-2 overflow-x-auto bg-white">
        {CATEGORIAS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategoriaActiva(c.id)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              categoriaActiva === c.id ? "bg-[#13193a] text-white" : "bg-gray-50 text-gray-500"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2 px-2 py-2 overflow-x-auto bg-gray-50">
        {categoria.items.map((item) => (
          <button
            key={item.tipo}
            type="button"
            onClick={() => onAgregar(item)}
            className="shrink-0 flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg bg-white border border-gray-200 min-w-[64px]"
          >
            <IconoPreview tipo={item.tipo} color={item.colores?.[0]} />
            <span className="text-[10px] text-gray-500 font-semibold text-center leading-tight">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function IconoPreview({ tipo, color }) {
  const Icono = ICON_COMPONENTS[tipo];
  if (!Icono) return null;
  return (
    <Stage width={40} height={40} listening={false}>
      <Layer>
        <Group x={20} y={20} scaleX={0.55} scaleY={0.55}>
          <Icono color={color} texto="Aa" />
        </Group>
      </Layer>
    </Stage>
  );
}
