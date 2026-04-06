"use client";

import { useParams } from "next/navigation";
import ReleaseIntakePage from "@/components/release-intake/ReleaseIntakePage";
import { atabaqueTemplate } from "@/lib/form-engine/atabaque-template";

export default function PublicReleaseIntakePage() {
  const params = useParams();

  const workspaceSlug =
    typeof params.workspaceSlug === "string"
      ? params.workspaceSlug
      : Array.isArray(params.workspaceSlug)
      ? params.workspaceSlug[0]
      : atabaqueTemplate.workspaceSlug;

  return (
    <ReleaseIntakePage
      workspaceSlug={workspaceSlug}
      workflowType={atabaqueTemplate.workflowType}
      formVersion={atabaqueTemplate.formVersion}
    />
  );
}
