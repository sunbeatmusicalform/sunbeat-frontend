import { Suspense } from "react";
import { headers } from "next/headers";
import type { Metadata } from "next";
import SignupPageClient from "./page-client";
import { resolveWorkspaceBaseDomain } from "@/lib/tenant";

export async function generateMetadata(): Promise<Metadata> {
  const workspaceDomain = resolveWorkspaceBaseDomain((await headers()).get("host"));
  const isBrazil = workspaceDomain === "sunbeat.com.br";

  return {
    title: isBrazil ? "Criar conta — Sunbeat" : "Create account — Sunbeat",
    description: isBrazil
      ? "Crie seu workspace na Sunbeat e comece a receber lançamentos de forma organizada."
      : "Create your Sunbeat workspace and start receiving releases in one organized flow.",
  };
}

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
