import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import type { BookingExtensionSetup, InspectionInput } from "@/lib/api/types";

export type ExtensionPayload = { vehicleId: string; pickupDate: string; returnDate: string; dailyRate: number; rentalSubtotal: number; insuranceTotal: number; totalCost: number; extensionPickupInspection: InspectionInput; parentReturnInspection?: InspectionInput };
export function useBookingExtensionSetup(id?: string) { return useQuery({ queryKey: ["booking-extension", id], queryFn: () => apiRequest<BookingExtensionSetup>(`/bookings/${id}/extension`), enabled: Boolean(id) }); }
export function useCreateBookingExtension(id?: string) { const client = useQueryClient(); return useMutation({ mutationFn: (payload: ExtensionPayload) => apiRequest<{ success: true; bookingId: string }>(`/bookings/${id}/extension`, { method: "POST", body: JSON.stringify(payload) }), onSuccess: () => { void client.invalidateQueries({ queryKey: ["bookings"] }); void client.invalidateQueries({ queryKey: ["booking", id] }); } }); }
