import Hero from "@/components/marketing/Hero";
import LogoCloud from "@/components/marketing/LogoCloud";
import FeatureGrid from "@/components/marketing/FeatureGrid";
import Section from "@/components/marketing/Section";
import FAQ from "@/components/marketing/FAQ";
import CTA from "@/components/marketing/CTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <LogoCloud />
      <FeatureGrid />

      <Section
        eyebrow="How it works"
        title="Four steps. Clean output."
        subtitle="A premium wizard experience your clients will actually enjoy filling out."
      >
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { t: "1) Release", d: "Title, type, dates, label, UPC/EAN." },
            { t: "2) Artists & credits", d: "Main, featured, composers, producers." },
            { t: "3) Tracks", d: "Tracklist, ISRC, explicit, metadata checks." },
            { t: "4) Review & submit", d: "Final review + delivery to Airtable." },
          ].map((x) => (
            <div key={x.t} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-slate-900">{x.t}</div>
              <p className="mt-2 text-sm text-slate-600">{x.d}</p>
            </div>
          ))}
        </div>
      </Section>

      <FAQ />
      <CTA />
    </>
  );
}