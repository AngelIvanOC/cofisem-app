// ============================================================
// src/features/ajustador/ModeloDanos3D.jsx
// Modelo 3D de auto con Three.js — giratorio con dedo/mouse
// Se marcan zonas de daño tocando la carrocería
// ============================================================
import { useEffect, useRef, useState, useCallback } from "react";

// Importamos Three.js desde CDN via script tag dinámico
function useThree(canvasRef, onHit) {
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const carGroupRef = useRef(null);
  const pinsRef = useRef([]);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const rotY = useRef(-0.4);
  const rotX = useRef(0.15);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (loadedRef.current) return;
    loadedRef.current = true;

    // Cargar Three.js dinámicamente
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.onload = () => initScene();
    document.head.appendChild(script);

    function initScene() {
      const THREE = window.THREE;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const W = canvas.clientWidth;
      const H = canvas.clientHeight;

      // Renderer
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
      });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;

      // Scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Camera
      const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
      camera.position.set(0, 1.2, 4.5);
      cameraRef.current = camera;

      // Lights
      const ambient = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambient);

      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
      dirLight.position.set(5, 8, 5);
      dirLight.castShadow = true;
      scene.add(dirLight);

      const fillLight = new THREE.DirectionalLight(0x8899ff, 0.3);
      fillLight.position.set(-5, 2, -5);
      scene.add(fillLight);

      // Piso (sombra)
      const floorGeo = new THREE.PlaneGeometry(20, 20);
      const floorMat = new THREE.ShadowMaterial({ opacity: 0.15 });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.72;
      floor.receiveShadow = true;
      scene.add(floor);

      // ── Construir el auto ──────────────────────────────────
      const carGroup = new THREE.Group();
      carGroupRef.current = carGroup;
      scene.add(carGroup);

      const bodyColor = 0x13193a; // azul marino
      const glassColor = 0x88bbdd;
      const wheelColor = 0x222222;
      const rimColor = 0xcccccc;
      const lightColor = 0xffffcc;
      const lightColorR = 0xff4444;
      const underColor = 0x1a1a1a;

      const mat = (
        color,
        metalness = 0,
        roughness = 0.6,
        opacity = 1,
        transparent = false,
      ) =>
        new THREE.MeshStandardMaterial({
          color,
          metalness,
          roughness,
          opacity,
          transparent,
        });

      const bodyMat = mat(bodyColor, 0.4, 0.3);
      const glassMat = mat(glassColor, 0.1, 0.05, 0.55, true);
      const wheelMat = mat(wheelColor, 0.1, 0.8);
      const rimMat = mat(rimColor, 0.9, 0.2);

      const box = (
        w,
        h,
        d,
        color,
        x,
        y,
        z,
        rx = 0,
        ry = 0,
        rz = 0,
        m = null,
      ) => {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geo, m ?? mat(color));
        mesh.position.set(x, y, z);
        mesh.rotation.set(rx, ry, rz);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        carGroup.add(mesh);
        return mesh;
      };

      const cyl = (rT, rB, h, seg, color, x, y, z, rx = 0, m = null) => {
        const geo = new THREE.CylinderGeometry(rT, rB, h, seg);
        const mesh = new THREE.Mesh(geo, m ?? mat(color));
        mesh.position.set(x, y, z);
        mesh.rotation.x = rx;
        mesh.castShadow = true;
        carGroup.add(mesh);
        return mesh;
      };

      // Carrocería principal (cuerpo bajo)
      const bodyLow = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.42, 4.2),
        bodyMat,
      );
      bodyLow.position.set(0, 0.05, 0);
      bodyLow.castShadow = bodyLow.receiveShadow = true;
      carGroup.add(bodyLow);

      // Techo / cabina (forma trapezoidal aproximada con 2 cajas rotadas)
      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.45, 2.2),
        bodyMat,
      );
      cabin.position.set(0, 0.46, -0.05);
      cabin.castShadow = cabin.receiveShadow = true;
      carGroup.add(cabin);

      // Curva frontal (cofre inclinado)
      const hood = new THREE.Mesh(
        new THREE.BoxGeometry(1.78, 0.12, 0.9),
        bodyMat,
      );
      hood.position.set(0, 0.27, 1.5);
      hood.rotation.x = 0.18;
      hood.castShadow = true;
      carGroup.add(hood);

      // Cajuela trasera
      const trunk = new THREE.Mesh(
        new THREE.BoxGeometry(1.78, 0.12, 0.75),
        bodyMat,
      );
      trunk.position.set(0, 0.27, -1.55);
      trunk.rotation.x = -0.15;
      trunk.castShadow = true;
      carGroup.add(trunk);

      // Parabrisas frontal
      const wsFront = new THREE.Mesh(
        new THREE.BoxGeometry(1.45, 0.5, 0.06),
        glassMat,
      );
      wsFront.position.set(0, 0.5, 0.98);
      wsFront.rotation.x = -0.55;
      carGroup.add(wsFront);

      // Parabrisas trasero
      const wsRear = new THREE.Mesh(
        new THREE.BoxGeometry(1.45, 0.45, 0.06),
        glassMat,
      );
      wsRear.position.set(0, 0.5, -1.0);
      wsRear.rotation.x = 0.5;
      carGroup.add(wsRear);

      // Ventanas laterales
      [-0.82, 0.82].forEach((x) => {
        // Ventana delantera
        const wL = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.35, 0.65),
          glassMat,
        );
        wL.position.set(x, 0.53, 0.38);
        carGroup.add(wL);
        // Ventana trasera
        const wR = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.32, 0.6),
          glassMat,
        );
        wR.position.set(x, 0.52, -0.42);
        carGroup.add(wR);
      });

      // Parachoques delantero
      const bumpF = new THREE.Mesh(
        new THREE.BoxGeometry(1.82, 0.2, 0.18),
        mat(0x0a0f20),
      );
      bumpF.position.set(0, -0.08, 2.13);
      bumpF.castShadow = true;
      carGroup.add(bumpF);

      // Parachoques trasero
      const bumpR = new THREE.Mesh(
        new THREE.BoxGeometry(1.82, 0.2, 0.18),
        mat(0x0a0f20),
      );
      bumpR.position.set(0, -0.08, -2.13);
      bumpR.castShadow = true;
      carGroup.add(bumpR);

      // Faros delanteros
      [-0.6, 0.6].forEach((x) => {
        const faro = new THREE.Mesh(
          new THREE.BoxGeometry(0.38, 0.12, 0.06),
          mat(lightColor, 0.2, 0.1),
        );
        faro.position.set(x, 0.1, 2.18);
        carGroup.add(faro);
      });

      // Faros traseros
      [-0.6, 0.6].forEach((x) => {
        const faro = new THREE.Mesh(
          new THREE.BoxGeometry(0.38, 0.12, 0.06),
          mat(lightColorR, 0.2, 0.1),
        );
        faro.position.set(x, 0.1, -2.18);
        carGroup.add(faro);
      });

      // Llantas (4) con rines
      const wheelPositions = [
        [-0.92, 1.2],
        [0.92, 1.2],
        [-0.92, -1.2],
        [0.92, -1.2],
      ];
      wheelPositions.forEach(([x, z]) => {
        // Llanta
        const tire = cyl(
          0.38,
          0.38,
          0.26,
          24,
          wheelColor,
          x,
          -0.34,
          z,
          Math.PI / 2,
          wheelMat,
        );
        // Rin
        const rim = cyl(
          0.28,
          0.28,
          0.28,
          8,
          rimColor,
          x,
          -0.34,
          z,
          Math.PI / 2,
          rimMat,
        );
        // Perno central
        cyl(0.06, 0.06, 0.3, 8, rimColor, x, -0.34, z, Math.PI / 2, rimMat);
      });

      // Piso del auto
      const underbody = new THREE.Mesh(
        new THREE.BoxGeometry(1.7, 0.08, 4.0),
        mat(underColor),
      );
      underbody.position.set(0, -0.24, 0);
      carGroup.add(underbody);

      // Espejo retrovisor izq y der
      [-0.93, 0.93].forEach((x) => {
        const mirror = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.08, 0.15),
          bodyMat,
        );
        mirror.position.set(x, 0.35, 0.78);
        carGroup.add(mirror);
      });

      // Rotación inicial
      carGroup.rotation.y = rotY.current;
      carGroup.rotation.x = rotX.current;

      // ── Raycaster para detectar clic en el coche ──────────
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const getCarMeshes = () =>
        carGroup.children.filter((c) => c.isMesh && c.material !== glassMat);

      const handleClick = (clientX, clientY) => {
        if (isDragging.current) return;
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(getCarMeshes());
        if (hits.length > 0) {
          onHit(hits[0].point, carGroup);
        }
      };

      canvas.addEventListener("click", (e) =>
        handleClick(e.clientX, e.clientY),
      );

      // Touch tap vs drag
      let touchStart = null;
      let touchMoved = false;

      canvas.addEventListener(
        "touchstart",
        (e) => {
          touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          touchMoved = false;
          lastPos.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          };
          isDragging.current = false;
        },
        { passive: true },
      );

      canvas.addEventListener(
        "touchmove",
        (e) => {
          if (!touchStart) return;
          const dx = e.touches[0].clientX - lastPos.current.x;
          const dy = e.touches[0].clientY - lastPos.current.y;
          if (Math.abs(dx) > 4 || Math.abs(dy) > 4) touchMoved = true;
          rotY.current += dx * 0.012;
          rotX.current = Math.max(
            -0.5,
            Math.min(0.6, rotX.current + dy * 0.008),
          );
          lastPos.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          };
          isDragging.current = true;
        },
        { passive: true },
      );

      canvas.addEventListener("touchend", (e) => {
        if (!touchMoved && touchStart) {
          handleClick(touchStart.x, touchStart.y);
        }
        isDragging.current = false;
        touchStart = null;
      });

      // Mouse drag
      canvas.addEventListener("mousedown", (e) => {
        isDragging.current = false;
        lastPos.current = { x: e.clientX, y: e.clientY };
      });
      canvas.addEventListener("mousemove", (e) => {
        if (e.buttons !== 1) return;
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        rotY.current += dx * 0.012;
        rotX.current = Math.max(-0.5, Math.min(0.6, rotX.current + dy * 0.008));
        lastPos.current = { x: e.clientX, y: e.clientY };
        isDragging.current = true;
      });
      canvas.addEventListener("mouseup", () => {
        setTimeout(() => {
          isDragging.current = false;
        }, 50);
      });

      // ── Animate ────────────────────────────────────────────
      let animId;
      const animate = () => {
        animId = requestAnimationFrame(animate);
        if (!isDragging.current) {
          rotY.current += 0.003; // auto-rotate suave
        }
        carGroup.rotation.y = rotY.current;
        carGroup.rotation.x = rotX.current;
        renderer.render(scene, camera);
      };
      animate();

      // Resize
      const onResize = () => {
        if (!canvas) return;
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", onResize);

      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener("resize", onResize);
        renderer.dispose();
      };
    }

    return () => {};
  }, []);

  // Exponer función para agregar pin 3D
  const addPin = useCallback((point, carGroup) => {
    if (!sceneRef.current || !window.THREE) return;
    const THREE = window.THREE;
    // Esfera roja en el punto de impacto
    const geo = new THREE.SphereGeometry(0.06, 12, 12);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xff2222,
      emissive: 0x881111,
    });
    const pin = new THREE.Mesh(geo, mat);
    pin.position.copy(point);
    // Agregar al carGroup para que gire con el coche
    carGroupRef.current.add(pin);
    pinsRef.current.push(pin);
    return pinsRef.current.length;
  }, []);

  const clearPins = useCallback(() => {
    pinsRef.current.forEach((p) => carGroupRef.current?.remove(p));
    pinsRef.current = [];
  }, []);

  return { addPin, clearPins };
}

