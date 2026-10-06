import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api/client";
import type { TodaySummary } from "@/lib/api/types";

export function useToday() {
  return useQuery({
    queryKey: ["today"],
    queryFn: () => apiRequest<TodaySummary>("/dashboard/today"),
  });
}
