import { resolveWorkspaceSlugFromHeaders } from "@/lib/tenant-resolver";
import SetupCopilotWidget from "@/components/admin/SetupCopilotWidget";

export default async function AIGuideSettingsPage() {
  const workspaceSlug = await resolveWorkspaceSlugFromHeaders();

  return (
    <div>
      <section className="rounded-[32px] border border-[#DED7CB] bg-white p-7 shadow-[0_18px_50px_rgba(52,43,32,0.08)] md:p-8">
        <div className="grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
          <div>
            <span className="inline-flex items-center gap-2.5 rounded-full border border-[#E2D8C8] bg-[#FBF7EF] px-3.5 py-2 text-xs font-semibold text-[#3B332A]">
              <span className="sunbeat-dot" />
              Setup Copilot
            </span>

            <h1 className="mt-5 max-w-xl text-3xl font-semibold tracking-[-0.04em] text-[#16120F] md:text-4xl">
              Configure o workspace com revisão humana.
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-[#625A51]">
              Faça perguntas sobre workflows, branding, integrações e campos. O
              Copilot responde em modo consultivo e só prepara mudanças para
              revisão; nenhuma aplicação acontece sem confirmação.
            </p>
          </div>

          <div>
            <SetupCopilotWidget workspaceSlug={workspaceSlug} />
          </div>
        </div>
      </section>
    </div>
  );
}
