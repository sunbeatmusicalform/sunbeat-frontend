// ─── Types ───────────────────────────────────────────────────────────────────

export type TenantRef =
  | { type: "subdomain"; value: string }
  | { type: "custom_domain"; value: string }
  | null;

/**
 * The two canonical Sunbeat base domains.
 * "sunbeat.pro"    → global / USD market
 * "sunbeat.com.br" → brazil / BRL market
 */
export type WorkspaceBaseDomain = "sunbeat.pro" | "sunbeat.com.br";

// ─── Constants ───────────────────────────────────────────────────────────────

/** Root/marketing hosts — never treated as workspace subdomains. */
const ROOT_HOSTS = new Set([
  "sunbeat.pro",
  "www.sunbeat.pro",
  "sunbeat.com.br",
  "www.sunbeat.com.br",
]);

/**
 * All base domains that support workspace subdomains.
 * Order matters — checked from first to last in getTenantFromHost.
 */
const WORKSPACE_BASE_DOMAINS: readonly WorkspaceBaseDomain[] = [
  "sunbeat.pro",
  "sunbeat.com.br",
];

// ─── Utilities ────────────────────────────────────────────────────────────────

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

/**
 * Builds an absolute workspace URL.
 *
 * @param workspaceSlug  The workspace identifier (e.g. "atabaque").
 * @param path           Internal path (must start with "/"). Defaults to "/app".
 * @param options.domain The base domain to use. Defaults to "sunbeat.pro".
 *
 * Examples:
 *   buildWorkspaceUrl("atabaque")
 *     → "https://atabaque.sunbeat.pro/app"
 *   buildWorkspaceUrl("atabaque", "/app/settings/plan", { domain: "sunbeat.com.br" })
 *     → "https://atabaque.sunbeat.com.br/app/settings/plan"
 */
export function buildWorkspaceUrl(
  workspaceSlug: string,
  path = "/app",
  options?: { domain?: WorkspaceBaseDomain | null }
) {
  const slug = sanitizeWorkspaceSlug(workspaceSlug);
  const safePath =
    typeof path === "string" && path.startsWith("/") ? path : "/app";
  const domain: WorkspaceBaseDomain = options?.domain ?? "sunbeat.pro";

  if (!slug) {
    return safePath;
  }

  return `https://${slug}.${domain}${safePath}`;
}

/**
 * Extracts the tenant (workspace) reference from an HTTP Host header.
 *
 * Resolution priority:
 *   1. Root/marketing host → null (not a workspace)
 *   2. Known subdomain (.sunbeat.pro or .sunbeat.com.br) → { type: "subdomain" }
 *   3. Everything else → { type: "custom_domain" } (white-label, future)
 */
export function getTenantFromHost(hostHeader: string | null): TenantRef {
  const host = normalizeHostHeader(hostHeader);
  if (!host) return null;

  // Marketing / root hosts — not workspace routes
  if (isSunbeatRootHost(host)) return null;

  // Workspace subdomain on any known base domain
  for (const baseDomain of WORKSPACE_BASE_DOMAINS) {
    const suffix = `.${baseDomain}`;
    if (host.endsWith(suffix)) {
      const sub = host.slice(0, -suffix.length);
      if (!sub || sub === "www") return null;
      return { type: "subdomain", value: sub };
    }
  }

  // White-label custom domain (future)
  return { type: "custom_domain", value: host };
}
