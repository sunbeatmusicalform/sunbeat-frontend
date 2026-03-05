mport type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Release Intake",
  description:
    "Premium release intake for labels: validations, draft mode, edit via email, and upload audio assets up to 100MB.",
};

export default function ReleaseIntakeLanding() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Release Intake</h1>
      <p className="mt-4 text-lg text-slate-600">
        Collect clean release data in minutes — a premium wizard experience with
        draft mode, edit via email, and Airtable-friendly delivery.
      </p>

      <div className="mt-10 rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-semibold">Built for music teams</h2>
        <ul className="mt-3 list-disc pl-5 text-slate-600 space-y-2">
          <li>Metadata validations and tracklist consistency</li>
          <li>Drafts (versioned) + submit review</li>
          <li>Edit mode via email link</li>
          <li>File uploads up to 100MB</li>
        </ul>
      </div>
    </div>
  );
}