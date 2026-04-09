import { headers } from "next/headers";
import { getTenantFromHost } from "@/lib/tenant";
import ReleaseIntakePage from "@/components/release-intake/ReleaseIntakePage";

/**
 * Internal preview of the Release Intake form.
 *
 * Renders the live form renderer scoped to THIS workspace, not Atabaque.
 * Branding + field overrides are loaded dynamically from workspace_branding.
 *
 * Distinct from the public intake at /intake/[workspaceSlug].
 * Submissions made here ARE real — this is a privileged preview, not a sandbox.
 */
export default async function InternalReleasePreviewPage() {
  const host = (await headers()).get("host") ?? "";
  const tenant = getTenantFromHost(host);
  // Fallback to "atabaque" preserves Atabaque legacy behaviour exactly.
  const workspaceSlug = tenant?.type === "subdomain" ? tenant.value : "atabaque";

  return (
    <div>
      {/* Internal preview context banner — clearly distinguishes from public form */}
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[16px] border border-amber-200 bg-amber-50 px-4 py-3">
        <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
          Preview interno
        </span>
        <span className="text-xs text-amber-600/80">
          Submissões feitas aqui entram no fluxo real. Não é uma sandbox.
        </span>
        <a
          href={`/intake/${workspaceSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-900"
        >
          Abrir formulário público →
        </a>
      </div>

      <ReleaseIntakePage workspaceSlug={workspaceSlug} />
    </div>
  );
}
