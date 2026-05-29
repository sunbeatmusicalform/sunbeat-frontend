import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://sunbeat.pro"),
  title: {
    default: "Sunbeat — Intelligent Infrastructure for Creative Operations",
    template: "%s | Sunbeat",
  },
  description:
    "Intake, workflow and operations infrastructure for creative businesses. Turn forms, briefs and release data into structured execution.",
  keywords: [
    "music operations platform",
    "release intake for labels",
    "creative workflow management",
    "music release management",
    "record label SaaS",
    "intake workflow automation",
    "creative operations infrastructure",
  ],
  openGraph: {
    title: "Sunbeat — Intelligent Infrastructure for Creative Operations",
    description:
      "Turn forms, briefs and incoming work into structured workflows, operational context and scalable execution.",
    url: "https://sunbeat.pro",
    siteName: "Sunbeat",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sunbeat — Intelligent Infrastructure for Creative Operations",
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
