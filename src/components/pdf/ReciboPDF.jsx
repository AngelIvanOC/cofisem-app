import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import GAMAN_LOGO from "../../assets/GamanLogoOpt.jpg";

const MOCK = {
  constancia: "3413167-001",
  oficina: "COFISEM AV. E.ZAPATA",
  noRecibo: 1,
  asegurado: "ROBERTO DÍAZ RAMOS",
  calle: "AV. EMILIANO ZAPATA",
  numExt: "142",
  numInt: "3",
  colonia: "COL. CENTRO",
  municipio: "CUERNAVACA",
  estado: "MORELOS",
  cp: "62000",
  rfc: "DIR800101ABC",
  curp: "DIRR800101HMSZBS09",
  primaNeta: 1496.55,
  gastosExpedicion: 400.0,
  iva: 303.45,
  primaTotal: 2200.0,
  saldo: 0,
  vtoActual: "08/06/2024",
  vigenciaSiguiente: "",
  total: 2200.0,
  importe: 2200.0,
  vencimiento: "08/06/2024",
  pagoDe: 1,
  pagoTotal: 1,
  formaPago: "CONTADO",
  fechaRecibo: "27/05/2026",
  vigenciaDesde: "08/06/2024 12:00:00 hrs.",
  vigenciaHasta: "08/06/25 12:00:00 hrs.",
  conducto: "25",
  operador: "24",
};

const ROW_HEIGHT = 124;

function pad8(n) {
  return String(n).padStart(8, "0");
}

