export const metadata = {
  title: "Airtable Music Workflow | Sunbeat",
  description:
    "Airtable-native workflows for music operations: release intake, draft versioning, approvals, and structured delivery for labels.",
};

export default function AirtableMusicWorkflowPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">
        Airtable-native music workflow
      </h1>
      <p className="mt-4 text-lg text-slate-600">
        Sunbeat is built to plug into Airtable operations for labels: clean release intake,
        draft versioning, edit mode via email, and structured delivery to your base.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Airtable-first delivery</h2>
          <p className="mt-2 text-slate-600">
            Every submission becomes structured records in Airtable (projects, tracks, focus track).
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Drafts + edit via email</h2>
          <p className="mt-2 text-slate-600">
            Collect data in steps, save drafts, and allow post-submit edits with secure links.
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Files up to 100MB</h2>
          <p className="mt-2 text-slate-600">
            Upload audio assets, cover, documents — designed for label-grade intake.
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Validation + consistency</h2>
          <p className="mt-2 text-slate-600">
            Reduce back-and-forth with validations, required fields, and guided inputs.
          </p>
        </div>
      </div>
    </div>
  );
}