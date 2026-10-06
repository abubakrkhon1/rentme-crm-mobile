import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api/client";
import type { VehicleDetail } from "@/lib/api/types";

export function useVehicle(vehicleId?: string) {
  return useQuery({ queryKey: ["vehicle", vehicleId], queryFn: () => apiRequest<VehicleDetail>(`/fleet/${vehicleId}`), enabled: Boolean(vehicleId) });
}
