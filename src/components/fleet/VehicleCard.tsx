import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { VehicleSummary, VehicleStatus } from "@/lib/api/types";
import { colors } from "@/theme/colors";

export function VehicleCard({ vehicle, onPress }: { vehicle: VehicleSummary; onPress: () => void }) {
  const remoteImage = vehicle.image?.startsWith("http") ? vehicle.image : null;
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>{remoteImage ? <Image source={{ uri: remoteImage }} style={styles.image} /> : <View style={styles.placeholder}><Ionicons name="car-sport" size={31} color={colors.brandDark} /></View>}<View style={styles.main}><Text style={styles.name} numberOfLines={1}>{vehicle.name}</Text><Text style={styles.meta}>{vehicle.plateNumber ?? "No plate"}</Text><View style={[styles.status, { backgroundColor: statusTone(vehicle.status).background }]}><View style={[styles.dot, { backgroundColor: statusTone(vehicle.status).text }]} /><Text style={[styles.statusText, { color: statusTone(vehicle.status).text }]}>{statusLabel(vehicle.status)}</Text></View></View><View style={styles.rate}><Text style={styles.price}>{money(vehicle.dailyRate)}</Text><Text style={styles.per}>/day</Text></View><Ionicons name="chevron-forward" size={17} color={colors.subtle} /></Pressable>;
}

export function statusLabel(status: VehicleStatus) { return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
export function statusTone(status: VehicleStatus) {
  if (status === "available") return { background: colors.successSoft, text: colors.success };
  if (status === "rented") return { background: colors.brandSoft, text: colors.brand };
  if (status === "maintenance" || status === "out_of_order") return { background: colors.warningSoft, text: colors.warning };
  return { background: colors.neutralSoft, text: colors.neutralText };
}
export function money(value: number | null) { return value == null ? "—" : new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value); }

const styles = StyleSheet.create({ card: { minHeight: 108, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 12, flexDirection: "row", alignItems: "center", gap: 11 }, image: { width: 84, height: 72, borderRadius: 13, backgroundColor: colors.brandPale }, placeholder: { width: 84, height: 72, borderRadius: 13, backgroundColor: colors.brandPale, alignItems: "center", justifyContent: "center" }, main: { flex: 1, gap: 5 }, name: { color: colors.ink, fontFamily: "AirbnbCereal-Bold", fontSize: 16 }, meta: { color: colors.muted, fontSize: 13 }, status: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4 }, dot: { width: 5, height: 5, borderRadius: 3 }, statusText: { fontSize: 12, fontFamily: "AirbnbCereal-Bold" }, rate: { alignItems: "flex-end" }, price: { color: colors.ink, fontSize: 15, fontFamily: "AirbnbCereal-Bold" }, per: { color: colors.muted, fontSize: 12 }, pressed: { opacity: 0.7 } });
