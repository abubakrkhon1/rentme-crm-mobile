import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api/client";
import type { TransactionListResponse, TransactionType } from "@/lib/api/types";

export type TransactionFilter = "all" | TransactionType;

export function useTransactions(search: string, type: TransactionFilter) {
  const params = new URLSearchParams({ search: search.trim(), type });
  return useQuery({ queryKey: ["transactions", { search, type }], queryFn: () => apiRequest<TransactionListResponse>(`/transactions?${params}`), placeholderData: (previous) => previous });
}
