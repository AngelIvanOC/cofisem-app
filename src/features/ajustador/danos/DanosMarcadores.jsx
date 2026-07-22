// ============================================================
// src/features/ajustador/danos/DanosMarcadores.jsx
// Tarjeta disparadora + editor de pantalla completa para marcar
// puntos de daño sobre fotos reales del carro por lado (frente,
// derecha...). Mismo patrón de UX que Croquis (CroquisSection.jsx):
// modal fixed inset-0 forzado a verse horizontal (rotado por CSS
// cuando el teléfono está en vertical, useTamanoFisico).
//
// La imagen usa object-fit:contain dentro de un contenedor que no
// siempre tiene su misma proporción — sobra franja arriba/abajo o a
// los lados ("letterbox"), y ESA franja cambia según el tamaño de
// pantalla. Los toques/marcadores se anclan al rectángulo REAL de la
// imagen (rectoContenido), no al contenedor completo.
//
// El punto exacto donde cae el primer toque en un teléfono puede
// variar un poco por lector táctil/densidad de píxel — en vez de
// perseguir ese milímetro, los marcadores son ARRASTRABLES (como un
// pin de mapa): tocas para soltarlo y lo puedes ajustar arrastrando,
// sin poder salirse de la imagen (clamp a 0–1).
//
// El popover de "monto" NO vive dentro del bloque rotado: se dibuja
// con un Portal a document.body y se posiciona en coordenadas reales
// de pantalla (getBoundingClientRect() del marcador ya da coordenadas
// post-rotación), clamp contra window.visualViewport — así el teclado
// nunca lo tapa ni queda atrapado por el `transform: rotate()` del
// contenedor (un ancestro con transform se vuelve el "contenedor" de
// cualquier position:fixed/absolute adentro, así que había que salir
// del árbol rotado para que el popover use la pantalla real).
//
// value: { [ladoId]: [{ id, xPct, yPct, monto, nota }, ...] }
// El número de cada marcador (1, 2, 3...) NO se guarda — es su
// posición en la numeración global (recorriendo los lados en el
// orden de LADOS_CARRO), así que borrar uno renumera solo.
// ============================================================
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Undo2, Trash2, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useTamanoFisico } from "../useTamanoFisico";
import { LADOS_CARRO } from "./lados";

const MARGEN = 14;
const CLAMP = (v) => Math.min(1, Math.max(0, v));
const UMBRAL_ARRASTRE = 6; // px — menos que esto se trata como toque, no arrastre

function totalMarcadores(value) {
  return LADOS_CARRO.reduce((acc, l) => acc + (value?.[l.id]?.length ?? 0), 0);
}

function numeroGlobal(value, ladoId, idxEnLado) {
  let n = 0;
  for (const l of LADOS_CARRO) {
    if (l.id === ladoId) return n + idxEnLado + 1;
    n += value?.[l.id]?.length ?? 0;
  }
  return idxEnLado + 1;
}

// Rectángulo real donde se ve la imagen dentro de su contenedor con
// object-fit:contain (letterbox incluido), en coordenadas relativas
// al propio contenedor (no a la ventana).
function rectoContenido(contW, contH, naturalW, naturalH) {
  if (!contW || !contH || !naturalW || !naturalH) return null;
  const contAspect = contW / contH;
  const imgAspect = naturalW / naturalH;
  let w, h;
  if (imgAspect > contAspect) { w = contW; h = w / imgAspect; }
  else { h = contH; w = h * imgAspect; }
  return { left: (contW - w) / 2, top: (contH - h) / 2, width: w, height: h };
}

