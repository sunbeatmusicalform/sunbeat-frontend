import { NextResponse } from "next/server";
import { loadWorkspaceConfigReadModel } from "@/lib/workspace-config/read-model";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: Request,
  context: { params: Promise<{ workspaceSlug: string }> }
) {
  const { workspaceSlug } = await context.params;
  const url = new URL(req.url);

  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    const data = await loadWorkspaceConfigReadModel({
      workspaceSlug,
      workflowType: url.searchParams.get("workflow_type"),
      formVersion: url.searchParams.get("form_version"),
    });

    return NextResponse.json(
      {
        ok: true,
        data,
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
            : "Could not load workspace config read model",
      },
      {
        status: 500,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }
}
