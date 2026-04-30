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
    workflowLabel: "Cadastro de empresa",
    defaultTitle: "Cadastro de empresa",
    defaultDescription:
      "Preencha o formulario de cadastro da sua empresa para formalizar a parceria com a Atabaque.",
  });
}

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
