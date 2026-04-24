export type TenantRef =
  | { type: "subdomain"; value: string }
  | { type: "custom_domain"; value: string }
  | null;

export type WorkspaceBaseDomain = "sunbeat.pro" | "sunbeat.com.br";

const WORKSPACE_BASE_DOMAINS = [
  "sunbeat.pro",
  "sunbeat.com.br",
] as const satisfies readonly WorkspaceBaseDomain[];

const ROOT_HOSTS = new Set([
  "sunbeat.pro",
  "www.sunbeat.pro",
  "sunbeat.com.br",
  "www.sunbeat.com.br",
]);

export function normalizeHostHeader(hostHeader: string | null | undefined) {
  return String(hostHeader || "")
    .split(",")[0]
    .trim()
    .split(":")[0]
    .toLowerCase();
}

export function isSunbeatRootHost(hostHeader: string | null | undefined) {
  const host = normalizeHostHeader(hostHeader);
  return ROOT_HOSTS.has(host);
}

export function sanitizeWorkspaceSlug(value: unknown) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return normalized || null;
}

function normalizeWorkspaceDomain(
  value: string | null | undefined
): WorkspaceBaseDomain | null {
  const normalized = normalizeHostHeader(value).replace(/^www\./, "");

  if (WORKSPACE_BASE_DOMAINS.includes(normalized as WorkspaceBaseDomain)) {
    return normalized as WorkspaceBaseDomain;
  }

  return null;
}

export function buildWorkspaceUrl(
  workspaceSlug: string,
  path = "/app",
  options?: { domain?: WorkspaceBaseDomain | null }
) {
  const slug = sanitizeWorkspaceSlug(workspaceSlug);
  const safePath =
    typeof path === "string" && path.startsWith("/") ? path : "/app";
  const domain = normalizeWorkspaceDomain(options?.domain) ?? "sunbeat.pro";

  if (!slug) {
    return safePath;
  }

  return `https://${slug}.${domain}${safePath}`;
}

export function getTenantFromHost(hostHeader: string | null): TenantRef {
  const host = normalizeHostHeader(hostHeader);
  if (!host) return null;

  // marketing/root
  if (isSunbeatRootHost(host)) return null;

  // subdomain tenant
  for (const domain of WORKSPACE_BASE_DOMAINS) {
    const suffix = `.${domain}`;
    if (host.endsWith(suffix)) {
      const sub = host.slice(0, -suffix.length);
      if (!sub || sub === "www") return null;
      return { type: "subdomain", value: sub };
    }
  }

  // white label domain (futuro)
  return { type: "custom_domain", value: host };
}
