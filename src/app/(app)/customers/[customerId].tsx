import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActionSheetIOS, ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { BookingCard } from "@/components/bookings/BookingCard";
import { Avatar } from "@/components/ui/Avatar";
import { Group, GroupLabel } from "@/components/ui/Group";
import { NavBar } from "@/components/ui/NavBar";
import { Screen } from "@/components/ui/Screen";
import { ErrorView, ScreenSkeleton } from "@/components/ui/StateView";
import { prefetchBookingScreen } from "@/features/bookings/useBooking";
import { CustomerLedgerModal } from "@/features/customers/CustomerLedgerModal";
import { useCustomer, useCustomerDocuments, useCustomerOverview, useCustomerTransactions, type LedgerAction } from "@/features/customers/useCustomer";
import type { BalanceSummary, BookingTransaction, CustomerDetail, CustomerDocumentSummary } from "@/lib/api/types";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

type CustomerSection = "overview" | "bookings" | "transactions" | "documents" | "notes";

export default function CustomerDetailScreen() {
  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const [tab, setTab] = useState<CustomerSection>("overview");
  const [ledgerAction, setLedgerAction] = useState<LedgerAction | null>(null);
  const customer = useCustomer(customerId);
  const overview = useCustomerOverview(customerId, tab === "overview");
  const transactions = useCustomerTransactions(customerId, tab === "transactions");
  const documents = useCustomerDocuments(customerId, tab === "documents");
  if (customer.isLoading) return <ScreenSkeleton variant="list" />;
  if (customer.isError) return <ErrorView message={customer.error.message} onRetry={() => void customer.refetch()} />;
  const data = customer.data;
  if (!data) return <ErrorView message="Customer details were empty." />;
  const contact = data;

  function showContactMenu() {
    const actions = [
      { label: "Call", disabled: !contact.phone, run: () => contact.phone && void Linking.openURL(`tel:${contact.phone}`) },
      { label: "Message", disabled: !contact.phone, run: () => contact.phone && void Linking.openURL(`sms:${contact.phone}`) },
      { label: "Email", disabled: !contact.email, run: () => contact.email && void Linking.openURL(`mailto:${contact.email}`) },
    ];
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions({
        title: contact.name,
        message: "Choose how to contact this customer",
        options: [...actions.map((action) => action.label), "Cancel"],
        cancelButtonIndex: actions.length,
        disabledButtonIndices: actions.flatMap((action, index) => action.disabled ? [index] : []),
        userInterfaceStyle: "light",
      }, (index) => actions[index]?.run());
      return;
    }
    Alert.alert(contact.name, "Choose how to contact this customer", [
      ...actions.filter((action) => !action.disabled).map((action) => ({ text: action.label, onPress: action.run })),
      { text: "Cancel", style: "cancel" },
    ]);
  }

  return <Screen>
    <NavBar backLabel="Customers" right={<Pressable onPress={showContactMenu} hitSlop={8} style={({ pressed }) => [s.contactButton, pressed && s.pressed]}><Ionicons name="call-outline" size={16} color={colors.brand} /><Text style={s.contactText}>Contact</Text></Pressable>} />
    <ProfileHero data={data} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsScroll} contentContainerStyle={s.tabs}>{(["overview", "bookings", "transactions", "documents", "notes"] as const).map((item) => <Pressable key={item} onPress={() => setTab(item)} style={[s.tab, tab === item && s.activeTab]}><Text style={[s.tabText, tab === item && s.activeTabText]}>{capitalize(item)}</Text></Pressable>)}</ScrollView>
    {tab === "overview" ? overview.isLoading ? <Loading text="Loading customer overview…" /> : overview.isError ? <ErrorView message={overview.error.message} onRetry={() => void overview.refetch()} /> : overview.data ? <Overview customer={data} balance={overview.data.balanceSummary} transactions={overview.data.transactions} onAction={setLedgerAction} /> : null : null}
    {tab === "bookings" ? <Bookings customer={data} /> : null}
    {tab === "transactions" ? transactions.isLoading ? <Loading text="Loading transactions…" /> : transactions.isError ? <ErrorView message={transactions.error.message} onRetry={() => void transactions.refetch()} /> : <TransactionSection items={transactions.data?.transactions ?? []} title={`Transactions · ${transactions.data?.transactions.length ?? 0}`} /> : null}
    {tab === "documents" ? documents.isLoading ? <Loading text="Loading documents…" /> : documents.isError ? <ErrorView message={documents.error.message} onRetry={() => void documents.refetch()} /> : <Documents items={documents.data?.documents ?? []} /> : null}
    {tab === "notes" ? <Section title="Notes"><Empty icon="document-text-outline" text="No customer notes yet." /></Section> : null}
    {overview.data ? <CustomerLedgerModal visible={ledgerAction !== null} action={ledgerAction} customerId={data.id} bookings={data.recentBookings} balance={overview.data.balanceSummary} onClose={() => setLedgerAction(null)} /> : null}
  </Screen>;
}

