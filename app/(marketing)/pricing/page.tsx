import Section from "@/components/marketing/Section";

export default function PricingPage() {
  return (
    <Section
      eyebrow="Pricing"
      title="Request access"
      subtitle="We onboard labels with a premium configuration and per-client branding."
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-sm text-slate-600">
        Add pricing tiers later. For MVP: lead capture / contact.
      </div>
    </Section>
  );
}