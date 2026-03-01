import Section from "./Section";

export default function FeatureGrid() {
  return (
    <Section
      eyebrow="Product"
      title="Everything you need to collect release data properly"
      subtitle="Designed for labels that want consistency, speed, and auditability."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { t: "Premium wizard UX", d: "A guided flow with progress, validations, and review." },
          { t: "Draft-first workflow", d: "Create drafts, iterate safely, and submit only when ready." },
          { t: "Ops-ready output", d: "Structured payload delivered to Airtable instantly." },
          { t: "Client branding", d: "Per-client logo, banner, and custom copy." },
          { t: "Clear traceability", d: "Submission IDs + history for accountability." },
          { t: "Security by design", d: "Server-side proxy + protected client routes." },
        ].map((x) => (
          <div key={x.t} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">{x.t}</div>
            <p className="mt-2 text-sm text-slate-600">{x.d}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}