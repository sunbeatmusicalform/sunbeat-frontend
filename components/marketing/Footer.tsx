import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">Sunbeat</div>
          <p className="mt-2 text-sm text-slate-600">
            Metadata-grade intake for labels — structured, validated, and ops-ready.
          </p>
        </div>

        <div className="text-sm">
          <div className="font-semibold text-slate-900">Product</div>
          <div className="mt-3 flex flex-col gap-2 text-slate-600">
            <Link href="/product" className="hover:text-slate-900">Overview</Link>
            <Link href="/how-it-works" className="hover:text-slate-900">How it works</Link>
            <Link href="/security" className="hover:text-slate-900">Security</Link>
          </div>
        </div>

        <div className="text-sm">
          <div className="font-semibold text-slate-900">Legal</div>
          <div className="mt-3 flex flex-col gap-2 text-slate-600">
            <Link href="/legal/privacy" className="hover:text-slate-900">Privacy Policy</Link>
            <Link href="/legal/terms" className="hover:text-slate-900">Terms of Service</Link>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Sunbeat. All rights reserved.
      </div>
    </footer>
  );
}