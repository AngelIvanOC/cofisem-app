// ============================================================
// src/components/pdf/PaseMedicoPDF.jsx
// Réplica del formato "Orden de Admisión para Atención Médica"
// (archivos_apoyo/pase_medico/3 PASE DE ATENCION MEDICA_0.xlsx),
// celda por celda, usando la geometría real exportada en
// paseMedicoGrid.js. Mismo patrón Skeleton+Overlay que
// PaseTallerPDF.jsx/DeclaracionAccidentePDF.jsx.
//
// A diferencia de esos dos formatos, aquí casi todas las celdas de
// "etiqueta" (Cabeza/Atropello/Nombre:/Domicilio:/...) van alineadas
// a la IZQUIERDA en el Excel real (no centradas) — algunas incluso
// comparten la celda con su propio valor (ej. "Teléfono  " + el
// número, o "Nombre: " + el nombre), porque el formato original está
// pensado para llenarse a mano en esa misma línea. El grid trae ese
// alineamiento real (`rect.align`) para que el Skeleton lo respete, y
// el valor digital se dibuja empujado al borde derecho de esa misma
// celda (LabelValue) en vez de superponerse a la etiqueta.
// ============================================================
import { Document, Page, View, Text, Image, Font } from "@react-pdf/renderer";
import { PAGE_SIZE, RECTS, LOGO } from "./paseMedicoGrid";
import LOGO_GAMAN from "../../assets/logo_excel_pag1.png";

Font.registerHyphenationCallback((word) => [word]);

const DEFAULT_BORDER = { t: { w: 0.5, c: "#000000" }, r: { w: 0.5, c: "#000000" }, b: { w: 0.5, c: "#000000" }, l: { w: 0.5, c: "#000000" } };

// El PNG del logo (mismo asset que Pase Taller/Declaración) es mucho
// más ancho que alto (680x181 ≈ 3.76:1); el rectángulo ancla que trae
// el Excel de este formato es más cuadrado (sobra alto, quedó de un
// logo distinto/con más relleno) — se calcula el alto real a partir
// del ancho del ancla para no deformar la imagen, mismo criterio ya
// usado en Pase Taller (recorte 0.94 por el mismo motivo).
const LOGO_ASPECT = 680 / 181;
const LOGO_W = LOGO.w * 0.75;
const LOGO_H = LOGO_W / LOGO_ASPECT;
// El ancla del Excel empieza donde todavía cabe el final del título (que
// aquí ocupa 2 líneas) — se recorre un poco a la derecha para no pisarlo.
const LOGO_L = LOGO.l + 20;

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

