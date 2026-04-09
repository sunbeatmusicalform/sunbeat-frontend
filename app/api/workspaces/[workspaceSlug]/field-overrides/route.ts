import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  canAccessWorkspace,
  listAccessibleWorkspacesForUser,
} from "@/lib/workspace-access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const EMAIL_SETTINGS_STEP_KEY = "__workspace_settings__";
const EMAIL_SETTINGS_FIELD_KEY = "submission_notification_emails";
const SECURITY_SETTINGS_STEP_KEY = "__workspace_security__";
const EDIT_PASSWORD_FIELD_KEY = "edit_mode_password_hash";
const LEGACY_EDITOR_WORKFLOW_TYPE = "release_intake";
const LEGACY_EDITOR_FORM_VERSION = "legacy_v1";
const FIELD_OVERRIDE_SELECT_WITH_SCOPE =
  "id, workspace_slug, workflow_type, form_version, step_key, field_key, label_override, helper_text_override, placeholder_override, is_required, is_visible, sort_order, created_at, updated_at";
const FIELD_OVERRIDE_SELECT_LEGACY =
  "id, workspace_slug, step_key, field_key, label_override, helper_text_override, placeholder_override, is_required, is_visible, sort_order, created_at, updated_at";
const FIELD_OVERRIDE_SETTINGS_SELECT_WITH_SCOPE =
  "workspace_slug, workflow_type, form_version, step_key, field_key, label_override, helper_text_override, placeholder_override, is_required, is_visible, sort_order";
const FIELD_OVERRIDE_SETTINGS_SELECT_LEGACY =
  "workspace_slug, step_key, field_key, label_override, helper_text_override, placeholder_override, is_required, is_visible, sort_order";

function getDefaultNotificationEmails(workspaceSlug: string) {
  if (workspaceSlug === "atabaque") {
    return ["labels@atabaque.biz"];
  }

  return [];
}

type FieldOverrideInput = {
  step_key: string;
  field_key: string;
  label_override?: string | null;
  helper_text_override?: string | null;
  placeholder_override?: string | null;
  is_required?: boolean;
  is_visible?: boolean;
  sort_order?: number | null;
};

type StoredFieldOverrideRow = {
  workspace_slug?: string | null;
  workflow_type?: string | null;
  form_version?: string | null;
  step_key: string;
  field_key: string;
  label_override?: string | null;
  helper_text_override?: string | null;
  placeholder_override?: string | null;
  is_required?: boolean | null;
  is_visible?: boolean | null;
  sort_order?: number | null;
};

type EmailSettingsInput = {
  submission_email_enabled?: boolean;
  submission_notification_emails?: string[];
};

type SecuritySettingsInput = {
  edit_password_enabled?: boolean;
  edit_password?: string;
};

function normalizeOptionalText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  return value;
}

function normalizeEmailList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const unique = new Set<string>();

  value.forEach((item) => {
    if (typeof item !== "string") {
      return;
    }

    const normalized = item.trim().toLowerCase();
    if (!normalized) {
      return;
    }

    unique.add(normalized);
  });

  return Array.from(unique).slice(0, 5);
}

function parseStoredEmailList(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    return normalizeEmailList(JSON.parse(value));
  } catch {
    return [];
  }
}

