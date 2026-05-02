import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { resolveWorkspaceSlugFromHeaders } from "@/lib/tenant-resolver";
import BrandingClient from "./BrandingClient";

export const metadata = { title: "Branding — Sunbeat" };

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

export default async function BrandingSettingsPage() {
  const workspaceSlug = await resolveWorkspaceSlugFromHeaders();

  let branding: BrandingRow | null = null;

  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("workspace_branding")
      .select(
        "workspace_name, slogan, form_title, intro_text, success_message, logo_url, badge_url, banner_url, submission_email_enabled, public_edit_allowed, social_image_url, social_title, social_description, primary_color, form_bg_color"
      )
      .eq("workspace_slug", workspaceSlug)
      .maybeSingle<BrandingRow>();
    branding = data ?? null;
  } catch {
    // handled by client with null initial
  }

  return (
    <div className="grid gap-6">

      {/* Header */}
      <section className="rounded-[28px] border border-black/8 bg-white px-7 py-7 shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D867B]">
          Branding
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#111111]">
          Identidade e experiência
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[#5F5A53]">
          Configure o nome, logo, textos e o card social exibido quando o link é compartilhado.{" "}
          Workspace:{" "}
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
            Abrir link público →
          </a>
        </div>
      </section>

