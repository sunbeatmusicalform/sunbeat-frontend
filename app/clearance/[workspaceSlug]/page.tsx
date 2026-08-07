import { notFound } from "next/navigation";
import RightsClearancePage from "@/components/rights-clearance/RightsClearancePage";
import { rightsClearanceTemplate } from "@/lib/form-engine/rights-clearance-template";
import { isWorkspaceWorkflowEnabled } from "@/lib/billing/entitlements";

export default async function PublicRightsClearancePage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  if (!(await isWorkspaceWorkflowEnabled(workspaceSlug, "rights_clearance"))) {
    notFound();
  }

  return (
    <RightsClearancePage
      workspaceSlug={workspaceSlug}
      workflowType={rightsClearanceTemplate.workflowType}
      formVersion={rightsClearanceTemplate.formVersion}
    />
  );
}
