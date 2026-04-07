import Link from "next/link";

const ecosystem = [
  "Artistas",
  "Labels",
  "Managers",
  "Empresas",
  "Times criativos",
  "Times operacionais",
];

const capabilities = [
  "Intake público sem login",
  "Rascunho para continuar depois",
  "Resumo automático por e-mail",
  "Sincronização com Airtable",
  "Dashboard para ajustar campos e regras do intake",
];

export default function MarketingHome() {
  return (
    <main className="min-h-screen bg-[#F4F1EA] text-[#111111]">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.94),transparent_38%)]" />
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

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#111111] sm:inline-flex"
            >
              Entrar
            </Link>
            <Link
              href="/contact"
              className="inline-flex rounded-full bg-[#111111] px-5 py-2.5 text-sm font-semibold transition hover:bg-[#1D1D1D]"
              style={{ color: '#ffffff' }}
            >
              Contato
            </Link>
          </div>
        </header>

        <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-8 lg:px-8 lg:pb-24 lg:pt-10">
          <div className="grid gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6A6660]">
                <span className="h-2 w-2 rounded-full bg-[#111111]" />
                Infraestrutura para lançamentos
              </div>

              <h1 className="mt-8 max-w-4xl text-[3.4rem] font-semibold leading-[0.9] tracking-[-0.07em] text-[#111111] sm:text-[4.8rem] lg:text-[5.6rem]">
                A base sólida
                <span className="block" style={{ color: "rgba(17,17,17,0.55)" }}>por trás do lançamento.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5E5A54]">
                Cada lançamento carrega um sonho. A Sunbeat existe para dar
                estrutura, direção e processo a esse momento — para que artistas,
                labels e managers possam entregar com clareza e confiança.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full bg-[#111111] px-6 py-3.5 text-sm font-semibold"
                  style={{ color: '#ffffff' }}
                >
                  Fale com a Sunbeat
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-6 py-3.5 text-sm font-semibold text-[#111111]"
                >
                  Entrar
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[40px] border border-black/8 bg-white p-8 shadow-[0_24px_60px_rgba(0,0,0,0.04)] sm:p-10">
                <div className="flex min-h-[420px] items-center justify-center rounded-[30px] border border-black/6 bg-[#FAF8F2] px-8 py-10">
                  <img
                    src="/logo-black-large.png"
                    alt="Sunbeat"
                    className="h-auto w-full max-w-[380px] object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="mx-auto max-w-7xl px-6 pb-8 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[32px] border border-black/8 bg-white px-8 py-8 shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6A6660]">
              Ecossistema
            </div>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[#111111]">
              Para todos os times por trás do lançamento.
            </h2>
            <p className="mt-4 text-base leading-8 text-[#5E5A54]">
              A Sunbeat organiza a entrada de metadados e assets para quem
              precisa operar com clareza — do primeiro envio até a continuidade
              do fluxo interno.
            </p>

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

          <div
            className="rounded-[32px] border border-black/8 px-8 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
            style={{ backgroundColor: "#111111" }}
          >
            <div
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              Funcionalidades
            </div>
            <div className="mt-6 grid gap-3">
              {capabilities.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl px-4 py-3 text-sm leading-6"
                  style={{
                    border: "1px solid rgba(255,255,255,0.10)",
                    backgroundColor: "rgba(255,255,255,0.04)",
                    color: "rgba(255,255,255,0.85)",
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
            <p
              className="mt-6 text-sm leading-7"
              style={{ color: "rgba(255,255,255,0.70)" }}
            >
              Clientes podem editar o intake via dashboard, ajustar campos,
              helper texts e obrigatoriedade — enquanto o formulário público
              continua simples para quem preenche e o time recebe tudo
              organizado no fluxo operacional.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