// Convierte un punto real de pantalla (clientX/clientY, ya en
// coordenadas post-rotación porque getBoundingClientRect() también lo
// está) a fracción 0–1 relativa al contenido de la imagen.
//
// Cuando el bloque está rotado 90° por CSS (`rotado=true`), el rect
// que devuelve getBoundingClientRect() tiene ancho/alto intercambiados
// respecto al layout local, y los ejes quedan traspuestos: el eje X
// local (izquierda→derecha de la imagen) pasa a recorrerse verticalmente
// en pantalla, y el eje Y local (arriba→abajo) pasa a recorrerse
// horizontalmente pero invertido. Sin esta corrección, tocar un punto
// en el teléfono (vertical, forzado a verse horizontal) coloca el
// marcador en un lugar completamente distinto al que se tocó.
function puntoAFraccion(rect, clientX, clientY, rotado) {
  if (rotado) {
    return {
      xPct: CLAMP((clientY - rect.top) / rect.height),
      yPct: CLAMP(1 - (clientX - rect.left) / rect.width),
    };
  }
  return {
    xPct: CLAMP((clientX - rect.left) / rect.width),
    yPct: CLAMP((clientY - rect.top) / rect.height),
  };
}

// Marcador arrastrable: pointerdown arranca captura; si el pointer se
// mueve más del umbral antes de soltar, se trata como arrastre (mueve
// el punto en vivo); si se suelta sin moverse casi nada, es un toque
// (abre el popover). containerGetRect() da el rect real del área de
// la imagen en CADA momento (no un valor viejo cacheado).
function Marcador({ id, numero, xPct, yPct, activo, containerGetRect, rotado, onMover, onSoltar, onAbrir, onElChange }) {
  const estadoArrastre = useRef(null); // { startX, startY, arrastrando }

  const handlePointerDown = (e) => {
    e.stopPropagation();
    estadoArrastre.current = { startX: e.clientX, startY: e.clientY, arrastrando: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    const st = estadoArrastre.current;
    if (!st) return;
    const dx = e.clientX - st.startX, dy = e.clientY - st.startY;
    if (!st.arrastrando && Math.hypot(dx, dy) < UMBRAL_ARRASTRE) return;
    st.arrastrando = true;
    const rect = containerGetRect();
    if (!rect || !rect.width || !rect.height) return;
    const { xPct: nx, yPct: ny } = puntoAFraccion(rect, e.clientX, e.clientY, rotado);
    onMover(nx, ny);
  };

  const handlePointerUp = (e) => {
    const st = estadoArrastre.current;
    estadoArrastre.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (st?.arrastrando) onSoltar();
    else onAbrir();
  };

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ position: "absolute", left: `${xPct * 100}%`, top: `${yPct * 100}%`, transform: "translate(-50%, -50%)", touchAction: "none" }}
      className="w-8 h-8 rounded-full flex items-center justify-center"
      data-marker-id={id}
      ref={(el) => onElChange?.(el)}
    >
      <span
        className="absolute inset-0 rounded-full transition-transform"
        style={{
          background: "rgba(220,38,38,0.35)",
          border: activo ? "2px solid #fff" : "2px solid rgba(220,38,38,0.9)",
          boxShadow: activo ? "0 0 0 2px rgba(220,38,38,0.9)" : "none",
        }}
      />
      <span className="relative z-10 text-[11px] font-black text-white" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>
        {numero}
      </span>
    </button>
  );
}

