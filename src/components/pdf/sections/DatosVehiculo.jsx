import { View, Text } from "@react-pdf/renderer";
import { COLORS } from "../styles";
import { CARD, bB, bR, pad, Title } from "./shared.jsx";

const t9 = { fontSize: 9, fontFamily: "Helvetica", color: COLORS.ink, textAlign: "center" };

export default function DatosVehiculo({ vehiculo }) {
  const descripcion = `${vehiculo.marca} ${vehiculo.modelo}`;

  return (
    <View style={[CARD, { marginBottom: 5 }]}>

      {/* ── Fila 1: DESCRIPCION 70 % | MODELO 10 % | PLACAS 20 % ── */}
      <View style={[{ flexDirection: "row" }, bB]}>
        <View style={[bR, { flex: 7 }]}>
          <Title style={bB}>DESCRIPCION</Title>
          <View style={pad}><Text style={t9}>{descripcion}</Text></View>
        </View>
        <View style={[bR, { flex: 1 }]}>
          <Title style={bB}>MODELO</Title>
          <View style={pad}><Text style={t9}>{vehiculo.anio || "—"}</Text></View>
        </View>
        <View style={{ flex: 2 }}>
          <Title style={bB}>PLACAS</Title>
          <View style={pad}><Text style={t9}>{vehiculo.placas || "—"}</Text></View>
        </View>
      </View>

      {/* ── Fila 2: SERIE | MOTOR | CAPACIDAD | USO | TIPO | COD.AMIS ── */}
      <View style={{ flexDirection: "row" }}>
        <View style={[bR, { flex: 22 }]}>
          <Title style={bB}>SERIE</Title>
          <View style={pad}><Text style={t9}>{vehiculo.serie || "—"}</Text></View>
        </View>
        <View style={[bR, { flex: 16 }]}>
          <Title style={bB}>MOTOR</Title>
          <View style={pad}><Text style={t9}>{vehiculo.motor || "—"}</Text></View>
        </View>
        <View style={[bR, { flex: 16 }]}>
          <Title style={bB}>CAPACIDAD</Title>
          <View style={pad}><Text style={t9}>{vehiculo.capacidad || "—"}</Text></View>
        </View>
        <View style={[bR, { flex: 20 }]}>
          <Title style={bB}>USO</Title>
          <View style={pad}><Text style={t9}>{vehiculo.uso || "—"}</Text></View>
        </View>
        <View style={[bR, { flex: 14 }]}>
          <Title style={bB}>TIPO</Title>
          <View style={pad}><Text style={t9}>{vehiculo.tipo || "—"}</Text></View>
        </View>
        <View style={{ flex: 12 }}>
          <Title style={bB}>COD. AMIS</Title>
          <View style={pad}><Text style={t9}>{vehiculo.codAMIS || "—"}</Text></View>
        </View>
      </View>

    </View>
  );
}
