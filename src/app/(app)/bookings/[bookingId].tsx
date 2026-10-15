import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { Group, GroupLabel } from "@/components/ui/Group";
import { NavBar } from "@/components/ui/NavBar";
import { Screen } from "@/components/ui/Screen";
import { Segmented } from "@/components/ui/Segmented";
import { ErrorView, ScreenSkeleton } from "@/components/ui/StateView";
import { StatusPill, type PillTone } from "@/components/ui/StatusPill";
import { StickyBar } from "@/components/ui/StickyBar";
import { useBooking, useBookingDocuments, useBookingOverview } from "@/features/bookings/useBooking";
import type { BookingDetail, BookingOverview, BookingTransaction, CustomerDocumentSummary } from "@/lib/api/types";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

type Section = "overview" | "details" | "documents";
const SECTIONS = [{ value: "overview", label: "Overview" }, { value: "details", label: "Details" }, { value: "documents", label: "Documents" }] as const;

const statusTone: Record<string, PillTone> = { pending: "warning", confirmed: "brand", active: "success", completed: "neutral", cancelled: "danger" };

export default function BookingDetailScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const booking = useBooking(bookingId);
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const overview = useBookingOverview(bookingId, activeSection === "overview");
  const documents = useBookingDocuments(bookingId, activeSection === "documents");
  if (booking.isLoading) return <ScreenSkeleton variant="list" />;
  if (booking.isError) return <ErrorView message={booking.error.message} onRetry={() => void booking.refetch()} />;
  const data = booking.data;
  if (!data) return <ErrorView message="Booking details were empty." onRetry={() => void booking.refetch()} />;
  const customer = data.customer;
  const status = data.status.toLowerCase();
  const open = !["completed", "cancelled"].includes(status);
  const progress = rentalProgress(data.pickupAt, data.returnAt);

  const footer = open ? (
    <StickyBar>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]} onPress={() => router.push(`/bookings/${data.id}/extend`)}>
          <Text style={styles.secondaryActionText}>Extend</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]} onPress={() => router.push(`/bookings/${data.id}/finish`)}>
          <Text style={styles.primaryActionText}>Finish booking</Text>
        </Pressable>
      </View>
    </StickyBar>
  ) : null;

  return (
    <Screen footer={footer}>
      <NavBar backLabel="Bookings" right={<Ionicons name="ellipsis-horizontal" size={24} color={colors.brand} />} />

      <View style={styles.titleBlock}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{customer.name}</Text>
          <StatusPill label={capitalize(data.status)} tone={statusTone[status] ?? "neutral"} />
        </View>
        <Text style={styles.subtitle}>{data.vehicle.name}{data.vehicle.plateNumber ? ` · ${data.vehicle.plateNumber}` : ""} · #{data.id.slice(0, 8).toUpperCase()}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.progressTop}>
          <Text style={styles.progressTitle}>{progress ? `Day ${progress.day} of ${progress.total}` : `${data.rentalDays} day${data.rentalDays === 1 ? "" : "s"}`}</Text>
          <Text style={styles.progressMeta}>Returns {date(data.returnAt)}</Text>
        </View>
        {progress ? <View style={styles.track}><View style={[styles.fill, { width: `${Math.round(progress.ratio * 100)}%` }]} /></View> : null}
        <View style={styles.progressBottom}>
          <Text style={styles.progressMeta} numberOfLines={1}>{date(data.pickupAt)}{data.pickupLocation ? ` · ${data.pickupLocation}` : ""}</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <Stat value={money(data.totalCost)} label="Total" />
        <View style={styles.statDivider} />
        <Stat value={`${data.rentalDays}`} label="Days" />
        <View style={styles.statDivider} />
        <Stat value={money(data.deposit)} label="Deposit" />
      </View>

      <View style={styles.contactRow}>
        <ContactButton icon="call-outline" label="Call" disabled={!customer.phone} onPress={() => customer.phone && void Linking.openURL(`tel:${customer.phone}`)} />
        <ContactButton icon="chatbubble-outline" label="Text" disabled={!customer.phone} onPress={() => customer.phone && void Linking.openURL(`sms:${customer.phone}`)} />
        <ContactButton icon="mail-outline" label="Email" disabled={!customer.email} onPress={() => customer.email && void Linking.openURL(`mailto:${customer.email}`)} />
      </View>

      <Segmented options={SECTIONS} value={activeSection} onChange={setActiveSection} />

      {activeSection === "overview" ? overview.isLoading ? <TabLoading label="Loading overview…" /> : overview.isError ? <ErrorView message={overview.error.message} onRetry={() => void overview.refetch()} /> : overview.data ? <Overview booking={data} data={overview.data} /> : null : null}
      {activeSection === "details" ? <Details data={data} /> : null}
      {activeSection === "documents" ? documents.isLoading ? <TabLoading label="Loading documents…" /> : documents.isError ? <ErrorView message={documents.error.message} onRetry={() => void documents.refetch()} /> : <Documents documents={documents.data?.documents ?? []} /> : null}
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) { return <View style={styles.stat}><Text style={styles.statLabel}>{label}</Text><Text style={styles.statValue} numberOfLines={1}>{value}</Text></View>; }
function ContactButton({ icon, label, disabled, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; disabled?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.contact, disabled && styles.disabled, pressed && styles.pressed]}><Ionicons name={icon} size={18} color={colors.brand} /><Text style={styles.contactText}>{label}</Text></Pressable>;
}

