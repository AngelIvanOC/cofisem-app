// ============================================================
// src/components/pdf/DeclaracionAccidentePDF.jsx
// Réplica del formato "1 DECLARACION RELATIVA AL ACCIDENTE_0.xlsx"
// (Caratula + Reverso), celda por celda, usando la geometría real
// exportada en declaracionGrid.js (posiciones/tamaños calculados a
// partir de las fusiones, anchos de columna y altos de fila reales
// del Excel). No es un rediseño libre: cada caja ocupa exactamente
// el lugar que ocupaba en la hoja original.
// ============================================================
import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import {
  PAGE_SIZE, CARATULA_RECTS, REVERSO_RECTS,
  LOGO_CARATULA, LOGO_REVERSO, CROQUIS_BG_REVERSO,
} from "./declaracionGrid";
import GAMAN_LOGO from "../../assets/logo_excel_pag1.png";
import CROQUIS_FONDO from "../../assets/croquisFondo.png";

const DEFAULT_BORDER = { t: { w: 0.5, c: "#000000" }, r: { w: 0.5, c: "#000000" }, b: { w: 0.5, c: "#000000" }, l: { w: 0.5, c: "#000000" } };

// Tamaño de fuente para valores capturados en el sistema (no vienen del
// Excel, así que no tienen un tamaño "real" — se calibraron a ojo para
// verse proporcionados al tamaño de celda real de cada hoja: Carátula se
// imprime al 59% en Excel, Reverso al 40%, por eso Reverso usa fuente
// más chica).
const DATA_FONT = {
  caratula: { value: 6.3, label: 5.4, textBox: 6.7, check: 5.3, checkOpt: 4.9, money: 6.3 },
  reverso:  { value: 5, label: 4.3, textBox: 5.4, check: 4.3, checkOpt: 4, money: 5 },
};

