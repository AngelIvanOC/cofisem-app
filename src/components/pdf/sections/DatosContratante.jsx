import { View, Text } from "@react-pdf/renderer";
import { COLORS } from "../styles";
import { CARD, bB, bR, pad, tit, TITLE_BG, Title } from "./shared.jsx";

const t5 = { fontSize: 6, fontFamily: "Helvetica", color: COLORS.ink };
const t9 = { fontSize: 9, fontFamily: "Helvetica", color: COLORS.ink };
const tDt = { fontSize: 9, fontFamily: "Helvetica", color: COLORS.ink };

export default function DatosContratante({
  nombre,
  rfc,
  telefono,
  curp,
  conductorHabitual,
  conductorSexo,
  conductorEdad,
  constancia,
  usoTarifario,
  formaPago,
  direccion,
  vigencia,
  emision,
  emisionHora,
  agencia,
  blank = false,
}) {
  const dir1 = direccion
    ? `${direccion.calle},  Col: ${direccion.colonia}`
    : "";
  const dir2 = direccion ? `${direccion.municipio}, ${direccion.estado}` : "";
  const dir3 = direccion ? `CP ${direccion.cp}` : "";

  return (
    <View style={{ flexDirection: "row", marginBottom: 5 }}>
      {/* ══ CARD IZQUIERDA 60 % ══════════════════════════════════ */}
      <View style={[CARD, { flex: 60, marginRight: 3 }]}>
        <Title style={bB}>DATOS DEL CONTRATANTE</Title>

        <View style={[pad, bB, { flex: 1 }]}>
          <Text style={t9}>{blank ? "" : nombre || "—"}</Text>
          <Text style={[t9, { marginTop: 20 }]}>{blank ? "" : dir1}</Text>
          <Text style={t9}>{blank ? "" : dir2}</Text>
          <Text style={t9}>{blank ? "" : dir3}</Text>
          <Text style={t9}>{blank ? "" : (curp ? `CURP: ${curp}` : "")}</Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 0,
            }}
          >
            <Text style={t9}>{blank ? "" : `RFC: ${rfc || ""}`}</Text>
            <Text style={t9}>{blank ? "" : `Tel.:${telefono || ""}`}</Text>
          </View>
        </View>

        {/* Conductor */}
        <View style={{ flexDirection: "row" }}>
          <View style={[bR, { flex: 8 }]}>
            <Title style={bB}>CONDUCTOR HABITUAL</Title>
            <View style={pad}>
              <Text style={t5}>{blank ? "" : conductorHabitual || "—"}</Text>
            </View>
          </View>
          <View style={[bR, { flex: 1 }]}>
            <Title style={bB}>SEXO</Title>
            <View style={pad}>
              <Text style={t5}>{blank ? "" : conductorSexo || ""}</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Title style={bB}>EDAD</Title>
            <View style={pad}>
              <Text style={t5}>{blank ? "" : conductorEdad || ""}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ══ CARD DERECHA 40 % ════════════════════════════════════ */}
      <View style={[CARD, { flex: 40 }]}>
        {/* Fila 1: AGENCIA | USO | F.PAGO | CONSTANCIA */}
        <View style={[{ flexDirection: "row" }, bB]}>
          <View style={[bR, { flex: 1 }]}>
            <Title style={bB}>AGENCIA</Title>
            <View style={[pad, { flex: 1, justifyContent: "center" }]}>
              <Text
                style={{
                  fontSize: 6,
                  fontFamily: "Helvetica",
                  color: COLORS.ink,
                  textAlign: "center",
                }}
              >
                {agencia?.codigo || "—"}
              </Text>
            </View>
          </View>

          <View style={[bR, { flex: 1 }]}>
            <Title style={bB}>USO</Title>
            <View style={[pad, { flex: 1, justifyContent: "center" }]}>
              <Text
                style={{
                  fontSize: 6,
                  fontFamily: "Helvetica",
                  color: COLORS.ink,
                  textAlign: "center",
                }}
              >
                {usoTarifario || "—"}
              </Text>
            </View>
          </View>

          <View style={[bR, { flex: 1.5 }]}>
            <Title style={bB}>F.PAGO</Title>
            <View style={[pad, { flex: 1, justifyContent: "center" }]}>
              <Text
                style={{
                  fontSize: 6,
                  fontFamily: "Helvetica",
                  color: COLORS.ink,
                  textAlign: "center",
                }}
              >
                {formaPago || "—"}
              </Text>
            </View>
          </View>

          {/* CONSTANCIA — flex 3.5/7 = 50 % */}
          <View style={{ flex: 3.5 }}>
            <Title style={bB}>CONSTANCIA</Title>
            <View style={[{ paddingHorizontal: 5, paddingVertical: 3 }, bB]}>
              <Text style={[t9, { textAlign: "center", fontSize: 10 }]}>
                {constancia || "—"}
              </Text>
            </View>
            <View style={{ paddingHorizontal: 5, paddingVertical: 1 }}>
              <Text style={t5}>
                FLOT.:{"    "}INC:{"    "}N.ECON:
              </Text>
            </View>
          </View>
        </View>

        {/* Fila 2: AGENCIA nombre + Operador / Vendedor */}
        <View style={bB}>
          <Title style={bB}>AGENCIA</Title>
          <View style={{ paddingHorizontal: 5, paddingVertical: 1 }}>
            <Text
              style={{
                fontSize: 9,
                fontFamily: "Helvetica",
                color: COLORS.ink,
                textAlign: "center",
              }}
            >
              {agencia?.nombre || "—"}
            </Text>
            <Text style={[t5, { marginTop: 2, textAlign: "center" }]}>
              Operador: {agencia?.operador || ""}
              {"    "}Vendedor: {agencia?.vendedor || ""}
            </Text>
          </View>
        </View>

        {/* Fila 3 — encabezados (técnica DEDUCIBLE) */}
        <View style={[{ flexDirection: "row" }, bB]}>
          <View
            style={[
              bR,
              {
                flex: 1,
                backgroundColor: TITLE_BG,
                justifyContent: "center",
                paddingVertical: 4,
              },
            ]}
          >
            <Text style={[tit, { textAlign: "center" }]}>EMISIÓN</Text>
          </View>
          <View style={{ flex: 2 }}>
            <View
              style={[{ backgroundColor: TITLE_BG, paddingVertical: 1 }, bB]}
            >
              <Text style={[tit, { textAlign: "center" }]}>VIGENCIA</Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                backgroundColor: TITLE_BG,
                paddingVertical: 1,
              }}
            >
              <View style={[bR, { flex: 1 }]}>
                <Text style={[tit, { textAlign: "center" }]}>DESDE</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[tit, { textAlign: "center" }]}>HASTA</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Fila 3 — datos */}
        <View style={{ flexDirection: "row" }}>
          <View
            style={[bR, { flex: 1, paddingHorizontal: 0, paddingVertical: 3 }]}
          >
            <Text style={[tDt, { textAlign: "center" }]}>{emision || "—"}</Text>
            <Text style={[t5, { textAlign: "center", marginTop: 2 }]}>
              {emisionHora || ""}
            </Text>
          </View>
          <View style={{ flex: 2, flexDirection: "row" }}>
            <View
              style={[
                bR,
                { flex: 1, paddingHorizontal: 5, paddingVertical: 3 },
              ]}
            >
              <Text style={[tDt, { textAlign: "center" }]}>
                {vigencia?.inicio || "—"}
              </Text>
              <Text style={[t5, { textAlign: "center", marginTop: 2 }]}>
                {vigencia?.inicioHora || ""}
              </Text>
            </View>
            <View style={{ flex: 1, paddingHorizontal: 5, paddingVertical: 3 }}>
              <Text style={[tDt, { textAlign: "center" }]}>
                {vigencia?.fin || "—"}
              </Text>
              <Text style={[t5, { textAlign: "center", marginTop: 2 }]}>
                {vigencia?.finHora || ""}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
