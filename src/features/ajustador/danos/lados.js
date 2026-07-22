// ============================================================
// src/features/ajustador/danos/lados.js
// Catálogo de imágenes de carro por lado, para marcar daños.
// Hoy solo hay "frente" y "derecha" — para agregar un lado nuevo
// (trasera, izquierda, techo...) solo hace falta poner la imagen
// en src/assets/danos/ y agregar una entrada aquí.
// ============================================================
import frenteImg from "../../../assets/danos/frente.png";
import derechaImg from "../../../assets/danos/derecha.png";

export const LADOS_CARRO = [
  { id: "frente", label: "Frente", src: frenteImg },
  { id: "derecha", label: "Lado derecho", src: derechaImg },
];
