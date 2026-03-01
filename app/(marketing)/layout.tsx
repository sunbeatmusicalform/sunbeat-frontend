import type { ReactNode } from "react";
import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";

export const metadata = {
  title: "Sunbeat — Premium release intake for labels",
  description:
    "Metadata-grade intake for labels. Collect clean release data with validations, versioned drafts, and Airtable delivery.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}