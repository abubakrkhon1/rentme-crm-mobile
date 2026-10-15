import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar } from "@/components/ui/Avatar";
import { Group } from "@/components/ui/Group";
import { LargeTitle } from "@/components/ui/LargeTitle";
import { RoundButton } from "@/components/ui/RoundButton";
import { Screen } from "@/components/ui/Screen";
import { SearchField } from "@/components/ui/SearchField";
import { ErrorView, ScreenSkeleton } from "@/components/ui/StateView";
import { useCustomers } from "@/features/customers/useCustomers";
import { useConversations, useOpenConversation } from "@/features/messages/useMessages";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { CustomerSummary } from "@/lib/api/types";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

export default function InboxScreen() {
  const [search, setSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const conversations = useConversations(useDebouncedValue(search));
  const customers = useCustomers(useDebouncedValue(customerSearch));
  const openConversation = useOpenConversation();

  if (conversations.isLoading) return <ScreenSkeleton variant="list" />;
  if (conversations.isError) return <ErrorView message={conversations.error.message} onRetry={() => void conversations.refetch()} />;
  const items = conversations.data?.items ?? [];

  async function chooseCustomer(customerId: string) {
    try {
      const result = await openConversation.mutateAsync(customerId);
      setNewOpen(false);
      setCustomerSearch("");
      router.push(`/inbox/${result.conversationId}`);
    } catch {
      // Mutation error stays visible inside the sheet.
    }
  }

  return <>
    <Screen>
      <LargeTitle title="Messages" right={<RoundButton icon="create-outline" label="New message" onPress={() => setNewOpen(true)} />} />
      <SearchField value={search} onChangeText={setSearch} placeholder="Search conversations" />
      {items.length ? (
        <Group inset={78}>
          {items.map((item) => (
            <Pressable key={item.id} accessibilityRole="button" style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={() => router.push(`/inbox/${item.id}`)}>
              <View style={styles.dotSlot}>{item.unreadCount ? <View style={styles.unreadDot} /> : null}</View>
              <Avatar name={item.customerName} size={48} />
              <View style={styles.rowMain}>
                <View style={styles.rowTop}>
                  <Text style={[styles.name, item.unreadCount ? styles.nameUnread : null]} numberOfLines={1}>{item.customerName}</Text>
                  <Text style={[styles.time, item.unreadCount ? styles.timeUnread : null]}>{relativeTime(item.lastMessageAt)}</Text>
                </View>
                <Text style={styles.preview} numberOfLines={2}>{item.lastMessagePreview || "Start a conversation"}</Text>
                <Text style={styles.channels}>{availableChannels(item.appMessagingAvailable, Boolean(item.phone))}</Text>
              </View>
            </Pressable>
          ))}
        </Group>
      ) : (
        <View style={styles.empty}>
          <Ionicons name="chatbubble-ellipses-outline" size={30} color={colors.muted} />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptyCopy}>Tap the compose button to message a customer through SMS or the RentMe app.</Text>
        </View>
      )}
    </Screen>
    <NewConversationSheet visible={newOpen} search={customerSearch} onSearch={setCustomerSearch} customers={customers.data?.items ?? []} loading={customers.isLoading || customers.isFetching} loadError={customers.isError ? customers.error.message : null} opening={openConversation.isPending} openError={openConversation.isError ? openConversation.error.message : null} onRetry={() => void customers.refetch()} onChoose={(id) => void chooseCustomer(id)} onClose={() => { setNewOpen(false); setCustomerSearch(""); openConversation.reset(); }} />
  </>;
}

