import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api/client";
import type { FinishBookingPayload, FinishBookingSetup } from "@/lib/api/types";

export function useFinishBookingSetup(bookingId?: string) {
  return useQuery({ queryKey: ["finish-booking", bookingId], queryFn: () => apiRequest<FinishBookingSetup>(`/bookings/${bookingId}/finish`), enabled: Boolean(bookingId) });
}

export function useFinishBooking(bookingId?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: FinishBookingPayload) => apiRequest<{ success: true }>(`/bookings/${bookingId}/finish`, { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["booking", bookingId] });
      void client.invalidateQueries({ queryKey: ["booking-overview", bookingId] });
      void client.invalidateQueries({ queryKey: ["bookings"] });
      void client.invalidateQueries({ queryKey: ["today"] });
      void client.invalidateQueries({ queryKey: ["customers"] });
      void client.invalidateQueries({ queryKey: ["fleet"] });
    },
  });
}
