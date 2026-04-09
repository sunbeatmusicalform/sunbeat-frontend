import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { sanitizeWorkspaceSlug } from "@/lib/tenant";

export type WorkspaceAccessSource =
  | "workspace_hint"
  | "user_metadata"
  | "workspace_users"
  | "owner_email";

export type AccessibleWorkspace = {
  slug: string;
  name: string;
  sources: WorkspaceAccessSource[];
};

type ListAccessibleWorkspacesArgs = {
  userId?: string | null;
  email?: string | null;
  workspaceHint?: string | null;
  metadataWorkspaceSlug?: unknown;
};

type WorkspaceRecord = {
  slug?: string | null;
  name?: string | null;
};

function appendSource(
  sourceMap: Map<string, Set<WorkspaceAccessSource>>,
  workspaceSlug: unknown,
  source: WorkspaceAccessSource
) {
  const slug = sanitizeWorkspaceSlug(workspaceSlug);
  if (!slug) {
    return;
  }

  const existing = sourceMap.get(slug) ?? new Set<WorkspaceAccessSource>();
  existing.add(source);
  sourceMap.set(slug, existing);
}

function normalizeWorkspaceRecord(row: WorkspaceRecord) {
  const slug = sanitizeWorkspaceSlug(row.slug);
  if (!slug) {
    return null;
  }

  return {
    slug,
    name:
      typeof row.name === "string" && row.name.trim() ? row.name.trim() : slug,
  };
}

export async function listAccessibleWorkspacesForUser(
  args: ListAccessibleWorkspacesArgs
) {
  const admin = createSupabaseAdmin();
  const workspaceSources = new Map<string, Set<WorkspaceAccessSource>>();

  appendSource(workspaceSources, args.workspaceHint, "workspace_hint");
  appendSource(workspaceSources, args.metadataWorkspaceSlug, "user_metadata");

  if (args.userId) {
    const { data, error } = await admin
      .from("workspace_users")
      .select("workspace_slug")
      .eq("user_id", args.userId);

    if (!error) {
      (data ?? []).forEach((row) => {
        appendSource(workspaceSources, row.workspace_slug, "workspace_users");
      });
    }
  }

  const normalizedEmail = String(args.email || "").trim().toLowerCase();
  if (normalizedEmail) {
    const { data, error } = await admin
      .from("workspaces")
      .select("slug, name")
      .eq("owner_email", normalizedEmail);

    if (!error) {
      (data ?? []).forEach((row) => {
        const normalized = normalizeWorkspaceRecord(row);
        if (!normalized) {
          return;
        }

        appendSource(workspaceSources, normalized.slug, "owner_email");
      });
    }
  }

  const workspaceSlugs = Array.from(workspaceSources.keys());
  if (workspaceSlugs.length === 0) {
    return [] satisfies AccessibleWorkspace[];
  }

  const { data: workspaceRows, error: workspaceError } = await admin
    .from("workspaces")
    .select("slug, name")
    .in("slug", workspaceSlugs)
    .order("name", { ascending: true });

  if (workspaceError) {
    throw new Error(workspaceError.message);
  }

  return (workspaceRows ?? [])
    .map(normalizeWorkspaceRecord)
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .map((workspace) => ({
      slug: workspace.slug,
      name: workspace.name,
      sources: Array.from(workspaceSources.get(workspace.slug) ?? []),
    }))
    .sort((a, b) => a.name.localeCompare(b.name) || a.slug.localeCompare(b.slug));
}

export function choosePreferredWorkspace(args: {
  workspaces: AccessibleWorkspace[];
  preferredSlugs?: Array<string | null | undefined>;
}) {
  for (const candidate of args.preferredSlugs ?? []) {
    const slug = sanitizeWorkspaceSlug(candidate);
    if (!slug) {
      continue;
    }

    const match = args.workspaces.find((workspace) => workspace.slug === slug);
    if (match) {
      return match;
    }
  }

  if (args.workspaces.length === 1) {
    return args.workspaces[0];
  }

  return null;
}

export function canAccessWorkspace(args: {
  workspaceSlug: string;
  workspaces: AccessibleWorkspace[];
}) {
  const targetSlug = sanitizeWorkspaceSlug(args.workspaceSlug);
  if (!targetSlug) {
    return false;
  }

  return args.workspaces.some((workspace) => workspace.slug === targetSlug);
}
