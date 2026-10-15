import { Children, Fragment, type PropsWithChildren } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

/** Section label above a grouped card (iOS "inset grouped" style). */
export function GroupLabel({ children }: PropsWithChildren) {
  return <Text style={styles.label}>{children}</Text>;
}

/** White rounded container; children are separated by inset hairlines. */
export function Group({ children, inset = 16, style }: PropsWithChildren<{ inset?: number; style?: StyleProp<ViewStyle> }>) {
  const items = Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.card, style]}>
      {items.map((child, index) => (
        <Fragment key={index}>
          {child}
          {index < items.length - 1 ? <View style={[styles.separator, { marginLeft: inset }]} /> : null}
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.muted, fontSize: 13, fontFamily: fonts.bold, letterSpacing: 0.4, textTransform: "uppercase", paddingHorizontal: 4, marginBottom: 6 },
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
