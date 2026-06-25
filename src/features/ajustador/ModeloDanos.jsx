// src/features/ajustador/ModeloDanos.jsx
import { useRef, useState, useEffect, useCallback } from "react";
import Spline from "@splinetool/react-spline";
import * as THREE from "three";

const SCENE_URL = "https://prod.spline.design/FZYLsHdUy5m3R60W/scene.splinecode";
const DAMAGE_HEX = "#e53e3e";
const DRAG_PX    = 5;

// Nombre interno de Spline → etiqueta en español para el usuario
// null = nodo raíz, no se usa como zona
const ZONA_LABELS = {
  Car:                        null,
  body:                       "Carrocería lateral",
  Shape:                      "Techo / Capó",
  "Shape 2":                  "Carrocería trasera",
  windows:                    "Vidrios",
  chasis:                     "Chasis",
  front:                      "Zona delantera",
  wheels:                     "Ruedas (grupo)",
  wheel:                      "Rueda del. izq.",
  "wheel Instance":           "Rueda tra. der.",
  "wheel Instance 2":         "Rueda tra. izq.",
  "rearview mirror":          "Espejo derecho",
  "rearview mirror Instance": "Espejo izquierdo",
};

// Sube por la cadena de padres Three.js hasta encontrar una zona etiquetada
function encontrarZona(obj) {
  let cur = obj;
  while (cur) {
    if (cur.name !== undefined) {
      const label = ZONA_LABELS[cur.name];
      if (label) return cur.name;   // null y undefined se saltan
    }
    cur = cur.parent;
  }
  return null;
}

