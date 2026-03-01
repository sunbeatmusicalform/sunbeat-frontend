import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Sunbeat" width={34} height={34} priority />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-900">Sunbeat</div>
            <div className="text-xs text-slate-500">Release Intake</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link className="text-slate-600 hover:text-slate-900" href="/product">
            Product
          </Link>
          <Link className="text-slate-600 hover:text-slate-900" href="/how-it-works">
            How it works
          </Link>
          <Link className="text-slate-600 hover:text-slate-900" href="/security">
            Security
          </Link>
          <Link className="text-slate-600 hover:text-slate-900" href="/pricing">
            Pricing
          </Link>
          <Link className="text-slate-600 hover:text-slate-900" href="/contact">
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Client login
          </Link>

          <Link
            href="/contact"
            className="rounded-xl bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
          >
            Request access
          </Link>
        </div>
      </div>
    </header>
  );
}