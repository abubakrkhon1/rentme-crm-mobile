import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { GroupLabel } from "@/components/ui/Group";
import { LargeTitle } from "@/components/ui/LargeTitle";
import { NavBar } from "@/components/ui/NavBar";
import { Screen } from "@/components/ui/Screen";
import { ErrorView, ScreenSkeleton } from "@/components/ui/StateView";
import { StickyBar } from "@/components/ui/StickyBar";
import { InspectionPhotoPicker, type PendingInspectionPhoto } from "@/features/bookings/InspectionPhotoPicker";
import { removeUploadedInspectionPhotos, uploadInspectionPhotos } from "@/features/bookings/inspectionPhotoUpload";
import { useFinishBooking, useFinishBookingSetup } from "@/features/bookings/useFinishBooking";
import { useMobileSession } from "@/features/workspace/useMobileSession";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/fonts";

export default function FinishBookingScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const setup = useFinishBookingSetup(bookingId);
  const finish = useFinishBooking(bookingId);
  const session = useMobileSession();
  const [fuel, setFuel] = useState("100");
  const [odometer, setOdometer] = useState("");
  const [exterior, setExterior] = useState("Clean");
  const [interior, setInterior] = useState("Clean");
  const [damage, setDamage] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<PendingInspectionPhoto[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const pickup = setup.data?.pickupInspection;
    if (!pickup || odometer) return;
    queueMicrotask(() => { setFuel(String(pickup.fuel_level)); setOdometer(String(pickup.odometer_miles)); });
  }, [setup.data?.pickupInspection, odometer]);

  if (setup.isLoading) return <ScreenSkeleton variant="list" />;
  if (setup.isError) return <ErrorView message={setup.error.message} onRetry={() => void setup.refetch()} />;
  const data = setup.data;
  if (!data) return <ErrorView message="Return inspection details were empty." />;

  async function submit() {
    const organizationId = session.data?.activeWorkspace.id;
    const returnFuel = Number(fuel);
    const returnOdometer = Number(odometer);
    const pickupOdometer = Number(data?.pickupInspection?.odometer_miles ?? 0);
    if (!organizationId || !bookingId) return Alert.alert("Workspace unavailable", "Reload the app and try again.");
    if (!photos.length) return Alert.alert("Photos required", "Add at least one drop-off inspection photo.");
    if (!Number.isFinite(returnFuel) || returnFuel < 0 || returnFuel > 100) return Alert.alert("Invalid fuel level", "Enter a fuel level from 0 to 100.");
    if (!Number.isFinite(returnOdometer) || returnOdometer < pickupOdometer) return Alert.alert("Invalid odometer", `Return mileage must be at least ${pickupOdometer.toLocaleString()} miles.`);
    setUploading(true);
    let uploadedPaths: string[] = [];
    try {
      const upload = await uploadInspectionPhotos(photos, organizationId, bookingId, "return");
      uploadedPaths = upload.uploadedPaths;
      await finish.mutateAsync({ returnFuelLevel: returnFuel, returnOdometerMiles: returnOdometer, exteriorCondition: exterior, interiorCondition: interior, damageNotes: damage, generalNotes: notes, photoPaths: upload.paths });
      Alert.alert("Booking finished", "The return inspection was saved and the vehicle is available again.", [{ text: "Done", onPress: () => router.replace(`/bookings/${bookingId}`) }]);
    } catch (error) {
      await removeUploadedInspectionPhotos(uploadedPaths);
      Alert.alert("Couldn’t finish booking", error instanceof Error ? error.message : "Please try again.");
    } finally { setUploading(false); }
  }

  const footer = <StickyBar><Button label={uploading ? "Uploading photos…" : finish.isPending ? "Finishing booking…" : "Finish booking"} disabled={uploading || finish.isPending} onPress={() => void submit()} /></StickyBar>;

  return (
    <Screen footer={footer}>
      <NavBar backLabel="Booking" />
      <LargeTitle title="Return inspection" />
      <View style={styles.summary}><Text style={styles.summaryTitle}>{data.booking.first_name} {data.booking.last_name}</Text><Text style={styles.summaryCopy}>{data.booking.car_name} · {data.booking.pickup_date.slice(0, 10)} → {data.booking.return_date.slice(0, 10)}</Text></View>
      {!data.pickupInspection ? <View style={styles.notice}><Ionicons name="alert-circle-outline" size={20} color={colors.warning} /><Text style={styles.noticeText}>Pickup condition is missing. You can still record the drop-off condition and finish this booking.</Text></View> : null}
      <View style={styles.section}><GroupLabel>Return condition</GroupLabel><View style={styles.card}>
        <Field label="Fuel level (%)" value={fuel} onChange={setFuel} keyboard="numeric" />
        <Field label={`Return odometer${data.pickupInspection ? ` · pickup ${Number(data.pickupInspection.odometer_miles).toLocaleString()} mi` : ""}`} value={odometer} onChange={setOdometer} keyboard="numeric" />
        <Field label="Exterior condition" value={exterior} onChange={setExterior} />
        <Field label="Interior condition" value={interior} onChange={setInterior} />
        <Field label="Damage notes" value={damage} onChange={setDamage} multiline />
        <Field label="General notes" value={notes} onChange={setNotes} multiline />
      </View></View>
      <View style={styles.card}><InspectionPhotoPicker photos={photos} onChange={setPhotos} disabled={uploading || finish.isPending} required /></View>
    </Screen>
  );
}

function Field({ label, value, onChange, keyboard, multiline = false }: { label: string; value: string; onChange: (value: string) => void; keyboard?: "numeric"; multiline?: boolean }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChange} keyboardType={keyboard} multiline={multiline} style={[styles.input, multiline && styles.multiline]} placeholderTextColor={colors.subtle} /></View>;
}

const styles = StyleSheet.create({
  summary: { backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderRadius: 16, padding: 16, gap: 2 },
  summaryTitle: { color: colors.ink, fontSize: 18, fontFamily: fonts.bold },
  summaryCopy: { color: colors.muted, fontSize: 14 },
  notice: { backgroundColor: colors.warningSoft, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  noticeText: { flex: 1, color: colors.warning, fontSize: 14, lineHeight: 20, fontFamily: fonts.medium },
  section: { gap: 6 },
  card: { backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderRadius: 16, padding: 16, gap: 14 },
  field: { gap: 6 }, label: { color: colors.muted, fontSize: 13, fontFamily: fonts.medium },
  input: { minHeight: 46, borderRadius: 10, backgroundColor: colors.fill, paddingHorizontal: 12, color: colors.ink, fontSize: 16 },
  multiline: { minHeight: 88, paddingTop: 12, textAlignVertical: "top" },
});
