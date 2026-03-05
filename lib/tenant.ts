export type TenantRef =
  | { type: "subdomain"; value: string }
  | { type: "custom_domain"; value: string }
  | null;

export function getTenantFromHost(hostHeader: string | null): TenantRef {
  const host = (hostHeader || "").split(":")[0].toLowerCase();
  if (!host) return null;

  // marketing/root
  if (host === "sunbeat.pro" || host === "www.sunbeat.pro") return null;

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