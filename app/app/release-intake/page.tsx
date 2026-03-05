"use client";

import { useMemo, useState } from "react";

type StepId = 1 | 2 | 3;

function Progress({ step, total }: { step: number; total: number }) {
  const pct = Math.round(((step - 1) / (total - 1)) * 100);
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs text-white/60 mb-2">
        <span>Etapa {step} de {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
        <div className="h-full bg-white/80" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ReleaseIntakePage() {
  const totalSteps = 3;
  const [step, setStep] = useState<StepId>(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    version_title: "",
    artist_name: "",
    contact_email: "",
    primary_genre: "",
    release_date: "",
    territory: "BR",
    notes: "",
  });

  const stepTitle = useMemo(() => {
    if (step === 1) return "Identificação";
    if (step === 2) return "Detalhes do lançamento";
    return "Revisão e envio";
  }, [step]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function validateCurrentStep(): string | null {
    if (step === 1) {
      if (!form.version_title.trim()) return "Informe o título da versão.";
      if (!form.artist_name.trim()) return "Informe o nome do artista.";
      if (!form.contact_email.trim()) return "Informe o e-mail de contato.";
    }
    if (step === 2) {
      if (!form.primary_genre.trim()) return "Informe o gênero principal.";
      if (!form.release_date.trim()) return "Informe a data de lançamento.";
    }
    return null;
  }

  async function next() {
    setError(null);
    const msg = validateCurrentStep();
    if (msg) return setError(msg);
    setStep((s) => (Math.min(totalSteps, s + 1) as StepId));
  }

  function prev() {
    setError(null);
    setStep((s) => (Math.max(1, s - 1) as StepId));
  }

  async function submit() {
    setError(null);
    setDone(null);

    // valida tudo
    const oldStep = step;
    setStep(1);
    const e1 = validateCurrentStep();
    if (e1) { setError(e1); setStep(oldStep); return; }
    setStep(2);
    const e2 = validateCurrentStep();
    if (e2) { setError(e2); setStep(oldStep); return; }
    setStep(oldStep);

    setLoading(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "release_intake",
          payload: form,
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setDone(`Enviado! submission_id: ${data?.submission_id ?? "ok"}`);
    } catch (err: any) {
      setError(err?.message ?? "Falha ao enviar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-xl font-semibold">Release Intake</h1>
            <p className="mt-1 text-sm text-white/60">
              Preencha os dados para liberar o lançamento com segurança.
            </p>
          </div>
          <div className="w-56">
            <Progress step={step} total={totalSteps} />
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-black/40 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium">{stepTitle}</h2>
            <span className="text-xs text-white/50">SUNBEAT • Atabaque (exemplo)</span>
          </div>

          {step === 1 && (
            <div className="mt-4 grid gap-3">
              <input
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                placeholder="Título da versão"
                value={form.version_title}
                onChange={(e) => update("version_title", e.target.value)}
              />
              <input
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                placeholder="Nome do artista"
                value={form.artist_name}
                onChange={(e) => update("artist_name", e.target.value)}
              />
              <input
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                placeholder="E-mail para contato"
                value={form.contact_email}
                onChange={(e) => update("contact_email", e.target.value)}
              />
            </div>
          )}

          {step === 2 && (
            <div className="mt-4 grid gap-3">
              <input
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                placeholder="Gênero principal"
                value={form.primary_genre}
                onChange={(e) => update("primary_genre", e.target.value)}
              />
              <input
                type="date"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                value={form.release_date}
                onChange={(e) => update("release_date", e.target.value)}
              />
              <select
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                value={form.territory}
                onChange={(e) => update("territory", e.target.value)}
              >
                <option value="BR">Brasil</option>
                <option value="GLOBAL">Global</option>
                <option value="LATAM">LatAm</option>
              </select>
            </div>
          )}

          {step === 3 && (
            <div className="mt-4 grid gap-3">
              <textarea
                className="min-h-[120px] w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none"
                placeholder="Notas / orientações"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                <div className="font-medium text-white mb-2">Revisão</div>
                <ul className="space-y-1">
                  <li><b>Título:</b> {form.version_title || "-"}</li>
                  <li><b>Artista:</b> {form.artist_name || "-"}</li>
                  <li><b>Contato:</b> {form.contact_email || "-"}</li>
                  <li><b>Gênero:</b> {form.primary_genre || "-"}</li>
                  <li><b>Data:</b> {form.release_date || "-"}</li>
                  <li><b>Território:</b> {form.territory || "-"}</li>
                </ul>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}
          {done && (
            <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
              {done}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={prev}
              disabled={step === 1 || loading}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm disabled:opacity-40"
            >
              Voltar
            </button>

            {step < totalSteps ? (
              <button
                onClick={next}
                disabled={loading}
                className="rounded-xl bg-white px-5 py-2 text-sm font-medium text-black disabled:opacity-70"
              >
                Próximo
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={loading}
                className="rounded-xl bg-white px-5 py-2 text-sm font-medium text-black disabled:opacity-70"
              >
                {loading ? "Enviando..." : "Enviar"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}