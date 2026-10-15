import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

import { colors } from "@/theme/colors";

type IconName = keyof typeof Ionicons.glyphMap;

export function RoundButton({ icon, label, onPress, tone = "primary" }: { icon: IconName; label: string; onPress?: () => void; tone?: "primary" | "plain" }) {
  const primary = tone === "primary";
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={4} style={({ pressed }) => [styles.base, primary ? styles.primary : styles.plain, pressed && styles.pressed]}>
      <Ionicons name={icon} size={primary ? 22 : 23} color={primary ? "#FFFFFF" : colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  primary: { backgroundColor: colors.brand },
  plain: { backgroundColor: "transparent" },
  pressed: { opacity: 0.7 },
});
