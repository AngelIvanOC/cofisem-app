// ============================================================
// src/features/ajustador/croquis/CroquisEditor.jsx
// Editor de croquis por arrastre de iconos (vehículos, señales,
// elementos de vía y efectos) sobre una plantilla esquemática.
// Reemplaza el dibujo libre a mano alzada.
// ============================================================
import { useState, useRef, useEffect, useCallback } from "react";
import { Stage, Layer, Transformer, Group } from "react-konva";
import { Trash2, Copy, RotateCcw, RotateCw, Eraser } from "lucide-react";
import { CATEGORIAS, CATALOGO_POR_TIPO, PLANTILLAS } from "./iconCatalog";
import { ICON_COMPONENTS } from "./CroquisIcons";
import { Plantilla, RosaDeLosVientos } from "./CroquisPlantillas";

const DESIGN_W = 720;
const DESIGN_H = 420;

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
      {isSelected && (
        <Group listening={false}>
          {/* halo de selección sutil */}
        </Group>
      )}
    </Group>
  );
}

export default function CroquisEditor({ onDataUrlChange }) {
  const [plantilla, setPlantilla] = useState("cruce");
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [norte, setNorte] = useState(0);
  const [containerWidth, setContainerWidth] = useState(DESIGN_W);
  const [guardadoOk, setGuardadoOk] = useState(false);

  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const trRef = useRef(null);
  const shapeRefs = useRef({});

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (w > 0) setContainerWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = containerWidth / DESIGN_W;

  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const node = selectedId ? shapeRefs.current[selectedId] : null;
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [selectedId, elements]);

  const seleccionado = elements.find((e) => e.id === selectedId) ?? null;
  const catalogoSeleccionado = seleccionado ? CATALOGO_POR_TIPO[seleccionado.tipo] : null;

  const agregarElemento = useCallback((item) => {
    const id = nuevoId(item.tipo);
    const cascade = (elements.length % 6) * 16;
    setElements((els) => [
      ...els,
      {
        id,
        tipo: item.tipo,
        x: DESIGN_W / 2 - 60 + cascade,
        y: DESIGN_H / 2 - 40 + cascade,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        color: item.colores?.[0] ?? null,
        texto: item.tipo === "texto" ? "Escribe aquí" : undefined,
      },
    ]);
    setSelectedId(id);
    setGuardadoOk(false);
  }, [elements.length]);

  const actualizarElemento = useCallback((actualizado) => {
    setElements((els) => els.map((e) => (e.id === actualizado.id ? actualizado : e)));
    setGuardadoOk(false);
  }, []);

  const eliminarSeleccionado = useCallback(() => {
    if (!selectedId) return;
    setElements((els) => els.filter((e) => e.id !== selectedId));
    setSelectedId(null);
    setGuardadoOk(false);
  }, [selectedId]);

  const duplicarSeleccionado = useCallback(() => {
    if (!seleccionado) return;
    const id = nuevoId(seleccionado.tipo);
    setElements((els) => [...els, { ...seleccionado, id, x: seleccionado.x + 20, y: seleccionado.y + 20 }]);
    setSelectedId(id);
    setGuardadoOk(false);
  }, [seleccionado]);

  const cambiarColorSeleccionado = useCallback((color) => {
    if (!seleccionado) return;
    actualizarElemento({ ...seleccionado, color });
  }, [seleccionado, actualizarElemento]);

  const cambiarTextoSeleccionado = useCallback((texto) => {
    if (!seleccionado) return;
    actualizarElemento({ ...seleccionado, texto });
  }, [seleccionado, actualizarElemento]);

  const limpiarTodo = () => {
    setElements([]);
    setSelectedId(null);
    setGuardadoOk(false);
    onDataUrlChange(null);
  };

  const deseleccionarSiFondo = (e) => {
    const clickedOnBackground = e.target === e.target.getStage() || e.target.name?.() === "plantilla-fondo";
    if (clickedOnBackground) setSelectedId(null);
  };

  const guardar = () => {
    setSelectedId(null);
    requestAnimationFrame(() => {
      const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
      onDataUrlChange(uri);
      setGuardadoOk(true);
    });
  };

  return (
    <div className="rounded-2xl border-2 border-gray-200 overflow-hidden bg-white">
      {/* Plantilla + norte */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex gap-1.5">
          {PLANTILLAS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlantilla(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                plantilla === p.id ? "bg-[#13193a] text-white" : "bg-white text-gray-500 border border-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-gray-400 font-semibold mr-1">Norte</span>
          <button type="button" onClick={() => setNorte((n) => n - 15)}
            className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-500">
            <RotateCcw size={14} />
          </button>
          <button type="button" onClick={() => setNorte((n) => n + 15)}
            className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-500">
            <RotateCw size={14} />
          </button>
        </div>
      </div>

      {/* Categorías */}
      <CategoriasYPaleta onAgregar={agregarElemento} />

      {/* Lienzo */}
      <div ref={containerRef} className="relative w-full bg-gray-100" style={{ height: DESIGN_H * scale }}>
        <Stage
          ref={stageRef}
          width={DESIGN_W * scale}
          height={DESIGN_H * scale}
          scaleX={scale}
          scaleY={scale}
          onMouseDown={deseleccionarSiFondo}
          onTouchStart={deseleccionarSiFondo}
        >
          <Layer>
            <Plantilla tipo={plantilla} w={DESIGN_W} h={DESIGN_H} />
            <RosaDeLosVientos x={DESIGN_W - 44} y={44} rotation={norte} />
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
      </div>

      {/* Panel del elemento seleccionado */}
      {seleccionado && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border-t border-gray-200 flex-wrap">
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

      {/* Guardar / limpiar */}
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          onClick={guardar}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#13193a] text-white"
        >
          {guardadoOk ? "Croquis guardado ✓" : "Guardar croquis"}
        </button>
        {elements.length > 0 && (
          <button type="button" onClick={limpiarTodo}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-400">
            <Eraser size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

function CategoriasYPaleta({ onAgregar }) {
  const [categoriaActiva, setCategoriaActiva] = useState(CATEGORIAS[0].id);
  const categoria = CATEGORIAS.find((c) => c.id === categoriaActiva);

  return (
    <div className="border-b border-gray-200">
      <div className="flex gap-1 px-2 py-2 overflow-x-auto bg-white">
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
