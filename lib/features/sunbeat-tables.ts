import { sanitizeWorkspaceSlug } from "@/lib/tenant";

export function isSunbeatTablesEnabled(workspaceSlug?: string | null) {
  if (process.env.SUNBEAT_TABLES_ENABLED === "true") {
    return true;
  }

  const normalizedWorkspace = workspaceSlug
    ? sanitizeWorkspaceSlug(workspaceSlug)
    : null;
  if (!normalizedWorkspace) {
    return false;
  }

  const enabledWorkspaces =
    process.env.SUNBEAT_TABLES_WORKSPACES?.split(",")
      .map((item) => sanitizeWorkspaceSlug(item))
      .filter(Boolean) ?? [];

  return enabledWorkspaces.includes(normalizedWorkspace);
}
