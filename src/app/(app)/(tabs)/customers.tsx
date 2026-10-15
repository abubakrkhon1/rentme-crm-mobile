import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { CustomerCard } from "@/components/customers/CustomerCard";
import { Group, GroupLabel } from "@/components/ui/Group";
import { LargeTitle } from "@/components/ui/LargeTitle";
import { RoundButton } from "@/components/ui/RoundButton";
import { Screen } from "@/components/ui/Screen";
import { SearchField } from "@/components/ui/SearchField";
import { ErrorView, ScreenSkeleton } from "@/components/ui/StateView";
import { useCustomers } from "@/features/customers/useCustomers";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

export default function CustomersScreen() {
  const [search, setSearch] = useState("");
  const customers = useCustomers(useDebouncedValue(search));
  if (customers.isLoading) return <ScreenSkeleton variant="list" />;
  if (customers.isError) return <ErrorView message={customers.error.message} onRetry={() => void customers.refetch()} />;
  const items = customers.data?.items ?? [];
  const owing = items.filter((customer) => customer.balance > 0);
  const balances = items.reduce((sum, customer) => sum + Math.max(customer.balance, 0), 0);

  return (
    <Screen>
      <LargeTitle title="Customers" right={<RoundButton icon="add" label="Add customer" />} />
      <SearchField value={search} onChangeText={setSearch} placeholder="Name, phone or email" />
      <View style={styles.stats}>
        <View style={styles.stat}><Text style={styles.statLabel}>Outstanding</Text><Text style={[styles.statValue, balances > 0 && styles.owing]}>{money(balances)}</Text></View>
        <View style={styles.stat}><Text style={styles.statLabel}>With balance</Text><Text style={styles.statValue}>{owing.length} of {items.length}</Text></View>
      </View>
      <View>
        <GroupLabel>Directory · {items.length}</GroupLabel>
        {items.length ? (
          <Group inset={66}>
            {items.map((customer) => <CustomerCard key={customer.id} customer={customer} onPress={() => router.push(`/customers/${customer.id}`)} />)}
          </Group>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={28} color={colors.muted} />
            <Text style={styles.emptyTitle}>No customers found</Text>
            <Text style={styles.emptyCopy}>Try a different name, email, or phone number.</Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

function money(value: number) { return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value); }

const styles = StyleSheet.create({
  stats: { flexDirection: "row", gap: 10 },
  stat: { flex: 1, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 10 },
  statLabel: { color: colors.muted, fontSize: 12, fontFamily: fonts.medium },
  statValue: { color: colors.ink, fontSize: 20, fontFamily: fonts.bold, marginTop: 1 },
  owing: { color: colors.danger },
  empty: { minHeight: 180, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", gap: 6, padding: 24 },
  emptyTitle: { color: colors.ink, fontSize: 16, fontFamily: fonts.bold },
  emptyCopy: { color: colors.muted, fontSize: 14, textAlign: "center" },
});
