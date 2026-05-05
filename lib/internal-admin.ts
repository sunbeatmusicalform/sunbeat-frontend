type InternalAdminUserLike = {
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
};

const DEFAULT_INTERNAL_ADMIN_DOMAINS = ["sunbeat.pro", "sunbeat.com.br"] as const;
const INTERNAL_ADMIN_ROLES = new Set(["admin", "internal_ops"]);

function parseCsvEnv(value: string | undefined) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeRoleValues(candidate: unknown) {
  if (typeof candidate === "string") {
    return [candidate.trim().toLowerCase()].filter(Boolean);
  }

  if (Array.isArray(candidate)) {
    return candidate
      .map((item) =>
        typeof item === "string" ? item.trim().toLowerCase() : ""
      )
      .filter(Boolean);
  }

  return [];
}

export function isInternalAdminUser(user: InternalAdminUserLike | null | undefined) {
  const roleValues = [
    ...normalizeRoleValues(user?.app_metadata?.role),
    ...normalizeRoleValues(user?.app_metadata?.roles),
    ...normalizeRoleValues(user?.user_metadata?.role),
    ...normalizeRoleValues(user?.user_metadata?.roles),
  ];

  if (roleValues.some((role) => INTERNAL_ADMIN_ROLES.has(role))) {
    return true;
  }

  const normalizedEmail = String(user?.email || "").trim().toLowerCase();
  if (!normalizedEmail.includes("@")) {
    return false;
  }

  const allowedEmails = new Set(
    parseCsvEnv(process.env.SUNBEAT_INTERNAL_ADMIN_EMAILS)
  );
  const allowedDomains = new Set([
    ...DEFAULT_INTERNAL_ADMIN_DOMAINS,
    ...parseCsvEnv(process.env.SUNBEAT_INTERNAL_ADMIN_DOMAINS),
  ]);
  const [, emailDomain = ""] = normalizedEmail.split("@");

  return allowedEmails.has(normalizedEmail) || allowedDomains.has(emailDomain);
}
