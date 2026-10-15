import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useCustomerLedgerAction, type LedgerAction } from "@/features/customers/useCustomer";
import type { BalanceSummary, BookingSummary } from "@/lib/api/types";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

const METHODS = ["Cash", "Cash App", "Apple Cash", "Zelle", "Credit Card", "Debit Card", "Bank Transfer", "Check", "Other"];
const CATEGORIES = [
  ["rental_charge", "Rental charge"], ["extension_charge", "Extension charge"], ["insurance_charge", "Insurance charge"], ["late_fee", "Late fee"], ["admin_fee_tolls", "Toll admin fee"], ["red_light_ticket", "Red-light ticket"], ["sales_tax", "Sales tax"], ["damage_fee", "Damage fee"], ["cleaning_fee", "Cleaning fee"], ["toll_fee", "Toll fee"], ["fuel_fee", "Fuel fee"], ["mileage_fee", "Mileage fee"], ["delivery_fee", "Delivery fee"], ["other", "Other"],
] as const;

const COPY: Record<LedgerAction, { title: string; submit: string; icon: keyof typeof Ionicons.glyphMap }> = {
  payment: { title: "Record Payment", submit: "Record Payment", icon: "wallet-outline" },
  charge: { title: "Add Charge", submit: "Add Charge", icon: "add-circle-outline" },
  edit_required_deposit: { title: "Edit Required Deposit", submit: "Save Deposit", icon: "create-outline" },
  collect_deposit: { title: "Collect Security Deposit", submit: "Collect Deposit", icon: "shield-checkmark-outline" },
  refund_deposit: { title: "Refund Security Deposit", submit: "Issue Refund", icon: "return-down-back-outline" },
  apply_deposit: { title: "Apply Deposit to Balance", submit: "Apply Deposit", icon: "swap-horizontal-outline" },
};

export function CustomerLedgerModal({ visible, action, customerId, bookings, balance, onClose }: { visible: boolean; action: LedgerAction | null; customerId: string; bookings: BookingSummary[]; balance: BalanceSummary; onClose: () => void }) {
  if (!visible || !action) return null;
  return <LedgerFormModal action={action} customerId={customerId} bookings={bookings} balance={balance} onClose={onClose} />;
}