// ── Primitivas visuales ─────────────────────────────────────────
function boxStyle(rect, extra) {
  const b = rect.border ?? DEFAULT_BORDER;
  return [{
    position: "absolute", left: rect.l, top: rect.t, width: rect.w, height: rect.h,
    borderTopWidth: b.t.w, borderRightWidth: b.r.w, borderBottomWidth: b.b.w, borderLeftWidth: b.l.w,
    borderTopColor: b.t.c, borderRightColor: b.r.c, borderBottomColor: b.b.c, borderLeftColor: b.l.c,
    backgroundColor: "#FFFFFF", padding: 1, overflow: "visible",
    alignItems: "center", justifyContent: "center",
  }, extra];
}
// Dato inyectado por el sistema (no la etiqueta impresa) — siempre
// centrado en su propia celda, igual que en Pase Taller/Declaración.
function Value({ rect, value, bold, color, fontSize }) {
  if (!rect) return null;
  return (
    <View style={boxStyle(rect)}>
      <Text style={{ fontSize: fontSize ?? rect.fontSize, textAlign: "center", fontFamily: bold ? "Helvetica-Bold" : "Helvetica", color: color ?? "#000000" }}>{value ?? " "}</Text>
    </View>
  );
}
// Valor sobre una celda que YA trae una etiqueta impresa pegada al
// borde izquierdo ("Teléfono  ", "Nombre: ", "Domicilio: "...) — el
// Skeleton dibuja la etiqueta; esto dibuja el dato empujado al borde
// derecho de la MISMA celda, sin caja/borde propios.
function LabelValue({ rect, value, fontSize }) {
  if (!rect) return null;
  return (
    <View style={boxStyle(rect, { padding: 2, alignItems: "flex-end", justifyContent: "center", backgroundColor: "transparent", borderTopWidth: 0, borderRightWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0 })}>
      <Text style={{ fontSize: fontSize ?? rect.fontSize, textAlign: "right" }}>{value || " "}</Text>
    </View>
  );
}
// Casilla de verificación anclada al borde derecho de la celda de su
// propia etiqueta (mismo criterio que CheckMark en Pase Taller).
const CHECK_BOX_SIZE = 7;
// Bug ya documentado en este proyecto (react-pdf/textkit): el texto
// desaparece EN SILENCIO si el alto disponible queda apenas debajo de lo
// que necesita esa línea — la "X" necesita quedar claramente más chica
// que la caja (7 - 2×0.75 de borde ≈ 5.5pt de alto útil).
const CHECK_MARK_FONT_SIZE = 5;
function CheckMark({ rect, active }) {
  if (!rect) return null;
  return (
    <View style={boxStyle(rect, { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", backgroundColor: "transparent", borderTopWidth: 0, borderRightWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0, padding: 3 })}>
      <View style={{ width: CHECK_BOX_SIZE, height: CHECK_BOX_SIZE, borderWidth: 0.75, borderColor: "#000000", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {active ? <Text style={{ fontSize: CHECK_MARK_FONT_SIZE }}>X</Text> : null}
      </View>
    </View>
  );
}
// Igual que CheckMark, pero anclada a una fracción horizontal libre de
// la celda en vez del borde derecho — hace falta solo para la fila
// "Incapacidad para Deambular / Inconciencia", la única del formato
// donde DOS opciones comparten una sola celda de Excel.
function CheckMarkAt({ rect, fracLeft, active }) {
  if (!rect) return null;
  return (
    <View
      style={{
        position: "absolute", top: rect.t, height: rect.h,
        left: rect.l + rect.w * fracLeft - CHECK_BOX_SIZE / 2,
        width: CHECK_BOX_SIZE, alignItems: "center", justifyContent: "center",
      }}
    >
      <View style={{ width: CHECK_BOX_SIZE, height: CHECK_BOX_SIZE, borderWidth: 0.75, borderColor: "#000000", alignItems: "center", justifyContent: "center" }}>
        {active ? <Text style={{ fontSize: CHECK_MARK_FONT_SIZE }}>X</Text> : null}
      </View>
    </View>
  );
}
// Firma digitalizada — se dibuja en la franja derecha de la celda
// "Firma:" (label izquierda ya la pinta el Skeleton), ajustada a la
// única línea de alto que trae el formato para esta fila.
function FirmaInline({ rect, url }) {
  if (!rect || !url) return null;
  const w = rect.w * 0.55;
  const h = rect.h - 6;
  return (
    <Image src={url} style={{ position: "absolute", left: rect.l + rect.w - w - 4, top: rect.t + 3, width: w, height: h, objectFit: "contain" }} />
  );
}

// ── Esqueleto: dibuja TODAS las celdas tal cual el Excel ──────
function Skeleton({ rects }) {
  return rects.map((r, i) => {
    const centered = r.align === "center";
    // Filas ahora mucho más bajas que en el primer intento (ficha, no
    // hoja completa) — un padding vertical parejo con el horizontal
    // dejaba menos alto útil del que necesita la línea a este tamaño de
    // fuente, y react-pdf borraba el texto en silencio (mismo bug ya
    // documentado). Padding solo horizontal para las celdas de etiqueta
    // izquierda; casi nada de vertical.
    const pad = centered ? { padding: 1 } : { paddingLeft: 3, paddingRight: 1, paddingVertical: 0.5 };
    return (
      <View key={i} style={boxStyle(r, { ...pad, backgroundColor: r.fill ?? undefined, alignItems: centered ? "center" : "flex-start" })}>
        {r.text ? (
          <Text
            wrap={false}
            style={{
              fontSize: r.fontSize,
              color: r.color,
              fontFamily: r.bold ? "Helvetica-Bold" : "Helvetica",
              textAlign: centered ? "center" : "left",
            }}
          >
            {r.text}
          </Text>
        ) : null}
      </View>
    );
  });
}

// ── Overlay (valores reales sobre el esqueleto) ────────────────
function Overlay({ d }) {
  const V = (r1, c1, value, extra) => <Value key={`${r1}_${c1}`} rect={R(RECTS, r1, c1)} value={value} {...extra} />;
  const region = d.lesionado?.regionCuerpo ?? [];
  const inc = (arr, v) => arr?.includes(v);

  return (
    <>
      {/* OAAM007 ya viene impreso por el Skeleton (celda roja del Excel) */}

      {/* Asegurado / fecha de expedición */}
      {V(5, 0, d.asegurado?.nombre)}
      {V(5, 5, fmtFechaDMA(d.fechaExpedicion))}

      {/* Datos generales de la póliza / siniestro */}
      {/* Números de siniestro/póliza: longitud variable, celda angosta
          (90.63pt) — fuente más chica para que quepan sin desbordar,
          mismo criterio que "riesgo" y los domicilios de abajo. */}
      {V(7, 0, d.numeroSiniestro, { fontSize: 8.5 })}
      {V(7, 1, d.poliza?.numero, { fontSize: 8.5 })}
      {V(7, 2, fmtFechaDMA(d.poliza?.vigencia))}
      {/* "Suma asegurada" (7,3) se deja en blanco — no existe esa columna en polizas */}
      {/* Nombre de cobertura, largo y de longitud variable — fuente más
          chica que el resto de esta fila para que quepa sin desbordar. */}
      {V(7, 4, d.poliza?.riesgo, { fontSize: 8.5 })}
      {V(7, 6, fmtFechaDMA(d.fechaPercance))}

      {/* Lesionado / causa de la lesión */}
      {V(9, 0, d.lesionado?.nombre)}
      <CheckMark rect={R(RECTS, 9, 3)} active={d.lesionado?.causaLesion === "Atropello"} />
      <CheckMark rect={R(RECTS, 9, 5)} active={d.lesionado?.causaLesion === "Colisión"} />

      {/* Estado del lesionado / tipo de lesión */}
      <CheckMark rect={R(RECTS, 11, 0)} active={d.lesionado?.estadoLesionado === "Conciente"} />
      <CheckMark rect={R(RECTS, 11, 1)} active={d.lesionado?.estadoLesionado === "Inconciente"} />
      <CheckMark rect={R(RECTS, 11, 3)} active={d.lesionado?.tipoLesion === "Contusión"} />
      <CheckMark rect={R(RECTS, 11, 5)} active={d.lesionado?.tipoLesion === "Herida"} />

      {/* Región del cuerpo afectada (multi-selección) */}
      <CheckMark rect={R(RECTS, 13, 0)} active={inc(region, "Cabeza")} />
      <CheckMark rect={R(RECTS, 13, 1)} active={inc(region, "Cuello")} />
      <CheckMark rect={R(RECTS, 13, 2)} active={inc(region, "Tórax")} />
      <CheckMark rect={R(RECTS, 13, 3)} active={inc(region, "Abdomen")} />
      <CheckMark rect={R(RECTS, 13, 4)} active={inc(region, "Miembros Superiores")} />
      <CheckMark rect={R(RECTS, 13, 6)} active={inc(region, "Miembros Inferiores")} />

      {/* Primeros auxilios / motivo de traslado en ambulancia */}
      <CheckMark rect={R(RECTS, 15, 0)} active={d.lesionado?.primerosAuxilios === true} />
      <CheckMark rect={R(RECTS, 15, 1)} active={d.lesionado?.primerosAuxilios === false} />
      <CheckMarkAt rect={R(RECTS, 15, 2)} fracLeft={0.33} active={d.lesionado?.motivoTraslado === "Incapacidad para Deambular"} />
      <CheckMarkAt rect={R(RECTS, 15, 2)} fracLeft={0.63} active={d.lesionado?.motivoTraslado === "Inconciencia"} />

      {/* Médico asignado */}
      {V(17, 1, d.medico?.nombre)}
      <LabelValue rect={R(RECTS, 17, 5)} value={d.medico?.telefono} />
      <LabelValue rect={R(RECTS, 18, 1)} value={d.medico?.domicilio} />

      {/* Ajustador / Lesionado — nombre, domicilio, teléfono, firma */}
      <LabelValue rect={R(RECTS, 20, 0)} value={d.ajustador?.nombre} />
      <LabelValue rect={R(RECTS, 20, 3)} value={d.lesionado?.nombre} />
      {/* Domicilios: texto libre potencialmente largo en una celda de 1
          renglón que ya trae la etiqueta ("Domicilio: ") pegada al borde
          izquierdo — se reduce la fuente para que quepa sin encimarse. */}
      <LabelValue rect={R(RECTS, 21, 0)} value={d.ajustador?.domicilio} fontSize={8} />
      <LabelValue rect={R(RECTS, 21, 3)} value={d.lesionado?.domicilio} fontSize={8} />
      <LabelValue rect={R(RECTS, 22, 0)} value={d.ajustador?.telefono} />
      <LabelValue rect={R(RECTS, 22, 3)} value={d.lesionado?.telefono} />
      <FirmaInline rect={R(RECTS, 23, 0)} url={d.ajustador?.firmaUrl} />
      <FirmaInline rect={R(RECTS, 23, 3)} url={d.lesionado?.firmaUrl} />

      {/* Logo GAMAN — el ancla del Excel es más cuadrada que el asset real
          (ver LOGO_ASPECT arriba); se ancla en la misma esquina superior
          izquierda del recuadro y se calcula el alto real por aspecto. */}
      <Image src={LOGO_GAMAN} style={{ position: "absolute", left: LOGO_L, top: LOGO.t, width: LOGO_W, height: LOGO_H }} />
    </>
  );
}

// ── Documento ─────────────────────────────────────────────────
export default function PaseMedicoPDF({ data }) {
  return (
    <Document
      title={`Pase Médico ${data.numeroSiniestro ?? ""}`}
      subject="Orden de Admisión para Atención Médica"
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
