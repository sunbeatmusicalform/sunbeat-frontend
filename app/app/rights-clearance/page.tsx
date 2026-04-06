"use client";

import RightsClearancePage from "@/components/rights-clearance/RightsClearancePage";
import { rightsClearanceTemplate } from "@/lib/form-engine/rights-clearance-template";

export default function LegacyRightsClearancePage() {
  return (
    <RightsClearancePage
      workspaceSlug={rightsClearanceTemplate.workspaceSlug}
      workflowType={rightsClearanceTemplate.workflowType}
      formVersion={rightsClearanceTemplate.formVersion}
    />
  );
}
