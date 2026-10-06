import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { CustomerSummary } from "@/lib/api/types";
import { colors } from "@/theme/colors";

export function CustomerCard({ customer, onPress }: { customer: CustomerSummary; onPress: () => void }) {
  const owing = customer.balance > 0;
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}><View style={styles.avatar}><Text style={styles.initials}>{initials(customer.name)}</Text></View><View style={styles.main}><Text style={styles.name}>{customer.name}</Text><Text style={styles.contact} numberOfLines={1}>{customer.phone ?? customer.email ?? "No contact details"}</Text></View><View style={styles.balance}><Text style={[styles.amount, owing ? styles.owing : styles.clear]}>{money(customer.balance)}</Text><Text style={styles.balanceLabel}>{owing ? "Balance" : "Clear"}</Text></View><Ionicons name="chevron-forward" size={17} color={colors.subtle} /></Pressable>;
}

function initials(value: string) { return value.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "CU"; }
function money(value: number) { return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value); }
const styles = StyleSheet.create({ card: { minHeight: 78, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 11 }, avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" }, initials: { color: colors.brandDark, fontWeight: "900", fontSize: 12 }, main: { flex: 1, gap: 4 }, name: { color: colors.ink, fontWeight: "800", fontSize: 14 }, contact: { color: colors.muted, fontSize: 11 }, balance: { alignItems: "flex-end", gap: 2 }, amount: { fontSize: 12, fontWeight: "900" }, owing: { color: colors.danger }, clear: { color: colors.success }, balanceLabel: { color: colors.subtle, fontSize: 9, fontWeight: "700" }, pressed: { opacity: 0.65 } });
