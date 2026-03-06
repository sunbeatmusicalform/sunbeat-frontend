import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export const metadata: Metadata = {
  metadataBase: new URL("https://sunbeat.pro"),
  title: {
    default: "Sunbeat — Metadata-grade release intake for labels",
    template: "%s | Sunbeat",
  },
  description:
    "Sunbeat is a metadata-grade release intake platform built for record labels. Collect clean release data, validate credits, manage drafts, enable edit-mode via email, and upload audio files up to 100MB with structured Airtable delivery.",
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
    title: "Sunbeat — Metadata-grade release intake for labels",
    description:
      "Structured release intake built for modern music operations. Airtable-native workflows, versioned drafts, edit mode via email and large file uploads.",
    url: "https://sunbeat.pro",
    siteName: "Sunbeat",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sunbeat — Release intake for modern labels",
    description:
      "Airtable-native music metadata intake platform for record labels.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 p-4 flex items-center justify-between">
        <Link href="/app" className="font-semibold">
          Sunbeat
        </Link>

        {user ? <LogoutButton /> : null}
      </header>

      <main className="p-6">{children}</main>
    </div>
  );
}