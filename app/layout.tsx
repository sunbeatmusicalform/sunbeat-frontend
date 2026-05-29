import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { resolveMarket } from "@/lib/billing/catalog";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sunbeat — Intelligent Infrastructure for Creative Operations",
  description:
    "Intake, workflow and operations infrastructure for creative businesses. Turn forms, briefs and release data into structured execution.",
};

export const viewport: Viewport = {
  themeColor: "#F4F1EA",
  colorScheme: "light",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const host = (await headers()).get("host") ?? "";
  const market = resolveMarket(host);
  const lang = market === "brazil" ? "pt-BR" : "en";

  return (
    <html
      lang={lang}
      suppressHydrationWarning
      style={{ colorScheme: "light" }}
    >
      <body>{children}</body>
    </html>
  );
}
