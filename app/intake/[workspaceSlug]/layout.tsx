import type { Metadata } from "next";
import { loadWorkspaceConfigReadModel } from "@/lib/workspace-config/read-model";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://app.sunbeat.co";
const DEFAULT_OG_IMAGE_PATH = "/logo.png";
const ATABAQUE_OG_IMAGE_PATH = "/atabaque-og.png";
const DEFAULT_TITLE = "Formulario de lancamento";
const DEFAULT_DESCRIPTION =
  "Preencha o formulario para iniciar o processo de lancamento musical.";

function resolveImageUrl(imagePath: string) {
  return imagePath.startsWith("/") ? `${SITE_URL}${imagePath}` : imagePath;
}

function getFallbackImagePath(workspaceSlug: string) {
  return workspaceSlug === "atabaque"
    ? ATABAQUE_OG_IMAGE_PATH
    : DEFAULT_OG_IMAGE_PATH;
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
      images: [
        {
          url: args.ogImage,
          width: 1200,
          height: 1200,
          alt: args.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: args.title,
      description: args.description,
      images: [args.ogImage],
    },
  };
}

async function loadPublicExperience(
  workspaceSlug: string
): Promise<
  Awaited<ReturnType<typeof loadWorkspaceConfigReadModel>>["publicExperience"] | null
> {
  try {
    const readModel = await loadWorkspaceConfigReadModel({ workspaceSlug });
    return readModel.publicExperience;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}): Promise<Metadata> {
  const { workspaceSlug } = await params;
  const publicExperience = await loadPublicExperience(workspaceSlug);

  const title =
    publicExperience?.socialTitle ||
    publicExperience?.workspaceName ||
    DEFAULT_TITLE;

  const description =
    publicExperience?.socialDescription ||
    publicExperience?.slogan ||
    DEFAULT_DESCRIPTION;

  const ogImage = resolveImageUrl(
    publicExperience?.socialImageUrl || getFallbackImagePath(workspaceSlug)
  );

  return buildMetadata({ title, description, ogImage });
}

export default function IntakeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
