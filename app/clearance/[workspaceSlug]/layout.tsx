import type { Metadata } from "next";

import { rightsClearanceTemplate } from "@/lib/form-engine/rights-clearance-template";
import { buildWorkflowShareMetadata } from "@/lib/form-engine/share-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}): Promise<Metadata> {
  const { workspaceSlug } = await params;

  return buildWorkflowShareMetadata({
    workspaceSlug,
    workflowType: rightsClearanceTemplate.workflowType,
    formVersion: rightsClearanceTemplate.formVersion,
  });
}

export default function ClearanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
