import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import type { CustomerSummary } from "@/lib/api/types";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

/** A list row. Wrap rows in <Group> so hairlines separate them. */
export function CustomerCard({ customer, onPress }: { customer: CustomerSummary; onPress: () => void }) {
  const owing = customer.balance > 0;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Avatar name={customer.name} size={40} />
      <View style={styles.main}>
        <Text style={styles.name} numberOfLines={1}>{customer.name}</Text>
        <Text style={styles.contact} numberOfLines={1}>{customer.phone ?? customer.email ?? "No contact details"}</Text>
      </View>
      <Text style={[styles.amount, owing ? styles.owing : styles.clear]}>{owing ? money(customer.balance) : "Clear"}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.subtle} />
    </Pressable>
  );
}

function money(value: number) { return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value); }

const styles = StyleSheet.create({
  row: { minHeight: 68, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface },
  main: { flex: 1, gap: 2 },
  name: { color: colors.ink, fontFamily: fonts.bold, fontSize: 16 },
  contact: { color: colors.muted, fontSize: 13, fontFamily: fonts.book },
  amount: { fontSize: 14, fontFamily: fonts.bold },
  owing: { color: colors.danger },
  clear: { color: colors.muted, fontFamily: fonts.medium },
  pressed: { backgroundColor: colors.background },
});
