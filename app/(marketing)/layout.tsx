import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://sunbeat.pro"),
  title: {
    default: "Sunbeat — Infraestrutura inteligente de intake, workflow e operação",
    template: "%s | Sunbeat",
  },
  description:
    "Sunbeat é uma infraestrutura inteligente de intake, workflow e operação para mercados criativos. Transforme formulários e briefings em execução organizada.",
  keywords: [
    "intake workflow operação mercados criativos",
    "gestão inteligente mercados criativos",
    "music operations platform",
    "release intake for labels",
    "creative workflow management",
    "music release management",
    "record label SaaS",
    "intake workflow automation",
    "creative operations infrastructure",
  ],
  openGraph: {
    title: "Sunbeat — Infraestrutura de intake, workflow e operação",
    description:
      "Transforme formulários, briefing e entrada de demandas em workflow, contexto operacional e execução organizada para equipes criativas.",
    url: "https://sunbeat.pro",
    siteName: "Sunbeat",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sunbeat — Intelligent infrastructure for creative operations",
    description:
      "Turn forms, briefs and incoming work into structured workflows, operational context and scalable execution.",
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
