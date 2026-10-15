let activeWorkspaceId: string | null = null;

export function getActiveWorkspaceId() {
  return activeWorkspaceId;
}

export function setActiveWorkspaceId(workspaceId: string | null) {
  activeWorkspaceId = workspaceId;
}
