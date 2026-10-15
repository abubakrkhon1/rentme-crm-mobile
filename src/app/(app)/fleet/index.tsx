import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { VehicleCard } from "@/components/fleet/VehicleCard";
import { GroupLabel } from "@/components/ui/Group";
import { LargeTitle } from "@/components/ui/LargeTitle";
import { NavBar } from "@/components/ui/NavBar";
import { Screen } from "@/components/ui/Screen";
import { SearchField } from "@/components/ui/SearchField";
import { Segmented } from "@/components/ui/Segmented";
import { ErrorView, ScreenSkeleton } from "@/components/ui/StateView";
import { type FleetFilter, useFleet } from "@/features/fleet/useFleet";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const filters: { label: string; value: FleetFilter }[] = [{ label: "All", value: "all" }, { label: "Available", value: "available" }, { label: "Rented", value: "rented" }, { label: "Service", value: "maintenance" }];

export default function FleetScreen() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<FleetFilter>("all");
  const fleet = useFleet(useDebouncedValue(search), status);
  if (fleet.isLoading) return <ScreenSkeleton variant="list" />;
  if (fleet.isError) return <ErrorView message={fleet.error.message} onRetry={() => void fleet.refetch()} />;
  const data = fleet.data;
  const items = data?.items ?? [];
  const stats = data?.stats ?? { total: 0, available: 0, rented: 0, maintenance: 0 };
  return <Screen>
    <NavBar backLabel="More" />
    <LargeTitle title="Fleet" subtitle={`${stats.total} vehicles`} />
    <View style={styles.stats}><Stat value={stats.available} label="Available" /><View style={styles.divider} /><Stat value={stats.rented} label="Rented" /><View style={styles.divider} /><Stat value={stats.maintenance} label="Service" /></View>
    <SearchField value={search} onChangeText={setSearch} placeholder="Search vehicles" />
    <Segmented options={filters} value={status} onChange={setStatus} />
    <View style={styles.section}>
      <GroupLabel>Vehicles · {items.length}</GroupLabel>
      <View style={styles.list}>{items.length ? items.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} onPress={() => router.push(`/fleet/${vehicle.id}`)} />) : <View style={styles.empty}><Ionicons name="car-sport-outline" size={28} color={colors.subtle} /><Text style={styles.emptyTitle}>No vehicles found</Text><Text style={styles.emptyCopy}>Try a different search or status.</Text></View>}</View>
    </View>
  </Screen>;
}
function Stat({ value, label }: { value: number; label: string }) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
const styles = StyleSheet.create({
  stats: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderRadius: 16, paddingVertical: 14 },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { color: colors.ink, fontSize: 22, fontFamily: fonts.bold },
  statLabel: { color: colors.muted, fontSize: 12, fontFamily: fonts.medium },
  divider: { width: StyleSheet.hairlineWidth, height: 32, backgroundColor: colors.border },
  section: { gap: 6 },
  list: { gap: 10 },
  empty: { minHeight: 160, borderRadius: 16, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, alignItems: "center", justifyContent: "center", gap: 6 },
  emptyTitle: { color: colors.ink, fontFamily: fonts.bold, fontSize: 16 },
  emptyCopy: { color: colors.muted, fontSize: 13 },
});
