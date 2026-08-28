import { Document, Page, View, Text, Image } from "@react-pdf/renderer";
import COFISEM_LOGO from "../../assets/cofisem_logo_completo.png";
import { COLORS } from "./styles";

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

// ── Columnas — una tabla por cada pestaña que ya existe en /corte, con
// exactamente los mismos campos y en el mismo orden, para que el PDF sea
// un espejo fiel de lo que se ve en pantalla. Anchos en pt — cada tabla
// suma ≈750-800, cabe en A4 landscape (842 - 2×20 de margen = 802).
const COLS_POLIZA = [
  { key: "no", label: "No.", w: 16, align: "center" },
  { key: "aseguradora", label: "Aseguradora", w: 48, align: "left" },
  { key: "poliza", label: "Póliza", w: 68, align: "left" },
  { key: "fEmision", label: "F. Emisión", w: 40, align: "center" },
  { key: "vigInicio", label: "Vig. Inicio", w: 40, align: "center" },
  { key: "vigFin", label: "Vig. Fin", w: 40, align: "center" },
  { key: "folio", label: "Folio", w: 34, align: "left" },
  { key: "vendedor", label: "Vendedor", w: 46, align: "left" },
  { key: "asegurado", label: "Asegurado", w: 62, align: "left" },
  { key: "primaAnual", label: "Prima T. Anual", w: 46, align: "right" },
  { key: "primaNeta", label: "Prima N. Anual", w: 46, align: "right" },
  { key: "cuota", label: "Cuota", w: 26, align: "center" },
  { key: "pago", label: "Pago", w: 42, align: "right" },
  { key: "cobertura", label: "Cobertura", w: 46, align: "left" },
  { key: "placas", label: "Placas", w: 44, align: "left" },
  { key: "tipo", label: "Tipo", w: 42, align: "left" },
  { key: "uso", label: "Uso", w: 44, align: "left" },
  { key: "servicio", label: "Servicio", w: 44, align: "left" },
  { key: "emisor", label: "Emitió / Capturó", w: 52, align: "left" },
];

const COLS_PAGO = [
  { key: "no", label: "No.", w: 16, align: "center" },
  { key: "formaPago", label: "Forma Pago", w: 46, align: "left" },
  { key: "efectivo", label: "Efectivo", w: 42, align: "right" },
  { key: "cheque", label: "Cheq/Dep", w: 42, align: "right" },
  { key: "tdc", label: "TDC", w: 38, align: "right" },
  { key: "autorizacion", label: "Autorización", w: 54, align: "left" },
  { key: "polPendPago", label: "Pol.Pend.Pago", w: 48, align: "right" },
  { key: "telefono", label: "Teléfono", w: 52, align: "left" },
  { key: "observaciones", label: "Observaciones", w: 170, align: "left" },
  { key: "fotos", label: "Fotos", w: 30, align: "center" },
  { key: "factura", label: "Fact.", w: 30, align: "center" },
  { key: "tCirc", label: "T. Circ.", w: 32, align: "center" },
  { key: "identif", label: "Identif.", w: 32, align: "center" },
  { key: "polAnt", label: "Pol. Ant.", w: 32, align: "center" },
  { key: "otro", label: "Otro", w: 28, align: "center" },
];

const th = { fontFamily: "Helvetica-Bold", fontSize: 6.5, color: COLORS.white };
const td = { fontFamily: "Helvetica", fontSize: 6.5, color: COLORS.ink };
// Azul claro — cuota subsecuente que toca cobrar ese día y aún no se cobra.
const POR_COBRAR_BG = "#BBDEFB";
const tdBold = {
  fontFamily: "Helvetica-Bold",
  fontSize: 6.5,
  color: COLORS.navy,
};
const tdCheck = {
  fontFamily: "Helvetica-Bold",
  fontSize: 6.5,
  color: "#0f7a4a",
};
const tdDash = { fontFamily: "Helvetica", fontSize: 6.5, color: COLORS.rule };

