import { resolveWorkspaceSlugFromHeaders } from "@/lib/tenant-resolver";
import CompanyRegistryPage from "@/components/company-registry/CompanyRegistryPage";
import { companyRegistryTemplate } from "@/lib/form-engine/company-registry-template";

/**
 * Internal preview of the Company Registry form.
 *
 * Renders the live form renderer scoped to THIS workspace.
 * Distinct from the public form at /company/[workspaceSlug].
 * Submissions made here ARE real — privileged preview, not a sandbox.
 */
export default async function InternalCompanyRegistryPage() {
  const workspaceSlug = await resolveWorkspaceSlugFromHeaders();

  return (
    <div>
      {/* Internal preview context banner */}
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[16px] border border-amber-200 bg-amber-50 px-4 py-3">
        <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
          Preview interno — Cadastro de Empresa
        </span>
        <span className="text-xs text-amber-600/80">
          Submissões feitas aqui entram no fluxo real.
        </span>
        <a
          href={`/company/${workspaceSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-900"
        >
          Abrir formulário público →
        </a>
      </div>

      <CompanyRegistryPage
        workspaceSlug={workspaceSlug}
        workflowType={companyRegistryTemplate.workflowType}
        formVersion={companyRegistryTemplate.formVersion}
      />
    </div>
  );
}
