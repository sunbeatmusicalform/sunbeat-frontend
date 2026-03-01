import Section from "./Section";

export default function FAQ() {
  return (
    <Section
      eyebrow="FAQ"
      title="Questions, answered"
      subtitle="Short and direct—like a good ops pipeline."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {[
          {
            q: "Can clients submit without talking to the ops team?",
            a: "Yes. The wizard collects structured data and delivers it to your Airtable base.",
          },
          {
            q: "Is this built for global releases?",
            a: "Yes. Multi-locale copy and client branding are supported from day one.",
          },
          {
            q: "Do you store masters and assets?",
            a: "Not in the MVP. Intake focuses on metadata; storage can be added later.",
          },
          {
            q: "How do you handle security?",
            a: "Protected client routes, server-side proxy, and least-privilege API access.",
          },
        ].map((x) => (
          <div key={x.q} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">{x.q}</div>
            <p className="mt-2 text-sm text-slate-600">{x.a}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}