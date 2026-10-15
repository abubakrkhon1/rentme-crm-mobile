import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Group, GroupLabel } from "@/components/ui/Group";
import { LargeTitle } from "@/components/ui/LargeTitle";
import { NavBar } from "@/components/ui/NavBar";
import { Screen } from "@/components/ui/Screen";
import { SearchField } from "@/components/ui/SearchField";
import { Segmented } from "@/components/ui/Segmented";
import { ErrorView, ScreenSkeleton } from "@/components/ui/StateView";
import { money, TransactionCard } from "@/components/transactions/TransactionCard";
import { type TransactionFilter, useTransactions } from "@/features/transactions/useTransactions";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const filters: { label: string; value: TransactionFilter }[] = [{ label: "All", value: "all" }, { label: "Payments", value: "payment" }, { label: "Charges", value: "charge" }, { label: "Refunds", value: "refund" }];

export default function TransactionsScreen() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<TransactionFilter>("all");
  const transactions = useTransactions(useDebouncedValue(search), type);
  if (transactions.isLoading) return <ScreenSkeleton variant="list" />;
  if (transactions.isError) return <ErrorView message={transactions.error.message} onRetry={() => void transactions.refetch()} />;
  const items = transactions.data?.items ?? [];
  const stats = transactions.data?.stats ?? { revenue: 0, depositsHeld: 0, outstanding: 0, refunded: 0 };
  return <Screen>
    <NavBar backLabel="More" />
    <LargeTitle title="Transactions" />
    <View style={styles.summary}>
      <Text style={styles.summaryLabel}>Revenue from completed payments</Text>
      <Text style={styles.summaryValue}>{money(stats.revenue)}</Text>
      <View style={styles.stats}><Stat value={money(stats.outstanding)} label="Outstanding" tone={stats.outstanding > 0 ? "danger" : undefined} /><View style={styles.divider} /><Stat value={money(stats.depositsHeld)} label="Deposits held" /><View style={styles.divider} /><Stat value={money(stats.refunded)} label="Refunded" /></View>
    </View>
    <SearchField value={search} onChangeText={setSearch} placeholder="Search transactions" />
    <Segmented options={filters} value={type} onChange={setType} />
    <View style={styles.section}>
      <GroupLabel>Activity · {items.length}</GroupLabel>
      {items.length ? <Group inset={16}>{items.map((item) => <TransactionCard key={item.id} transaction={item} />)}</Group> : <View style={styles.empty}><Ionicons name="receipt-outline" size={28} color={colors.subtle} /><Text style={styles.emptyTitle}>No transactions found</Text><Text style={styles.emptyCopy}>Try another title or transaction type.</Text></View>}
    </View>
  </Screen>;
}
function Stat({ value, label, tone }: { value: string; label: string; tone?: "danger" }) { return <View style={styles.stat}><Text style={[styles.statValue, tone === "danger" && { color: colors.danger }]} numberOfLines={1}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
const styles = StyleSheet.create({
  summary: { backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderRadius: 16, padding: 16 },
  summaryLabel: { color: colors.muted, fontSize: 13, fontFamily: fonts.medium },
  summaryValue: { color: colors.ink, fontSize: 32, fontFamily: fonts.bold, marginTop: 2, letterSpacing: -0.5 },
  stats: { flexDirection: "row", alignItems: "center", marginTop: 14, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { color: colors.ink, fontSize: 15, fontFamily: fonts.bold, maxWidth: "96%" },
  statLabel: { color: colors.muted, fontSize: 11, fontFamily: fonts.medium },
  divider: { width: StyleSheet.hairlineWidth, height: 28, backgroundColor: colors.border },
  section: { gap: 6 },
  empty: { minHeight: 160, borderRadius: 16, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, alignItems: "center", justifyContent: "center", gap: 6 },
  emptyTitle: { color: colors.ink, fontFamily: fonts.bold, fontSize: 16 },
  emptyCopy: { color: colors.muted, fontSize: 13 },
});
