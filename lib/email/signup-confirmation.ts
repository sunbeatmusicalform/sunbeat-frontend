import "server-only";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendSignupConfirmationEmail(args: {
  email: string;
  name: string;
  workspaceName: string;
  confirmationUrl: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.RESEND_AUTH_FROM_EMAIL?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    return { ok: false as const, reason: "missing_configuration" as const };
  }

  const safeName = escapeHtml(args.name);
  const safeWorkspaceName = escapeHtml(args.workspaceName);
  const safeConfirmationUrl = escapeHtml(args.confirmationUrl);

  const html = `
    <div style="background:#f4f1ea;padding:32px 16px;font-family:Arial,sans-serif;color:#111111">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e8e3da;border-radius:24px;padding:36px">
        <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:.2em;text-transform:uppercase">Sunbeat</p>
        <h1 style="margin:0;font-size:28px;line-height:1.2">Confirme seu e-mail</h1>
        <p style="margin:20px 0 0;line-height:1.7;color:#5f5a53">Olá, ${safeName}. Confirme seu e-mail para ativar o workspace <strong>${safeWorkspaceName}</strong>.</p>
        <a href="${safeConfirmationUrl}" style="display:inline-block;margin-top:28px;background:#111111;color:#ffffff;text-decoration:none;border-radius:999px;padding:14px 22px;font-weight:700">Confirmar e acessar workspace</a>
        <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#8d867b">Se você não solicitou esta conta, ignore este e-mail. O link é individual e expira conforme a política de autenticação da Sunbeat.</p>
      </div>
    </div>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [args.email],
        subject: "Confirme seu e-mail — Sunbeat",
        html,
      }),
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      console.error("[auth/signup] Resend rejected confirmation email:", {
        status: response.status,
        details,
      });
      return { ok: false as const, reason: "provider_error" as const };
    }

    return { ok: true as const };
  } catch (error) {
    console.error("[auth/signup] Confirmation email unavailable:", error);
    return { ok: false as const, reason: "provider_error" as const };
  }
}
