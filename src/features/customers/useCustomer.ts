import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api/client";
import type { CustomerDetail } from "@/lib/api/types";

export function useCustomer(customerId?: string) {
  return useQuery({ queryKey: ["customer", customerId], queryFn: () => apiRequest<CustomerDetail>(`/customers/${customerId}`), enabled: Boolean(customerId) });
}
