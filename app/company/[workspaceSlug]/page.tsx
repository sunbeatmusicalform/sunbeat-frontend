"use client";

import { useParams } from "next/navigation";
import CompanyRegistryPage from "@/components/company-registry/CompanyRegistryPage";
import { companyRegistryTemplate } from "@/lib/form-engine/company-registry-template";

export default function PublicCompanyRegistryPage() {
  const params = useParams();

  const workspaceSlug =
    typeof params.workspaceSlug === "string"
      ? params.workspaceSlug
      : Array.isArray(params.workspaceSlug)
      ? params.workspaceSlug[0]
      : companyRegistryTemplate.workspaceSlug;

  return (
    <CompanyRegistryPage
      workspaceSlug={workspaceSlug}
      workflowType={companyRegistryTemplate.workflowType}
      formVersion={companyRegistryTemplate.formVersion}
    />
  );
}
