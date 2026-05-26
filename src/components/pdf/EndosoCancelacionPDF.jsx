import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { styles, COLORS } from "./styles";
import { CARD, bB, bR, pad, tit, TITLE_BG, Title } from "./sections/shared.jsx";
import GAMAN_LOGO from "../../assets/GamanLogoOpt.jpg";
import FIRMA from "../../assets/firma.png";
import { mockPoliza } from "./mockData";

const fmt = (n) => {
  if (n == null || n === "") return "";
  const [int, dec] = Number(n).toFixed(2).split(".");
  return `$${int.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${dec ? "." + dec : ""}`;
};

const t9 = { fontSize: 9, fontFamily: "Helvetica", color: COLORS.ink };
const t8 = { fontSize: 8, fontFamily: "Helvetica", color: COLORS.ink };
const t8b = { fontSize: 8, fontFamily: "Helvetica-Bold", color: COLORS.ink };
const t7 = { fontSize: 7, fontFamily: "Helvetica", color: COLORS.ink };
const t6 = { fontSize: 6, fontFamily: "Helvetica", color: COLORS.ink };
const tDt = { fontSize: 9, fontFamily: "Helvetica", color: COLORS.ink };

const TERMINOS_TEXT =
  "La compañía se obliga a pagar los daños, así como los perjuicios y daño moral consecuencial " +
  "que el asegurado cause a terceros y por los que éste deba responder conforme a la legislación " +
  "aplicable en materia de RESPONSABILIDAD CIVIL vigente en los Estados Unidos Mexicanos (o " +
  "legislación extranjera que se hubiese convenido conforme a las condiciones particulares para " +
  "el seguro de Responsabilidad Civil por daños en el extranjero), por los hechos u omisiones no " +
  "dolosos ocurridos durante la vigencia de esta póliza y que causen la muerte o el menoscabo de " +
  "la salud de dichos terceros, o el deterioro o la destrucción de bienes propiedad de los mismos, " +
  "según las cláusulas y especificaciones pactadas en este contrato de seguro";

// ── Header con título "ENDOSO" ─────────────────────────────────
function HeaderEndoso({ empresa }) {
  return (
    <View style={{ marginBottom: 0 }}>
      <View style={[styles.row, { alignItems: "flex-start" }]}>
        <View style={{ flex: 1 }}>
          <Image src={GAMAN_LOGO} style={{ width: "100%" }} />
        </View>
        <View style={{ flex: 1, paddingTop: 10, alignItems: "flex-end" }}>
          <View style={{ width: 240, lineHeight: 0.6 }}>
            {[
              empresa.razonSocial,
              `RFC: ${empresa.rfc}`,
              empresa.ciudad,
              `OFICINA Tels.: ${empresa.telefono}`,
              empresa.email,
            ].map((line, i) => (
              <Text
                key={i}
                style={[
                  styles.companyInfo,
                  { fontSize: 10, textAlign: "center" },
                ]}
              >
                {line}
              </Text>
            ))}
          </View>
        </View>
      </View>
      <View style={{ width: "100%", paddingBottom: 8 }}>
        <Text style={[styles.docTitle, { fontSize: 14 }]}>ENDOSO</Text>
      </View>
    </View>
  );
}

