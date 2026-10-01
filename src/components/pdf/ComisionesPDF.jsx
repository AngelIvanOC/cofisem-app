import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import COFISEM_LOGO from "../../assets/cofisem_logo_completo.png";
import { COLORS } from "./styles";

// PDF del Reporte de comisiones (/comisiones/reporte): por cada vendedor,
// su nombre, la tabla de cuotas cobradas y su total — espejo de la
// pantalla y del Excel (services/comisionesExport.js).

const n = (v) => parseFloat(v) || 0;
const $ = (v) =>
  `$${n(v).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtFecha = (d) =>
  d
    ? new Date(d + "T00:00:00").toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

// Anchos en pt — suman 802 (A4 landscape 842 − 2×20 de margen).
const COLS = [
  { key: "aseguradora", label: "Aseguradora", w: 42 },
  { key: "poliza", label: "Póliza", w: 60 },
  { key: "vigInicio", label: "Inicio vig.", w: 36, tipo: "fecha", align: "center" },
  { key: "asegurado", label: "Asegurado", w: 90 },
  { key: "rfc", label: "RFC", w: 46 },
  { key: "cobertura", label: "Cobertura", w: 62 },
  { key: "tipo", label: "Tipo", w: 24 },
  { key: "serie", label: "Serie", w: 66 },
  { key: "formaPago", label: "Forma pago", w: 38 },
  { key: "cuota", label: "Cuota", w: 20, align: "center" },
  { key: "fechaPago", label: "Fecha pago", w: 36, tipo: "fecha", align: "center" },
  { key: "primaPoliza", label: "Prima total póliza", w: 40, tipo: "dinero" },
  { key: "primaTotal", label: "Prima total cuota", w: 38, tipo: "dinero" },
  { key: "primaNeta", label: "Prima neta cuota", w: 38, tipo: "dinero" },
  { key: "comision", label: "Comisión $", w: 36, tipo: "dinero" },
  { key: "comisionPct", label: "Comisión %", w: 28, tipo: "pct" },
  { key: "gastosAdmin", label: "Gastos admin.", w: 32, tipo: "dinero" },
  { key: "iva", label: "IVA", w: 34, tipo: "dinero" },
  { key: "fechaComision", label: "Pago comisión", w: 36, tipo: "fecha", align: "center" },
];
const COLS_TOTAL = ["primaTotal", "primaNeta", "comision", "iva"];
// Ancho de las columnas antes de la primera que lleva total.
const ANCHO_ETIQUETA = COLS.slice(
  0,
  COLS.findIndex((c) => c.key === "primaTotal"),
).reduce((s, c) => s + c.w, 0);

const FS = 5.6;
const th = { fontFamily: "Helvetica-Bold", fontSize: FS, color: COLORS.white };
const td = { fontFamily: "Helvetica", fontSize: FS, color: COLORS.ink };
const tdBold = { fontFamily: "Helvetica-Bold", fontSize: FS, color: COLORS.navy };

function valor(col, v) {
  if (v == null || v === "") return "—";
  if (col.tipo === "dinero") return $(v);
  if (col.tipo === "pct") return `${n(v).toFixed(2)}%`;
  if (col.tipo === "fecha") return fmtFecha(v);
  return String(v);
}

function alinear(col) {
  if (col.align) return col.align;
  return col.tipo === "dinero" || col.tipo === "pct" ? "right" : "left";
}

function Fila({ children, style }) {
  return <View style={[{ flexDirection: "row" }, style]}>{children}</View>;
}

function Celda({ col, children, estilo, ancho }) {
  return (
    <View
      style={{
        width: ancho ?? col.w,
        paddingHorizontal: 2,
        paddingVertical: 2,
        justifyContent: "center",
      }}
    >
      <Text style={[estilo, { textAlign: col ? alinear(col) : "left" }]}>{children}</Text>
    </View>
  );
}

function FilaTotal({ etiqueta, totales, fondo, estilo }) {
  return (
    <Fila style={{ backgroundColor: fondo }}>
      <Celda ancho={ANCHO_ETIQUETA} estilo={estilo}>
        {etiqueta}
      </Celda>
      {COLS.slice(COLS.findIndex((c) => c.key === "primaTotal")).map((c) => (
        <Celda key={c.key} col={c} estilo={estilo}>
          {COLS_TOTAL.includes(c.key) ? $(totales?.[c.key]) : ""}
        </Celda>
      ))}
    </Fila>
  );
}

function BloqueVendedor({ g }) {
  return (
    <View style={{ marginBottom: 10 }}>
      {/* Nombre + encabezado no se separan de la primera fila */}
      <View wrap={false}>
        <Fila
          style={{
            backgroundColor: COLORS.navy,
            paddingHorizontal: 4,
            paddingVertical: 3,
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8, color: COLORS.white }}>
            {g.nombre}
          </Text>
          <Text style={{ fontFamily: "Helvetica", fontSize: 6.5, color: COLORS.white }}>
            {g.polizas} póliza(s) · {g.filas.length} cuota(s) · Comisión {$(g.totales.comision)}
          </Text>
        </Fila>
        <Fila style={{ backgroundColor: COLORS.grayHead }}>
          {COLS.map((c) => (
            <Celda key={c.key} col={c} estilo={th}>
              {c.label}
            </Celda>
          ))}
        </Fila>
      </View>
      {g.filas.map((f, i) => (
        <Fila
          key={f.id}
          wrap={false}
          style={{
            backgroundColor: i % 2 ? COLORS.stripe : COLORS.white,
            borderBottomWidth: 0.5,
            borderBottomColor: COLORS.rule,
          }}
        >
          {COLS.map((c) => (
            <Celda key={c.key} col={c} estilo={c.key === "comision" ? tdBold : td}>
              {valor(c, f[c.key])}
            </Celda>
          ))}
        </Fila>
      ))}
      <FilaTotal
        etiqueta={`Total ${g.nombre}`}
        totales={g.totales}
        fondo={COLORS.subtot}
        estilo={tdBold}
      />
    </View>
  );
}

export default function ComisionesPDF({ datos }) {
  const d = datos ?? { grupos: [], totalGeneral: {} };
  return (
    <Document>
      <Page
        size="A4"
        orientation="landscape"
        style={{
          paddingHorizontal: 20,
          paddingTop: 18,
          paddingBottom: 28,
          fontFamily: "Helvetica",
          backgroundColor: COLORS.white,
        }}
      >
        {/* ── Encabezado ── */}
        <Fila style={{ alignItems: "center", marginBottom: 10 }}>
          <View style={{ width: 150 }}>
            <Image src={COFISEM_LOGO} style={{ width: 140 }} />
          </View>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 14, color: COLORS.navy }}>
              REPORTE DE COMISIONES
            </Text>
            <Text style={{ fontSize: 8, color: COLORS.dim, marginTop: 2 }}>
              Periodo: {d.periodoLabel}
            </Text>
            <Text style={{ fontSize: 7, color: COLORS.dim, marginTop: 1 }}>
              {d.filtrosLabel}
            </Text>
          </View>
          <View style={{ width: 150, alignItems: "flex-end" }}>
            <Text style={{ fontSize: 6.5, color: COLORS.dim }}>Generado: {d.generado}</Text>
          </View>
        </Fila>

        {d.grupos.length === 0 ? (
          <Text style={{ fontSize: 9, color: COLORS.dim, textAlign: "center", marginTop: 40 }}>
            No hay cuotas cobradas con estos filtros.
          </Text>
        ) : (
          d.grupos.map((g) => <BloqueVendedor key={g.key} g={g} />)
        )}

        {d.grupos.length > 0 && (
          <View wrap={false}>
            <FilaTotal
              etiqueta="TOTAL GENERAL"
              totales={d.totalGeneral}
              fondo="#1447e6"
              estilo={{ ...tdBold, color: COLORS.white }}
            />
          </View>
        )}

        <Text
          style={{
            position: "absolute",
            bottom: 12,
            left: 20,
            right: 20,
            fontSize: 6.5,
            color: COLORS.dim,
            textAlign: "center",
          }}
          fixed
          render={({ pageNumber, totalPages }) =>
            `COFISEM — Reporte de comisiones · ${d.periodoLabel || ""} · Página ${pageNumber} de ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}
