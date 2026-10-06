import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api/client";
import type { BookingListResponse } from "@/lib/api/types";

export function useBookings(search: string) {
  return useQuery({
    queryKey: ["bookings", { search }],
    queryFn: () =>
      apiRequest<BookingListResponse>(
        `/bookings?search=${encodeURIComponent(search.trim())}`,
      ),
    placeholderData: (previous) => previous,
  });
}
