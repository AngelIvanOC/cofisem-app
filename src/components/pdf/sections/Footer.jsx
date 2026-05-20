import { View, Text, Image } from "@react-pdf/renderer";
import { COLORS } from "../styles";

const CELL = 13;
const QR_SIZE = CELL * 10; // 120

const QR_PATTERN = [
  [1, 1, 1, 1, 1, 1, 1, 0, 1, 0],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 0],
  [1, 0, 1, 1, 1, 0, 1, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 0],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 0, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 1, 0, 1, 0, 1, 0, 0, 1, 0],
  [0, 1, 1, 0, 1, 0, 1, 1, 0, 1],
];

function QRSimulado() {
  return (
    <View>
      {QR_PATTERN.map((row, ri) => (
        <View key={ri} style={{ flexDirection: "row" }}>
          {row.map((v, ci) => (
            <View
              key={ci}
              style={{
                width: CELL,
                height: CELL,
                flexShrink: 0,
                backgroundColor: v ? "#000000" : "#FFFFFF",
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export default function Footer({
  codigoQR,
  cabina = "800 999 1509",
  qrImageSrc = null,
}) {
  return (
    <View
      wrap={false}
      style={{
        flexDirection: "row",
        paddingVertical: 0,
        alignItems: "center",
        marginTop: 10,
      }}
    >
      {/* ── ATENCIÓN DE SINIESTROS (izquierda) ── */}
      <View
        style={{
          flex: 1,
          paddingRight: 24,
        }}
      >
        <Text
          style={{
            fontSize: 8,
            fontFamily: "Helvetica-Bold",
            color: COLORS.ink,
            marginBottom: 8,
          }}
        >
          ATENCIÓN DE SINIESTROS
        </Text>
        <Text
          style={{
            fontSize: 18,
            fontFamily: "Helvetica-Bold",
            color: COLORS.ink,
          }}
        >
          Cabina: {cabina}
        </Text>
      </View>

      {/* ── QR (centro) ── */}
      <View style={{ flex: 1, alignItems: "center" }}>
        {qrImageSrc ? (
          <Image src={qrImageSrc} style={{ width: QR_SIZE, height: QR_SIZE }} />
        ) : (
          <QRSimulado />
        )}
      </View>

      {/* ── FIRMA (derecha) ── */}
      <View style={{ flex: 1, alignItems: "center", marginTop: 20 }}>
        <Text
          style={{
            fontSize: 8,
            fontFamily: "Helvetica-Bold",
            color: COLORS.ink,
          }}
        >
          FUNCIONARIO AUTORIZADO
        </Text>
      </View>
    </View>
  );
}