const fmt$ = (n) =>
  `$${Number(n ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const T = { fontFamily: "Helvetica", fontSize: 9, color: "#000000" };
const TB = { fontFamily: "Helvetica-Bold", fontSize: 9, color: "#000000" };

function FilaPago({ label, valor }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 2,
      }}
    >
      <Text style={T}>{label}</Text>
      <Text style={TB}>{valor}</Text>
    </View>
  );
}

function SeccionRecibo({
  constancia,
  oficina,
  noRecibo,
  asegurado,
  calle,
  numExt,
  numInt,
  colonia,
  municipio,
  estado,
  cp,
  rfc,
  curp,
  primaNeta,
  gastosExpedicion,
  iva,
  primaTotal,
  saldo,
  vtoActual,
  vigenciaSiguiente,
  periodoDesde,
  periodoHasta,
  total,
  importe,
  vencimiento,
  pagoDe,
  pagoTotal,
  formaPago,
  fechaRecibo,
  vigenciaDesde,
  vigenciaHasta,
  conducto,
  operador,
  tipoDoc,
  esUltima,
}) {
  return (
    <View
      style={{
        ...(esUltima ? {} : { flex: 1 }),
        flexDirection: "column",
        borderBottomWidth: esUltima ? 0 : 1,
        borderBottomStyle: "dashed",
        borderBottomColor: "#000000",
        paddingHorizontal: 14,
        paddingVertical: 10,
      }}
    >
      {/* ── Header ── */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <Image src={GAMAN_LOGO} style={{ width: 140 }} />
        </View>

        <View style={{ flex: 1, alignItems: "center" }}>
          <Text
            style={{
              fontFamily: "Helvetica-Bold",
              fontSize: 12,
              color: "#000000",
              marginBottom: 5,
            }}
          >
            RECIBO DE PAGO
          </Text>
          <Text
            style={{
              fontFamily: "Helvetica-Bold",
              fontSize: 9,
              color: "#000000",
              marginBottom: 5,
            }}
          >
            CONSTANCIA: {(constancia ?? "").toUpperCase()}
          </Text>
          <Text
            style={{
              fontFamily: "Helvetica-Bold",
              fontSize: 9,
              color: "#000000",
            }}
          >
            OFICINA: {(oficina ?? "").toUpperCase()}
          </Text>
        </View>

        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <View
            style={{
              backgroundColor: "#ffffc9",
              borderWidth: 1,
              borderColor: "#000000",
              borderRadius: 4,
              paddingHorizontal: 10,
              paddingVertical: 6,
              alignItems: "center",
              minWidth: 90,
            }}
          >
            <Text
              style={{
                fontFamily: "Helvetica-Bold",
                fontSize: 10,
                color: "#cc0000",
                letterSpacing: 1,
              }}
            >
              No.: {formaPago === "CONTADO" ? pad8(noRecibo) : `${pagoDe} de ${pagoTotal}`}
            </Text>
          </View>
          <View style={{ marginTop: 4, alignItems: "flex-end" }}>
            {tipoDoc === "talon" ? (
              <Text style={{ ...TB, textAlign: "right" }}>
                TALON PARA CONTROL
              </Text>
            ) : tipoDoc === "copia" ? (
              <Text style={{ ...T, textAlign: "right" }}>COPIA OFICINA</Text>
            ) : (
              <Text style={{ ...T, textAlign: "right" }}>
                ORIGINAL para el ASEGURADO
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* ── Vigencia ── */}
      <View
        style={{
          marginTop: 5,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={T}>
          Vigencia Póliza Desde: {vigenciaDesde}
          {"   "}Hasta: {vigenciaHasta}
        </Text>
        <Text style={T}>Conducto: {conducto}</Text>
      </View>

      {/* ── Cuerpo: asegurado (izq) + pagos (der) ── */}
      <View
        style={{
          marginTop: 8,
          flexDirection: "row",
          height: ROW_HEIGHT,
          gap: 6,
        }}
      >
        {/* Izquierda: caja asegurado */}
        <View
          style={{
            flex: 1.6,
            borderWidth: 1,
            borderColor: "#000000",
            borderRadius: 3,
            paddingHorizontal: 7,
            paddingVertical: 6,
            justifyContent: "space-between",
          }}
        >
          <Text style={TB}>{(asegurado ?? "").toUpperCase()}</Text>
          <View>
            <Text style={T}>
              {(calle ?? "").toUpperCase()} No. Ext. {numExt ?? ""}
              {numInt ? `  Int. ${numInt}` : ""}
            </Text>
            <Text style={T}>{(colonia ?? "").toUpperCase()}</Text>
            <Text style={T}>{(municipio ?? "").toUpperCase()}</Text>
            <Text style={T}>{(estado ?? "").toUpperCase()}</Text>
            <Text style={T}>C.P. {cp ?? ""}</Text>
          </View>
          <View>
            <Text style={T}>RFC: {(rfc ?? "").toUpperCase()}</Text>
            <Text style={T}>CURP: {(curp ?? "").toUpperCase()}</Text>
          </View>
        </View>

        {/* Derecha: importes + detalle */}
        <View style={{ flex: 1, flexDirection: "column" }}>
          {/* Caja gris importes */}
          <View
            style={{
              flex: 1,
              backgroundColor: "#e8e8e8",
              borderWidth: 1,
              borderColor: "#000000",
              borderRadius: 3,
              paddingHorizontal: 7,
              paddingVertical: 5,
            }}
          >
            <FilaPago label="PRIMA NETA :" valor={fmt$(primaNeta)} />
            <FilaPago label="Tasa p/Pago Fracc. :" valor="$0.00" />
            <FilaPago
              label="Gastos Expedición :"
              valor={fmt$(gastosExpedicion)}
            />
            <FilaPago label="Descuentos :" valor="$0.00" />
            <FilaPago label="I.V.A. :" valor={fmt$(iva)} />
            <View
              style={{
                borderTopWidth: 0.5,
                borderTopColor: "#999999",
                marginTop: 2,
                paddingTop: 3,
              }}
            >
              <FilaPago label="TOTAL A PAGAR :" valor={fmt$(total)} />
            </View>
          </View>

          {/* Detalle de cuota */}
          <View style={{ paddingHorizontal: 0, paddingTop: 0 }}>
            <Text style={{ ...T, lineHeight: 1 }}>
              Vto. P.Gracia: {vencimiento}
            </Text>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ ...T, lineHeight: 1 }}>
                P.Total: {fmt$(primaTotal)}
              </Text>
              <Text style={{ ...T, lineHeight: 1 }}>
                Saldo: {fmt$(saldo)}
              </Text>
            </View>
            <Text style={{ ...T, lineHeight: 1 }}>
              Forma de Pago: {formaPago === "CONTADO" ? "Contado" : "Cont.4 Parcial."}
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ ...T, lineHeight: 1 }}>
                Vto.: {periodoDesde || vtoActual}
              </Text>
              <Text style={{ ...T, lineHeight: 1 }}>
                Vigencia: {periodoHasta || vigenciaSiguiente}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Footer (secciones 1 y 2) ── */}
      {!esUltima && (
        <View style={{ flex: 1, flexDirection: "column", paddingTop: 5 }}>
          <Text
            style={{
              fontFamily: "Helvetica-Bold",
              fontSize: 6,
              color: "#000000",
              textAlign: "center",
              lineHeight: 1.1,
              marginBottom: 1,
            }}
          >
            GAMAN, S.A. DE C.V. RFC: GGA1711102U0
          </Text>
          <Text
            style={{
              fontFamily: "Helvetica-Bold",
              fontSize: 6,
              color: "#000000",
              textAlign: "center",
              lineHeight: 1.1,
              marginBottom: 1,
            }}
          >
            Av. EMILIANO ZAPATA 751, 2, Col: BELLAVISTA, CUERNAVACA, MORELOS,
            C.P: 62130{"   "}Tel.: 777-2027 042
          </Text>
          <Text
            style={{
              fontFamily: "Helvetica-Bold",
              fontSize: 6,
              color: "#000000",
              textAlign: "center",
              lineHeight: 1.1,
            }}
          >
            Reporte de Siniestros Cabina: 800 999 1509 - Dep.Banco: AFIRME
            {"   "}Cuenta: 143124789{"   "}Clave Interbancaria
            062540001431247890{"   "}contacto@gamanseguros.mx
          </Text>

          <Text
            style={{
              fontFamily: "Helvetica-Bold",
              fontSize: 6,
              color: "#000000",
              marginBottom: 4,
              marginTop: 16,
            }}
          >
            RECIBÍ CONSTANCIA ORIGINAL
          </Text>
          <Text
            style={{
              fontFamily: "Helvetica-Bold",
              fontSize: 6,
              color: "#000000",
              marginBottom: 16,
            }}
          >
            Fecha de Emision: {fechaRecibo}
          </Text>
          <View style={{ marginTop: "auto" }}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <View style={{ width: "40%", alignItems: "center" }}>
                <View
                  style={{
                    borderBottomWidth: 0.5,
                    borderBottomColor: "#000000",
                    width: "60%",
                    marginBottom: 3,
                  }}
                />
                <Text
                  style={{
                    fontFamily: "Helvetica-Bold",
                    fontSize: 6,
                    color: "#000000",
                  }}
                >
                  FIRMA DEL ASEGURADO
                </Text>
              </View>
              <View style={{ width: "40%", alignItems: "center" }}>
                <View
                  style={{
                    borderBottomWidth: 0.5,
                    borderBottomColor: "#000000",
                    width: "60%",
                    marginBottom: 3,
                  }}
                />
                <Text
                  style={{
                    fontFamily: "Helvetica-Bold",
                    fontSize: 6,
                    color: "#000000",
                  }}
                >
                  OPERADOR: {operador}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

export default function ReciboPDF({ datos = MOCK }) {
  const d = datos ?? MOCK;
  return (
    <Document>
      <Page
        size="A4"
        style={{
          paddingHorizontal: 28,
          paddingVertical: 0,
          backgroundColor: "#ffffff",
          flexDirection: "column",
        }}
      >
        <SeccionRecibo {...d} tipoDoc="original" esUltima={false} />
        <SeccionRecibo {...d} tipoDoc="copia" esUltima={false} />
        <SeccionRecibo {...d} tipoDoc="talon" esUltima />
      </Page>
    </Document>
  );
}
