import Link from "next/link";

const fieldGroups = [
  {
    name: "Release details",
    description:
      "Core public metadata for release identification, planning and commercial setup.",
    fields: [
      {
        label: "Release Title",
        type: "Text",
        required: true,
        visible: true,
        helper:
          "Use the exact commercial title that should appear in DSPs and internal operations.",
      },
      {
        label: "Main Artist",
        type: "Text",
        required: true,
        visible: true,
        helper:
          "Enter the primary credited artist exactly as it should be delivered.",
      },
      {
        label: "Release Type",
        type: "Select",
        required: true,
        visible: true,
        helper:
          "Choose whether this submission is a single, EP, album or other configured format.",
      },
      {
        label: "Release Date",
        type: "Date",
        required: true,
        visible: true,
        helper:
          "This date can later connect to validations, delivery windows and campaign planning.",
      },
    ],
  },
  {
    name: "Assets and delivery",
    description:
      "Operational assets, file uploads and delivery support information for the release.",
    fields: [
      {
        label: "Cover Artwork",
        type: "Upload",
        required: true,
        visible: true,
        helper:
          "Upload the approved artwork file according to workspace resolution guidelines.",
      },
      {
        label: "Audio Masters",
        type: "Upload",
        required: true,
        visible: true,
        helper:
          "Attach the master files or provide the delivery path defined by the operations team.",
      },
      {
        label: "Focus Track",
        type: "Select",
        required: false,
        visible: true,
        helper:
          "Use this when one track needs extra campaign or playlist attention.",
      },
    ],
  },
  {
    name: "Credits and metadata",
    description:
      "Contributors, identifiers and detailed information required by operations and distribution.",
    fields: [
      {
        label: "Writers",
        type: "Repeater",
        required: false,
        visible: true,
        helper:
          "Add songwriter names exactly as they should appear in credits and downstream systems.",
      },
      {
        label: "ISRC",
        type: "Text",
        required: false,
        visible: true,
        helper:
          "Provide the track code when already assigned, or leave blank if it will be generated later.",
      },
      {
        label: "UPC / EAN",
        type: "Text",
        required: false,
        visible: true,
        helper:
          "This may be optional depending on whether the workspace generates product codes internally.",
      },
    ],
  },
];

const configurationCapabilities = [
  "Change field labels and descriptions",
  "Define helped text per field",
  "Toggle field visibility",
  "Set required vs optional rules",
  "Control group and field order",
  "Add future conditional logic",
];

export default function FieldSettingsPage() {
  return (
    <div className="grid gap-6">
      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="glass-panel-strong premium-border rounded-[32px] p-7 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="sunbeat-badge">
              <span className="sunbeat-dot" />
              Field Configuration
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/50">
              Configurable workspace layer
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
            Configure the form,
            <span className="block text-white/68">not just the frontend.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-white/62">
            This area should become the control center for the public Release Intake
            structure. Each client workspace can define how fields behave, what users
            see and how the form guides completion.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <MetricCard value="Labels" label="can shape their intake" />
            <MetricCard value="Helped" label="text per field" />
            <MetricCard value="Smart" label="future logic ready" />
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/app/release-intake" className="sunbeat-button sunbeat-button-primary">
              Preview intake
            </Link>
            <Link href="/app/settings/ai-guide" className="sunbeat-button sunbeat-button-secondary">
              Open AI guide
            </Link>
          </div>
        </div>

        <div className="sunbeat-card rounded-[32px] p-7 md:p-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
            Product principle
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            Shine Brighter, Work Smarter.
          </h2>

          <div className="mt-5 grid gap-3">
            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-semibold text-white">Shine Brighter</div>
              <p className="mt-2 text-sm leading-7 text-white/55">
                Better labels, smarter helpers and cleaner structure make the form feel premium.
              </p>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-semibold text-white">Work Smarter</div>
              <p className="mt-2 text-sm leading-7 text-white/55">
                Configurability reduces manual rework, duplicated explanations and intake mistakes.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-blue-400/20 bg-blue-400/10 p-4">
            <div className="text-sm font-semibold text-blue-100">Core architecture idea</div>
            <p className="mt-2 text-sm leading-7 text-blue-100/80">
              Field configuration should be stored as structured schema, not hardcoded JSX only.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="sunbeat-card rounded-[32px] p-7">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
            Configuration surface
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            What each workspace should control
          </h2>

          <div className="mt-6 grid gap-3">
            {configurationCapabilities.map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/78"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-[32px] p-7">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
            Recommended data model
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            Suggested schema direction
          </h2>

          <div className="mt-6 space-y-3">
            {[
              "field_groups",
              "field_definitions",
              "field_order",
              "field_visibility_rules",
              "field_helper_text",
              "field_validation_rules",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-4 font-mono text-sm text-white/80"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[24px] border border-yellow-300/20 bg-yellow-300/8 p-4 text-sm leading-7 text-yellow-100/85">
            This part is strategic: when field behavior lives in data, the product becomes
            truly reusable for multiple labels and workflows.
          </div>
        </div>
      </section>

      {fieldGroups.map((group) => (
        <section key={group.name}>
          <div className="sunbeat-card rounded-[32px] p-7">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                  Field group
                </div>
                <h2 className="mt-3 text-2xl font-semibold text-white">{group.name}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/58">
                  {group.description}
                </p>
              </div>

              <button className="sunbeat-button sunbeat-button-secondary">
                Add field
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              {group.fields.map((field) => (
                <div
                  key={field.label}
                  className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-lg font-semibold text-white">{field.label}</div>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                          {field.type}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs ${
                            field.required
                              ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                              : "border border-white/10 bg-white/5 text-white/60"
                          }`}
                        >
                          {field.required ? "Required" : "Optional"}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs ${
                            field.visible
                              ? "border border-blue-400/20 bg-blue-400/10 text-blue-100"
                              : "border border-white/10 bg-white/5 text-white/60"
                          }`}
                        >
                          {field.visible ? "Visible" : "Hidden"}
                        </span>
                      </div>

                      <p className="mt-4 max-w-3xl text-sm leading-7 text-white/56">
                        {field.helper}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button className="sunbeat-button sunbeat-button-secondary">
                        Edit
                      </button>
                      <button className="sunbeat-button rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/8">
                        Duplicate
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section>
        <div className="glass-panel rounded-[32px] p-7 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                Next implementation layer
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                Connect this screen to real schema storage.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
                The visual direction is now ready. The next backend move is persisting field
                groups, helper texts, order and visibility rules so the intake form can render
                dynamically from workspace configuration.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/app/settings/branding"
                className="sunbeat-button sunbeat-button-primary"
              >
                Open branding
              </Link>
              <Link
                href="/app/release-intake"
                className="sunbeat-button sunbeat-button-secondary"
              >
                Back to intake
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm text-white/55">{label}</div>
    </div>
  );
}