import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import COFISEM_LOGO from "../../assets/cofisem_logo_completo.png";
import { COLORS } from "./styles";

const COLS = [
  { key: "poliza", label: "No. Póliza", w: 68, align: "left" },
  { key: "oficina", label: "Oficina", w: 60, align: "left" },
  { key: "cliente", label: "Cliente", w: 85, align: "left" },
  { key: "telCliente", label: "Tel. Cliente", w: 55, align: "left" },
  { key: "correoCliente", label: "Correo Cliente", w: 100, align: "left" },
  { key: "vendedor", label: "Vendedor", w: 75, align: "left" },
  { key: "telVendedor", label: "Tel. Vendedor", w: 55, align: "left" },
  { key: "correoVendedor", label: "Correo Vendedor", w: 100, align: "left" },
  { key: "vence", label: "Vence", w: 52, align: "center" },
  { key: "estatus", label: "Estatus", w: 52, align: "center" },
  { key: "renovacion", label: "Renovación", w: 58, align: "center" },
  { key: "adeudo", label: "Adeudo", w: 36, align: "center" },
];

const th = { fontFamily: "Helvetica-Bold", fontSize: 6.5, color: COLORS.white };
const td = { fontFamily: "Helvetica", fontSize: 6.5, color: COLORS.ink };
const tdBold = { fontFamily: "Helvetica-Bold", fontSize: 6.5, color: COLORS.navy };
const tdWarn = { fontFamily: "Helvetica-Bold", fontSize: 6.5, color: "#b45309" };
const tdOk = { fontFamily: "Helvetica-Bold", fontSize: 6.5, color: "#0f7a4a" };

function Fila({ children, style }) {
  return <View style={[{ flexDirection: "row" }, style]}>{children}</View>;
}

function Celda({ col, children, textStyle }) {
  return (
    <View
      style={{
        width: col.w,
        paddingHorizontal: 3,
        paddingVertical: 3,
        justifyContent: "center",
      }}
    >
      <Text style={[textStyle, { textAlign: col.align }]} wrap={false}>
        {children}
      </Text>
    </View>
  );
}

function TablaHeader() {
  return (
    <Fila style={{ backgroundColor: COLORS.navy }}>
      {COLS.map((c) => (
        <Celda key={c.key} col={c} textStyle={th}>
          {c.label}
        </Celda>
      ))}
    </Fila>
  );
}

function FilaRegistro({ r, i }) {
  const bg = i % 2 === 1 ? COLORS.stripe : COLORS.white;
  return (
    <Fila
      style={{
        backgroundColor: bg,
        borderBottomWidth: 0.5,
        borderBottomColor: COLORS.rule,
      }}
      wrap={false}
    >
      {COLS.map((c) => {
        let textStyle = td;
        if (c.key === "poliza") textStyle = tdBold;
        if (c.key === "renovacion") textStyle = r.renovacion === "Renovada" ? tdOk : tdWarn;
        if (c.key === "adeudo" && r.adeudo === "Sí") textStyle = tdWarn;
        return (
          <Celda key={c.key} col={c} textStyle={textStyle}>
            {r[c.key] ?? "—"}
          </Celda>
        );
      })}
    </Fila>
  );
}

export default function RenovacionesPDF({ datos }) {
  const d = datos ?? {};
  const registros = d.registros ?? [];

  return (
    <Document>
      <Page
        size="A4"
        orientation="landscape"
        style={{
          paddingHorizontal: 20,
          paddingVertical: 18,
          fontFamily: "Helvetica",
          backgroundColor: COLORS.white,
        }}
      >
        <Fila style={{ alignItems: "center", marginBottom: 8 }}>
          <View style={{ width: 150 }}>
            <Image src={COFISEM_LOGO} style={{ width: 140 }} />
          </View>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 14, color: COLORS.navy }}>
              RENOVACIONES PENDIENTES
            </Text>
            <Text style={{ fontFamily: "Helvetica", fontSize: 8, color: COLORS.dim, marginTop: 2 }}>
              {d.mesLabel || "—"}
            </Text>
          </View>
          <View style={{ width: 150 }} />
        </Fila>

        <Fila
          style={{
            borderTopWidth: 1,
            borderTopColor: COLORS.rule,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.rule,
            paddingVertical: 5,
            marginBottom: 10,
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontSize: 7.5, color: COLORS.dim }}>
            Pólizas listadas:{" "}
            <Text style={{ fontFamily: "Helvetica-Bold", color: COLORS.ink }}>
              {registros.length}
            </Text>
          </Text>
          <Text style={{ fontSize: 7.5, color: COLORS.dim }}>
            Impreso:{" "}
            <Text style={{ fontFamily: "Helvetica-Bold", color: COLORS.ink }}>
              {new Date().toLocaleString("es-MX")}
            </Text>
          </Text>
        </Fila>

        <View style={{ borderWidth: 0.5, borderColor: COLORS.rule }}>
          <TablaHeader />
          {registros.length === 0 ? (
            <View style={{ paddingVertical: 16, alignItems: "center" }}>
              <Text style={{ fontSize: 8, color: COLORS.dim }}>
                Sin renovaciones para este periodo.
              </Text>
            </View>
          ) : (
            registros.map((r, i) => <FilaRegistro key={i} r={r} i={i} />)
          )}
        </View>

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
            `COFISEM — Renovaciones · ${d.mesLabel || ""} · Página ${pageNumber} de ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}
