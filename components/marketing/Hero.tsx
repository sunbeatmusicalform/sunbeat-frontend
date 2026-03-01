import Link from "next/link";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#0B1220]">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
          <span className="h-2 w-2 rounded-full bg-[#FBBF24]" />
          Production-ready • Drafts • Validations • Airtable delivery
        </div>

        <div className="mt-8 grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">
              Metadata-grade intake for labels.
              <span className="block text-slate-300">Built for releases that ship.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
              Collect clean release data in minutes — a premium wizard experience with
              validations, review, and immediate delivery to your operations stack.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="rounded-2xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
              >
                Request access
              </Link>
              <Link
                href="/how-it-works"
                className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                See how it works
              </Link>
            </div>

            <div className="mt-10 grid gap-3 md:grid-cols-3">
              {[
                { k: "Fewer revisions", v: "Validated inputs reduce back-and-forth." },
                { k: "Faster launches", v: "Structured delivery to Airtable / ops." },
                { k: "Premium UX", v: "A flow artists and managers respect." },
              ].map((x) => (
                <div key={x.k} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="text-sm font-semibold text-white">{x.k}</div>
                  <div className="mt-1 text-sm text-slate-300">{x.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Sunbeat" width={44} height={44} />
              <div>
                <div className="text-sm font-semibold text-white">Sunbeat</div>
                <div className="text-xs text-slate-300">Premium intake experience</div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {[
                "Release metadata checklist",
                "Credits and roles validation",
                "Tracklist consistency",
                "Review before submit",
              ].map((x) => (
                <div
                  key={x}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                >
                  {x}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-[#FBBF24]/25 bg-[#FBBF24]/10 p-4 text-xs text-slate-200">
              <span className="font-semibold text-white">Sun (accent)</span>{" "}
              is used sparingly for clarity—badges, indicators, and subtle glow.
            </div>
          </div>
        </div>
      </div>

      {/* subtle glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,0.25),transparent_40%),radial-gradient(circle_at_75%_35%,rgba(251,191,36,0.18),transparent_40%)]" />
    </section>
  );
}