import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { GroupLabel } from "@/components/ui/Group";
import { LargeTitle } from "@/components/ui/LargeTitle";
import { NavBar } from "@/components/ui/NavBar";
import { Screen } from "@/components/ui/Screen";
import { ErrorView, ScreenSkeleton } from "@/components/ui/StateView";
import { StickyBar } from "@/components/ui/StickyBar";
import { InspectionPhotoPicker, type PendingInspectionPhoto } from "@/features/bookings/InspectionPhotoPicker";
import { removeUploadedInspectionPhotos, uploadInspectionPhotos } from "@/features/bookings/inspectionPhotoUpload";
import { useCreateBooking, useNewBookingSetup } from "@/features/bookings/useNewBooking";
import { useMobileSession } from "@/features/workspace/useMobileSession";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

const LOCATIONS = ["Orlando FL - RENTME Office", "Orlando - Downtown", "Orlando - International Airport", "Orlando - Universal Studios", "Orlando - Disney World", "Custom Location"];
const STATUSES = ["active", "pending", "confirmed", "completed", "cancelled"];
const PURPOSES = ["Personal Use", "Commercial use for Uber/Lyft etc.."];
const PAYMENT_METHODS = ["none", "Cash", "Cash App", "Apple Cash", "Zelle", "Credit Card", "Debit Card", "Bank Transfer", "Check", "Other"];
const BOOKING_SOURCES = ["admin_created", "website", "phone_call", "walk_in", "facebook", "instagram", "referral", "repeat_customer", "other"];
const MARKETING_SOURCES = ["none", "google_ads", "google_search", "facebook", "instagram", "referral", "repeat_customer", "other"];
type Form = Record<string, string>;

const initialForm: Form = { firstName: "", lastName: "", email: "", phone: "", driverLicense: "", vehicleId: "", pickupDate: "", returnDate: "", pickupLocation: "", returnLocation: "", status: "active", assignedAdminId: "none", rentalPurpose: "", ageOver21: "Yes", majorViolations: "No", insuranceOption: "29", paymentType: "none", dailyRate: "0", customRentalTotal: "", rideShareFee: "0", deliveryFee: "0", deposit: "200", bookingSource: "admin_created", marketingSource: "none", specialRequests: "" };

