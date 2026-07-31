// ============================================================
// src/components/pdf/PaseTallerPDF.jsx
// Réplica del formato "Pase para Taller / ORDEN DE ADMISIÓN"
// (archivos_apoyo/pase_taller/EXCEL.xlsx), celda por celda, usando
// la geometría real exportada en paseTallerGrid.js. Mismo patrón que
// DeclaracionAccidentePDF.jsx: Skeleton (dibuja todas las celdas tal
// cual el Excel) + Overlay (valores reales del sistema encima).
// ============================================================
import { Document, Page, View, Text, Image, Font } from "@react-pdf/renderer";
import { PAGE_SIZE, RECTS, LOGO } from "./paseTallerGrid";
import LOGO_GAMAN from "../../assets/logo_excel_pag1.png";
import DANO_FRENTE from "../../assets/danos/frente.png";
import DANO_DERECHA from "../../assets/danos/derecha.png";
import DANO_ATRAS from "../../assets/danos/atras.png";
import DANO_IZQUIERDA from "../../assets/danos/izquierda.png";
import DANO_ARRIBA from "../../assets/danos/arriba.png";

// Por default react-pdf parte a media palabra ("CUERNAVACA" -> "CUER-"
// / "NAVACA") cuando una palabra larga cae justo en el borde de una
// línea, para aprovechar mejor el espacio — pero en texto libre real
// (domicilios, condiciones de pago) eso se ve como un error de
// composición. Se desactiva devolviendo la palabra completa como su
// único "punto de corte" posible.
Font.registerHyphenationCallback((word) => [word]);

const DEFAULT_BORDER = { t: { w: 0.5, c: "#000000" }, r: { w: 0.5, c: "#000000" }, b: { w: 0.5, c: "#000000" }, l: { w: 0.5, c: "#000000" } };

// ── Mapa de daños: siempre se dibujan los 5 lados (igual que en
// DanosMarcadores.jsx) — los que no tienen marcadores se ven atenuados,
// con un "SIN DAÑOS" en diagonal encima, en vez de desaparecer del
// todo (así se ve claramente que ESE lado se revisó y no tenía nada,
// no que se nos olvidó revisarlo). Los que sí tienen marcadores llevan
// su leyenda numerada debajo (mismos números que ya trae cada punto,
// ver danosSiniestroMarcadores/danosPreexistentesMarcadores, armados en
// pasePdf.js a partir de danos_siniestro_marcadores/danos_preexistente_marcadores).
// El diagrama en sí es siempre el mismo dibujo genérico de referencia
// (igual que el que usa el ajustador para marcar en DanosMarcadores.jsx,
// src/assets/danos/) — no varía por siniestro, así que se embebe directo
// en el PDF en vez de traerlo de Storage.
const LADO_IMG = { FRENTE: DANO_FRENTE, "DETRÁS": DANO_ATRAS, ARRIBA: DANO_ARRIBA, DERECHA: DANO_DERECHA, IZQUIERDA: DANO_IZQUIERDA };
const ORDEN_LADOS = ["FRENTE", "DETRÁS", "ARRIBA", "DERECHA", "IZQUIERDA"];
// Las 5 imágenes miden exactamente 1536x1024 (confirmado) — mismo
// aspecto siempre, así que no hace falta medirlas en tiempo de render.
const ASPECT_LADO = 1536 / 1024;
// react-pdf recorta el texto en silencio si la caja queda apenas por
// debajo de lo que necesita una línea (mismo bug ya visto en otros PDFs
// de este proyecto) — 10pt da margen de sobra para fontSize 6.5 + el
// marginBottom de cada renglón.
const LEGEND_LINE_H = 10;
const IMG_H_MIN = 55, IMG_H_MAX = 105;

