// ============================================================
// src/features/ajustador/croquis/CroquisIcons.jsx
// Iconos vectoriales (formas primitivas de Konva) para el editor
// de croquis. Cada icono se dibuja centrado en (0,0) para que
// rotar/escalar desde el Group funcione de forma predecible.
// ============================================================
import { Rect, Circle, RegularPolygon, Arrow, Star, Line, Text } from "react-konva";

const TRAZO = "#111827";

// ── Vehículos ──────────────────────────────────────────────
function CarroBase({ color, largo, ancho, cabinaRatio = 0.5 }) {
  const l2 = largo / 2, a2 = ancho / 2;
  const cabinaLargo = largo * cabinaRatio;
  return (
    <>
      <Rect x={-l2} y={-a2} width={largo} height={ancho} cornerRadius={ancho * 0.35}
        fill={color} stroke={TRAZO} strokeWidth={1.5} />
      <Rect x={-cabinaLargo / 2} y={-a2 + 3} width={cabinaLargo} height={ancho - 6}
        cornerRadius={4} fill="#0f172a" opacity={0.28} />
    </>
  );
}

export function Sedan({ color = "#2563eb" }) {
  return <CarroBase color={color} largo={58} ancho={26} cabinaRatio={0.45} />;
}
export function Suv({ color = "#374151" }) {
  return <CarroBase color={color} largo={60} ancho={30} cabinaRatio={0.55} />;
}
export function Pickup({ color = "#b91c1c" }) {
  const largo = 66, ancho = 28, l2 = largo / 2, a2 = ancho / 2;
  return (
    <>
      <Rect x={-l2} y={-a2} width={largo} height={ancho} cornerRadius={8} fill={color} stroke={TRAZO} strokeWidth={1.5} />
      <Rect x={-l2 + 6} y={-a2 + 3} width={largo * 0.38} height={ancho - 6} cornerRadius={4} fill="#0f172a" opacity={0.28} />
      <Rect x={l2 * 0.1} y={-a2 + 3} width={l2 * 0.8} height={ancho - 6} cornerRadius={3} fill="#000" opacity={0.15} stroke={TRAZO} strokeWidth={1} />
    </>
  );
}
export function Moto({ color = "#111827" }) {
  return (
    <>
      <Line points={[-20, 0, 20, 0]} stroke={TRAZO} strokeWidth={3} lineCap="round" />
      <Circle x={-16} y={0} radius={6} fill="#1f2937" stroke={TRAZO} strokeWidth={1} />
      <Circle x={16} y={0} radius={6} fill="#1f2937" stroke={TRAZO} strokeWidth={1} />
      <Rect x={-10} y={-5} width={20} height={10} cornerRadius={4} fill={color} stroke={TRAZO} strokeWidth={1} />
    </>
  );
}
export function Camion({ color = "#4b5563" }) {
  const largo = 92, ancho = 28, l2 = largo / 2, a2 = ancho / 2;
  const cabina = largo * 0.28;
  return (
    <>
      <Rect x={-l2} y={-a2} width={cabina} height={ancho} cornerRadius={6} fill="#1f2937" stroke={TRAZO} strokeWidth={1.5} />
      <Rect x={-l2 + cabina} y={-a2} width={largo - cabina} height={ancho} cornerRadius={4} fill={color} stroke={TRAZO} strokeWidth={1.5} />
    </>
  );
}
export function Autobus({ color = "#0ea5e9" }) {
  const largo = 84, ancho = 30, l2 = largo / 2, a2 = ancho / 2;
  const n = 6;
  const vw = (largo - 16) / n;
  return (
    <>
      <Rect x={-l2} y={-a2} width={largo} height={ancho} cornerRadius={6} fill={color} stroke={TRAZO} strokeWidth={1.5} />
      {Array.from({ length: n }).map((_, i) => (
        <Rect key={i} x={-l2 + 8 + i * vw} y={-a2 + 5} width={vw - 4} height={ancho - 10} fill="#0f172a" opacity={0.3} cornerRadius={2} />
      ))}
    </>
  );
}
export function Ambulancia() {
  const largo = 64, ancho = 28, l2 = largo / 2, a2 = ancho / 2;
  return (
    <>
      <Rect x={-l2} y={-a2} width={largo} height={ancho} cornerRadius={8} fill="#f8fafc" stroke={TRAZO} strokeWidth={1.5} />
      <Rect x={-9} y={-4} width={18} height={8} fill="#dc2626" />
      <Rect x={-4} y={-9} width={8} height={18} fill="#dc2626" />
    </>
  );
}
export function Taxi() {
  const largo = 58, ancho = 26, l2 = largo / 2, a2 = ancho / 2;
  const nCuadros = 6;
  const anchoFranja = largo * 0.6;
  const cw = anchoFranja / nCuadros;
  return (
    <>
      <Rect x={-l2} y={-a2} width={largo} height={ancho} cornerRadius={ancho * 0.35} fill="#facc15" stroke={TRAZO} strokeWidth={1.5} />
      <Rect x={-largo * 0.45 / 2} y={-a2 + 3} width={largo * 0.45} height={ancho - 6} cornerRadius={4} fill="#0f172a" opacity={0.28} />
      {Array.from({ length: nCuadros }).map((_, i) => (
        <Rect key={i} x={-anchoFranja / 2 + i * cw} y={-2.5} width={cw} height={5}
          fill={i % 2 === 0 ? "#111827" : "#f8fafc"} />
      ))}
      <Rect x={-6} y={-4} width={12} height={8} cornerRadius={1.5} fill="#111827" />
    </>
  );
}

