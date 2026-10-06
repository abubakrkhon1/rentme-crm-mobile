import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api/client";
import type { MobileSession } from "@/lib/api/types";

export function useMobileSession(enabled = true) {
  return useQuery({
    queryKey: ["mobile-session"],
    queryFn: () => apiRequest<MobileSession>("/me"),
    enabled,
  });
}
