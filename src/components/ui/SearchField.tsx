import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TextInput, View } from "react-native";

import { colors } from "@/theme/colors";

export function SearchField({ value, onChangeText, placeholder, autoFocus }: { value: string; onChangeText: (value: string) => void; placeholder: string; autoFocus?: boolean }) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="search" size={18} color={colors.muted} />
      <TextInput accessibilityLabel={placeholder} autoFocus={autoFocus} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} style={styles.input} clearButtonMode="while-editing" returnKeyType="search" autoCorrect={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 40, borderRadius: 12, backgroundColor: colors.fill, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  input: { flex: 1, minWidth: 0, color: colors.ink, fontSize: 16, paddingVertical: 0 },
});
