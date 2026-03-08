import Link from "next/link";

const submissions = [
  {
    artist: "Example Artist",
    title: "Midnight Signal",
    type: "Single",
    status: "Draft",
    date: "2026-03-02",
  },
  {
    artist: "Solar Pulse",
    title: "Golden Frequencies",
    type: "EP",
    status: "Submitted",
    date: "2026-03-01",
  },
  {
    artist: "Atlas Echo",
    title: "Northern Lights",
    type: "Album",
    status: "Review",
    date: "2026-02-28",
  },
];

export default function SubmissionsPage() {
  return (
    <div className="grid gap-6">

      <section className="glass-panel-strong premium-border rounded-[32px] p-7">

        <span className="sunbeat-badge">
          <span className="sunbeat-dot" />
          Release Submissions
        </span>

        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-white">
          Incoming releases and drafts
        </h1>

        <p className="mt-4 max-w-2xl text-white/60 leading-8">
          This workspace will centralize all incoming metadata submissions
          created through the Sunbeat Release Intake system.
        </p>

        <div className="mt-6 flex gap-3">
          <Link
            href="/app/release-intake"
            className="sunbeat-button sunbeat-button-primary"
          >
            Open Intake
          </Link>

          <Link
            href="/app/settings/fields"
            className="sunbeat-button sunbeat-button-secondary"
          >
            Configure Fields
          </Link>
        </div>

      </section>


      <section className="sunbeat-card rounded-[32px] p-7">

        <h2 className="text-2xl font-semibold text-white">
          Submission queue
        </h2>

        <div className="mt-6 overflow-hidden rounded-[24px] border border-white/10">

          <div className="grid grid-cols-[1fr_1fr_120px_120px_140px] border-b border-white/10 bg-white/[0.04] px-5 py-4 text-xs uppercase tracking-[0.15em] text-white/45">
            <div>Artist</div>
            <div>Release</div>
            <div>Type</div>
            <div>Status</div>
            <div>Date</div>
          </div>

          {submissions.map((item) => (
            <div
              key={item.title}
              className="grid grid-cols-[1fr_1fr_120px_120px_140px] border-b border-white/10 bg-black/20 px-5 py-5 text-sm last:border-b-0"
            >
              <div className="font-medium text-white/92">{item.artist}</div>
              <div className="text-white/80">{item.title}</div>
              <div className="text-white/60">{item.type}</div>
              <div className="text-white/60">{item.status}</div>
              <div className="text-white/60">{item.date}</div>
            </div>
          ))}

        </div>

      </section>

      <section className="glass-panel rounded-[32px] p-7">

        <h2 className="text-2xl font-semibold text-white">
          Product direction
        </h2>

        <p className="mt-4 max-w-3xl text-white/60 leading-7">
          This area will evolve into the operational dashboard for release intake
          submissions. Teams will be able to review metadata, track drafts,
          validate assets and route releases to downstream systems.
        </p>

      </section>

    </div>
  );
}