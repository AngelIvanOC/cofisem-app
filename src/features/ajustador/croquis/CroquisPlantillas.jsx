// ============================================================
// src/features/ajustador/croquis/CroquisPlantillas.jsx
// Fondo del croquis: la imagen original proporcionada por el
// usuario, ajustada "contain" (sin recorte ni distorsión) al
// tamaño del lienzo.
// ============================================================
import { Group, Rect, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import croquisOriginalSrc from "../../../assets/croquisOriginal.png";

export function Plantilla({ w, h }) {
  const [img] = useImage(croquisOriginalSrc);
  return (
    <Group listening={false} name="plantilla-fondo">
      <Rect x={0} y={0} width={w} height={h} fill="#f8fafc" />
      {img && (() => {
        const escala = Math.min(w / img.width, h / img.height);
        const iw = img.width * escala, ih = img.height * escala;
        return (
          <KonvaImage image={img} x={(w - iw) / 2} y={(h - ih) / 2} width={iw} height={ih} />
        );
      })()}
    </Group>
  );
}
