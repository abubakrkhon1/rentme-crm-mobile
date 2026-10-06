import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { supabase } from "@/lib/supabase/client";
import { colors } from "@/theme/colors";

export type PendingInspectionPhoto = {
  id: string;
  uri?: string;
  storagePath?: string;
  mimeType?: string | null;
  fileName?: string | null;
};

type Props = {
  photos: PendingInspectionPhoto[];
  onChange: (photos: PendingInspectionPhoto[]) => void;
  disabled?: boolean;
  required?: boolean;
  inheritedCount?: number;
};

const MAX_PHOTOS = 25;
const MAX_BYTES = 8 * 1024 * 1024;

export function InspectionPhotoPicker({ photos, onChange, disabled = false, required = true, inheritedCount = 0 }: Props) {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [photoError, setPhotoError] = useState("");
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [failedPhotos, setFailedPhotos] = useState<Record<string, boolean>>({});
  const storageKey = useMemo(() => photos.flatMap((photo) => photo.storagePath ? [photo.storagePath] : []).join("|"), [photos]);

  useEffect(() => {
    let active = true;
    const originalPaths = storageKey ? storageKey.split("|") : [];
    const storagePaths = originalPaths.map(normalizeStoragePath);
    if (originalPaths.length === 0) {
      queueMicrotask(() => active && setSignedUrls({}));
      return () => { active = false; };
    }
    void supabase.storage.from("booking_car_status").createSignedUrls(storagePaths, 60 * 60).then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setPhotoError("Existing photos could not be loaded. Tap to retry.");
        return;
      }
      setPhotoError("");
      setSignedUrls(Object.fromEntries((data ?? []).flatMap((item, index) => item.signedUrl ? [[originalPaths[index], item.signedUrl]] : [])));
      if ((data ?? []).some((item) => !item.signedUrl)) setPhotoError("Some existing photos could not be loaded.");
    });
    return () => { active = false; };
  }, [storageKey, reloadKey]);

  async function addFromCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera permission needed", "Allow camera access to take inspection photos.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled) addAssets(result.assets);
  }

  async function addFromGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photo permission needed", "Allow photo-library access to choose inspection photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, MAX_PHOTOS - photos.length),
      quality: 0.8,
    });
    if (!result.canceled) addAssets(result.assets);
  }

  function addAssets(assets: ImagePicker.ImagePickerAsset[]) {
    const available = MAX_PHOTOS - photos.length;
    const valid = assets.filter((asset) => !asset.fileSize || asset.fileSize <= MAX_BYTES).slice(0, available);
    if (valid.length < assets.length) {
      Alert.alert("Some photos were skipped", `Photos must be under 8 MB and the limit is ${MAX_PHOTOS}.`);
    }
    onChange([...photos, ...valid.map((asset) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      uri: asset.uri,
      mimeType: asset.mimeType,
      fileName: asset.fileName,
    }))]);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Text style={styles.label}>Inspection photos{required ? <Text style={styles.required}> *</Text> : null}</Text>
        <Text style={styles.count}>{photos.length}/{MAX_PHOTOS}</Text>
      </View>
      <Text style={styles.hint}>Take photos now or choose existing photos from the gallery.</Text>
      <View style={styles.actions}>
        <PhotoAction icon="camera-outline" label="Take a photo" onPress={() => void addFromCamera()} disabled={disabled || photos.length >= MAX_PHOTOS} />
        <PhotoAction icon="images-outline" label="Upload from gallery" onPress={() => void addFromGallery()} disabled={disabled || photos.length >= MAX_PHOTOS} />
      </View>
      {photoError ? <Pressable onPress={() => { setSignedUrls({}); setFailedPhotos({}); setPhotoError(""); setReloadKey((value) => value + 1); }}><Text style={styles.error}>{photoError}</Text></Pressable> : null}
      {photos.length > 0 ? (
        <View style={styles.gallery}>
          {photos.map((photo, index) => {
            const source = photo.uri ?? (photo.storagePath?.startsWith("http") ? photo.storagePath : photo.storagePath ? signedUrls[photo.storagePath] : undefined);
            const inherited = index < inheritedCount;
            return (
              <View key={photo.id} style={styles.photoWrap}>
                <Pressable accessibilityRole="button" accessibilityLabel={`Open inspection photo ${index + 1}`} onPress={() => source && setActivePhoto(source)}>
                  {source && !failedPhotos[photo.id] ? <Image source={{ uri: source }} style={styles.photo} contentFit="cover" cachePolicy="memory-disk" onError={() => setFailedPhotos((current) => ({ ...current, [photo.id]: true }))} /> : <View style={[styles.photo, styles.placeholder]}><Ionicons name="image-outline" size={28} color={colors.muted} /><Text style={styles.loadingText}>{failedPhotos[photo.id] ? "Couldn’t display" : "Loading…"}</Text></View>}
                </Pressable>
                {inherited ? (
                  <View style={styles.keptBadge}><Text style={styles.keptText}>KEPT</Text></View>
                ) : (
                  <Pressable accessibilityLabel="Remove photo" style={styles.remove} onPress={() => onChange(photos.filter((item) => item.id !== photo.id))} disabled={disabled}>
                    <Ionicons name="close" size={15} color="#fff" />
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
      ) : <View style={styles.empty}><Ionicons name="images-outline" size={22} color={colors.muted} /><Text style={styles.emptyText}>No inspection photos selected</Text></View>}
      <Modal visible={Boolean(activePhoto)} transparent animationType="fade" onRequestClose={() => setActivePhoto(null)}>
        <View style={styles.fullscreen}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close full-screen photo" style={styles.fullscreenClose} onPress={() => setActivePhoto(null)}><Ionicons name="close" size={28} color="#fff" /></Pressable>
          {activePhoto ? <Image source={{ uri: activePhoto }} style={styles.fullscreenImage} contentFit="contain" cachePolicy="memory-disk" /> : null}
        </View>
      </Modal>
    </View>
  );
}

function PhotoAction({ icon, label, onPress, disabled }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; disabled: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.action, (pressed || disabled) && styles.actionMuted]}><Ionicons name={icon} size={20} color={colors.brandDark} /><Text style={styles.actionText}>{label}</Text></Pressable>;
}

function normalizeStoragePath(path: string) {
  return path.replace(/^\/+/, "").replace(/^booking_car_status\//, "");
}

const styles = StyleSheet.create({
  wrap: { gap: 10, paddingTop: 3 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { color: colors.ink, fontSize: 13, fontWeight: "900" },
  required: { color: colors.danger },
  count: { color: colors.muted, fontSize: 11, fontWeight: "800" },
  hint: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  actions: { flexDirection: "row", gap: 8 },
  action: { flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.brandPale, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 8 },
  actionMuted: { opacity: 0.5 },
  actionText: { color: colors.brandDark, fontSize: 11, fontWeight: "900" },
  gallery: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingVertical: 2 },
  photoWrap: { position: "relative", width: "48%", flexGrow: 1, maxWidth: "49%" },
  photo: { width: "100%", aspectRatio: 1, borderRadius: 14, backgroundColor: "#E5EAE8" },
  placeholder: { alignItems: "center", justifyContent: "center" },
  loadingText: { color: colors.muted, fontSize: 10, fontWeight: "700", marginTop: 5 },
  remove: { position: "absolute", right: 5, top: 5, width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(20,30,27,.8)", alignItems: "center", justifyContent: "center" },
  keptBadge: { position: "absolute", left: 5, bottom: 5, borderRadius: 6, backgroundColor: "rgba(16,94,72,.88)", paddingHorizontal: 6, paddingVertical: 3 },
  keptText: { color: "#fff", fontSize: 8, fontWeight: "900", letterSpacing: 0.6 },
  empty: { minHeight: 58, borderWidth: 1, borderStyle: "dashed", borderColor: colors.border, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  emptyText: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  error: { color: colors.danger, fontSize: 11, fontWeight: "800", lineHeight: 16 },
  fullscreen: { flex: 1, backgroundColor: "rgba(0,0,0,.96)", alignItems: "center", justifyContent: "center" },
  fullscreenImage: { width: "100%", height: "100%" },
  fullscreenClose: { position: "absolute", zIndex: 2, top: 54, right: 18, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,.16)", alignItems: "center", justifyContent: "center" },
});
