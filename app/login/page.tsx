import { Suspense } from "react";
import LoginPageClient from "./page-client";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F4F1EA] text-[#111111]">
          <div className="mx-auto grid min-h-screen max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[0.98fr_1.02fr] lg:items-center lg:px-8">
            <section className="max-w-2xl">
              <div className="h-12 w-40 animate-pulse rounded-2xl bg-white shadow-[0_10px_24px_rgba(0,0,0,0.04)]" />
              <div className="mt-8 h-9 w-48 animate-pulse rounded-full bg-white" />
              <div className="mt-8 h-28 max-w-xl animate-pulse rounded-[32px] bg-white shadow-[0_14px_34px_rgba(0,0,0,0.04)]" />
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="h-28 animate-pulse rounded-[24px] bg-white shadow-[0_14px_34px_rgba(0,0,0,0.04)]" />
                <div className="h-28 animate-pulse rounded-[24px] bg-white shadow-[0_14px_34px_rgba(0,0,0,0.04)]" />
              </div>
            </section>

            <section className="rounded-[32px] border border-black/8 bg-white p-8 shadow-[0_22px_54px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 animate-pulse rounded-2xl bg-[#F8F5EF]" />
                <div className="space-y-2">
                  <div className="h-4 w-20 animate-pulse rounded bg-[#F4F1EA]" />
                  <div className="h-7 w-48 animate-pulse rounded bg-[#F4F1EA]" />
                </div>
              </div>

              <div className="mt-6 h-12 animate-pulse rounded-2xl bg-[#F8F5EF]" />
              <div className="mt-6 space-y-4">
                <div className="space-y-3">
                  <div className="h-3 w-24 animate-pulse rounded bg-[#F4F1EA]" />
                  <div className="h-12 animate-pulse rounded-2xl bg-[#F8F5EF]" />
                </div>
                <div className="h-12 animate-pulse rounded-2xl bg-[#111111]" />
              </div>
            </section>
          </div>
        </main>
      }
    >
      <LoginPageClient />
    </Suspense>
  );
}
