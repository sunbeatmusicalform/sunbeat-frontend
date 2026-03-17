import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServer } from "@/lib/supabase/server";

type FieldOverrideInput = {
  step_key: string;
  field_key: string;
  label_override?: string | null;
  helper_text_override?: string | null;
  is_required?: boolean;
  is_visible?: boolean;
  sort_order?: number | null;
};

function normalizeOptionalText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  return value;
}

async function ensureAuthenticatedUser() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ workspaceSlug: string }> }
) {
  const user = await ensureAuthenticatedUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { workspaceSlug } = await context.params;
  const supabase = createSupabaseAdmin();

  const [{ data: overrides, error: overridesError }, { count: submissionsCount }, { count: draftsCount }] =
    await Promise.all([
      supabase
        .from("workspace_field_overrides")
        .select(
          "id, workspace_slug, step_key, field_key, label_override, helper_text_override, placeholder_override, is_required, is_visible, sort_order, created_at, updated_at"
        )
        .eq("workspace_slug", workspaceSlug)
        .order("step_key", { ascending: true })
        .order("sort_order", { ascending: true }),
      supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("client_slug", workspaceSlug),
      supabase
        .from("release_intake_drafts")
        .select("draft_token", { count: "exact", head: true })
        .eq("client_slug", workspaceSlug),
    ]);

  if (overridesError) {
    return NextResponse.json(
      {
        ok: false,
        error: overridesError.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    overrides: overrides ?? [],
    stats: {
      submissions: submissionsCount ?? 0,
      drafts: draftsCount ?? 0,
    },
  });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ workspaceSlug: string }> }
) {
  const user = await ensureAuthenticatedUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { workspaceSlug } = await context.params;
  const body = (await request.json()) as {
    overrides?: FieldOverrideInput[];
  };

  if (!Array.isArray(body.overrides)) {
    return NextResponse.json(
      { ok: false, error: "Invalid overrides payload" },
      { status: 400 }
    );
  }

  const sanitizedOverrides = body.overrides
    .filter(
      (item) =>
        typeof item.step_key === "string" &&
        item.step_key.length > 0 &&
        typeof item.field_key === "string" &&
        item.field_key.length > 0
    )
    .map((item, index) => ({
      workspace_slug: workspaceSlug,
      step_key: item.step_key,
      field_key: item.field_key,
      label_override: normalizeOptionalText(item.label_override),
      helper_text_override: normalizeOptionalText(item.helper_text_override),
      is_required:
        typeof item.is_required === "boolean" ? item.is_required : null,
      is_visible: typeof item.is_visible === "boolean" ? item.is_visible : true,
      sort_order:
        typeof item.sort_order === "number" ? item.sort_order : index + 1,
    }));

  const supabase = createSupabaseAdmin();

  const { error: deleteError } = await supabase
    .from("workspace_field_overrides")
    .delete()
    .eq("workspace_slug", workspaceSlug);

  if (deleteError) {
    return NextResponse.json(
      { ok: false, error: deleteError.message },
      { status: 500 }
    );
  }

  if (sanitizedOverrides.length > 0) {
    const { error: insertError } = await supabase
      .from("workspace_field_overrides")
      .insert(sanitizedOverrides);

    if (insertError) {
      return NextResponse.json(
        { ok: false, error: insertError.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    ok: true,
    saved: sanitizedOverrides.length,
  });
}
