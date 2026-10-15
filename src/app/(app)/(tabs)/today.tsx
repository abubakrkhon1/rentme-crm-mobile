import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Group } from "@/components/ui/Group";
import { LargeTitle } from "@/components/ui/LargeTitle";
import { Screen } from "@/components/ui/Screen";
import { ErrorView, ScreenSkeleton } from "@/components/ui/StateView";
import { StatusPill } from "@/components/ui/StatusPill";
import { useToday } from "@/features/dashboard/useToday";
import { prefetchBookingScreen } from "@/features/bookings/useBooking";
import { useMobileSession, useSelectWorkspace } from "@/features/workspace/useMobileSession";
import type { BookingSummary } from "@/lib/api/types";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

type IconName = keyof typeof Ionicons.glyphMap;
type Entry = { booking: BookingSummary; kind: "pickup" | "return"; at: string };

export default function TodayScreen() {
  const session = useMobileSession();
  const today = useToday();
  const selectWorkspace = useSelectWorkspace();
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);

  if (today.isLoading) return <ScreenSkeleton variant="dashboard" />;
  if (today.isError) return <ErrorView message={today.error.message} onRetry={() => void today.refetch()} />;
  const data = today.data;
  if (!data) return <ErrorView message="Today’s summary was empty." onRetry={() => void today.refetch()} />;

  const identity = session.data?.user.fullName ?? session.data?.user.email ?? "";
  const entries: Entry[] = [
    ...data.pickups.map((booking) => ({ booking, kind: "pickup" as const, at: booking.pickupAt })),
    ...data.returns.map((booking) => ({ booking, kind: "return" as const, at: booking.returnAt })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <Screen>
      <View style={styles.topRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Select workspace" accessibilityState={{ expanded: workspaceMenuOpen }} onPress={() => setWorkspaceMenuOpen(true)} style={({ pressed }) => [styles.workspace, pressed && styles.workspacePressed]}>
          <View style={styles.workspaceMark}><Text style={styles.workspaceMarkText}>{(session.data?.activeWorkspace.name ?? "R").slice(0, 1).toUpperCase()}</Text></View>
          <Text style={styles.workspaceName} numberOfLines={1}>{session.data?.activeWorkspace.name ?? "RentMe Suite"}</Text>
          <Ionicons name="chevron-down" size={15} color={colors.muted} />
        </Pressable>
        <View style={styles.topActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Notifications" hitSlop={6} style={styles.bell}>
            <Ionicons name="notifications-outline" size={23} color={colors.ink} />
            {data.unreadConversationCount > 0 ? <View style={styles.bellDot} /> : null}
          </Pressable>
          <Avatar name={identity} size={36} />
        </View>
      </View>

      <LargeTitle title="Today" subtitle={formatDay(data.date)} />

      <View style={styles.summary}>
        <Stat value={data.pickups.length} label="Pickups" tone={colors.brand} />
        <View style={styles.statDivider} />
        <Stat value={data.returns.length} label="Returns" tone={colors.ink} />
        <View style={styles.statDivider} />
        <Stat value={data.pendingCount} label="Pending" tone={colors.warning} />
      </View>

      {data.overdue.length > 0 ? (
        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.attention, pressed && styles.pressed]} onPress={() => router.push({ pathname: "/(app)/(tabs)/bookings", params: { filter: "attention" } })}>
          <Ionicons name="alert-circle-outline" size={23} color={colors.danger} />
          <View style={styles.attentionCopy}>
            <Text style={styles.attentionTitle}>{data.overdue.length} overdue rental{data.overdue.length === 1 ? "" : "s"}</Text>
            <Text style={styles.attentionText} numberOfLines={1}>{data.overdue[0]?.customerName}{data.overdue.length > 1 ? ` and ${data.overdue.length - 1} more` : ""}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.subtle} />
        </Pressable>
      ) : null}

      <View style={styles.quickRow}>
        <QuickAction primary icon="add" label="Booking" onPress={() => router.push("/bookings/new")} />
        <QuickAction icon="search-outline" label="Find" onPress={() => router.push("/(app)/(tabs)/bookings")} />
        <QuickAction icon="people-outline" label="Customers" onPress={() => router.push("/(app)/(tabs)/customers")} />
        <QuickAction icon="chatbubble-outline" label="Message" onPress={() => router.push("/(app)/(tabs)/inbox")} />
      </View>

      <Text style={styles.sectionTitle}>Up next</Text>
      {entries.length ? (
        <Group inset={16} style={styles.fullWidth}>
          {entries.map((entry) => <ScheduleRow key={`${entry.kind}-${entry.booking.id}`} entry={entry} />)}
        </Group>
      ) : (
        <View style={styles.emptyCard}><Text style={styles.emptyText}>Nothing scheduled today.</Text></View>
      )}

      <Modal visible={workspaceMenuOpen} transparent animationType="fade" onRequestClose={() => setWorkspaceMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setWorkspaceMenuOpen(false)}>
          <Pressable accessibilityRole="menu" style={styles.workspaceMenu} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.menuTitle}>Switch workspace</Text>
            {(session.data?.workspaces ?? []).map((workspace) => {
              const active = workspace.id === session.data?.activeWorkspace.id;
              return <Pressable key={workspace.id} accessibilityRole="menuitem" accessibilityState={{ selected: active }} onPress={() => { setWorkspaceMenuOpen(false); void selectWorkspace(workspace.id); }} style={({ pressed }) => [styles.workspaceOption, pressed && styles.optionPressed]}>
                <View style={[styles.optionMark, active && styles.optionMarkActive]}><Text style={[styles.optionMarkText, active && styles.optionMarkTextActive]}>{workspace.name.slice(0, 1).toUpperCase()}</Text></View>
                <View style={styles.optionCopy}><Text style={styles.optionName} numberOfLines={1}>{workspace.name}</Text><Text style={styles.optionRole}>{workspace.role}</Text></View>
                {active ? <Ionicons name="checkmark-circle" size={21} color={colors.brand} /> : null}
              </Pressable>;
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

function Stat({ value, label, tone }: { value: number; label: string; tone: string }) {
  return <View style={styles.stat}><Text style={[styles.statValue, { color: tone }]}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function QuickAction({ icon, label, onPress, primary }: { icon: IconName; label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.quickAction, primary && styles.quickPrimary, pressed && styles.pressed]}>
      <Ionicons name={icon} size={22} color={primary ? "#FFFFFF" : colors.brand} />
      <Text style={[styles.quickLabel, primary && styles.quickLabelPrimary]}>{label}</Text>
    </Pressable>
  );
}

function ScheduleRow({ entry }: { entry: Entry }) {
  const { booking, kind, at } = entry;
  const time = clock(at);
  return (
    <Pressable accessibilityRole="button" onPressIn={() => void prefetchBookingScreen(booking.id)} onPress={() => router.push(`/bookings/${booking.id}`)} style={({ pressed }) => [styles.scheduleRow, pressed && styles.rowPressed]}>
      <View style={styles.timeCol}>
        {time ? <><Text style={styles.time}>{time.value}</Text><Text style={styles.meridiem}>{time.suffix}</Text></> : <Text style={styles.time}>{shortDate(at)}</Text>}
      </View>
      <View style={styles.scheduleMain}>
        <Text style={styles.scheduleName} numberOfLines={1}>{booking.customerName}</Text>
        <Text style={styles.scheduleVehicle} numberOfLines={1}>{booking.vehicleName}</Text>
      </View>
      <View style={styles.scheduleStatus}>
        <StatusPill label={kind === "pickup" ? "Pickup" : "Return"} tone={kind === "pickup" ? "brand" : "neutral"} />
      </View>
      <Ionicons name="chevron-forward" size={15} color={colors.subtle} />
    </Pressable>
  );
}

function formatDay(value: string) { const date = new Date(`${value.slice(0, 10)}T12:00:00`); return Number.isNaN(date.valueOf()) ? "Today" : date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }); }
function shortDate(value: string) { const date = new Date(`${value.slice(0, 10)}T12:00:00`); return Number.isNaN(date.valueOf()) ? value : date.toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
function clock(value: string) {
  if (value.length <= 10) return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return null;
  const parts = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }).split(" ");
  return { value: parts[0], suffix: parts[1] ?? "" };
}

