import { notFound } from "next/navigation";
import CompanyRegistryPage from "@/components/company-registry/CompanyRegistryPage";
import { companyRegistryTemplate } from "@/lib/form-engine/company-registry-template";
import { isWorkspaceWorkflowEnabled } from "@/lib/billing/entitlements";

export default async function PublicCompanyRegistryPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  if (!(await isWorkspaceWorkflowEnabled(workspaceSlug, "company_registry"))) {
    notFound();
  }

  return (
    <CompanyRegistryPage
      workspaceSlug={workspaceSlug}
      workflowType={companyRegistryTemplate.workflowType}
      formVersion={companyRegistryTemplate.formVersion}
    />
  );
}
