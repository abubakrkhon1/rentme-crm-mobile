import type { ComponentProps } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { colors } from "@/theme/colors";

type Props = ComponentProps<typeof Pressable> & {
  label: string;
  loading?: boolean;
  variant?: "primary" | "secondary";
};

export function Button({ label, loading, variant = "primary", disabled, ...props }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#FFFFFF" : colors.brand} />
      ) : (
        <Text style={variant === "primary" ? styles.primaryText : styles.secondaryText}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  primary: { backgroundColor: colors.brand },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  primaryText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  secondaryText: { color: colors.brandDark, fontWeight: "700", fontSize: 16 },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.5 },
});
