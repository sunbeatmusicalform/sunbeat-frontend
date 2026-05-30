import { headers } from "next/headers";
import { resolveMarket, type Market } from "@/lib/billing/catalog";
import Link from "next/link";
import ContactForm from "./_components/ContactForm";

// ─── Copy ────────────────────────────────────────────────────────────────────

const COPY = {
  global: {
    badge: "Contact",
    headline: "Let's set up your Sunbeat workspace.",
    subtext:
      "Reach out to start onboarding, align on operational setup or ask about what Sunbeat can do for your team.",
    pills: ["Dedicated onboarding", "Workspace configuration", "Invite-only access"],
    features: [
      {
        title: "Direct form, no friction",
        body: "Fill in your context and we receive everything organized.",
      },
      {
        title: "We review and follow up",
        body: "We review your request and get back to you to align next steps.",
      },
      {
        title: "Invite-only access",
        body: "Sunbeat operates with dedicated onboarding and controlled access.",
      },
    ],
    loginLabel: "Log in",
    homeLabel: "Home",
  },
  brazil: {
    badge: "Contato",
    headline: "Vamos configurar seu workspace na Sunbeat.",
    subtext:
      "Entre em contato para iniciar o onboarding, alinhar a configuração operacional ou perguntar sobre o que a Sunbeat pode fazer pelo seu time.",
    pills: ["Onboarding dedicado", "Configuração do workspace", "Acesso por convite"],
    features: [
      {
        title: "Formulário direto, sem burocracia",
        body: "Preencha com seu contexto e recebemos tudo organizado.",
      },
      {
        title: "Revisamos e respondemos",
        body: "Revisamos seu pedido e retornamos para alinhar os próximos passos.",
      },
      {
        title: "Acesso por convite",
        body: "A Sunbeat opera com onboarding dedicado e acesso controlado.",
      },
    ],
    loginLabel: "Entrar",
    homeLabel: "Home",
  },
};

// ─── Icons ───────────────────────────────────────────────────────────────────

function IconCheck() {
  return (
    <svg className="h-4 w-4 text-[#111111]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg className="h-4 w-4 text-[#111111]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg className="h-4 w-4 text-[#111111]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

const featureIcons = [IconCheck, IconClock, IconLock];

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function ContactPage() {
  const host = (await headers()).get("host") ?? "";
  const market: Market = resolveMarket(host);
  const c = COPY[market];

  return (
    <main className="min-h-screen bg-[#F4F1EA] text-[#111111]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-black/6" />

      {/* ── Inline header (contact-specific, market-aware) ── */}
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/8 bg-white shadow-[0_10px_24px_rgba(0,0,0,0.04)]">
            <img
              src="/sunbeat-logan-transparent-black.ico"
              alt="Sunbeat"
              className="h-7 w-7 object-contain"
            />
          </div>
          <div className="text-sm font-semibold uppercase tracking-[0.28em] text-[#111111]">
            Sunbeat
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#111111] sm:inline-flex"
          >
            {c.homeLabel}
          </Link>
          <Link
            href="/login"
            className="inline-flex min-w-[100px] items-center justify-center rounded-full bg-[#111111] px-5 py-2.5 text-sm font-semibold !text-white transition hover:bg-[#1D1D1D]"
            style={{ color: "#ffffff" }}
          >
            <span className="relative z-10 !text-white" style={{ color: "#ffffff" }}>
              {c.loginLabel}
            </span>
          </Link>
        </div>
      </header>

      {/* ── Body ── */}
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-8 lg:px-8 lg:pt-10">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          {/* Left: copy */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#4A4744]">
              {c.badge}
            </div>

            <h1 className="mt-8 text-[3.1rem] font-semibold leading-[0.92] tracking-[-0.06em] text-[#111111] sm:text-[4.2rem]">
              {c.headline}
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-[#5E5A54]">
              {c.subtext}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {c.pills.map((item) => (
                <div
                  key={item}
                  className="rounded-full border border-black/8 bg-white px-4 py-2.5 text-sm font-medium text-[#393733]"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-10 space-y-4">
              {c.features.map((feat, i) => {
                const Icon = featureIcons[i];
                return (
                  <div key={feat.title} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/8 bg-white">
                      <Icon />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#111111]">
                        {feat.title}
                      </div>
                      <div className="mt-0.5 text-sm leading-6 text-[#5E5A54]">
                        {feat.body}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: form */}
          <ContactForm market={market} />
        </div>
      </section>
    </main>
  );
}
