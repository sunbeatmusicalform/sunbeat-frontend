export type TenantRef =
  | { type: "subdomain"; value: string }
  | { type: "custom_domain"; value: string }
  | null;

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

export function buildWorkspaceUrl(workspaceSlug: string, path = "/app") {
  const slug = sanitizeWorkspaceSlug(workspaceSlug);
  const safePath =
    typeof path === "string" && path.startsWith("/") ? path : "/app";

  if (!slug) {
    return safePath;
  }

  return `https://${slug}.sunbeat.pro${safePath}`;
}

export function getTenantFromHost(hostHeader: string | null): TenantRef {
  const host = normalizeHostHeader(hostHeader);
  if (!host) return null;

  // marketing/root
  if (isSunbeatRootHost(host)) return null;

  // subdomain tenant
  const suffix = ".sunbeat.pro";
  if (host.endsWith(suffix)) {
    const sub = host.slice(0, -suffix.length);
    if (!sub || sub === "www") return null;
    return { type: "subdomain", value: sub };
  }

  // white label domain (futuro)
  return { type: "custom_domain", value: host };
}
