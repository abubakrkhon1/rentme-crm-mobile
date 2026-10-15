import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { BookingCard } from "@/components/bookings/BookingCard";
import { Group, GroupLabel } from "@/components/ui/Group";
import { LargeTitle } from "@/components/ui/LargeTitle";
import { RoundButton } from "@/components/ui/RoundButton";
import { Screen } from "@/components/ui/Screen";
import { SearchField } from "@/components/ui/SearchField";
import { ErrorView, ScreenSkeleton } from "@/components/ui/StateView";
import { prefetchBookingScreen } from "@/features/bookings/useBooking";
import { useBookings } from "@/features/bookings/useBookings";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

const FILTERS = [
  { value: "all", label: "All", description: "Every booking in the workspace" },
  { value: "attention", label: "Needs attention", description: "Active rentals past their return date" },
  { value: "active", label: "Active", description: "Rentals currently in progress" },
  { value: "pending", label: "Pending", description: "Bookings awaiting action" },
  { value: "confirmed", label: "Confirmed", description: "Upcoming confirmed bookings" },
  { value: "completed", label: "Completed", description: "Finished rentals" },
  { value: "cancelled", label: "Cancelled", description: "Cancelled bookings" },
] as const;

type BookingFilter = (typeof FILTERS)[number]["value"];

export default function BookingsScreen() {
  const params = useLocalSearchParams<{ filter?: string }>();
  const [search, setSearch] = useState("");
  const filter = normalizeFilter(params.filter);
  const bookings = useBookings(useDebouncedValue(search), filter);

  if (bookings.isLoading) return <ScreenSkeleton variant="list" />;
  const items = bookings.data?.items ?? [];
  const selectedFilter = FILTERS.find((item) => item.value === filter) ?? FILTERS[0];

  return (
    <Screen>
      <LargeTitle title="Bookings" right={<RoundButton icon="add" label="New booking" onPress={() => router.push("/bookings/new")} />} />
      <SearchField value={search} onChangeText={setSearch} placeholder="Customer, vehicle or plate" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chips}>
        {FILTERS.map((option) => {
          const selected = option.value === filter;
          return (
            <Pressable key={option.value} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => router.setParams({ filter: option.value })} style={[styles.chip, selected && styles.chipSelected]}>
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View>
        <GroupLabel>{selectedFilter.label} · {items.length}</GroupLabel>
        {bookings.isError ? (
          <ErrorView message={bookings.error.message} onRetry={() => void bookings.refetch()} />
        ) : items.length ? (
          <Group>
            {items.map((booking) => <BookingCard key={booking.id} booking={booking} onPressIn={() => void prefetchBookingScreen(booking.id)} onPress={() => router.push(`/bookings/${booking.id}`)} />)}
          </Group>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={28} color={colors.muted} />
            <Text style={styles.emptyTitle}>No matching bookings</Text>
            <Text style={styles.emptyCopy}>{selectedFilter.description}. Try another filter or search term.</Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

function normalizeFilter(value?: string): BookingFilter { return FILTERS.some((filter) => filter.value === value) ? value as BookingFilter : "all"; }

const styles = StyleSheet.create({
  chipScroll: { marginHorizontal: -20, flexGrow: 0 },
  chips: { paddingHorizontal: 20, gap: 8 },
  chip: { height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  chipSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { color: colors.ink, fontSize: 14, fontFamily: fonts.medium },
  chipTextSelected: { color: "#FFFFFF", fontFamily: fonts.bold },
  empty: { minHeight: 180, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", gap: 6, padding: 24 },
  emptyTitle: { color: colors.ink, fontSize: 16, fontFamily: fonts.bold },
  emptyCopy: { color: colors.muted, fontSize: 14, textAlign: "center" },
});
