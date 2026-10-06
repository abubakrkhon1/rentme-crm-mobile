import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { BookingSummary } from "@/lib/api/types";
import { colors } from "@/theme/colors";

export function BookingCard({ booking, onPress, onPressIn }: { booking: BookingSummary; onPress?: () => void; onPressIn?: () => void }) {
  const status = statusStyle[booking.status];
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress} onPressIn={onPressIn}>
      <View style={styles.vehicleTile}>
        <Ionicons name="car-sport" size={25} color={colors.brandDark} />
      </View>
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>{booking.customerName}</Text>
          <View style={[styles.status, { backgroundColor: status.background }]}>
            <Text style={[styles.statusText, { color: status.foreground }]}>{status.label}</Text>
          </View>
        </View>
        <Text style={styles.vehicle} numberOfLines={1}>{booking.vehicleName}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={13} color={colors.subtle} />
          <Text style={styles.meta}>{formatDate(booking.pickupAt)} – {formatDate(booking.returnAt)}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.subtle} />
    </Pressable>
  );
}

function formatDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.valueOf())
    ? value
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const statusStyle = {
  pending: { label: "Pending", background: colors.warningSoft, foreground: colors.warning },
  confirmed: { label: "Confirmed", background: colors.brandSoft, foreground: colors.brandDark },
  active: { label: "Active", background: colors.brandSoft, foreground: colors.success },
  completed: { label: "Completed", background: "#F2F4F7", foreground: colors.muted },
  cancelled: { label: "Cancelled", background: colors.dangerSoft, foreground: colors.danger },
} as const;

const styles = StyleSheet.create({
  card: { minHeight: 88, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 18, padding: 12, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#101828", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  vehicleTile: { width: 62, height: 62, borderRadius: 14, backgroundColor: colors.brandPale, alignItems: "center", justifyContent: "center" },
  content: { flex: 1, gap: 4 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  name: { color: colors.ink, fontSize: 15, fontWeight: "800", flex: 1 },
  status: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 10, fontWeight: "800" },
  vehicle: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  meta: { color: colors.subtle, fontSize: 12, fontWeight: "600" },
  pressed: { opacity: 0.75 },
});
