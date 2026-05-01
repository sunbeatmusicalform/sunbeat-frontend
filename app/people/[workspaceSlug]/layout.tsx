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
    workflowLabel: "Cadastro de pessoa",
    defaultTitle: "Cadastro de pessoa",
    defaultDescription:
      "Preencha o formulário para cadastrar artistas, produtores e colaboradores musicais.",
  });
}

export default function PeopleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}