import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sunbeat | Infraestrutura para Lançamentos Musicais",
  description:
    "Sunbeat organiza intake, metadata, faixas, assets e operação para labels, distribuidoras e times de release.",
};

export const viewport: Viewport = {
  themeColor: "#F4F1EA",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      style={{ colorScheme: "light" }}
    >
      <body>{children}</body>
    </html>
  );
}