function ProfileHero({ data }: { data: CustomerDetail }) { return <View style={s.hero}><Avatar name={data.name} size={64} /><Text style={s.heroTitle}>{data.name}</Text><Text style={s.heroContact}>{data.email ?? data.phone ?? "No contact details"}</Text><View style={s.heroStats}><HeroStat value={`${data.recentBookings.length}`} label="Bookings" /><Divider /><HeroStat value={data.over21 ? "Verified" : "Unverified"} label="Age" /><Divider /><HeroStat value={memberSince(data.createdAt)} label="Member since" /></View></View>; }

function Overview({ customer, balance, transactions, onAction }: { customer: CustomerDetail; balance: BalanceSummary; transactions: BookingTransaction[]; onAction: (action: LedgerAction) => void }) {
  const amount = balance.customerCredit > 0 ? balance.customerCredit : balance.rentalBalanceOwed;
  const status = balance.customerCredit > 0 ? "Customer credit" : balance.rentalBalanceOwed > 0 ? "Amount owed" : "Paid in full";
  return <>
    <View style={s.section}><GroupLabel>Details</GroupLabel><Group inset={16}><Quick label="Member since" value={memberSince(customer.createdAt)} /><Quick label="License no." value={customer.driverLicense ?? "N/A"} /><Quick label="Phone" value={customer.phone ?? "N/A"} /><Quick label="Age verified" value={customer.over21 ? "Yes" : "No"} /></Group></View>
    <View style={s.section}>
      <GroupLabel>Rental balance</GroupLabel>
      <View style={s.financialCard}><Text style={[s.balanceValue, balance.customerCredit > 0 ? { color: colors.success } : balance.rentalBalanceOwed > 0 ? { color: colors.danger } : null]}>{money(amount)}</Text><Text style={s.balanceStatus}>{status}</Text><View style={s.buttonStack}>{balance.rentalBalanceOwed > 0 ? <LedgerButton text="Record Payment" primary onPress={() => onAction("payment")} /> : null}<LedgerButton text="Add Charge" onPress={() => onAction("charge")} /></View></View>
    </View>
    <View style={s.section}>
      <GroupLabel>Security deposit</GroupLabel>
      <View style={s.financialCard}><Summary label="Required" value={balance.requiredDeposit} /><Summary label="Collected" value={balance.collectedDeposit} /><Summary label="Applied" value={balance.appliedDeposit} /><Summary label="Refunded" value={balance.refundedDeposit} /><View style={s.rule} /><Summary label="Refundable" value={balance.refundableBalance} accent /><Text style={s.depositStatus}>{balance.depositStatus}</Text><View style={s.buttonStack}><LedgerButton text="Collect Deposit" primary onPress={() => onAction("collect_deposit")} /><LedgerButton text="Edit Required Deposit" onPress={() => onAction("edit_required_deposit")} /><LedgerButton text="Refund Deposit" disabled={balance.refundableBalance <= 0} onPress={() => onAction("refund_deposit")} /><LedgerButton text="Apply to Balance" disabled={balance.refundableBalance <= 0 || balance.rentalBalanceOwed <= 0} onPress={() => onAction("apply_deposit")} /></View></View>
    </View>
    <TransactionSection items={transactions} title="Recent transactions" />
  </>;
}

