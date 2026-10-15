import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api/client";
import type { CustomerDetail, CustomerDocuments, CustomerOverview, CustomerTransactions } from "@/lib/api/types";

export function useCustomer(customerId?: string) {
  return useQuery({ queryKey: ["customer", customerId], queryFn: () => apiRequest<CustomerDetail>(`/customers/${customerId}`), enabled: Boolean(customerId) });
}

export function useCustomerOverview(customerId?: string, enabled = true) {
  return useQuery({ queryKey: ["customer-overview", customerId], queryFn: () => apiRequest<CustomerOverview>(`/customers/${customerId}/overview`), enabled: Boolean(customerId) && enabled, staleTime: 120_000 });
}

export function useCustomerTransactions(customerId?: string, enabled = true) {
  return useQuery({ queryKey: ["customer-transactions", customerId], queryFn: () => apiRequest<CustomerTransactions>(`/customers/${customerId}/transactions`), enabled: Boolean(customerId) && enabled, staleTime: 120_000 });
}

export function useCustomerDocuments(customerId?: string, enabled = true) {
  return useQuery({ queryKey: ["customer-documents", customerId], queryFn: () => apiRequest<CustomerDocuments>(`/customers/${customerId}/documents`), enabled: Boolean(customerId) && enabled, staleTime: 300_000 });
}

export type LedgerAction = "charge" | "payment" | "edit_required_deposit" | "collect_deposit" | "refund_deposit" | "apply_deposit";
export type LedgerPayload = { action: LedgerAction; amount: number; title?: string; category?: string; method?: string; bookingId?: string | null; notes?: string; transactionDate?: string };

export function useCustomerLedgerAction(customerId?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: LedgerPayload) => apiRequest<{ success: true; transactionId: string | null }>(`/customers/${customerId}/ledger`, { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["customer-overview", customerId] }),
        client.invalidateQueries({ queryKey: ["customer-transactions", customerId] }),
        client.invalidateQueries({ queryKey: ["customers"] }),
        client.invalidateQueries({ queryKey: ["transactions"] }),
      ]);
    },
  });
}
