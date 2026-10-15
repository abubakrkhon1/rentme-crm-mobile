import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api/client";
import type { BookingListResponse } from "@/lib/api/types";

export function useBookings(search: string, filter = "all") {
  return useQuery({
    queryKey: ["bookings", { search, filter }],
    queryFn: () =>
      apiRequest<BookingListResponse>(
        `/bookings?search=${encodeURIComponent(search.trim())}&filter=${encodeURIComponent(filter)}`,
      ),
    placeholderData: (previous) => previous,
  });
}
