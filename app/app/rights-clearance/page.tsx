import { headers } from "next/headers";
import { getTenantFromHost } from "@/lib/tenant";
import RightsClearancePage from "@/components/rights-clearance/RightsClearancePage";

/**
 * Internal preview of the Rights Clearance form.
 *
 * Scoped to THIS workspace — not Atabaque.
 * Distinct from the public clearance form at /clearance/[workspaceSlug].
 * Submissions made here ARE real — privileged preview, not a sandbox.
 */
export default async function InternalRightsClearancePage() {
  const host = (await headers()).get("host") ?? "";
  const tenant = getTenantFromHost(host);
  // Fallback to "atabaque" preserves Atabaque legacy behaviour exactly.
  const workspaceSlug = tenant?.type === "subdomain" ? tenant.value : "atabaque";

  return (
    <div>
      {/* Internal preview context banner */}
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[16px] border border-amber-200 bg-amber-50 px-4 py-3">
        <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
          Preview interno — Rights Clearance
        </span>
        <span className="text-xs text-amber-600/80">
          Submissões feitas aqui entram no fluxo real.
        </span>
        <a
          href={`/clearance/${workspaceSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-900"
        >
          Abrir formulário público →
        </a>
      </div>

      <RightsClearancePage workspaceSlug={workspaceSlug} />
    </div>
  );
}
