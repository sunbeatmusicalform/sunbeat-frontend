import { Suspense } from "react";
import { headers } from "next/headers";
import SignupPageClient from "./page-client";
import { resolveWorkspaceBaseDomain } from "@/lib/tenant";

export const metadata = {
  title: "Criar conta — Sunbeat",
  description: "Crie seu workspace na Sunbeat e comece a receber lançamentos de forma organizada.",
};

export default async function SignupPage() {
  const workspaceDomain = resolveWorkspaceBaseDomain(
    (await headers()).get("host")
  );
  const turnstileSiteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || null;
  const signupEnabled =
    process.env.SELF_SERVICE_SIGNUP_ENABLED !== "false";

  return (
    <Suspense>
      <SignupPageClient
        workspaceDomain={workspaceDomain}
        signupEnabled={signupEnabled}
        turnstileSiteKey={turnstileSiteKey}
      />
    </Suspense>
  );
}