// Rectángulo real donde cabe la imagen dentro de su caja (boxW x boxH)
// SIN deformarla — mismo criterio "object-fit:contain" que ya usa
// DanosMarcadores.jsx (rectoContenido): si sobra ancho, se centra
// horizontal; nunca se estira a ojo para "rellenar" la caja.
function contenido(boxW, boxH) {
  let w = boxH * ASPECT_LADO, h = boxH;
  if (w > boxW) { w = boxW; h = boxW / ASPECT_LADO; }
  return { w, h, offL: (boxW - w) / 2, offT: (boxH - h) / 2 };
}

function filaDanos(top, marcadoresPorLabel, budget) {
  const left0 = 10, totalW = 592, gap = 6, labelH = 10, labelGap = 2, legendGap = 3, margen = 8;
  const n = ORDEN_LADOS.length; // siempre 5 — se muestran todos los lados
  const w = (totalW - gap * (n - 1)) / n;

  const activos = ORDEN_LADOS.filter((label) => marcadoresPorLabel?.[label]?.length);
  // La caja de la imagen se agranda tanto como el espacio vertical de la
  // fila lo permita (sin chocar con lo que sigue en la página), dejando
  // lugar para la leyenda más larga de los lados con marcadores.
  const maxMarcas = activos.length ? Math.max(...activos.map((label) => marcadoresPorLabel[label].length)) : 1;
  const legendH = maxMarcas * LEGEND_LINE_H;
  const imgH = Math.min(IMG_H_MAX, Math.max(IMG_H_MIN, budget - margen - labelH - labelGap - legendGap - legendH));

  const slots = ORDEN_LADOS.map((label, i) => {
    const l = left0 + i * (w + gap);
    const cont = contenido(w, imgH);
    const marcadores = marcadoresPorLabel?.[label] ?? [];
    return {
      label,
      labelRect: { l, t: top, w, h: labelH },
      imgRect: { l, t: top + labelH + labelGap, w, h: imgH },
      contRect: { l: l + cont.offL, t: top + labelH + labelGap + cont.offT, w: cont.w, h: cont.h },
      legendRect: { l, t: top + labelH + labelGap + imgH + legendGap, w, h: legendH },
      marcadores,
      conDanos: marcadores.length > 0,
    };
  });
  return { slots };
}

