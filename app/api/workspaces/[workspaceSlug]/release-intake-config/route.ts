import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const EMAIL_SETTINGS_STEP_KEY = "__workspace_settings__";
const SECURITY_SETTINGS_STEP_KEY = "__workspace_security__";

export async function GET(
  _req: Request,
  context: { params: Promise<{ workspaceSlug: string }> }
) {
  const { workspaceSlug } = await context.params;
  const supabase = createSupabaseAdmin();

  const [
    { data: branding, error: brandingError },
    { data: overrides, error: overridesError },
  ] = await Promise.all([
    supabase
      .from("workspace_branding")
      .select("*")
      .eq("workspace_slug", workspaceSlug)
      .maybeSingle(),

    supabase
      .from("workspace_field_overrides")
      .select("*")
      .eq("workspace_slug", workspaceSlug)
      .order("step_key", { ascending: true })
      .order("sort_order", { ascending: true }),
  ]);

  if (brandingError) {
    return NextResponse.json(
      { ok: false, error: brandingError.message },
      {
        status: 500,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }

  if (overridesError) {
    return NextResponse.json(
      { ok: false, error: overridesError.message },
      {
        status: 500,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }

  const publicOverrides = (overrides ?? [])
    .filter(
      (row) =>
        row.step_key !== EMAIL_SETTINGS_STEP_KEY &&
        row.step_key !== SECURITY_SETTINGS_STEP_KEY
    )
    .map((row) => ({
      step_key: row.step_key,
      field_key: row.field_key,
      label_override: row.label_override ?? null,
      helper_text_override: row.helper_text_override ?? null,
      placeholder_override: row.placeholder_override ?? null,
      is_required:
        typeof row.is_required === "boolean" ? row.is_required : null,
      is_visible: typeof row.is_visible === "boolean" ? row.is_visible : null,
      sort_order: typeof row.sort_order === "number" ? row.sort_order : null,
    }));

  return NextResponse.json(
    {
      ok: true,
      branding: branding ?? null,
      field_overrides: publicOverrides,
    },
    {
      status: 200,
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}