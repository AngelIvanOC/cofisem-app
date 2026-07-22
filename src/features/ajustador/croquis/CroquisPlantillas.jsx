// ============================================================
// src/features/ajustador/croquis/CroquisPlantillas.jsx
// Fondo del croquis: la imagen original proporcionada por el
// usuario, estirada para llenar el lienzo por completo (ancho Y
// alto) en vez de "contain" — el recuadro real del croquis en el
// PDF es una franja muy ancha y baja (~4.83:1), pegada arriba y
// abajo, y el lienzo del editor (según la pantalla del ajustador)
// casi nunca tiene esa misma proporción. Con "contain" la plantilla
// quedaba centrada con franjas en blanco arriba/abajo que después
// se exportaban tal cual al PDF. La imagen original ya mide 4.92:1
// (casi idéntica a la del PDF), así que estirarla apenas se nota.
// ============================================================
import { Group, Rect, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import croquisOriginalSrc from "../../../assets/croquisOriginal.png";

export function Plantilla({ w, h }) {
  const [img] = useImage(croquisOriginalSrc);
  return (
    <Group listening={false} name="plantilla-fondo">
      <Rect x={0} y={0} width={w} height={h} fill="#f8fafc" />
      {img && <KonvaImage image={img} x={0} y={0} width={w} height={h} />}
    </Group>
  );
}
