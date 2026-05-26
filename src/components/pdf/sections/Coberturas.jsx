import { View, Text } from "@react-pdf/renderer";
import { COLORS } from "../styles";
import { CARD, bB, bR, TITLE_BG, tit, Title } from "./shared.jsx";

const td = {
  fontSize: 8,
  fontFamily: "Helvetica",
  color: COLORS.ink,
  paddingLeft: 2,
};
const tdDesc = {
  fontSize: 9,
  fontFamily: "Helvetica",
  color: COLORS.ink,
  paddingLeft: 2,
};
const tdSub = {
  fontSize: 8,
  fontFamily: "Helvetica",
  color: COLORS.ink,
  paddingLeft: 2,
};

const COND_DEFAULT =
  "LA EMPRESA PODRÁ INSPECCIONAR O VERIFICAR LA EXISTENCIA Y ESTADO FÍSICO DEL VEHÍCULO EN CUALQUIER MOMENTO EN DÍAS Y HORAS HÁBILES, " +
  "ESTE PROCEDIMIENTO SERÁ REALIZADO POR PERSONAL DEBIDAMENTE AUTORIZADO, " +
  "SI EL CONTRATANTE IMPIDE U OBSTACULIZA ESTA INSPECCIÓN, LA EMPRESA SE RESERVA EL DERECHO DE RESCINDIR EL CONTRATO EN TÉRMINOS DE LAS CONDICIONES GENERALES APLICABLES.\n" +
  "LOS DEDUCIBLES, COASEGUROS Y FRANQUICIAS NO REGISTRADAS EN ESTA CARATULA, ESTARÁN INDICADAS EN LAS ESPECIFICACIONES ANEXAS.\n" +
  "ATENCIÓN DE CUALQUIER COBERTURA DESCRITA EN LA CARATULA DE LA PÓLIZA FUERA DEL ESTADO DE MORELOS, SE APLICARÁ UN DEDUCIBLE DE 250 UMAS.\n" +
  "ESTE CONTRATO QUEDA SUJETO A LAS CONDICIONES GENERALES, INCLUYENDO LAS EXCLUSIONES.\n";

const fmt = (n) => {
  if (n == null || n === "") return "";
  const [int, dec] = Number(n).toFixed(2).split(".");
  return `$${int.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${dec ? "." + dec : ""}`;
};

