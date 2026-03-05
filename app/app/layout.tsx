import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/app" className="font-semibold tracking-wide">
              SUNBEAT
            </Link>
            <span className="text-xs text-white/50">Client Area</span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-white/60">{data.user?.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}