"use client";

import { useState } from "react";
import type { Market } from "@/lib/billing/catalog";

// ─── Copy ────────────────────────────────────────────────────────────────────

const FORM_COPY = {
  global: {
    formBadge: "Access, onboarding and intake configuration",
    labelName: "Name",
    placeholderName: "Your name",
    labelEmail: "Email",
    placeholderEmail: "you@company.com",
    labelCompany: "Company / Label",
    optionalHint: "(optional)",
    placeholderCompany: "Company or label name",
    labelRole: "Role",
    placeholderRole: "Select...",
    roles: [
      { value: "artist", label: "Artist" },
      { value: "label", label: "Label / Distributor" },
      { value: "manager", label: "Manager" },
      { value: "company", label: "Company / Agency" },
      { value: "other", label: "Other" },
    ],
    labelMessage: "Context",
    placeholderMessage:
      "Describe your operational context: type of content, volume, tools you already use...",
    submitIdle: "Send message",
    submitBusy: "Sending...",
    errorFallback: "Something went wrong. Please try again.",
    successTitle: "Message received",
    successBody:
      "Thanks for reaching out. We'll review your context and follow up to align next steps.",
  },
  brazil: {
    formBadge: "Acesso, onboarding e configuração do intake",
    labelName: "Nome",
    placeholderName: "Seu nome",
    labelEmail: "E-mail",
    placeholderEmail: "seu@email.com",
    labelCompany: "Empresa / Label",
    optionalHint: "(opcional)",
    placeholderCompany: "Nome da empresa ou label",
    labelRole: "Perfil",
    placeholderRole: "Selecione...",
    roles: [
      { value: "artist", label: "Artista" },
      { value: "label", label: "Label / Distribuidora" },
      { value: "manager", label: "Manager" },
      { value: "company", label: "Empresa / Agência" },
      { value: "other", label: "Outro" },
    ],
    labelMessage: "Contexto",
    placeholderMessage:
      "Descreva seu contexto operacional: tipo de conteúdo, volume de lançamentos, ferramentas que você já usa...",
    submitIdle: "Enviar mensagem",
    submitBusy: "Enviando...",
    errorFallback: "Erro inesperado. Tente novamente.",
    successTitle: "Mensagem recebida",
    successBody:
      "Obrigado pelo contato. Vamos revisar seu contexto e retornar em breve para alinhar os próximos passos.",
  },
};

// ─── Types ───────────────────────────────────────────────────────────────────

type FormState = "idle" | "submitting" | "success" | "error";

// ─── Component ───────────────────────────────────────────────────────────────

export default function ContactForm({ market = "global" }: { market?: Market }) {
  const c = FORM_COPY[market];
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("submitting");
    setError(null);

    const form = e.currentTarget;
    // ── Field names must NOT change — API contract ──
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      company: (form.elements.namedItem("company") as HTMLInputElement).value,
      role: (form.elements.namedItem("role") as HTMLSelectElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || c.errorFallback);
      }

      setState("success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : c.errorFallback);
      setState("error");
    }
  }

  // ── Success state ──
  if (state === "success") {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[36px] border border-black/8 bg-white p-10 text-center shadow-[0_22px_60px_rgba(0,0,0,0.05)]">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#111111]">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            style={{ color: "#ffffff" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="mt-6 text-2xl font-semibold tracking-[-0.04em] text-[#111111]">
          {c.successTitle}
        </h3>
        <p className="mt-3 max-w-sm text-sm leading-7 text-[#5E5A54]">
          {c.successBody}
        </p>
      </div>
    );
  }

  // ── Form ──
  return (
    <div className="rounded-[36px] border border-black/8 bg-white p-8 shadow-[0_22px_60px_rgba(0,0,0,0.05)] sm:p-10">
      {/* Form header */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-black/8 bg-[#F9F7F2]">
          <img
            src="/sunbeat-logan-transparent-black.ico"
            alt="Sunbeat"
            className="h-8 w-8 object-contain"
          />
        </div>
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.22em] text-[#111111]">
            Sunbeat
          </div>
          <div className="text-sm text-[#5E5A54]">{c.formBadge}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {/* Name + Email */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#4A4744]">
              {c.labelName}
            </label>
            <input id="name" name="name" type="text" required
              placeholder={c.placeholderName}
              className="w-full rounded-2xl border border-black/10 bg-[#F9F7F2] px-4 py-3 text-sm text-[#111111] outline-none placeholder:text-[#9A9590] focus:border-black/30 focus:ring-2 focus:ring-black/5 transition" />
          </div>
          <div>
            <label htmlFor="email"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#4A4744]">
              {c.labelEmail}
            </label>
            <input id="email" name="email" type="email" required
              placeholder={c.placeholderEmail}
              className="w-full rounded-2xl border border-black/10 bg-[#F9F7F2] px-4 py-3 text-sm text-[#111111] outline-none placeholder:text-[#9A9590] focus:border-black/30 focus:ring-2 focus:ring-black/5 transition" />
          </div>
        </div>

        {/* Company + Role */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="company"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#4A4744]">
              {c.labelCompany}{" "}
              <span className="font-normal normal-case tracking-normal text-[#9A9590]">
                {c.optionalHint}
              </span>
            </label>
            <input id="company" name="company" type="text"
              placeholder={c.placeholderCompany}
              className="w-full rounded-2xl border border-black/10 bg-[#F9F7F2] px-4 py-3 text-sm text-[#111111] outline-none placeholder:text-[#9A9590] focus:border-black/30 focus:ring-2 focus:ring-black/5 transition" />
          </div>
          <div>
            <label htmlFor="role"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#4A4744]">
              {c.labelRole}
            </label>
            <select id="role" name="role" required defaultValue=""
              className="w-full appearance-none rounded-2xl border border-black/10 bg-[#F9F7F2] px-4 py-3 text-sm text-[#111111] outline-none focus:border-black/30 focus:ring-2 focus:ring-black/5 transition">
              <option value="" disabled>{c.placeholderRole}</option>
              {c.roles.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#4A4744]">
            {c.labelMessage}
          </label>
          <textarea id="message" name="message" required rows={4}
            placeholder={c.placeholderMessage}
            className="w-full resize-none rounded-2xl border border-black/10 bg-[#F9F7F2] px-4 py-3 text-sm leading-7 text-[#111111] outline-none placeholder:text-[#9A9590] focus:border-black/30 focus:ring-2 focus:ring-black/5 transition" />
        </div>

        {/* Error */}
        {state === "error" && error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={state === "submitting"}
            className="inline-flex min-w-[160px] items-center justify-center gap-2 rounded-full bg-[#111111] px-6 py-3.5 text-sm font-semibold !text-white transition hover:bg-[#1D1D1D] disabled:opacity-60"
            style={{ color: "#ffffff" }}
          >
            {state === "submitting" ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="!text-white" style={{ color: "#ffffff" }}>
                  {c.submitBusy}
                </span>
              </>
            ) : (
              <span className="relative z-10 !text-white" style={{ color: "#ffffff" }}>
                {c.submitIdle}
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