function LedgerFormModal({ action, customerId, bookings, balance, onClose }: { action: LedgerAction; customerId: string; bookings: BookingSummary[]; balance: BalanceSummary; onClose: () => void }) {
  const mutation = useCustomerLedgerAction(customerId);
  const [amount, setAmount] = useState(() => action === "refund_deposit" ? cents(balance.refundableBalance) : action === "collect_deposit" ? cents(balance.requiredRemaining > 0 ? balance.requiredRemaining : balance.requiredDeposit) : action === "edit_required_deposit" ? cents(balance.requiredDeposit) : action === "apply_deposit" ? cents(Math.min(balance.refundableBalance, balance.rentalBalanceOwed)) : "");
  const [title, setTitle] = useState("");
  const [method, setMethod] = useState("");
  const [category, setCategory] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date());
  const [picker, setPicker] = useState<"method" | "category" | "booking" | "date" | null>(null);

  const selectedAction = action;
  const config = COPY[selectedAction];
  const needsMethod = action === "payment" || action === "collect_deposit" || action === "refund_deposit";
  const max = action === "refund_deposit" ? balance.refundableBalance : action === "apply_deposit" ? Math.min(balance.refundableBalance, balance.rentalBalanceOwed) : undefined;
  const numericAmount = Number(amount);
  const valid = numericAmount > 0 && (!max || numericAmount <= max) && (!needsMethod || Boolean(method)) && (action !== "charge" || Boolean(title.trim() && category));

  async function submit() {
    if (!valid) return;
    try {
      await mutation.mutateAsync({ action: selectedAction, amount: numericAmount, title: title.trim() || undefined, category: category || undefined, method: method || undefined, bookingId: bookingId || null, notes: notes.trim() || undefined, transactionDate: date.toISOString() });
      onClose();
      Alert.alert("Saved", `${config.title} completed successfully.`);
    } catch (error) {
      Alert.alert("Could not save", error instanceof Error ? error.message : "Please try again.");
    }
  }

  return <Modal visible transparent animationType="slide" onRequestClose={onClose}>
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Pressable style={s.backdrop} onPress={onClose} />
      <View style={s.sheet}>
        <View style={s.handle} />
        <View style={s.toolbar}><Pressable disabled={mutation.isPending} onPress={onClose}><Text style={s.cancel}>Cancel</Text></Pressable><View style={s.heading}><Ionicons name={config.icon} size={18} color={colors.brand} /><Text style={s.sheetTitle}>{config.title}</Text></View><View style={s.toolbarSpacer} /></View>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
          <Field label="Amount" value={amount} onChange={setAmount} keyboard="decimal-pad" prefix="$" autoFocus />
          {max !== undefined ? <View style={s.info}><InfoRow label={action === "apply_deposit" ? "Refundable deposit" : "Available to refund"} value={money(balance.refundableBalance)} />{action === "apply_deposit" ? <><InfoRow label="Outstanding balance" value={money(balance.rentalBalanceOwed)} /><InfoRow label="Maximum allowed" value={money(max)} /></> : null}</View> : null}
          {action === "charge" ? <><Field label="Charge title" value={title} onChange={setTitle} placeholder="What is this charge for?" /><SelectField label="Category" value={labelFor(CATEGORIES, category)} placeholder="Choose category" onPress={() => setPicker("category")} /></> : null}
          {action !== "edit_required_deposit" ? <><SelectField label="Transaction date" value={date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })} onPress={() => setPicker("date")} />{bookings.length ? <SelectField label="Booking" value={bookings.find((item) => item.id === bookingId)?.vehicleName ?? (bookingId ? "Selected booking" : "None — unlinked")} onPress={() => setPicker("booking")} /> : <ReadOnly label="Booking" value="No bookings found — transaction will be unlinked" />}{needsMethod ? <SelectField label={action === "refund_deposit" ? "Refund method" : "Payment method"} value={method} placeholder="Choose method" onPress={() => setPicker("method")} /> : action === "apply_deposit" ? <ReadOnly label="Payment method" value="Security Deposit" /> : null}<Field label="Notes" value={notes} onChange={setNotes} placeholder="Optional details" multiline /></> : null}
          {mutation.isError ? <Text style={s.error}>{mutation.error.message}</Text> : null}
          <Pressable disabled={!valid || mutation.isPending} onPress={() => void submit()} style={[s.submit, (!valid || mutation.isPending) && s.disabled]}>{mutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>{config.submit}</Text>}</Pressable>
        </ScrollView>
      </View>
      <PickerSheet visible={picker === "method"} title="Payment method" value={method} options={METHODS.map((item) => ({ value: item, label: item }))} onChange={setMethod} onClose={() => setPicker(null)} />
      <PickerSheet visible={picker === "category"} title="Charge category" value={category} options={CATEGORIES.map(([value, label]) => ({ value, label }))} onChange={setCategory} onClose={() => setPicker(null)} />
      <PickerSheet visible={picker === "booking"} title="Booking" value={bookingId} options={[{ value: "", label: "None — unlinked" }, ...bookings.map((item) => ({ value: item.id, label: `${item.vehicleName} · ${new Date(item.pickupAt).toLocaleDateString()}` }))]} onChange={setBookingId} onClose={() => setPicker(null)} />
      <DateSheet visible={picker === "date"} value={date} onChange={setDate} onClose={() => setPicker(null)} />
    </KeyboardAvoidingView>
  </Modal>;
}

