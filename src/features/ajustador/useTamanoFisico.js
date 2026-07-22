// ============================================================
// src/features/ajustador/useTamanoFisico.js
// Tamaño real de la ventana en píxeles — usado por los modales de
// pantalla completa que se fuerzan a verse horizontales (Croquis,
// marcadores de daño) rotando todo el bloque 90° por CSS cuando el
// teléfono está físicamente en vertical. No se usan unidades vh/vw:
// en navegadores móviles la barra de direcciones dinámica hace que
// 100vh no siempre coincida con el alto realmente visible, y el
// contenido rotado terminaba saliéndose de la pantalla.
// ============================================================
import { useState, useEffect } from "react";

export function useTamanoFisico() {
  const calc = () => ({
    w: typeof window !== "undefined" ? window.innerWidth : 0,
    h: typeof window !== "undefined" ? window.innerHeight : 0,
  });
  const [size, setSize] = useState(calc);
  useEffect(() => {
    const onResize = () => setSize(calc());
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);
  return size;
}