export default function Coberturas({ coberturas, prima, condiciones }) {
  return (
    <View style={CARD}>
      {/* ══ HEADER ═══════════════════════════════════════════════════ */}
      <View style={[{ flexDirection: "row" }, bB]}>
        <View
          style={[
            bR,
            {
              flex: 4.3,
              backgroundColor: TITLE_BG,
              justifyContent: "center",
              paddingVertical: 4,
            },
          ]}
        >
          <Text style={[tit, { textAlign: "center" }]}>DESCRIPCIÓN</Text>
        </View>
        <View
          style={[
            bR,
            {
              flex: 1.9,
              backgroundColor: TITLE_BG,
              justifyContent: "center",
              paddingVertical: 4,
            },
          ]}
        >
          <Text style={[tit, { textAlign: "center" }]}>SUMA ASEGURADA</Text>
        </View>
        <View style={[bR, { flex: 1.9 }]}>
          <View style={[{ backgroundColor: TITLE_BG, paddingVertical: 1 }, bB]}>
            <Text style={[tit, { textAlign: "center" }]}>DEDUCIBLE</Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              backgroundColor: TITLE_BG,
              paddingVertical: 1,
            }}
          >
            <View style={[bR, { flex: 1 }]}>
              <Text style={[tit, { textAlign: "center" }]}>%</Text>
            </View>
            <View style={{ flex: 4 }}>
              <Text style={[tit, { textAlign: "center" }]}>C / Max.UMAs</Text>
            </View>
          </View>
        </View>
        <View
          style={{
            flex: 1.9,
            backgroundColor: TITLE_BG,
            justifyContent: "center",
            paddingVertical: 4,
          }}
        >
          <Text style={[tit, { textAlign: "center" }]}>PRIMA NETA</Text>
        </View>
      </View>

      {/* ══ FILAS DE COBERTURAS ═══════════════════════════════════════ */}
      <View style={{ minHeight: 160 }}>
        {coberturas.map((cob) => (
          <View key={cob.id}>
            <View style={{ flexDirection: "row" }}>
              <View style={[bR, { flex: 4.3, paddingVertical: 2 }]}>
                <Text style={tdDesc}>{cob.nombre}</Text>
              </View>
              <View
                style={[
                  bR,
                  { flex: 1.9, paddingHorizontal: 0, paddingVertical: 2 },
                ]}
              >
                <Text style={td}>{cob.sumaAsegurada}</Text>
              </View>
              <View
                style={[
                  bR,
                  { flex: 0.38, paddingHorizontal: 0, paddingVertical: 2 },
                ]}
              >
                <Text style={[td, { textAlign: "center" }]}>
                  {cob.deduciblePct || ""}
                </Text>
              </View>
              <View
                style={[
                  bR,
                  { flex: 1.52, paddingHorizontal: 0, paddingVertical: 2 },
                ]}
              >
                <Text style={[td, { textAlign: "center" }]}>
                  {cob.deducibleMax || ""}
                </Text>
              </View>
              <View
                style={{ flex: 1.9, paddingHorizontal: 0, paddingVertical: 2 }}
              >
                <Text style={[td, { textAlign: "right", paddingRight: 2 }]}>
                  {cob.prima > 0 ? fmt(cob.prima) : ""}
                </Text>
              </View>
            </View>

            {cob.subCoberturas?.map((sub, si) => (
              <View key={si} style={{ flexDirection: "row" }}>
                <View style={[bR, { flex: 4.3, paddingVertical: 2 }]}>
                  <View style={{ paddingLeft: 10 }}>
                    <Text style={tdSub}>
                      {sub.numero}. {sub.concepto}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    bR,
                    { flex: 1.9, paddingHorizontal: 0, paddingVertical: 2 },
                  ]}
                >
                  <Text style={tdSub}>{sub.monto}</Text>
                </View>
                <View style={[bR, { flex: 0.38, paddingVertical: 2 }]} />
                <View style={[bR, { flex: 1.52, paddingVertical: 2 }]} />
                <View style={{ flex: 1.9, paddingVertical: 2 }} />
              </View>
            ))}
          </View>
        ))}
        {/* Relleno: extiende los bordes de columna hasta el fondo del minHeight */}
        <View style={{ flexDirection: "row", flex: 1 }}>
          <View style={[bR, { flex: 4.3 }]} />
          <View style={[bR, { flex: 1.9 }]} />
          <View style={[bR, { flex: 0.38 }]} />
          <View style={[bR, { flex: 1.52 }]} />
          <View style={{ flex: 1.9 }} />
        </View>
      </View>

      {/* ══ FILA DE TOTALES ══════════════════════════════════════════ */}
      <View
        style={[
          { flexDirection: "row" },
          bB,
          {
            borderTopWidth: 0.75,
            borderTopColor: "#000000",
            borderTopStyle: "solid",
          },
        ]}
      >
        {[
          { label: "PRIMA NETA", value: prima.neta, flex: 3 },
          { label: "DESCUENTOS", value: prima.descuento, flex: 1 },
          { label: "PRONTO PAGO", value: prima.descuento, flex: 1 },
          { label: "RECARGOS", value: prima.recargo, flex: 1 },
          { label: "DERECHOS", value: prima.derechos, flex: 1 },
          { label: "IVA", value: prima.iva, flex: 1.5 },
        ].map((item, i) => (
          <View key={i} style={[bR, { flex: item.flex }]}>
            <Title style={bB}>{item.label}</Title>
            <Text
              style={[
                td,
                {
                  textAlign: "center",
                  paddingVertical: 2,
                  paddingHorizontal: 0,
                },
              ]}
            >
              {fmt(item.value)}
            </Text>
          </View>
        ))}
        <View style={{ flex: 1.5 }}>
          <Title style={bB}>TOTAL</Title>
          <Text
            style={{
              fontSize: 8,
              fontFamily: "Helvetica-Bold",
              color: COLORS.ink,
              textAlign: "center",
              paddingVertical: 2,
              paddingHorizontal: 2,
            }}
          >
            {fmt(prima.total)}
          </Text>
        </View>
      </View>

      {/* ══ SON ══════════════════════════════════════════════════════ */}
      <View
        style={[
          {
            backgroundColor: TITLE_BG,
            paddingHorizontal: 5,
            paddingVertical: 3,
          },
          bB,
        ]}
      >
        <Text
          style={{ fontSize: 9, fontFamily: "Helvetica", color: "#000000" }}
        >
          SON: {prima.enLetras}
        </Text>
      </View>

      {/* ══ CONDICIONES NOMBRADAS ════════════════════════════════════ */}
      <View style={{ paddingHorizontal: 10, paddingVertical: 5 }}>
        <Text
          style={{
            fontSize: 8,
            fontFamily: "Helvetica-Bold",
            color: "#000000",
            marginBottom: 8,
          }}
        >
          CONDICIONES NOMBRADAS:
        </Text>
        <Text
          style={{
            fontSize: 7,
            fontFamily: "Helvetica",
            color: COLORS.ink,
            lineHeight: 1.5,
          }}
        >
          {condiciones?.texto ?? COND_DEFAULT}
        </Text>
      </View>
    </View>
  );
}
