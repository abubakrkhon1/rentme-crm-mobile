import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api/client";
import type { OrganizationSettingsInput, OrganizationSettingsResponse } from "@/lib/api/types";

export function useOrganizationSettings() {
  return useQuery({ queryKey: ["organization-settings"], queryFn: () => apiRequest<OrganizationSettingsResponse>("/settings/organization"), staleTime: 120_000 });
}

export function useUpdateOrganizationSettings() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: OrganizationSettingsInput) => apiRequest<{ organization: OrganizationSettingsResponse["organization"]; message: string }>("/settings/organization", { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => { void client.invalidateQueries({ queryKey: ["organization-settings"] }); void client.invalidateQueries({ queryKey: ["mobile-session"] }); },
  });
}

export function useOrganizationLogo() {
  const client = useQueryClient();
  const refresh = () => void client.invalidateQueries({ queryKey: ["organization-settings"] });
  const upload = useMutation({ mutationFn: (input: { base64: string; mimeType: string }) => apiRequest<{ url: string }>("/settings/organization/logo", { method: "POST", body: JSON.stringify(input) }), onSuccess: refresh });
  const remove = useMutation({ mutationFn: () => apiRequest<{ url: null }>("/settings/organization/logo", { method: "DELETE" }), onSuccess: refresh });
  return { upload, remove };
}
