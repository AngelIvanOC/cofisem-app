// ============================================================
// src/features/ajustador/croquis/CroquisPlantillas.jsx
// Fondo esquemático del croquis (vialidad) dibujado en vectores,
// más la rosa de los vientos orientable ("Indique el Norte").
// ============================================================
import { Group, Rect, Line, Circle, Text, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import croquisOriginalSrc from "../../../assets/croquisOriginal.png";

const ASFALTO = "#cbd5e1";
const BORDE = "#94a3b8";
const RAYA = "#f8fafc";

function CarrilDiscontinuo({ puntos, vertical }) {
  return (
    <Line
      points={puntos}
      stroke={RAYA}
      strokeWidth={vertical ? 3 : 3}
      dash={[16, 12]}
      lineCap="round"
    />
  );
}

// Cruce de dos vialidades perpendiculares
function PlantillaCruce({ w, h }) {
  const bandaV = 120; // ancho de la vialidad vertical
  const bandaH = 120; // alto de la vialidad horizontal
  const cx = w * 0.42;
  const cy = h / 2;

  return (
    <Group listening={false} name="plantilla-fondo">
      <Rect x={0} y={0} width={w} height={h} fill="#f8fafc" />
      {/* vialidad horizontal */}
      <Rect x={0} y={cy - bandaH / 2} width={w} height={bandaH} fill={ASFALTO} stroke={BORDE} strokeWidth={1.5} />
      {/* vialidad vertical */}
      <Rect x={cx - bandaV / 2} y={0} width={bandaV} height={h} fill={ASFALTO} stroke={BORDE} strokeWidth={1.5} />
      {/* carril central horizontal (izquierda del cruce) */}
      <CarrilDiscontinuo puntos={[20, cy, cx - bandaV / 2 - 10, cy]} />
      {/* carril central horizontal (derecha del cruce) */}
      <CarrilDiscontinuo puntos={[cx + bandaV / 2 + 10, cy, w - 20, cy]} />
      {/* carril central vertical (arriba del cruce) */}
      <CarrilDiscontinuo puntos={[cx, 20, cx, cy - bandaH / 2 - 10]} vertical />
      {/* carril central vertical (abajo del cruce) */}
      <CarrilDiscontinuo puntos={[cx, cy + bandaH / 2 + 10, cx, h - 20]} vertical />
    </Group>
  );
}

// Vialidad recta (dos sentidos)
function PlantillaRecta({ w, h }) {
  const banda = 150;
  const cy = h / 2;
  return (
    <Group listening={false} name="plantilla-fondo">
      <Rect x={0} y={0} width={w} height={h} fill="#f8fafc" />
      <Rect x={0} y={cy - banda / 2} width={w} height={banda} fill={ASFALTO} stroke={BORDE} strokeWidth={1.5} />
      <CarrilDiscontinuo puntos={[20, cy, w - 20, cy]} />
    </Group>
  );
}

// Imagen original del croquis proporcionada por el usuario. Es una tira
// panorámica (mucho más ancha que alta), así que se rota 90° para que
// ocupe el alto de la pantalla en vez de aparecer como una franja
// delgada — ajuste "contain" sobre las dimensiones ya rotadas, sin
// recorte ni distorsión.
function PlantillaOriginal({ w, h }) {
  const [img] = useImage(croquisOriginalSrc);
  return (
    <Group listening={false} name="plantilla-fondo">
      <Rect x={0} y={0} width={w} height={h} fill="#f8fafc" />
      {img && (() => {
        // Tras rotar 90°, el ancho de la imagen pasa a ocupar el alto
        // del lienzo y viceversa — por eso la comparación va cruzada.
        const escala = Math.min(h / img.width, w / img.height);
        const iw = img.width * escala, ih = img.height * escala;
        return (
          <Group x={w / 2} y={h / 2} rotation={90}>
            <KonvaImage image={img} x={-iw / 2} y={-ih / 2} width={iw} height={ih} />
          </Group>
        );
      })()}
    </Group>
  );
}

export function Plantilla({ tipo, w, h }) {
  if (tipo === "original") return <PlantillaOriginal w={w} h={h} />;
  return tipo === "recta" ? <PlantillaRecta w={w} h={h} /> : <PlantillaCruce w={w} h={h} />;
}

// Rosa de los vientos — el ajustador la rota para indicar el norte real
// (la rotación se controla con los botones ↺ / ↻ de la barra de herramientas)
export function RosaDeLosVientos({ x, y, rotation }) {
  const r = 26;
  return (
    <Group x={x} y={y} rotation={rotation} listening={false}>
      <Circle radius={r} fill="#ffffff" stroke="#13193a" strokeWidth={1.5} opacity={0.95} />
      <Line points={[0, -r + 4, 0, r - 4]} stroke="#13193a" strokeWidth={1.5} />
      <Line points={[-r + 4, 0, r - 4, 0]} stroke="#13193a" strokeWidth={1.5} />
      <Line points={[0, -r + 4, -6, -r + 16, 6, -r + 16]} closed fill="#dc2626" />
      <Text text="N" x={-5} y={-r + 16} fontSize={11} fontStyle="bold" fill="#13193a" />
    </Group>
  );
}