export const VEHICULOS = { sedan: Sedan, suv: Suv, pickup: Pickup, moto: Moto, camion: Camion, autobus: Autobus, ambulancia: Ambulancia, taxi: Taxi };

// ── Señalamientos (formas y colores oficiales SICT) ────────
export function SenalAlto() {
  return (
    <>
      <RegularPolygon sides={8} radius={20} fill="#dc2626" stroke="#fff" strokeWidth={2} rotation={22.5} />
      <Text text="ALTO" x={-18} y={-6} width={36} align="center" fontSize={9} fontStyle="bold" fill="#fff" />
    </>
  );
}
export function SenalCeda() {
  return <RegularPolygon sides={3} radius={20} rotation={180} fill="#fff" stroke="#dc2626" strokeWidth={3} />;
}
export function Semaforo() {
  return (
    <>
      <Rect x={-3} y={0} width={6} height={26} fill="#374151" />
      <Rect x={-9} y={-36} width={18} height={36} cornerRadius={4} fill="#111827" />
      <Circle x={0} y={-28} radius={4.5} fill="#dc2626" />
      <Circle x={0} y={-18} radius={4.5} fill="#facc15" />
      <Circle x={0} y={-8} radius={4.5} fill="#22c55e" />
    </>
  );
}
export function SenalCrucePeatonal() {
  return (
    <>
      <RegularPolygon sides={4} radius={20} rotation={45} fill="#facc15" stroke="#111827" strokeWidth={2} />
      <Circle x={0} y={-9} radius={3} fill="#111827" />
      <Line points={[0, -6, 0, 5]} stroke="#111827" strokeWidth={3} lineCap="round" />
      <Line points={[0, -3, -7, 3]} stroke="#111827" strokeWidth={3} lineCap="round" />
      <Line points={[0, -3, 7, 1]} stroke="#111827" strokeWidth={3} lineCap="round" />
      <Line points={[0, 5, -6, 13]} stroke="#111827" strokeWidth={3} lineCap="round" />
      <Line points={[0, 5, 5, 13]} stroke="#111827" strokeWidth={3} lineCap="round" />
    </>
  );
}
export function SenalCurva() {
  return (
    <>
      <RegularPolygon sides={4} radius={20} rotation={45} fill="#facc15" stroke="#111827" strokeWidth={2} />
      <Arrow points={[-9, 8, -2, -8, 9, 6]} tension={0.5} stroke="#111827" fill="#111827" strokeWidth={2.5} pointerLength={6} pointerWidth={6} />
    </>
  );
}

export const SENALAMIENTOS = {
  alto: SenalAlto, ceda: SenalCeda, semaforo: Semaforo,
  cruce_peatonal: SenalCrucePeatonal, curva: SenalCurva,
};

// ── Elementos de vía ────────────────────────────────────────
export function Arbol() {
  return (
    <>
      <Rect x={-2} y={2} width={4} height={12} fill="#78350f" />
      <Circle x={0} y={-9} radius={14} fill="#16a34a" stroke="#14532d" strokeWidth={1.5} />
    </>
  );
}
export function Poste() {
  return (
    <>
      <Rect x={-2} y={-24} width={4} height={24} fill="#6b7280" />
      <Circle x={0} y={0} radius={4} fill="#6b7280" stroke="#374151" strokeWidth={1} />
    </>
  );
}
export function Cono() {
  return (
    <>
      <Circle radius={10} fill="#f97316" stroke="#7c2d12" strokeWidth={1.5} />
      <Circle radius={5} stroke="#fff" strokeWidth={2} />
    </>
  );
}
export function Hidrante() {
  return (
    <>
      <Rect x={-2} y={-11} width={4} height={4} fill="#dc2626" />
      <Circle radius={7} fill="#dc2626" stroke="#7f1d1d" strokeWidth={1.5} />
    </>
  );
}

export const ELEMENTOS = { arbol: Arbol, poste: Poste, cono: Cono, hidrante: Hidrante };

// ── Efectos ─────────────────────────────────────────────────
export function FlechaDireccion({ color = "#111827" }) {
  return <Arrow points={[-25, 0, 25, 0]} pointerLength={12} pointerWidth={12} fill={color} stroke={color} strokeWidth={4} />;
}
export function PuntoImpacto() {
  return <Star numPoints={8} innerRadius={6} outerRadius={16} fill="#dc2626" stroke="#7f1d1d" strokeWidth={1.5} />;
}
export function MarcaDerrape() {
  return (
    <>
      <Line points={[-30, -6, -10, -8, 10, 4, 30, 2]} stroke="#1f2937" strokeWidth={3} dash={[10, 6]} lineCap="round" tension={0.5} />
      <Line points={[-30, 6, -10, 4, 10, 16, 30, 14]} stroke="#1f2937" strokeWidth={3} dash={[10, 6]} lineCap="round" tension={0.5} />
    </>
  );
}
export function TextoLibre({ texto = "Texto" }) {
  return (
    <Text text={texto} fontSize={14} fontStyle="bold" fill="#111827"
      align="center" width={140} x={-70} y={-8} wrap="word" />
  );
}

export const EFECTOS = { flecha: FlechaDireccion, impacto: PuntoImpacto, derrape: MarcaDerrape, texto: TextoLibre };

export const ICON_COMPONENTS = { ...VEHICULOS, ...SENALAMIENTOS, ...ELEMENTOS, ...EFECTOS };
