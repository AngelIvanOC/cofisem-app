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
  CARATULA_SIZE, REVERSO_SIZE, CARATULA_RECTS, REVERSO_RECTS,
  LOGO_CARATULA, LOGO_REVERSO, CROQUIS_BG_REVERSO, HEADER_BG, LABEL_BG,
} from "./declaracionGrid";
import GAMAN_LOGO from "../../assets/logo_excel_pag1.png";
import CROQUIS_FONDO from "../../assets/croquisFondo.png";

const MARGIN = 16;
const BORDER = "#777777";

const HEADERS = new Set([
  "DATOS DE LA POLIZA", "VIGENCIA DE LA POLIZA", "DATOS DEL ACCIDENTE",
  "DATOS DEL VEHICULO ASEGURADO", "DAÑOS A BIENES DE TERCEROS",
  "DESCRIPCION DE LESIONES", "RESERVAS TOTALES", "DATOS DE AJUSTE", "CROQUIS",
  "EXCLUSIVO PARA EL ASEGURADO",
]);

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
function boxStyle(rect, extra) {
  return [{ position: "absolute", left: rect.l, top: rect.t, width: rect.w, height: rect.h, borderWidth: 0.5, borderColor: BORDER, backgroundColor: "#FFFFFF", padding: 1.5, overflow: "hidden", alignItems: "center", justifyContent: "center" }, extra];
}
function Value({ rect, value, label }) {
  if (!rect) return null;
  return (
    <View style={boxStyle(rect)}>
      {label && <Text style={{ fontSize: 4.4, color: "#666666", textAlign: "center" }}>{label}</Text>}
      <Text style={{ fontSize: 5.6, textAlign: "center" }}>{value ?? " "}</Text>
    </View>
  );
}
function TextBox({ rect, value }) {
  if (!rect) return null;
  return (
    <View style={boxStyle(rect, { padding: 3, alignItems: "flex-start", justifyContent: "flex-start" })}>
      <Text style={{ fontSize: 5.8 }}>{value || " "}</Text>
    </View>
  );
}
function ImgBox({ rect, url, placeholder }) {
  if (!rect) return null;
  return (
    <View style={boxStyle(rect, { alignItems: "center", justifyContent: "center" })}>
      {url
        ? <Image src={url} style={{ maxWidth: rect.w - 4, maxHeight: rect.h - 4 }} />
        : placeholder ? <Text style={{ fontSize: 4.6, color: "#999999" }}>{placeholder}</Text> : null}
    </View>
  );
}
// react-pdf con solo maxWidth/maxHeight no hace "contain" limpio: llena
// el ancho y recorta el sobrante de alto en vez de encajar la imagen
// completa. Para el croquis eso puede cortar un vehículo que el
// ajustador dejó cerca del borde, así que aquí calculamos el ancho/alto
// exactos (con la proporción real de la imagen) para que quepa completa.
function tamanoContain(boxW, boxH, aspecto) {
  if (!aspecto) return { width: boxW, height: boxH };
  return aspecto > boxW / boxH
    ? { width: boxW, height: boxW / aspecto }
    : { width: boxH * aspecto, height: boxH };
}
function ImgBoxContain({ rect, url, aspecto, placeholder }) {
  if (!rect) return null;
  const { width, height } = tamanoContain(rect.w - 4, rect.h - 4, aspecto);
  return (
    <View style={boxStyle(rect, { alignItems: "center", justifyContent: "center" })}>
      {url
        ? <Image src={url} style={{ width, height }} />
        : placeholder ? <Text style={{ fontSize: 4.6, color: "#999999" }}>{placeholder}</Text> : null}
    </View>
  );
}
function Check({ rect, active, label }) {
  if (!rect) return null;
  return (
    <View style={boxStyle(rect, { flexDirection: "row", alignItems: "center", justifyContent: "flex-start" })}>
      <View style={{ width: 5, height: 5, borderWidth: 0.5, borderColor: "#000000", marginRight: 1.5, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {active ? <Text style={{ fontSize: 4 }}>X</Text> : null}
      </View>
      <Text style={{ fontSize: 4.6 }}>{label.trim()}</Text>
    </View>
  );
}
// Varias opciones que en el Excel viven en UNA sola celda combinada
function CheckRow({ rect, options, activeIdx }) {
  if (!rect) return null;
  const w = rect.w / options.length;
  return (
    <View style={boxStyle(rect, { flexDirection: "row", alignItems: "center", justifyContent: "flex-start" })}>
      {options.map((op, i) => (
        <View key={op} style={{ width: w, flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 4.5, height: 4.5, borderWidth: 0.5, borderColor: "#000000", marginRight: 1, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {activeIdx === i ? <Text style={{ fontSize: 3.6 }}>X</Text> : null}
          </View>
          <Text style={{ fontSize: 4.2 }}>{op}</Text>
        </View>
      ))}
    </View>
  );
}
// Etiqueta original + valor booleano, cuando el Excel no tiene una celda
// de valor aparte (ej. "Orden de reparación")
function LabelPlusBool({ rect, label, value }) {
  if (!rect) return null;
  return (
    <View style={boxStyle(rect, { justifyContent: "center" })}>
      <Text style={{ fontSize: 4.2, color: "#666666" }}>{label}</Text>
      <Text style={{ fontSize: 5.6, fontFamily: "Helvetica-Bold" }}>{value ?? "—"}</Text>
    </View>
  );
}
// Celda "$" con el monto pegado, cuando no hay celda de valor aparte
function MoneyCell({ rect, value }) {
  if (!rect) return null;
  return (
    <View style={boxStyle(rect, { justifyContent: "center" })}>
      <Text style={{ fontSize: 5.4, fontFamily: "Helvetica-Bold" }}>{value != null ? fmtMoney(value) : "$"}</Text>
    </View>
  );
}

// ── Esqueleto: dibuja TODAS las celdas tal cual el Excel ──────
function Skeleton({ rects }) {
  return rects.map((r, i) => {
    if (r.r1 === 0 && r.c1 === 0 && r.text && r.text.startsWith("DECLARACIÓN")) {
      // Título principal — se dibuja aparte, más grande
      return (
        <View key={i} style={{ position: "absolute", left: r.l, top: r.t, width: r.w * 2, height: r.h, alignItems: "flex-start", justifyContent: "center" }}>
          <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold" }}>{r.text}</Text>
        </View>
      );
    }
    const isHeader = r.text && HEADERS.has(r.text.trim());
    const isLabel  = r.text && !isHeader;
    return (
      <View
        key={i}
        style={{
          position: "absolute", left: r.l, top: r.t, width: r.w, height: r.h,
          borderWidth: 0.5, borderColor: BORDER, padding: 1,
          backgroundColor: isHeader ? HEADER_BG : isLabel ? LABEL_BG : undefined,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {r.text ? (
          <Text
            style={{
              fontSize: isHeader ? 6.4 : 5,
              color: isHeader ? "#FFFFFF" : "#333333",
              fontFamily: isHeader ? "Helvetica-Bold" : "Helvetica",
              textAlign: "center",
            }}
          >
            {r.text}
          </Text>
        ) : null}
      </View>
    );
  });
}

// ── Overlay Carátula (valores reales sobre el esqueleto) ──────
function CaratulaOverlay({ d }) {
  const RC = CARATULA_RECTS;
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
      <Check rect={R(RC, 6, 3)} active={includes(d.poliza.cobertura, "Amplia") && !includes(d.poliza.cobertura, "Limitada")} label="Amplia" />
      <Check rect={R(RC, 6, 4)} active={includes(d.poliza.cobertura, "Limitada")} label="Limitada" />
      <Check rect={R(RC, 6, 5)} active={includes(d.poliza.cobertura, "RESP")} label="RESP.CIVIL." />
      <Check rect={R(RC, 6, 6)} active={includes(d.poliza.cobertura, "Obligatoria")} label="Obligatoria" />
      {V(6, 9, d.poliza.fechaInicio)}
      {V(6, 12, d.poliza.fechaFin)}
      <Check rect={R(RC, 8, 0)} active={eq(d.poliza.estatus, "PAGADA")} label="Pagada" />
      <Check rect={R(RC, 8, 3)} active={eq(d.poliza.estatus, "CANCELADA")} label="Cancelada" />
      <Check rect={R(RC, 8, 4)} active={eq(d.poliza.estatus, "ANULADA")} label="Anulada" />
      <Check rect={R(RC, 8, 5)} active={includes(d.poliza.estatus, "PENDIENTE")} label="Pendiente de pago" />
      {V(8, 7, d.poliza.moneda)}
      {V(8, 8, d.poliza.personaVerifico)}
      {V(10, 0, d.asegurado.nombre)}
      {V(10, 6, d.asegurado.domicilio)}
      {V(10, 12, d.asegurado.telefono)}

      {/* Datos del accidente */}
      {V(13, 0, d.accidente.conductorNombre)}
      {V(13, 12, d.accidente.conductorTelefono)}
      {V(15, 0, [d.accidente.licenciaTipo, d.accidente.licenciaNumero].filter(Boolean).join(" "))}
      {V(15, 5, d.accidente.licenciaFechaExp)}
      {V(15, 7, d.accidente.licenciaLugarExp)}
      {V(15, 12, d.accidente.fechaNacimiento)}
      {V(17, 0, d.accidente.fecha)}
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
      <TextBox rect={bbox(RC, 21, 0, 23, 14)} value={d.accidente.narracion} />

      {/* Vehículo asegurado */}
      {V(27, 2, d.vehiculo.marca)}
      {V(27, 4, d.vehiculo.tipo)}
      {V(27, 5, d.vehiculo.modelo)}
      {V(27, 7, d.vehiculo.placas)}
      {V(27, 8, d.vehiculo.serie)}
      {V(27, 12, d.vehiculo.motor)}
      <ImgBox rect={R(RC, 29, 0)} placeholder="Sin diagrama" />
      <TextBox rect={bbox(RC, 29, 8, 32, 8)} value={d.vehiculo.descripcionDano} />
      <CheckRow rect={R(RC, 33, 0)} options={["Sí", "No"]} activeIdx={d.vehiculo.abrirReserva === true ? 0 : d.vehiculo.abrirReserva === false ? 1 : -1} />
      {V(33, 8, fmtMoney(d.vehiculo.montoEstimado))}
      {V(35, 0, d.vehiculo.lugarEnvio)}
      {V(35, 9, d.poliza.cobertura)}

      {/* Terceros — bloque 1 */}
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
      <ImgBox rect={R(RC, 49, 0)} placeholder="Sin diagrama" />
      <TextBox rect={bbox(RC, 49, 8, 52, 8)} value={t0.descripcionDano} />
      <CheckRow rect={R(RC, 53, 0)} options={["Sí", "No"]} activeIdx={t0.abrirReserva === true ? 0 : t0.abrirReserva === false ? 1 : -1} />
      {V(53, 8, fmtMoney(t0.montoEstimado))}

      {/* Terceros — bloque 2 */}
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
      <ImgBox rect={R(RC, 67, 0)} placeholder="Sin diagrama" />
      <TextBox rect={bbox(RC, 67, 8, 70, 8)} value={t1.descripcionDano} />
      <CheckRow rect={R(RC, 71, 0)} options={["Sí", "No"]} activeIdx={t1.abrirReserva === true ? 0 : t1.abrirReserva === false ? 1 : -1} />
      {V(71, 8, fmtMoney(t1.montoEstimado))}

      {/* Lugar/fecha + firma reclamante */}
      {V(73, 0, [d.accidente.municipio, d.accidente.fecha].filter(Boolean).join(", "))}
      <ImgBox rect={R(RC, 73, 8)} url={t0.firmaUrl} />

      {/* Logo GAMAN (posición real del Excel) */}
      <Image src={GAMAN_LOGO} style={{ position: "absolute", left: LOGO_CARATULA.l, top: LOGO_CARATULA.t, width: LOGO_CARATULA.w, height: LOGO_CARATULA.h }} />
    </>
  );
}

// ── Overlay Reverso ────────────────────────────────────────────
function ReversoOverlay({ d }) {
  const RC = REVERSO_RECTS;
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

      {/* Reservas totales — pendiente de definir (ver PENDIENTE_reservas_totales.md) */}
      {(() => {
        const hdr = R(RC, 25, 0);
        return hdr ? (
          <Text style={{ position: "absolute", left: hdr.l + 2, top: hdr.t + hdr.h + 2, fontSize: 5.5, fontFamily: "Helvetica-Oblique", color: "#888888" }}>
            Pendiente de definir — ver archivos_apoyo/PENDIENTE_reservas_totales.md
          </Text>
        ) : null;
      })()}

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
        <ImgBoxContain rect={R(RC, 47, 0)} url={d.croquisUrl} aspecto={d.croquisAspecto} />
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
      <TextBox rect={R(RC, 57, 0)} value={[d.accidente.municipio, d.accidente.fecha].filter(Boolean).join(", ")} />
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
function Caratula({ d }) {
  return (
    <Page size={[CARATULA_SIZE.w + MARGIN * 2, CARATULA_SIZE.h + MARGIN * 2]} style={{ padding: MARGIN, fontFamily: "Helvetica" }}>
      <View style={{ position: "relative", width: CARATULA_SIZE.w, height: CARATULA_SIZE.h }}>
        <Skeleton rects={CARATULA_RECTS} />
        <CaratulaOverlay d={d} />
      </View>
    </Page>
  );
}
function Reverso({ d }) {
  return (
    <Page size={[REVERSO_SIZE.w + MARGIN * 2, REVERSO_SIZE.h + MARGIN * 2]} style={{ padding: MARGIN, fontFamily: "Helvetica" }}>
      <View style={{ position: "relative", width: REVERSO_SIZE.w, height: REVERSO_SIZE.h }}>
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
