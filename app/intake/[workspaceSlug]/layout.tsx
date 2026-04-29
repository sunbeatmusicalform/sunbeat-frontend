import type { Metadata } from "next";

import { atabaqueTemplate } from "@/lib/form-engine/atabaque-template";
import { buildWorkflowShareMetadata } from "@/lib/form-engine/share-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}): Promise<Metadata> {
  const { workspaceSlug } = await params;

  return buildWorkflowShareMetadata({
    workspaceSlug,
    workflowType: atabaqueTemplate.workflowType,
    formVersion: atabaqueTemplate.formVersion,
  });
}

export default function IntakeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
