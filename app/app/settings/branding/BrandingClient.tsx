"use client";

import { useState, useTransition } from "react";

type BrandingRow = {
  workspace_name: string | null;
  slogan: string | null;
  form_title: string | null;
  intro_text: string | null;
  success_message: string | null;
  logo_url: string | null;
  badge_url: string | null;
  banner_url: string | null;
  submission_email_enabled: boolean | null;
  public_edit_allowed: boolean | null;
  social_image_url: string | null;
  social_title: string | null;
  social_description: string | null;
  primary_color: string | null;
  form_bg_color: string | null;
};

type Props = {
  workspaceSlug: string;
  initial: BrandingRow | null;
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://sunbeat.pro";

function resolvePreviewImage(url: string | null): string {
  if (!url) return `${SITE_URL}/logo.png`;
  if (url.startsWith("/")) return `${SITE_URL}${url}`;
  return url;
}

/** Neutral platform defaults applied only when no DB value is present. */
const NEUTRAL_PRIMARY = "#0f172a";
const NEUTRAL_BG = "#f5f3ef";

export default function BrandingClient({ workspaceSlug, initial }: Props) {
  const [form, setForm] = useState<BrandingRow>({
    workspace_name: initial?.workspace_name ?? workspaceSlug,
    slogan: initial?.slogan ?? null,
    form_title: initial?.form_title ?? null,
    intro_text: initial?.intro_text ?? null,
    success_message: initial?.success_message ?? null,
    logo_url: initial?.logo_url ?? null,
    badge_url: initial?.badge_url ?? null,
    banner_url: initial?.banner_url ?? null,
    submission_email_enabled: initial?.submission_email_enabled ?? true,
    public_edit_allowed: initial?.public_edit_allowed ?? false,
    social_image_url: initial?.social_image_url ?? null,
    social_title: initial?.social_title ?? null,
    social_description: initial?.social_description ?? null,
    primary_color: initial?.primary_color ?? null,
    form_bg_color: initial?.form_bg_color ?? null,
  });

  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function set(field: keyof BrandingRow, value: string | boolean | null) {
    setSaved(false);
    setSaveError(null);
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      setSaved(false);
      setSaveError(null);
      try {
        const res = await fetch(
          `/api/workspaces/${workspaceSlug}/branding`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          }
        );
        const json = await res.json();
        if (!res.ok || !json.ok) {
          setSaveError(json.error ?? "Erro ao salvar.");
        } else {
          setSaved(true);
        }
      } catch {
        setSaveError("Erro de rede. Tente novamente.");
      }
    });
  }

  const previewTitle =
    form.social_title || form.workspace_name || "Formulario de Lancamento";
  const previewDesc =
    form.social_description ||
    form.slogan ||
    "Preencha o formulario para compartilhar os dados do lancamento.";
  const previewImage = resolvePreviewImage(form.social_image_url);
  const intakeUrl = `sunbeat.pro/intake/${workspaceSlug}`;

  const previewPrimary = form.primary_color || NEUTRAL_PRIMARY;
  const previewBg = form.form_bg_color || NEUTRAL_BG;

  return (
    <div className="grid gap-6">

      {/* Aparencia do formulario */}
      <section className="rounded-[28px] border border-black/8 bg-white px-7 py-7 shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D867B]">
          Aparencia do formulario
        </div>
        <p className="mt-1 text-xs text-[#9A9590]">
          Cor principal e cor de fundo aplicadas em todos os formularios do workspace.
        </p>

        <div
          className="mt-5 overflow-hidden rounded-2xl border border-black/10"
          style={{ background: previewBg }}
        >
          <div className="px-5 py-5 flex items-start gap-4">
            {form.badge_url ? (
              <img
                src={form.badge_url}
                alt="badge"
                className="h-10 w-10 rounded-xl object-contain flex-shrink-0"
              />
            ) : (
              <div className="h-10 w-10 flex-shrink-0 rounded-xl border border-black/10 bg-black/5 flex items-center justify-center text-[18px] text-black/20">
                *
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[#111111]">
                {form.workspace_name || workspaceSlug}
              </div>
              <div className="text-xs text-[#8D867B] mt-0.5">
                {form.slogan || "Formulario de submissao"}
              </div>
              <div className="mt-4 flex gap-2">
                <div
                  className="h-9 rounded-xl px-5 text-sm font-semibold text-white flex items-center justify-center"
                  style={{ background: previewPrimary }}
                >
                  Continuar
                </div>
                <div
                  className="h-9 rounded-xl px-5 text-sm font-medium flex items-center justify-center border"
                  style={{
                    borderColor: previewPrimary,
                    color: previewPrimary,
                    background: "transparent",
                  }}
                >
                  Voltar
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <ColorField
            label="Cor principal"
            note="Botoes, elementos ativos e marcadores de etapa"
            value={form.primary_color ?? ""}
            onChange={(v) => set("primary_color", v || null)}
            placeholder={NEUTRAL_PRIMARY}
          />
          <ColorField
            label="Cor de fundo do formulario"
            note="Tela de fundo exibida para o usuario"
            value={form.form_bg_color ?? ""}
            onChange={(v) => set("form_bg_color", v || null)}
            placeholder={NEUTRAL_BG}
          />
          <div className="sm:col-span-2">
            <Field
              label="URL do badge"
              note="Icone pequeno exibido em chips e no cabecalho (distinto do logo principal)"
              value={form.badge_url ?? ""}
              onChange={(v) => set("badge_url", v || null)}
              placeholder="/workspace-mark.svg"
            />
          </div>
        </div>
      </section>

      {/* Preview social */}
      <section className="rounded-[28px] border border-black/8 bg-white px-7 py-7 shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D867B]">
          Preview social
        </div>
        <p className="mt-1 text-xs text-[#9A9590]">
          Assim o link aparece ao ser compartilhado no WhatsApp / iMessage
        </p>

        <div className="mt-5 max-w-sm overflow-hidden rounded-2xl border border-black/10 bg-[#F0EDE8] shadow-sm">
          <div className="relative aspect-square w-full overflow-hidden bg-[#E8E4DE]">
            {form.social_image_url ? (
              <img
                src={previewImage}
                alt="Preview social"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl text-[#C5BFB8]">
                🖼
              </div>
            )}
          </div>
          <div className="px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#8D867B]">
              {intakeUrl}
            </div>
            <div className="mt-0.5 text-sm font-semibold leading-5 text-[#111111] line-clamp-2">
              {previewTitle}
            </div>
            <div className="mt-0.5 text-xs leading-4 text-[#5F5A53] line-clamp-2">
              {previewDesc}
            </div>
          </div>
        </div>
      </section>

      {/* Card social fields */}
      <section className="rounded-[28px] border border-black/8 bg-white px-7 py-7 shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D867B]">
          Configuracoes do card social
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field
            label="Imagem social (URL absoluta)"
            note="Exibida no card do WhatsApp, iMessage, Slack. Recomendado: 1200x1200 px."
            value={form.social_image_url ?? ""}
            onChange={(v) => set("social_image_url", v || null)}
            placeholder="https://sunbeat.pro/workspace-badge.png"
          />
          <Field
            label="Titulo social"
            note="Titulo exibido abaixo da imagem"
            value={form.social_title ?? ""}
            onChange={(v) => set("social_title", v || null)}
            placeholder="Workspace — Formulario de Lancamento"
          />
          <div className="sm:col-span-2">
            <TextArea
              label="Descricao social"
              note="Descricao curta no card de preview"
              value={form.social_description ?? ""}
              onChange={(v) => set("social_description", v || null)}
              placeholder="Preencha o formulario para compartilhar os dados do lancamento com a equipe."
              rows={2}
            />
          </div>
        </div>
      </section>

      {/* Identidade */}
      <section className="rounded-[28px] border border-black/8 bg-white px-7 py-7 shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D867B]">
          Identidade do workspace
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field
            label="Nome do workspace"
            value={form.workspace_name ?? ""}
            onChange={(v) => set("workspace_name", v || workspaceSlug)}
            placeholder={workspaceSlug}
          />
          <Field
            label="Slogan"
            note="Linha de apoio abaixo do nome"
            value={form.slogan ?? ""}
            onChange={(v) => set("slogan", v || null)}
            placeholder="Shine Brighter, Work Smarter."
          />
          <Field
            label="Titulo do formulario"
            note="Cabecalho na tela de introducao (release intake)"
            value={form.form_title ?? ""}
            onChange={(v) => set("form_title", v || null)}
            placeholder="Formulario de Lancamento"
          />
          <Field
            label="URL do logo"
            note="Logo principal no cabecalho (URL ou /caminho)"
            value={form.logo_url ?? ""}
            onChange={(v) => set("logo_url", v || null)}
            placeholder="/workspace-logo.png"
          />
          <div className="sm:col-span-2">
            <Field
              label="URL do banner"
              note="Imagem de fundo opcional no formulario"
              value={form.banner_url ?? ""}
              onChange={(v) => set("banner_url", v || null)}
              placeholder="https://..."
            />
          </div>
        </div>
      </section>

      {/* Textos */}
      <section className="rounded-[28px] border border-black/8 bg-white px-7 py-7 shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D867B]">
          Textos do formulario
        </div>
        <div className="mt-5 grid gap-4">
          <TextArea
            label="Texto de introducao"
            note="Exibido antes do inicio do preenchimento"
            value={form.intro_text ?? ""}
            onChange={(v) => set("intro_text", v || null)}
            rows={3}
          />
          <TextArea
            label="Mensagem de sucesso"
            note="Exibida apos o envio bem-sucedido"
            value={form.success_message ?? ""}
            onChange={(v) => set("success_message", v || null)}
            rows={2}
          />
        </div>
      </section>

      {/* Configuracoes */}
      <section className="rounded-[28px] border border-black/8 bg-white px-7 py-7 shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D867B]">
          Configuracoes
        </div>
        <div className="mt-5 grid gap-3">
          <Toggle
            label="E-mail de notificacao ao receber submissao"
            checked={form.submission_email_enabled ?? true}
            onChange={(v) => set("submission_email_enabled", v)}
          />
          <Toggle
            label="Permitir edicao publica do formulario"
            note="Clientes podem editar submissoes via link sem senha"
            checked={form.public_edit_allowed ?? false}
            onChange={(v) => set("public_edit_allowed", v)}
          />
        </div>
      </section>

      {/* Save Bar */}
      <div className="sticky bottom-4 flex items-center justify-between gap-4 rounded-[20px] border border-black/8 bg-white/90 px-5 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-sm">
        <div className="text-sm">
          {saved && (
            <span className="font-medium text-emerald-600">
              Salvo com sucesso
            </span>
          )}
          {saveError && (
            <span className="font-medium text-red-600">{saveError}</span>
          )}
          {!saved && !saveError && (
            <span className="text-[#9A9590]">Alteracoes nao salvas</span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center rounded-2xl bg-[#111111] px-6 text-sm font-medium text-white transition hover:bg-[#333] disabled:opacity-50"
        >
          {isPending ? "Salvando..." : "Salvar branding"}
        </button>
      </div>

    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
  note,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  note?: string;
  placeholder?: string;
}) {
  const swatchColor =
    value && /^#[0-9A-Fa-f]{3,8}$/.test(value)
      ? value
      : (placeholder ?? "#888888");

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8D867B]">
        {label}
      </label>
      {note && <p className="text-[11px] text-[#9A9590]">{note}</p>}
      <div className="flex gap-2 items-center">
        <label
          className="relative h-10 w-10 flex-shrink-0 cursor-pointer overflow-hidden rounded-xl border border-black/10 shadow-sm transition hover:border-black/20"
          style={{ background: swatchColor }}
          title="Clique para abrir o seletor de cor"
        >
          <input
            type="color"
            value={swatchColor}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-10 flex-1 rounded-xl border border-black/10 bg-[#F8F5EF] px-3 text-sm font-mono text-[#111111] placeholder:text-[#C5BFB8] focus:border-black/20 focus:bg-white focus:outline-none transition"
        />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  note,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  note?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8D867B]">
        {label}
      </label>
      {note && <p className="text-[11px] text-[#9A9590]">{note}</p>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 rounded-xl border border-black/10 bg-[#F8F5EF] px-3 text-sm text-[#111111] placeholder:text-[#C5BFB8] focus:border-black/20 focus:bg-white focus:outline-none transition"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  note,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  note?: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8D867B]">
        {label}
      </label>
      {note && <p className="text-[11px] text-[#9A9590]">{note}</p>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="rounded-xl border border-black/10 bg-[#F8F5EF] px-3 py-2.5 text-sm text-[#111111] placeholder:text-[#C5BFB8] focus:border-black/20 focus:bg-white focus:outline-none transition resize-none"
      />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  note,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  note?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-black/8 bg-[#F8F5EF] px-4 py-3 hover:bg-[#F0EDE8] transition">
      <div className="mt-0.5 flex-shrink-0">
        <div
          onClick={() => onChange(!checked)}
          className={"relative h-5 w-9 rounded-full transition " + (checked ? "bg-[#111111]" : "bg-[#D4CFC9]")}
        >
          <div
            className={"absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform " + (checked ? "translate-x-4" : "translate-x-0.5")}
          />
        </div>
      </div>
      <div>
        <div className="text-sm font-medium text-[#111111]">{label}</div>
        {note && <div className="mt-0.5 text-xs text-[#9A9590]">{note}</div>}
      </div>
    </label>
  );
}