// ── DatosContratante sin fila de conductor ─────────────────────
function DatosContratanteEndoso({ poliza }) {
  const { contratante, vigencia, emision, emisionHora, prima, agencia } =
    poliza;
  const dir = contratante.direccion ?? {};
  const dir1 = `${dir.calle || ""},  Col: ${dir.colonia || ""}`;
  const dir2 = `${dir.municipio || ""}, ${dir.estado || ""}`;
  const dir3 = `CP ${dir.cp || ""}`;

  return (
    <View style={{ flexDirection: "row", marginBottom: 5 }}>
      {/* ══ CARD IZQUIERDA 60 % — sin fila de conductor ══ */}
      <View style={[CARD, { flex: 60, marginRight: 3 }]}>
        <Title style={bB}>DATOS DEL CONTRATANTE</Title>
        <View style={[pad, { flex: 1 }]}>
          <Text style={t9}>{contratante.nombre || "—"}</Text>
          <View style={{ flex: 1, paddingTop: 5 }}>
            <Text style={t9}>{dir1}</Text>
            <Text style={t9}>{dir2}</Text>
            <Text style={t9}>{dir3}</Text>
            <Text style={t9}>
              {contratante.curp ? `CURP: ${contratante.curp}` : ""}
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 2,
              }}
            >
              <Text style={t9}>{`RFC: ${contratante.rfc || ""}`}</Text>
              <Text style={t9}>{`Tel.:${contratante.telefono || ""}`}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ══ CARD DERECHA 40 % — idéntica al original ══ */}
      <View style={[CARD, { flex: 40 }]}>
        {/* Fila 1: OFICINA | USO | F.PAGO | CONSTANCIA */}
        <View style={[{ flexDirection: "row" }, bB]}>
          <View style={[bR, { flex: 1 }]}>
            <Title style={bB}>OFICINA</Title>
            <View style={[pad, { flex: 1, justifyContent: "center" }]}>
              <Text style={[t6, { textAlign: "center" }]}>
                {agencia?.id ?? "—"}
              </Text>
            </View>
          </View>
          <View style={[bR, { flex: 1 }]}>
            <Title style={bB}>USO</Title>
            <View style={[pad, { flex: 1, justifyContent: "center" }]}>
              <Text style={[t6, { textAlign: "center" }]}>
                {contratante.usoTarifario || "—"}
              </Text>
            </View>
          </View>
          <View style={[bR, { flex: 1.5 }]}>
            <Title style={bB}>F.PAGO</Title>
            <View style={[pad, { flex: 1, justifyContent: "center" }]}>
              <Text style={[t6, { textAlign: "center" }]}>
                {prima.formaPago || "—"}
              </Text>
            </View>
          </View>
          <View style={{ flex: 3.5 }}>
            <Title style={bB}>CONSTANCIA</Title>
            <View style={[{ paddingHorizontal: 5, paddingVertical: 3 }, bB]}>
              <Text style={[tDt, { textAlign: "center", fontSize: 10 }]}>
                {contratante.constancia || "—"}
              </Text>
            </View>
            <View style={{ paddingHorizontal: 5, paddingVertical: 1 }}>
              <Text style={t6}>
                FLOT.:{"    "}INC:{"    "}N.ECON:
              </Text>
            </View>
          </View>
        </View>

        {/* Fila 2: nombre de oficina */}
        <View style={bB}>
          <Title style={bB}>OFICINA</Title>
          <View style={{ paddingHorizontal: 5, paddingVertical: 1 }}>
            <Text style={[t9, { textAlign: "center" }]}>
              {agencia?.nombre || "—"}
            </Text>
            <Text style={[t6, { marginTop: 2, textAlign: "center" }]}>
              Operador: {agencia?.operador || ""}
              {"    "}Vendedor: {agencia?.vendedor || ""}
            </Text>
          </View>
        </View>

        {/* Fila 3 — encabezados EMISIÓN / VIGENCIA */}
        <View style={[{ flexDirection: "row" }, bB]}>
          <View
            style={[
              bR,
              {
                flex: 1,
                backgroundColor: TITLE_BG,
                justifyContent: "center",
                paddingVertical: 4,
              },
            ]}
          >
            <Text style={[tit, { textAlign: "center" }]}>EMISIÓN</Text>
          </View>
          <View style={{ flex: 2 }}>
            <View
              style={[{ backgroundColor: TITLE_BG, paddingVertical: 1 }, bB]}
            >
              <Text style={[tit, { textAlign: "center" }]}>VIGENCIA</Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                backgroundColor: TITLE_BG,
                paddingVertical: 1,
              }}
            >
              <View style={[bR, { flex: 1 }]}>
                <Text style={[tit, { textAlign: "center" }]}>DESDE</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[tit, { textAlign: "center" }]}>HASTA</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Fila 3 — datos (fechas ORIGINALES de la póliza) */}
        <View style={{ flexDirection: "row" }}>
          <View
            style={[bR, { flex: 1, paddingHorizontal: 0, paddingVertical: 3 }]}
          >
            <Text style={[tDt, { textAlign: "center" }]}>{emision || "—"}</Text>
            <Text style={[t6, { textAlign: "center", marginTop: 2 }]}>
              {emisionHora || ""}
            </Text>
          </View>
          <View style={{ flex: 2, flexDirection: "row" }}>
            <View
              style={[
                bR,
                { flex: 1, paddingHorizontal: 5, paddingVertical: 3 },
              ]}
            >
              <Text style={[tDt, { textAlign: "center" }]}>
                {vigencia?.inicio || "—"}
              </Text>
              <Text style={[t6, { textAlign: "center", marginTop: 2 }]}>
                {vigencia?.inicioHora || ""}
              </Text>
            </View>
            <View style={{ flex: 1, paddingHorizontal: 5, paddingVertical: 3 }}>
              <Text style={[tDt, { textAlign: "center" }]}>
                {vigencia?.fin || "—"}
              </Text>
              <Text style={[t6, { textAlign: "center", marginTop: 2 }]}>
                {vigencia?.finHora || ""}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Fila de prima (sin tabla de coberturas) ────────────────────
