/**
 * Navbar — Warm editorial header
 *
 * Replaces the legacy dark-blue/slate SaaS header.
 * Removes "Release Intake" subtitle and "Request access" blue button.
 * Used by marketing pages that opt into the shared chrome.
 * The home (MarketingHome.tsx) renders its own inline market-aware header.
 */

import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/8 bg-[#F4F1EA]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
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
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-1 md:flex">
          {[
            { label: "How it works", href: "/how-it-works" },
            { label: "Platform", href: "/product" },
            { label: "Integrations", href: "/product#integrations" },
            { label: "Security", href: "/security" },
            { label: "Pricing", href: "/pricing" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-[#6A6660] hover:bg-black/5 hover:text-[#111111] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTAs */}
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-[#111111] sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex rounded-full bg-[#111111] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1D1D1D] transition-colors"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
