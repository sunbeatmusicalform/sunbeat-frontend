import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://sunbeat.pro"),
  title: {
    default: "Sunbeat - intake e operacao para lancamentos musicais",
    template: "%s | Sunbeat",
  },
  description:
    "Sunbeat e a infraestrutura para intake publico, metadata, assets, faixas e operacao de lancamentos para labels e distribuidoras.",
  keywords: [
    "music metadata platform",
    "release intake for labels",
    "airtable music workflow",
    "music operations automation",
    "DSP metadata submission",
    "record label SaaS",
    "music release management",
  ],
  openGraph: {
    title: "Sunbeat - infraestrutura para lancamentos musicais",
    description:
      "Intake publico, drafts, uploads, Supabase e Airtable para a operacao moderna de lancamentos.",
    url: "https://sunbeat.pro",
    siteName: "Sunbeat",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sunbeat - intake para labels e distribuidoras",
    description:
      "Infraestrutura de intake, metadata e operacao para lancamentos musicais.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
