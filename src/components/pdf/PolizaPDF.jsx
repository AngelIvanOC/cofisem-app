import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles } from "./styles";
import Header from "./sections/Header";
import DatosContratante from "./sections/DatosContratante";
import DatosVehiculo from "./sections/DatosVehiculo";
import Coberturas from "./sections/Coberturas";
import Footer from "./sections/Footer";
import { mockPoliza } from "./mockData";

// Re-exportamos para que PDFPreview.jsx pueda importarlo sin cambios
export { mockPoliza };

// ── Copias ────────────────────────────────────────────────────
const COPIAS = [
  { label: null,            blankContratante: false },
  { label: "para OFICINA",  blankContratante: false },
  { label: "para VEHÍCULO", blankContratante: true  },
];

// ── Página individual ─────────────────────────────────────────
function PolizaPage({ poliza, copyLabel, blankContratante = false }) {
  return (
    <Page size="A4" style={styles.page}>
      {/* ── 1. Header ── */}
      <Header empresa={poliza.empresa} copyLabel={copyLabel} />

      {/* ── 2. Datos del contratante ── */}
      <DatosContratante
        nombre={poliza.contratante.nombre}
        rfc={poliza.contratante.rfc}
        telefono={poliza.contratante.telefono}
        conductorHabitual={poliza.contratante.conductorHabitual}
        conductorSexo={poliza.contratante.conductorSexo}
        conductorEdad={poliza.contratante.conductorEdad}
        constancia={poliza.contratante.constancia}
        usoTarifario={poliza.contratante.usoTarifario}
        direccion={poliza.contratante.direccion}
        vigencia={poliza.vigencia}
        emision={poliza.emision}
        emisionHora={poliza.emisionHora}
        formaPago={poliza.prima.formaPago}
        agencia={poliza.agencia}
        blank={blankContratante}
      />

      {/* ── 3. Datos del vehículo ── */}
      <DatosVehiculo vehiculo={poliza.vehiculo} />

      {/* ── 4. Coberturas + totales + condiciones ── */}
      <Coberturas
        coberturas={poliza.coberturas}
        prima={poliza.prima}
        condiciones={poliza.condiciones}
      />

      {/* ── 5. Leyenda recibo ── */}
      <View style={{ paddingTop: 0, paddingBottom: 0 }}>
        <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: "#000000", textAlign: "center" }}>
          {poliza.condiciones?.leyendaRecibo ?? "EXIJA SU RECIBO OFICIAL DE PAGO AL MOMENTO DE LIQUIDAR SUS PRIMAS"}
        </Text>
      </View>

      {/* ── 6. Footer ── */}
      <Footer
        codigoQR={poliza.codigoQR}
        cabina={poliza.empresa.telefonoSiniestros}
        qrImageSrc={poliza.qrDataUrl ?? null}
      />
    </Page>
  );
}

// ── Documento ─────────────────────────────────────────────────
export default function PolizaPDF({ poliza = mockPoliza }) {
  return (
    <Document
      title={`Póliza ${poliza.numeroPoliza}`}
      author={poliza.empresa.razonSocial}
      subject="Carátula de Póliza"
      creator="Cofisem"
    >
      {COPIAS.map((copia, i) => (
        <PolizaPage
          key={i}
          poliza={poliza}
          copyLabel={copia.label}
          blankContratante={copia.blankContratante}
        />
      ))}
    </Document>
  );
}