function Fila({ children, style }) {
  return <View style={[{ flexDirection: "row" }, style]}>{children}</View>;
}

function Celda({ col, children, style, textStyle }) {
  return (
    <View
      style={[
        {
          width: col.w,
          paddingHorizontal: 3,
          paddingVertical: 3,
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Text style={[textStyle, { textAlign: col.align }]} wrap={false}>
        {children}
      </Text>
    </View>
  );
}

function TablaHeader({ cols }) {
  return (
    <Fila style={{ backgroundColor: COLORS.navy }}>
      {cols.map((c) => (
        <Celda key={c.key} col={c} textStyle={th}>
          {c.label}
        </Celda>
      ))}
    </Fila>
  );
}

// Presencia de un documento — el PDF es una constancia impresa, no un
// visor: solo indica si se adjuntó o no (igual que el clip/guion que se
// ve en pantalla), no reproduce el archivo.
const marca = (path) => (path ? "XXX" : "—");

function FilaPoliza({ r, i }) {
  const bg = r._cuotaPorCobrar
    ? POR_COBRAR_BG
    : i % 2 === 1
      ? COLORS.stripe
      : COLORS.white;
  const val = {
    no: i + 1,
    aseguradora: r.aseguradora || "—",
    poliza: r.numero_poliza || "—",
    fEmision: fmtFecha(r.fecha_emision),
    vigInicio: fmtFecha(r.vigencia_inicio),
    vigFin: fmtFecha(r.vigencia_fin),
    folio: r.folio || "—",
    vendedor: r.vendedor_nombre || "—",
    asegurado: r.asegurado_nombre || "—",
    primaAnual: $(r.prima_anual),
    primaNeta: $(r.prima_neta),
    cuota: r.num_cuota_pago ?? 1,
    pago: $(r.prima_primer_pago),
    cobertura: r._cuotaPorCobrar
      ? "• POR COBRAR"
      : r.cobertura || "—",
    placas: r.placas || "—",
    tipo: r.tipo || "—",
    uso: r.uso || "—",
    servicio: r.servicio || "—",
    emisor: r.creador_nombre || "—",
  };
  return (
    <Fila
      style={{
        backgroundColor: bg,
        borderBottomWidth: 0.5,
        borderBottomColor: COLORS.rule,
      }}
      wrap={false}
    >
      {COLS_POLIZA.map((c) => (
        <Celda
          key={c.key}
          col={c}
          textStyle={c.key === "poliza" || c.key === "pago" ? tdBold : td}
        >
          {val[c.key]}
        </Celda>
      ))}
    </Fila>
  );
}

const tdComisionBold = {
  fontFamily: "Helvetica-Bold",
  fontSize: 6.5,
  color: "#b91c1c",
};
const tdComisionDim = { fontFamily: "Helvetica", fontSize: 6.5, color: "#e9a3a3" };

// Comisión (vale) pagada — se muestra como fila aparte al final de la tabla
// de pólizas, con "−" en "No." y el monto en negativo bajo "Pago", igual
// que en pantalla — no es una póliza, es dinero que sale del efectivo.
function FilaComision({ c }) {
  const pc = c.polizas_cofisem ?? {};
  const val = {
    no: "−",
    aseguradora: pc.aseguradora || "—",
    poliza: pc.numero_poliza || "—",
    fEmision: fmtFecha(c.fecha_pago),
    vigInicio: "—",
    vigFin: "—",
    folio: pc.folio || "—",
    vendedor: pc.vendedor_nombre || "—",
    asegurado: pc.asegurado_nombre || "—",
    primaAnual: "—",
    primaNeta: "—",
    cuota: "—",
    pago: `-${$(c.monto)}`,
    cobertura: "—",
    placas: "—",
    tipo: "—",
    uso: "—",
    servicio: "—",
    emisor: "—",
  };
  return (
    <Fila
      style={{
        backgroundColor: "#fef2f2",
        borderBottomWidth: 0.5,
        borderBottomColor: COLORS.rule,
      }}
      wrap={false}
    >
      {COLS_POLIZA.map((col) => (
        <Celda
          key={col.key}
          col={col}
          textStyle={val[col.key] === "—" ? tdComisionDim : tdComisionBold}
        >
          {val[col.key]}
        </Celda>
      ))}
    </Fila>
  );
}

function FilaPago({ r, i }) {
  const bg = r._cuotaPorCobrar
    ? POR_COBRAR_BG
    : i % 2 === 1
      ? COLORS.stripe
      : COLORS.white;
  const val = {
    no: i + 1,
    formaPago: r.forma_pago || "—",
    efectivo: n(r.efectivo) > 0 ? $(r.efectivo) : "—",
    cheque: n(r.cheque) > 0 ? $(r.cheque) : "—",
    tdc: n(r.tdc) > 0 ? $(r.tdc) : "—",
    autorizacion: r.autorizacion || "—",
    polPendPago: n(r.pol_pend_pago) > 0 ? $(r.pol_pend_pago) : "—",
    telefono: r.telefono || "—",
    observaciones:
      (r._cuotaPorCobrar ? "• POR COBRAR — " : "") + (r.observaciones || "—"),
    fotos: r.fotos_url || r.fotos_verificado ? "XXX" : "—",
    factura: marca(r.factura_url),
    tCirc: marca(r.t_circ_url),
    identif: marca(r.identif_url),
    polAnt: marca(r.pol_ant_url),
    otro: marca(r.otro_url),
  };
  const marcados = ["fotos", "factura", "tCirc", "identif", "polAnt", "otro"];
  return (
    <Fila
      style={{
        backgroundColor: bg,
        borderBottomWidth: 0.5,
        borderBottomColor: COLORS.rule,
      }}
      wrap={false}
    >
      {COLS_PAGO.map((c) => (
        <Celda
          key={c.key}
          col={c}
          textStyle={
            c.key === "efectivo"
              ? tdBold
              : marcados.includes(c.key)
                ? val[c.key] === "XXX"
                  ? tdCheck
                  : tdDash
                : td
          }
        >
          {val[c.key]}
        </Celda>
      ))}
    </Fila>
  );
}

const tdNota = { fontFamily: "Helvetica-Oblique", fontSize: 6.5, color: "#6b7280" };
const tdNotaBold = { fontFamily: "Helvetica-Bold", fontSize: 6.5, color: "#6b7280" };

// Nota de endoso (tipo A/C) — informativa, en gris, no aporta a ningún
// total. No usa las columnas de COLS_POLIZA una a una: la póliza/fecha van
// en las primeras celdas y el resto del ancho se dedica al texto de la nota.
function FilaNota({ nt }) {
  const anchoPoliza = COLS_POLIZA[0].w + COLS_POLIZA[1].w + COLS_POLIZA[2].w;
  const anchoFecha = COLS_POLIZA[3].w;
  const anchoNota = COLS_POLIZA.slice(4).reduce((s, c) => s + c.w, 0);
  return (
    <Fila
      style={{
        backgroundColor: "#f3f4f6",
        borderBottomWidth: 0.5,
        borderBottomColor: COLORS.rule,
      }}
      wrap={false}
    >
      <View style={{ width: anchoPoliza, paddingHorizontal: 3, paddingVertical: 3, justifyContent: "center" }}>
        <Text style={tdNotaBold} wrap={false}>
          {`ENDOSO · ${nt.polizas?.constancia || nt.polizas?.numero_poliza || "—"}`}
        </Text>
      </View>
      <View style={{ width: anchoFecha, paddingHorizontal: 3, paddingVertical: 3, justifyContent: "center" }}>
        <Text style={[tdNota, { textAlign: "center" }]} wrap={false}>
          {nt.cambiado_at ? fmtFecha(nt.cambiado_at.slice(0, 10)) : "—"}
        </Text>
      </View>
      <View style={{ width: anchoNota, paddingHorizontal: 3, paddingVertical: 3, justifyContent: "center" }}>
        <Text style={tdNota}>{nt.notas}</Text>
      </View>
    </Fila>
  );
}

function FilaTotalesPoliza({ totales }) {
  const v = {
    no: "",
    aseguradora: "",
    poliza: "",
    fEmision: "",
    vigInicio: "",
    vigFin: "",
    folio: "",
    vendedor: "",
    asegurado: "TOTAL",
    primaAnual: $(totales.primaAnual),
    primaNeta: $(totales.primaNeta),
    cuota: "",
    pago: $(totales.primerPago),
    cobertura: "",
    placas: "",
    tipo: "",
    uso: "",
    servicio: "",
    emisor: "",
  };
  return (
    <Fila
      style={{
        backgroundColor: "#e2e5ee",
        borderTopWidth: 1,
        borderTopColor: COLORS.navy,
      }}
    >
      {COLS_POLIZA.map((c) => (
        <Celda
          key={c.key}
          col={c}
          textStyle={{
            fontFamily: "Helvetica-Bold",
            fontSize: 6.5,
            color: COLORS.navy,
          }}
        >
          {v[c.key]}
        </Celda>
      ))}
    </Fila>
  );
}

function FilaTotalesPago({ totales }) {
  const v = {
    no: "",
    formaPago: "TOTAL",
    efectivo: $(totales.efectivo),
    cheque: "",
    tdc: "",
    autorizacion: "",
    polPendPago: "",
    telefono: "",
    observaciones: "",
    fotos: "",
    factura: "",
    tCirc: "",
    identif: "",
    polAnt: "",
    otro: "",
  };
  return (
    <Fila
      style={{
        backgroundColor: "#e2e5ee",
        borderTopWidth: 1,
        borderTopColor: COLORS.navy,
      }}
    >
      {COLS_PAGO.map((c) => (
        <Celda
          key={c.key}
          col={c}
          textStyle={{
            fontFamily: "Helvetica-Bold",
            fontSize: 6.5,
            color: COLORS.navy,
          }}
        >
          {v[c.key]}
        </Celda>
      ))}
    </Fila>
  );
}

function TablaSeccion({ titulo, children }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text
        style={{
          fontFamily: "Helvetica-Bold",
          fontSize: 8,
          color: COLORS.navy,
          marginBottom: 3,
        }}
      >
        {titulo}
      </Text>
      <View style={{ borderWidth: 0.5, borderColor: COLORS.rule }}>
        {children}
      </View>
    </View>
  );
}

function CampoResumen({ label, value, bold, warn }) {
  return (
    <Fila style={{ justifyContent: "space-between", marginBottom: 3 }}>
      <Text
        style={{
          fontFamily: "Helvetica",
          fontSize: 8,
          color: warn ? "#92400e" : COLORS.dim,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: bold ? "Helvetica-Bold" : "Helvetica",
          fontSize: 8.5,
          color: warn ? "#92400e" : bold ? COLORS.navy : COLORS.ink,
        }}
      >
        {value}
      </Text>
    </Fila>
  );
}

export default function CortePDF({ datos }) {
  const d = datos ?? {};
  const registros = d.registros ?? [];
  const comisiones = d.comisiones ?? [];
  const notasEndoso = d.notasEndoso ?? [];
  const t = d.totales ?? {};

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
        {/* ── Encabezado ── */}
        <Fila style={{ alignItems: "center", marginBottom: 8 }}>
          <View style={{ width: 150 }}>
            <Image src={COFISEM_LOGO} style={{ width: 140 }} />
          </View>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text
              style={{
                fontFamily: "Helvetica-Bold",
                fontSize: 14,
                color: COLORS.navy,
              }}
            >
              CORTE DIARIO
            </Text>
            <Text
              style={{
                fontFamily: "Helvetica",
                fontSize: 8,
                color: COLORS.dim,
                marginTop: 2,
              }}
            >
              {d.oficina || "—"} · {d.fechaLabel || "—"}
            </Text>
          </View>
          <View style={{ width: 150, alignItems: "flex-end" }}>
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 3,
                backgroundColor: d.cerrado ? "#d1fae5" : "#fef3c7",
              }}
            >
              <Text
                style={{
                  fontFamily: "Helvetica-Bold",
                  fontSize: 7.5,
                  color: d.cerrado ? "#065f46" : "#92400e",
                }}
              >
                {d.cerrado ? "CORTE CERRADO" : "EN PROCESO"}
              </Text>
            </View>
          </View>
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
            Generado por:{" "}
            <Text style={{ fontFamily: "Helvetica-Bold", color: COLORS.ink }}>
              {d.generadoPor || "—"}
            </Text>
          </Text>
          <Text style={{ fontSize: 7.5, color: COLORS.dim }}>
            Pólizas del día:{" "}
            <Text style={{ fontFamily: "Helvetica-Bold", color: COLORS.ink }}>
              {registros.length}
            </Text>
          </Text>
          {d.cerrado && d.cerradoAt && (
            <Text style={{ fontSize: 7.5, color: COLORS.dim }}>
              Cerrado el:{" "}
              <Text style={{ fontFamily: "Helvetica-Bold", color: COLORS.ink }}>
                {d.cerradoAt}
              </Text>
            </Text>
          )}
          <Text style={{ fontSize: 7.5, color: COLORS.dim }}>
            Impreso:{" "}
            <Text style={{ fontFamily: "Helvetica-Bold", color: COLORS.ink }}>
              {d.impresoEn || "—"}
            </Text>
          </Text>
        </Fila>

        {/* ── Tabla 1: Datos de póliza (igual que la pestaña "Datos de póliza") ── */}
        <TablaSeccion titulo="DATOS DE PÓLIZA">
          <TablaHeader cols={COLS_POLIZA} />
          {registros.length === 0 && comisiones.length === 0 ? (
            <View style={{ paddingVertical: 16, alignItems: "center" }}>
              <Text style={{ fontSize: 8, color: COLORS.dim }}>
                Sin pólizas registradas este día.
              </Text>
            </View>
          ) : (
            <>
              {registros.map((r, i) => (
                <FilaPoliza key={r.id ?? i} r={r} i={i} />
              ))}
              {comisiones.map((c, i) => (
                <FilaComision key={`comision-${c.id ?? i}`} c={c} />
              ))}
              {notasEndoso.map((nt, i) => (
                <FilaNota key={`nota-${nt.id ?? i}`} nt={nt} />
              ))}
              <FilaTotalesPoliza totales={t} />
            </>
          )}
        </TablaSeccion>

        {/* ── Tabla 2: Pago y respaldo (igual que la pestaña "Pago y respaldo") ── */}
        <TablaSeccion titulo="PAGO Y RESPALDO">
          <TablaHeader cols={COLS_PAGO} />
          {registros.length === 0 ? (
            <View style={{ paddingVertical: 16, alignItems: "center" }}>
              <Text style={{ fontSize: 8, color: COLORS.dim }}>
                Sin pólizas registradas este día.
              </Text>
            </View>
          ) : (
            <>
              {registros.map((r, i) => (
                <FilaPago key={r.id ?? i} r={r} i={i} />
              ))}
              <FilaTotalesPago totales={t} />
            </>
          )}
        </TablaSeccion>

        {/* ── Resumen de cobro + entrega ── */}
        <Fila style={{ marginTop: 6, gap: 14 }} wrap={false}>
          <View
            style={{
              flex: 1,
              borderWidth: 0.5,
              borderColor: COLORS.rule,
              borderRadius: 3,
              padding: 8,
            }}
          >
            <Text
              style={{
                fontFamily: "Helvetica-Bold",
                fontSize: 8.5,
                color: COLORS.navy,
                marginBottom: 6,
              }}
            >
              RESUMEN DE COBRO
            </Text>
            <CampoResumen label="Efectivo" value={$(t.efectivo)} />
            <CampoResumen label="Vales" value={$(t.vale)} />
            <CampoResumen label="T. Crédito / Débito" value={$(t.tdc)} />
            <CampoResumen label="Fichas Cheques/Trans" value={$(t.cheque)} />
            <CampoResumen label="Gastos" value={$(t.gastos)} />
            <View
              style={{
                borderTopWidth: 0.5,
                borderTopColor: COLORS.rule,
                marginTop: 3,
                paddingTop: 4,
              }}
            >
              <CampoResumen
                label="Subtotal efectivo"
                value={$(t.subEfectivo)}
              />
              <CampoResumen
                label="TOTAL COBRADO"
                value={$(t.totalCobro)}
                bold
              />
              <CampoResumen
                label="Pólizas pend. de pago"
                value={$(t.polPendPago)}
                warn
              />
            </View>
          </View>

          <View
            style={{
              flex: 1,
              borderWidth: 0.5,
              borderColor: COLORS.rule,
              borderRadius: 3,
              padding: 8,
            }}
          >
            <Text
              style={{
                fontFamily: "Helvetica-Bold",
                fontSize: 8.5,
                color: COLORS.navy,
                marginBottom: 6,
              }}
            >
              ENTREGA DE EFECTIVO
            </Text>
            <CampoResumen
              label="Forma de entrega"
              value={
                d.entregaTipo === "DEPOSITO"
                  ? "Depósito"
                  : d.entregaTipo === "PERSONAL"
                    ? "Personal"
                    : "—"
              }
              bold
            />
            <CampoResumen
              label="Total en billetes contados"
              value={$(t.totalBilletes)}
            />
            <CampoResumen
              label="Diferencia"
              value={`${n(t.diferencia) >= 0 ? "+" : ""}${$(t.diferencia)}`}
              warn={n(t.diferencia) !== 0}
            />

            <View
              style={{
                marginTop: 20,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <View style={{ width: "45%", alignItems: "center" }}>
                <View
                  style={{
                    borderBottomWidth: 0.5,
                    borderBottomColor: COLORS.ink,
                    width: "90%",
                    marginBottom: 3,
                  }}
                />
                <Text style={{ fontSize: 6.5, color: COLORS.dim }}>
                  ENTREGA (Operador)
                </Text>
              </View>
              <View style={{ width: "45%", alignItems: "center" }}>
                <View
                  style={{
                    borderBottomWidth: 0.5,
                    borderBottomColor: COLORS.ink,
                    width: "90%",
                    marginBottom: 3,
                  }}
                />
                <Text style={{ fontSize: 6.5, color: COLORS.dim }}>RECIBE</Text>
              </View>
            </View>
          </View>
        </Fila>

        {d.observaciones && (
          <View
            style={{
              marginTop: 8,
              borderWidth: 0.5,
              borderColor: COLORS.rule,
              borderRadius: 3,
              padding: 8,
            }}
            wrap={false}
          >
            <Text
              style={{
                fontFamily: "Helvetica-Bold",
                fontSize: 8.5,
                color: COLORS.navy,
                marginBottom: 3,
              }}
            >
              OBSERVACIONES DEL CORTE
            </Text>
            <Text style={{ fontFamily: "Helvetica", fontSize: 8, color: COLORS.ink }}>
              {d.observaciones}
            </Text>
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
            `COFISEM — Corte Diario · ${d.oficina || ""} · ${d.fechaLabel || ""} · Página ${pageNumber} de ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}
