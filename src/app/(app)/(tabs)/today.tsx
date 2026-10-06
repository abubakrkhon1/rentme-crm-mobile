import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/ui/Screen";
import { ErrorView, ScreenSkeleton } from "@/components/ui/StateView";
import { useToday } from "@/features/dashboard/useToday";
import { prefetchBookingScreen } from "@/features/bookings/useBooking";
import { useMobileSession } from "@/features/workspace/useMobileSession";
import type { BookingSummary } from "@/lib/api/types";
import { colors } from "@/theme/colors";

type IconName = keyof typeof Ionicons.glyphMap;

export default function TodayScreen() {
  const session = useMobileSession();
  const today = useToday();

  if (today.isLoading) return <ScreenSkeleton variant="dashboard" />;
  if (today.isError) return <ErrorView message={today.error.message} onRetry={() => void today.refetch()} />;
  const data = today.data;
  if (!data) return <ErrorView message="Today’s summary was empty." onRetry={() => void today.refetch()} />;

  const identity = session.data?.user.fullName ?? session.data?.user.email;

  return (
    <Screen header={<View style={styles.header}><View><Text style={styles.workspace}>{session.data?.activeWorkspace.name ?? "RentMe Suite"}</Text><Text style={styles.pageTitle}>Today</Text></View><View style={styles.headerActions}><Pressable style={styles.iconButton}><Ionicons name="notifications-outline" size={21} color={colors.ink} />{data.unreadConversationCount > 0 ? <View style={styles.notificationDot} /> : null}</Pressable><View style={styles.avatar}><Text style={styles.avatarText}>{initials(identity)}</Text></View></View></View>}>
      <View style={styles.hero}>
        <View style={styles.heroGlow} />
        <Text style={styles.heroEyebrow}>{formatDay(data.date)}</Text>
        <Text style={styles.heroTitle}>Good {getDayPart()}, {firstName(identity)}.</Text>
        <Text style={styles.heroCopy}>{data.pickups.length + data.returns.length === 0 ? "Your schedule is clear today." : `${data.pickups.length} pickup${data.pickups.length === 1 ? "" : "s"} and ${data.returns.length} return${data.returns.length === 1 ? "" : "s"} scheduled.`}</Text>
        <View style={styles.heroCounts}><HeroCount value={data.pickups.length} label="Pickups" /><View style={styles.heroDivider} /><HeroCount value={data.returns.length} label="Returns" /><View style={styles.heroDivider} /><HeroCount value={data.pendingCount} label="Pending" /></View>
      </View>

      {data.overdue.length > 0 ? <Pressable style={styles.attention} onPress={() => router.push("/(app)/(tabs)/bookings")}><View style={styles.attentionIcon}><Ionicons name="alert-circle" size={21} color={colors.danger} /></View><View style={styles.attentionCopy}><Text style={styles.attentionTitle}>Needs attention</Text><Text style={styles.attentionText}>{data.overdue.length} overdue rental{data.overdue.length === 1 ? "" : "s"}</Text></View><Ionicons name="chevron-forward" size={19} color={colors.danger} /></Pressable> : null}

      <View style={styles.quickSection}><SectionHeading title="Quick actions" /><View style={styles.quickRow}><QuickAction icon="add" label="New booking" onPress={() => router.push("/(app)/(tabs)/bookings")} /><QuickAction icon="people-outline" label="Customers" onPress={() => router.push("/(app)/(tabs)/customers")} /><QuickAction icon="chatbubble-outline" label="Message" onPress={() => router.push("/(app)/(tabs)/inbox")} /><QuickAction icon="search-outline" label="Find rental" onPress={() => router.push("/(app)/(tabs)/bookings")} /></View></View>

      <ScheduleSection title="Pickups" items={data.pickups} accent={colors.brand} empty="No pickups scheduled." />
      <ScheduleSection title="Returns" items={data.returns} accent={colors.info} empty="No returns scheduled." />
    </Screen>
  );
}

function HeroCount({ value, label }: { value: number; label: string }) { return <View style={styles.heroCount}><Text style={styles.heroCountValue}>{value}</Text><Text style={styles.heroCountLabel}>{label}</Text></View>; }
function SectionHeading({ title, count }: { title: string; count?: number }) { return <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{title}</Text>{typeof count === "number" ? <Text style={styles.sectionCount}>{count}</Text> : null}</View>; }
function QuickAction({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}><View style={styles.quickIcon}><Ionicons name={icon} size={21} color={colors.brandDark} /></View><Text style={styles.quickLabel}>{label}</Text></Pressable>; }

function ScheduleSection({ title, items, accent, empty }: { title: string; items: BookingSummary[]; accent: string; empty: string }) {
  return <View style={styles.scheduleSection}><SectionHeading title={title} count={items.length} /><View style={styles.scheduleCard}>{items.length ? items.map((booking, index) => <ScheduleRow key={booking.id} booking={booking} accent={accent} last={index === items.length - 1} />) : <Text style={styles.empty}>{empty}</Text>}</View></View>;
}

