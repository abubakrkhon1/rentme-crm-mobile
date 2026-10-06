import type { PendingInspectionPhoto } from "@/features/bookings/InspectionPhotoPicker";
import { supabase } from "@/lib/supabase/client";

export async function uploadInspectionPhotos(
  photos: PendingInspectionPhoto[],
  organizationId: string,
  bookingId: string,
  inspectionType: "pickup" | "return",
) {
  const paths: string[] = [];
  const uploadedPaths: string[] = [];

  try {
    for (const photo of photos) {
      if (photo.storagePath) {
        paths.push(photo.storagePath);
        continue;
      }
      if (!photo.uri) continue;
      const contentType = photo.mimeType?.startsWith("image/") ? photo.mimeType : "image/jpeg";
      const extension = extensionFor(contentType, photo.fileName);
      const path = `${organizationId}/${bookingId}/${inspectionType}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
      const bytes = await (await fetch(photo.uri)).arrayBuffer();
      const { error } = await supabase.storage.from("booking_car_status").upload(path, bytes, { contentType, upsert: false });
      if (error) throw new Error(error.message);
      paths.push(path);
      uploadedPaths.push(path);
    }
    return { paths, uploadedPaths };
  } catch (error) {
    if (uploadedPaths.length) await supabase.storage.from("booking_car_status").remove(uploadedPaths);
    throw new Error(error instanceof Error ? `Photo upload failed: ${error.message}` : "Photo upload failed.");
  }
}

export async function removeUploadedInspectionPhotos(paths: string[]) {
  if (paths.length) await supabase.storage.from("booking_car_status").remove(paths);
}

function extensionFor(contentType: string, fileName?: string | null) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/heic" || contentType === "image/heif") return "heic";
  const candidate = fileName?.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  return candidate && ["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(candidate) ? candidate : "jpg";
}
