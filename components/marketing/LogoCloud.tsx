export default function LogoCloud() {
  return (
    <section className="border-y border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-center text-xs font-medium text-slate-500">
          Works with your operations stack
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 text-center text-sm text-slate-600 md:grid-cols-6">
          {["Airtable", "Supabase", "DSP-ready", "Versioned", "Validated", "Secure"].map(
            (x) => (
              <div
                key={x}
                className="rounded-2xl border border-slate-200 bg-slate-50 py-3 shadow-sm"
              >
                {x}
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}