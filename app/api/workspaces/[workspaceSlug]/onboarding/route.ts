import { NextResponse } from "next/server";
import {
  createSetupAIActionAudit,
  updateSetupAIActionAudit,
} from "@/lib/setup-ai/action-audit";
import { authorizeWorkspaceConfigurator } from "@/lib/server/workspace-config-access";
import {
  applyOnboarding,
  loadOnboardingData,
  previewOnboarding,
} from "@/lib/server/onboarding-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  context: { params: Promise<{ workspaceSlug: string }> }
) {
  const { workspaceSlug: requestedSlug } = await context.params;
  const access = await authorizeWorkspaceConfigurator(requestedSlug);
  if ("response" in access) return access.response;

  try {
    return NextResponse.json({ ok: true, data: await loadOnboardingData(access.workspaceSlug) });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Onboarding indisponível." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ workspaceSlug: string }> }
) {
  const { workspaceSlug: requestedSlug } = await context.params;
  const access = await authorizeWorkspaceConfigurator(requestedSlug);
  if ("response" in access) return access.response;

  let body: { operation?: string; profile?: unknown; preview_token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Payload inválido." }, { status: 400 });
  }

  const operation = body.operation === "preview_patch" || body.operation === "apply_patch"
    ? body.operation
    : null;
  if (!operation) {
    return NextResponse.json({ ok: false, error: "Operação inválida." }, { status: 400 });
  }
  if (operation === "apply_patch" && !body.preview_token?.trim()) {
    return NextResponse.json(
      { ok: false, error: "A confirmação exige uma prévia assinada." },
      { status: 400 }
    );
  }

  const audit = await createSetupAIActionAudit({
    workspaceSlug: access.workspaceSlug,
    workflowType: "__workspace_onboarding__",
    operation,
    status: "requested",
    actionType: "configure_onboarding",
    requestedByUserId: access.user.id,
    requestedByEmail: access.user.email ?? null,
    requestPayload: { operation, profile: body.profile },
    dryRun: operation === "preview_patch",
    confirmed: operation === "apply_patch",
  });

  if (operation === "apply_patch" && !audit.ok) {
    return NextResponse.json(
      { ok: false, error: "A auditoria está indisponível; a aplicação foi bloqueada." },
      { status: 503 }
    );
  }

  try {
    const data = operation === "preview_patch"
      ? await previewOnboarding({
          workspaceSlug: access.workspaceSlug,
          userId: access.user.id,
          profile: body.profile,
        })
      : await applyOnboarding({
          workspaceSlug: access.workspaceSlug,
          userId: access.user.id,
          userEmail: access.user.email ?? null,
          profile: body.profile,
          previewToken: body.preview_token!,
        });

    if (audit.id) {
      await updateSetupAIActionAudit({
        id: audit.id,
        status: "succeeded",
        backendResponse: data,
        dryRun: operation === "preview_patch",
        confirmed: operation === "apply_patch",
      });
    }
    return NextResponse.json({
      ok: true,
      data,
      audit_id: audit.id,
      audit_warning: audit.ok ? null : audit.error,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível configurar o workspace.";
    if (audit.id) {
      await updateSetupAIActionAudit({
        id: audit.id,
        status: "failed",
        errorMessage: message,
        dryRun: operation === "preview_patch",
        confirmed: operation === "apply_patch",
      });
    }
    return NextResponse.json({ ok: false, error: message }, { status: 422 });
  }
}
