"use client";

import { useState } from "react";

type FormState = "idle" | "submitting" | "success" | "error";

const roles = [
  { value: "artist", label: "Artista" },
  { value: "label", label: "Label / Distribuidora" },
  { value: "manager", label: "Manager" },
  { value: "company", label: "Empresa / Agência" },
  { value: "other", label: "Outro" },
];

export default function ContactForm() {
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("submitting");
    setError(null);

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      company: (form.elements.namedItem("company") as HTMLInputElement).value,
      role: (form.elements.namedItem("role") as HTMLSelectElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement)
        .value,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Erro ao enviar. Tente novamente.");
      }

      setState("success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[36px] border border-black/8 bg-white p-10 text-center shadow-[0_22px_60px_rgba(0,0,0,0.05)]">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#111111]">
          <svg
            className="h-7 w-7 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="mt-6 text-2xl font-semibold tracking-[-0.04em] text-[#111111]">
          Mensagem recebida
        </h3>
        <p className="mt-3 max-w-sm text-sm leading-7 text-[#5E5A54]">
          Obrigado pelo contato. Vamos revisar seu contexto e retornar em breve
          para iniciar o onboarding.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[36px] border border-black/8 bg-white p-8 shadow-[0_22px_60px_rgba(0,0,0,0.05)] sm:p-10">
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
          <div className="text-sm text-[#5E5A54]">
            Access, onboarding and intake setup
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#4A4744]"
            >
              Nome
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Seu nome"
              className="w-full rounded-2xl border border-black/10 bg-[#F9F7F2] px-4 py-3 text-sm text-[#111111] outline-none placeholder:text-[#9A9590] focus:border-black/30 focus:ring-2 focus:ring-black/5 transition"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#4A4744]"
            >
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="seu@email.com"
              className="w-full rounded-2xl border border-black/10 bg-[#F9F7F2] px-4 py-3 text-sm text-[#111111] outline-none placeholder:text-[#9A9590] focus:border-black/30 focus:ring-2 focus:ring-black/5 transition"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="company"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#4A4744]"
            >
              Empresa / Label{" "}
              <span className="font-normal normal-case tracking-normal text-[#9A9590]">
                (opcional)
              </span>
            </label>
            <input
              id="company"
              name="company"
              type="text"
              placeholder="Nome da empresa ou label"
              className="w-full rounded-2xl border border-black/10 bg-[#F9F7F2] px-4 py-3 text-sm text-[#111111] outline-none placeholder:text-[#9A9590] focus:border-black/30 focus:ring-2 focus:ring-black/5 transition"
            />
          </div>
          <div>
            <label
              htmlFor="role"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#4A4744]"
            >
              Perfil
            </label>
            <select
              id="role"
              name="role"
              required
              defaultValue=""
              className="w-full rounded-2xl border border-black/10 bg-[#F9F7F2] px-4 py-3 text-sm text-[#111111] outline-none focus:border-black/30 focus:ring-2 focus:ring-black/5 transition appearance-none"
            >
              <option value="" disabled>
                Selecione...
              </option>
              {roles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="message"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[#4A4744]"
          >
            Contexto
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={4}
            placeholder="Descreva seu contexto operacional: tipo de conteúdo, volume de lançamentos, ferramentas que você já usa..."
            className="w-full resize-none rounded-2xl border border-black/10 bg-[#F9F7F2] px-4 py-3 text-sm leading-7 text-[#111111] outline-none placeholder:text-[#9A9590] focus:border-black/30 focus:ring-2 focus:ring-black/5 transition"
          />
        </div>

        {state === "error" && error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <button
            type="submit"
            disabled={state === "submitting"}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#111111] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#1D1D1D] disabled:opacity-60"
          >
            {state === "submitting" ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Enviando...
              </>
            ) : (
              "Enviar mensagem"
            )}
          </button>
          <a
            href="mailto:contatofelipefonsek@gmail.com"
            className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-6 py-3.5 text-sm font-semibold text-[#111111] transition hover:bg-[#F9F7F2]"
          >
            Ou envie um e-mail
          </a>
        </div>
      </form>
    </div>
  );
}
