import type { Metadata } from "next";
import { generateWorkflowMetadata } from "@/lib/workspace-config/generate-workflow-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}): Promise<Metadata> {
  const { workspaceSlug } = await params;
  return generateWorkflowMetadata({
    workspaceSlug,
    workflowLabel: "Clearance de direitos",
    defaultTitle: "Clearance de direitos",
    defaultDescription:
      "Preencha o formulário para solicitar clearance e licenciamento de direitos musicais.",
  });
}

export default function ClearanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
