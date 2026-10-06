import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api/client";
import type { CustomerListResponse } from "@/lib/api/types";

export function useCustomers(search: string) {
  return useQuery({ queryKey: ["customers", { search }], queryFn: () => apiRequest<CustomerListResponse>(`/customers?search=${encodeURIComponent(search.trim())}`), placeholderData: (previous) => previous });
}
