import { Suspense } from "react";
import LoginPageClient from "./page-client";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageClient />
    </Suspense>
  );
}

function LoginPageFallback() {
  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-40 rounded bg-white/10" />
          <div className="h-4 w-64 rounded bg-white/10" />
          <div className="h-12 w-full rounded-xl bg-white/10" />
          <div className="h-12 w-full rounded-xl bg-white/10" />
        </div>
      </div>
    </div>
  );
}