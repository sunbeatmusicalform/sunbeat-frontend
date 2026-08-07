import { notFound } from "next/navigation";
import ReleaseIntakePage from "@/components/release-intake/ReleaseIntakePage";
import { atabaqueTemplate } from "@/lib/form-engine/atabaque-template";
import { isWorkspaceWorkflowEnabled } from "@/lib/billing/entitlements";

export default async function PublicReleaseIntakePage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  if (!(await isWorkspaceWorkflowEnabled(workspaceSlug, "release_intake"))) {
    notFound();
  }

  return (
    <ReleaseIntakePage
      workspaceSlug={workspaceSlug}
      workflowType={atabaqueTemplate.workflowType}
      formVersion={atabaqueTemplate.formVersion}
    />
  );
}