const styles = StyleSheet.create({
  topRow: { width: "100%", minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  workspace: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1, paddingRight: 8, borderRadius: 12 },
  workspacePressed: { backgroundColor: colors.brandSoft },
  workspaceMark: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  workspaceMarkText: { color: "#FFFFFF", fontSize: 13, fontFamily: fonts.bold },
  workspaceName: { color: colors.ink, fontSize: 15, fontFamily: fonts.bold, flexShrink: 1 },
  topActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  bell: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  bellDot: { position: "absolute", right: 9, top: 8, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.danger, borderWidth: 2, borderColor: colors.background },

  fullWidth: { width: "100%", alignSelf: "stretch" },
  summary: { width: "100%", alignSelf: "stretch", flexDirection: "row", backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, paddingVertical: 14 },
  stat: { flex: 1, paddingHorizontal: 18, gap: 2 },
  statValue: { fontSize: 32, lineHeight: 36, fontFamily: fonts.bold, letterSpacing: -0.6 },
  statLabel: { color: colors.muted, fontSize: 13, fontFamily: fonts.medium },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.border },

  attention: { width: "100%", alignSelf: "stretch", minHeight: 64, borderRadius: 16, backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.dangerBorder, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  attentionCopy: { flex: 1, gap: 1 },
  attentionTitle: { color: colors.dangerText, fontSize: 15, fontFamily: fonts.bold },
  attentionText: { color: colors.muted, fontSize: 13, fontFamily: fonts.medium },

  quickRow: { width: "100%", alignSelf: "stretch", flexDirection: "row", gap: 10 },
  quickAction: { flex: 1, minWidth: 0, height: 76, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", gap: 6 },
  quickPrimary: { backgroundColor: colors.brand, borderColor: colors.brand },
  quickLabel: { color: colors.ink, fontSize: 12, fontFamily: fonts.bold },
  quickLabelPrimary: { color: "#FFFFFF" },

  sectionTitle: { width: "100%", color: colors.ink, fontSize: 20, fontFamily: fonts.extraBold, letterSpacing: -0.3, marginTop: 4 },
  scheduleRow: { minHeight: 72, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.surface },
  rowPressed: { backgroundColor: colors.background },
  timeCol: { width: 48 },
  time: { color: colors.ink, fontSize: 16, fontFamily: fonts.bold },
  meridiem: { color: colors.muted, fontSize: 12, fontFamily: fonts.medium },
  scheduleMain: { flex: 1, gap: 1 },
  scheduleName: { color: colors.ink, fontSize: 16, fontFamily: fonts.bold },
  scheduleVehicle: { color: colors.muted, fontSize: 14, fontFamily: fonts.book },
  scheduleStatus: { width: 68, alignSelf: "stretch", justifyContent: "center" },
  emptyCard: { width: "100%", alignSelf: "stretch", backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 24, alignItems: "center" },
  emptyText: { color: colors.muted, fontSize: 15, fontFamily: fonts.medium },
  menuBackdrop: { flex: 1, backgroundColor: "rgba(16, 24, 40, 0.22)", paddingHorizontal: 20, paddingTop: 68 },
  workspaceMenu: { width: "100%", maxWidth: 380, alignSelf: "flex-start", borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 22, elevation: 10 },
  menuTitle: { color: colors.muted, fontSize: 12, fontFamily: fonts.bold, textTransform: "uppercase", letterSpacing: 0.5, paddingHorizontal: 10, paddingVertical: 8 },
  workspaceOption: { minHeight: 58, borderRadius: 13, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 11 },
  optionPressed: { backgroundColor: colors.background },
  optionMark: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
  optionMarkActive: { backgroundColor: colors.brand },
  optionMarkText: { color: colors.brand, fontSize: 14, fontFamily: fonts.bold },
  optionMarkTextActive: { color: "#FFFFFF" },
  optionCopy: { flex: 1, minWidth: 0 },
  optionName: { color: colors.ink, fontSize: 15, fontFamily: fonts.bold },
  optionRole: { color: colors.muted, fontSize: 12, textTransform: "capitalize", marginTop: 1 },
  pressed: { opacity: 0.7 },
});
