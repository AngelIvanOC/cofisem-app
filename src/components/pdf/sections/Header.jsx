import { View, Text, Image } from "@react-pdf/renderer";
import { styles } from "../styles";
import GAMAN_LOGO from "../../../assets/GamanLogoOpt.jpg";

// Props:
//   empresa    { razonSocial, rfc, domicilio, ciudad, telefono, email }
//   copyLabel  string | null

export default function Header({ empresa, copyLabel }) {
  return (
    <View style={{ marginBottom: 0 }}>
      {/* ── Fila superior: Logo (50 %) | Info empresa (50 %) ── */}
      <View style={[styles.row, { alignItems: "flex-start" }]}>
        {/* Logo: 50 % del ancho, sin padding, auto-height */}
        <View style={{ flex: 1 }}>
          <Image src={GAMAN_LOGO} style={{ width: "100%" }} />
        </View>

        {/* Columna derecha: el grupo pegado al borde derecho, texto centrado dentro */}
        <View style={{ flex: 1, paddingTop: 10, alignItems: "flex-end" }}>
          <View style={{ width: 240, lineHeight: 0.6 }}>
            <Text
              style={[
                styles.companyInfo,
                { fontSize: 10, textAlign: "center" },
              ]}
            >
              {empresa.razonSocial}
            </Text>
            <Text
              style={[
                styles.companyInfo,
                { fontSize: 10, textAlign: "center" },
              ]}
            >
              RFC: {empresa.rfc}
            </Text>

            <Text
              style={[
                styles.companyInfo,
                { fontSize: 10, textAlign: "center" },
              ]}
            >
              {empresa.ciudad}
            </Text>
            <Text
              style={[
                styles.companyInfo,
                { fontSize: 10, textAlign: "center" },
              ]}
            >
              OFICINA Tels.: {empresa.telefono}
            </Text>
            <Text
              style={[
                styles.companyInfo,
                { fontSize: 10, textAlign: "center" },
              ]}
            >
              {empresa.email}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Título — centrado en el ancho TOTAL del PDF ── */}
      <View style={{ width: "100%", paddingBottom: 8 }}>
        <Text style={[styles.docTitle, { fontSize: 14 }]}>
          CARÁTULA DE PÓLIZA
        </Text>
        {copyLabel && (
          <Text style={styles.copyLabel}>(Ejemplar {copyLabel})</Text>
        )}
      </View>
    </View>
  );
}
