import Link from "next/link";

export default function CTA() {
  return (
    <section className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm md:p-14">
          <h3 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            Launch releases with cleaner inputs.
          </h3>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 md:text-base">
            A premium intake flow for your label and clients—validated, versioned,
            and delivered to Airtable.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="rounded-2xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
            >
              Request access
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              See how it works
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}