// ── Helpers de datos ───────────────────────────────────────────
function fmtFechaDMA(str) {
  if (!str) return null;
  const d = new Date(str + (str.length === 10 ? "T12:00:00" : ""));
  if (Number.isNaN(d.getTime())) return str;
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── Helpers de geometría ───────────────────────────────────────
function R(rects, r1, c1) {
  return rects.find((x) => x.r1 === r1 && x.c1 === c1);
}

// ── Primitivas visuales (mismo criterio que DeclaracionAccidentePDF) ──
// padding:0.5 (no 1.5) — con las fuentes reales del Excel (hasta
// 12.17pt en Número de Pase) un padding más grande deja el alto útil
// de una celda de 1 renglón apenas por debajo de lo que necesita esa
// línea, y react-pdf la borra en silencio en vez de desbordarla (mismo
// bug ya resuelto antes en el Skeleton).
function boxStyle(rect, extra) {
  const b = rect.border ?? DEFAULT_BORDER;
  return [{
    position: "absolute", left: rect.l, top: rect.t, width: rect.w, height: rect.h,
    borderTopWidth: b.t.w, borderRightWidth: b.r.w, borderBottomWidth: b.b.w, borderLeftWidth: b.l.w,
    borderTopColor: b.t.c, borderRightColor: b.r.c, borderBottomColor: b.b.c, borderLeftColor: b.l.c,
    backgroundColor: "#FFFFFF", padding: 0.5, overflow: "visible",
    alignItems: "center", justifyContent: "center",
  }, extra];
}
// El tamaño de fuente se toma directo de rect.fontSize — no es un valor
// inventado: paseTallerGrid.js lo calcula del font.size real que tenía
// esa celda en el Excel (ej Nombre del Interesado = 8.11pt, Número de
// Pase = 12.17pt), así que cada campo capturado en el sistema queda del
// mismo tamaño que su vecino impreso, en vez de un tamaño único a ojo.
function Value({ rect, value, bold, color }) {
  if (!rect) return null;
  return (
    <View style={boxStyle(rect)}>
      <Text wrap={false} style={{ fontSize: rect.fontSize, textAlign: "center", fontFamily: bold ? "Helvetica-Bold" : "Helvetica", color: color ?? "#000000" }}>{value ?? " "}</Text>
    </View>
  );
}
// Texto libre (varias líneas) sobre una fila del formato — sin relleno
// ni borde propio: el Skeleton ya dibujó la caja de esa celda debajo.
function TextBox({ rect, value, align = "flex-start" }) {
  if (!rect) return null;
  return (
    <View style={boxStyle(rect, { padding: 1.5, alignItems: align, justifyContent: "center", backgroundColor: "transparent", borderTopWidth: 0, borderRightWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0 })}>
      <Text style={{ fontSize: rect.fontSize, textAlign: align === "center" ? "center" : "left" }}>{value || " "}</Text>
    </View>
  );
}
// Casilla de verificación SOLA (sin etiqueta — la etiqueta ya la dibuja
// el Skeleton, centrada, en la misma celda) — igual que en Declaración,
// 7x7 evita el bug de react-pdf que borra la "X" si el cuadro es
// demasiado chico. Transparente y sin borde propio para no tapar la
// etiqueta de abajo, alineada al borde derecho de la celda. La "X" se
// dibuja DENTRO del cuadrito (checkbox convencional) — en el Excel
// original iba suelta a la izquierda del cuadro, pero a pedido se
// cambió a este estilo más estándar.
const CHECK_BOX_SIZE = 7;
function CheckMark({ rect, active }) {
  if (!rect) return null;
  return (
    <View style={boxStyle(rect, { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", backgroundColor: "transparent", borderTopWidth: 0, borderRightWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0, padding: 2 })}>
      <View style={{ width: CHECK_BOX_SIZE, height: CHECK_BOX_SIZE, borderWidth: 0.5, borderColor: "#000000", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {active ? <Text style={{ fontSize: rect.fontSize }}>X</Text> : null}
      </View>
    </View>
  );
}
// Espacio de un lado del mapa de daños: etiqueta (FRENTE/DETRÁS/...)
// arriba + recuadro gris (imgRect, ancho completo de la columna) + la
// imagen SIN deformar centrada adentro (contRect, ya resuelto por
// contenido() en filaDanos). Con marcadores: puntos + leyenda numerada
// debajo, normal. Sin marcadores: la imagen se ve atenuada (opacidad
// baja + velo blanco) con un "SIN DAÑOS" cruzando en diagonal real
// (esquina a esquina de la caja) — deja claro que ESE lado sí se
// revisó y no tenía nada, no que se saltó.
function DiagramaLado({ labelRect, imgRect, contRect, legendRect, label, marcadores, conDanos }) {
  const url = LADO_IMG[label];
  // Ángulo real de la diagonal de la caja (de esquina superior
  // izquierda a inferior derecha, "\") y su longitud, para que el
  // texto rotado quede centrado y corra de punta a punta.
  const angulo  = Math.atan2(imgRect.h, imgRect.w) * (180 / Math.PI);
  const diagLen = Math.sqrt(imgRect.w ** 2 + imgRect.h ** 2);

  return (
    <>
      <View style={{ position: "absolute", left: labelRect.l, top: labelRect.t, width: labelRect.w, height: labelRect.h, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: conDanos ? "#374151" : "#b0b5bd" }}>{label}</Text>
      </View>
      <View
        style={{
          position: "absolute", left: imgRect.l, top: imgRect.t, width: imgRect.w, height: imgRect.h,
          borderWidth: 0.75, borderColor: "#9ca3af", backgroundColor: "#f3f4f6", overflow: "hidden",
        }}
      >
        <Image
          src={url}
          style={{
            position: "absolute", left: contRect.l - imgRect.l, top: contRect.t - imgRect.t,
            width: contRect.w, height: contRect.h, opacity: conDanos ? 1 : 0.3,
          }}
        />
        {!conDanos && (
          <>
            <View style={{ position: "absolute", left: 0, top: 0, width: imgRect.w, height: imgRect.h, backgroundColor: "rgba(255,255,255,0.45)" }} />
            <View
              style={{
                position: "absolute", left: (imgRect.w - diagLen) / 2, top: imgRect.h / 2 - 7,
                width: diagLen, height: 14, alignItems: "center", justifyContent: "center",
                transform: `rotate(${angulo}deg)`,
              }}
            >
              <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#8a919c", letterSpacing: 1 }}>SIN DAÑOS</Text>
            </View>
          </>
        )}
      </View>
      {conDanos && marcadores.map((m) => (
        <View
          key={m.numero}
          style={{
            position: "absolute",
            left: contRect.l + m.xPct * contRect.w - 6,
            top: contRect.t + m.yPct * contRect.h - 6,
            width: 12, height: 12, borderRadius: 6,
            backgroundColor: "rgba(220,38,38,0.55)", borderWidth: 0.75, borderColor: "#dc2626",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 6.5, color: "#ffffff", fontFamily: "Helvetica-Bold" }}>{m.numero}</Text>
        </View>
      ))}
      {conDanos && (
        <View style={{ position: "absolute", left: legendRect.l, top: legendRect.t, width: legendRect.w, height: legendRect.h }}>
          {marcadores.map((m) => (
            <Text key={m.numero} wrap={false} style={{ fontSize: 6.5, color: "#1f2937", marginBottom: 1.5 }}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>{m.numero}. </Text>
              {m.nota || "—"}
            </Text>
          ))}
        </View>
      )}
    </>
  );
}
// Fila completa de un mapa de daños (siniestro o preexistentes) — los
// 5 lados siempre, cada uno decide su propio estado (con daños/sin
// daños) dentro de filaDanos().
function FilaDanos({ top, budget, marcadoresPorLabel, prefix }) {
  const { slots } = filaDanos(top, marcadoresPorLabel, budget);
  return slots.map((slot) => <DiagramaLado key={`${prefix}-${slot.label}`} {...slot} />);
}

// ── Esqueleto: dibuja TODAS las celdas tal cual el Excel ──────
function Skeleton({ rects }) {
  return rects.map((r, i) => (
    <View key={i} style={boxStyle(r, { padding: 0.5, backgroundColor: r.fill ?? undefined })}>
      {r.text ? (
        <Text
          wrap={false}
          style={{
            fontSize: r.fontSize,
            color: r.color,
            fontFamily: r.bold ? "Helvetica-Bold" : "Helvetica",
            textAlign: "center",
          }}
        >
          {r.text}
        </Text>
      ) : null}
    </View>
  ));
}

// ── Overlay (valores reales sobre el esqueleto) ────────────────
function Overlay({ d }) {
  const V = (r1, c1, value, extra) => <Value key={`${r1}_${c1}`} rect={R(RECTS, r1, c1)} value={value} {...extra} />;

  return (
    <>
      {/* Encabezado */}
      <Value rect={R(RECTS, 3, 6)} value={d.numeroSiniestro} bold color="#FF0000" />
      <Value rect={R(RECTS, 3, 9)} value={d.placas} />
      <CheckMark rect={R(RECTS, 3, 8)} active={d.tipoInteresado === "asegurado"} />
      <CheckMark rect={R(RECTS, 4, 8)} active={d.tipoInteresado === "tercero"} />

      {/* Póliza / interesado */}
      {V(6, 0, d.poliza?.numero)}
      {V(6, 3, fmtFechaDMA(d.poliza?.fecha))}
      {V(6, 5, d.interesado?.nombre)}

      {/* Deducible / ajustador / clave / pase */}
      {V(8, 0, d.deducible)}
      {V(8, 3, d.ajustador?.nombre)}
      {V(8, 7, d.clave)}
      <Value rect={R(RECTS, 8, 8)} value={d.numeroPase} bold color="#FF0000" />

      {/* Vehículo */}
      {V(10, 0, d.vehiculo?.marca)}
      {V(10, 2, d.vehiculo?.submarca)}
      {V(10, 4, d.vehiculo?.tipo)}
      {V(10, 6, d.vehiculo?.modelo)}
      {V(10, 8, d.vehiculo?.puertas)}
      {V(10, 9, d.vehiculo?.color)}

      {/* Datos del taller */}
      <CheckMark rect={R(RECTS, 12, 0)} active={d.destino === "taller"} />
      <CheckMark rect={R(RECTS, 13, 0)} active={d.destino === "domicilio"} />
      {V(13, 2, d.taller?.nombre)}
      {V(13, 5, d.taller?.calle)}
      {V(13, 8, d.taller?.colonia)}
      {V(13, 9, d.taller?.telefono)}

      {/* Mapa de daños — Daños del siniestro (solo lados con marcas).
          budget = espacio real hasta el borde inferior de ESTA celda del
          Excel (326.22 + 130.17 = 456.39 — no hasta donde empieza la
          fila de "Daños preexistentes", que ya incluye su propio
          encabezado azul de por medio), para que la imagen crezca todo
          lo que el hueco disponible permite sin invadir la celda de al
          lado. */}
      <FilaDanos top={338.06} budget={456.39 - 338.06} marcadoresPorLabel={d.danosSiniestroMarcadores} prefix="ds" />
      {/* Mapa de daños — Daños preexistentes. budget = hasta el borde
          inferior de esta celda (474.99 + 130.17 = 605.16), justo antes
          del bloque de "NOTAS". */}
      <FilaDanos top={490.63} budget={605.16 - 490.63} marcadoresPorLabel={d.danosPreexistentesMarcadores} prefix="dp" />

      {/* Orden condicionada / lugar y fecha */}
      <TextBox rect={R(RECTS, 36, 0)} value={d.ordenCondicionada} align="center" />
      <TextBox rect={R(RECTS, 38, 0)} value={d.lugarFecha} align="center" />

      {/* Firmas */}
      <TextBox rect={R(RECTS, 40, 0)} value={d.ajustadorFirma?.nombre} align="center" />
      <TextBox rect={R(RECTS, 41, 0)} value={d.ajustadorFirma?.telefono} align="center" />
      <TextBox rect={R(RECTS, 40, 6)} value={d.interesadoFirma?.nombre} align="center" />
      <TextBox rect={R(RECTS, 41, 6)} value={d.interesadoFirma?.telefono} align="center" />

      {/* Logo GAMAN — el ancla del Excel (LOGO.w) es para el logo simple de
          esa plantilla; el logo real (con el león) es más angosto en
          proporción y a ese ancho se desborda sobre "NÚMERO DE SINIESTRO".
          Un recorte chico (0.94) ya lo despega de esa columna sin verse
          notoriamente más chico que el resto del formato. */}
      <Image src={LOGO_GAMAN} style={{ position: "absolute", left: LOGO.l, top: LOGO.t, width: LOGO.w * 0.94, height: LOGO.h * 0.94 }} />
    </>
  );
}

// ── Documento ─────────────────────────────────────────────────
export default function PaseTallerPDF({ data }) {
  return (
    <Document
      title={`Pase para Taller ${data.numeroPase ?? ""}`}
      subject="Orden de Admisión"
      creator="Cofisem"
    >
      <Page size={[PAGE_SIZE.w, PAGE_SIZE.h]} style={{ fontFamily: "Helvetica" }}>
        <View style={{ position: "relative", width: PAGE_SIZE.w, height: PAGE_SIZE.h }}>
          <Skeleton rects={RECTS} />
          <Overlay d={data} />
        </View>
      </Page>
    </Document>
  );
}
