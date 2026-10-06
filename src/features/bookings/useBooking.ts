import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api/client";
import type { BookingDetail, BookingDocuments, BookingOverview } from "@/lib/api/types";
import { queryClient } from "@/lib/query/client";

const bookingQuery = (bookingId: string) => ({
  queryKey: ["booking", bookingId] as const,
  queryFn: () => apiRequest<BookingDetail>(`/bookings/${bookingId}`),
  staleTime: 120_000,
});

const bookingOverviewQuery = (bookingId: string) => ({
  queryKey: ["booking-overview", bookingId] as const,
  queryFn: () => apiRequest<BookingOverview>(`/bookings/${bookingId}/overview`),
  staleTime: 120_000,
});

export function useBooking(bookingId?: string) {
  return useQuery({
    ...bookingQuery(bookingId ?? ""),
    enabled: Boolean(bookingId),
  });
}

export function useBookingOverview(bookingId?: string, enabled = true) {
  return useQuery({ ...bookingOverviewQuery(bookingId ?? ""), enabled: Boolean(bookingId) && enabled });
}

export function useBookingDocuments(bookingId?: string, enabled = true) {
  return useQuery({ queryKey: ["booking-documents", bookingId], queryFn: () => apiRequest<BookingDocuments>(`/bookings/${bookingId}/documents`), enabled: Boolean(bookingId) && enabled, staleTime: 300_000 });
}

export function prefetchBookingScreen(bookingId: string) {
  return Promise.all([
    queryClient.prefetchQuery(bookingQuery(bookingId)),
    queryClient.prefetchQuery(bookingOverviewQuery(bookingId)),
  ]);
}
