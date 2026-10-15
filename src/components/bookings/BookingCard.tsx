import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { StatusPill, type PillTone } from "@/components/ui/StatusPill";
import type { BookingSummary } from "@/lib/api/types";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

/** A list row. Wrap rows in <Group> (or pass `last`) so hairlines separate them. */
export function BookingCard({ booking, onPress, onPressIn }: { booking: BookingSummary; onPress?: () => void; onPressIn?: () => void; last?: boolean }) {
  const status = statusStyle[booking.status];
  return (
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={onPress} onPressIn={onPressIn}>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{booking.customerName}</Text>
        <Text style={styles.vehicle} numberOfLines={1}>{booking.vehicleName}</Text>
        <Text style={styles.meta}>{formatDate(booking.pickupAt)} – {formatDate(booking.returnAt)}</Text>
      </View>
      <View style={styles.statusColumn}>
        <StatusPill label={status.label} tone={status.tone} />
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.subtle} />
    </Pressable>
  );
}

function formatDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.valueOf())
    ? value
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const statusStyle: Record<BookingSummary["status"], { label: string; tone: PillTone }> = {
  pending: { label: "Pending", tone: "warning" },
  confirmed: { label: "Confirmed", tone: "brand" },
  active: { label: "Active", tone: "success" },
  completed: { label: "Completed", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

const styles = StyleSheet.create({
  row: { minHeight: 80, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surface },
  content: { flex: 1, gap: 2 },
  statusColumn: { width: 82, alignSelf: "stretch", justifyContent: "center" },
  name: { color: colors.ink, fontSize: 16, fontFamily: fonts.bold },
  vehicle: { color: colors.muted, fontSize: 14, fontFamily: fonts.book },
  meta: { color: colors.muted, fontSize: 13, fontFamily: fonts.medium, marginTop: 1 },
  pressed: { backgroundColor: colors.background },
});
