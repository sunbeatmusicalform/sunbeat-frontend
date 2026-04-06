"use client";

import ReleaseIntakePage from "@/components/release-intake/ReleaseIntakePage";
import { atabaqueTemplate } from "@/lib/form-engine/atabaque-template";

export default function LegacyReleaseIntakePage() {
  return (
    <ReleaseIntakePage
      workspaceSlug={atabaqueTemplate.workspaceSlug}
      workflowType={atabaqueTemplate.workflowType}
      formVersion={atabaqueTemplate.formVersion}
    />
  );
}
