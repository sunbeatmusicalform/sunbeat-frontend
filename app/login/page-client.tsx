"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

export default function LoginPageClient() {
  const supabase = createSupabaseBrowser();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();

    await supabase.auth.signInWithOtp({
      email,
    });

    setStep("verify");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (!error) {
      router.push("/app");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white/5 border border-white/10 p-8 rounded-xl w-[420px]">

        <h1 className="text-2xl font-semibold mb-6">
          Entrar na Sunbeat
        </h1>

        {step === "request" ? (
          <form onSubmit={sendCode} className="space-y-4">

            <input
              type="email"
              placeholder="voce@email.com"
              className="w-full p-3 rounded bg-black/30"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
            />

            <button className="bg-yellow-400 text-black px-4 py-3 rounded w-full">
              Enviar código
            </button>

          </form>
        ) : (
          <form onSubmit={verifyCode} className="space-y-4">

            <input
              placeholder="Código recebido"
              className="w-full p-3 rounded bg-black/30"
              value={token}
              onChange={(e)=>setToken(e.target.value)}
            />

            <button className="bg-yellow-400 text-black px-4 py-3 rounded w-full">
              Entrar
            </button>

          </form>
        )}

      </div>
    </div>
  );
}