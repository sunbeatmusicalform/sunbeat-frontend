import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getWorkspaceEntitlements } from "@/lib/billing/entitlements";
import {
  getFileExtension,
  resolveUploadBucket,
  UPLOAD_RULES,
} from "@/lib/storage/upload-policy";
import { verifyUploadVerificationGrant } from "@/lib/security/upload-verification";

export const runtime = "nodejs";

function getMetadataValue(
  data: Record<string, unknown>,
  metadata: Record<string, unknown>,
  keys: string[]
) {
  for (const key of keys) {
    if (metadata[key] != null) return metadata[key];
    if (data[key] != null) return data[key];
  }
  return null;
}

export async function POST(request: Request) {
  let token = "";
  try {
    const body = (await request.json()) as { verification_token?: unknown };
    token = typeof body.verification_token === "string" ? body.verification_token : "";
  } catch {
    return NextResponse.json({ ok: false, error: "Payload inválido." }, { status: 400 });
  }

  const grant = verifyUploadVerificationGrant(token);
  if (!grant) {
    return NextResponse.json(
      { ok: false, error: "Verificação de upload inválida ou expirada." },
      { status: 401 }
    );
  }

  const expectedBucket = resolveUploadBucket(grant.kind);
  const expectedPrefix = `${grant.workspaceSlug}/drafts/`;
  if (grant.bucket !== expectedBucket || !grant.storagePath.startsWith(expectedPrefix)) {
    return NextResponse.json({ ok: false, error: "Escopo de upload inválido." }, { status: 403 });
  }

  const rule = UPLOAD_RULES[grant.kind];
  let planLimitBytes = rule.maxSizeBytes;
  try {
    const entitlements = await getWorkspaceEntitlements(grant.workspaceSlug);
    if (grant.kind === "audio") {
      planLimitBytes = Math.min(planLimitBytes, entitlements.audioUploadMb * 1024 * 1024);
    } else if (grant.kind === "cover") {
      planLimitBytes = Math.min(planLimitBytes, entitlements.coverUploadMb * 1024 * 1024);
    }
  } catch (error) {
    console.error("[uploads/verify] Entitlements indisponíveis:", error);
    return NextResponse.json({ ok: false, error: "Limites indisponíveis." }, { status: 503 });
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(grant.bucket)
    .info(grant.storagePath);

  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: "O arquivo enviado não foi encontrado." },
      { status: 404 }
    );
  }

  const record = data as unknown as Record<string, unknown>;
  const metadata =
    record.metadata && typeof record.metadata === "object"
      ? (record.metadata as Record<string, unknown>)
      : {};
  const actualSize = Number(
    getMetadataValue(record, metadata, ["size", "contentLength", "content_length"])
  );
  const actualMime = String(
    getMetadataValue(record, metadata, ["mimetype", "contentType", "content_type"]) || ""
  ).toLowerCase();
  const extension = getFileExtension(grant.storagePath);

  const invalid =
    !Number.isFinite(actualSize) ||
    actualSize <= 0 ||
    actualSize > planLimitBytes ||
    !rule.allowedExtensions.includes(extension) ||
    !actualMime ||
    !rule.allowedMimeTypes.includes(actualMime);

  if (invalid) {
    const { error: removeError } = await supabase.storage
      .from(grant.bucket)
      .remove([grant.storagePath]);
    if (removeError) {
      console.error("[uploads/verify] Falha ao remover upload inválido:", removeError);
    }
    return NextResponse.json(
      { ok: false, error: "O conteúdo real do arquivo não atende à política de upload." },
      { status: 422 }
    );
  }

  return NextResponse.json({
    ok: true,
    size_bytes: actualSize,
    mime_type: actualMime,
  });
}
