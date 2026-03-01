import Section from "@/components/marketing/Section";

export default function ProductPage() {
  return (
    <Section
      eyebrow="Product"
      title="Release intake, built for operations"
      subtitle="A structured, validated intake that delivers clean metadata to your pipeline."
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-sm text-slate-600">
        Add your product sections here (features, outputs, integrations).
      </div>
    </Section>
  );
}