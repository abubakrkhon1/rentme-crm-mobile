import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import type { TransactionSummary } from "@/lib/api/types";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

/** A list row. Wrap rows in <Group> so hairlines separate them. */
export function TransactionCard({ transaction }: { transaction: TransactionSummary }) {
  const payment = transaction.type === "payment";
  const tone = payment ? colors.success : transaction.type === "refund" ? colors.muted : transaction.type === "charge" ? colors.danger : colors.brand;
  const toneSoft = payment ? colors.successSoft : transaction.type === "refund" ? colors.neutralSoft : transaction.type === "charge" ? colors.dangerSoft : colors.brandSoft;
  const icon: keyof typeof Ionicons.glyphMap = payment ? "arrow-down" : transaction.type === "refund" ? "return-down-back" : transaction.type === "charge" ? "arrow-up" : "swap-horizontal";
  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: toneSoft }]}><Ionicons name={icon} size={18} color={tone} /></View>
      <View style={styles.main}>
        <Text style={styles.title} numberOfLines={1}>{transaction.title}</Text>
        <Text style={styles.meta} numberOfLines={1}>{transaction.method} · {formatDate(transaction.transactionDate)}</Text>
      </View>
      <View style={styles.amountWrap}>
        <Text style={[styles.amount, { color: tone }]}>{payment ? "+" : transaction.type === "charge" ? "−" : ""}{money(Math.abs(transaction.amount))}</Text>
        <Text style={styles.type}>{transaction.category?.replaceAll("_", " ") ?? transaction.type}</Text>
      </View>
    </View>
  );
}
export function money(value: number) { return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value); }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }

const styles = StyleSheet.create({
  row: { minHeight: 68, backgroundColor: colors.surface, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  main: { flex: 1, gap: 2 },
  title: { color: colors.ink, fontFamily: fonts.bold, fontSize: 15 },
  meta: { color: colors.muted, fontSize: 13, fontFamily: fonts.book },
  amountWrap: { alignItems: "flex-end", gap: 2 },
  amount: { fontFamily: fonts.bold, fontSize: 15 },
  type: { color: colors.muted, fontSize: 12, fontFamily: fonts.medium, textTransform: "capitalize" },
});
