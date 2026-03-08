import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sunbeat — Premium music operations infrastructure",
  description:
    "Sunbeat is premium release metadata infrastructure for labels, distributors, managers and music operations teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}