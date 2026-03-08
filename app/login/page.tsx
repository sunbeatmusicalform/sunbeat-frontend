import { Suspense } from "react";
import LoginPageClient from "./page-client";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="sunbeat-shell min-h-screen bg-[#050816]">
          <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12">
            <div className="glass-panel h-72 w-full max-w-xl rounded-[32px]" />
          </div>
        </div>
      }
    >
      <LoginPageClient />
    </Suspense>
  );
}