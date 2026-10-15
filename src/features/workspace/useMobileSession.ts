import { useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError, apiRequest } from "@/lib/api/client";
import type { MobileSession } from "@/lib/api/types";
import { setActiveWorkspaceId } from "@/features/workspace/activeWorkspace";

export function useMobileSession(enabled = true) {
  return useQuery({
    queryKey: ["mobile-session"],
    queryFn: async () => {
      const session = await apiRequest<MobileSession>("/me");
      setActiveWorkspaceId(session.activeWorkspace.id);
      return session;
    },
    enabled,
    retry: (failureCount, error) => !(error instanceof ApiError && error.status === 401) && failureCount < 1,
  });
}

export function useSelectWorkspace() {
  const client = useQueryClient();

  return async (workspaceId: string) => {
    const current = client.getQueryData<MobileSession>(["mobile-session"]);
    const workspace = current?.workspaces.find((item) => item.id === workspaceId);
    if (!current || !workspace || current.activeWorkspace.id === workspaceId) return;

    const tenantQuery = (query: { queryKey: readonly unknown[] }) => query.queryKey[0] !== "mobile-session";
    await client.cancelQueries({ predicate: tenantQuery });
    setActiveWorkspaceId(workspaceId);
    client.setQueryData<MobileSession>(["mobile-session"], { ...current, activeWorkspace: workspace });
    await client.resetQueries({ predicate: tenantQuery });
  };
}
