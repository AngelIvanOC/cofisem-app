import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import GAMAN_LOGO from "../../assets/GamanLogoOpt.jpg";
import { COLORS } from "./styles";

const n = (v) => parseFloat(v) || 0;
const $ = (v) => `$${n(v).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtFecha = (d) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

// Ancho fijo por columna (pt) — suma ≈ 782, cabe en A4 landscape (842 - 2×20 de margen).
const COLS = [
  { key: "no",         label: "No.",         w: 18,  align: "center" },
  { key: "aseguradora",label: "Aseguradora", w: 60,  align: "left"   },
  { key: "poliza",     label: "Póliza",      w: 55,  align: "left"   },
  { key: "folio",      label: "Folio",       w: 38,  align: "left"   },
  { key: "asegurado",  label: "Asegurado",   w: 88,  align: "left"   },
  { key: "vendedor",   label: "Vendedor",    w: 68,  align: "left"   },
  { key: "cobertura",  label: "Cobertura",   w: 78,  align: "left"   },
  { key: "formaPago",  label: "F. Pago",     w: 48,  align: "left"   },
  { key: "efectivo",   label: "Efvo.",       w: 42,  align: "right"  },
  { key: "cheque",     label: "Cheq.",       w: 40,  align: "right"  },
  { key: "tdc",        label: "TDC",         w: 40,  align: "right"  },
  { key: "vale",       label: "Vale",        w: 36,  align: "right"  },
  { key: "primaAnual", label: "P. Anual",    w: 48,  align: "right"  },
  { key: "primaNeta",  label: "P. Neta",     w: 48,  align: "right"  },
  { key: "primerPago", label: "1er Pago",    w: 48,  align: "right"  },
];

const th = { fontFamily: "Helvetica-Bold", fontSize: 6.5, color: COLORS.white };
const td = { fontFamily: "Helvetica", fontSize: 6.5, color: COLORS.ink };
const tdBold = { fontFamily: "Helvetica-Bold", fontSize: 6.5, color: COLORS.navy };

function Fila({ children, style }) {
  return <View style={[{ flexDirection: "row" }, style]}>{children}</View>;
}

function Celda({ col, children, style, textStyle }) {
  return (
    <View
      style={[
        { width: col.w, paddingHorizontal: 3, paddingVertical: 3, justifyContent: "center" },
        style,
      ]}
    >
      <Text style={[textStyle, { textAlign: col.align }]} wrap={false}>
        {children}
      </Text>
    </View>
  );
}

function TablaHeader() {
  return (
    <Fila style={{ backgroundColor: COLORS.navy }} fixed>
      {COLS.map((c) => (
        <Celda key={c.key} col={c} textStyle={th}>{c.label}</Celda>
      ))}
    </Fila>
  );
}

function FilaPoliza({ r, i }) {
  const bg = i % 2 === 1 ? COLORS.stripe : COLORS.white;
  const val = {
    no: i + 1,
    aseguradora: r.aseguradora || "—",
    poliza: r.numero_poliza || "—",
    folio: r.folio || "—",
    asegurado: r.asegurado_nombre || "—",
    vendedor: r.vendedor_nombre || "—",
    cobertura: r.cobertura || "—",
    formaPago: r.forma_pago || "—",
    efectivo: n(r.efectivo) > 0 ? $(r.efectivo) : "—",
    cheque: n(r.cheque) > 0 ? $(r.cheque) : "—",
    tdc: n(r.tdc) > 0 ? $(r.tdc) : "—",
    vale: n(r.vale) > 0 ? $(r.vale) : "—",
    primaAnual: $(r.prima_anual),
    primaNeta: $(r.prima_neta),
    primerPago: $(r.prima_primer_pago),
  };
  return (
    <Fila style={{ backgroundColor: bg, borderBottomWidth: 0.5, borderBottomColor: COLORS.rule }} wrap={false}>
      {COLS.map((c) => (
        <Celda key={c.key} col={c} textStyle={c.key === "poliza" || c.key === "primerPago" ? tdBold : td}>
          {val[c.key]}
        </Celda>
      ))}
    </Fila>
  );
}

function FilaTotales({ totales }) {
  const totalesPorCol = {
    no: "", aseguradora: "", poliza: "", folio: "", asegurado: "", vendedor: "", cobertura: "",
    formaPago: "TOTAL",
    efectivo: $(totales.efectivo),
    cheque: $(totales.cheque),
    tdc: $(totales.tdc),
    vale: $(totales.vale),
    primaAnual: $(totales.primaAnual),
    primaNeta: $(totales.primaNeta),
    primerPago: $(totales.primerPago),
  };
  return (
    <Fila style={{ backgroundColor: "#e2e5ee", borderTopWidth: 1, borderTopColor: COLORS.navy }}>
      {COLS.map((c) => (
        <Celda key={c.key} col={c} textStyle={{ fontFamily: "Helvetica-Bold", fontSize: 6.5, color: COLORS.navy }}>
          {totalesPorCol[c.key]}
        </Celda>
      ))}
    </Fila>
  );
}

function CampoResumen({ label, value, bold, warn }) {
  return (
    <Fila style={{ justifyContent: "space-between", marginBottom: 3 }}>
      <Text style={{ fontFamily: "Helvetica", fontSize: 8, color: warn ? "#92400e" : COLORS.dim }}>{label}</Text>
      <Text style={{ fontFamily: bold ? "Helvetica-Bold" : "Helvetica", fontSize: 8.5, color: warn ? "#92400e" : (bold ? COLORS.navy : COLORS.ink) }}>
        {value}
      </Text>
    </Fila>
  );
}

export default function CortePDF({ datos }) {
  const d = datos ?? {};
  const registros = d.registros ?? [];
  const t = d.totales ?? {};

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={{ paddingHorizontal: 20, paddingVertical: 18, fontFamily: "Helvetica", backgroundColor: COLORS.white }}>
        {/* ── Encabezado ── */}
        <Fila style={{ alignItems: "center", marginBottom: 8 }}>
          <View style={{ width: 130 }}>
            <Image src={GAMAN_LOGO} style={{ width: 110 }} />
          </View>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 14, color: COLORS.navy }}>CORTE DIARIO</Text>
            <Text style={{ fontFamily: "Helvetica", fontSize: 8, color: COLORS.dim, marginTop: 2 }}>
              {d.oficina || "—"} · {d.fechaLabel || "—"}
            </Text>
          </View>
          <View style={{ width: 130, alignItems: "flex-end" }}>
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 3,
                backgroundColor: d.cerrado ? "#d1fae5" : "#fef3c7",
              }}
            >
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 7.5, color: d.cerrado ? "#065f46" : "#92400e" }}>
                {d.cerrado ? "CORTE CERRADO" : "EN PROCESO"}
              </Text>
            </View>
          </View>
        </Fila>

        <Fila style={{ borderTopWidth: 1, borderTopColor: COLORS.rule, borderBottomWidth: 1, borderBottomColor: COLORS.rule, paddingVertical: 5, marginBottom: 8, justifyContent: "space-between" }}>
          <Text style={{ fontSize: 7.5, color: COLORS.dim }}>Generado por: <Text style={{ fontFamily: "Helvetica-Bold", color: COLORS.ink }}>{d.generadoPor || "—"}</Text></Text>
          <Text style={{ fontSize: 7.5, color: COLORS.dim }}>Pólizas del día: <Text style={{ fontFamily: "Helvetica-Bold", color: COLORS.ink }}>{registros.length}</Text></Text>
          {d.cerrado && d.cerradoAt && (
            <Text style={{ fontSize: 7.5, color: COLORS.dim }}>Cerrado el: <Text style={{ fontFamily: "Helvetica-Bold", color: COLORS.ink }}>{d.cerradoAt}</Text></Text>
          )}
          <Text style={{ fontSize: 7.5, color: COLORS.dim }}>Impreso: <Text style={{ fontFamily: "Helvetica-Bold", color: COLORS.ink }}>{d.impresoEn || "—"}</Text></Text>
        </Fila>

        {/* ── Tabla de pólizas ── */}
        <View style={{ borderWidth: 0.5, borderColor: COLORS.rule }}>
          <TablaHeader />
          {registros.length === 0 ? (
            <View style={{ paddingVertical: 16, alignItems: "center" }}>
              <Text style={{ fontSize: 8, color: COLORS.dim }}>Sin pólizas registradas este día.</Text>
            </View>
          ) : (
            registros.map((r, i) => <FilaPoliza key={r.id ?? i} r={r} i={i} />)
          )}
          {registros.length > 0 && <FilaTotales totales={t} />}
        </View>

        {/* ── Resumen de cobro + entrega ── */}
        <Fila style={{ marginTop: 14, gap: 14 }} wrap={false}>
          <View style={{ flex: 1, borderWidth: 0.5, borderColor: COLORS.rule, borderRadius: 3, padding: 8 }}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8.5, color: COLORS.navy, marginBottom: 6 }}>RESUMEN DE COBRO</Text>
            <CampoResumen label="Efectivo" value={$(t.efectivo)} />
            <CampoResumen label="Vales" value={$(t.vale)} />
            <CampoResumen label="T. Crédito / Débito" value={$(t.tdc)} />
            <CampoResumen label="Fichas Cheques/Trans" value={$(t.cheque)} />
            <CampoResumen label="Gastos" value={$(t.gastos)} />
            <View style={{ borderTopWidth: 0.5, borderTopColor: COLORS.rule, marginTop: 3, paddingTop: 4 }}>
              <CampoResumen label="Subtotal efectivo" value={$(t.subEfectivo)} />
              <CampoResumen label="TOTAL COBRADO" value={$(t.totalCobro)} bold />
              <CampoResumen label="Pólizas pend. de pago" value={$(t.polPendPago)} warn />
            </View>
          </View>

          <View style={{ flex: 1, borderWidth: 0.5, borderColor: COLORS.rule, borderRadius: 3, padding: 8 }}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8.5, color: COLORS.navy, marginBottom: 6 }}>ENTREGA DE EFECTIVO</Text>
            <CampoResumen
              label="Forma de entrega"
              value={d.entregaTipo === "DEPOSITO" ? "Depósito" : d.entregaTipo === "PERSONAL" ? "Personal" : "—"}
              bold
            />
            <CampoResumen label="Total en billetes contados" value={$(t.totalBilletes)} />
            <CampoResumen label="Diferencia" value={`${n(t.diferencia) >= 0 ? "+" : ""}${$(t.diferencia)}`} warn={n(t.diferencia) !== 0} />

            <View style={{ marginTop: 20, flexDirection: "row", justifyContent: "space-between" }}>
              <View style={{ width: "45%", alignItems: "center" }}>
                <View style={{ borderBottomWidth: 0.5, borderBottomColor: COLORS.ink, width: "90%", marginBottom: 3 }} />
                <Text style={{ fontSize: 6.5, color: COLORS.dim }}>ENTREGA (Operador)</Text>
              </View>
              <View style={{ width: "45%", alignItems: "center" }}>
                <View style={{ borderBottomWidth: 0.5, borderBottomColor: COLORS.ink, width: "90%", marginBottom: 3 }} />
                <Text style={{ fontSize: 6.5, color: COLORS.dim }}>RECIBE</Text>
              </View>
            </View>
          </View>
        </Fila>

        <Text
          style={{ position: "absolute", bottom: 12, left: 20, right: 20, fontSize: 6.5, color: COLORS.dim, textAlign: "center" }}
          fixed
          render={({ pageNumber, totalPages }) => `COFISEM — Corte Diario · ${d.oficina || ""} · ${d.fechaLabel || ""} · Página ${pageNumber} de ${totalPages}`}
        />
      </Page>
    </Document>
  );
}