function PrimaEndoso({ prima }) {
  const cols = [
    { label: "PRIMA NETA", value: prima.neta, flex: 3 },
    { label: "DESCUENTOS", value: prima.descuento, flex: 1 },
    { label: "PRONTO PAGO", value: prima.premioNeto, flex: 1 },
    { label: "RECARGOS", value: prima.recargo, flex: 1 },
    { label: "DERECHOS", value: prima.derechos, flex: 1 },
    { label: "IVA", value: prima.iva, flex: 1.5 },
  ];
  return (
    <View style={[CARD, { marginBottom: 8 }]}>
      <View style={{ flexDirection: "row" }}>
        {cols.map((col, i) => (
          <View key={i} style={[bR, { flex: col.flex }]}>
            <Title style={bB}>{col.label}</Title>
            <Text style={[t8, { textAlign: "center", paddingVertical: 2 }]}>
              {fmt(col.value)}
            </Text>
          </View>
        ))}
        <View style={{ flex: 1.5 }}>
          <Title style={bB}>TOTAL</Title>
          <Text style={[t8b, { textAlign: "center", paddingVertical: 2 }]}>
            {fmt(prima.total)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── Solo firma (sin QR ni teléfono) ───────────────────────────
function FirmaEndoso() {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 12,
      }}
    >
      <View
        style={{
          position: "relative",
          width: 160,
          height: 50,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          src={FIRMA}
          style={{
            position: "absolute",
            width: 150,
            height: 150,
            left: "50%",
            top: "50%",
            marginLeft: -64,
            marginTop: -75,
          }}
        />
        <Text style={[t8b, { textAlign: "center", zIndex: 1, marginTop: 30 }]}>
          FUNCIONARIO AUTORIZADO
        </Text>
      </View>
    </View>
  );
}

// ── Página del endoso ──────────────────────────────────────────
function EndosoPage({ poliza, motivo, fechaEndoso, tipoEndoso = "C" }) {
  const { empresa, numeroPoliza, contratante, vigencia } = poliza;

  return (
    <Page size="A4" style={styles.page}>
      {/* 1. Header */}
      <HeaderEndoso empresa={empresa} />

      {/* 2. Contratante (sin conductor) */}
      <DatosContratanteEndoso poliza={poliza} />

      {/* 3. Prima */}
      <PrimaEndoso prima={poliza.prima} />

      {/* 4. Leyenda obligatoria */}
      <Text style={[t8b, { textAlign: "center", marginBottom: 6 }]}>
        EL PRESENTE ENDOSO DEBE ACOMPAÑAR AL CERTIFICADO DETALLADO MÁS ARRIBA
      </Text>

      {/* 5. Caja de contenido — 50% del alto de la página */}
      <View style={[CARD, { padding: 10, height: "50%" }]}>
        {/* Fechas: distribuidas a todo el ancho con space-between */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <Text style={t8b}>
            Fecha de Emisión: <Text style={t8b}>{fechaEndoso}</Text>
          </Text>
          <Text style={t8b}>
            Vigencia desde: <Text style={t8b}>{fechaEndoso}</Text>
          </Text>
          <Text style={t8b}>
            Vigencia Hasta: <Text style={t8b}>{vigencia?.fin || "—"}</Text>
          </Text>
        </View>

        {/* Bloque descriptivo — fontSize 14 */}
        <Text
          style={{
            fontSize: 12,
            fontFamily: "Helvetica",
            color: COLORS.ink,
            lineHeight: 1.5,
            marginBottom: 16,
          }}
        >
          {
            "LAS ESPECIFICACIONES QUE SE DETALLAN SEGUIDAMENTE SE AGREGAN Y FORMAN PARTE DEL CERTIFICADO "
          }
          <Text
            style={{
              fontSize: 12,
              fontFamily: "Helvetica-Bold",
              color: COLORS.ink,
            }}
          >
            {numeroPoliza}
          </Text>
          {" EXPEDIDO A FAVOR DE "}
          <Text
            style={{
              fontSize: 12,
              fontFamily: "Helvetica-Bold",
              color: COLORS.ink,
            }}
          >
            {contratante.nombre}
          </Text>
          {
            ", LA PRESENTE ESPECIFICACIÓN SE COMPLEMENTA CON LA CARÁTULA PRINCIPAL Y LA RELACIÓN DE UBICACIONES"
          }
        </Text>

        {/* Endoso tipo y motivo — fontSize 14 */}
        <Text
          style={{
            fontSize: 14,
            fontFamily: "Helvetica",
            color: COLORS.ink,
            marginBottom: 12,
          }}
        >
          {`ENDOSO TIPO "${tipoEndoso}"`}
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontFamily: "Helvetica",
            color: COLORS.ink,
            marginBottom: 12,
          }}
        >
          {(motivo || "").toUpperCase()}
        </Text>

        {/* Términos */}
        <Text style={[t8b, { marginBottom: 8, fontSize: 10 }]}>
          TÉRMINOS Y CONDICIONES
        </Text>
        <Text style={[t7, { marginBottom: 14, lineHeight: 1.5, fontSize: 8 }]}>
          {TERMINOS_TEXT}
        </Text>

        <Text style={[t8b, { marginBottom: 3, fontSize: 10 }]}>
          TERRITORIALIDAD
        </Text>
        <Text style={[t7, { fontSize: 8 }]}>República Mexicana</Text>
      </View>

      {/* 6. Firma */}
      <FirmaEndoso />
    </Page>
  );
}

// ── Documento exportable ───────────────────────────────────────
export default function EndosoCancelacionPDF({
  poliza = mockPoliza,
  motivo = "",
  fechaEndoso = "",
  tipoEndoso = "C",
}) {
  return (
    <Document
      title={`Endoso Cancelación ${poliza.numeroPoliza}`}
      author={poliza.empresa?.razonSocial ?? "GAMAN"}
      subject="Endoso de Cancelación"
      creator="Cofisem"
    >
      <EndosoPage poliza={poliza} motivo={motivo} fechaEndoso={fechaEndoso} tipoEndoso={tipoEndoso} />
    </Document>
  );
}
