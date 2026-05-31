import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { EndosoPage } from "./EndosoCancelacionPDF";
import GAMAN_LOGO from "../../assets/GamanLogoOpt.jpg";

// ── Helpers ───────────────────────────────────────────────────
const fmt$ = (n) =>
  `$${Number(n ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const T  = { fontFamily: "Helvetica",      fontSize: 7.5, color: "#000000" };
const TB = { fontFamily: "Helvetica-Bold", fontSize: 7.5, color: "#000000" };
const T6 = { fontFamily: "Helvetica",      fontSize: 6,   color: "#000000" };
const TB6= { fontFamily: "Helvetica-Bold", fontSize: 6,   color: "#000000" };
const T9 = { fontFamily: "Helvetica",      fontSize: 9,   color: "#000000" };
const TB9= { fontFamily: "Helvetica-Bold", fontSize: 9,   color: "#000000" };

function FilaProrrata({ label, valor, bold = false }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 1.5 }}>
      <Text style={bold ? TB : T}>{label}</Text>
      <Text style={bold ? TB : T}>{valor}</Text>
    </View>
  );
}

function Separador() {
  return <View style={{ borderBottomWidth: 0.5, borderBottomColor: "#999", marginVertical: 2 }} />;
}

// ── Una sección del recibo (original / copia / talón) ─────────
function SeccionProrrata({ poliza, prorrata, constanciaFutura, tipoDoc, esUltima }) {
  const { contratante, vigencia, agencia, numeroPoliza } = poliza;
  const {
    primaTotal, ivaOriginal, derechos, primaNeta, primaNetaDia,
    diasTotales, diasTranscurridos, diasRestantes,
    primaNoDevengada, ivaNoDevengada, totalDevolver,
    fechaCancelacion,
  } = prorrata;

  const nombreAsegurado = (contratante?.nombre ?? "").toUpperCase();
  const textoPolizaSustituta = constanciaFutura
    ? `PARA SUSTITUIR POR LA PÓLIZA ${constanciaFutura}`
    : "PARA SUSTITUIR POR PÓLIZA A FUTURO";

  return (
    <View
      style={{
        flex: esUltima ? undefined : 1,
        flexDirection: "column",
        borderBottomWidth: esUltima ? 0 : 1,
        borderBottomStyle: "dashed",
        borderBottomColor: "#000",
        paddingHorizontal: 14,
        paddingVertical: 8,
      }}
    >
      {/* ── Header ── */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
        <View style={{ flex: 1 }}>
          <Image src={GAMAN_LOGO} style={{ width: 130 }} />
        </View>
        <View style={{ flex: 1.5, alignItems: "center" }}>
          <Text style={{ ...TB9, marginBottom: 2 }}>RECIBO DE CANCELACIÓN A PRORRATA</Text>
          <Text style={{ ...TB, marginBottom: 1 }}>CONSTANCIA: {(numeroPoliza ?? "").toUpperCase()}</Text>
          <Text style={T}>OFICINA: {(agencia?.nombre ?? "").toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <Text style={{ ...TB6, textAlign: "right" }}>Fecha: {fechaCancelacion}</Text>
          <View style={{ marginTop: 4, alignItems: "flex-end" }}>
            {tipoDoc === "talon"   && <Text style={{ ...TB6, textAlign: "right" }}>TALÓN PARA CONTROL</Text>}
            {tipoDoc === "copia"   && <Text style={{ ...T6,  textAlign: "right" }}>COPIA OFICINA</Text>}
            {tipoDoc === "original"&& <Text style={{ ...T6,  textAlign: "right" }}>ORIGINAL para el ASEGURADO</Text>}
          </View>
        </View>
      </View>

      {/* ── Cuerpo: asegurado (izq) + desglose prorrata (der) ── */}
      <View style={{ flexDirection: "row", gap: 6, marginBottom: 5 }}>

        {/* Izquierda: datos asegurado */}
        <View style={{ flex: 1.4, borderWidth: 1, borderColor: "#000", borderRadius: 3, paddingHorizontal: 7, paddingVertical: 5 }}>
          <Text style={{ ...TB, marginBottom: 3 }}>{nombreAsegurado}</Text>
          <Text style={T}>Vigencia desde: {vigencia?.inicio ?? "—"}</Text>
          <Text style={T}>Vigencia hasta: {vigencia?.fin ?? "—"}</Text>
          <View style={{ marginTop: 4 }}>
            <Text style={T6}>RFC: {(contratante?.rfc ?? "").toUpperCase()}</Text>
            <Text style={T6}>CURP: {(contratante?.curp ?? "").toUpperCase()}</Text>
          </View>
        </View>

        {/* Derecha: desglose prorrata */}
        <View style={{ flex: 1, backgroundColor: "#f0f0f0", borderWidth: 1, borderColor: "#000", borderRadius: 3, paddingHorizontal: 7, paddingVertical: 5 }}>
          <FilaProrrata label="Prima Total:"              valor={fmt$(primaTotal)} />
          <FilaProrrata label="IVA (incluido):"           valor={fmt$(ivaOriginal)} />
          <FilaProrrata label="Gastos de Expedición:"     valor={fmt$(derechos)} />
          <FilaProrrata label="Prima Neta:"               valor={fmt$(primaNeta)} />
          <Separador />
          <FilaProrrata label="Días totales:"             valor={String(diasTotales)} />
          <FilaProrrata label="Días transcurridos:"       valor={String(diasTranscurridos)} />
          <FilaProrrata label="Días por transcurrir:"     valor={String(diasRestantes)} />
          <FilaProrrata label="Prima Neta / día:"         valor={fmt$(primaNetaDia)} />
          <Separador />
          <FilaProrrata label="Prima No Devengada:"       valor={fmt$(primaNoDevengada)} />
          <FilaProrrata label="IVA s/ Prima No Dev.:"     valor={fmt$(ivaNoDevengada)} />
          <View style={{ borderTopWidth: 1, borderTopColor: "#000", marginTop: 2, paddingTop: 2 }}>
            <FilaProrrata label="TOTAL A DEVOLVER:"       valor={fmt$(totalDevolver)} bold />
          </View>
        </View>
      </View>

      {/* ── Nota y firmas — solo en original y copia, no en talón ── */}
      {!esUltima && (
        <>
          <View style={{ borderWidth: 1, borderColor: "#000", borderRadius: 3, paddingHorizontal: 8, paddingVertical: 5, marginBottom: 5 }}>
            <Text style={{ ...T, lineHeight: 1.6 }}>
              <Text style={TB}>NOTA: </Text>
              {"RECIBÍ DEL SR.(A)   "}
              <Text style={TB}>{nombreAsegurado}</Text>
              {"   LA CANTIDAD DE   "}
              <Text style={TB}>{fmt$(totalDevolver)}</Text>
              {"   A CUENTA DE PAGO DEL MOVIMIENTO:\n"}
              {"CANCELACIÓN A PRORRATA   "}
              <Text style={TB}>{textoPolizaSustituta}</Text>
              {"\nESTOY CONSCIENTE QUE ESTE PAGO FINALMENTE PODRÍA SER MAYOR, MENOR O IGUAL AL ENTREGADO PARA MI MOVIMIENTO EN ESTE MOMENTO."}
            </Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: "auto" }}>
            <View style={{ width: "40%", alignItems: "center" }}>
              <View style={{ borderBottomWidth: 0.5, borderBottomColor: "#000", width: "70%", marginBottom: 2 }} />
              <Text style={TB6}>FIRMA DEL ASEGURADO</Text>
            </View>
            <View style={{ width: "40%", alignItems: "center" }}>
              <View style={{ borderBottomWidth: 0.5, borderBottomColor: "#000", width: "70%", marginBottom: 2 }} />
              <Text style={TB6}>OPERADOR: {agencia?.operador ?? ""}</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

// ── Documento exportable ──────────────────────────────────────
export default function CancelacionProrrataPDF({
  poliza,
  prorrata,
  constanciaFutura = null,
  fechaEndoso = "",
  numeroControl = 1,
}) {
  return (
    <Document
      title={`Cancelación a Prorrata ${poliza?.numeroPoliza ?? ""}`}
      author={poliza?.empresa?.razonSocial ?? "GAMAN"}
      subject="Cancelación a Prorrata Tipo B"
      creator="Cofisem"
    >
      {/* Página 1: Endoso tipo B */}
      <EndosoPage
        poliza={poliza}
        motivo="CANCELACION POR BAJA DE UNIDAD"
        fechaEndoso={fechaEndoso}
        tipoEndoso="B"
        numeroControl={numeroControl}
      />

      {/* Página 2: Recibo de prorrata (3 copias) */}
      <Page
        size="A4"
        style={{ paddingHorizontal: 28, paddingVertical: 0, backgroundColor: "#ffffff", flexDirection: "column" }}
      >
        <SeccionProrrata poliza={poliza} prorrata={prorrata} constanciaFutura={constanciaFutura} tipoDoc="original" esUltima={false} />
        <SeccionProrrata poliza={poliza} prorrata={prorrata} constanciaFutura={constanciaFutura} tipoDoc="copia"    esUltima={false} />
        <SeccionProrrata poliza={poliza} prorrata={prorrata} constanciaFutura={constanciaFutura} tipoDoc="talon"    esUltima />
      </Page>
    </Document>
  );
}