// ── Helpers de datos ───────────────────────────────────────────
function boolLabel(v) { if (v === true) return "Sí"; if (v === false) return "No"; return null; }
function fmtMoney(n) {
  if (n === null || n === undefined || n === "") return null;
  return `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
}
function eq(value, option) {
  if (value === null || value === undefined) return false;
  return String(value).trim().toLowerCase() === option.trim().toLowerCase();
}
function includes(value, option) {
  if (!value) return false;
  return String(value).toLowerCase().includes(option.toLowerCase());
}
// "Fecha de inicio", "Fecha de término" y "Fecha del accidente" no son
// una sola celda en el Excel — son 3 celdas separadas (Día/Mes/Año), a
// diferencia del resto de las fechas del formato que sí son una sola
// celda de texto libre.
function splitFecha(str) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str ?? "");
  if (!m) return [null, null, null];
  return [m[1], m[2], m[3].slice(2)];
}

// ── Helpers de geometría ───────────────────────────────────────
function R(rects, r1, c1) {
  return rects.find((x) => x.r1 === r1 && x.c1 === c1);
}
// Caja delimitadora entre la celda (r1,c1) y la celda (r2,c2) — ambas deben
// existir como esquina superior-izquierda de su propio rect.
function bbox(rects, r1, c1, r2, c2) {
  const a = R(rects, r1, c1);
  const b = R(rects, r2, c2);
  if (!a || !b) return null;
  return { l: a.l, t: a.t, w: (b.l + b.w) - a.l, h: (b.t + b.h) - a.t };
}

// ── Primitivas visuales ────────────────────────────────────────
// Los bordes por lado (grosor real: 0 / 0.5 delgado / 1.1 medio) vienen
// tal cual estaban en la celda de Excel (declaracionGrid.js), así que
// una caja de valor dibuja exactamente el mismo marco que dibujaba Excel.
// overflow:"visible" por default — igual que Excel, una etiqueta larga
// (ej. "Fecha de expedición") se derrama sobre la celda vacía de al
// lado en vez de cortarse; los cuadros con imagen fuerzan overflow
// "hidden" explícitamente vía `extra`.
function boxStyle(rect, extra) {
  const b = rect.border ?? DEFAULT_BORDER;
  return [{
    position: "absolute", left: rect.l, top: rect.t, width: rect.w, height: rect.h,
    borderTopWidth: b.t.w, borderRightWidth: b.r.w, borderBottomWidth: b.b.w, borderLeftWidth: b.l.w,
    borderTopColor: b.t.c, borderRightColor: b.r.c, borderBottomColor: b.b.c, borderLeftColor: b.l.c,
    backgroundColor: "#FFFFFF", padding: 1.5, overflow: "visible",
    alignItems: "center", justifyContent: "center",
  }, extra];
}
// Los tamaños de fuente de las celdas capturadas en el sistema (no
// existen en el Excel) se calibran según la hoja — Carátula se imprime
// al 59% y Reverso al 40%, por eso cada hoja recibe su propio juego.
function makePrimitives(fonts) {
  function Value({ rect, value, label }) {
    if (!rect) return null;
    return (
      <View style={boxStyle(rect)}>
        {label && <Text wrap={false} style={{ fontSize: fonts.label, color: "#666666", textAlign: "center" }}>{label}</Text>}
        <Text wrap={false} style={{ fontSize: fonts.value, textAlign: "center" }}>{value ?? " "}</Text>
      </View>
    );
  }
  // El bbox de un TextBox junta varias filas del Excel en una sola caja
  // (para poder escribir texto libre encima), pero cada una de esas
  // filas sigue teniendo su propia línea/renglón dibujada por el
  // Skeleton debajo — por eso va sin relleno (transparent, no blanco)
  // y sin repetir el borde exterior (ya lo puso el Skeleton fila por
  // fila), si no las tapa todas con un rectángulo blanco liso.
  function TextBox({ rect, value }) {
    if (!rect) return null;
    return (
      <View style={boxStyle(rect, { padding: 3, alignItems: "flex-start", justifyContent: "flex-start", backgroundColor: "transparent", borderTopWidth: 0, borderRightWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0 })}>
        <Text style={{ fontSize: fonts.textBox }}>{value || " "}</Text>
      </View>
    );
  }
  // Sin relleno: el recuadro de firma del ajustador en el Reverso tiene
  // el logo GAMAN dibujado detrás (posición real del Excel) — si esta
  // caja pintara blanco opaco lo taparía por completo mientras no haya
  // firma cargada, cuando en el Excel real se ve transparentado ahí.
  function ImgBox({ rect, url, placeholder }) {
    if (!rect) return null;
    return (
      <View style={boxStyle(rect, { alignItems: "center", justifyContent: "center", overflow: "hidden", backgroundColor: "transparent" })}>
        {url
          ? <Image src={url} style={{ maxWidth: rect.w - 4, maxHeight: rect.h - 4 }} />
          : placeholder ? <Text style={{ fontSize: fonts.checkOpt, color: "#999999" }}>{placeholder}</Text> : null}
      </View>
    );
  }
  // El croquis debe medir EXACTAMENTE el ancho/alto real de su celda en
  // el PDF (a pedido) — se estira para llenarla por completo aunque el
  // dibujo del ajustador tenga otra proporción (viene de un canvas de
  // tamaño de pantalla variable), en vez de dejarlo más chico con
  // "contain" para no deformarlo. padding:0 para que llegue hasta el
  // borde real de la celda, sin el hueco que deja boxStyle por default.
  function ImgBoxFill({ rect, url, placeholder }) {
    if (!rect) return null;
    return (
      <View style={boxStyle(rect, { alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 0 })}>
        {url
          ? <Image src={url} style={{ width: rect.w, height: rect.h }} />
          : placeholder ? <Text style={{ fontSize: fonts.checkOpt, color: "#999999" }}>{placeholder}</Text> : null}
      </View>
    );
  }
  // El cuadrito de 5x5 (Check) / 4.5x4.5 (CheckRow) era demasiado chico
  // para el mismo bug de react-pdf de antes: con borde + fontSize
  // ~4.9-5.4, la "X" nunca alcanzaba a caber en 1 línea y react-pdf la
  // descartaba en silencio — ninguna casilla marcada mostraba su "X".
  // 7x7 le da margen de sobra a cualquier fontSize que uses aquí.
  const CHECK_BOX_SIZE = 7;
  function Check({ rect, active, label }) {
    if (!rect) return null;
    return (
      <View style={boxStyle(rect, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" })}>
        <Text wrap={false} style={{ fontSize: fonts.check }}>{label.trim()}</Text>
        <View style={{ width: CHECK_BOX_SIZE, height: CHECK_BOX_SIZE, borderWidth: 0.5, borderColor: "#000000", marginLeft: 1.5, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {active ? <Text style={{ fontSize: fonts.checkOpt }}>X</Text> : null}
        </View>
      </View>
    );
  }
  // Varias opciones que en el Excel viven en UNA sola celda combinada.
  // `label` es opcional: el Excel a veces mete la pregunta ("¿Abrir
  // reserva?") y las opciones en la MISMA celda combinada — si no se
  // dibuja aquí, el overlay (que tapa toda la celda) se come la
  // pregunta y sólo deja ver "Sí ☐ No ☐" sin decir de qué.
  function CheckRow({ rect, options, activeIdx, label }) {
    if (!rect) return null;
    return (
      <View style={boxStyle(rect, { flexDirection: "row", alignItems: "center", justifyContent: "flex-start" })}>
        {label && <Text wrap={false} style={{ fontSize: fonts.checkOpt, marginRight: 4, flexShrink: 0 }}>{label}</Text>}
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
          {options.map((op, i) => (
            <View key={op} style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-start" }}>
              <Text wrap={false} style={{ fontSize: fonts.checkOpt }}>{op}</Text>
              <View style={{ width: CHECK_BOX_SIZE, height: CHECK_BOX_SIZE, borderWidth: 0.5, borderColor: "#000000", marginLeft: 2, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {activeIdx === i ? <Text style={{ fontSize: fonts.checkOpt }}>X</Text> : null}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }
  // Etiqueta original + valor booleano, cuando el Excel no tiene una celda
  // de valor aparte (ej. "Orden de reparación")
  function LabelPlusBool({ rect, label, value }) {
    if (!rect) return null;
    return (
      <View style={boxStyle(rect, { flexDirection: "row", alignItems: "center", justifyContent: "flex-start" })}>
        <Text wrap={false} style={{ fontSize: fonts.check, color: "#666666" }}>{label} </Text>
        <Text wrap={false} style={{ fontSize: fonts.check, fontFamily: "Helvetica-Bold" }}>{value ?? "—"}</Text>
      </View>
    );
  }
  // Celda "$" con el monto pegado, cuando no hay celda de valor aparte
  function MoneyCell({ rect, value }) {
    if (!rect) return null;
    return (
      <View style={boxStyle(rect, { justifyContent: "center" })}>
        <Text wrap={false} style={{ fontSize: fonts.money, fontFamily: "Helvetica-Bold" }}>{value != null ? fmtMoney(value) : "$"}</Text>
      </View>
    );
  }
  return { Value, TextBox, ImgBox, ImgBoxFill, Check, CheckRow, LabelPlusBool, MoneyCell };
}

// ── Esqueleto: dibuja TODAS las celdas tal cual el Excel ──────
// Colores, negritas y tamaño de fuente vienen directo de la celda real
// (declaracionGrid.js), no de una lista de encabezados adivinada.
// react-pdf tiene un bug real: si el alto útil de una celda (alto -
// padding - bordes) queda apenas debajo de lo que necesita una sola
// línea de texto, en vez de desbordarse visualmente (como el CSS
// overflow:visible pediría) el texto simplemente NO SE DIBUJA — el
// motor de layout decide "0 líneas caben" antes de pintar. Con
// padding:1 esto le pasaba a celdas angostas con fuente ~6pt y borde
// inferior real (ej. encabezados de "AF | Nombre del Lesionado |
// Domicilio | Teléfono" en el Reverso). Bajar el padding a 0.5 le
// devuelve el margen que le faltaba para entrar en 1 línea.
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

// ── Overlay Carátula (valores reales sobre el esqueleto) ──────
function CaratulaOverlay({ d }) {
  const RC = CARATULA_RECTS;
  const { Value, TextBox, ImgBox, Check, CheckRow, LabelPlusBool, MoneyCell } = makePrimitives(DATA_FONT.caratula);
  const t0 = d.terceros[0] ?? {};
  const t1 = d.terceros[1] ?? {};
  const V = (r1, c1, value, label) => <Value key={`${r1}_${c1}`} rect={R(RC, r1, c1)} value={value} label={label} />;

  return (
    <>
      {/* Encabezado */}
      {V(2, 0, d.encabezado.dia)}
      {V(2, 2, d.encabezado.mes)}
      {V(2, 4, d.encabezado.anio)}
      {V(2, 5, d.encabezado.numeroSiniestro)}
      {V(2, 6, d.encabezado.numeroRegistro)}

      {/* Datos de la póliza */}
      {V(6, 0, d.poliza.numero)}
      {/* Por ahora la cobertura de este cuadro siempre es RESP.CIVIL —
          a pedido, fijo sin importar d.poliza.cobertura. */}
      <Check rect={R(RC, 6, 3)} active={false} label="Amplia" />
      <Check rect={R(RC, 6, 4)} active={false} label="Limitada" />
      <Check rect={R(RC, 6, 5)} active={true} label="RESP.CIVIL." />
      <Check rect={R(RC, 6, 6)} active={false} label="Obligatoria" />
      {(() => {
        const [dd, mm, aa] = splitFecha(d.poliza.fechaInicio);
        return <>{V(6, 9, dd)}{V(6, 10, mm)}{V(6, 11, aa)}</>;
      })()}
      {(() => {
        const [dd, mm, aa] = splitFecha(d.poliza.fechaFin);
        return <>{V(6, 12, dd)}{V(6, 13, mm)}{V(6, 14, aa)}</>;
      })()}
      {/* Pagada/Pendiente de pago van sobre pagos (cuotas), no sobre
          polizas.estatus (ciclo de vida VIGENTE/POR VENCER/etc., no dice
          si ya se cobró) — ver d.poliza.pagada/pendientePago en
          declaracionPdf.js. Cancelada/Anulada sí son estatus reales de
          la póliza. */}
      <Check rect={R(RC, 8, 0)} active={d.poliza.pagada} label="Pagada" />
      <Check rect={R(RC, 8, 3)} active={eq(d.poliza.estatus, "CANCELADA")} label="Cancelada" />
      <Check rect={R(RC, 8, 4)} active={eq(d.poliza.estatus, "ANULADA")} label="Anulada" />
      <Check rect={R(RC, 8, 5)} active={d.poliza.pendientePago} label="Pendiente de pago" />
      {V(8, 7, d.poliza.moneda)}
      {V(8, 8, d.poliza.personaVerifico)}
      {V(10, 0, d.asegurado.nombre)}
      {V(10, 6, d.asegurado.domicilio)}
      {V(10, 12, d.asegurado.telefono)}

      {/* Datos del accidente */}
      {V(13, 0, d.accidente.conductorNombre)}
      {V(13, 6, d.accidente.conductorDomicilio)}
      {V(13, 12, d.accidente.conductorTelefono)}
      {V(15, 0, [d.accidente.licenciaTipo, d.accidente.licenciaNumero].filter(Boolean).join(" "))}
      {V(15, 5, d.accidente.licenciaFechaExp)}
      {V(15, 7, d.accidente.licenciaLugarExp)}
      {(() => {
        const [dd, mm, aa] = splitFecha(d.accidente.fechaNacimiento);
        return <>{V(15, 12, dd)}{V(15, 13, mm)}{V(15, 14, aa)}</>;
      })()}
      {(() => {
        const [dd, mm, aa] = splitFecha(d.accidente.fecha);
        return <>{V(17, 0, dd)}{V(17, 1, mm)}{V(17, 2, aa)}</>;
      })()}
      {V(17, 3, d.accidente.hora)}
      {V(17, 4, d.accidente.lugar)}
      {V(17, 12, d.accidente.colonia)}
      {V(19, 0, d.accidente.municipio)}
      {V(19, 5, d.accidente.cp)}
      <CheckRow
        rect={R(RC, 19, 6)}
        options={["Casco urbano", "Carr. Red. Gral.", "Carr. Peaje"]}
        activeIdx={["Casco urbano", "Carr. Red. Gral.", "Carr. Peaje"].findIndex((o) => includes(d.accidente.zona, o.split(".")[0]))}
      />
      <Check rect={R(RC, 19, 11)} active={eq(d.accidente.sentido, "Nte.") || eq(d.accidente.sentido, "Norte")} label="Nte." />
      <Check rect={R(RC, 19, 12)} active={eq(d.accidente.sentido, "Sur")} label="Sur" />
      <Check rect={R(RC, 19, 13)} active={eq(d.accidente.sentido, "Ote.") || eq(d.accidente.sentido, "Oriente")} label="Ote." />
      <Check rect={R(RC, 19, 14)} active={eq(d.accidente.sentido, "Pte.") || eq(d.accidente.sentido, "Poniente")} label="Pte." />
      {/* Las filas 21-23 ya son 3 celdas fusionadas de ancho completo cada
          una (no columnas sueltas) — su "esquina" real está en columna 0,
          no en la 14. Pedirle a bbox() la esquina (23,14) nunca encontraba
          nada y devolvía null, así que el texto nunca se pintaba aunque
          el dato sí estuviera guardado. */}
      <TextBox rect={bbox(RC, 21, 0, 23, 0)} value={d.accidente.narracion} />
      {V(24, 13, d.accidente.horaLlenado)}

      {/* Vehículo asegurado — "AF 1": el vehículo asegurado siempre es la
          primera parte afectada; los terceros corren a partir del "2". */}
      {V(27, 0, "1")}
      {V(27, 2, d.vehiculo.marca)}
      {V(27, 4, d.vehiculo.tipo)}
      {V(27, 5, d.vehiculo.modelo)}
      {V(27, 7, d.vehiculo.placas)}
      {V(27, 8, d.vehiculo.serie)}
      {V(27, 12, d.vehiculo.motor)}
      <ImgBox rect={R(RC, 29, 0)} url={d.vehiculo.serieUrl} placeholder="Sin diagrama" />
      <TextBox rect={bbox(RC, 29, 8, 33, 8)} value={d.vehiculo.descripcionDano} />
      <CheckRow rect={R(RC, 33, 0)} label="¿Abrir reserva?" options={["Sí", "No"]} activeIdx={d.vehiculo.abrirReserva === true ? 0 : d.vehiculo.abrirReserva === false ? 1 : -1} />
      <MoneyCell rect={R(RC, 33, 6)} value={d.vehiculo.montoEstimado} />
      {V(35, 0, d.vehiculo.lugarEnvio)}
      {V(35, 9, d.poliza.cobertura)}

      {/* Terceros — bloque 1 */}
      {V(38, 0, d.terceros[0] ? "2" : null)}
      {V(38, 2, t0.propietarioNombre)}
      {V(38, 7, t0.conductorNombre)}
      {V(40, 0, t0.domicilio)}
      {V(40, 12, t0.telefono)}
      {V(42, 0, t0.marca)}
      {V(42, 3, t0.tipo)}
      {V(42, 5, t0.modelo)}
      {V(42, 6, t0.color)}
      {V(42, 7, t0.placas)}
      {V(42, 9, t0.serie)}
      {V(42, 11, t0.motor)}
      {V(44, 0, [t0.licenciaTipo, t0.licenciaNumero].filter(Boolean).join(" "))}
      {V(44, 5, t0.licenciaFechaExp)}
      {V(44, 6, t0.licenciaLugarExp)}
      {V(44, 10, t0.aseguradora)}
      {V(46, 0, t0.polizaTercero)}
      {V(46, 3, t0.reporteTercero)}
      {V(46, 5, t0.coberturaTercero)}
      {V(46, 6, t0.vencimientoTercero)}
      {V(46, 8, t0.ajustadorTercero)}
      <LabelPlusBool rect={R(RC, 46, 12)} label="Orden de reparación" value={boolLabel(t0.ordenReparacion)} />
      <LabelPlusBool rect={R(RC, 47, 12)} label="Convenio GXG" value={boolLabel(t0.convenioGxg)} />
      <ImgBox rect={R(RC, 49, 0)} url={t0.serieUrl} placeholder="Sin diagrama" />
      <TextBox rect={bbox(RC, 49, 8, 53, 8)} value={t0.descripcionDano} />
      <CheckRow rect={R(RC, 53, 0)} label="¿Abrir reserva?" options={["Sí", "No"]} activeIdx={t0.abrirReserva === true ? 0 : t0.abrirReserva === false ? 1 : -1} />
      <MoneyCell rect={R(RC, 53, 6)} value={t0.montoEstimado} />

      {/* Terceros — bloque 2 */}
      {V(56, 0, d.terceros[1] ? "3" : null)}
      {V(56, 2, t1.propietarioNombre)}
      {V(56, 7, t1.conductorNombre)}
      {V(58, 0, t1.domicilio)}
      {V(58, 12, t1.telefono)}
      {V(60, 0, t1.marca)}
      {V(60, 3, t1.tipo)}
      {V(60, 5, t1.modelo)}
      {V(60, 6, t1.color)}
      {V(60, 7, t1.placas)}
      {V(60, 9, t1.serie)}
      {V(60, 11, t1.motor)}
      {V(62, 0, [t1.licenciaTipo, t1.licenciaNumero].filter(Boolean).join(" "))}
      {V(62, 5, t1.licenciaFechaExp)}
      {V(62, 6, t1.licenciaLugarExp)}
      {V(62, 10, t1.aseguradora)}
      {V(64, 0, t1.polizaTercero)}
      {V(64, 3, t1.reporteTercero)}
      {V(64, 5, t1.coberturaTercero)}
      {V(64, 6, t1.vencimientoTercero)}
      {V(64, 8, t1.ajustadorTercero)}
      <LabelPlusBool rect={R(RC, 64, 12)} label="Orden de reparación" value={boolLabel(t1.ordenReparacion)} />
      <LabelPlusBool rect={R(RC, 65, 12)} label="Convenio GXG" value={boolLabel(t1.convenioGxg)} />
      <ImgBox rect={R(RC, 67, 0)} url={t1.serieUrl} placeholder="Sin diagrama" />
      <TextBox rect={bbox(RC, 67, 8, 71, 8)} value={t1.descripcionDano} />
      <CheckRow rect={R(RC, 71, 0)} label="¿Abrir reserva?" options={["Sí", "No"]} activeIdx={t1.abrirReserva === true ? 0 : t1.abrirReserva === false ? 1 : -1} />
      <MoneyCell rect={R(RC, 71, 6)} value={t1.montoEstimado} />

      {/* Lugar/fecha + firma reclamante */}
      {V(73, 0, [d.accidente.lugar, d.accidente.fecha].filter(Boolean).join(", "))}
      <ImgBox rect={R(RC, 73, 8)} url={t0.firmaUrl} />

      {/* Logo GAMAN (posición real del Excel) */}
      <Image src={GAMAN_LOGO} style={{ position: "absolute", left: LOGO_CARATULA.l, top: LOGO_CARATULA.t, width: LOGO_CARATULA.w, height: LOGO_CARATULA.h }} />
      {/* Folio de plantilla (antes al pie de la página, se movió arriba
          a la derecha, encima del logo, a pedido). Texto suelto (sin
          caja con alto fijo) para no toparse con el mismo bug de
          react-pdf que le borraba el texto a celdas muy bajas. */}
      <Text style={{ position: "absolute", left: LOGO_CARATULA.l, top: 22, width: LOGO_CARATULA.w - 5, fontSize: 7, fontFamily: "Helvetica-Bold", color: "#FF0000", textAlign: "right" }}>
        DRA001
      </Text>
    </>
  );
}

// ── Overlay Reverso ────────────────────────────────────────────
function ReversoOverlay({ d }) {
  const RC = REVERSO_RECTS;
  const { Value, TextBox, ImgBox, ImgBoxFill, Check, CheckRow, MoneyCell } = makePrimitives(DATA_FONT.reverso);
  const V = (r1, c1, value, label) => <Value key={`${r1}_${c1}`} rect={R(RC, r1, c1)} value={value} label={label} />;
  const lesionados = [0, 1, 2, 3].map((i) => d.lesionados[i] ?? null);

  return (
    <>
      {lesionados.map((l, i) => {
        const r0 = 1 + i * 6;
        return (
          <View key={i}>
            {V(r0 + 1, 0, l ? `AF${i + 1}` : null)}
            {V(r0 + 1, 1, l?.nombre)}
            {V(r0 + 1, 6, l?.domicilio)}
            {V(r0 + 1, 12, l?.telefono)}
            {V(r0 + 3, 0, l?.edad)}
            {V(r0 + 3, 1, l?.lesion)}
            <Check rect={R(RC, r0 + 3, 12)} active={eq(l?.tipoLesionado, "Conductor")} label="Conductor" />
            <Check rect={R(RC, r0 + 3, 13)} active={eq(l?.tipoLesionado, "Ocupante")} label="Ocupante" />
            {V(r0 + 5, 0, l?.hospital)}
            {V(r0 + 5, 6, l?.cobertura)}
            <Check rect={R(RC, r0 + 5, 10)} active={l?.abrirReserva === true} label="Si" />
            <Check rect={R(RC, r0 + 5, 11)} active={l?.abrirReserva === false} label="No" />
            <MoneyCell rect={R(RC, r0 + 5, 13)} value={l?.estimadoLesiones} />
          </View>
        );
      })}

      {/* Reservas totales — pendiente de definir (ver archivos_apoyo/PENDIENTE_reservas_totales.md).
          Nota de desarrollo, no debe imprimirse en el PDF real. */}

      {/* Datos de ajuste */}
      {V(32, 0, d.ajuste.ajustadorNombre)}
      {V(32, 5, d.ajuste.horaTomado)}
      {V(32, 6, d.ajuste.horaPasado)}
      {V(32, 7, d.ajuste.horaLlegada)}
      {V(32, 8, d.ajuste.horaTermino)}
      {V(32, 9, d.ajuste.articuloInfringido)}
      <CheckRow rect={R(RC, 32, 11)} options={["Sí", "No"]} activeIdx={d.ajuste.requiereInvestigacion === true ? 0 : d.ajuste.requiereInvestigacion === false ? 1 : -1} />
      {V(32, 12, boolLabel(d.ajuste.convenioGxg))}
      {V(34, 0, d.ajuste.causa)}
      {V(34, 3, d.ajuste.circunstancia)}
      <Check rect={R(RC, 34, 7)} active={eq(d.ajuste.culpabilidad, "Culpable")} label="Culpable" />
      <Check rect={R(RC, 34, 8)} active={eq(d.ajuste.culpabilidad, "Compartida")} label="Compartida" />
      <Check rect={R(RC, 34, 9)} active={eq(d.ajuste.culpabilidad, "Dudosa")} label="Dudosa" />
      <Check rect={R(RC, 34, 10)} active={eq(d.ajuste.culpabilidad, "No culpable")} label="No culpable" />
      <CheckRow rect={R(RC, 34, 11)} options={["Sí", "No"]} activeIdx={d.ajuste.solicitoGrua === true ? 0 : d.ajuste.solicitoGrua === false ? 1 : -1} />
      {V(34, 12, d.ajuste.calificacionSiniestro)}
      <Check rect={R(RC, 36, 0)} active={d.ajuste.inicioAveriguacion === true} label="Si" />
      <Check rect={R(RC, 36, 1)} active={d.ajuste.inicioAveriguacion === false} label="No" />
      {V(36, 2, d.ajuste.numeroAveriguacion)}
      {V(36, 5, d.ajuste.numeroPartePfp)}
      <Check rect={R(RC, 36, 9)} active={d.ajuste.solicitoAbogado === true} label="Si" />
      <Check rect={R(RC, 36, 10)} active={d.ajuste.solicitoAbogado === false} label="No" />
      {V(36, 11, d.ajuste.despachoAbogado)}
      <Check rect={R(RC, 38, 0)} active={eq(d.ajuste.recuperacion, "Si")} label="Si" />
      <Check rect={R(RC, 38, 1)} active={eq(d.ajuste.recuperacion, "No")} label="No" />
      <Check rect={R(RC, 38, 2)} active={eq(d.ajuste.recuperacion, "Probable")} label="Probable" />
      <Check rect={R(RC, 38, 3)} active={eq(d.ajuste.tipoRecuperacion, "Efectivo")} label="Efectivo" />
      <Check rect={R(RC, 38, 4)} active={eq(d.ajuste.tipoRecuperacion, "Cheque")} label="Cheque" />
      <Check rect={R(RC, 38, 6)} active={includes(d.ajuste.tipoRecuperacion, "Crédito")} label="T. de Crédito" />
      <Check rect={R(RC, 38, 8)} active={includes(d.ajuste.tipoRecuperacion, "garantía")} label="Objeto en garantía" />
      {V(38, 10, d.ajuste.objetoGarantiaImporte)}
      <TextBox rect={bbox(RC, 40, 0, 45, 0)} value={d.ajuste.conclusiones} />
      {d.croquisUrl ? (
        <ImgBoxFill rect={R(RC, 47, 0)} url={d.croquisUrl} />
      ) : (
        <>
          <View style={boxStyle(R(RC, 47, 0))} />
          <Image
            src={CROQUIS_FONDO}
            style={{ position: "absolute", left: CROQUIS_BG_REVERSO.l, top: CROQUIS_BG_REVERSO.t, width: CROQUIS_BG_REVERSO.w, height: CROQUIS_BG_REVERSO.h, opacity: 0.35 }}
          />
        </>
      )}

      {/* Lugar/fecha + firma ajustador */}
      <TextBox rect={R(RC, 57, 0)} value={[d.accidente.lugar, d.accidente.fecha].filter(Boolean).join(", ")} />
      {/* Logo GAMAN (posición real del Excel, detrás del recuadro de firma) */}
      <Image src={GAMAN_LOGO} style={{ position: "absolute", left: LOGO_REVERSO.l, top: LOGO_REVERSO.t, width: LOGO_REVERSO.w, height: LOGO_REVERSO.h }} />
      <ImgBox rect={bbox(RC, 57, 6, 59, 13)} url={d.firmaAjustadorUrl} />

      {/* Encuesta */}
      {d.encuesta && (
        <>
          {V(63, 0, d.encuesta.horaReporte)}
          <CheckRow rect={R(RC, 63, 1)} options={["Excelente", "Bien", "Deficiente"]} activeIdx={["Excelente", "Bien", "Deficiente"].findIndex((o) => eq(d.encuesta.calificacionReporte, o))} />
          {V(63, 4, d.encuesta.motivoReporte)}
          <ImgBox rect={R(RC, 63, 12)} url={d.firmaAseguradoUrl} />
          {V(65, 0, d.encuesta.horaLlegada)}
          <CheckRow rect={R(RC, 65, 1)} options={["Excelente", "Bien", "Deficiente"]} activeIdx={["Excelente", "Bien", "Deficiente"].findIndex((o) => eq(d.encuesta.calificacionAjustador, o))} />
          {V(65, 4, d.encuesta.motivoAjustador)}
          {V(67, 0, d.encuesta.horaTermino)}
          {V(67, 1, d.encuesta.comentarios)}
        </>
      )}
    </>
  );
}

// ── Páginas ────────────────────────────────────────────────────
// Tamaño real de impresión: Legal/Oficio 612x1008pt (8.5x14in), tal
// cual el PDF que se descarga desde Excel. Los rects ya traen los
// márgenes y el centrado horizontal/vertical reales de cada hoja
// "horneados" en sus coordenadas, así que la página no necesita padding.
function Caratula({ d }) {
  return (
    <Page size={[PAGE_SIZE.w, PAGE_SIZE.h]} style={{ fontFamily: "Helvetica" }}>
      <View style={{ position: "relative", width: PAGE_SIZE.w, height: PAGE_SIZE.h }}>
        <Skeleton rects={CARATULA_RECTS} />
        <CaratulaOverlay d={d} />
      </View>
    </Page>
  );
}
function Reverso({ d }) {
  return (
    <Page size={[PAGE_SIZE.w, PAGE_SIZE.h]} style={{ fontFamily: "Helvetica" }}>
      <View style={{ position: "relative", width: PAGE_SIZE.w, height: PAGE_SIZE.h }}>
        <Skeleton rects={REVERSO_RECTS} />
        <ReversoOverlay d={d} />
      </View>
    </Page>
  );
}

// ── Documento ─────────────────────────────────────────────────
export default function DeclaracionAccidentePDF({ data }) {
  return (
    <Document
      title={`Declaración de Accidente ${data.encabezado.numeroSiniestro ?? ""}`}
      subject="Declaración Relativa al Accidente"
      creator="Cofisem"
    >
      <Caratula d={data} />
      <Reverso d={data} />
    </Document>
  );
}
