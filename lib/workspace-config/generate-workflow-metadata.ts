import type { Metadata } from "next";
import { loadWorkspaceConfigReadModel } from "@/lib/workspace-config/read-model";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://sunbeat.pro";
const FALLBACK_OG_IMAGE = "/logo.png";

function resolveImageUrl(path: string | null | undefined): string {
  if (!path) return `${SITE_URL}${FALLBACK_OG_IMAGE}`;
  return path.startsWith("/") ? `${SITE_URL}${path}` : path;
}

function buildMetadata(args: {
  title: string;
  description: string;
  ogImage: string;
}): Metadata {
  return {
    title: args.title,
    description: args.description,
    openGraph: {
      title: args.title,
      description: args.description,
      type: "website",
      images: [{ url: args.ogImage, width: 1200, height: 1200, alt: args.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: args.title,
      description: args.description,
      images: [args.ogImage],
    },
  };
}

/**
 * Shared metadata generator for all public workflow form routes.
 *
 * Resolution order:
 *   title:       socialTitle -> "{workspaceName} — {workflowLabel}" -> defaultTitle
 *   description: socialDescription -> slogan -> defaultDescription
 *   image:       socialImageUrl -> logoUrl -> /logo.png
 */
export async function generateWorkflowMetadata(args: {
  workspaceSlug: string;
  workflowLabel: string;
  defaultTitle: string;
  defaultDescription: string;
}): Promise<Metadata> {
  let pe: Awaited<
    ReturnType<typeof loadWorkspaceConfigReadModel>
  >["publicExperience"] | null = null;

  try {
    const readModel = await loadWorkspaceConfigReadModel({
      workspaceSlug: args.workspaceSlug,
    });
    pe = readModel.publicExperience;
  } catch {
    // workspace not found — use pure defaults
  }

  const title =
    pe?.socialTitle ||
    (pe?.workspaceName
      ? `${pe.workspaceName} — ${args.workflowLabel}`
      : args.defaultTitle);

  const description =
    pe?.socialDescription || pe?.slogan || args.defaultDescription;

  const ogImage = resolveImageUrl(pe?.socialImageUrl || pe?.logoUrl);

  return buildMetadata({ title, description, ogImage });
}