// ── Componente principal ──────────────────────────────────────
export default function ModeloDanos3D({ instanceKey = "default" }) {
  const canvasRef = useRef(null);
  const [danos, setDanos] = useState([]); // [{id, nota, pinIdx}]
  const [activo, setActivo] = useState(null);
  const [notaTemp, setNotaTemp] = useState("");
  const nextId = useRef(1);

  const onHit = useCallback((point, carGroup) => {
    // Guardamos el punto 3D y creamos el daño
    const id = nextId.current++;
    setDanos((ds) => [
      ...ds,
      { id, nota: "", point: { x: point.x, y: point.y, z: point.z } },
    ]);
    setActivo(id);
    setNotaTemp("");
  }, []);

  const { addPin, clearPins } = useThree(canvasRef, (point, cg) => {
    onHit(point, cg);
    addPin(point, cg);
  });

  const guardarNota = () => {
    setDanos((ds) =>
      ds.map((d) => (d.id === activo ? { ...d, nota: notaTemp } : d)),
    );
    setActivo(null);
    setNotaTemp("");
  };

  const eliminarDano = (id) => {
    setDanos((ds) => ds.filter((d) => d.id !== id));
    clearPins();
    // Re-agregar los pins restantes (simplificación)
    if (activo === id) {
      setActivo(null);
      setNotaTemp("");
    }
  };

  return (
    <div className="space-y-3">
      {/* Canvas 3D */}
      <div
        className="relative rounded-2xl overflow-hidden border-2 border-gray-200 bg-gray-900"
        style={{ height: 260 }}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />
        <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
          <span className="text-[11px] text-white/60 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
            Arrastra para girar · Toca la carrocería para marcar daño
          </span>
        </div>
        {/* Contador de daños */}
        {danos.length > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
            {danos.length}
          </div>
        )}
      </div>

      {/* Panel de nota activa */}
      {activo !== null && (
        <div className="bg-white rounded-2xl border-2 border-[#13193a]/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#13193a] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                {danos.findIndex((d) => d.id === activo) + 1}
              </span>
              Zona de daño marcada
            </p>
            <button
              onClick={() => {
                eliminarDano(activo);
              }}
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
            placeholder="Describe el daño (ej: abolladura profunda, rayón, cristal roto...)"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13193a]/15 focus:border-[#13193a] resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setActivo(null);
                setNotaTemp("");
              }}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={guardarNota}
              className="flex-1 py-2.5 rounded-xl bg-[#13193a] text-white text-xs font-bold hover:bg-[#1e2a50]"
            >
              Guardar nota
            </button>
          </div>
        </div>
      )}

      {/* Lista de daños */}
      {danos.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 space-y-2">
          <p className="text-[11px] font-bold text-red-600 uppercase tracking-widest">
            {danos.length} zona{danos.length > 1 ? "s" : ""} marcada
            {danos.length > 1 ? "s" : ""}
          </p>
          {danos.map((d, i) => (
            <div key={d.id} className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="text-xs text-gray-700 leading-snug">
                  {d.nota || (
                    <span className="italic text-gray-400">
                      Sin descripción
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => eliminarDano(d.id)}
                className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
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
