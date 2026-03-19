import Link from "next/link";

const submissions = [
  {
    artist: "Example Artist",
    title: "Midnight Signal",
    type: "Single",
    status: "Rascunho",
    date: "2026-03-02",
  },
  {
    artist: "Solar Pulse",
    title: "Golden Frequencies",
    type: "EP",
    status: "Enviado",
    date: "2026-03-01",
  },
  {
    artist: "Atlas Echo",
    title: "Northern Lights",
    type: "Album",
    status: "Em revisao",
    date: "2026-02-28",
  },
];

export default function SubmissionsPage() {
  return (
    <div className="grid gap-6">
      <section className="rounded-[32px] border border-black/8 bg-white px-7 py-7 shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D867B]">
          Submissoes
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-[#111111]">
          Entradas e rascunhos do workspace.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-[#605A52]">
          Esta area reune os envios recebidos pelo intake publico, junto dos
          rascunhos que ainda estao em andamento. O objetivo aqui e acompanhar
          o fluxo operacional sem excesso visual.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/app/release-intake"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#111111] px-4 text-sm font-semibold text-white"
          >
            Abrir intake
          </Link>
          <Link
            href="/app/settings/fields"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-black/10 bg-[#F8F5EF] px-4 text-sm font-medium text-[#111111]"
          >
            Ajustar campos
          </Link>
        </div>
      </section>

      <section className="rounded-[32px] border border-black/8 bg-white p-4 shadow-[0_18px_48px_rgba(0,0,0,0.04)] sm:p-6">
        <div className="overflow-hidden rounded-[24px] border border-black/8">
          <div className="hidden grid-cols-[1fr_1fr_120px_150px_140px] border-b border-black/8 bg-[#F8F5EF] px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8D867B] md:grid">
            <div>Artista</div>
            <div>Lancamento</div>
            <div>Tipo</div>
            <div>Status</div>
            <div>Data</div>
          </div>

          <div className="grid gap-px bg-black/5 md:block">
            {submissions.map((item) => (
              <article
                key={`${item.artist}-${item.title}`}
                className="bg-white px-5 py-5 md:grid md:grid-cols-[1fr_1fr_120px_150px_140px] md:items-center"
              >
                <div className="md:hidden">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8D867B]">
                    Artista
                  </div>
                  <div className="mt-1 text-sm font-semibold text-[#111111]">
                    {item.artist}
                  </div>
                </div>

                <div className="hidden text-sm font-semibold text-[#111111] md:block">
                  {item.artist}
                </div>

                <div className="mt-4 md:mt-0">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8D867B] md:hidden">
                    Lancamento
                  </div>
                  <div className="mt-1 text-sm text-[#111111]">{item.title}</div>
                </div>

                <div className="mt-4 md:mt-0">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8D867B] md:hidden">
                    Tipo
                  </div>
                  <div className="mt-1 text-sm text-[#605A52]">{item.type}</div>
                </div>

                <div className="mt-4 md:mt-0">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8D867B] md:hidden">
                    Status
                  </div>
                  <div className="mt-1">
                    <span className="inline-flex rounded-full border border-black/8 bg-[#F8F5EF] px-3 py-1 text-xs font-medium text-[#393733]">
                      {item.status}
                    </span>
                  </div>
                </div>

                <div className="mt-4 md:mt-0">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8D867B] md:hidden">
                    Data
                  </div>
                  <div className="mt-1 text-sm text-[#605A52]">{item.date}</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-black/8 bg-white px-7 py-7 shadow-[0_18px_48px_rgba(0,0,0,0.04)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D867B]">
          Proximo passo
        </div>
        <h2 className="mt-3 text-2xl font-semibold text-[#111111]">
          Evoluir esta area para operacao real.
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-[#605A52]">
          A proxima camada natural aqui e transformar esta fila em um painel
          real de acompanhamento, com filtros, status e acesso rapido aos
          detalhes de cada submissao.
        </p>
      </section>
    </div>
  );
}
