import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServer } from "@/lib/supabase/server";
import { listRegisteredWorkflows } from "@/lib/form-engine/workflow-registry";
import { resolveWorkspaceSlugFromHeaders } from "@/lib/tenant-resolver";
import { resolveWorkspaceBaseDomain } from "@/lib/tenant";
import { loadOnboardingData } from "@/lib/server/onboarding-service";
import OnboardingWizard from "./OnboardingWizard";

export const metadata = { title: "Onboarding · Sunbeat" };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ plan_intent?: string }>;
}) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/onboarding");

  const workspaceSlug = await resolveWorkspaceSlugFromHeaders();
  const admin = createSupabaseAdmin();
  const [{ data: membership }, { data: workspace }] = await Promise.all([
    admin
      .from("workspace_users")
      .select("role")
      .eq("workspace_slug", workspaceSlug)
      .eq("user_id", user.id)
      .maybeSingle(),
    admin
      .from("workspaces")
      .select("owner_email")
      .eq("slug", workspaceSlug)
      .maybeSingle(),
  ]);
  const userEmail = String(user.email || "").trim().toLowerCase();
  const ownerEmail = String(workspace?.owner_email || "").trim().toLowerCase();
  const role = String(membership?.role || "").toLowerCase();
  const canConfigure = role === "owner" || role === "admin" || (userEmail && userEmail === ownerEmail);
  if (!canConfigure) redirect("/app?notice=onboarding_owner_required");

  const initialData = await loadOnboardingData(workspaceSlug);
  const host = (await headers()).get("host");
  const locale = resolveWorkspaceBaseDomain(host) === "sunbeat.com.br" ? "pt-BR" : "en";
  const params = await searchParams;
  const planIntent = params.plan_intent === "starter" || params.plan_intent === "pro"
    ? params.plan_intent
    : null;
  const workflows = listRegisteredWorkflows()
    .filter((workflow) => workflow.status === "active")
    .map((workflow) => ({
      workflowType: workflow.workflowType,
      label: workflow.label,
      description: workflow.description,
      allowed: initialData.allowedWorkflowTypes.includes(workflow.workflowType),
    }));

  return (
    <OnboardingWizard
      initialData={initialData}
      workflows={workflows}
      locale={locale}
      planIntent={planIntent}
    />
  );
}
