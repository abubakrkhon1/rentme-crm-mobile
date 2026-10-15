import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";

/** Bottom action bar that sits above the home indicator. Render as a sibling after <Screen>. */
export function StickyBar({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>{children}</View>;
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.tabBar, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.tabBorder, paddingHorizontal: 20, paddingTop: 12, gap: 8 },
});