function Overview({ booking, data }: { booking: BookingDetail; data: BookingOverview }) {
  return <>
    <View>
      <GroupLabel>Rental</GroupLabel>
      <Group>
        <InfoRow label="Vehicle" value={booking.vehicle.name} detail={booking.vehicle.plateNumber} />
        <InfoRow label="Pickup" value={date(booking.pickupAt)} detail={booking.pickupLocation} />
        <InfoRow label="Return" value={date(booking.returnAt)} detail={booking.returnLocation} />
        <InfoRow label="Rental length" value={`${booking.rentalDays} day${booking.rentalDays === 1 ? "" : "s"}`} />
        <InfoRow label="Booking total" value={money(booking.totalCost)} accent />
      </Group>
    </View>
    <View>
      <GroupLabel>Recent transactions · {data.transactions.length}</GroupLabel>
      {data.transactions.length ? <Group inset={62}>{data.transactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} />)}</Group> : <Group><EmptyState text="No transactions for this customer." /></Group>}
    </View>
  </>;
}

function Details({ data }: { data: BookingDetail }) {
  return <>
    <View>
      <GroupLabel>Rental schedule</GroupLabel>
      <Group>
        <InfoRow label="Pickup" value={date(data.pickupAt)} detail={data.pickupLocation} />
        <InfoRow label="Return" value={date(data.returnAt)} detail={data.returnLocation} />
      </Group>
    </View>
    <View>
      <GroupLabel>Customer</GroupLabel>
      <Group>
        <InfoRow label="Name" value={data.customer.name} />
        <InfoRow label="Phone" value={data.customer.phone ?? "Not provided"} />
        <InfoRow label="Email" value={data.customer.email ?? "Not provided"} />
        <InfoRow label="Driver license" value={data.customer.driverLicense ?? "Not provided"} />
      </Group>
    </View>
    <View>
      <GroupLabel>Financials</GroupLabel>
      <Group>
        <InfoRow label="Daily rate" value={money(data.dailyRate)} />
        <InfoRow label="Insurance" value={money(data.insuranceTotal)} detail={data.insuranceType} />
        <InfoRow label="Payment type" value={data.paymentType ?? "Not specified"} />
        <InfoRow label="Rental total" value={money(data.totalCost)} accent />
      </Group>
    </View>
    {data.specialRequests ? <View><GroupLabel>Special requests</GroupLabel><Group><Text style={styles.notes}>{data.specialRequests}</Text></Group></View> : null}
  </>;
}

function Documents({ documents }: { documents: CustomerDocumentSummary[] }) {
  return <View>
    <GroupLabel>Customer documents · {documents.length}</GroupLabel>
    {documents.length ? <Group inset={64}>{documents.map((document) => <Pressable accessibilityRole="button" key={document.id} disabled={!document.url} onPress={() => document.url && void Linking.openURL(document.url)} style={[styles.documentRow, !document.url && styles.unavailable]}>
      <View style={styles.documentIcon}><Ionicons name={document.mimeType === "application/pdf" ? "document-text-outline" : "image-outline"} size={20} color={colors.brand} /></View>
      <View style={styles.documentText}><Text style={styles.documentName} numberOfLines={1}>{document.fileName}</Text><Text style={styles.documentMeta}>{documentLabel(document.type)} · {fileSize(document.fileSize)}</Text></View>
      <Ionicons name="open-outline" size={18} color={colors.muted} />
    </Pressable>)}</Group> : <Group><EmptyState text="No documents for this customer." /></Group>}
  </View>;
}

function TabLoading({ label }: { label: string }) { return <View style={styles.tabLoading}><ActivityIndicator color={colors.brand} /><Text style={styles.emptyText}>{label}</Text></View>; }

function TransactionRow({ transaction }: { transaction: BookingTransaction }) {
  const type = (transaction.type ?? "transaction").toLowerCase();
  const positive = type === "payment";
  return <View style={styles.transactionRow}>
    <View style={[styles.transactionIcon, positive && styles.paymentIcon]}><Ionicons name={positive ? "arrow-down-outline" : "arrow-up-outline"} size={17} color={positive ? colors.success : colors.danger} /></View>
    <View style={styles.transactionText}><Text style={styles.transactionTitle} numberOfLines={1}>{transaction.title || transaction.category?.replaceAll("_", " ") || "Transaction"}</Text><Text style={styles.transactionMeta}>{date(transaction.transaction_date)} · {(transaction.method || type).replaceAll("_", " ")}</Text></View>
    <Text style={[styles.transactionAmount, positive && styles.paymentAmount]}>{positive ? "−" : "+"}{money(Math.abs(transaction.amount))}</Text>
  </View>;
}

