import GanttDashboard from "@/components/tables/GanttDashboard";
import { resolveWorkspaceSlugFromHeaders } from "@/lib/tenant-resolver";

export default async function GanttPage() {
  const workspaceSlug = await resolveWorkspaceSlugFromHeaders();

  return <GanttDashboard workspaceSlug={workspaceSlug} />;
}
