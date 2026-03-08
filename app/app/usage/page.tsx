const metrics = [
  {
    label: "Active Workspaces",
    value: "1",
  },
  {
    label: "Release Submissions",
    value: "3",
  },
  {
    label: "Draft Sessions",
    value: "2",
  },
  {
    label: "AI Guidance Calls",
    value: "0",
  },
];

export default function UsagePage() {
  return (
    <div className="grid gap-6">

      <section className="glass-panel-strong premium-border rounded-[32px] p-7">

        <span className="sunbeat-badge">
          <span className="sunbeat-dot" />
          Platform Usage
        </span>

        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-white">
          Workspace activity
        </h1>

        <p className="mt-4 max-w-2xl text-white/60 leading-8">
          This dashboard will provide visibility into submissions, workspace activity
          and operational signals across the Sunbeat platform.
        </p>

      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        {metrics.map((item) => (
          <div
            key={item.label}
            className="sunbeat-card rounded-[28px] p-6"
          >
            <div className="text-3xl font-semibold text-white">
              {item.value}
            </div>

            <div className="mt-2 text-sm text-white/55">
              {item.label}
            </div>
          </div>
        ))}

      </section>

      <section className="sunbeat-card rounded-[32px] p-7">

        <h2 className="text-2xl font-semibold text-white">
          Future analytics layer
        </h2>

        <p className="mt-4 max-w-3xl text-white/60 leading-7">
          Sunbeat will provide analytics for intake performance,
          submission volume, validation errors and operational throughput.
        </p>

        <div className="mt-6 grid gap-3">

          {[
            "Submission conversion rate",
            "Average completion time",
            "Metadata error frequency",
            "AI assistance usage",
            "Label workspace activity",
          ].map((item) => (
            <div
              key={item}
              className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white/78"
            >
              {item}
            </div>
          ))}

        </div>

      </section>

    </div>
  );
}