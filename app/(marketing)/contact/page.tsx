import Link from "next/link";

const accessPillars = [
  "Onboarding sob medida",
  "Configuracao dedicada",
  "Acesso por convite",
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#F6F4EF] text-[#111111]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-black/6" />

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

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#111111] sm:inline-flex"
          >
            Home
          </Link>
          <Link
            href="/login"
            className="inline-flex rounded-full bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Client login
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-20 pt-8 lg:px-8 lg:pt-10">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6A6660]">
              Contact
            </div>

            <h1 className="mt-8 text-[3.1rem] font-semibold leading-[0.92] tracking-[-0.06em] text-[#111111] sm:text-[4.2rem]">
              Let&apos;s configure your Sunbeat access.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-[#5E5A54]">
              O contato da Sunbeat existe para iniciar onboarding, alinhamento
              operacional e configuracao do workspace com clareza e confianca.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {accessPillars.map((item) => (
                <div
                  key={item}
                  className="rounded-full border border-black/8 bg-white px-4 py-2.5 text-sm font-medium text-[#393733]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[36px] border border-black/8 bg-white p-8 shadow-[0_22px_60px_rgba(0,0,0,0.05)] sm:p-10">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-black/8 bg-[#F9F7F2]">
                <img
                  src="/sunbeat-logan-transparent-black.ico"
                  alt="Sunbeat"
                  className="h-8 w-8 object-contain"
                />
              </div>
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.22em] text-[#111111]">
                  Sunbeat
                </div>
                <div className="text-sm text-[#6A6660]">
                  Access, onboarding and intake setup
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-6">
              <div className="rounded-[28px] border border-black/8 bg-[#F9F7F2] p-6">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6A6660]">
                  E-mail
                </div>
                <div className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#111111]">
                  contatofelipefonsek@gmail.com
                </div>
                <p className="mt-3 text-sm leading-7 text-[#5E5A54]">
                  Use este canal para solicitar acesso, apresentar seu contexto
                  operacional e iniciar a configuracao do seu intake com a
                  Sunbeat.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="mailto:contatofelipefonsek@gmail.com?subject=Sunbeat%20Access%20Request"
                  className="inline-flex items-center justify-center rounded-full bg-[#111111] px-6 py-3.5 text-sm font-semibold text-white"
                >
                  Send e-mail
                </a>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-6 py-3.5 text-sm font-semibold text-[#111111]"
                >
                  Client login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
