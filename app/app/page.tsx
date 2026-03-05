import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";

export default async function AppHome() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold">Client Area</h1>
        <p className="mt-2 text-white/70 text-sm">
          Logado como <b>{data.user?.email}</b>
        </p>

        <div className="mt-6 flex gap-3">
          <Link className="rounded-xl border border-white/10 px-4 py-3" href="/app/release-intake">
            Abrir Release Intake
          </Link>
          <Link className="rounded-xl border border-white/10 px-4 py-3" href="/app/usage">
            Ver uso
          </Link>
        </div>
      </div>
    </div>
  );
}