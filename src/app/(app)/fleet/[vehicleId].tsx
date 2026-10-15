import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";

import { money, statusLabel, statusTone } from "@/components/fleet/VehicleCard";
import { Group, GroupLabel } from "@/components/ui/Group";
import { NavBar } from "@/components/ui/NavBar";
import { Screen } from "@/components/ui/Screen";
import { ErrorView, ScreenSkeleton } from "@/components/ui/StateView";
import { useVehicle } from "@/features/fleet/useVehicle";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

export default function VehicleDetailScreen() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const vehicle = useVehicle(vehicleId);
  if (vehicle.isLoading) return <ScreenSkeleton variant="list" />;
  if (vehicle.isError) return <ErrorView message={vehicle.error.message} onRetry={() => void vehicle.refetch()} />;
  const data = vehicle.data;
  if (!data) return <ErrorView message="Vehicle details were empty." />;
  const remoteImage = data.image?.startsWith("http") ? data.image : null;
  const tone = statusTone(data.status);
  return <Screen>
    <NavBar backLabel="Fleet" />
    <View style={styles.hero}>
      {remoteImage ? <Image source={{ uri: remoteImage }} style={styles.image} /> : <View style={styles.placeholder}><Ionicons name="car-sport" size={56} color={colors.subtle} /></View>}
      <View style={styles.heroText}>
        <View style={styles.heroTop}><Text style={styles.title} numberOfLines={2}>{data.name}</Text><View style={[styles.status, { backgroundColor: tone.background }]}><View style={[styles.dot, { backgroundColor: tone.text }]} /><Text style={[styles.statusText, { color: tone.text }]}>{statusLabel(data.status)}</Text></View></View>
        <Text style={styles.plate}>{data.plateNumber ?? "No plate assigned"}</Text>
      </View>
    </View>
    <View style={styles.rates}><Rate value={money(data.dailyRate)} label="Daily" /><View style={styles.divider} /><Rate value={money(data.weeklyRate)} label="Weekly" /><View style={styles.divider} /><Rate value={money(data.monthlyRate)} label="Monthly" /></View>
    <Section title="Vehicle information"><Info icon="shield-checkmark-outline" label="Security deposit" value={money(data.securityDeposit)} /><Info icon="people-outline" label="Ride share" value={data.rideShareEnabled ? "Enabled" : "Disabled"} /><Info icon="speedometer-outline" label="Odometer" value={data.odometer == null ? "Not reported" : `${data.odometer.toLocaleString()} mi`} /></Section>
    <Section title="GPS & telemetry"><Info icon="navigate-outline" label="GPS status" value={data.gpsStatus ?? "Not connected"} /><Info icon="flash-outline" label="Ignition" value={data.ignitionOn == null ? "Unknown" : data.ignitionOn ? "On" : "Off"} /><Info icon="speedometer-outline" label="Current speed" value={data.speedMph == null ? "Unknown" : `${data.speedMph} mph`} /><Info icon="time-outline" label="Last update" value={formatDate(data.lastGpsUpdate)} /></Section>
    {data.features.length > 0 && <View style={styles.section}><GroupLabel>Features</GroupLabel><View style={styles.featureWrap}>{data.features.map((feature) => <View key={feature} style={styles.feature}><Ionicons name="checkmark" size={14} color={colors.brand} /><Text style={styles.featureText}>{feature}</Text></View>)}</View></View>}
  </Screen>;
}
function Rate({ value, label }: { value: string; label: string }) { return <View style={styles.rate}><Text style={styles.rateValue}>{value}</Text><Text style={styles.rateLabel}>{label}</Text></View>; }
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <View style={styles.section}><GroupLabel>{title}</GroupLabel><Group inset={56}>{children}</Group></View>; }
function Info({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) { return <View style={styles.info}><View style={styles.infoIcon}><Ionicons name={icon} size={17} color={colors.brand} /></View><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue} numberOfLines={2}>{value}</Text></View>; }
function formatDate(value: string | null) { if (!value) return "Never"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
const styles = StyleSheet.create({
  hero: { backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderRadius: 16, overflow: "hidden" },
  image: { width: "100%", height: 180, backgroundColor: colors.neutralSoft },
  placeholder: { width: "100%", height: 150, backgroundColor: colors.neutralSoft, alignItems: "center", justifyContent: "center" },
  heroText: { padding: 16, gap: 4 },
  heroTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  title: { flex: 1, color: colors.ink, fontSize: 22, fontFamily: fonts.bold },
  plate: { color: colors.muted, fontSize: 14, fontFamily: fonts.medium },
  status: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontFamily: fonts.bold },
  rates: { minHeight: 72, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderRadius: 16, flexDirection: "row", alignItems: "center" },
  rate: { flex: 1, alignItems: "center", gap: 2 },
  rateValue: { color: colors.ink, fontSize: 18, fontFamily: fonts.bold },
  rateLabel: { color: colors.muted, fontSize: 12, fontFamily: fonts.medium },
  divider: { width: StyleSheet.hairlineWidth, height: 30, backgroundColor: colors.border },
  section: { gap: 6 },
  info: { minHeight: 52, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  infoIcon: { width: 28, height: 28, borderRadius: 7, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
  infoLabel: { flex: 1, color: colors.ink, fontSize: 16, fontFamily: fonts.medium },
  infoValue: { color: colors.muted, fontSize: 15, maxWidth: "46%", textAlign: "right" },
  featureWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  feature: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  featureText: { color: colors.ink, fontSize: 13, fontFamily: fonts.medium },
});
