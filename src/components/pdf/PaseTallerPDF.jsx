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

// Por default react-pdf parte a media palabra ("CUERNAVACA" -> "CUER-"
// / "NAVACA") cuando una palabra larga cae justo en el borde de una
// línea, para aprovechar mejor el espacio — pero en texto libre real
// (domicilios, condiciones de pago) eso se ve como un error de
// composición. Se desactiva devolviendo la palabra completa como su
// único "punto de corte" posible.
Font.registerHyphenationCallback((word) => [word]);

const DEFAULT_BORDER = { t: { w: 0.5, c: "#000000" }, r: { w: 0.5, c: "#000000" }, b: { w: 0.5, c: "#000000" }, l: { w: 0.5, c: "#000000" } };

// ── Rediseño del mapa de daños: 5 lados (antes 3 diagramas fijos del
// Excel) — mismas fotos con marcadores que captura el ajustador en
// DanosMarcadores.jsx (frente/detrás/arriba/derecha/izquierda). Por
// ahora son placeholders para validar el espacio antes de conectar las
// fotos reales (guardado en bucket, pendiente de aprobar este layout).
const DIAGRAM_LABELS = ["FRENTE", "DETRÁS", "ARRIBA", "DERECHA", "IZQUIERDA"];
function filaDiagramas(top) {
  const left0 = 10, totalW = 592, gap = 6, labelH = 9, labelGap = 2, imgH = 82;
  const n = DIAGRAM_LABELS.length;
  const w = (totalW - gap * (n - 1)) / n;
  return DIAGRAM_LABELS.map((label, i) => {
    const l = left0 + i * (w + gap);
    return {
      label,
      labelRect: { l, t: top, w, h: labelH },
      imgRect: { l, t: top + labelH + labelGap, w, h: imgH },
    };
  });
}
const FILA_DANOS_SINIESTRO = filaDiagramas(338.06);
const FILA_DANOS_PREEXISTENTES = filaDiagramas(490.63);

// ── SIMULACIÓN TEMPORAL — solo para revisar el espacio con fotos reales
// encima mientras no existe el guardado en bucket ni los 5 lados reales
// (hoy LADOS_CARRO solo tiene frente/derecha). "DETRÁS" reutiliza la
// foto de frente (miden prácticamente lo mismo); "IZQUIERDA" reutiliza
// la de derecha, espejeada; "ARRIBA" se deja vacío porque aún no se
// tiene esa medida. Quitar este bloque y las 2 líneas que lo usan en
// <Overlay> en cuanto haya URLs reales de Storage.
const SIMULACION_FOTOS = { FRENTE: DANO_FRENTE, "DETRÁS": DANO_FRENTE, DERECHA: DANO_DERECHA, IZQUIERDA: DANO_DERECHA };
const SIMULACION_ESPEJO = { IZQUIERDA: true };
const SIMULACION_MARCADORES_SINIESTRO = {
  FRENTE: [{ xPct: 0.32, yPct: 0.4, numero: 1 }, { xPct: 0.68, yPct: 0.6, numero: 2 }],
  DERECHA: [{ xPct: 0.5, yPct: 0.5, numero: 1 }],
};
const SIMULACION_MARCADORES_PREEXISTENTES = {
  IZQUIERDA: [{ xPct: 0.4, yPct: 0.55, numero: 1 }],
};


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
// arriba + recuadro de la foto. Con `url` dibuja la foto real (marcada
// por el ajustador en DanosMarcadores.jsx); sin ella, un placeholder
// punteado — así se puede validar el espacio de los 5 lados aunque la
// foto todavía no venga de ningún lado.
function DiagramaLado({ labelRect, imgRect, label, url, espejo, marcadores }) {
  if (!imgRect) return null;
  return (
    <>
      <View style={{ position: "absolute", left: labelRect.l, top: labelRect.t, width: labelRect.w, height: labelRect.h, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 6.5, fontFamily: "Helvetica-Bold", color: "#374151" }}>{label}</Text>
      </View>
      <View
        style={{
          position: "absolute", left: imgRect.l, top: imgRect.t, width: imgRect.w, height: imgRect.h,
          borderWidth: 0.75, borderColor: "#9ca3af", backgroundColor: "#f3f4f6",
          alignItems: "center", justifyContent: "center",
        }}
      >
        {url ? (
          <Image src={url} style={{ width: imgRect.w, height: imgRect.h, transform: espejo ? "scaleX(-1)" : undefined }} />
        ) : (
          <Text style={{ fontSize: 6, color: "#9ca3af", textAlign: "center" }}>Foto{"\n"}pendiente</Text>
        )}
      </View>
      {marcadores?.map((m) => (
        <View
          key={m.numero}
          style={{
            position: "absolute",
            left: imgRect.l + m.xPct * imgRect.w - 4.5,
            top: imgRect.t + m.yPct * imgRect.h - 4.5,
            width: 9, height: 9, borderRadius: 4.5,
            backgroundColor: "rgba(220,38,38,0.55)", borderWidth: 0.6, borderColor: "#dc2626",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 5, color: "#ffffff", fontFamily: "Helvetica-Bold" }}>{m.numero}</Text>
        </View>
      ))}
    </>
  );
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

      {/* Mapa de daños — Daños del siniestro (5 lados) */}
      {FILA_DANOS_SINIESTRO.map((slot) => (
        <DiagramaLado
          key={`ds-${slot.label}`} {...slot}
          url={d.danosSiniestroUrls?.[slot.label] ?? SIMULACION_FOTOS[slot.label]}
          espejo={SIMULACION_ESPEJO[slot.label]}
          marcadores={SIMULACION_MARCADORES_SINIESTRO[slot.label]}
        />
      ))}
      {/* Mapa de daños — Daños preexistentes (5 lados) */}
      {FILA_DANOS_PREEXISTENTES.map((slot) => (
        <DiagramaLado
          key={`dp-${slot.label}`} {...slot}
          url={d.danosPreexistentesUrls?.[slot.label] ?? SIMULACION_FOTOS[slot.label]}
          espejo={SIMULACION_ESPEJO[slot.label]}
          marcadores={SIMULACION_MARCADORES_PREEXISTENTES[slot.label]}
        />
      ))}

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
