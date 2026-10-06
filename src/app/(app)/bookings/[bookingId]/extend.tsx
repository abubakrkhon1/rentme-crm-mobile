import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { ErrorView, ScreenSkeleton } from "@/components/ui/StateView";
import { InspectionPhotoPicker, type PendingInspectionPhoto } from "@/features/bookings/InspectionPhotoPicker";
import { removeUploadedInspectionPhotos, uploadInspectionPhotos } from "@/features/bookings/inspectionPhotoUpload";
import { useBookingExtensionSetup, useCreateBookingExtension } from "@/features/bookings/useBookingExtension";
import { useMobileSession } from "@/features/workspace/useMobileSession";
import type { InspectionInput } from "@/lib/api/types";
import { colors } from "@/theme/colors";

type InspectionState = { fuel: string; odometer: string; allowed: string; exterior: string; interior: string; notes: string };
const blankInspection = (): InspectionState => ({ fuel: "100", odometer: "", allowed: "", exterior: "Clean", interior: "Clean", notes: "" });

export default function ExtendBookingScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const setup = useBookingExtensionSetup(bookingId);
  const create = useCreateBookingExtension(bookingId);
  const mobileSession = useMobileSession();
  const [vehicleId, setVehicleId] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [rentalPrice, setRentalPrice] = useState("");
  const [vehiclePickerOpen, setVehiclePickerOpen] = useState(false);
  const [draftVehicleId, setDraftVehicleId] = useState("");
  const [datePicker, setDatePicker] = useState<"pickup" | "return" | null>(null);
  const [draftDate, setDraftDate] = useState(new Date());
  const [pickup, setPickup] = useState<InspectionState>(blankInspection);
  const [dropoff, setDropoff] = useState<InspectionState>(blankInspection);
  const [pickupPhotos, setPickupPhotos] = useState<PendingInspectionPhoto[]>([]);
  const [dropoffPhotos, setDropoffPhotos] = useState<PendingInspectionPhoto[]>([]);
  const [photosUploading, setPhotosUploading] = useState(false);

  useEffect(() => {
    const parent = setup.data?.parent;
    if (!parent || vehicleId) return;
    queueMicrotask(() => {
      const start = parseDate(parent.return_date.slice(0, 10));
      setVehicleId(parent.car_id);
      setPickupDate(toDateValue(start));
      setReturnDate(toDateValue(addDays(start, 3)));
    });
  }, [setup.data, vehicleId]);

  const selected = setup.data?.vehicles.find((vehicle) => vehicle.id === vehicleId);
  const sameVehicle = vehicleId === setup.data?.parent.car_id;
  const inheritedPaths = setup.data?.parentPickupInspection?.photo_paths ?? [];
  const inheritedKey = inheritedPaths.join("|");

  useEffect(() => {
    const data = setup.data;
    if (!vehicleId || !data) return;
    if (vehicleId === data.parent.car_id) {
      const inspection = data.parentPickupInspection;
      queueMicrotask(() => {
        setPickup({ fuel: String(inspection?.fuel_level ?? 100), odometer: String(inspection?.odometer_miles ?? ""), allowed: "", exterior: inspection?.exterior_condition ?? "Clean", interior: inspection?.interior_condition ?? "Clean", notes: inspection?.general_notes ?? "" });
        setPickupPhotos(inheritedPaths.map((storagePath) => ({ id: storagePath, storagePath, uri: data.parentPickupPhotoUrls?.[storagePath] })));
        setDropoffPhotos([]);
      });
    } else {
      queueMicrotask(() => { setPickup(blankInspection()); setDropoff(blankInspection()); setPickupPhotos([]); setDropoffPhotos([]); });
    }
    // A vehicle change starts a new inspection; the same vehicle restores the parent inspection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId, inheritedKey]);

  const days = useMemo(() => Math.max(0, Math.ceil((new Date(returnDate).getTime() - new Date(pickupDate).getTime()) / 86400000) || 0), [pickupDate, returnDate]);
  useEffect(() => { if (selected && days) queueMicrotask(() => setRentalPrice(String(selected.dailyRate * days))); }, [selected, days]);

  if (setup.isLoading) return <ScreenSkeleton variant="list" />;
  if (setup.isError) return <ErrorView message={setup.error.message} onRetry={() => void setup.refetch()} />;
  const data = setup.data;
  if (!data) return <ErrorView message="Extension details were empty." />;

  function makeInspection(state: InspectionState, carId: string, paths: string[], allowed?: number): InspectionInput {
    return { car_id: carId, fuel_level: Number(state.fuel), odometer_miles: Number(state.odometer), allowed_miles: allowed, exterior_condition: state.exterior, interior_condition: state.interior, general_notes: state.notes, photo_paths: paths };
  }

  async function submit() {
    const current = setup.data;
    if (!current) return Alert.alert("Extension unavailable", "Reload the booking and try again.");
    if (!pickupDate || !returnDate || days < 1 || !pickup.odometer || !pickup.allowed || (!sameVehicle && !dropoff.odometer)) return Alert.alert("Missing information", "Complete the dates, pricing, mileage allowance, and required condition fields.");
    if (!sameVehicle && (!pickupPhotos.length || !dropoffPhotos.length)) return Alert.alert("Inspection photos required", "Add drop-off photos for the original vehicle and pickup photos for the replacement vehicle.");
    const organizationId = mobileSession.data?.activeWorkspace.id;
    if (!organizationId || !bookingId) return Alert.alert("Workspace unavailable", "Reload the app and try again.");
    const rental = Number(rentalPrice);
    const weeks = Math.ceil(days / 7);
    const weeklyInsurance = current.parent.insurance_total && current.parent.rental_days ? Number(current.parent.insurance_total) / Math.ceil(Number(current.parent.rental_days) / 7) : 0;
    const insurance = current.parent.has_own_insurance === "Yes" ? 0 : weeklyInsurance * weeks;
    const newlyUploaded: string[] = [];
    setPhotosUploading(true);
    try {
      const pickupUpload = await uploadInspectionPhotos(pickupPhotos, organizationId, bookingId, "pickup");
      newlyUploaded.push(...pickupUpload.uploadedPaths);
      const returnUpload = sameVehicle ? { paths: [] as string[], uploadedPaths: [] as string[] } : await uploadInspectionPhotos(dropoffPhotos, organizationId, bookingId, "return");
      newlyUploaded.push(...returnUpload.uploadedPaths);
      const result = await create.mutateAsync({
        vehicleId, pickupDate, returnDate,
        dailyRate: selected?.dailyRate ?? Number(current.parent.daily_rate), rentalSubtotal: rental,
        insuranceTotal: insurance, totalCost: rental + insurance + Number(current.parent.ride_share_fee || 0),
        extensionPickupInspection: makeInspection(pickup, vehicleId, pickupUpload.paths, (sameVehicle ? Number(current.parentPickupInspection?.allowed_miles ?? 0) : 0) + Number(pickup.allowed)),
        parentReturnInspection: sameVehicle ? undefined : makeInspection(dropoff, current.parent.car_id, returnUpload.paths),
      });
      router.replace(`/bookings/${result.bookingId}`);
    } catch (error) {
      await removeUploadedInspectionPhotos(newlyUploaded);
      Alert.alert("Extension failed", error instanceof Error ? error.message : "Please try again.");
    } finally { setPhotosUploading(false); }
  }

  return <>
    <Screen>
      <View style={styles.header}><Pressable style={styles.back} onPress={() => router.back()}><Ionicons name="chevron-back" size={22} color={colors.ink} /></Pressable><View><Text style={styles.eyebrow}>BOOKING WORKFLOW</Text><Text style={styles.title}>Extend rental</Text></View><View style={styles.back} /></View>
      <View style={styles.parent}><Text style={styles.parentLabel}>ORIGINAL BOOKING</Text><Text style={styles.parentTitle}>{data.parent.first_name} {data.parent.last_name}</Text><Text style={styles.parentCopy}>{data.parent.car_name} · {data.parent.pickup_date.slice(0, 10)} → {data.parent.return_date.slice(0, 10)}</Text></View>
      <Section title="Vehicle & dates">
        <Text style={styles.label}>Extension vehicle</Text>
        <Pressable accessibilityRole="button" onPress={() => { setDraftVehicleId(vehicleId); setVehiclePickerOpen(true); }} style={styles.selectTrigger}><View style={styles.selectText}><Text style={styles.selectName} numberOfLines={1}>{selected?.name ?? "Select a vehicle"}</Text><Text style={styles.selectMeta}>{selected ? `${selected.plateNumber ?? "No plate"} · $${selected.dailyRate}/day` : "Vehicle, plate, and rate"}</Text></View><Ionicons name="chevron-expand" size={20} color={colors.brandDark} /></Pressable>
        <DateButton label="Pickup date" value={pickupDate} onPress={() => { setDraftDate(parseDate(pickupDate)); setDatePicker("pickup"); }} />
        <DateButton label="Drop-off date" value={returnDate} onPress={() => { setDraftDate(parseDate(returnDate || pickupDate)); setDatePicker("return"); }} />
        <Field label={`Rental subtotal · ${days} days`} value={rentalPrice} onChange={setRentalPrice} keyboard="numeric" />
      </Section>
      <View style={[styles.notice, !sameVehicle && styles.warning]}><Ionicons name={sameVehicle ? "copy-outline" : "swap-horizontal"} size={20} color={sameVehicle ? colors.brandDark : "#A15C00"} /><Text style={styles.noticeText}>{sameVehicle ? "Parent pickup condition and photos are carried forward. Confirm mileage allowance below." : "Vehicle changed: record drop-off photos for the old car and pickup photos for the new car."}</Text></View>
      {!sameVehicle && <Condition title={`Drop-off · ${data.parent.car_name}`} state={dropoff} setState={setDropoff} showAllowed={false} photos={dropoffPhotos} setPhotos={setDropoffPhotos} disabled={photosUploading} />}
      <Condition title={`Pickup · ${selected?.name ?? "New vehicle"}`} state={pickup} setState={setPickup} showAllowed photos={pickupPhotos} setPhotos={setPickupPhotos} inheritedCount={sameVehicle ? inheritedPaths.length : 0} disabled={photosUploading} />
      <Button label={photosUploading ? "Uploading photos…" : create.isPending ? "Creating extension…" : "Create extension"} disabled={create.isPending || photosUploading} onPress={() => void submit()} />
    </Screen>
    <VehiclePicker visible={vehiclePickerOpen} selected={draftVehicleId || vehicleId} vehicles={data.vehicles} onCancel={() => setVehiclePickerOpen(false)} onDraft={setDraftVehicleId} onDone={() => { setVehicleId(draftVehicleId || vehicleId); setVehiclePickerOpen(false); }} />
    <Modal visible={datePicker !== null} transparent animationType="slide" onRequestClose={() => setDatePicker(null)}><Pressable style={styles.modalBackdrop} onPress={() => setDatePicker(null)} /><View style={styles.pickerSheet}><View style={styles.pickerToolbar}><Pressable onPress={() => setDatePicker(null)}><Text style={styles.pickerCancel}>Cancel</Text></Pressable><Text style={styles.pickerTitle}>{datePicker === "pickup" ? "Pickup date" : "Drop-off date"}</Text><Pressable onPress={() => { const value = toDateValue(draftDate); if (datePicker === "pickup") { setPickupDate(value); if (returnDate && parseDate(returnDate) <= draftDate) setReturnDate(toDateValue(addDays(draftDate, 3))); } else setReturnDate(value); setDatePicker(null); }}><Text style={styles.pickerDone}>Done</Text></Pressable></View><View style={styles.datePicker}><DateTimePicker value={draftDate} mode="date" display="spinner" minimumDate={datePicker === "return" ? addDays(parseDate(pickupDate), 1) : undefined} onChange={(_, value) => value && setDraftDate(value)} textColor={colors.ink} accentColor={colors.brand} themeVariant="light" style={styles.datePickerControl} /></View></View></Modal>
  </>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text><View style={styles.card}>{children}</View></View>; }
function Field({ label, value, onChange, keyboard }: { label: string; value: string; onChange: (value: string) => void; keyboard?: "numeric" }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChange} keyboardType={keyboard} style={styles.input} placeholderTextColor={colors.subtle} /></View>; }
function Condition({ title, state, setState, showAllowed, photos, setPhotos, inheritedCount = 0, disabled = false }: { title: string; state: InspectionState; setState: React.Dispatch<React.SetStateAction<InspectionState>>; showAllowed: boolean; photos: PendingInspectionPhoto[]; setPhotos: (photos: PendingInspectionPhoto[]) => void; inheritedCount?: number; disabled?: boolean }) { return <Section title={title}><Field label="Fuel level (%)" value={state.fuel} onChange={(fuel) => setState({ ...state, fuel })} keyboard="numeric" /><Field label="Odometer miles" value={state.odometer} onChange={(odometer) => setState({ ...state, odometer })} keyboard="numeric" />{showAllowed && <Field label="Allowed miles" value={state.allowed} onChange={(allowed) => setState({ ...state, allowed })} keyboard="numeric" />}<Field label="Exterior condition" value={state.exterior} onChange={(exterior) => setState({ ...state, exterior })} /><Field label="Interior condition" value={state.interior} onChange={(interior) => setState({ ...state, interior })} /><Field label="Condition notes" value={state.notes} onChange={(notes) => setState({ ...state, notes })} /><InspectionPhotoPicker photos={photos} onChange={setPhotos} inheritedCount={inheritedCount} required={inheritedCount === 0} disabled={disabled} /></Section>; }
function DateButton({ label, value, onPress }: { label: string; value: string; onPress: () => void }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><Pressable onPress={onPress} style={styles.selectTrigger}><Ionicons name="calendar-outline" size={18} color={colors.brandDark} /><Text style={[styles.selectName, styles.grow]}>{formatDateValue(value)}</Text><Ionicons name="chevron-forward" size={17} color={colors.subtle} /></Pressable></View>; }
function VehiclePicker({ visible, selected, vehicles, onCancel, onDraft, onDone }: { visible: boolean; selected: string; vehicles: { id: string; name: string; plateNumber: string | null }[]; onCancel: () => void; onDraft: (id: string) => void; onDone: () => void }) { return <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}><Pressable style={styles.modalBackdrop} onPress={onCancel} /><View style={styles.pickerSheet}><View style={styles.pickerToolbar}><Pressable onPress={onCancel}><Text style={styles.pickerCancel}>Cancel</Text></Pressable><Text style={styles.pickerTitle}>Choose vehicle</Text><Pressable onPress={onDone}><Text style={styles.pickerDone}>Done</Text></Pressable></View><Picker selectedValue={selected} onValueChange={(value) => onDraft(String(value))} itemStyle={styles.pickerItem}>{vehicles.map((vehicle) => <Picker.Item key={vehicle.id} value={vehicle.id} label={pickerVehicleLabel(vehicle.plateNumber, vehicle.name)} />)}</Picker><Text style={styles.pickerHint}>Plate numbers are shown first. Full pricing appears after selection.</Text></View></Modal>; }
function parseDate(value: string) { const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(); parsed.setHours(12, 0, 0, 0); return parsed; }
function addDays(value: Date, days: number) { const next = new Date(value); next.setDate(next.getDate() + days); return next; }
function toDateValue(value: Date) { return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`; }
function formatDateValue(value: string) { return parseDate(value).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }); }
function pickerVehicleLabel(plate: string | null, name: string) { return `${plate?.toUpperCase() ?? "NO PLATE"} · ${name.length > 24 ? `${name.slice(0, 23).trimEnd()}…` : name}`; }

const styles = StyleSheet.create({ header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, back: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }, eyebrow: { color: colors.brand, fontSize: 9, fontWeight: "900", letterSpacing: 1.1, textAlign: "center" }, title: { color: colors.ink, fontSize: 22, fontWeight: "900" }, parent: { backgroundColor: colors.brand, borderRadius: 22, padding: 18, gap: 4 }, parentLabel: { color: "rgba(255,255,255,.7)", fontSize: 9, fontWeight: "900", letterSpacing: 1 }, parentTitle: { color: "#fff", fontSize: 20, fontWeight: "900" }, parentCopy: { color: "rgba(255,255,255,.8)", fontSize: 11 }, section: { gap: 9 }, sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: "900" }, card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 14, gap: 13 }, selectTrigger: { minHeight: 58, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: "#EEF2F1", paddingHorizontal: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }, selectText: { flex: 1, gap: 3 }, selectName: { color: colors.ink, fontWeight: "900", fontSize: 13 }, selectMeta: { color: colors.muted, fontSize: 10 }, modalBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(10,20,17,0.36)" }, pickerSheet: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 24 }, pickerToolbar: { height: 52, paddingHorizontal: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, pickerTitle: { color: colors.ink, fontWeight: "900", fontSize: 14 }, pickerCancel: { color: colors.muted, fontWeight: "700", fontSize: 14 }, pickerDone: { color: colors.brand, fontWeight: "900", fontSize: 14 }, pickerItem: { color: colors.ink, fontSize: 17 }, pickerHint: { color: colors.muted, fontSize: 10, paddingHorizontal: 18 }, field: { gap: 6 }, label: { color: colors.muted, fontSize: 11, fontWeight: "800" }, input: { minHeight: 46, borderRadius: 12, backgroundColor: "#EEF2F1", paddingHorizontal: 12, color: colors.ink, fontSize: 14 }, notice: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 15, backgroundColor: colors.brandPale, alignItems: "center" }, warning: { backgroundColor: "#FFF1D6" }, noticeText: { flex: 1, color: colors.ink, fontSize: 11, lineHeight: 17, fontWeight: "700" }, datePicker: { height: 228, justifyContent: "center", overflow: "hidden" }, datePickerControl: { height: 216 }, grow: { flex: 1 } });
