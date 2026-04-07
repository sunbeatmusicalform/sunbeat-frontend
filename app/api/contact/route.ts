import { NextResponse } from "next/server";

const CONTACT_NOTIFICATION_EMAIL = "contatofelipefonsek@gmail.com";

const ROLE_LABELS: Record<string, string> = {
  artist: "Artista",
  label: "Label / Distribuidora",
  manager: "Manager",
  company: "Empresa / Agência",
  other: "Outro",
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(req: Request) {
  let body: {
    name?: string;
    email?: string;
    company?: string;
    role?: string;
    message?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Corpo da requisição inválido." },
      { status: 400 }
    );
  }

  if (!body.name?.trim() || !body.email?.trim() || !body.message?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Campos obrigatórios ausentes." },
      { status: 422 }
    );
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail =
    process.env.RESEND_FROM_EMAIL || "Sunbeat <contato@sunbeat.pro>";

  if (!resendApiKey) {
    console.error("RESEND_API_KEY is not set");
    return NextResponse.json(
      { ok: false, error: "Serviço de e-mail não configurado." },
      { status: 500 }
    );
  }

  const safeName = escapeHtml(body.name.trim());
  const safeEmail = escapeHtml(body.email.trim());
  const safeCompany = body.company?.trim()
    ? escapeHtml(body.company.trim())
    : "—";
  const safeRole = escapeHtml(
    ROLE_LABELS[body.role ?? ""] || body.role || "Não informado"
  );
  const safeMessage = escapeHtml(body.message.trim()).replace(/\n/g, "<br>");

  const html = `
    <div style="background-color: #f9fafb; padding: 32px 16px; font-family: Arial, sans-serif;">
      <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; padding: 32px; line-height: 1.7; color: #111827;">
        <p>Nova solicitação de acesso recebida via sunbeat.pro/contact.</p>

        <table style="border-collapse: collapse; width: 100%; margin: 24px 0;">
          <tbody>
            <tr>
              <td style="padding: 8px 12px 8px 0; color: #374151; font-weight: 600; white-space: nowrap; vertical-align: top;">Nome</td>
              <td style="padding: 8px 0;"><strong>${safeName}</strong></td>
            </tr>
            <tr>
              <td style="padding: 8px 12px 8px 0; color: #374151; font-weight: 600; white-space: nowrap; vertical-align: top;">E-mail</td>
              <td style="padding: 8px 0;">
                <a href="mailto:${safeEmail}" style="color: #1d4ed8; text-decoration: none;">${safeEmail}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 12px 8px 0; color: #374151; font-weight: 600; white-space: nowrap; vertical-align: top;">Empresa / Label</td>
              <td style="padding: 8px 0;">${safeCompany}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px 8px 0; color: #374151; font-weight: 600; white-space: nowrap; vertical-align: top;">Perfil</td>
              <td style="padding: 8px 0;">${safeRole}</td>
            </tr>
          </tbody>
        </table>

        <p style="margin-bottom: 8px; font-weight: 600;">Contexto</p>
        <p style="margin-top: 0; padding: 16px; background: #f9fafb; border-radius: 8px; border-left: 3px solid #111827;">
          ${safeMessage}
        </p>

        <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #6b7280; text-align: center;">
          Sunbeat &mdash; Infraestrutura para Lançamentos Musicais
        </p>
      </div>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: [CONTACT_NOTIFICATION_EMAIL],
        subject: `Sunbeat — Novo contato de ${body.name.trim()}`,
        html,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error("Resend error status=%s body=%o", res.status, errData);
      return NextResponse.json(
        { ok: false, error: "Erro ao enviar. Tente novamente em instantes." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact send error:", err);
    return NextResponse.json(
      { ok: false, error: "Erro de conexão ao enviar e-mail." },
      { status: 502 }
    );
  }
}
