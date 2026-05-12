import Link from "next/link";

export interface LegalDocumentSection {
  heading: string;
  paragraphs: string[];
}

export function LegalDocumentPage({
  eyebrow,
  title,
  summary,
  noticeTitle,
  notice,
  lastUpdatedLabel,
  lastUpdated,
  sections,
  relatedLinks,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  noticeTitle: string;
  notice: string;
  lastUpdatedLabel: string;
  lastUpdated: string;
  sections: LegalDocumentSection[];
  relatedLinks: Array<{ href: string; label: string }>;
}) {
  return (
    <main className="min-h-screen bg-[#F4F1EA] text-[#111111]">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/8 bg-white shadow-[0_10px_24px_rgba(0,0,0,0.04)]">
            <img
              src="/sunbeat-logan-transparent-black.ico"
              alt="Sunbeat"
              className="h-7 w-7 object-contain"
            />
          </div>
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.28em] text-[#111111]">
              Sunbeat
            </div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#6A6660]">
              Public legal information
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#111111] sm:inline-flex"
          >
            Home
          </Link>
          <Link
            href="/contact"
            className="inline-flex rounded-full bg-[#111111] px-5 py-2.5 text-sm font-semibold transition hover:bg-[#1D1D1D]"
            style={{ color: "#ffffff" }}
          >
            Contact
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-20 pt-4 lg:px-8">
        <div className="rounded-[32px] border border-black/8 bg-white p-8 shadow-[0_24px_60px_rgba(0,0,0,0.05)] sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-[#F8F5EF] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6A6660]">
            {eyebrow}
          </div>

          <div className="mt-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-[2.6rem] font-semibold leading-[0.95] tracking-[-0.06em] text-[#111111] sm:text-[3.5rem]">
                {title}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-[#5E5A54]">
                {summary}
              </p>
            </div>
            <div className="rounded-2xl border border-black/8 bg-[#F8F5EF] px-4 py-3 text-sm text-[#5E5A54]">
              <span className="font-semibold text-[#111111]">
                {lastUpdatedLabel}
              </span>{" "}
              {lastUpdated}
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-5 text-sm text-amber-950">
            <div className="font-semibold">{noticeTitle}</div>
            <p className="mt-2 leading-7">{notice}</p>
          </div>

          <div className="mt-8 space-y-5">
            {sections.map((section) => (
              <section
                key={section.heading}
                className="rounded-[28px] border border-black/8 bg-[#FCFBF8] px-6 py-6"
              >
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#111111]">
                  {section.heading}
                </h2>
                <div className="mt-3 space-y-3">
                  {section.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-sm leading-7 text-[#5E5A54]"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-8 rounded-[28px] border border-black/8 bg-[#111111] px-6 py-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
              Related links
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
