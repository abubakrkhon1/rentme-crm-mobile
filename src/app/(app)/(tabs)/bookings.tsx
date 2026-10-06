import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { BookingCard } from "@/components/bookings/BookingCard";
import { Screen } from "@/components/ui/Screen";
import { ErrorView, ScreenSkeleton } from "@/components/ui/StateView";
import { useBookings } from "@/features/bookings/useBookings";
import { prefetchBookingScreen } from "@/features/bookings/useBooking";
import { colors } from "@/theme/colors";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export default function BookingsScreen() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const bookings = useBookings(useDebouncedValue(search));
  const items = useMemo(() => bookings.data?.items.filter((booking) => filter === "all" || booking.status === filter) ?? [], [bookings.data?.items, filter]);
  if (bookings.isLoading) return <ScreenSkeleton variant="list" />;
  const allItems = bookings.data?.items ?? [];
  const activeCount = allItems.filter((booking) => booking.status === "active").length;
  const pendingCount = allItems.filter((booking) => booking.status === "pending").length;
  const content = bookings.isError ? (
    <ErrorView message={bookings.error.message} onRetry={() => void bookings.refetch()} />
  ) : items.length ? (
    items.map((booking) => (
      <BookingCard
        key={booking.id}
        booking={booking}
        onPressIn={() => void prefetchBookingScreen(booking.id)}
        onPress={() => router.push(`/bookings/${booking.id}`)}
      />
    ))
  ) : (
    <Text style={styles.empty}>No bookings found.</Text>
  );

  return <Screen><View style={styles.header}><View><Text style={styles.eyebrow}>RENTAL OPERATIONS</Text><Text style={styles.title}>Bookings</Text></View><Pressable style={styles.newButton}><Ionicons name="add" color="#fff" size={20} /><Text style={styles.newText}>New</Text></Pressable></View><View style={styles.hero}><View style={styles.heroGlow} /><Text style={styles.heroLabel}>RENTAL OVERVIEW</Text><Text style={styles.heroTitle}>{allItems.length} bookings</Text><Text style={styles.heroCopy}>Keep every reservation and handoff moving.</Text><View style={styles.heroStats}><HeroStat value={activeCount} label="Active" /><View style={styles.heroDivider} /><HeroStat value={pendingCount} label="Pending" /><View style={styles.heroDivider} /><HeroStat value={allItems.length - activeCount - pendingCount} label="Other" /></View></View><View style={styles.searchWrap}><Ionicons name="search" size={19} color={colors.subtle} /><TextInput value={search} onChangeText={setSearch} placeholder="Search bookings, customers…" placeholderTextColor={colors.subtle} style={styles.search} /></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{["all", "active", "pending", "confirmed", "completed"].map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item === "all" ? `All (${allItems.length})` : item[0].toUpperCase() + item.slice(1)}</Text></Pressable>)}</ScrollView><View style={styles.list}>{content}</View></Screen>;
}

function HeroStat({ value, label }: { value: number; label: string }) { return <View style={styles.heroStat}><Text style={styles.heroValue}>{value}</Text><Text style={styles.heroStatLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({ header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, eyebrow: { color: colors.brand, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 }, title: { fontSize: 30, lineHeight: 34, fontWeight: "900", color: colors.ink, letterSpacing: -0.7 }, newButton: { height: 40, paddingHorizontal: 14, borderRadius: 13, backgroundColor: colors.brand, flexDirection: "row", alignItems: "center", gap: 4 }, newText: { color: "#fff", fontWeight: "800" }, hero: { minHeight: 174, borderRadius: 24, padding: 19, backgroundColor: colors.brand, overflow: "hidden" }, heroGlow: { position: "absolute", width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(255,255,255,0.09)", top: -65, right: -38 }, heroLabel: { color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: "900", letterSpacing: 1.1 }, heroTitle: { color: "#fff", fontSize: 25, fontWeight: "900", marginTop: 6 }, heroCopy: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 }, heroStats: { flexDirection: "row", marginTop: 18, paddingTop: 13, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.35)" }, heroStat: { flex: 1, alignItems: "center", gap: 2 }, heroValue: { color: "#fff", fontSize: 18, fontWeight: "900" }, heroStatLabel: { color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: "700" }, heroDivider: { width: StyleSheet.hairlineWidth, height: 27, backgroundColor: "rgba(255,255,255,0.35)" }, searchWrap: { minHeight: 48, backgroundColor: "#EEF2F1", borderRadius: 15, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 9 }, search: { flex: 1, fontSize: 15, color: colors.ink }, filters: { gap: 8 }, filter: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, filterActive: { backgroundColor: colors.brand, borderColor: colors.brand }, filterText: { color: colors.muted, fontSize: 12, fontWeight: "700" }, filterTextActive: { color: "#fff" }, list: { gap: 10 }, empty: { color: colors.muted, textAlign: "center", padding: 30 } });
