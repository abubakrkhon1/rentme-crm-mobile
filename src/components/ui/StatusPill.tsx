import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

export type PillTone = "success" | "warning" | "danger" | "brand" | "neutral";

const tones: Record<PillTone, { background: string; foreground: string }> = {
  success: { background: colors.successSoft, foreground: colors.success },
  warning: { background: colors.warningSoft, foreground: colors.warning },
  danger: { background: colors.dangerSoft, foreground: colors.danger },
  brand: { background: colors.brandSoft, foreground: colors.brand },
  neutral: { background: colors.neutralSoft, foreground: colors.neutralText },
};

export function StatusPill({ label, tone }: { label: string; tone: PillTone }) {
  const palette = tones[tone];
  return (
    <View style={[styles.pill, { backgroundColor: palette.background }]}>
      <Text style={[styles.text, { color: palette.foreground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  text: { fontSize: 12, fontFamily: fonts.bold },
});
