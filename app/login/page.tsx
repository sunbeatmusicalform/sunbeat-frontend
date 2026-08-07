import { Suspense } from "react";
import { headers } from "next/headers";
import LoginPageClient from "./page-client";
import { resolveWorkspaceBaseDomain } from "@/lib/tenant";

export default async function LoginPage() {
  const workspaceDomain = resolveWorkspaceBaseDomain(
    (await headers()).get("host")
  );

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
      <LoginPageClient workspaceDomain={workspaceDomain} />
    </Suspense>
  );
}
