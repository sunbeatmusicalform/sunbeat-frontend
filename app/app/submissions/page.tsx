import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { resolveWorkspaceSlugFromHeaders } from "@/lib/tenant-resolver";

export const metadata = { title: "Submissões — Sunbeat" };

type Submission = {
  id: string;
  artist_name: string | null;
  release_title: string | null;
  release_type: string | null;
  status: string | null;
  submitted_at: string | null;
  created_at: string | null;
  airtable_sync_status: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  submitted: "Enviado",
  draft: "Rascunho",
  in_review: "Em revisão",
  approved: "Aprovado",
  rejected: "Rejeitado",
  processing: "Processando",
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  submitted:   { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  draft:       { bg: "#F8F5EF", text: "#6B655C", border: "#E5E0D8" },
  in_review:   { bg: "#FFFBEB", text: "#92400E", border: "#FDE68A" },
  approved:    { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
  rejected:    { bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA" },
  processing:  { bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE" },
};

const AIRTABLE_LABELS: Record<string, string> = {
  synced:   "Airtable ✓",
  pending:  "Sync pendente",
  failed:   "Sync falhou",
  skipped:  "Sem sync",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatReleaseType(type: string | null): string {
  if (!type) return "—";
  const map: Record<string, string> = {
    single: "Single",
    ep: "EP",
    album: "Álbum",
    compilation: "Compilação",
    mixtape: "Mixtape",
  };
  return map[type.toLowerCase()] ?? type;
}

export default async function SubmissionsPage() {
  const workspaceSlug = await resolveWorkspaceSlugFromHeaders();

  let submissions: Submission[] = [];
  let draftCount = 0;
  let loadError = false;

  try {
    const admin = createSupabaseAdmin();

    const [submissionsResult, draftsResult] = await Promise.all([
      admin
        .from("submissions")
        .select("id, artist_name, release_title, release_type, status, submitted_at, created_at, airtable_sync_status")
        .eq("client_slug", workspaceSlug)
        .order("created_at", { ascending: false })
        .limit(50),
      admin
        .from("release_intake_drafts")
        .select("id", { count: "exact", head: true })
        .eq("client_slug", workspaceSlug),
    ]);

    submissions = (submissionsResult.data ?? []) as Submission[];
    draftCount = draftsResult.count ?? 0;
  } catch {
    loadError = true;
  }

  const submittedCount = submissions.filter(s => s.status === "submitted").length;
  const totalCount = submissions.length;

  return (
    <div className="grid gap-6">

      {/* Header */}
      <section className="rounded-[28px] border border-black/8 bg-white px-7 py-7 shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D867B]">
          Submissões
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#111111]">
          Entradas e rascunhos
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[#5F5A53]">
          Submissões recebidas via intake público do workspace{" "}
          <span className="font-medium text-[#111111]">{workspaceSlug}</span>.
          Rascunhos em andamento são mostrados separadamente.
        </p>

        {/* Summary stats */}
        <div className="mt-5 flex flex-wrap gap-3">
          <Stat label="Total recebido" value={String(totalCount)} />
          <Stat label="Enviados" value={String(submittedCount)} />
          <Stat label="Rascunhos ativos" value={String(draftCount)} />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={`/intake/${workspaceSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center justify-center rounded-2xl px-4 text-sm font-semibold"
            style={{ backgroundColor: "#111111", color: "#ffffff" }}
          >
            Abrir formulário público →
          </a>
          <Link
            href="/app/settings/fields"
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-black/10 bg-[#F8F5EF] px-4 text-sm font-medium text-[#111111] hover:bg-[#F0EDE6] transition"
          >
            Ajustar campos
          </Link>
        </div>
      </section>

      {/* Error banner */}
      {loadError && (
        <div className="rounded-[20px] border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
          Não foi possível carregar as submissões. Tente novamente.
        </div>
      )}

      {/* Submissions table */}
      {!loadError && (
        <section className="rounded-[28px] border border-black/8 bg-white shadow-[0_18px_48px_rgba(0,0,0,0.04)] overflow-hidden">

          {/* Table header */}
          <div className="hidden md:grid md:grid-cols-[1fr_1fr_100px_140px_120px_110px] border-b border-black/8 bg-[#F8F5EF] px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8D867B]">
            <div>Artista</div>
            <div>Lançamento</div>
            <div>Tipo</div>
            <div>Status</div>
            <div>Data</div>
            <div>Airtable</div>
          </div>

          {submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-7 py-16 text-center">
              <div className="text-4xl">📭</div>
              <div className="mt-4 text-sm font-semibold text-[#111111]">
                Nenhuma submissão ainda
              </div>
              <p className="mt-2 max-w-sm text-sm text-[#8D867B]">
                Quando clientes preencherem o formulário público, as entradas aparecerão aqui.
              </p>
              <a
                href={`/intake/${workspaceSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex h-10 items-center justify-center rounded-2xl px-4 text-sm font-semibold"
                style={{ backgroundColor: "#111111", color: "#ffffff" }}
              >
                Abrir formulário público →
              </a>
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {submissions.map((item) => {
                const statusKey = item.status ?? "draft";
                const statusLabel = STATUS_LABELS[statusKey] ?? item.status ?? "—";
                const statusStyle = STATUS_COLORS[statusKey] ?? STATUS_COLORS.draft;
                const airtableKey = item.airtable_sync_status ?? "skipped";
                const airtableLabel = AIRTABLE_LABELS[airtableKey] ?? airtableKey;
                const displayDate = item.submitted_at
                  ? formatDate(item.submitted_at)
                  : formatDate(item.created_at);

                return (
                  <article
                    key={item.id}
                    className="bg-white px-6 py-5 md:grid md:grid-cols-[1fr_1fr_100px_140px_120px_110px] md:items-center"
                  >
                    {/* Artista */}
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8D867B] md:hidden">
                        Artista
                      </div>
                      <div className="mt-1 text-sm font-semibold text-[#111111] md:mt-0">
                        {item.artist_name ?? "—"}
                      </div>
                    </div>

                    {/* Lançamento */}
                    <div className="mt-3 md:mt-0">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8D867B] md:hidden">
                        Lançamento
                      </div>
                      <div className="mt-1 text-sm text-[#111111] md:mt-0">
                        {item.release_title ?? "—"}
                      </div>
                    </div>

                    {/* Tipo */}
                    <div className="mt-3 md:mt-0">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8D867B] md:hidden">
                        Tipo
                      </div>
                      <div className="mt-1 text-sm text-[#6B655C] md:mt-0">
                        {formatReleaseType(item.release_type)}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="mt-3 md:mt-0">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8D867B] md:hidden">
                        Status
                      </div>
                      <div className="mt-1 md:mt-0">
                        <span
                          className="inline-flex rounded-full border px-3 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.text,
                            borderColor: statusStyle.border,
                          }}
                        >
                          {statusLabel}
                        </span>
                      </div>
                    </div>

                    {/* Data */}
                    <div className="mt-3 md:mt-0">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8D867B] md:hidden">
                        Data
                      </div>
                      <div className="mt-1 text-sm text-[#6B655C] md:mt-0">
                        {displayDate}
                      </div>
                    </div>

                    {/* Airtable */}
                    <div className="mt-3 md:mt-0">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8D867B] md:hidden">
                        Airtable
                      </div>
                      <div className="mt-1 text-xs text-[#9A9590] md:mt-0">
                        {airtableLabel}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-black/8 bg-[#F8F5EF] px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8D867B]">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-[#111111]">{value}</div>
    </div>
  );
}