export default function ModeloDanos3D() {
  const containerRef      = useRef(null);
  const splineRef         = useRef(null);
  const cameraRef         = useRef(null);
  const sceneRef          = useRef(null);
  const splineObjsRef     = useRef([]);
  const originalColorsRef = useRef({});
  const clickHandlerRef   = useRef(null);
  const downPosRef        = useRef(null);
  const rcRef             = useRef(new THREE.Raycaster());

  const [shouldLoad, setShouldLoad] = useState(false);
  const [isLoaded, setIsLoaded]     = useState(false);
  const [danos, setDanos]           = useState({});
  const [activeZona, setActiveZona] = useState(null);
  const [notaTemp, setNotaTemp]     = useState("");

  // Montar Spline solo cuando el contenedor tiene dimensiones reales
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (el.clientHeight > 0) { setShouldLoad(true); return; }
    const ro = new ResizeObserver((entries) => {
      if (entries[0].contentRect.height > 0) { setShouldLoad(true); ro.disconnect(); }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const setColor = useCallback((splineName, hex) => {
    const scene = sceneRef.current;
    if (!scene) return;
    const color = new THREE.Color(hex);
    // Colorear todos los meshes cuyo ancestro tenga el nombre indicado
    scene.traverse((obj) => {
      if (!obj.isMesh) return;
      let cur = obj;
      while (cur) {
        if (cur.name === splineName) {
          if (obj.material?.color) {
            if (!originalColorsRef.current[splineName + "_" + obj.uuid])
              originalColorsRef.current[splineName + "_" + obj.uuid] = obj.material.color.clone();
            obj.material.color.set(color);
          }
          break;
        }
        cur = cur.parent;
      }
    });
  }, []);

  // Actualizado cada render para evitar closures stale
  clickHandlerRef.current = (splineName) => {
    if (!splineName) return;
    const label = ZONA_LABELS[splineName] ?? splineName;
    console.log("[ModeloDanos] zona:", label, "| key:", splineName);

    if (danos[splineName]) {
      setActiveZona(splineName);
      setNotaTemp(danos[splineName].nota);
    } else {
      setColor(splineName, DAMAGE_HEX);
      setDanos((prev) => ({ ...prev, [splineName]: { nota: "" } }));
      setActiveZona(splineName);
      setNotaTemp("");
    }
  };

  const onLoad = useCallback((app) => {
    splineRef.current = app;

    // Recopilar objetos de la escena (para conocer nombres)
    const todos = app.getAllObjects?.() ?? [];
    splineObjsRef.current = todos;
    console.log("[Spline] objetos:", todos.map((o) => o.name));

    // Acceder a la escena y cámara INTERNAS de Spline (objetos Three.js reales)
    // _scene y _camera son los internos que contienen la geometría y la perspectiva real
    const scene  = app._scene;
    const camera = app._camera
                ?? app._controls?.camera
                ?? app._controls?.orbitControls?.object;
    sceneRef.current  = scene;
    cameraRef.current = camera;
    console.log("[Spline internal] scene:", scene?.type, "| camera:", camera?.type,
                "| isPerspective:", camera?.isPerspectiveCamera);

    const canvas = app.canvas;
    if (!canvas) { setIsLoaded(true); return; }

    const onDown = (e) => {
      const src = e.touches?.[0] ?? e;
      downPosRef.current = { x: src.clientX, y: src.clientY };
    };

    const onUp = (e) => {
      if (!downPosRef.current) return;
      const src  = e.changedTouches?.[0] ?? e;
      const dist = Math.hypot(
        src.clientX - downPosRef.current.x,
        src.clientY - downPosRef.current.y,
      );
      downPosRef.current = null;
      if (dist >= DRAG_PX) return;

      const cam   = cameraRef.current;
      const scene = sceneRef.current;
      if (!cam) { console.warn("[raycast] sin cámara"); return; }

      const rect = canvas.getBoundingClientRect();
      const nx = ((src.clientX - rect.left) / rect.width)   *  2 - 1;
      const ny = -((src.clientY - rect.top)  / rect.height) *  2 + 1;

      // Calcular el rayo manualmente para no depender del flag isPerspectiveCamera
      // funciona con cualquier cámara que tenga matrixWorld y projectionMatrix
      if (cam.updateMatrixWorld) cam.updateMatrixWorld();
      const projInv = cam.projectionMatrixInverse
                   ?? new THREE.Matrix4().copy(cam.projectionMatrix).invert();
      const origin = new THREE.Vector3().setFromMatrixPosition(cam.matrixWorld);
      const dir = new THREE.Vector3(nx, ny, 0.5)
        .applyMatrix4(projInv)
        .applyMatrix4(cam.matrixWorld)
        .sub(origin)
        .normalize();
      rcRef.current.ray.set(origin, dir);

      // Recopilar TODOS los meshes de la escena interna (incluye meshes sin nombre;
      // encontrarZona sube por el padre para encontrar el grupo nombrado)
      let hits = [];
      if (scene) {
        const meshes = [];
        scene.traverse((obj) => { if (obj.isMesh) meshes.push(obj); });
        console.log("[raycast] meshes en escena:", meshes.length);
        hits = rcRef.current.intersectObjects(meshes, false);
      } else {
        console.warn("[raycast] app._scene no disponible — sin geometría para raycasting");
      }

      console.log("[raycast]", hits.length, "hits →", hits.slice(0, 3).map((h) => h.object.name));

      if (hits.length > 0) {
        const zoneName = encontrarZona(hits[0].object);
        if (zoneName) {
          clickHandlerRef.current?.(zoneName);
        } else {
          console.log("[raycast] hit sin zona mapeada:", hits[0].object.name);
        }
      }
    };

    // Capture phase: se ejecutan antes de que los orbit controls llamen stopPropagation
    canvas.addEventListener("pointerdown", onDown, { capture: true });
    canvas.addEventListener("pointerup",   onUp,   { capture: true });
    canvas.addEventListener("touchstart",  onDown, { capture: true, passive: true });
    canvas.addEventListener("touchend",    onUp,   { capture: true });

    setIsLoaded(true);
  }, []);

  const eliminar = (splineName) => {
    // Restaurar los colores Three.js originales de cada mesh del grupo
    const scene = sceneRef.current;
    if (scene) {
      scene.traverse((obj) => {
        if (!obj.isMesh) return;
        const key = splineName + "_" + obj.uuid;
        if (originalColorsRef.current[key]) {
          if (obj.material?.color)
            obj.material.color.copy(originalColorsRef.current[key]);
          delete originalColorsRef.current[key];
        }
      });
    }
    setDanos((prev) => {
      const n = { ...prev };
      delete n[splineName];
      return n;
    });
    if (activeZona === splineName) { setActiveZona(null); setNotaTemp(""); }
  };

  const guardar = () => {
    setDanos((prev) => ({ ...prev, [activeZona]: { nota: notaTemp } }));
    setActiveZona(null);
    setNotaTemp("");
  };

  const zonasDanadas = Object.keys(danos);
  const labelOf = (key) => ZONA_LABELS[key] ?? key;

  return (
    <div className="space-y-3">
      {/* Visor 3D ─────────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden border-2 border-gray-200 bg-[#18181b]"
        style={{ height: 320 }}
      >
        {shouldLoad ? (
          <Spline
            scene={SCENE_URL}
            onLoad={onLoad}
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/20 text-xs">Iniciando…</span>
          </div>
        )}

        {shouldLoad && !isLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none bg-[#18181b]">
            <div className="w-9 h-9 border-2 border-white/15 border-t-white/60 rounded-full animate-spin" />
            <span className="text-white/35 text-xs">Cargando modelo…</span>
          </div>
        )}

        {isLoaded && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
            <span className="text-[11px] text-white/50 bg-black/35 px-3 py-1 rounded-full backdrop-blur-sm">
              Arrastra para girar · Toca una zona para marcar daño
            </span>
          </div>
        )}

        {zonasDanadas.length > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg pointer-events-none">
            {zonasDanadas.length}
          </div>
        )}
      </div>

      {/* Panel de nota activa ──────────────────────────────────────────────── */}
      {activeZona && (
        <div className="bg-white rounded-2xl border-2 border-[#13193a]/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#13193a] flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
              {labelOf(activeZona)}
            </p>
            <button
              onClick={() => eliminar(activeZona)}
              className="text-xs text-red-400 hover:text-red-600 font-semibold"
            >
              Eliminar
            </button>
          </div>
          <textarea
            autoFocus
            rows={2}
            value={notaTemp}
            onChange={(e) => setNotaTemp(e.target.value)}
            placeholder="Describe el daño (ej: abolladura, rayón, cristal roto…)"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setActiveZona(null); setNotaTemp(""); }}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={guardar}
              className="flex-1 py-2.5 rounded-xl bg-[#13193a] text-white text-xs font-bold hover:bg-[#1e2a50]"
            >
              Guardar nota
            </button>
          </div>
        </div>
      )}

      {/* Lista de daños ──────────────────────────────────────────────────── */}
      {zonasDanadas.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 space-y-2">
          <p className="text-[11px] font-bold text-red-600 uppercase tracking-widest">
            {zonasDanadas.length} zona{zonasDanadas.length !== 1 ? "s" : ""} con daño
          </p>
          {zonasDanadas.map((key, i) => (
            <div key={key} className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800">{labelOf(key)}</p>
                <p className="text-xs text-gray-500 leading-snug">
                  {danos[key].nota || (
                    <span className="italic text-gray-300">Sin descripción</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => eliminar(key)}
                className="text-gray-300 hover:text-red-400 transition-colors shrink-0 mt-0.5"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