// Miniatura de la tarjeta disparadora: mismo problema de letterbox que
// el editor de pantalla completa (object-fit:contain dentro de un
// contenedor de proporción distinta), así que usa el mismo cálculo de
// rectoContenido en vez de posicionar los puntos con porcentaje "crudo"
// sobre el contenedor completo (eso los descolocaba hacia los bordes).
function MiniaturaConMarcadores({ src, marcadores }) {
  const wrapRef = useRef(null);
  const imgRef = useRef(null);
  const [rect, setRect] = useState(null);

  const recalcular = () => {
    const wrap = wrapRef.current;
    const img = imgRef.current;
    if (!wrap || !img || !img.naturalWidth) return;
    setRect(rectoContenido(wrap.clientWidth, wrap.clientHeight, img.naturalWidth, img.naturalHeight));
  };

  useEffect(() => {
    recalcular();
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(recalcular);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="relative h-32 bg-gray-50">
      <img ref={imgRef} src={src} alt="" onLoad={recalcular} className="w-full h-full object-contain" />
      {rect && marcadores.map((m) => (
        <span
          key={m.id}
          style={{
            position: "absolute",
            left: rect.left + m.xPct * rect.width,
            top: rect.top + m.yPct * rect.height,
            transform: "translate(-50%, -50%)",
          }}
          className="w-4 h-4 rounded-full flex items-center justify-center"
        >
          <span className="absolute inset-0 rounded-full" style={{ background: "rgba(220,38,38,0.45)", border: "1.5px solid rgba(220,38,38,0.9)" }} />
          <span className="relative z-10 text-[8px] font-black text-white">{m.numero}</span>
        </span>
      ))}
    </div>
  );
}

// Tarjeta flotante de monto + nota — fuera del árbol rotado (Portal), en
// coordenadas reales de pantalla, clamp contra visualViewport para no
// quedar tapada por bordes de pantalla NI por el teclado.
const POP_W = 220;
// Los marcadores de "Daños Preexistentes" no llevan monto (solo se marca
// dónde ya había un daño previo, no se estima su costo) — con
// `soloNota` el popover esconde el input de monto y deja nada más la
// nota.
function PopoverMarcador({ anclaEl, xPct, yPct, numero, monto, nota, onMonto, onNota, onConfirmar, onBorrar, soloNota }) {
  const [pos, setPos] = useState(null);
  const POP_H = soloNota ? 150 : 194;

  useEffect(() => {
    const calcular = () => {
      if (!anclaEl) return;
      const r = anclaEl.getBoundingClientRect();
      const vv = window.visualViewport;
      const vw = vv ? vv.width : window.innerWidth;
      const vh = vv ? vv.height : window.innerHeight;
      const offL = vv ? vv.offsetLeft : 0;
      const offT = vv ? vv.offsetTop : 0;
      const GAP = 10;

      let left = r.left + r.width / 2 - POP_W / 2;
      left = Math.max(offL + 8, Math.min(left, offL + vw - POP_W - 8));

      let top = r.top - POP_H - GAP; // preferir arriba del punto
      if (top < offT + 8) top = r.bottom + GAP; // si no cabe arriba, abajo
      top = Math.max(offT + 8, Math.min(top, offT + vh - POP_H - 8));

      setPos({ left, top });
    };
    calcular();
    window.visualViewport?.addEventListener("resize", calcular);
    window.visualViewport?.addEventListener("scroll", calcular);
    window.addEventListener("resize", calcular);
    return () => {
      window.visualViewport?.removeEventListener("resize", calcular);
      window.visualViewport?.removeEventListener("scroll", calcular);
      window.removeEventListener("resize", calcular);
    };
  // xPct/yPct en las dependencias: si el punto se arrastra mientras su
  // popover ya está abierto, el elemento ancla (anclaEl) es el mismo
  // nodo DOM (misma referencia), pero su posición en pantalla cambió —
  // sin esto el popover se quedaría pegado en el lugar viejo.
  }, [anclaEl, xPct, yPct, POP_H]);

  if (!pos) return null;

  return createPortal(
    <div
      style={{ position: "fixed", left: pos.left, top: pos.top, width: POP_W, zIndex: 9999 }}
      className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-3"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="shrink-0 w-6 h-6 rounded-full bg-red-500 text-white text-[11px] font-black flex items-center justify-center">
          {numero}
        </span>
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
          {soloNota ? "Daño preexistente" : "Monto estimado de daño"}
        </label>
      </div>

      {!soloNota && (
        <input
          type="number"
          inputMode="decimal"
          autoFocus
          placeholder="0.00"
          value={monto ?? ""}
          onChange={(e) => onMonto(e.target.value)}
          className="w-full mb-2.5 border border-gray-200 rounded-xl px-2.5 py-2 text-sm font-semibold text-[#13193a] focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]"
        />
      )}

      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
        {soloNota ? "Nota" : "Nota (opcional)"}
      </label>
      <input
        type="text"
        autoFocus={soloNota}
        placeholder="Ej. rayón profundo"
        value={nota ?? ""}
        onChange={(e) => onNota(e.target.value)}
        className="w-full mb-2.5 border border-gray-200 rounded-xl px-2.5 py-2 text-sm text-[#13193a] focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a]"
      />

      <div className="flex items-center gap-2">
        <button type="button" onClick={onConfirmar} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
          <Check size={16} />
        </button>
        <button type="button" onClick={onBorrar} className="shrink-0 p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100">
          <Trash2 size={18} />
        </button>
      </div>
    </div>,
    document.body,
  );
}

export default function DanosMarcadores({ titulo, value, onChange, soloNota }) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [ladoIdx, setLadoIdx] = useState(0);
  const [popoverId, setPopoverId] = useState(null);
  // Nodo DOM del marcador con el popover abierto — se guarda en estado
  // (capturado en el evento que lo abre) en vez de leerse de un ref
  // durante el render, que React no permite.
  const [popoverAnclaEl, setPopoverAnclaEl] = useState(null);
  const [contRect, setContRect] = useState(null); // rectángulo real de la imagen, relativo al wrapper
  const wrapRef = useRef(null);
  const imgRef = useRef(null);
  const overlayRef = useRef(null);

  const fisico = useTamanoFisico();
  const rotarTodo = fisico.w < fisico.h;

  useEffect(() => {
    if (!modalAbierto) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previo; };
  }, [modalAbierto]);

  const recalcularRecto = () => {
    const wrap = wrapRef.current;
    const img = imgRef.current;
    if (!wrap || !img || !img.naturalWidth) return;
    setContRect(rectoContenido(wrap.clientWidth, wrap.clientHeight, img.naturalWidth, img.naturalHeight));
  };

  // Recalcula al abrir, al cambiar de lado/orientación y si cambia el
  // tamaño del wrapper (ResizeObserver, no depende de eventos de window
  // porque acá el que cambia es el contenedor rotado, no la ventana).
  useEffect(() => {
    if (!modalAbierto) return;
    recalcularRecto();
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(recalcularRecto);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [modalAbierto, ladoIdx, rotarTodo]);

  const lado = LADOS_CARRO[ladoIdx];
  const marcadoresLado = value?.[lado.id] ?? [];
  const total = totalMarcadores(value);
  const marcadorActivo = marcadoresLado.find((m) => m.id === popoverId) ?? null;

  const abrir = () => { setLadoIdx(0); setPopoverId(null); setModalAbierto(true); };
  const cerrar = () => { setPopoverId(null); setModalAbierto(false); };

  const setMarcadoresLado = (next) => {
    onChange({ ...(value ?? {}), [lado.id]: next });
  };

  const cambiarLado = (delta) => {
    setPopoverId(null);
    setLadoIdx((i) => Math.max(0, Math.min(LADOS_CARRO.length - 1, i + delta)));
  };

  const getOverlayRect = useCallback(() => overlayRef.current?.getBoundingClientRect() ?? null, []);

  const handleTapImagen = (e) => {
    if (popoverId) { setPopoverId(null); return; } // un toque "vacío" solo cierra el popover abierto
    const rect = getOverlayRect();
    if (!rect) return;
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;
    const { xPct, yPct } = puntoAFraccion(rect, e.clientX, e.clientY, rotarTodo);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setMarcadoresLado([...marcadoresLado, { id, xPct, yPct, monto: "", nota: "" }]);
    setPopoverId(id);
  };

  const moverMarcador = (id, xPct, yPct) => {
    setMarcadoresLado(marcadoresLado.map((m) => (m.id === id ? { ...m, xPct, yPct } : m)));
  };

  const actualizarMonto = (monto) => {
    setMarcadoresLado(marcadoresLado.map((m) => (m.id === popoverId ? { ...m, monto } : m)));
  };

  const actualizarNota = (nota) => {
    setMarcadoresLado(marcadoresLado.map((m) => (m.id === popoverId ? { ...m, nota } : m)));
  };

  const borrarActivo = () => {
    setMarcadoresLado(marcadoresLado.filter((m) => m.id !== popoverId));
    setPopoverId(null);
  };

  const deshacerUltimo = () => {
    if (marcadoresLado.length === 0) return;
    setMarcadoresLado(marcadoresLado.slice(0, -1));
    setPopoverId(null);
  };

  return (
    <div>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">{titulo}</p>
      <button type="button" onClick={abrir} className="w-full text-left">
        {total > 0 ? (
          <div className="rounded-2xl border-2 border-gray-200 overflow-hidden">
            <MiniaturaConMarcadores
              src={LADOS_CARRO[0].src}
              marcadores={(value?.[LADOS_CARRO[0].id] ?? []).map((m, i) => ({ ...m, numero: numeroGlobal(value, LADOS_CARRO[0].id, i) }))}
            />
            <p className="text-center text-xs font-bold text-[#13193a] py-2 bg-gray-50 border-t border-gray-200">
              {total} {total === 1 ? "daño marcado" : "daños marcados"} — Toca para editar
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 h-28 bg-gray-50">
            <span className="text-xs font-semibold text-gray-400">Toca para marcar daños</span>
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
            {/* Barra superior */}
            <div className="shrink-0 flex items-center justify-between gap-2 px-3 py-2.5 bg-[#13193a]">
              <button type="button" onClick={cerrar} className="p-2 rounded-lg text-white/80 hover:text-white">
                <X size={20} />
              </button>
              <span className="text-sm font-bold text-white truncate px-2">{titulo}</span>
              <div className="flex items-center gap-2">
                {marcadoresLado.length > 0 && (
                  <button type="button" onClick={deshacerUltimo} title="Deshacer último"
                    className="p-2 rounded-lg text-white/70 hover:text-white">
                    <Undo2 size={18} />
                  </button>
                )}
                <button type="button" onClick={cerrar} className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-[#13193a]">
                  Listo
                </button>
              </div>
            </div>

            {/* Imagen del lado actual — el wrapper mide el espacio disponible;
                el overlay se dimensiona/posiciona exacto al área real de la
                imagen (sin el letterbox de object-fit:contain), así que
                tanto el toque como los marcadores usan el mismo rectángulo. */}
            <div ref={wrapRef} className="relative flex-1 min-h-0 bg-gray-100 overflow-hidden">
              <img
                ref={imgRef}
                src={lado.src}
                alt={lado.label}
                onLoad={recalcularRecto}
                className="w-full h-full object-contain select-none pointer-events-none"
                draggable={false}
              />
              {contRect && (
                <div
                  ref={overlayRef}
                  onClick={handleTapImagen}
                  className="absolute cursor-crosshair"
                  style={{ left: contRect.left, top: contRect.top, width: contRect.width, height: contRect.height }}
                >
                  {marcadoresLado.map((m, i) => (
                    <Marcador
                      key={m.id}
                      id={m.id}
                      numero={numeroGlobal(value, lado.id, i)}
                      xPct={m.xPct}
                      yPct={m.yPct}
                      activo={m.id === popoverId}
                      containerGetRect={getOverlayRect}
                      rotado={rotarTodo}
                      onMover={(nx, ny) => moverMarcador(m.id, nx, ny)}
                      onSoltar={() => {}}
                      onAbrir={() => setPopoverId(m.id)}
                      onElChange={m.id === popoverId ? setPopoverAnclaEl : undefined}
                    />
                  ))}
                </div>
              )}

              {/* Flechas de navegación entre lados */}
              {LADOS_CARRO.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => cambiarLado(-1)}
                    disabled={ladoIdx === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 disabled:opacity-30 text-white flex items-center justify-center"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => cambiarLado(1)}
                    disabled={ladoIdx === LADOS_CARRO.length - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 disabled:opacity-30 text-white flex items-center justify-center"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <span className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                    {lado.label} ({ladoIdx + 1}/{LADOS_CARRO.length})
                  </span>
                </>
              )}
            </div>
          </div>

          {marcadorActivo && (
            <PopoverMarcador
              anclaEl={popoverAnclaEl}
              xPct={marcadorActivo.xPct}
              yPct={marcadorActivo.yPct}
              numero={numeroGlobal(value, lado.id, marcadoresLado.findIndex((m) => m.id === popoverId))}
              monto={marcadorActivo.monto}
              nota={marcadorActivo.nota}
              onMonto={actualizarMonto}
              onNota={actualizarNota}
              onConfirmar={() => setPopoverId(null)}
              onBorrar={borrarActivo}
              soloNota={soloNota}
            />
          )}
        </div>
      )}
    </div>
  );
}