function NewConversationSheet({ visible, search, onSearch, customers, loading, loadError, opening, openError, onRetry, onChoose, onClose }: { visible: boolean; search: string; onSearch: (value: string) => void; customers: CustomerSummary[]; loading: boolean; loadError: string | null; opening: boolean; openError: string | null; onRetry: () => void; onChoose: (id: string) => void; onClose: () => void }) {
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Dismiss" />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.sheetHead}>
          <View style={styles.sheetHeadCopy}><Text style={styles.sheetTitle} numberOfLines={1}>New message</Text><Text style={styles.sheetHint} numberOfLines={2}>Choose a customer with an ongoing booking</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" style={styles.closeButton} onPress={onClose}><Ionicons name="close" size={20} color={colors.ink} /></Pressable>
        </View>
        <SearchField value={search} onChangeText={onSearch} placeholder="Find customers" autoFocus />
        {openError ? <View style={styles.errorBox}><Ionicons name="alert-circle-outline" size={17} color={colors.danger} /><Text style={styles.errorText}>{openError}</Text></View> : null}
        {loadError ? <Pressable style={styles.errorBox} onPress={onRetry}><Ionicons name="refresh" size={17} color={colors.danger} /><Text style={styles.errorText}>{loadError} Tap to retry.</Text></Pressable> : null}
        <View style={styles.customerListWrap}>
          {loading && !customers.length ? <View style={styles.sheetState}><ActivityIndicator color={colors.brand} /><Text style={styles.sheetStateText}>Finding customers…</Text></View> : <FlatList data={customers} keyExtractor={(item) => item.id} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={!customers.length ? styles.flatEmpty : undefined} ListEmptyComponent={<View style={styles.sheetState}><Ionicons name="people-outline" size={25} color={colors.muted} /><Text style={styles.sheetStateTitle}>No customers found</Text><Text style={styles.sheetStateText}>{search ? "Try another name, email, or phone number." : "Only customers with ongoing bookings are shown."}</Text></View>} renderItem={({ item }) => <CustomerRow customer={item} disabled={opening} onPress={() => onChoose(item.id)} />} />}
          {opening ? <View style={styles.openingOverlay}><ActivityIndicator color={colors.brand} /><Text style={styles.openingText}>Opening conversation…</Text></View> : null}
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

function CustomerRow({ customer, disabled, onPress }: { customer: CustomerSummary; disabled: boolean; onPress: () => void }) { return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.customerRow, (pressed || disabled) && styles.pressed]}><Avatar name={customer.name} size={40} /><View style={styles.customerCopy}><Text style={styles.customerName} numberOfLines={1} ellipsizeMode="tail">{customer.name}</Text><Text style={styles.customerDetail} numberOfLines={1} ellipsizeMode="tail">{customer.phone || customer.email || "RentMe app customer"}</Text></View><Ionicons name="chevron-forward" size={16} color={colors.subtle} /></Pressable>; }
function availableChannels(app: boolean, sms: boolean) { if (app && sms) return "SMS + RentMe app"; if (app) return "RentMe app"; if (sms) return "SMS"; return "No messaging channel"; }
function relativeTime(value: string) { const date = new Date(value); return date.toDateString() === new Date().toDateString() ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : date.toLocaleDateString([], { month: "short", day: "numeric" }); }

const styles = StyleSheet.create({
  row: { minHeight: 84, paddingVertical: 12, paddingRight: 16, paddingLeft: 6, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.surface },
  rowPressed: { backgroundColor: colors.background },
  dotSlot: { width: 14, alignItems: "center" },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brand },
  rowMain: { flex: 1, minWidth: 0, gap: 2, marginLeft: 4 },
  rowTop: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 8 },
  name: { flex: 1, minWidth: 0, color: colors.ink, fontSize: 16, fontFamily: fonts.medium },
  nameUnread: { fontFamily: fonts.extraBold },
  time: { flexShrink: 0, color: colors.muted, fontSize: 13, fontFamily: fonts.book },
  timeUnread: { color: colors.brand, fontFamily: fonts.medium },
  preview: { color: colors.muted, fontSize: 14, lineHeight: 19 },
  channels: { color: colors.muted, fontSize: 12, fontFamily: fonts.medium, marginTop: 1 },
  empty: { minHeight: 210, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", gap: 8, padding: 24 },
  emptyTitle: { color: colors.ink, fontFamily: fonts.bold, fontSize: 16 },
  emptyCopy: { color: colors.muted, fontSize: 14, textAlign: "center" },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(20,24,31,.4)" },
  sheet: { width: "100%", height: "78%", minHeight: 480, overflow: "hidden", backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 8, paddingBottom: Platform.OS === "ios" ? 28 : 18, gap: 12 },
  handle: { width: 36, height: 5, backgroundColor: colors.track, borderRadius: 3, alignSelf: "center", marginBottom: 4 },
  sheetHead: { width: "100%", flexDirection: "row", alignItems: "center", gap: 12 },
  sheetHeadCopy: { flex: 1, minWidth: 0 },
  sheetTitle: { color: colors.ink, fontSize: 22, fontFamily: fonts.extraBold },
  sheetHint: { color: colors.muted, fontSize: 14, lineHeight: 19, marginTop: 2 },
  closeButton: { width: 32, height: 32, flexShrink: 0, borderRadius: 16, backgroundColor: colors.fill, alignItems: "center", justifyContent: "center" },
  customerListWrap: { width: "100%", flex: 1, minHeight: 0, position: "relative", overflow: "hidden" },
  customerRow: { width: "100%", minHeight: 64, overflow: "hidden", flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  customerCopy: { flex: 1, minWidth: 0, justifyContent: "center", gap: 2 },
  customerName: { width: "100%", color: colors.ink, fontSize: 16, fontFamily: fonts.bold },
  customerDetail: { width: "100%", color: colors.muted, fontSize: 13 },
  flatEmpty: { flexGrow: 1 },
  sheetState: { flex: 1, minHeight: 180, alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 24 },
  sheetStateTitle: { color: colors.ink, fontSize: 15, fontFamily: fonts.bold },
  sheetStateText: { color: colors.muted, fontSize: 13, lineHeight: 18, textAlign: "center" },
  openingOverlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(255,255,255,.88)", alignItems: "center", justifyContent: "center", gap: 8 },
  openingText: { color: colors.brand, fontSize: 13, fontFamily: fonts.bold },
  errorBox: { width: "100%", flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, padding: 12, backgroundColor: colors.dangerSoft },
  errorText: { flex: 1, minWidth: 0, color: colors.danger, fontSize: 13, lineHeight: 18 },
  pressed: { opacity: 0.5 },
});
