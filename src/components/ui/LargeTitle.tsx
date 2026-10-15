import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

export function LargeTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.title} accessibilityRole="header">{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  copy: { flex: 1 },
  title: { color: colors.ink, fontSize: 34, lineHeight: 40, fontFamily: fonts.extraBold, letterSpacing: -0.8 },
  subtitle: { color: colors.muted, fontSize: 15, fontFamily: fonts.medium, marginTop: 2 },
});