function Bookings({ customer }: { customer: CustomerDetail }) { return <Section title={`Bookings · ${customer.recentBookings.length}`}>{customer.recentBookings.length ? <Group inset={16}>{customer.recentBookings.map((booking) => <BookingCard key={booking.id} booking={booking} onPressIn={() => void prefetchBookingScreen(booking.id)} onPress={() => router.push(`/bookings/${booking.id}`)} />)}</Group> : <Empty icon="calendar-outline" text="No bookings found for this customer." />}</Section>; }
function TransactionSection({ items, title }: { items: BookingTransaction[]; title: string }) { return <Section title={title}>{items.length ? <Group inset={62}>{items.map((item, index) => <Transaction key={item.id} item={item} last={index === items.length - 1} />)}</Group> : <Empty icon="receipt-outline" text="No transactions for this customer." />}</Section>; }
function Transaction({ item, last }: { item: BookingTransaction; last: boolean }) { const payment = item.type?.toLowerCase() === "payment"; return <View style={s.row}><View style={[s.rowIcon, payment && s.paymentIcon]}><Ionicons name={payment ? "arrow-down-outline" : "arrow-up-outline"} size={17} color={payment ? colors.success : colors.danger} /></View><View style={s.rowCopy}><Text style={s.rowTitle} numberOfLines={1}>{item.title || item.category?.replaceAll("_", " ") || "Transaction"}</Text><Text style={s.rowMeta}>{date(item.transaction_date)} · {(item.method || item.type || "transaction").replaceAll("_", " ")}</Text></View><Text style={[s.amount, payment && s.payment]}>{payment ? "−" : "+"}{money(Math.abs(item.amount))}</Text></View>; }
function Documents({ items }: { items: CustomerDocumentSummary[] }) { return <Section title={`Documents · ${items.length}`}>{items.length ? <Group inset={64}>{items.map((item) => <Pressable key={item.id} disabled={!item.url} onPress={() => item.url && void Linking.openURL(item.url)} style={[s.row, !item.url && s.disabled]}><View style={s.documentIcon}><Ionicons name={item.mimeType === "application/pdf" ? "document-text-outline" : "image-outline"} size={20} color={colors.brand} /></View><View style={s.rowCopy}><Text style={s.rowTitle} numberOfLines={1}>{item.fileName}</Text><Text style={s.rowMeta}>{item.type.replaceAll("_", " ")} · {fileSize(item.fileSize)}</Text></View><Ionicons name="open-outline" size={18} color={colors.subtle} /></Pressable>)}</Group> : <Empty icon="folder-open-outline" text="No documents for this customer." />}</Section>; }

