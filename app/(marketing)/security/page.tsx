import Section from "@/components/marketing/Section";

export default function SecurityPage() {
  return (
    <Section
      eyebrow="Security"
      title="Security by design"
      subtitle="Protected routes, server-side proxy, and least-privilege integrations."
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-sm text-slate-600">
        Add security notes (auth, data handling, access control).
      </div>
    </Section>
  );
}