function ScheduleRow({ booking, accent, last }: { booking: BookingSummary; accent: string; last: boolean }) {
  return <Pressable onPressIn={() => void prefetchBookingScreen(booking.id)} onPress={() => router.push(`/bookings/${booking.id}`)} style={({ pressed }) => [styles.scheduleRow, !last && styles.scheduleBorder, pressed && styles.pressed]}><View style={[styles.timelineMark, { backgroundColor: accent }]} /><View style={styles.scheduleMain}><Text style={styles.scheduleName}>{booking.customerName}</Text><Text style={styles.scheduleVehicle} numberOfLines={1}>{booking.vehicleName}</Text></View><View style={styles.scheduleMeta}><Text style={[styles.status, { color: accent }]}>{booking.status}</Text><Text style={styles.date}>{shortDate(booking.pickupAt)}</Text></View><Ionicons name="chevron-forward" size={17} color={colors.subtle} /></Pressable>;
}

function formatDay(value: string) { const date = new Date(`${value.slice(0, 10)}T12:00:00`); return Number.isNaN(date.valueOf()) ? "TODAY" : date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).toUpperCase(); }
function shortDate(value: string) { const date = new Date(`${value.slice(0, 10)}T12:00:00`); return Number.isNaN(date.valueOf()) ? value : date.toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
function getDayPart() { const hour = new Date().getHours(); return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"; }
function firstName(value?: string | null) { return value?.split(/[ @]/)[0] || "there"; }
function initials(value?: string | null) { const parts = value?.split(/[ @]/).filter(Boolean) ?? []; return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "RM"; }

const styles = StyleSheet.create({
  header: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 10, backgroundColor: colors.background, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, workspace: { color: colors.brandDark, fontSize: 11, fontWeight: "900", letterSpacing: 0.7, textTransform: "uppercase" }, pageTitle: { color: colors.ink, fontSize: 30, lineHeight: 35, fontWeight: "900", letterSpacing: -0.8 }, headerActions: { flexDirection: "row", alignItems: "center", gap: 10 }, iconButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }, notificationDot: { position: "absolute", right: 9, top: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.danger, borderWidth: 1.5, borderColor: colors.surface }, avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" }, avatarText: { color: colors.brandDark, fontWeight: "900", fontSize: 12 },
  hero: { minHeight: 206, backgroundColor: colors.brand, borderRadius: 24, padding: 20, overflow: "hidden", justifyContent: "space-between" }, heroGlow: { position: "absolute", width: 190, height: 190, borderRadius: 95, backgroundColor: "rgba(255,255,255,0.09)", right: -55, top: -75 }, heroEyebrow: { color: "rgba(255,255,255,0.72)", fontSize: 10, fontWeight: "900", letterSpacing: 1.1 }, heroTitle: { color: "#FFFFFF", fontSize: 24, lineHeight: 29, fontWeight: "900", letterSpacing: -0.6, marginTop: 8 }, heroCopy: { color: "rgba(255,255,255,0.82)", fontSize: 13, lineHeight: 19, marginTop: 5 }, heroCounts: { flexDirection: "row", alignItems: "center", marginTop: 18, paddingTop: 15, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.35)" }, heroCount: { flex: 1, alignItems: "center", gap: 2 }, heroCountValue: { color: "#FFFFFF", fontSize: 21, fontWeight: "900" }, heroCountLabel: { color: "rgba(255,255,255,0.72)", fontSize: 10, fontWeight: "700" }, heroDivider: { width: StyleSheet.hairlineWidth, height: 29, backgroundColor: "rgba(255,255,255,0.35)" },
  attention: { minHeight: 68, borderRadius: 17, backgroundColor: colors.dangerSoft, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 11 }, attentionIcon: { width: 39, height: 39, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.65)", alignItems: "center", justifyContent: "center" }, attentionCopy: { flex: 1, gap: 2 }, attentionTitle: { color: colors.danger, fontWeight: "900", fontSize: 14 }, attentionText: { color: "#9C2A20", fontSize: 12 },
  quickSection: { gap: 12 }, quickRow: { flexDirection: "row", justifyContent: "space-between" }, quickAction: { width: "23%", alignItems: "center", gap: 7 }, quickIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" }, quickLabel: { color: colors.muted, fontSize: 10, lineHeight: 13, fontWeight: "700", textAlign: "center" },
  sectionHeading: { flexDirection: "row", alignItems: "center", gap: 7 }, sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: "900", letterSpacing: -0.3 }, sectionCount: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.brandSoft, color: colors.brandDark, textAlign: "center", lineHeight: 22, fontSize: 11, fontWeight: "900" }, scheduleSection: { gap: 10 }, scheduleCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, overflow: "hidden" }, scheduleRow: { minHeight: 76, flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 13 }, scheduleBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }, timelineMark: { width: 4, height: 40, borderRadius: 2 }, scheduleMain: { flex: 1, gap: 3 }, scheduleName: { color: colors.ink, fontSize: 14, fontWeight: "800" }, scheduleVehicle: { color: colors.muted, fontSize: 12 }, scheduleMeta: { alignItems: "flex-end", gap: 3 }, status: { fontSize: 10, fontWeight: "900", textTransform: "capitalize" }, date: { color: colors.subtle, fontSize: 10, fontWeight: "600" }, empty: { color: colors.muted, padding: 18, textAlign: "center", fontSize: 13 }, pressed: { opacity: 0.65 },
});