function Field({ label, value, onChange, placeholder, keyboard = "default", prefix, multiline, autoFocus }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; keyboard?: "default" | "decimal-pad"; prefix?: string; multiline?: boolean; autoFocus?: boolean }) { return <View style={s.field}><Text style={s.label}>{label}</Text><View style={[s.inputWrap, multiline && s.multilineWrap]}>{prefix ? <Text style={s.prefix}>{prefix}</Text> : null}<TextInput autoFocus={autoFocus} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.subtle} keyboardType={keyboard} multiline={multiline} style={[s.input, multiline && s.multiline]} /></View></View>; }
function SelectField({ label, value, placeholder, onPress }: { label: string; value: string; placeholder?: string; onPress: () => void }) { return <View style={s.field}><Text style={s.label}>{label}</Text><Pressable style={s.select} onPress={onPress}><Text numberOfLines={2} style={[s.selectText, !value && s.placeholder]}>{value || placeholder}</Text><Ionicons name="chevron-expand" size={18} color={colors.subtle} /></Pressable></View>; }
function ReadOnly({ label, value }: { label: string; value: string }) { return <View style={s.field}><Text style={s.label}>{label}</Text><View style={s.readOnly}><Text style={s.readOnlyText}>{value}</Text></View></View>; }
function InfoRow({ label, value }: { label: string; value: string }) { return <View style={s.infoRow}><Text style={s.infoLabel}>{label}</Text><Text style={s.infoValue}>{value}</Text></View>; }
function PickerSheet({ visible, title, value, options, onChange, onClose }: { visible: boolean; title: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void; onClose: () => void }) { return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><Pressable style={s.backdrop} onPress={onClose} /><View style={s.pickerSheet}><PickerToolbar title={title} onClose={onClose} /><Picker selectedValue={value} onValueChange={(next) => onChange(String(next))} itemStyle={s.pickerItem}>{options.map((item) => <Picker.Item key={item.value || "none"} value={item.value} label={item.label} />)}</Picker></View></Modal>; }
function DateSheet({ visible, value, onChange, onClose }: { visible: boolean; value: Date; onChange: (value: Date) => void; onClose: () => void }) { return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><Pressable style={s.backdrop} onPress={onClose} /><View style={s.pickerSheet}><PickerToolbar title="Transaction date" onClose={onClose} /><DateTimePicker value={value} mode="datetime" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={(_, next) => next && onChange(next)} themeVariant="light" accentColor={colors.brand} style={s.datePicker} /></View></Modal>; }
function PickerToolbar({ title, onClose }: { title: string; onClose: () => void }) { return <View style={s.pickerToolbar}><View style={s.toolbarSpacer} /><Text style={s.pickerTitle}>{title}</Text><Pressable onPress={onClose}><Text style={s.done}>Done</Text></Pressable></View>; }
function labelFor(items: readonly (readonly [string, string])[], value: string) { return items.find(([key]) => key === value)?.[1] ?? ""; }
function cents(value: number) { return value > 0 ? value.toFixed(2) : ""; }
function money(value: number) { return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(value); }

const s = StyleSheet.create({ root: { flex: 1, justifyContent: "flex-end" }, backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(10,14,22,.4)" }, sheet: { maxHeight: "92%", minHeight: "62%", backgroundColor: colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: "hidden" }, handle: { width: 38, height: 5, borderRadius: 3, backgroundColor: colors.track, alignSelf: "center", marginTop: 8 }, toolbar: { height: 55, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }, heading: { flexDirection: "row", alignItems: "center", gap: 7 }, sheetTitle: { color: colors.ink, fontSize: 17, fontFamily: fonts.bold }, cancel: { color: colors.brand, fontSize: 17 }, toolbarSpacer: { width: 56 }, content: { padding: 18, paddingBottom: 34, gap: 15 }, field: { gap: 6 }, label: { color: colors.muted, fontSize: 13, fontFamily: fonts.medium }, inputWrap: { minHeight: 49, borderRadius: 10, backgroundColor: colors.fill, paddingHorizontal: 13, flexDirection: "row", alignItems: "center" }, prefix: { color: colors.ink, fontSize: 17, fontFamily: fonts.bold, marginRight: 4 }, input: { flex: 1, minWidth: 0, color: colors.ink, fontSize: 15, paddingVertical: 12 }, multilineWrap: { minHeight: 92, alignItems: "flex-start" }, multiline: { minHeight: 82, textAlignVertical: "top" }, select: { minHeight: 50, borderRadius: 10, backgroundColor: colors.fill, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 8 }, selectText: { flex: 1, minWidth: 0, color: colors.ink, fontSize: 16 }, placeholder: { color: colors.subtle }, readOnly: { minHeight: 49, borderRadius: 13, backgroundColor: colors.neutralSoft, paddingHorizontal: 13, justifyContent: "center" }, readOnlyText: { color: colors.muted, fontSize: 15 }, info: { borderRadius: 12, backgroundColor: colors.brandSoft, padding: 13, gap: 7 }, infoRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 }, infoLabel: { flex: 1, color: colors.muted, fontSize: 14 }, infoValue: { color: colors.ink, fontSize: 14, fontFamily: fonts.bold }, error: { color: colors.danger, fontSize: 11, lineHeight: 16 }, submit: { minHeight: 52, borderRadius: 14, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" }, submitText: { color: "#fff", fontSize: 16, fontFamily: fonts.bold }, disabled: { opacity: .4 }, pickerSheet: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: Platform.OS === "ios" ? 24 : 12 }, pickerToolbar: { height: 54, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }, pickerTitle: { color: colors.ink, fontSize: 17, fontFamily: fonts.bold }, done: { width: 48, textAlign: "right", color: colors.brand, fontSize: 17, fontFamily: fonts.bold }, pickerItem: { color: colors.ink, fontSize: 16 }, datePicker: { height: 216 } });
