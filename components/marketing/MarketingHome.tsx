import Link from "next/link";

const ecosystem = [
  "Artists",
  "Labels",
  "Distributors",
  "Managers",
  "A&R",
  "Producers",
  "Publishers",
  "Creative teams",
];

export default function MarketingHome() {
  return (
    <main className="min-h-screen bg-[#F6F4EF] text-[#111111]">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),transparent_38%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-black/8" />

        <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
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
                Shine Brighter, Work Smarter
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-[#5E5A54] lg:flex">
            <a href="#brand" className="transition hover:text-[#111111]">
              Brand
            </a>
            <a href="#ecosystem" className="transition hover:text-[#111111]">
              Ecosystem
            </a>
            <a href="#positioning" className="transition hover:text-[#111111]">
              Positioning
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#111111] sm:inline-flex"
            >
              Login
            </Link>
            <Link
              href="/contact"
              className="inline-flex rounded-full bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1D1D1D]"
            >
              Contact
            </Link>
          </div>
        </header>

        <section
          id="brand"
          className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-8 lg:px-8 lg:pb-24 lg:pt-10"
        >
          <div className="grid gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5E5A54]">
                <span className="h-2 w-2 rounded-full bg-[#111111]" />
                Operating system for music releases
              </div>

              <h1 className="mt-8 max-w-4xl text-[3.4rem] font-semibold leading-[0.9] tracking-[-0.07em] text-[#111111] sm:text-[4.8rem] lg:text-[6rem]">
                Shine Brighter,
                <span className="block text-[#111111]/78">Work Smarter</span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5E5A54]">
                Sunbeat combina branding elegante, tecnologia e confianca para
                artistas e profissionais que precisam operar lancamentos com mais
                clareza, mais presenca e menos ruido.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full bg-[#111111] px-6 py-3.5 text-sm font-semibold text-white"
                >
                  Talk to Sunbeat
                </Link>
                <Link
                  href="#ecosystem"
                  className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-6 py-3.5 text-sm font-semibold text-[#111111]"
                >
                  Explore ecosystem
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[40px] border border-black/8 bg-white p-8 shadow-[0_24px_60px_rgba(0,0,0,0.04)] sm:p-10">
                <div className="flex min-h-[420px] items-center justify-center rounded-[30px] border border-black/6 bg-[#F9F7F2] px-8 py-10">
                  <img
                    src="/sunbeat-logan-transparent-black.ico"
                    alt="Sunbeat"
                    className="h-auto w-full max-w-[360px] object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section id="ecosystem" className="mx-auto max-w-7xl px-6 pb-8 lg:px-8">
        <div className="rounded-[36px] border border-black/8 bg-white px-8 py-8 shadow-[0_18px_48px_rgba(0,0,0,0.04)] md:px-10 md:py-10">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6A6660]">
              Ecosystem
            </div>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[#111111]">
              Built for the people behind the release.
            </h2>
            <p className="mt-4 text-base leading-8 text-[#5E5A54]">
              Sunbeat existe para fortalecer a relacao entre marca, operacao e
              colaboracao em um ecossistema movido por artistas, times e parceiros.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {ecosystem.map((item) => (
              <div
                key={item}
                className="rounded-full border border-black/8 bg-[#F8F6F1] px-4 py-2.5 text-sm font-medium text-[#393733]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="positioning" className="mx-auto max-w-7xl px-6 pb-20 pt-8 lg:px-8">
        <div className="rounded-[36px] border border-black/8 bg-[#111111] px-8 py-10 text-white shadow-[0_20px_60px_rgba(0,0,0,0.12)] md:px-10">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/56">
              Positioning
            </div>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em]">
              Trusted release infrastructure for a modern music ecosystem.
            </h2>
            <p className="mt-5 text-base leading-8 text-white/72">
              Confiabilidade, tecnologia e presenca de marca em uma estrutura
              desenhada para artistas, labels e profissionais que precisam operar
              melhor.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
