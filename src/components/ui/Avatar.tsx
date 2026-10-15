import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(/[ @]/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "RM";
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.text, { fontSize: Math.round(size * 0.35) }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { backgroundColor: "#E3E8F4", alignItems: "center", justifyContent: "center" },
  text: { color: colors.brand, fontFamily: fonts.bold },
});
