import { headers } from "next/headers";

import { getTenantFromHost, type TenantRef } from "./tenant";

export const DEFAULT_WORKSPACE_FALLBACK_SLUG = "atabaque";

export type WorkspaceTenantResolutionSource =
  | "subdomain"
  | "pathname"
  | "controlled_fallback";

export type WorkspaceTenantFallbackReason =
  | "missing_host"
  | "root_host"
  | "custom_domain"
  | "unknown_host";

export type WorkspaceTenantResolution = {
  workspaceSlug: string;
  tenant: TenantRef;
  host: string;
  pathname: string | null;
  source: WorkspaceTenantResolutionSource;
  fallbackWorkspaceSlug: string;
  fallbackReason: WorkspaceTenantFallbackReason | null;
};

type ResolveWorkspaceTenantOptions = {
  host?: string | null;
  forwardedHost?: string | null;
  pathname?: string | null;
  fallbackWorkspaceSlug?: string;
};

function normalizeHostHeader(hostHeader?: string | null) {
  return String(hostHeader || "")
    .split(",")[0]
    .trim()
    .split(":")[0]
    .toLowerCase();
}

function normalizePathname(pathname?: string | null) {
  const normalized = String(pathname || "").split("?")[0].trim();
  return normalized || null;
}

function getWorkspaceSlugFromPathname(pathname?: string | null) {
  const normalizedPathname = normalizePathname(pathname);
  if (!normalizedPathname) {
    return null;
  }

  const segments = normalizedPathname.split("/").filter(Boolean);
  if (segments.length < 2) {
    return null;
  }

  const [surface, workspaceSlug] = segments;
  if (
    (surface === "intake" || surface === "clearance") &&
    workspaceSlug
  ) {
    return workspaceSlug;
  }

  return null;
}

function getFallbackReason(
  host: string,
  tenant: TenantRef
): WorkspaceTenantFallbackReason {
  if (!host) {
    return "missing_host";
  }

  if (tenant?.type === "custom_domain") {
    return "custom_domain";
  }

  if (host === "sunbeat.pro" || host === "www.sunbeat.pro") {
    return "root_host";
  }

  return "unknown_host";
}

export function resolveWorkspaceTenant(
  args: ResolveWorkspaceTenantOptions = {}
): WorkspaceTenantResolution {
  const fallbackWorkspaceSlug =
    args.fallbackWorkspaceSlug || DEFAULT_WORKSPACE_FALLBACK_SLUG;
  const host = normalizeHostHeader(args.host || args.forwardedHost);
  const pathname = normalizePathname(args.pathname);
  const tenant = getTenantFromHost(host);

  if (tenant?.type === "subdomain") {
    return {
      workspaceSlug: tenant.value,
      tenant,
      host,
      pathname,
      source: "subdomain",
      fallbackWorkspaceSlug,
      fallbackReason: null,
    };
  }

  const pathnameWorkspaceSlug = getWorkspaceSlugFromPathname(pathname);
  if (pathnameWorkspaceSlug) {
    return {
      workspaceSlug: pathnameWorkspaceSlug,
      tenant,
      host,
      pathname,
      source: "pathname",
      fallbackWorkspaceSlug,
      fallbackReason: null,
    };
  }

  return {
    workspaceSlug: fallbackWorkspaceSlug,
    tenant,
    host,
    pathname,
    source: "controlled_fallback",
    fallbackWorkspaceSlug,
    fallbackReason: getFallbackReason(host, tenant),
  };
}

export async function resolveWorkspaceTenantFromHeaders(
  args: Pick<
    ResolveWorkspaceTenantOptions,
    "pathname" | "fallbackWorkspaceSlug"
  > = {}
) {
  const headerStore = await headers();

  return resolveWorkspaceTenant({
    host: headerStore.get("host"),
    forwardedHost: headerStore.get("x-forwarded-host"),
    pathname: args.pathname,
    fallbackWorkspaceSlug: args.fallbackWorkspaceSlug,
  });
}

export async function resolveWorkspaceSlugFromHeaders(
  args: Pick<
    ResolveWorkspaceTenantOptions,
    "pathname" | "fallbackWorkspaceSlug"
  > = {}
) {
  const resolvedTenant = await resolveWorkspaceTenantFromHeaders(args);
  return resolvedTenant.workspaceSlug;
}
