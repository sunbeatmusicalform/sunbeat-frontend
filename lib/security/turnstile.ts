import "server-only";

type TurnstileVerificationResponse = {
  success: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
};

type VerifyTurnstileArgs = {
  token: string;
  remoteIp?: string | null;
  expectedAction: string;
};

export type TurnstileVerificationResult =
  | { ok: true }
  | { ok: false; reason: "missing_secret" | "invalid_token" | "unavailable" };

export async function verifyTurnstileToken(
  args: VerifyTurnstileArgs
): Promise<TurnstileVerificationResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return { ok: false, reason: "missing_secret" };

  const payload = new URLSearchParams({
    secret,
    response: args.token,
    idempotency_key: crypto.randomUUID(),
  });

  if (args.remoteIp) payload.set("remoteip", args.remoteIp);

  let response: Response;
  try {
    response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: payload,
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      }
    );
  } catch (error) {
    console.error("[turnstile] Siteverify unavailable:", error);
    return { ok: false, reason: "unavailable" };
  }

  if (!response.ok) {
    console.error("[turnstile] Siteverify HTTP error:", response.status);
    return { ok: false, reason: "unavailable" };
  }

  const result = (await response.json()) as TurnstileVerificationResponse;
  const actionMatches =
    !result.action || result.action === args.expectedAction;

  if (!result.success || !actionMatches) {
    console.warn("[turnstile] Verification rejected:", {
      action: result.action ?? null,
      hostname: result.hostname ?? null,
      errorCodes: result["error-codes"] ?? [],
    });
    return { ok: false, reason: "invalid_token" };
  }

  return { ok: true };
}
