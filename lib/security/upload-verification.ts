import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { UploadKind } from "@/lib/storage/upload-policy";

type UploadVerificationGrant = {
  version: 1;
  bucket: string;
  storagePath: string;
  workspaceSlug: string;
  kind: UploadKind;
  expiresAt: number;
};

function getSigningSecret() {
  const secret =
    process.env.UPLOAD_VERIFICATION_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!secret) throw new Error("Upload verification signing secret is missing.");
  return secret;
}

function signature(payload: string) {
  return createHmac("sha256", getSigningSecret()).update(payload).digest("base64url");
}

export function createUploadVerificationGrant(
  value: Omit<UploadVerificationGrant, "version" | "expiresAt">
) {
  const grant: UploadVerificationGrant = {
    ...value,
    version: 1,
    expiresAt: Date.now() + 15 * 60 * 1_000,
  };
  const payload = Buffer.from(JSON.stringify(grant)).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function verifyUploadVerificationGrant(token: string) {
  const [payload, suppliedSignature] = token.split(".");
  if (!payload || !suppliedSignature) return null;

  const expectedSignature = signature(payload);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return null;
  }

  try {
    const grant = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as UploadVerificationGrant;
    if (
      grant.version !== 1 ||
      !grant.bucket ||
      !grant.storagePath ||
      !grant.workspaceSlug ||
      !grant.kind ||
      grant.expiresAt < Date.now()
    ) {
      return null;
    }
    return grant;
  } catch {
    return null;
  }
}
