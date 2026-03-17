"use client";

import { useParams } from "next/navigation";
import ReleaseIntakePage from "@/components/release-intake/ReleaseIntakePage";

export default function PublicReleaseIntakePage() {
  const params = useParams();

  const workspaceSlug =
    typeof params.workspaceSlug === "string"
      ? params.workspaceSlug
      : Array.isArray(params.workspaceSlug)
      ? params.workspaceSlug[0]
      : "atabaque";

  return <ReleaseIntakePage workspaceSlug={workspaceSlug} />;
}