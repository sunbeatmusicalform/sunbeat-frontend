import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { resolveWorkspaceSlugFromHeaders } from "@/lib/tenant-resolver";

export const metadata = { title: "Uso — Sunbeat" };

export default async function UsagePage() {
  const workspaceSlug = await resolveWorkspaceSlugFromHeaders();

  let submissionCount: number | null = null;
  let draftCount: number | null = null;
  let loadError = false;

  try {
    const admin = createSupabaseAdmin();

    const [submissionsResult, draftsResult] = await Promise.all([
      admin
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("client_slug", workspaceSlug),
      admin
        .from("release_intake_drafts")
        .select("id", { count: "exact", head: true })
        .eq("client_slug", workspaceSlug),
    ]);

    submissionCount = submissionsResult.count ?? 0;
    draftCount = draftsResult.count ?? 0;
  } catch {
    loadError = true;
  }

  return (
    <div className="grid gap-6">

      {/* Header */}
      <section className="rounded-[28px] border border-black/8 bg-white px-7 py-7 shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D867B]">
          Uso
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#111111]">
          Atividade do workspace
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[#5F5A53]">
          Métricas de volume de submissões e rascunhos para o workspace{" "}
          <span className="font-medium text-[#111111]">{workspaceSlug}</span>.
        </p>
      </section>

      {/* Error banner */}
      {loadError && (
        <div className="rounded-[20px] border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
          Não foi possível carregar as métricas. Tente novamente.
        </div>
      )}

      {/* Metric cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Submissões recebidas"
          value={submissionCount !== null ? String(submissionCount) : "—"}
          note="Total via intake público"
        />
        <MetricCard
          label="Rascunhos ativos"
          value={draftCount !== null ? String(draftCount) : "—"}
          note="Em preenchimento"
        />
        <MetricCard
          label="Chamadas de IA"
          value="—"
          note="Não rastreado ainda"
          muted
        />
        <MetricCard
          label="Workspaces"
          value="1"
          note="Este workspace"
        />
      </section>

      {/* Future analytics note */}
      <section className="rounded-[28px] border border-black/8 bg-white px-7 py-7 shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D867B]">
          Próxima camada
        </div>
        <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#111111]">
          Analytics operacional
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[#5F5A53]">
          Em desenvolvimento: taxa de conversão do intake, tempo médio de preenchimento,
          frequência de erros de metadados e volume de submissões por período.
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {[
            "Taxa de conversão do intake",
            "Tempo médio de preenchimento",
            "Frequência de erros de metadados",
            "Volume por período",
          ].map((item) => (
            <div
              key={item}
              className="rounded-[16px] border border-black/8 bg-[#F8F5EF] px-4 py-3 text-sm text-[#8D867B]"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  note,
  muted = false,
}: {
  label: string;
  value: string;
  note?: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-[24px] border border-black/8 bg-white px-6 py-6 shadow-[0_14px_34px_rgba(0,0,0,0.04)]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8D867B]">
        {label}
      </div>
      <div
        className="mt-3 text-4xl font-semibold tracking-[-0.04em]"
        style={{ color: muted ? "#B5B0A8" : "#111111" }}
      >
        {value}
      </div>
      {note && (
        <div className="mt-1.5 text-xs text-[#9A9590]">{note}</div>
      )}
    </div>
  );
}
