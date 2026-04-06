"use client";

import { useParams } from "next/navigation";
import RightsClearancePage from "@/components/rights-clearance/RightsClearancePage";
import { rightsClearanceTemplate } from "@/lib/form-engine/rights-clearance-template";

export default function PublicRightsClearancePage() {
  const params = useParams();

  const workspaceSlug =
    typeof params.workspaceSlug === "string"
      ? params.workspaceSlug
      : Array.isArray(params.workspaceSlug)
      ? params.workspaceSlug[0]
      : rightsClearanceTemplate.workspaceSlug;

  return (
    <RightsClearancePage
      workspaceSlug={workspaceSlug}
      workflowType={rightsClearanceTemplate.workflowType}
      formVersion={rightsClearanceTemplate.formVersion}
    />
  );
}
