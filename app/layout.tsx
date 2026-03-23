import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sunbeat | Infraestrutura para Lançamentos Musicais",
  description:
    "Sunbeat organiza intake, metadata, faixas, assets e operação para labels, distribuidoras e times de release.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}