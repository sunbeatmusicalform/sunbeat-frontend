import { NextResponse } from "next/server";

import { createSupabaseServer } from "@/lib/supabase/server";
import {
  choosePreferredWorkspace,
  listAccessibleWorkspacesForUser,
} from "@/lib/workspace-access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const workspaces = await listAccessibleWorkspacesForUser({
      userId: user.id,
      email: user.email ?? null,
      metadataWorkspaceSlug: user.user_metadata?.workspace_slug,
    });
    const preferredWorkspace = choosePreferredWorkspace({
      workspaces,
      preferredSlugs: [user.user_metadata?.workspace_slug],
    });

    return NextResponse.json(
      {
        ok: true,
        workspaces,
        preferred_workspace_slug: preferredWorkspace?.slug ?? null,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not load user workspaces",
      },
      { status: 500 }
    );
  }
}
