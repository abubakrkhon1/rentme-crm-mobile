import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

export function Segmented<T extends string>({ options, value, onChange }: { options: readonly { value: T; label: string }[]; value: T; onChange: (value: T) => void }) {
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable key={option.value} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => onChange(option.value)} style={[styles.item, selected && styles.selected]}>
            <Text style={[styles.text, selected && styles.selectedText]} numberOfLines={1}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 36, borderRadius: 10, backgroundColor: colors.fill, padding: 2, flexDirection: "row" },
  item: { flex: 1, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  selected: { backgroundColor: colors.surface, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  text: { color: colors.neutralText, fontSize: 14, fontFamily: fonts.medium },
  selectedText: { color: colors.ink, fontFamily: fonts.bold },
});
