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
    workflowLabel: "Formulário de lançamento",
    defaultTitle: "Formulário de lançamento",
    defaultDescription:
      "Preencha o formulário para compartilhar os dados do lançamento musical.",
  });
}

export default function IntakeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{childre