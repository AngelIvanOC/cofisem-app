// ============================================================
// src/features/ajustador/danos/lados.js
// Catálogo de imágenes de carro por lado, para marcar daños.
// Para agregar un lado nuevo, poner la imagen en src/assets/danos/ y
// agregar una entrada aquí. Las 5 imágenes actuales miden 1536x1024
// (mismo tamaño y proporción entre sí).
// ============================================================
import frenteImg from "../../../assets/danos/frente.png";
import derechaImg from "../../../assets/danos/derecha.png";
import atrasImg from "../../../assets/danos/atras.png";
import izquierdaImg from "../../../assets/danos/izquierda.png";
import arribaImg from "../../../assets/danos/arriba.png";

export const LADOS_CARRO = [
  { id: "frente", label: "Frente", src: frenteImg },
  { id: "derecha", label: "Lado derecho", src: derechaImg },
  { id: "atras", label: "Atrás", src: atrasImg },
  { id: "izquierda", label: "Lado izquierdo", src: izquierdaImg },
  { id: "arriba", label: "Techo", src: arribaImg },
];
