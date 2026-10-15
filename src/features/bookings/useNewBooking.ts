import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import type { NewBookingPayload, NewBookingSetup } from "@/lib/api/types";

export function useNewBookingSetup(pickupDate = "", returnDate = "") {
  const params = new URLSearchParams();
  if (pickupDate && returnDate) {
    params.set("pickupDate", pickupDate);
    params.set("returnDate", returnDate);
  }
  const query = params.toString();
  return useQuery({
    queryKey: ["new-booking-setup", { pickupDate, returnDate }],
    queryFn: () => apiRequest<NewBookingSetup>(`/bookings/new${query ? `?${query}` : ""}`),
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  });
}
export function useCreateBooking() { const client = useQueryClient(); return useMutation({ mutationFn: (payload: NewBookingPayload) => apiRequest<{ success: true; bookingId: string }>("/bookings/new", { method: "POST", body: JSON.stringify(payload) }), onSuccess: () => { void client.invalidateQueries({ queryKey: ["bookings"] }); void client.invalidateQueries({ queryKey: ["today"] }); void client.invalidateQueries({ queryKey: ["customers"] }); void client.invalidateQueries({ queryKey: ["fleet"] }); } }); }
