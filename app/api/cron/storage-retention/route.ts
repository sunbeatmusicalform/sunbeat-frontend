import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { FREE_ASSET_RETENTION_DAYS } from "@/lib/billing/plan-capabilities";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type StorageEntry = {
  id?: string | null;
  name: string;
  created_at?: string | null;
  updated_at?: string | null;
  metadata?: Record<string, unknown> | null;
};

function getBuckets() {
  return Array.from(
    new Set(
      [
        process.env.SUPABASE_COVERS_BUCKET?.trim() || "sunbeat-covers",
        process.env.SUPABASE_AUDIO_BUCKET?.trim() || "sunbeat-audio",
        process.env.SUPABASE_ASSETS_BUCKET?.trim() ||
          process.env.SUPABASE_COVERS_BUCKET?.trim() ||
          "sunbeat-covers",
      ].filter(Boolean)
    )
  );
}

function isFolder(entry: StorageEntry) {
  return !entry.id && !entry.metadata;
}

function isExpired(entry: StorageEntry, cutoffMs: number) {
  const createdAt = entry.created_at || entry.updated_at;
  if (!createdAt) return false;
  const createdAtMs = Date.parse(createdAt);
  return Number.isFinite(createdAtMs) && createdAtMs < cutoffMs;
}

async function listExpiredPaths(args: {
  bucket: string;
  workspaceSlug: string;
  cutoffMs: number;
}) {
  const supabase = createSupabaseAdmin();
  const pendingFolders = [args.workspaceSlug];
  const visited = new Set<string>();
  const expiredPaths: string[] = [];

  while (pendingFolders.length > 0 && visited.size < 5_000) {
    const folder = pendingFolders.shift();
    if (!folder || visited.has(folder)) continue;
    visited.add(folder);

    let offset = 0;
    while (true) {
      const { data, error } = await supabase.storage
        .from(args.bucket)
        .list(folder, {
          limit: 100,
          offset,
          sortBy: { column: "name", order: "asc" },
        });

      if (error) {
        throw new Error(`${args.bucket}/${folder}: ${error.message}`);
      }

      const entries = (data ?? []) as StorageEntry[];
      for (const entry of entries) {
        if (!entry.name || entry.name === ".emptyFolderPlaceholder") continue;
        const path = `${folder}/${entry.name}`;
        if (isFolder(entry)) {
          pendingFolders.push(path);
        } else if (isExpired(entry, args.cutoffMs)) {
          expiredPaths.push(path);
        }
      }

      if (entries.length < 100) break;
      offset += entries.length;
    }
  }

  return expiredPaths;
}

async function removeInChunks(bucket: string, paths: string[]) {
  const supabase = createSupabaseAdmin();
  let removed = 0;

  for (let index = 0; index < paths.length; index += 100) {
    const chunk = paths.slice(index, index + 100);
    const { error } = await supabase.storage.from(bucket).remove(chunk);
    if (error) throw new Error(`${bucket}: ${error.message}`);
    removed += chunk.length;
  }

  return removed;
}

async function listEligibleWorkspaces() {
  const supabase = createSupabaseAdmin();
  const { data: workspaces, error: workspaceError } = await supabase
    .from("workspaces")
    .select("slug, plan_id")
    .eq("plan_id", "free")
    .order("slug", { ascending: true })
    .limit(500);

  if (workspaceError) throw new Error(workspaceError.message);
  const slugs = (workspaces ?? []).map((workspace) => String(workspace.slug));
  if (slugs.length === 0) return [];

  const { data: memberships, error: membershipError } = await supabase
    .from("workspace_users")
    .select("workspace_slug, user_id, role")
    .in("workspace_slug", slugs)
    .eq("role", "owner");

  if (membershipError) throw new Error(membershipError.message);

  const eligible: string[] = [];
  for (const membership of memberships ?? []) {
    const { data, error } = await supabase.auth.admin.getUserById(
      String(membership.user_id)
    );
    if (error || !data.user) continue;

    const metadata = data.user.user_metadata ?? {};
    if (
      metadata.self_service === true &&
      Number(metadata.asset_retention_days) === FREE_ASSET_RETENTION_DAYS
    ) {
      eligible.push(String(membership.workspace_slug));
    }
  }

  return Array.from(new Set(eligible));
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  const cutoffMs =
    Date.now() - FREE_ASSET_RETENTION_DAYS * 24 * 60 * 60 * 1_000;
  const deletionEnabled = process.env.STORAGE_RETENTION_DELETE_ENABLED !== "false";
  const buckets = getBuckets();
  const failures: Array<{ workspaceSlug: string; bucket: string }> = [];
  let candidates = 0;
  let removed = 0;

  try {
    const workspaces = await listEligibleWorkspaces();

    for (const workspaceSlug of workspaces) {
      for (const bucket of buckets) {
        try {
          const expiredPaths = await listExpiredPaths({
            bucket,
            workspaceSlug,
            cutoffMs,
          });
          candidates += expiredPaths.length;
          if (deletionEnabled && expiredPaths.length > 0) {
            removed += await removeInChunks(bucket, expiredPaths);
          }
        } catch (error) {
          failures.push({ workspaceSlug, bucket });
          console.error("[storage-retention] Falha ao processar workspace:", {
            workspaceSlug,
            bucket,
            error,
          });
        }
      }
    }

    return NextResponse.json({
      ok: failures.length === 0,
      retention_days: FREE_ASSET_RETENTION_DAYS,
      deletion_enabled: deletionEnabled,
      workspaces_checked: workspaces.length,
      candidates,
      removed,
      failed_scans: failures.length,
    });
  } catch (error) {
    console.error("[storage-retention] Falha geral:", error);
    return NextResponse.json(
      { ok: false, error: "Falha ao executar retenção de storage." },
      { status: 500 }
    );
  }
}
