import PeopleLinksInbox from "@/components/people-registry/PeopleLinksInbox";
import { resolveWorkspaceSlugFromHeaders } from "@/lib/tenant-resolver";

export default async function PeopleLinksPage() {
  const workspaceSlug = await resolveWorkspaceSlugFromHeaders();

  return <PeopleLinksInbox workspaceSlug={workspaceSlug} />;
}