export default function NewBookingScreen() {
  const [form, setForm] = useState<Form>(initialForm);
  const setup = useNewBookingSetup(form.pickupDate, form.returnDate);
  const create = useCreateBooking();
  const session = useMobileSession();
  const [step, setStep] = useState<1 | 2>(1);
  const [hasOwnInsurance, setHasOwnInsurance] = useState(false);
  const [unlimitedMiles, setUnlimitedMiles] = useState(false);
  const [rideShare, setRideShare] = useState(false);
  const [photos, setPhotos] = useState<PendingInspectionPhoto[]>([]);
  const [inspection, setInspection] = useState({ fuel: "100", odometer: "", allowed: "", exterior: "Clean", interior: "Clean", damage: "", notes: "" });
  const [dateField, setDateField] = useState<"pickupDate" | "returnDate" | null>(null);
  const [draftDate, setDraftDate] = useState(new Date());
  const [uploading, setUploading] = useState(false);
  const data = setup.data;
  const selectedVehicle = data?.vehicles.find((vehicle) => vehicle.id === form.vehicleId);
  const days = useMemo(() => rentalDays(form.pickupDate, form.returnDate), [form.pickupDate, form.returnDate]);
  const insuranceTotal = hasOwnInsurance ? 0 : Math.ceil(days / 7) * number(form.insuranceOption);
  const calculatedSubtotal = days * number(form.dailyRate);
  const rentalSubtotal = form.customRentalTotal.trim() === "" ? calculatedSubtotal : number(form.customRentalTotal);
  const total = rentalSubtotal + insuranceTotal + number(form.rideShareFee) + number(form.deliveryFee);

  if (setup.isLoading) return <ScreenSkeleton variant="list" />;
  if (setup.isError) return <ErrorView message={setup.error.message} onRetry={() => void setup.refetch()} />;
  if (!data) return <ErrorView message="Booking setup was empty." />;
  const bookingId = data.bookingId;

  function set(key: string, value: string) { setForm((current) => ({ ...current, [key]: value })); }
  function pickVehicle(value: string) { const vehicle = data?.vehicles.find((item) => item.id === value); setForm((current) => ({ ...current, vehicleId: value, dailyRate: String(vehicle?.dailyRate ?? 0) })); setInspection((current) => ({ ...current, odometer: vehicle?.odometer === null || vehicle?.odometer === undefined ? "" : String(vehicle.odometer) })); }
  function next() {
    const required = [form.firstName, form.lastName, form.email, form.phone, form.driverLicense, form.vehicleId, form.pickupDate, form.returnDate, form.pickupLocation, form.returnLocation, form.rentalPurpose];
    if (required.some((value) => !value.trim())) return Alert.alert("Missing information", "Complete every required field before continuing.");
    if (days < 1) return Alert.alert("Invalid rental dates", "Return must be at least one day after pickup.");
    if (!selectedVehicle) return Alert.alert("Vehicle unavailable", "Choose a vehicle that is available for the selected dates.");
    setStep(2);
  }
  async function submit() {
    if (!photos.length || !inspection.odometer.trim() || !inspection.allowed.trim()) return Alert.alert("Pickup inspection required", "Add photos, odometer mileage, and allowed miles.");
    if (!Number.isInteger(number(inspection.allowed)) || number(inspection.allowed) < 0) return Alert.alert("Invalid allowed miles", "Enter a non-negative whole number.");
    const organizationId = session.data?.activeWorkspace.id;
    if (!organizationId) return Alert.alert("Workspace unavailable", "Reload the app and try again.");
    setUploading(true);
    let uploadedPaths: string[] = [];
    try {
      const upload = await uploadInspectionPhotos(photos, organizationId, bookingId, "pickup");
      uploadedPaths = upload.uploadedPaths;
      const result = await create.mutateAsync({ booking: { id: bookingId, first_name: form.firstName.trim(), last_name: form.lastName.trim(), email: form.email.trim(), phone: form.phone.trim(), driver_license: form.driverLicense.trim(), car_id: form.vehicleId, car_name: selectedVehicle?.name ?? "", pickup_date: form.pickupDate, return_date: form.returnDate, pickup_location: form.pickupLocation, return_location: form.returnLocation, status: form.status, rental_purpose: form.rentalPurpose, rental_duration: `${days} days`, age_over_21: form.ageOver21, major_violations: form.majorViolations, driving_out_of_state: "No", has_own_insurance: hasOwnInsurance ? "Yes" : "No", unlimited_miles: unlimitedMiles, ride_share: rideShare, security_deposit_agreed: "Yes", payment_type: form.paymentType === "none" ? null : form.paymentType, rental_days: days, daily_rate: number(form.dailyRate), rental_subtotal: rentalSubtotal, total_cost: total, deposit: number(form.deposit), insurance_type: hasOwnInsurance ? "Own" : `$${form.insuranceOption}/week`, insurance_total: insuranceTotal, ride_share_fee: number(form.rideShareFee), delivery_fee: number(form.deliveryFee), booking_source: form.bookingSource, marketing_source: form.marketingSource, special_requests: form.specialRequests, assigned_admin_id: form.assignedAdminId === "none" ? null : form.assignedAdminId }, inspection: { car_id: form.vehicleId, fuel_level: number(inspection.fuel), odometer_miles: number(inspection.odometer), allowed_miles: number(inspection.allowed), exterior_condition: inspection.exterior, interior_condition: inspection.interior, damage_notes: inspection.damage, general_notes: inspection.notes, photo_paths: upload.paths } });
      router.replace(`/bookings/${result.bookingId}`);
    } catch (error) { await removeUploadedInspectionPhotos(uploadedPaths); Alert.alert("Booking could not be created", error instanceof Error ? error.message : "Please try again."); } finally { setUploading(false); }
  }

  const footer = <StickyBar>{step === 1 ? <Button label="Continue to pickup inspection" onPress={next} /> : <Button label={uploading ? "Uploading photos…" : create.isPending ? "Creating booking…" : "Create booking"} disabled={uploading || create.isPending} onPress={() => void submit()} />}</StickyBar>;

  return <>
    <Screen footer={footer}>
      <NavBar backLabel={step === 2 ? "Details" : "Bookings"} title={`Step ${step} of 2`} onBack={() => step === 2 ? setStep(1) : router.back()} />
      <LargeTitle title="New booking" subtitle={step === 1 ? "Booking information" : "Pickup inspection"} />
      <View style={s.progressTrack}><View style={[s.progressFill, { width: step === 1 ? "50%" : "100%" }]} /></View>
      {step === 1 ? <>
        <Section icon="person-outline" title="Customer information"><Field label="First name *" value={form.firstName} onChange={(value) => set("firstName", value)} /><Field label="Last name *" value={form.lastName} onChange={(value) => set("lastName", value)} /><Field label="Email *" value={form.email} onChange={(value) => set("email", value)} keyboard="email-address" /><Field label="Phone *" value={form.phone} onChange={(value) => set("phone", value)} keyboard="phone-pad" /><Field label="Driver license *" value={form.driverLicense} onChange={(value) => set("driverLicense", value)} /></Section>
        <Section icon="car-sport-outline" title="Vehicle & dates"><SelectField label="Vehicle *" value={form.vehicleId} placeholder="Choose a vehicle" options={data.vehicles.map((item) => ({ value: item.id, label: `${item.name}${item.plateNumber ? ` · ${item.plateNumber.toUpperCase()}` : ""} · $${item.dailyRate}/day` }))} onChange={pickVehicle} /><DateField label="Pickup date *" value={form.pickupDate} onPress={() => openDate("pickupDate", form.pickupDate, setDraftDate, setDateField)} /><DateField label="Return date *" value={form.returnDate} onPress={() => openDate("returnDate", form.returnDate || form.pickupDate, setDraftDate, setDateField)} /><SelectField label="Pickup location *" value={form.pickupLocation} placeholder="Choose location" options={options(LOCATIONS)} onChange={(value) => set("pickupLocation", value)} /><SelectField label="Return location *" value={form.returnLocation} placeholder="Choose location" options={options(LOCATIONS)} onChange={(value) => set("returnLocation", value)} /></Section>
        <Section icon="options-outline" title="Rental details"><SelectField label="Status" value={form.status} options={options(STATUSES)} onChange={(value) => set("status", value)} /><SelectField label="Admin working with booking" value={form.assignedAdminId} options={[{ value: "none", label: "Unassigned" }, ...data.admins.map((item) => ({ value: item.id, label: `${item.name} · ${item.role}` }))]} onChange={(value) => set("assignedAdminId", value)} /><SelectField label="Rental purpose *" value={form.rentalPurpose} placeholder="Select purpose" options={options(PURPOSES)} onChange={(value) => set("rentalPurpose", value)} /><Segment label="Age over 21?" value={form.ageOver21} onChange={(value) => set("ageOver21", value)} /><Segment label="Major violations?" value={form.majorViolations} onChange={(value) => set("majorViolations", value)} /><Toggle label="Unlimited miles" value={unlimitedMiles} onChange={setUnlimitedMiles} /><Toggle label="Ride share approved" value={rideShare} onChange={setRideShare} /></Section>
        <Section icon="shield-checkmark-outline" title="Insurance"><Toggle label="Will use own insurance" value={hasOwnInsurance} onChange={setHasOwnInsurance} />{!hasOwnInsurance ? <SelectField label="Insurance option" value={form.insuranceOption} options={[{ value: "29", label: "$29 per week" }, { value: "49", label: "$49 per week" }]} onChange={(value) => set("insuranceOption", value)} /> : null}</Section>
        <Section icon="analytics-outline" title="Source tracking"><SelectField label="Booking source" value={form.bookingSource} options={labelOptions(BOOKING_SOURCES)} onChange={(value) => set("bookingSource", value)} /><SelectField label="Marketing source" value={form.marketingSource} options={labelOptions(MARKETING_SOURCES)} onChange={(value) => set("marketingSource", value)} /></Section>
        <Section icon="cash-outline" title="Financials"><SelectField label="Payment type" value={form.paymentType} options={PAYMENT_METHODS.map((value) => ({ value, label: value === "none" ? "Not specified" : value }))} onChange={(value) => set("paymentType", value)} /><Field label="Daily rate ($) *" value={form.dailyRate} onChange={(value) => set("dailyRate", value)} keyboard="decimal-pad" /><Field label="Custom rental total ($)" value={form.customRentalTotal} onChange={(value) => set("customRentalTotal", value)} keyboard="decimal-pad" placeholder={`Calculated: $${calculatedSubtotal}`} /><Field label="Ride share fee ($)" value={form.rideShareFee} onChange={(value) => set("rideShareFee", value)} keyboard="decimal-pad" /><Field label="Delivery fee ($)" value={form.deliveryFee} onChange={(value) => set("deliveryFee", value)} keyboard="decimal-pad" /><Field label="Security deposit ($)" value={form.deposit} onChange={(value) => set("deposit", value)} keyboard="decimal-pad" /></Section>
        <Section icon="document-text-outline" title="Notes"><Field label="Special requests or admin notes" value={form.specialRequests} onChange={(value) => set("specialRequests", value)} multiline /></Section>
        <CostSummary days={days} dailyRate={form.dailyRate} subtotal={rentalSubtotal} insurance={insuranceTotal} rideShare={number(form.rideShareFee)} delivery={number(form.deliveryFee)} total={total} deposit={number(form.deposit)} custom={form.customRentalTotal.trim() !== ""} />
      </> : <>
        <View style={s.summaryHero}><Text style={s.summaryName}>{form.firstName} {form.lastName}</Text><Text style={s.summaryMeta}>{selectedVehicle?.name} · {displayDate(form.pickupDate)} → {displayDate(form.returnDate)}</Text></View>
        <Section icon="speedometer-outline" title="Pickup condition"><Field label="Fuel level (%) *" value={inspection.fuel} onChange={(value) => setInspection({ ...inspection, fuel: value })} keyboard="number-pad" /><Field label="Odometer miles *" value={inspection.odometer} onChange={(value) => setInspection({ ...inspection, odometer: value })} keyboard="decimal-pad" /><Field label="Allowed miles *" value={inspection.allowed} onChange={(value) => setInspection({ ...inspection, allowed: value })} keyboard="number-pad" /><Field label="Exterior condition" value={inspection.exterior} onChange={(value) => setInspection({ ...inspection, exterior: value })} /><Field label="Interior condition" value={inspection.interior} onChange={(value) => setInspection({ ...inspection, interior: value })} /><Field label="Damage notes" value={inspection.damage} onChange={(value) => setInspection({ ...inspection, damage: value })} multiline /><Field label="General notes" value={inspection.notes} onChange={(value) => setInspection({ ...inspection, notes: value })} multiline /><InspectionPhotoPicker photos={photos} onChange={setPhotos} disabled={uploading || create.isPending} /></Section>
      </>}
    </Screen>
    <Modal visible={dateField !== null} transparent animationType="slide" onRequestClose={() => setDateField(null)}><Pressable style={s.backdrop} onPress={() => setDateField(null)} /><View style={s.sheet}><View style={s.toolbar}><Pressable onPress={() => setDateField(null)}><Text style={s.cancel}>Cancel</Text></Pressable><Text style={s.sheetTitle}>{dateField === "pickupDate" ? "Pickup date" : "Return date"}</Text><Pressable onPress={() => { const value = dateValue(draftDate); if (dateField) set(dateField, value); setDateField(null); }}><Text style={s.done}>Done</Text></Pressable></View><DateTimePicker value={draftDate} mode="date" display="spinner" minimumDate={dateField === "returnDate" && form.pickupDate ? addDays(parseDate(form.pickupDate), 1) : undefined} onChange={(_, value) => value && setDraftDate(value)} themeVariant="light" textColor={colors.ink} style={s.datePicker} /></View></Modal>
  </>;
}