function normalizePassword(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

function isPasswordValid(storedHash: string, rawPassword: string) {
  if (!storedHash || !rawPassword) {
    return false;
  }

  const candidateBuffer = Buffer.from(hashPassword(rawPassword));
  const storedBuffer = Buffer.from(storedHash);

  if (candidateBuffer.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(candidateBuffer, storedBuffer);
}

function getPasswordHeader(request: Request) {
  return normalizePassword(request.headers.get("x-workspace-edit-password"));
}

function isSettingsOrSecurityStep(stepKey: string) {
  return (
    stepKey === EMAIL_SETTINGS_STEP_KEY || stepKey === SECURITY_SETTINGS_STEP_KEY
  );
}

function isLegacyReleaseIntakeScope(
  fieldOverride: Partial<StoredFieldOverrideRow>
) {
  const workflowType = normalizePassword(fieldOverride.workflow_type ?? "");
  const formVersion = normalizePassword(fieldOverride.form_version ?? "");

  const workflowMatches =
    !workflowType || workflowType === LEGACY_EDITOR_WORKFLOW_TYPE;
  const formVersionMatches =
    !formVersion || formVersion === LEGACY_EDITOR_FORM_VERSION;

  return workflowMatches && formVersionMatches;
}

function toStoredFieldOverrideRow(
  row: Partial<StoredFieldOverrideRow>,
  workspaceSlug: string,
  supportsWorkflowScopeColumns: boolean
) {
  return {
    workspace_slug: workspaceSlug,
    ...(supportsWorkflowScopeColumns
      ? {
          workflow_type: row.workflow_type ?? null,
          form_version: row.form_version ?? null,
        }
      : {}),
    step_key: row.step_key ?? "",
    field_key: row.field_key ?? "",
    label_override: normalizeOptionalText(row.label_override),
    helper_text_override: normalizeOptionalText(row.helper_text_override),
    placeholder_override: normalizeOptionalText(row.placeholder_override),
    is_required:
      typeof row.is_required === "boolean" ? row.is_required : null,
    is_visible: typeof row.is_visible === "boolean" ? row.is_visible : true,
    sort_order: typeof row.sort_order === "number" ? row.sort_order : null,
  };
}

function hasMissingWorkflowScopeColumns(error: unknown) {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : "";

  return message.includes(
    "column workspace_field_overrides.workflow_type does not exist"
  ) || message.includes(
    "column workspace_field_overrides.form_version does not exist"
  );
}

async function authorizeWorkspaceEditorAccess(workspaceSlug: string) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      response: NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  const workspaces = await listAccessibleWorkspacesForUser({
    userId: user.id,
    email: user.email ?? null,
    metadataWorkspaceSlug: user.user_metadata?.workspace_slug,
  });

  if (!canAccessWorkspace({ workspaceSlug, workspaces })) {
    return {
      response: NextResponse.json(
        { ok: false, error: "Workspace nao disponivel para este usuario." },
        { status: 403 }
      ),
    };
  }

  return { user };
}

async function loadWorkspaceFieldOverrides(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  workspaceSlug: string
) {
  const scopedResult = await supabase
    .from("workspace_field_overrides")
    .select(FIELD_OVERRIDE_SELECT_WITH_SCOPE)
    .eq("workspace_slug", workspaceSlug)
    .order("step_key", { ascending: true })
    .order("sort_order", { ascending: true });

  if (!scopedResult.error) {
    return {
      rows: scopedResult.data ?? [],
      error: null,
      supportsWorkflowScopeColumns: true,
    };
  }

  if (!hasMissingWorkflowScopeColumns(scopedResult.error)) {
    return {
      rows: null,
      error: scopedResult.error,
      supportsWorkflowScopeColumns: true,
    };
  }

  const legacyResult = await supabase
    .from("workspace_field_overrides")
    .select(FIELD_OVERRIDE_SELECT_LEGACY)
    .eq("workspace_slug", workspaceSlug)
    .order("step_key", { ascending: true })
    .order("sort_order", { ascending: true });

  return {
    rows: legacyResult.data ?? [],
    error: legacyResult.error,
    supportsWorkflowScopeColumns: false,
  };
}

async function loadWorkspaceFieldOverrideSettings(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  workspaceSlug: string
) {
  const scopedResult = await supabase
    .from("workspace_field_overrides")
    .select(FIELD_OVERRIDE_SETTINGS_SELECT_WITH_SCOPE)
    .eq("workspace_slug", workspaceSlug);

  if (!scopedResult.error) {
    return {
      rows: scopedResult.data ?? [],
      error: null,
      supportsWorkflowScopeColumns: true,
    };
  }

  if (!hasMissingWorkflowScopeColumns(scopedResult.error)) {
    return {
      rows: null,
      error: scopedResult.error,
      supportsWorkflowScopeColumns: true,
    };
  }

  const legacyResult = await supabase
    .from("workspace_field_overrides")
    .select(FIELD_OVERRIDE_SETTINGS_SELECT_LEGACY)
    .eq("workspace_slug", workspaceSlug);

  return {
    rows: legacyResult.data ?? [],
    error: legacyResult.error,
    supportsWorkflowScopeColumns: false,
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ workspaceSlug: string }> }
) {
  const { workspaceSlug } = await context.params;
  const access = await authorizeWorkspaceEditorAccess(workspaceSlug);
  if ("response" in access) {
    return access.response;
  }

  const supabase = createSupabaseAdmin();

  const [
    overridesResult,
    { data: branding, error: brandingError },
    { count: submissionsCount },
      { count: draftsCount },
    ] =
    await Promise.all([
      loadWorkspaceFieldOverrides(supabase, workspaceSlug),
      supabase
        .from("workspace_branding")
        .select(
          "workspace_slug, workspace_name, submission_email_enabled"
        )
        .eq("workspace_slug", workspaceSlug)
        .maybeSingle(),
      supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("client_slug", workspaceSlug),
      supabase
        .from("release_intake_drafts")
        .select("draft_token", { count: "exact", head: true })
        .eq("client_slug", workspaceSlug),
    ]);

  if (overridesResult.error) {
    return NextResponse.json(
      {
        ok: false,
        error: overridesResult.error.message,
      },
      { status: 500 }
    );
  }

  if (brandingError) {
    return NextResponse.json(
      {
        ok: false,
        error: brandingError.message,
      },
      { status: 500 }
    );
  }

  const storedPasswordHash =
    overridesResult.rows?.find(
      (override) =>
        override.step_key === SECURITY_SETTINGS_STEP_KEY &&
        override.field_key === EDIT_PASSWORD_FIELD_KEY
    )?.helper_text_override ?? "";

  if (
    typeof storedPasswordHash === "string" &&
    storedPasswordHash &&
    !isPasswordValid(storedPasswordHash, getPasswordHeader(request))
  ) {
    return NextResponse.json(
      {
        ok: false,
        code: "PASSWORD_REQUIRED",
        password_enabled: true,
        error: "Senha do workspace obrigatoria.",
      },
      { status: 403 }
    );
  }

  const storedNotificationEmails = parseStoredEmailList(
    overridesResult.rows?.find(
      (override) =>
        override.step_key === EMAIL_SETTINGS_STEP_KEY &&
        override.field_key === EMAIL_SETTINGS_FIELD_KEY
    )?.helper_text_override
  );

  return NextResponse.json({
    ok: true,
    overrides:
      overridesResult.rows?.filter(
        (override) =>
          !isSettingsOrSecurityStep(override.step_key) &&
          isLegacyReleaseIntakeScope(override)
      ) ?? [],
    email_settings: {
      submission_email_enabled:
        typeof branding?.submission_email_enabled === "boolean"
          ? branding.submission_email_enabled
          : true,
      submission_notification_emails:
        storedNotificationEmails.length > 0
          ? storedNotificationEmails
          : getDefaultNotificationEmails(workspaceSlug),
    },
    security: {
      edit_password_enabled: Boolean(storedPasswordHash),
    },
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
  const { workspaceSlug } = await context.params;
  const access = await authorizeWorkspaceEditorAccess(workspaceSlug);
  if ("response" in access) {
    return access.response;
  }

  const body = (await request.json()) as {
    overrides?: FieldOverrideInput[];
    email_settings?: EmailSettingsInput;
    security?: SecuritySettingsInput;
  };

  if (!Array.isArray(body.overrides)) {
    return NextResponse.json(
      { ok: false, error: "Invalid overrides payload" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();

  const { data: existingBranding, error: brandingLoadError } = await supabase
    .from("workspace_branding")
    .select("workspace_slug, workspace_name")
    .eq("workspace_slug", workspaceSlug)
    .maybeSingle();

  if (brandingLoadError) {
    return NextResponse.json(
      { ok: false, error: brandingLoadError.message },
      { status: 500 }
    );
  }

  const existingSettingsResult = await loadWorkspaceFieldOverrideSettings(
    supabase,
    workspaceSlug
  );

  if (existingSettingsResult.error) {
    return NextResponse.json(
      { ok: false, error: existingSettingsResult.error.message },
      { status: 500 }
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
      ...(existingSettingsResult.supportsWorkflowScopeColumns
        ? {
            workflow_type: LEGACY_EDITOR_WORKFLOW_TYPE,
            form_version: LEGACY_EDITOR_FORM_VERSION,
          }
        : {}),
      step_key: item.step_key,
      field_key: item.field_key,
      label_override: normalizeOptionalText(item.label_override),
      helper_text_override: normalizeOptionalText(item.helper_text_override),
      placeholder_override: normalizeOptionalText(item.placeholder_override),
      is_required:
        typeof item.is_required === "boolean" ? item.is_required : null,
      is_visible: typeof item.is_visible === "boolean" ? item.is_visible : true,
      sort_order:
        typeof item.sort_order === "number" ? item.sort_order : index + 1,
    }));

  const existingPasswordHash =
    existingSettingsResult.rows?.find(
      (row) =>
        row.step_key === SECURITY_SETTINGS_STEP_KEY &&
        row.field_key === EDIT_PASSWORD_FIELD_KEY
    )?.helper_text_override ?? "";

  if (
    typeof existingPasswordHash === "string" &&
    existingPasswordHash &&
    !isPasswordValid(existingPasswordHash, getPasswordHeader(request))
  ) {
    return NextResponse.json(
      {
        ok: false,
        code: "PASSWORD_REQUIRED",
        password_enabled: true,
        error: "Senha do workspace obrigatoria.",
      },
      { status: 403 }
    );
  }

  const security = body.security ?? {};
  const editPasswordEnabled =
    typeof security.edit_password_enabled === "boolean"
      ? security.edit_password_enabled
      : Boolean(existingPasswordHash);
  const nextPassword = normalizePassword(security.edit_password);
  let nextPasswordHash =
    typeof existingPasswordHash === "string" ? existingPasswordHash : "";

  if (editPasswordEnabled) {
    if (nextPassword) {
      nextPasswordHash = hashPassword(nextPassword);
    }

    if (!nextPasswordHash) {
      return NextResponse.json(
        {
          ok: false,
          error: "Defina uma senha para proteger o modo edit.",
        },
        { status: 400 }
      );
    }
  } else {
    nextPasswordHash = "";
  }

  const preservedWorkflowRows = existingSettingsResult.supportsWorkflowScopeColumns
    ? (existingSettingsResult.rows ?? [])
        .filter(
          (row) =>
            !isSettingsOrSecurityStep(row.step_key) &&
            !isLegacyReleaseIntakeScope(row)
        )
        .map((row) =>
          toStoredFieldOverrideRow(
            row,
            workspaceSlug,
            existingSettingsResult.supportsWorkflowScopeColumns
          )
        )
    : [];

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

  const rowsToInsert = [...preservedWorkflowRows, ...sanitizedOverrides];

  if (rowsToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("workspace_field_overrides")
      .insert(rowsToInsert);

    if (insertError) {
      return NextResponse.json(
        { ok: false, error: insertError.message },
        { status: 500 }
      );
    }
  }

  const emailSettings = body.email_settings ?? {};
  const notificationEmails = normalizeEmailList(
    emailSettings.submission_notification_emails
  );
  const submissionEmailEnabled =
    typeof emailSettings.submission_email_enabled === "boolean"
      ? emailSettings.submission_email_enabled
      : true;

  const { error: brandingSaveError } = await supabase
    .from("workspace_branding")
    .upsert(
      {
        workspace_slug: workspaceSlug,
        workspace_name: existingBranding?.workspace_name ?? workspaceSlug,
        submission_email_enabled: submissionEmailEnabled,
      },
      {
        onConflict: "workspace_slug",
      }
    );

  if (brandingSaveError) {
    return NextResponse.json(
      { ok: false, error: brandingSaveError.message },
      { status: 500 }
    );
  }

  if (notificationEmails.length > 0) {
    const { error: settingsInsertError } = await supabase
      .from("workspace_field_overrides")
      .insert({
        workspace_slug: workspaceSlug,
        step_key: EMAIL_SETTINGS_STEP_KEY,
        field_key: EMAIL_SETTINGS_FIELD_KEY,
        helper_text_override: JSON.stringify(notificationEmails),
        is_required: false,
        is_visible: false,
        sort_order: 999999,
      });

    if (settingsInsertError) {
      return NextResponse.json(
        { ok: false, error: settingsInsertError.message },
        { status: 500 }
      );
    }
  }

  if (nextPasswordHash) {
    const { error: passwordInsertError } = await supabase
      .from("workspace_field_overrides")
      .insert({
        workspace_slug: workspaceSlug,
        step_key: SECURITY_SETTINGS_STEP_KEY,
        field_key: EDIT_PASSWORD_FIELD_KEY,
        helper_text_override: nextPasswordHash,
        is_required: false,
        is_visible: false,
        sort_order: 1000000,
      });

    if (passwordInsertError) {
      return NextResponse.json(
        { ok: false, error: passwordInsertError.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    ok: true,
    saved: sanitizedOverrides.length,
    email_settings: {
      submission_email_enabled: submissionEmailEnabled,
      submission_notification_emails: notificationEmails,
    },
    security: {
      edit_password_enabled: Boolean(nextPasswordHash),
    },
  });
}
