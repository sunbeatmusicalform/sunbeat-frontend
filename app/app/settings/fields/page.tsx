import { resolveWorkspaceSlugFromHeaders } from "@/lib/tenant-resolver";
import { FieldSettingsPageClient } from "./page-client";

export const metadata = { title: "Editar campos — Sunbeat" };

/**
 * Server Component wrapper for the field settings editor.
 *
 * Resolves workspaceSlug from the request host via the shared tenant resolver,
 * then passes it down to the client component. This ensures that every workspace
 * reads and writes only its own field overrides — never Atabaque's.
 */
export default async function FieldSettingsPage() {
  const workspaceSlug = await resolveWorkspaceSlugFromHeaders();
  return <FieldSettingsPageClient workspaceSlug={workspaceSlug} />;
}
