import { View, Text } from "@react-pdf/renderer";

export const CARD = {
  borderWidth: 0.75,
  borderColor: "#000000",
  borderStyle: "solid",
  borderRadius: 4,
  overflow: "hidden",
};

export const bB = {
  borderBottomWidth: 0.75,
  borderBottomColor: "#000000",
  borderBottomStyle: "solid",
};

export const bR = {
  borderRightWidth: 0.75,
  borderRightColor: "#000000",
  borderRightStyle: "solid",
};

export const TITLE_BG = "#CCCCCC";

export const pad = { paddingHorizontal: 5, paddingVertical: 3 };

export const tit = { fontSize: 6, fontFamily: "Helvetica", color: "#000000" };

export function Title({ children, style }) {
  return (
    <View style={[{ backgroundColor: TITLE_BG, paddingVertical: 1 }, style]}>
      <Text style={[tit, { textAlign: "center" }]}>{children}</Text>
    </View>
  );
}
