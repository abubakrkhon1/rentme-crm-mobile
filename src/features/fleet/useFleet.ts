import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api/client";
import type { FleetListResponse, VehicleStatus } from "@/lib/api/types";

export type FleetFilter = "all" | VehicleStatus;

export function useFleet(search: string, status: FleetFilter) {
  const params = new URLSearchParams({ search: search.trim(), status });
  return useQuery({ queryKey: ["fleet", { search, status }], queryFn: () => apiRequest<FleetListResponse>(`/fleet?${params}`), placeholderData: (previous) => previous });
}
