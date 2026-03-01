import Section from "@/components/marketing/Section";

export default function ContactPage() {
  return (
    <Section
      eyebrow="Contact"
      title="Talk to Sunbeat"
      subtitle="Tell us about your release pipeline and we’ll configure your intake."
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-sm text-slate-600">
        MVP: add a simple email link or a form.
      </div>
    </Section>
  );
}