function Section({ title, children }: { icon?: keyof typeof Ionicons.glyphMap; title: string; children: React.ReactNode }) { return <View style={s.section}><GroupLabel>{title}</GroupLabel><View style={s.card}>{children}</View></View>; }
function Field({ label, value, onChange, keyboard, placeholder, multiline }: { label: string; value: string; onChange: (value: string) => void; keyboard?: "email-address" | "phone-pad" | "decimal-pad" | "number-pad"; placeholder?: string; multiline?: boolean }) { return <View style={s.field}><Text style={s.label}>{label}</Text><TextInput value={value} onChangeText={onChange} keyboardType={keyboard} placeholder={placeholder} placeholderTextColor={colors.subtle} multiline={multiline} style={[s.input, multiline && s.multiline]} autoCapitalize={keyboard === "email-address" ? "none" : undefined} /></View>; }
function SelectField({ label, value, placeholder = "Select", options: items, onChange }: { label: string; value: string; placeholder?: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) { const [open, setOpen] = useState(false); const [draft, setDraft] = useState(value); const selected = items.find((item) => item.value === value); return <><View style={s.field}><Text style={s.label}>{label}</Text><Pressable style={s.select} onPress={() => { setDraft(value || items[0]?.value || ""); setOpen(true); }}><Text style={[s.selectText, !selected && s.placeholder]} numberOfLines={2}>{selected?.label ?? placeholder}</Text><Ionicons name="chevron-expand" size={18} color={colors.subtle} /></Pressable></View><Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}><Pressable style={s.backdrop} onPress={() => setOpen(false)} /><View style={s.sheet}><View style={s.toolbar}><Pressable onPress={() => setOpen(false)}><Text style={s.cancel}>Cancel</Text></Pressable><Text style={s.sheetTitle}>{label.replace(" *", "")}</Text><Pressable onPress={() => { onChange(draft); setOpen(false); }}><Text style={s.done}>Done</Text></Pressable></View><Picker selectedValue={draft} onValueChange={(next) => setDraft(String(next))} itemStyle={s.pickerItem}>{items.map((item) => <Picker.Item key={item.value} value={item.value} label={item.label} />)}</Picker></View></Modal></>; }
function DateField({ label, value, onPress }: { label: string; value: string; onPress: () => void }) { return <View style={s.field}><Text style={s.label}>{label}</Text><Pressable style={s.select} onPress={onPress}><Ionicons name="calendar-outline" size={18} color={colors.brand} /><Text style={[s.selectText, !value && s.placeholder]}>{value ? displayDate(value) : "Choose date"}</Text><Ionicons name="chevron-forward" size={17} color={colors.subtle} /></Pressable></View>; }
function Segment({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <View style={s.field}><Text style={s.label}>{label}</Text><View style={s.segment}>{["Yes", "No"].map((item) => <Pressable key={item} onPress={() => onChange(item)} style={[s.segmentItem, value === item && s.segmentActive]}><Text style={[s.segmentText, value === item && s.segmentTextActive]}>{item}</Text></Pressable>)}</View></View>; }
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) { return <View style={s.toggle}><Text style={s.toggleText}>{label}</Text><Switch value={value} onValueChange={onChange} trackColor={{ false: colors.track, true: colors.brand }} thumbColor="#fff" /></View>; }
function CostSummary({ days, dailyRate, subtotal, insurance, rideShare, delivery, total, deposit, custom }: { days: number; dailyRate: string; subtotal: number; insurance: number; rideShare: number; delivery: number; total: number; deposit: number; custom: boolean }) { return <View style={s.cost}><Text style={s.costTitle}>Cost summary</Text><CostRow label={custom ? "Rental subtotal · custom" : `Rental subtotal · ${days} days × $${dailyRate}`} value={subtotal} /><CostRow label="Insurance" value={insurance} /><CostRow label="Ride share fee" value={rideShare} /><CostRow label="Delivery fee" value={delivery} /><View style={s.costRule} /><CostRow label="Total cost owed" value={total} total /><View style={s.depositRow}><Text style={s.depositLabel}>Security deposit · held separately</Text><Text style={s.depositValue}>${deposit.toFixed(2)}</Text></View></View>; }
function CostRow({ label, value, total }: { label: string; value: number; total?: boolean }) { return <View style={s.costRow}><Text style={[s.costLabel, total && s.costTotal]}>{label}</Text><Text style={[s.costValue, total && s.costTotal]}>${value.toFixed(2)}</Text></View>; }
function options(values: readonly string[]) { return values.map((value) => ({ value, label: title(value) })); }
function labelOptions(values: readonly string[]) { return values.map((value) => ({ value, label: value === "none" ? "None" : title(value.replaceAll("_", " ")) })); }
function title(value: string) { return value.replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function number(value: string) { const result = Number(value); return Number.isFinite(result) && result >= 0 ? result : 0; }
function rentalDays(start: string, end: string) { if (!start || !end) return 1; return Math.max(1, Math.round((parseDate(end).getTime() - parseDate(start).getTime()) / 86400000)); }
function parseDate(value: string) { const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(); parsed.setHours(12, 0, 0, 0); return parsed; }
function addDays(value: Date, days: number) { const next = new Date(value); next.setDate(next.getDate() + days); return next; }
function dateValue(value: Date) { return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`; }
function displayDate(value: string) { return parseDate(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
function openDate(field: "pickupDate" | "returnDate", value: string, setDraft: (value: Date) => void, setField: (value: "pickupDate" | "returnDate") => void) { setDraft(parseDate(value)); setField(field); }

const s = StyleSheet.create({
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: colors.track, overflow: "hidden" }, progressFill: { height: 4, borderRadius: 2, backgroundColor: colors.brand },
  section: { gap: 6 }, card: { backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderRadius: 16, padding: 16, gap: 14 },
  field: { gap: 6 }, label: { color: colors.muted, fontSize: 13, fontFamily: fonts.medium },
  input: { minHeight: 46, borderRadius: 10, backgroundColor: colors.fill, paddingHorizontal: 12, color: colors.ink, fontSize: 16 }, multiline: { minHeight: 92, paddingTop: 12, textAlignVertical: "top" },
  select: { minHeight: 46, borderRadius: 10, backgroundColor: colors.fill, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 9 }, selectText: { flex: 1, color: colors.ink, fontSize: 16 }, placeholder: { color: colors.subtle },
  toggle: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, toggleText: { color: colors.ink, fontSize: 16, fontFamily: fonts.medium },
  segment: { height: 36, borderRadius: 9, padding: 2, backgroundColor: colors.fill, flexDirection: "row" }, segmentItem: { flex: 1, borderRadius: 7, alignItems: "center", justifyContent: "center" }, segmentActive: { backgroundColor: colors.surface, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }, segmentText: { color: colors.neutralText, fontSize: 14, fontFamily: fonts.medium }, segmentTextActive: { color: colors.ink, fontFamily: fonts.bold },
  cost: { borderRadius: 16, padding: 16, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, gap: 10 }, costTitle: { color: colors.ink, fontSize: 17, fontFamily: fonts.bold, marginBottom: 2 }, costRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 }, costLabel: { flex: 1, color: colors.muted, fontSize: 14 }, costValue: { color: colors.ink, fontSize: 14, fontFamily: fonts.medium }, costRule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border }, costTotal: { color: colors.ink, fontSize: 17, fontFamily: fonts.bold }, depositRow: { marginTop: 2, borderRadius: 10, padding: 11, backgroundColor: colors.warningSoft, flexDirection: "row", justifyContent: "space-between", gap: 8 }, depositLabel: { flex: 1, color: colors.warning, fontSize: 13, fontFamily: fonts.medium }, depositValue: { color: colors.warning, fontSize: 14, fontFamily: fonts.bold },
  summaryHero: { borderRadius: 16, padding: 16, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }, summaryName: { color: colors.ink, fontSize: 18, fontFamily: fonts.bold }, summaryMeta: { color: colors.muted, fontSize: 14, marginTop: 2 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(10,14,22,.38)" }, sheet: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 24 }, toolbar: { height: 54, paddingHorizontal: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, sheetTitle: { color: colors.ink, fontSize: 17, fontFamily: fonts.bold }, cancel: { color: colors.brand, fontSize: 17 }, done: { color: colors.brand, fontSize: 17, fontFamily: fonts.bold }, pickerItem: { color: colors.ink, fontSize: 18 }, datePicker: { height: 216 },
});
