import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

export function NavBar({ backLabel = "Back", title, subtitle, right, onBack }: { backLabel?: string; title?: string; subtitle?: string; right?: ReactNode; onBack?: () => void }) {
  return (
    <View style={styles.bar}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Back to ${backLabel}`} onPress={onBack ?? (() => router.back())} hitSlop={8} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
        <Ionicons name="chevron-back" size={26} color={colors.brand} />
        <Text style={styles.backText} numberOfLines={1}>{backLabel}</Text>
      </Pressable>
      <View style={styles.center}>
        {title ? <Text style={styles.title} numberOfLines={1}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { minHeight: 44, flexDirection: "row", alignItems: "center", marginHorizontal: -8 },
  back: { width: 96, height: 44, flexDirection: "row", alignItems: "center" },
  backText: { color: colors.brand, fontSize: 17, fontFamily: fonts.medium, flexShrink: 1 },
  center: { flex: 1, alignItems: "center" },
  title: { color: colors.ink, fontSize: 17, fontFamily: fonts.bold },
  subtitle: { color: colors.muted, fontSize: 12, fontFamily: fonts.medium },
  right: { width: 96, alignItems: "flex-end", justifyContent: "center" },
  pressed: { opacity: 0.6 },
});