function HeroStat({ value, label }: { value: string; label: string }) { return <View style={s.heroStat}><Text style={s.heroValue} numberOfLines={1}>{value}</Text><Text style={s.heroLabel}>{label}</Text></View>; }
function Divider() { return <View style={s.heroDivider} />; }
function Quick({ label, value }: { label: string; value: string }) { return <View style={s.quick}><Text style={s.quickLabel}>{label}</Text><Text style={s.quickValue} numberOfLines={2}>{value}</Text></View>; }
function Summary({ label, value, accent }: { label: string; value: number; accent?: boolean }) { return <View style={s.summary}><Text style={s.summaryLabel}>{label}</Text><Text style={[s.summaryValue, accent && s.summaryAccent]}>{money(value)}</Text></View>; }
function LedgerButton({ text, primary, disabled, onPress }: { text: string; primary?: boolean; disabled?: boolean; onPress: () => void }) { return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [s.ledger, primary && s.ledgerPrimary, disabled && s.disabled, pressed && !disabled && s.pressed]}><Text style={[s.ledgerText, primary && s.ledgerPrimaryText]}>{text}</Text></Pressable>; }
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <View style={s.section}><GroupLabel>{title}</GroupLabel>{children}</View>; }
function Empty({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) { return <View style={s.empty}><Ionicons name={icon} size={26} color={colors.subtle} /><Text style={s.emptyText}>{text}</Text></View>; }
function Loading({ text }: { text: string }) { return <View style={s.loading}><ActivityIndicator color={colors.brand} /><Text style={s.emptyText}>{text}</Text></View>; }
function money(v: number) { return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(v); }
function memberSince(v: string) { const d = new Date(v); return Number.isNaN(d.valueOf()) ? "—" : d.toLocaleDateString(undefined, { month: "short", year: "numeric" }); }
function date(v: string) { const d = new Date(`${v.slice(0, 10)}T12:00:00`); return Number.isNaN(d.valueOf()) ? v : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
function capitalize(v: string) { return v[0].toUpperCase() + v.slice(1); }
function fileSize(v: number) { return v >= 1048576 ? `${(v / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(v / 1024))} KB`; }

const s = StyleSheet.create({
  hero: { backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderRadius: 16, padding: 18, alignItems: "center" },
  heroTitle: { color: colors.ink, fontSize: 24, fontFamily: fonts.bold, marginTop: 10, letterSpacing: -0.3 },
  heroContact: { color: colors.muted, fontSize: 14, marginTop: 2 },
  heroStats: { width: "100%", flexDirection: "row", alignItems: "center", marginTop: 16, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  heroStat: { flex: 1, alignItems: "center", gap: 2 },
  heroValue: { color: colors.ink, fontSize: 15, fontFamily: fonts.bold, maxWidth: "95%" },
  heroLabel: { color: colors.muted, fontSize: 12, fontFamily: fonts.medium },
  heroDivider: { width: StyleSheet.hairlineWidth, height: 28, backgroundColor: colors.border },
  disabled: { opacity: 0.4 }, pressed: { opacity: 0.6 },
  contactButton: { height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: colors.brandSoft, flexDirection: "row", alignItems: "center", gap: 5 },
  contactText: { color: colors.brand, fontFamily: fonts.bold, fontSize: 14 },
  tabsScroll: { flexGrow: 0 },
  tabs: { gap: 8 },
  tab: { height: 36, paddingHorizontal: 15, borderRadius: 18, backgroundColor: colors.fill, alignItems: "center", justifyContent: "center" },
  activeTab: { backgroundColor: colors.brand },
  tabText: { color: colors.neutralText, fontSize: 14, fontFamily: fonts.medium },
  activeTabText: { color: "#fff", fontFamily: fonts.bold },
  quick: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  quickLabel: { color: colors.ink, fontSize: 16, fontFamily: fonts.medium },
  quickValue: { flexShrink: 1, color: colors.muted, fontSize: 15, textAlign: "right" },
  financialCard: { backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderRadius: 16, padding: 16, gap: 10 },
  balanceValue: { color: colors.ink, fontSize: 32, fontFamily: fonts.bold, letterSpacing: -0.5 },
  balanceStatus: { color: colors.muted, fontSize: 14, fontFamily: fonts.medium },
  summary: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { color: colors.muted, fontSize: 15 },
  summaryValue: { color: colors.ink, fontSize: 15, fontFamily: fonts.medium },
  summaryAccent: { color: colors.ink, fontSize: 17, fontFamily: fonts.bold },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  depositStatus: { alignSelf: "flex-start", color: colors.neutralText, backgroundColor: colors.neutralSoft, borderRadius: 8, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 4, fontSize: 12, fontFamily: fonts.bold, textTransform: "capitalize" },
  buttonStack: { gap: 8, marginTop: 6 },
  ledger: { minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  ledgerPrimary: { backgroundColor: colors.brand, borderColor: colors.brand },
  ledgerText: { color: colors.brand, fontSize: 16, fontFamily: fonts.bold },
  ledgerPrimaryText: { color: "#fff" },
  section: { gap: 6 },
  row: { minHeight: 62, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  rowIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.dangerSoft, alignItems: "center", justifyContent: "center" },
  paymentIcon: { backgroundColor: colors.successSoft },
  documentIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" },
  rowCopy: { flex: 1, gap: 2 },
  rowTitle: { color: colors.ink, fontSize: 16, fontFamily: fonts.medium, textTransform: "capitalize" },
  rowMeta: { color: colors.muted, fontSize: 13, textTransform: "capitalize" },
  amount: { color: colors.danger, fontSize: 15, fontFamily: fonts.bold },
  payment: { color: colors.success },
  empty: { padding: 28, alignItems: "center", gap: 8, backgroundColor: colors.surface, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  emptyText: { color: colors.muted, fontSize: 14, fontFamily: fonts.medium },
  loading: { minHeight: 180, alignItems: "center", justifyContent: "center", gap: 10 },
});
