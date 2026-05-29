/**
 * Footer — Warm structured footer
 *
 * Replaces the legacy slate/dark-blue footer.
 * Market-aware: shows domain, currency, language indicator.
 * Removes "Metadata-grade intake for labels" — off-brand.
 */

import Link from "next/link";
import type { Market } from "@/lib/billing/catalog";

interface FooterProps {
  market?: Market;
}

const FOOTER_COPY = {
  global: {
    tagline:
      "Intelligent infrastructure for intake, workflow and operations across creative markets.",
    product: "Product",
    company: "Company",
    legal: "Legal",
    viewingOn: "sunbeat.pro",
    region: "Global · USD · English",
    rights: "All rights reserved.",
  },
  brazil: {
    tagline:
      "Infraestrutura inteligente para intake, workflow e operação em mercados criativos.",
    product: "Produto",
    company: "Empresa",
    legal: "Legal",
    viewingOn: "sunbeat.com.br",
    region: "Brasil · BRL · Português",
    rights: "Todos os direitos reservados.",
  },
};

const PRODUCT_LINKS = {
  global: [
    { label: "How it works", href: "/how-it-works" },
    { label: "Platform", href: "/product" },
    { label: "Integrations", href: "/product#integrations" },
    { label: "Security", href: "/security" },
    { label: "Pricing", href: "/pricing" },
  ],
  brazil: [
    { label: "Como funciona", href: "/how-it-works" },
    { label: "Plataforma", href: "/product" },
    { label: "Integrações", href: "/product#integrations" },
    { label: "Segurança", href: "/security" },
    { label: "Planos", href: "/pricing" },
  ],
};

const COMPANY_LINKS = {
  global: [
    { label: "Contact", href: "/contact" },
    { label: "Login", href: "/login" },
    { label: "Sign up", href: "/signup" },
  ],
  brazil: [
    { label: "Contato", href: "/contact" },
    { label: "Entrar", href: "/login" },
    { label: "Criar conta", href: "/signup" },
  ],
};

const LEGAL_LINKS = [
  { label: "Privacy Policy", labelPt: "Privacidade", href: "/legal/privacy" },
  { label: "Terms of Service", labelPt: "Termos de uso", href: "/legal/terms" },
];

export default function Footer({ market = "global" }: FooterProps) {
  const isBrazil = market === "brazil";
  const c = FOOTER_COPY[market];
  const productLinks = PRODUCT_LINKS[market];
  const companyLinks = COMPANY_LINKS[market];

  return (
    <footer className="border-t border-black/8 bg-[#F4F1EA]">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        {/* Top row */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-black/8 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
                <img
                  src="/sunbeat-logan-transparent-black.ico"
                  alt="Sunbeat"
                  className="h-5 w-5 object-contain"
                />
              </div>
              <span className="text-sm font-semibold uppercase tracking-[0.22em] text-[#111111]">
                Sunbeat
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-6 text-[#7A746A]">
              {c.tagline}
            </p>
            {/* Market indicator */}
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-black/8 bg-white px-3 py-1.5 text-[11px] text-[#8D867B]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#111111]" />
              {c.viewingOn} · {c.region}
            </div>
          </div>

          {/* Product */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9B948D]">
              {c.product}
            </div>
            <ul className="mt-4 flex flex-col gap-2.5">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#5E5A54] hover:text-[#111111] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9B948D]">
              {c.company}
            </div>
            <ul className="mt-4 flex flex-col gap-2.5">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#5E5A54] hover:text-[#111111] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9B948D]">
              {c.legal}
            </div>
            <ul className="mt-4 flex flex-col gap-2.5">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#5E5A54] hover:text-[#111111] transition-colors"
                  >
                    {isBrazil ? link.labelPt : link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-start gap-2 border-t border-black/8 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#9B948D]">
            © {new Date().getFullYear()} Sunbeat. {c.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
