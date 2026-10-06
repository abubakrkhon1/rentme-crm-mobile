import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import type { TransactionSummary } from "@/lib/api/types";
import { colors } from "@/theme/colors";

export function TransactionCard({ transaction }: { transaction: TransactionSummary }) {
  const payment = transaction.type === "payment";
  const tone = payment ? colors.success : transaction.type === "refund" ? "#7C3AED" : transaction.type === "charge" ? colors.danger : colors.brandDark;
  const icon: keyof typeof Ionicons.glyphMap = payment ? "arrow-down" : transaction.type === "refund" ? "return-down-back" : transaction.type === "charge" ? "arrow-up" : "swap-horizontal";
  return <View style={styles.card}><View style={[styles.icon, { backgroundColor: `${tone}16` }]}><Ionicons name={icon} size={19} color={tone} /></View><View style={styles.main}><Text style={styles.title} numberOfLines={1}>{transaction.title}</Text><Text style={styles.meta}>{transaction.method} · {formatDate(transaction.transactionDate)}</Text><Text style={styles.category} numberOfLines={1}>{transaction.category?.replaceAll("_", " ") ?? transaction.type}</Text></View><View style={styles.amountWrap}><Text style={[styles.amount, { color: tone }]}>{payment ? "+" : transaction.type === "charge" ? "−" : ""}{money(Math.abs(transaction.amount))}</Text><Text style={styles.type}>{transaction.type}</Text></View></View>;
}
export function money(value: number) { return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value); }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
const styles = StyleSheet.create({ card: { minHeight: 86, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 11 }, icon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" }, main: { flex: 1, gap: 3 }, title: { color: colors.ink, fontWeight: "900", fontSize: 13 }, meta: { color: colors.muted, fontSize: 10 }, category: { color: colors.subtle, fontSize: 9, textTransform: "capitalize" }, amountWrap: { alignItems: "flex-end", gap: 3 }, amount: { fontWeight: "900", fontSize: 13 }, type: { color: colors.subtle, fontSize: 9, fontWeight: "700", textTransform: "capitalize" } });
