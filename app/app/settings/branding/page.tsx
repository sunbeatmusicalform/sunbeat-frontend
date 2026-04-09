import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { resolveWorkspaceSlugFromHeaders } from "@/lib/tenant-resolver";

export const metadata = { title: "Branding — Sunbeat" };

type BrandingRow = {
  workspace_name: string | null;
  slogan: string | null;
  form_title: string | null;
  intro_text: string | null;
  success_message: string | null;
  logo_url: string | null;
  banner_url: string | null;
  submission_email_enabled: boolean | null;
};

export default async function BrandingSettingsPage() {
  const workspaceSlug = await resolveWorkspaceSlugFromHeaders();

  let branding: BrandingRow | null = null;
  let brandingError = false;

  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("workspace_branding")
      .select(
        "workspace_name, slogan, form_title, intro_text, success_message, logo_url, banner_url, submission_email_enabled"
      )
      .eq("workspace_slug", workspaceSlug)
      .maybeSingle<BrandingRow>();
    branding = data ?? null;
  } catch {
    brandingError = true;
  }

  const configured = branding !== null;

  return (
    <div className="grid gap-6">

      {/* Header */}
      <section className="rounded-[28px] border border-black/8 bg-white px-7 py-7 shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D867B]">
          Branding
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#111111]">
          Identidade e experiência do formulário
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[#5F5A53]">
          Configure o nome, logo, textos e mensagens exibidos no formulário público do workspace{" "}
          <span className="font-medium text-[#111111]">{workspaceSlug}</span>.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/app/release-intake"
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-black/10 bg-[#F8F5EF] px-4 text-sm font-medium text-[#111111] transition hover:bg-[#F0EDE6]"
          >
            Preview do formulário
          </Link>
          <a
            href={`/intake/${workspaceSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-[#111111] transition hover:bg-[#F8F5EF]"
          >
            Abrir formulário público →
          </a>
        </div>
      </section>

      {/* Status banner */}
      {brandingError && (
        <div className="rounded-[20px] border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
          Não foi possível carregar as configurações de branding. Tente novamente.
        </div>
      )}

      {!brandingError && !configured && (
        <div className="rounded-[20px] border border-amber-100 bg-amber-50 px-5 py-4">
          <p className="text-sm font-semibold text-amber-800">
            Branding não configurado para este workspace
          </p>
          <p className="mt-1 text-sm leading-6 text-amber-700">
            O formulário público usa os textos e logo padrão da Sunbeat. Configure seu branding
            para personalizar a experiência dos seus clientes.
          </p>
        </div>
      )}

      {/* Branding fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <BrandField
          label="Nome do workspace"
          value={branding?.workspace_name}
          fallback={workspaceSlug}
          note="Exibido no cabeçalho do formulário"
        />
        <BrandField
          label="Slogan"
          value={branding?.slogan}
          note="Linha de apoio abaixo do nome"
        />
        <BrandField
          label="Título do formulário"
          value={branding?.form_title}
          fallback="Formulário de lançamento"
          note="Cabeçalho na tela de introdução"
        />
        <BrandField
          label="URL do logo"
          value={branding?.logo_url}
          note="Logo exibido no formulário (URL ou caminho)"
          isUrl
        />
        <BrandField
          label="URL do banner"
          value={branding?.banner_url}
          note="Imagem de banner de fundo (opcional)"
          isUrl
        />
        <BrandField
          label="E-mail de notificação"
          value={
            branding?.submission_email_enabled === false
              ? "Desativado"
              : branding?.submission_email_enabled === true
              ? "Ativo"
              : undefined
          }
          note="Envia e-mail ao receber nova submissão"
        />
      </div>

      {/* Long text fields */}
      <div className="grid gap-4">
        <BrandTextBlock
          label="Texto de introdução"
          value={branding?.intro_text}
          note="Exibido na tela inicial do formulário, antes do preenchimento"
        />
        <BrandTextBlock
          label="Mensagem de sucesso"
          value={branding?.success_message}
          note="Exibida após o envio bem-sucedido da submissão"
        />
      </div>

      {/* Read-only notice */}
      <div className="rounded-[20px] border border-black/8 bg-[#F8F5EF] px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8D867B]">
          Edição de branding
        </p>
        <p className="mt-2 text-sm leading-6 text-[#5F5A53]">
          A edição direta de branding pelo painel está em desenvolvimento. Para configurar agora,
          insira os dados diretamente na tabela{" "}
          <code className="rounded bg-[#F0EDE8] px-1.5 py-0.5 text-xs text-[#393733]">
            workspace_branding
          </code>{" "}
          via Supabase, com{" "}
          <code className="rounded bg-[#F0EDE8] px-1.5 py-0.5 text-xs text-[#393733]">
            workspace_slug = &quot;{workspaceSlug}&quot;
          </code>
          .
        </p>
      </div>

    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BrandField({
  label,
  value,
  fallback,
  note,
  isUrl = false,
}: {
  label: string;
  value: string | null | undefined;
  fallback?: string;
  note?: string;
  isUrl?: boolean;
}) {
  const display = value ?? fallback ?? null;
  const isEmpty = !display;

  return (
    <div className="rounded-[20px] border border-black/8 bg-white px-5 py-4 shadow-[0_8px_20px_rgba(0,0,0,0.03)]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8D867B]">
        {label}
      </div>
      {isEmpty ? (
        <div className="mt-2 text-sm italic text-[#B5B0A8]">Não configurado</div>
      ) : isUrl && display ? (
        <a
          href={display.startsWith("/") || display.startsWith("http") ? display : undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block break-all text-sm font-medium text-[#2563EB] underline underline-offset-2"
        >
          {display}
        </a>
      ) : (
        <div className="mt-2 break-words text-sm font-medium text-[#111111]">{display}</div>
      )}
      {note && (
        <div className="mt-1.5 text-[11px] leading-4 text-[#9A9590]">{note}</div>
      )}
    </div>
  );
}

function BrandTextBlock({
  label,
  value,
  note,
}: {
  label: string;
  value: string | null | undefined;
  note?: string;
}) {
  return (
    <div className="rounded-[20px] border border-black/8 bg-white px-5 py-4 shadow-[0_8px_20px_rgba(0,0,0,0.03)]">
      <div className="flex items-baseline justify-between gap-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8D867B]">
          {label}
        </div>
        {note && (
          <div className="shrink-0 text-[11px] text-[#9A9590]">{note}</div>
        )}
      </div>
      {value ? (
        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#111111]">{value}</p>
      ) : (
        <p className="mt-3 text-sm italic text-[#B5B0A8]">Não configurado</p>
      )}
    </div>
  );
}