function EmptyState({ text }: { text: string }) { return <View style={styles.emptyState}><Text style={styles.emptyText}>{text}</Text></View>; }
function InfoRow({ label, value, detail, accent }: { label: string; value: string; detail?: string | null; accent?: boolean }) {
  return <View style={styles.infoRow}><View style={styles.infoLabel}><Text style={styles.infoCaption}>{label}</Text>{detail ? <Text style={styles.infoDetail} numberOfLines={1}>{detail}</Text> : null}</View><Text style={[styles.infoValue, accent && styles.infoAccent]} numberOfLines={1}>{value}</Text></View>;
}

function money(value: number) { return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value); }
function parse(value: string) { const parsed = new Date(`${value.slice(0, 10)}T12:00:00`); return Number.isNaN(parsed.valueOf()) ? null : parsed; }
function date(value: string) { const parsed = parse(value); return parsed ? parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : value; }
function rentalProgress(start: string, end: string) {
  const from = parse(start); const to = parse(end);
  if (!from || !to) return null;
  const total = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000));
  const elapsed = Math.round((Date.now() - from.getTime()) / 86400000) + 1;
  if (elapsed < 1) return null;
  const day = Math.min(elapsed, total);
  return { day, total, ratio: Math.min(1, day / total) };
}
function capitalize(value: string) { return value ? value[0].toUpperCase() + value.slice(1) : value; }
function documentLabel(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function fileSize(bytes: number) { return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`; }

const styles = StyleSheet.create({
  titleBlock: { gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { flexShrink: 1, color: colors.ink, fontSize: 28, lineHeight: 34, fontFamily: fonts.extraBold, letterSpacing: -0.6 },
  subtitle: { color: colors.muted, fontSize: 15 },
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 },
  progressTop: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 8 },
  progressTitle: { color: colors.ink, fontSize: 15, fontFamily: fonts.bold },
  progressMeta: { color: colors.muted, fontSize: 13, fontFamily: fonts.medium },
  progressBottom: { flexDirection: "row" },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.neutralSoft, overflow: "hidden" },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.brand },
  stats: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  stat: { flex: 1, paddingHorizontal: 14, paddingVertical: 12 },
  statLabel: { color: colors.muted, fontSize: 12, fontFamily: fonts.medium },
  statValue: { color: colors.ink, fontSize: 18, fontFamily: fonts.bold, marginTop: 2 },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  contactRow: { flexDirection: "row", gap: 10 },
  contact: { flex: 1, height: 48, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  contactText: { color: colors.brand, fontSize: 14, fontFamily: fonts.bold },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
  actions: { flexDirection: "row", gap: 10 },
  secondaryAction: { width: 112, height: 52, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: "#CBD0D8", alignItems: "center", justifyContent: "center" },
  secondaryActionText: { color: colors.ink, fontSize: 16, fontFamily: fonts.bold },
  primaryAction: { flex: 1, height: 52, borderRadius: 14, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  primaryActionText: { color: "#FFFFFF", fontSize: 16, fontFamily: fonts.bold },
  infoRow: { minHeight: 52, paddingHorizontal: 16, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 12 },
  infoLabel: { flex: 1, gap: 1 },
  infoCaption: { color: colors.muted, fontSize: 15 },
  infoDetail: { color: colors.muted, fontSize: 12 },
  infoValue: { color: colors.ink, fontSize: 15, fontFamily: fonts.bold, maxWidth: "50%", textAlign: "right" },
  infoAccent: { fontSize: 17 },
  notes: { color: colors.muted, fontSize: 15, lineHeight: 22, padding: 16 },
  transactionRow: { minHeight: 64, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  transactionIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.dangerSoft, alignItems: "center", justifyContent: "center" },
  paymentIcon: { backgroundColor: colors.successSoft },
  transactionText: { flex: 1, gap: 2 },
  transactionTitle: { color: colors.ink, fontSize: 15, fontFamily: fonts.bold, textTransform: "capitalize" },
  transactionMeta: { color: colors.muted, fontSize: 13, textTransform: "capitalize" },
  transactionAmount: { color: colors.danger, fontSize: 15, fontFamily: fonts.bold },
  paymentAmount: { color: colors.success },
  documentRow: { minHeight: 64, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  documentIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
  documentText: { flex: 1, gap: 2 },
  documentName: { color: colors.ink, fontSize: 15, fontFamily: fonts.bold },
  documentMeta: { color: colors.muted, fontSize: 13, textTransform: "capitalize" },
  unavailable: { opacity: 0.45 },
  emptyState: { padding: 24, alignItems: "center" },
  emptyText: { color: colors.muted, fontSize: 14, fontFamily: fonts.medium },
  tabLoading: { minHeight: 160, alignItems: "center", justifyContent: "center", gap: 10 },
});
