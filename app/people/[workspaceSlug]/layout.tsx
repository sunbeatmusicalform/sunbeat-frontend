import type { Metadata } from "next";
import { generateWorkflowMetadata } from "@/lib/workspace-config/generate-workflow-metadata";
import { isWorkflowEnabledForWorkspace } from "@/lib/workspace-config/workflow-access";

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

export default async function PeopleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const enabled = await isWorkflowEnabledForWorkspace(workspaceSlug, "people_registry");

  if (!enabled) {
    return <WorkflowDisabledScreen workflowLabel="Cadastro de pessoa" />;
  }

  return <>{children}</>;
}

function WorkflowDisabledScreen({ workflowLabel }: { workflowLabel: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f3ef] px-4 py-16 text-center">
      <div className="max-w-sm rounded-[24px] border border-black/8 bg-white px-8 py-10 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 115.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h1 className="text-base font-semibold tracking-[-0.02em] text-[#111111]">
          {workflowLabel}
        </h1>
        <p className="mt-2 text-sm text-[#6B655C]">
          Este formulário está temporariamente indisponível.
        </p>
        <p className="mt-1 text-xs text-[#9A9590]">
          Entre em contato com a equipe responsável caso precise de acesso.
        </p>
      </div>
    </div>
  );
}
